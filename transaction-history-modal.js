/**
 * ============================================
 * TRANSACTION HISTORY MODAL
 * Display user's complete coin audit trail
 * ============================================
 */

console.log('💰 Loading Transaction History Modal');

class TransactionHistoryModal {
    constructor() {
        this.config = {
            apiBaseUrl: window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app',
            limit: 50,
            offset: 0
        };
        
        this.transactions = [];
        this.total = 0;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.createModal();
        this.attachEventListeners();
        console.log('✅ Transaction History Modal Ready');
    }

    createModal() {
        // Remove existing modal if present
        const existing = document.getElementById('transaction-history-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'transaction-history-modal';
        modal.className = 'transaction-history-modal';
        modal.innerHTML = `
            <div class="transaction-modal-overlay"></div>
            <div class="transaction-modal-content">
                <div class="transaction-modal-header">
                    <h2>💰 Transaction History</h2>
                    <button class="transaction-modal-close" aria-label="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div class="transaction-modal-stats">
                    <div class="transaction-stat">
                        <span class="stat-label">Total Transactions</span>
                        <span class="stat-value" id="total-transactions">0</span>
                    </div>
                    <div class="transaction-stat">
                        <span class="stat-label">Total Earned</span>
                        <span class="stat-value stat-positive" id="total-earned">0</span>
                    </div>
                    <div class="transaction-stat">
                        <span class="stat-label">Total Spent</span>
                        <span class="stat-value stat-negative" id="total-spent">0</span>
                    </div>
                    <div class="transaction-stat">
                        <span class="stat-label">Net Change</span>
                        <span class="stat-value" id="net-change">0</span>
                    </div>
                </div>

                <div class="transaction-modal-body">
                    <div class="transaction-list" id="transaction-list">
                        <div class="transaction-loading">
                            <div class="spinner"></div>
                            <p>Loading transactions...</p>
                        </div>
                    </div>
                </div>

                <div class="transaction-modal-footer">
                    <button class="btn-secondary" id="download-transaction-history">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download Statement
                    </button>
                    <button class="btn-secondary" id="load-more-transactions">Load More</button>
                    <button class="btn-primary" id="close-transaction-modal">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    attachEventListeners() {
        // Close buttons
        document.querySelector('.transaction-modal-close')?.addEventListener('click', () => this.close());
        document.getElementById('close-transaction-modal')?.addEventListener('click', () => this.close());
        document.querySelector('.transaction-modal-overlay')?.addEventListener('click', () => this.close());

        // Load more
        document.getElementById('load-more-transactions')?.addEventListener('click', () => this.loadMore());

        // Download statement
        document.getElementById('download-transaction-history')?.addEventListener('click', () => this.downloadStatement());

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    async open() {
        const modal = document.getElementById('transaction-history-modal');
        if (!modal) return;

        // Reset state
        this.config.offset = 0;
        this.transactions = [];

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Load transactions
        await this.loadTransactions();
    }

    close() {
        const modal = document.getElementById('transaction-history-modal');
        if (!modal) return;

        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    isOpen() {
        const modal = document.getElementById('transaction-history-modal');
        return modal?.classList.contains('active');
    }

    async loadTransactions() {
        if (this.isLoading) return;

        const token = localStorage.getItem('auth_token');
        if (!token) {
            this.showError('Not logged in');
            return;
        }

        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}/api/transactions?limit=${this.config.limit}&offset=${this.config.offset}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                // If the backend history is unavailable, show local queued transactions as a fallback
                if (this.config.offset === 0 && window.transactionQueue) {
                    this.transactions = window.transactionQueue.queue.map(t => ({
                        ...t,
                        created_at: t.createdAt
                    }));
                    this.total = this.transactions.length;
                    this.renderTransactions();
                    this.updateStats();
                    return;
                }
                throw new Error(`Failed to load transactions: ${response.status}`);
            }

            const data = await response.json();
            
            this.transactions = [...this.transactions, ...data.transactions];
            this.total = data.total;

            this.renderTransactions();
            this.updateStats();
            this.updateLoadMoreButton();

        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Failed to load transaction history');
        } finally {
            this.isLoading = false;
        }
    }

    async loadMore() {
        this.config.offset += this.config.limit;
        await this.loadTransactions();
    }

    downloadStatement() {
        if (this.transactions.length === 0) {
            alert('No transactions to download');
            return;
        }

        const headers = ['Date', 'Type', 'Amount', 'Reason', 'Balance Before', 'Balance After'];
        const rows = this.transactions.map(tx => [
            new Date(tx.created_at).toLocaleString(),
            this.getTransactionLabel(tx.type),
            tx.amount,
            tx.reason.replace(/,/g, ';'), // Escape commas for CSV
            tx.balance_before,
            tx.balance_after
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const username = localStorage.getItem('guestUsername') || 'user';
        const date = new Date().toISOString().split('T')[0];
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Ultimate_Sports_AI_Statement_${username}_${date}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (window.globalState && typeof window.globalState.showNotification === 'function') {
            window.globalState.showNotification('Statement downloaded successfully', 'success');
        }
    }

    renderTransactions() {
        const list = document.getElementById('transaction-list');
        if (!list) return;

        if (this.transactions.length === 0) {
            list.innerHTML = `
                <div class="transaction-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>No transactions yet</p>
                    <span>Start playing games to earn coins!</span>
                </div>
            `;
            return;
        }

        list.innerHTML = this.transactions.map(tx => this.renderTransaction(tx)).join('');
    }

    renderTransaction(tx) {
        const isPositive = ['credit', 'win', 'reward'].includes(tx.type);
        const icon = this.getTransactionIcon(tx.type);
        const typeLabel = this.getTransactionLabel(tx.type);
        const amountClass = isPositive ? 'positive' : 'negative';
        const amountPrefix = isPositive ? '+' : '';

        const date = new Date(tx.created_at);
        const timeStr = this.formatTransactionTime(date);

        return `
            <div class="transaction-item ${tx.type}">
                <div class="transaction-icon ${amountClass}">
                    ${icon}
                </div>
                <div class="transaction-details">
                    <div class="transaction-main">
                        <span class="transaction-type">${typeLabel}</span>
                        <span class="transaction-amount ${amountClass}">
                            ${amountPrefix}${Math.abs(tx.amount).toLocaleString()}
                        </span>
                    </div>
                    <div class="transaction-meta">
                        <span class="transaction-reason">${this.escapeHtml(tx.reason)}</span>
                        <span class="transaction-time">${timeStr}</span>
                    </div>
                    <div class="transaction-balance">
                        Balance: ${tx.balance_before.toLocaleString()} → ${tx.balance_after.toLocaleString()}
                    </div>
                </div>
            </div>
        `;
    }

    getTransactionIcon(type) {
        const icons = {
            'credit': '💵',
            'debit': '💸',
            'win': '🎉',
            'loss': '📉',
            'bet': '🎲',
            'purchase': '🛒',
            'reward': '🎁'
        };
        return icons[type] || '💰';
    }

    getTransactionLabel(type) {
        const labels = {
            'credit': 'Credit',
            'debit': 'Debit',
            'win': 'Win',
            'loss': 'Loss',
            'bet': 'Bet Placed',
            'purchase': 'Purchase',
            'reward': 'Reward'
        };
        return labels[type] || type;
    }

    formatTransactionTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } else if (days > 0) {
            return `${days}d ago`;
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    }

    updateStats() {
        const totalTransactions = this.total;
        const totalEarned = this.transactions
            .filter(tx => ['credit', 'win', 'reward'].includes(tx.type))
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const totalSpent = this.transactions
            .filter(tx => ['debit', 'loss', 'bet', 'purchase'].includes(tx.type))
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const netChange = totalEarned - totalSpent;

        document.getElementById('total-transactions').textContent = totalTransactions.toLocaleString();
        document.getElementById('total-earned').textContent = `+${totalEarned.toLocaleString()}`;
        document.getElementById('total-spent').textContent = `-${totalSpent.toLocaleString()}`;
        
        const netElement = document.getElementById('net-change');
        netElement.textContent = `${netChange >= 0 ? '+' : ''}${netChange.toLocaleString()}`;
        netElement.className = `stat-value ${netChange >= 0 ? 'stat-positive' : 'stat-negative'}`;
    }

    updateLoadMoreButton() {
        const button = document.getElementById('load-more-transactions');
        if (!button) return;

        const hasMore = this.transactions.length < this.total;
        button.style.display = hasMore ? 'block' : 'none';
        button.disabled = this.isLoading;
        button.textContent = this.isLoading ? 'Loading...' : `Load More (${this.total - this.transactions.length} remaining)`;
    }

    showLoading() {
        const list = document.getElementById('transaction-list');
        if (!list) return;

        if (this.transactions.length === 0) {
            list.innerHTML = `
                <div class="transaction-loading">
                    <div class="spinner"></div>
                    <p>Loading transactions...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const list = document.getElementById('transaction-list');
        if (!list) return;

        list.innerHTML = `
            <div class="transaction-error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

window.transactionHistoryModal = new TransactionHistoryModal();

console.log('✅ Transaction History Modal Initialized');
