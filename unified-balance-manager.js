/**
 * ============================================
 * UNIFIED BALANCE MANAGER (COMPATIBILITY LAYER)
 * ============================================
 * 
 * This is now a compatibility proxy to GlobalStateManager.
 * All operations are forwarded to window.globalState.
 * 
 * This ensures legacy code continues to work while maintaining
 * a single source of truth for balance and inventory.
 */

console.log('💰 Loading Unified Balance Manager (Compatibility Layer)');

class UnifiedBalanceManager {
    constructor() {
        // Wait for GlobalStateManager to be ready
        this.waitForGlobalState();
    }

    waitForGlobalState() {
        if (window.globalState) {
            console.log('✅ Balance Manager proxying to GlobalStateManager');
        } else {
            // Retry until GlobalStateManager is available
            setTimeout(() => this.waitForGlobalState(), 100);
        }
    }

    /**
     * Get current balance (proxy to GlobalStateManager)
     */
    getBalance() {
        return window.globalState ? window.globalState.getBalance() : 0;
    }

    /**
     * Add coins (proxy to GlobalStateManager)
     */
    async addCoins(amount, reason = 'Credit', metadata = {}) {
        if (!window.globalState) {
            console.error('❌ GlobalStateManager not ready');
            return false;
        }
        return window.globalState.addCoins(amount, reason, metadata);
    }

    /**
     * Deduct coins (proxy to GlobalStateManager)
     */
    async deductCoins(amount, reason = 'Debit', metadata = {}) {
        if (!window.globalState) {
            console.error('❌ GlobalStateManager not ready');
            return false;
        }
        return window.globalState.deductCoins(amount, reason, metadata);
    }

    /**
     * Set balance (proxy to GlobalStateManager)
     */
    setBalance(amount) {
        if (!window.globalState) {
            console.error('❌ GlobalStateManager not ready');
            return 0;
        }
        return window.globalState.setBalance(amount);
    }

    /**
     * Check if user can afford amount (proxy to GlobalStateManager)
     */
    canAfford(amount) {
        if (!window.globalState) return false;
        return window.globalState.getBalance() >= amount;
    }

    /**
     * Subscribe to balance changes (proxy to GlobalStateManager)
     */
    subscribe(callback) {
        if (window.globalState && typeof callback === 'function') {
            window.globalState.subscribe(callback);
        }
    }

    /**
     * Update all displays (proxy to GlobalStateManager)
     */
    updateAllDisplays() {
        if (window.globalState) {
            window.globalState.updateAllDisplays();
        }
    }

    /**
     * Check authentication (proxy to GlobalStateManager)
     */
    isAuthenticated() {
        return window.globalState ? window.globalState.state.isAuthenticated : false;
    }

    /**
     * Sync with backend (proxy to GlobalStateManager)
     */
    async syncWithBackend() {
        if (window.globalState) {
            return window.globalState.syncWithBackend();
        }
    }
}

// Create global instance
window.unifiedBalanceManager = new UnifiedBalanceManager();

// Also create legacy aliases for backwards compatibility
window.currencyManager = window.unifiedBalanceManager;
window.balanceManager = window.unifiedBalanceManager;

console.log('✅ Unified Balance Manager loaded (proxying to GlobalStateManager)');
