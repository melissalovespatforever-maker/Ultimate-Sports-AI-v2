/**
 * ============================================================================
 * CENTRALIZED ERROR HANDLER
 * ============================================================================
 * 
 * Provides consistent error handling across the application with:
 * - User-friendly error messages
 * - Console logging for debugging
 * - Graceful degradation patterns
 * - Error recovery strategies
 * 
 * Usage:
 * ------
 * import { handleError, safeCall } from './error-handler.js';
 * 
 * // Option 1: Wrap risky operations
 * const result = safeCall(() => riskyOperation(), defaultValue);
 * 
 * // Option 2: Explicit error handling
 * try {
 *   riskyOperation();
 * } catch (e) {
 *   handleError(e, 'Operation failed', { showToast: true });
 * }
 * 
 * ============================================================================
 */

// Error severity levels
const ERROR_LEVELS = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};

// Error categories for better tracking
const ERROR_CATEGORIES = {
    NETWORK: 'network',
    STORAGE: 'storage',
    VALIDATION: 'validation',
    PAYMENT: 'payment',
    GAME_LOGIC: 'game_logic',
    UNKNOWN: 'unknown'
};

/**
 * Main error handler
 * @param {Error} error - The error object
 * @param {string} userMessage - User-friendly message
 * @param {Object} options - Configuration options
 */
function handleError(error, userMessage = 'Something went wrong', options = {}) {
    const {
        level = ERROR_LEVELS.ERROR,
        category = ERROR_CATEGORIES.UNKNOWN,
        showToast = false,
        logToConsole = true,
        context = {}
    } = options;

    // Log to console for debugging
    if (logToConsole) {
        // Suppress noisy 500 errors from backend routes that are known to be unstable or under maintenance
        const isBackend500 = error && (
            (error.message && (error.message.includes('500') || error.message.includes('Resource failed to load'))) || 
            (error.status === 500) ||
            (error.name === 'ResourceLoadError') ||
            (typeof userMessage === 'string' && userMessage.includes('500'))
        );

        if (isBackend500) {
            console.warn(`[${category.toUpperCase()}] Backend currently unavailable (500): ${userMessage || error?.message}`);
            return { handled: true, level, category, message: userMessage };
        }

        const logLevel = level === ERROR_LEVELS.CRITICAL ? 'error' : level === ERROR_LEVELS.WARNING ? 'warn' : 'info';
        console[logLevel](`[${category.toUpperCase()}] ${userMessage}`, {
            error,
            context,
            timestamp: new Date().toISOString()
        });
    }

    // Show user notification
    if (showToast && typeof showToast === 'function') {
        showToast(userMessage, level);
    } else if (showToast && window.parent?.showToast) {
        window.parent.showToast(userMessage, level);
    }

    // Track to analytics (if available)
    if (window.analyticsTracker?.trackError) {
        window.analyticsTracker.trackError(category, userMessage, error);
    }

    return {
        handled: true,
        level,
        category,
        message: userMessage
    };
}

/**
 * Safe function call wrapper
 * @param {Function} fn - Function to execute
 * @param {*} defaultValue - Value to return on error
 * @param {Object} options - Error handling options
 */
function safeCall(fn, defaultValue = null, options = {}) {
    try {
        return fn();
    } catch (error) {
        handleError(error, options.message || 'Operation failed', {
            ...options,
            showToast: options.showToast !== false
        });
        return defaultValue;
    }
}

/**
 * Async safe function call wrapper
 * @param {Function} fn - Async function to execute
 * @param {*} defaultValue - Value to return on error
 * @param {Object} options - Error handling options
 */
async function safeCallAsync(fn, defaultValue = null, options = {}) {
    try {
        return await fn();
    } catch (error) {
        handleError(error, options.message || 'Async operation failed', {
            ...options,
            showToast: options.showToast !== false
        });
        return defaultValue;
    }
}

/**
 * Network error handler with retry logic
 * @param {Function} networkFn - Function that makes network request
 * @param {Object} options - Retry configuration
 */
