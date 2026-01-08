/**
 * Transaction Manager for Ultimate Sports AI
 * Handles logging and retrieval of all financial transactions (Coins & VIP).
 */
class TransactionManager {
    constructor() {
        this.STORAGE_KEY = 'ultimate_sports_ai_transactions';
    }

    /**
     * Get all transactions from storage
     * @returns {Array} List of transactions sorted by date (newest first)
     */
    getTransactions() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            const transactions = data ? JSON.parse(data) : [];
            return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (e) {
            console.error('Error reading transactions:', e);
            return [];
        }
    }

    /**
     * Log a new transaction
     * @param {Object} details Transaction details
     */
    logTransaction({ type, amount, currency = 'USD', item, provider = 'PayPal', status = 'COMPLETED', metadata = {} }) {
        const transactions = this.getTransactions();
        
        const newTransaction = {
            id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            type, // 'COIN_PURCHASE', 'VIP_SUBSCRIPTION', 'SUBSCRIPTION_RENEWAL'
            amount,
            currency,
            item, // e.g., '1000 Coins', 'Gold VIP (Monthly)'
            provider,
            status,
            metadata
        };

        transactions.push(newTransaction);
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
            console.log('Transaction logged:', newTransaction);
            
            // Dispatch event for UI updates if needed
            window.dispatchEvent(new CustomEvent('transaction_logged', { detail: newTransaction }));
            
            return newTransaction;
        } catch (e) {
            console.error('Error saving transaction:', e);
            return null;
        }
    }

    /**
     * Clear all history (Admin/Debug only)
     */
    clearHistory() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

export const transactionManager = new TransactionManager();
