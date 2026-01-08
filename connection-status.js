/**
 * CONNECTION STATUS WIDGET
 * Handles real-time monitoring of network and backend sync status
 */

class ConnectionStatusWidget {
    constructor() {
        this.element = null;
        this.statusText = null;
        this.statusDot = null;
        this.tooltipDetail = null;
        this.isOnline = navigator.onLine;
        this.isSyncing = false;
        this.lastSyncTime = Date.now();
        
        this.init();
    }

    init() {
        this.createWidget();
        this.setupListeners();
        this.updateUI();
        
        console.log('📡 Connection Status Widget initialized');
    }

    createWidget() {
        // Create widget element
        const widget = document.createElement('div');
        widget.id = 'connection-status-widget';
        widget.className = 'connection-status-widget online';
        widget.innerHTML = `
            <div class="status-dot"></div>
            <i class="fas fa-sync-alt sync-icon"></i>
            <span class="status-text">Online</span>
            <div class="status-tooltip">
                <span class="tooltip-title">System Status</span>
                <span class="tooltip-detail" id="connection-tooltip-detail">Connected and ready.</span>
            </div>
        `;

        // Find header actions container
        const actionsContainer = document.querySelector('.app-bar-actions');
        if (actionsContainer) {
            // Insert before the balance display
            const balanceDisplay = document.getElementById('header-user-balance');
            if (balanceDisplay) {
                actionsContainer.insertBefore(widget, balanceDisplay);
            } else {
                actionsContainer.prepend(widget);
            }
        }

        this.element = widget;
        this.statusText = widget.querySelector('.status-text');
        this.statusDot = widget.querySelector('.status-dot');
        this.tooltipDetail = document.getElementById('connection-tooltip-detail');
    }

    setupListeners() {
        // Browser online/offline events
        window.addEventListener('online', () => this.handleConnectivityChange(true));
        window.addEventListener('offline', () => this.handleConnectivityChange(false));

        // Listen for transaction queue events
        window.addEventListener('transactionSyncStarted', () => {
            this.isSyncing = true;
            this.updateUI();
        });

        window.addEventListener('transactionQueueProcessed', (e) => {
            this.handleSyncComplete(e.detail);
        });

        // Listen for custom sync start events (if we add them)
        // For now, we'll poll the transaction queue processing state
        setInterval(() => this.checkSyncStatus(), 1000);
    }

    handleConnectivityChange(online) {
        this.isOnline = online;
        this.updateUI();
        
        if (online) {
            console.log('🌐 Connection restored');
            // Small delay before trying to sync
            setTimeout(() => {
                if (window.transactionQueue && typeof window.transactionQueue.processQueue === 'function') {
                    window.transactionQueue.processQueue();
                }
            }, 1000);
        } else {
            console.warn('📴 Connection lost');
        }
    }

    checkSyncStatus() {
        const queue = window.transactionQueue;
        if (!queue) return;

        const currentlyProcessing = queue.processing;
        
        if (currentlyProcessing && !this.isSyncing) {
            this.isSyncing = true;
            this.updateUI();
        } else if (!currentlyProcessing && this.isSyncing) {
            // This case is usually handled by the event, but as a fallback:
            this.isSyncing = false;
            this.updateUI();
        }
    }

    handleSyncComplete(results) {
        this.isSyncing = false;
        this.lastSyncTime = Date.now();
        this.updateUI();
        
        if (results.success > 0) {
            this.lastSyncSuccess = true;
        }
    }

    updateUI() {
        if (!this.element) return;

        // Reset classes
        this.element.classList.remove('online', 'offline', 'syncing', 'error');

        const queue = window.transactionQueue;
        const pendingCount = queue ? queue.queue.length : 0;

        if (!this.isOnline) {
            this.element.classList.add('offline');
            this.statusText.textContent = 'Offline';
            this.tooltipDetail.textContent = `You are currently offline. ${pendingCount} transactions queued for sync.`;
        } else if (this.isSyncing) {
            this.element.classList.add('syncing');
            this.statusText.textContent = 'Syncing';
            this.tooltipDetail.textContent = `Syncing data with secure backend... (${pendingCount} remaining)`;
        } else {
            this.element.classList.add('online');
            this.statusText.textContent = 'Online';
            
            if (pendingCount > 0) {
                this.tooltipDetail.textContent = `Connected. ${pendingCount} transaction(s) pending sync.`;
            } else {
                this.tooltipDetail.textContent = `Connected and all systems synced. Last check: ${new Date().toLocaleTimeString()}`;
            }
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.connectionStatusWidget = new ConnectionStatusWidget();
});
