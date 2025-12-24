// ============================================
// UNIFIED CURRENCY SYSTEM
// Single source of truth for Ultimate Coins
// ============================================

console.log('💰 Loading Unified Currency System');

class UnifiedCurrencyManager {
    constructor() {
        this.STORAGE_KEY = 'ultimateCoins';
        this.DEFAULT_BALANCE = 1000;
        this.init();
    }

    init() {
        // Migrate old balance keys to unified system
        this.migrateOldBalances();
        
        // Sync with backend if logged in
        this.syncWithBackend();

        // Update all displays
        this.updateAllDisplays();

        console.log('✅ Unified Currency System initialized');
        console.log(`💰 Current balance: ${this.getBalance()} Ultimate Coins`);
    }

    // Migrate old localStorage keys to unified system
    migrateOldBalances() {
        const oldKeys = ['sportsLoungeBalance', 'gameCoins', 'userBalance', 'balance'];
        let highestBalance = this.DEFAULT_BALANCE;

        // Find the highest balance from old keys
        oldKeys.forEach(key => {
            const value = parseInt(localStorage.getItem(key));
            if (value && value > highestBalance) {
                highestBalance = value;
            }
        });

        // Set unified balance
        const currentBalance = localStorage.getItem(this.STORAGE_KEY);
        if (!currentBalance) {
            localStorage.setItem(this.STORAGE_KEY, highestBalance.toString());
            console.log(`✅ Migrated balance: ${highestBalance} coins`);
        }

        // Clear old keys
        oldKeys.forEach(key => localStorage.removeItem(key));
    }

    // Get current balance
    getBalance() {
        return parseInt(localStorage.getItem(this.STORAGE_KEY)) || this.DEFAULT_BALANCE;
    }

    // Set balance
    setBalance(amount) {
        const newBalance = Math.max(0, Math.floor(amount)); // No negative, whole numbers only
        localStorage.setItem(this.STORAGE_KEY, newBalance.toString());
        this.updateAllDisplays();
        this.syncWithBackend();
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('balanceUpdated', { 
            detail: { balance: newBalance } 
        }));

        return newBalance;
    }

    // Add coins
    addCoins(amount, reason = 'Added') {
        const currentBalance = this.getBalance();
        const newBalance = this.setBalance(currentBalance + amount);
        
        console.log(`💰 ${reason}: +${amount} coins (New balance: ${newBalance})`);
        this.showNotification(`+${amount} Ultimate Coins! 💰`, 'success');
        
        return newBalance;
    }

    // Deduct coins
    deductCoins(amount, reason = 'Deducted') {
        const currentBalance = this.getBalance();
        
        if (currentBalance < amount) {
            this.showNotification(`Insufficient coins! Need ${amount}, have ${currentBalance}`, 'error');
            return false;
        }

        const newBalance = this.setBalance(currentBalance - amount);
        console.log(`💸 ${reason}: -${amount} coins (New balance: ${newBalance})`);
        
        return newBalance;
    }

    // Check if user can afford
    canAfford(amount) {
        return this.getBalance() >= amount;
    }

    // Update all balance displays across the app
    updateAllDisplays() {
        const balance = this.getBalance();
        const formattedBalance = balance.toLocaleString();

        // All possible balance display selectors
        const selectors = [
            '.profile-coins',
            '#user-balance',
            '#user-coins',
            '#balance-display',
            '.balance-amount',
            '.coins-display',
            '[data-balance]'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (element.hasAttribute('data-balance')) {
                    element.setAttribute('data-balance', balance);
                }
                element.textContent = formattedBalance;
            });
        });

        // Update header balance if exists
        const headerBalance = document.getElementById('header-user-balance');
        if (headerBalance) {
            headerBalance.innerHTML = `<i class="fas fa-coins"></i> ${formattedBalance}`;
        }
    }

    // Sync with backend (if user is logged in)
    async syncWithBackend() {
        const token = localStorage.getItem('auth_token');
        if (!token) return; // Skip if not logged in

        try {
            // Get user profile from backend
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/me/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user && data.user.balance !== undefined) {
                    // Backend balance takes priority
                    this.setBalance(data.user.balance);
                    console.log('✅ Synced balance with backend:', data.user.balance);
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not sync balance with backend:', error.message);
            // Continue with local balance
        }
    }

    // Update backend balance
    async updateBackendBalance() {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            const balance = this.getBalance();
            await fetch(`${CONFIG.API_BASE_URL}/api/users/me/balance`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ balance })
            });
        } catch (error) {
            console.warn('⚠️ Could not update backend balance:', error.message);
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Format number with commas
    formatNumber(num) {
        return num.toLocaleString();
    }

    // Get transaction history
    getTransactionHistory() {
        const history = localStorage.getItem('coinTransactions');
        return history ? JSON.parse(history) : [];
    }

    // Add transaction to history
    addTransaction(type, amount, reason) {
        const history = this.getTransactionHistory();
        history.unshift({
            type,
            amount,
            reason,
            balance: this.getBalance(),
            timestamp: new Date().toISOString()
        });

        // Keep last 100 transactions
        if (history.length > 100) {
            history.pop();
        }

        localStorage.setItem('coinTransactions', JSON.stringify(history));
    }

    // Reset balance (for testing)
    reset() {
        this.setBalance(this.DEFAULT_BALANCE);
        localStorage.removeItem('coinTransactions');
        console.log('✅ Balance reset to', this.DEFAULT_BALANCE);
    }
}

// Create global instance
window.currencyManager = new UnifiedCurrencyManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedCurrencyManager;
}

// Listen for balance updates from other systems
window.addEventListener('balanceUpdated', (event) => {
    console.log('💰 Balance updated:', event.detail.balance);
});

console.log('✅ Unified Currency System ready');
