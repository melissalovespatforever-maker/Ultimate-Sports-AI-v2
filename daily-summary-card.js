/**
 * ============================================
 * DAILY SUMMARY CARD
 * Calculates and displays net coin activity over 24h
 * ============================================
 */

class DailySummaryCard {
    constructor() {
        this.config = {
            apiBaseUrl: window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app'
        };
        this.container = null;
        this.init();
    }

    init() {
        console.log('📊 Initializing Daily Summary Card');
        this.renderPlaceholder();
        
        // Listen for balance updates to refresh summary
        window.addEventListener('balanceUpdated', () => this.refreshData());
        window.addEventListener('transactionQueueProcessed', () => this.refreshData());
        
        // Initial load
        this.refreshData();
    }

    renderPlaceholder() {
        this.container = document.getElementById('daily-summary-container');
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="daily-summary-card glass-card">
                <div class="daily-summary-loading">
                    <div class="spinner-sm"></div>
                    <span>Calculating daily stats...</span>
                </div>
            </div>
        `;
    }

    async refreshData() {
        if (!this.container) {
            this.container = document.getElementById('daily-summary-container');
        }
        if (!this.container) return;

        const token = localStorage.getItem('auth_token');
        if (!token) {
            this.container.innerHTML = ''; // Hide if not logged in
            return;
        }

        try {
            // Try fetching from backend history (Standardizing to /api/transactions)
            const response = await fetch(
                `${this.config.apiBaseUrl}/api/transactions?limit=50&offset=0`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                }
            );

            let transactions = [];
            if (response.ok) {
                const data = await response.json();
                transactions = data.transactions || [];
            } else {
                console.warn(`⚠️ Backend history fetch failed (${response.status}), falling back to local queue`);
                // Fallback: check local transaction queue for recent activity
                transactions = this.getLocalTransactionsFallback();
            }
            
            this.calculateAndRender(transactions);

        } catch (error) {
            if (error.message && error.message.includes('500')) {
                console.warn('⚠️ Backend history unavailable (500) - using local cache');
            } else {
                console.error('Error refreshing daily summary:', error);
            }
            // Fallback: use local data if network is down
            const transactions = this.getLocalTransactionsFallback();
            this.calculateAndRender(transactions);
        }
    }

    getLocalTransactionsFallback() {
        // Get transactions from the local queue manager
        if (window.transactionQueue && Array.isArray(window.transactionQueue.queue)) {
            return window.transactionQueue.queue.map(tx => ({
                ...tx,
                created_at: tx.createdAt // map local timestamp to match backend format
            }));
        }
        return [];
    }

    calculateAndRender(transactions) {
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        const dailyTransactions = transactions.filter(tx => new Date(tx.created_at).getTime() > oneDayAgo);

        let earned = 0;
        let spent = 0;
        
        dailyTransactions.forEach(tx => {
            const amount = Math.abs(tx.amount);
            if (['credit', 'win', 'reward'].includes(tx.type)) {
                earned += amount;
            } else {
                spent += amount;
            }
        });

        const netChange = earned - spent;
        const isPositive = netChange >= 0;

        this.container.innerHTML = `
            <div class="daily-summary-card glass-card">
                <div class="summary-header">
                    <h3><i class="fas fa-chart-pie"></i> Last 24 Hours</h3>
                    <div class="summary-time">Today's Performance</div>
                </div>
                <div class="summary-stats">
                    <div class="summary-stat-item">
                        <span class="label">Earned</span>
                        <span class="value earned">+${earned.toLocaleString()}</span>
                    </div>
                    <div class="summary-stat-divider"></div>
                    <div class="summary-stat-item">
                        <span class="label">Spent</span>
                        <span class="value spent">-${spent.toLocaleString()}</span>
                    </div>
                    <div class="summary-stat-divider"></div>
                    <div class="summary-stat-item highlight">
                        <span class="label">Net Change</span>
                        <span class="value net ${isPositive ? 'positive' : 'negative'}">
                            <i class="fas fa-caret-${isPositive ? 'up' : 'down'}"></i>
                            ${isPositive ? '+' : ''}${netChange.toLocaleString()}
                        </span>
                    </div>
                </div>
                <div class="summary-footer">
                    <button class="view-history-btn" onclick="window.transactionHistoryModal.open()">
                        View Detailed History <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dailySummaryCard = new DailySummaryCard();
});
