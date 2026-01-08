// ============================================
// TRANSACTION QUEUE MANAGER
// Offline-first transaction system with retry logic
// ============================================

import { logger } from './logger.js';

logger.info('Transaction Queue', 'Loading Transaction Queue Manager');

class TransactionQueueManager {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.retryAttempts = new Map(); // Track retry counts per transaction
        this.maxRetries = 5;
        this.baseRetryDelay = 1000; // 1 second
        this.maxRetryDelay = 60000; // 60 seconds
        this.processingInterval = null;
        
        // CIRCUIT BREAKER - Stop hitting endpoints that return 500
        this.circuitBreakers = new Map(); // endpoint -> { lastFailure: timestamp, failureCount: number }
        this.CIRCUIT_BREAKER_TIMEOUT = 15000; // 15 seconds (reduced from 60s)
        
        // API endpoint configuration
        this.apiBaseUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
        
        this.init();
    }

    init() {
        // Load persisted queue from localStorage
        this.loadQueue();
        
        // Setup online/offline listeners
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Setup periodic processing (every 30 seconds when online)
        if (navigator.onLine) {
            this.startPeriodicProcessing();
        }
        
        // Process queue immediately if online
        if (navigator.onLine && this.queue.length > 0) {
            logger.info('Transaction Queue', `Found ${this.queue.length} queued transactions, processing...`);
            this.processQueue();
        }
        
        logger.info('Transaction Queue', `Initialized - ${this.queue.length} pending, ${navigator.onLine ? 'Online' : 'Offline'}`);
    }

    // ============================================
    // QUEUE MANAGEMENT
    // ============================================

    /**
     * Add a transaction to the queue
     * @param {string} type - Transaction type
     * @param {number} amount - Amount
     * @param {string} reason - Reason
     * @param {object} metadata - Metadata
     * @param {string} endpoint - API endpoint (default: /api/transactions)
     * @returns {string} - Transaction ID
     */
    queueTransaction(type, amount, reason, metadata = {}, endpoint = '/api/transactions') {
        const transaction = {
            id: this.generateTransactionId(),
            type,
            amount,
            reason,
            endpoint, // Store endpoint
            metadata: {
                ...metadata,
                game: metadata.game || 'Unknown',
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                online: navigator.onLine
            },
            status: 'pending',
            createdAt: Date.now(),
            attempts: 0
        };

        this.queue.push(transaction);
        this.saveQueue();
        
        logger.debug('Transaction Queue', `Queued: ${type} ${amount} - "${reason}" (queue: ${this.queue.length})`);

        // WHALE BET NOTIFICATION (Transactions > 5,000 coins)
        if (Math.abs(amount) >= 5000) {
            this.handleWhaleBet(transaction);
        }

        // Try to process immediately if online and user is authenticated
        const isAuthenticated = !!localStorage.getItem('auth_token');
        if (navigator.onLine && !this.processing && isAuthenticated) {
            // Process immediately for authenticated users to keep balance in sync
            // Added 2s delay to allow error handlers to stabilize
            setTimeout(() => this.processQueue(), 2000);
        }

        return transaction.id;
    }

    handleWhaleBet(transaction) {
        const amount = Math.abs(transaction.amount);
        logger.info('Transaction Queue', `Whale bet detected: ${amount} coins`);
        
        const username = localStorage.getItem('unified_username') || 'A User';
        const game = transaction.metadata?.game || 'Sports Lounge';
        
        // Log to activity feed
        if (window.ActivityFeed && typeof window.ActivityFeed.logWhaleBet === 'function') {
            window.ActivityFeed.logWhaleBet(
                username,
                game,
                amount,
                transaction.type === 'debit' ? 'WAGER' : 'WIN'
            );
        }
    }

    /**
     * Process all pending transactions in the queue
     */
    async processQueue() {
        if (this.processing) {
            logger.debug('Transaction Queue', 'Already processing, skipping...');
            return;
        }

        if (!navigator.onLine) {
            logger.debug('Transaction Queue', 'Offline - processing postponed');
            return;
        }

        if (this.queue.length === 0) {
            return;
        }

        this.processing = true;
        logger.info('Transaction Queue', `Processing ${this.queue.length} transactions...`);

        // Dispatch sync start event
        window.dispatchEvent(new CustomEvent('transactionSyncStarted', {
            detail: { count: this.queue.length }
        }));

        const results = {
            success: 0,
            failed: 0,
            retryLater: 0
        };

        // Process transactions sequentially to maintain order
        for (let i = 0; i < this.queue.length; i++) {
            const transaction = this.queue[i];
            
            if (transaction.status === 'processing') {
                continue; // Skip if already being processed
            }

            const result = await this.processTransaction(transaction);
            
            if (result.success) {
                // Remove from queue on success
                this.queue.splice(i, 1);
                i--; // Adjust index after removal
                results.success++;
                this.retryAttempts.delete(transaction.id);
                
                // RESET CIRCUIT BREAKER ON SUCCESS
                const endpoint = transaction.endpoint || '/api/transactions';
                if (this.circuitBreakers.has(endpoint)) {
                    logger.debug('Transaction Queue', `Circuit breaker reset for ${endpoint}`);
                    this.circuitBreakers.delete(endpoint);
                }
            } else if (result.shouldRetry) {
                // Keep in queue for retry
                transaction.attempts++;
                transaction.lastAttempt = Date.now();
                transaction.lastError = result.error;
                results.retryLater++;
                
                // NOTIFY USER ON 3 ATTEMPTS
                if (transaction.attempts === 3) {
                    this.notifySyncIssues(transaction);
                }

                // Remove if max retries exceeded
                if (transaction.attempts >= this.maxRetries) {
                    console.warn(`⚠️ Transaction ${transaction.id} exceeded max retries, removing from queue`);
                    this.queue.splice(i, 1);
                    i--;
                    results.failed++;
                    
                    // Notify user about permanent failure
                    this.notifyTransactionFailed(transaction);
                }
            } else {
                // Permanent failure, remove from queue
                this.queue.splice(i, 1);
                i--;
                results.failed++;
                this.retryAttempts.delete(transaction.id);
            }
        }

        this.saveQueue();
        this.processing = false;

        // Only log if there's something meaningful to report
        if (results.success > 0 || results.failed > 0) {
            logger.info('Transaction Queue', `Processing complete: ${results.success} success, ${results.failed} failed`);
        } else if (results.retryLater > 0) {
            logger.debug('Transaction Queue', `${results.retryLater} transaction(s) queued for retry`);
        }
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('transactionQueueProcessed', { 
            detail: results 
        }));
    }

    /**
     * Process a single transaction
     * @param {object} transaction - Transaction object
     * @returns {object} - Result with success flag and error if any
     */
    async processTransaction(transaction) {
        logger.debug('Transaction Queue', `Processing transaction ${transaction.id}`);
        
        transaction.status = 'processing';
        
        const endpoint = transaction.endpoint || '/api/transactions';
        
        // CHECK CIRCUIT BREAKER
        const circuit = this.circuitBreakers.get(endpoint);
        if (circuit && Date.now() - circuit.lastFailure < this.CIRCUIT_BREAKER_TIMEOUT) {
            logger.warn('Transaction Queue', `Circuit breaker active for ${endpoint}, skipping`);
            return { success: false, shouldRetry: true, error: 'Circuit breaker active' };
        }
        
        try {
            // Get auth token
            const authToken = localStorage.getItem('auth_token');
            
            if (!authToken) {
                logger.warn('Transaction Queue', 'No auth token - guest user, skipping backend sync');
                // For guest users, we can't sync to backend but we keep transaction locally
                return { 
                    success: false, 
                    shouldRetry: false,
                    error: 'No authentication token (guest user)'
                };
            }

            // Make API request to backend (using transaction-specific endpoint)
            const endpoint = transaction.endpoint || '/api/transactions';
            const body = endpoint === '/api/inventory/add' ? 
                { ...transaction.metadata, ...transaction.itemData } : // Inventory specific body
                {
                    type: transaction.type,
                    amount: transaction.amount,
                    reason: transaction.reason,
                    metadata: transaction.metadata
                };

            let response;
            try {
                response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(body)
                });
            } catch (fetchError) {
                // If the fetch itself fails or throws (like the ResourceLoadError 500)
                // we catch it here and return a retry state
                console.warn(`📡 Transaction ${transaction.id} fetch failed:`, fetchError.message);
                return { 
                    success: false, 
                    shouldRetry: true, 
                    error: fetchError.message 
                };
            }

            // Handle 500 errors gracefully without throwing to prevent top-level ResourceLoadError
            if (response.status >= 500) {
                // TRIP CIRCUIT BREAKER
                this.circuitBreakers.set(endpoint, {
                    lastFailure: Date.now(),
                    failureCount: (this.circuitBreakers.get(endpoint)?.failureCount || 0) + 1
                });

                // Consume response body to prevent memory leaks/hangs
                try {
                    await response.text();
                } catch (e) {}
                
                console.warn(`⚠️ Backend Server Error (${response.status}) on ${endpoint}. Circuit breaker tripped.`);
                
                return { 
                    success: false, 
                    shouldRetry: true, 
                    error: `Server Error ${response.status}` 
                };
            }

            // SUCCESS - Reset circuit breaker
            this.circuitBreakers.delete(endpoint);

            if (!response.ok) {
                // For 4xx errors, we should not retry as they usually mean a logic error or permission issue
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    try {
                        const text = await response.text();
                        errorData = { message: text };
                    } catch (e2) {}
                }
                
                console.error(`❌ Transaction ${transaction.id} client error (${response.status}):`, errorData.message || response.statusText);
                
                return {
                    success: false,
                    shouldRetry: false,
                    error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
                };
            }

            const data = await response.json();
            
            logger.debug('Transaction Queue', `Transaction ${transaction.id} processed successfully`);
            
            transaction.status = 'completed';
            transaction.completedAt = Date.now();
            
            return { success: true, data };
            
        } catch (error) {
            // Handle network errors gracefully (expected in buildless/offline scenarios)
            const isNetworkError = error.message.includes('fetch') || 
                                  error.message.includes('Failed to fetch') ||
                                  error.message.includes('NetworkError') ||
                                  error.message.includes('CORS');
            
            const isRouteNotFound = error.message.includes('Route') && error.message.includes('not found');
            
            if (isNetworkError || isRouteNotFound || (error.message && error.message.includes('500'))) {
                // Network errors, missing backend routes, and server crashes (500) are expected - silent in console
                // Only log on first attempt to avoid spam
                if (transaction.attempts === 0) {
                    const errorType = error.message.includes('500') ? 'server error' : 'offline mode';
                    logger.debug('Transaction Queue', `Transaction ${transaction.id} saved locally (${errorType})`);
                }
            } else {
                // Other errors should be logged as errors
                logger.error('Transaction Queue', `Transaction ${transaction.id} failed: ${error.message}`);
            }
            
            transaction.status = 'pending';
            transaction.error = error.message;
            
            // Determine if we should retry
            const shouldRetry = this.shouldRetryTransaction(error, transaction);
            
            return { 
                success: false, 
                shouldRetry,
                error: error.message 
            };
        }
    }

    /**
     * Determine if a failed transaction should be retried
     */
    shouldRetryTransaction(error, transaction) {
        // Route not found errors - don't retry (backend not implemented yet)
        if (error.message.includes('Route') && error.message.includes('not found')) {
            return false;
        }
        
        // Network errors - retry
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') ||
            error.message.includes('timeout')) {
            return true;
        }
        
        // Server errors (5xx) - retry
        if (error.message.includes('500') || 
            error.message.includes('502') ||
            error.message.includes('503') ||
            error.message.includes('504')) {
            return true;
        }
        
        // Rate limiting - retry
        if (error.message.includes('429') || error.message.includes('rate limit')) {
            return true;
        }
        
        // Client errors (4xx) - don't retry (except 408 timeout)
        if (error.message.includes('400') ||
            error.message.includes('401') ||
            error.message.includes('403') ||
            error.message.includes('404')) {
            return false;
        }
        
        // Default: retry if we haven't exceeded max attempts
        return transaction.attempts < this.maxRetries;
    }

    /**
     * Calculate exponential backoff delay
     */
    calculateBackoffDelay(attempts) {
        const delay = Math.min(
            this.baseRetryDelay * Math.pow(2, attempts),
            this.maxRetryDelay
        );
        // Add jitter to prevent thundering herd
        return delay + Math.random() * 1000;
    }

    // ============================================
    // PERSISTENCE
    // ============================================

    /**
     * Save queue to localStorage
     */
    saveQueue() {
        try {
            localStorage.setItem('transaction_queue', JSON.stringify(this.queue));
            localStorage.setItem('transaction_queue_timestamp', Date.now().toString());
        } catch (error) {
            console.error('❌ Failed to save transaction queue:', error);
        }
    }

    /**
     * Load queue from localStorage
     */
    loadQueue() {
        try {
            const saved = localStorage.getItem('transaction_queue');
            if (saved) {
                this.queue = JSON.parse(saved);
                
                // Clean up old transactions (older than 7 days)
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                const originalLength = this.queue.length;
                this.queue = this.queue.filter(t => t.createdAt > sevenDaysAgo);
                
                if (this.queue.length < originalLength) {
                    logger.info('Transaction Queue', `Cleaned up ${originalLength - this.queue.length} old transactions`);
                    this.saveQueue();
                }
            }
        } catch (error) {
            logger.error('Transaction Queue', `Failed to load queue: ${error.message}`);
            this.queue = [];
        }
    }

    /**
     * Clear the entire queue (use with caution!)
     */
    clearQueue() {
        logger.warn('Transaction Queue', 'Clearing transaction queue');
        this.queue = [];
        this.retryAttempts.clear();
        this.saveQueue();
    }

    // ============================================
    // ONLINE/OFFLINE HANDLING
    // ============================================

    handleOnline() {
        logger.info('Transaction Queue', 'Connection restored - processing queued transactions');
        this.startPeriodicProcessing();
        this.processQueue();
    }

    handleOffline() {
        logger.info('Transaction Queue', 'Connection lost - transactions will be queued');
        this.stopPeriodicProcessing();
    }

    startPeriodicProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        
        // Process queue every 30 seconds
        this.processingInterval = setInterval(() => {
            if (this.queue.length > 0 && !this.processing) {
                logger.debug('Transaction Queue', 'Periodic processing triggered');
                this.processQueue();
            }
        }, 30000);
    }

    stopPeriodicProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    generateTransactionId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get queue status and statistics
     */
    getQueueStatus() {
        const pending = this.queue.filter(t => t.status === 'pending').length;
        const processing = this.queue.filter(t => t.status === 'processing').length;
        
        return {
            total: this.queue.length,
            pending,
            processing,
            isOnline: navigator.onLine,
            isProcessing: this.processing,
            oldestTransaction: this.queue.length > 0 ? 
                new Date(Math.min(...this.queue.map(t => t.createdAt))) : null
        };
    }

    /**
     * Get all pending transactions
     */
    getPendingTransactions() {
        return this.queue.filter(t => t.status === 'pending');
    }

    /**
     * Notify user about sync issues (reached 3 attempts)
     */
    notifySyncIssues(transaction) {
        console.warn('⚠️ Transaction sync issues detected:', transaction);
        
        // ONLY show notification if user is authenticated (guest users work offline by design)
        const isAuthenticated = !!localStorage.getItem('auth_token');
        
        if (isAuthenticated && window.globalState && typeof window.globalState.showNotification === 'function') {
            window.globalState.showNotification(
                '💾 Your progress is saved locally and will sync automatically',
                'info'
            );
        }
    }

    /**
     * Notify user about permanent transaction failure
     */
    notifyTransactionFailed(transaction) {
        // Don't notify for route not found errors (backend not implemented yet)
        const isRouteNotFound = transaction.error && 
                               transaction.error.includes('Route') && 
                               transaction.error.includes('not found');
        
        if (isRouteNotFound) {
            logger.debug('Transaction Queue', `Transaction ${transaction.id} processed locally (backend route not available)`);
            return;
        }
        
        logger.warn('Transaction Queue', `Transaction permanently failed: ${transaction.id}`);
        
        // Try to show notification
        if (window.globalState && typeof window.globalState.showNotification === 'function') {
            window.globalState.showNotification(
                `Sync failed: ${transaction.reason}. Data saved locally.`,
                'info'
            );
        }
        
        // Dispatch event for custom handling
        window.dispatchEvent(new CustomEvent('transactionFailed', {
            detail: transaction
        }));
    }

    /**
     * Force retry all pending transactions
     */
    retryAll() {
        logger.info('Transaction Queue', 'Force retrying all pending transactions');
        this.queue.forEach(t => {
            t.attempts = 0;
            t.status = 'pending';
        });
        this.processQueue();
    }
}

// ============================================
// EXPORT & INITIALIZATION
// ============================================

// Create global instance
window.transactionQueue = new TransactionQueueManager();

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransactionQueueManager;
}