async function withRetry(networkFn, options = {}) {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        backoff = true,
        onRetry = null
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await networkFn();
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries) {
                const delay = backoff ? retryDelay * Math.pow(2, attempt) : retryDelay;
                
                if (onRetry) {
                    onRetry(attempt + 1, maxRetries, delay);
                }
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // All retries failed
    handleError(lastError, 'Network request failed after retries', {
        level: ERROR_LEVELS.ERROR,
        category: ERROR_CATEGORIES.NETWORK,
        context: { maxRetries, lastAttempt: maxRetries }
    });
    
    throw lastError;
}

/**
 * Storage error handler with fallback
 * @param {Function} storageFn - Function that accesses storage
 * @param {*} fallback - Fallback value
 */
function safeStorage(storageFn, fallback = null) {
    return safeCall(storageFn, fallback, {
        message: 'Storage access failed',
        category: ERROR_CATEGORIES.STORAGE,
        level: ERROR_LEVELS.WARNING,
        showToast: false
    });
}

/**
 * Payment error handler with user-friendly messages
 * @param {Error} error - Payment error
 * @param {string} operation - Operation type (purchase, refund, etc.)
 */
function handlePaymentError(error, operation = 'payment') {
    const userMessages = {
        insufficient_funds: 'Insufficient coins! Please earn more or purchase coins.',
        transaction_failed: 'Transaction failed. Please try again.',
        item_unavailable: 'This item is currently unavailable.',
        already_owned: 'You already own this item.',
        network_error: 'Connection error. Please check your internet.',
        server_error: 'Server error. Please try again later.',
        validation_error: 'Invalid purchase. Please refresh and try again.'
    };

    const errorType = error.type || error.code || 'unknown';
    const message = userMessages[errorType] || `Payment ${operation} failed`;

    return handleError(error, message, {
        level: ERROR_LEVELS.ERROR,
        category: ERROR_CATEGORIES.PAYMENT,
        showToast: true,
        context: { operation, errorType }
    });
}

/**
 * Validation error handler
 * @param {string} field - Field that failed validation
 * @param {string} reason - Validation failure reason
 */
function handleValidationError(field, reason) {
    const message = `Invalid ${field}: ${reason}`;
    
    return handleError(new Error(message), message, {
        level: ERROR_LEVELS.WARNING,
        category: ERROR_CATEGORIES.VALIDATION,
        showToast: true
    });
}

/**
 * Global error boundary for uncaught errors
 */
function setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
        const error = event.error || { message: event.message };
        
        // Suppress 'Resource failed to load (500)' errors from backend
        if (event.message && (event.message.includes('500') || event.message.includes('transactions'))) {
            console.warn('⚠️ Suppressed global load error (500):', event.message);
            event.preventDefault();
            return;
        }

        handleError(error, 'An unexpected error occurred', {
            level: ERROR_LEVELS.CRITICAL,
            context: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        // Specifically catch and suppress the 'transactions' 500 load error
        if (event.reason && (
            (event.reason.message && (event.reason.message.includes('500') || event.reason.message.includes('transactions'))) ||
            (event.reason.name === 'ResourceLoadError')
        )) {
            console.warn('⚠️ Suppressed unhandled backend rejection (500):', event.reason.message || event.reason);
            event.preventDefault();
            return;
        }

        handleError(event.reason, 'An unexpected error occurred', {
            level: ERROR_LEVELS.CRITICAL,
            context: {
                promise: event.promise
            }
        });
    });
}

// Auto-setup on load (can be disabled if needed)
if (typeof window !== 'undefined') {
    setupGlobalErrorHandler();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleError,
        safeCall,
        safeCallAsync,
        withRetry,
        safeStorage,
        handlePaymentError,
        handleValidationError,
        ERROR_LEVELS,
        ERROR_CATEGORIES
    };
}

// Also make available globally
window.errorHandler = {
    handleError,
    safeCall,
    safeCallAsync,
    withRetry,
    safeStorage,
    handlePaymentError,
    handleValidationError,
    ERROR_LEVELS,
    ERROR_CATEGORIES
};

console.log('✅ Error Handler initialized');
