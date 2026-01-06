/**
 * ============================================
 * UNIFIED INVENTORY MANAGER (COMPATIBILITY LAYER)
 * ============================================
 * 
 * This is now a compatibility proxy to GlobalStateManager.
 * All inventory operations are forwarded to window.globalState.
 * 
 * This ensures legacy code continues to work while maintaining
 * a single source of truth for balance and inventory.
 */

console.log('🎒 Loading Unified Inventory Manager (Compatibility Layer)');

class UnifiedInventoryManager {
    constructor() {
        // Wait for GlobalStateManager to be ready
        this.waitForGlobalState();
    }

    waitForGlobalState() {
        if (window.globalState) {
            console.log('✅ Inventory Manager proxying to GlobalStateManager');
        } else {
            // Retry until GlobalStateManager is available
            setTimeout(() => this.waitForGlobalState(), 100);
        }
    }

    /**
     * Get full inventory (proxy to GlobalStateManager)
     */
    getInventory() {
        return window.globalState ? window.globalState.getInventory() : this.getDefaultInventory();
    }

    /**
     * Get default inventory structure
     */
    getDefaultInventory() {
        return {
            boosters: [],
            avatars: [],
            cosmetics: [],
            consumables: [],
            protections: [],
            purchaseHistory: []
        };
    }

    /**
     * Get items by type (proxy to GlobalStateManager)
     */
    getItemsByType(type) {
        return window.globalState ? window.globalState.getItemsByType(type) : [];
    }

    /**
     * Add item to inventory (proxy to GlobalStateManager)
     */
    async addItem(itemData) {
        if (!window.globalState) {
            console.error('❌ GlobalStateManager not ready');
            return false;
        }
        return window.globalState.addItem(itemData);
    }

    /**
     * Remove item from inventory (proxy to GlobalStateManager)
     */
    removeItem(item_id, item_type, quantity = 1) {
        if (!window.globalState) {
            console.error('❌ GlobalStateManager not ready');
            return false;
        }
        return window.globalState.removeItem(item_id, item_type, quantity);
    }

    /**
     * Check if user has an item (proxy to GlobalStateManager)
     */
    hasItem(item_id) {
        return window.globalState ? window.globalState.hasItem(item_id) : false;
    }

    /**
     * Use a consumable item
     */
    useConsumable(item_id) {
        const inventory = this.getInventory();
        const item = inventory.consumables?.find(i => i.id === item_id);
        
        if (!item || item.quantity < 1) {
            console.warn(`⚠️ Cannot use ${item_id} - not found or quantity 0`);
            return false;
        }

        // Remove one from inventory
        const success = this.removeItem(item_id, 'consumable', 1);
        
        if (success) {
            console.log(`✅ Used consumable: ${item.name}`);
            
            // Apply item effect based on type
            this.applyConsumableEffect(item);
        }
        
        return success;
    }

    /**
     * Apply consumable effect
     */
    applyConsumableEffect(item) {
        // This would contain logic for different consumable types
        // For now, just log
        console.log(`Applying effect for ${item.name}`);
        
        // Dispatch event so other systems can react
        window.dispatchEvent(new CustomEvent('consumableUsed', {
            detail: { item }
        }));
    }

    /**
     * Cleanup expired items
     */
    cleanupExpiredItems() {
        const inventory = this.getInventory();
        const now = Date.now();
        let cleaned = false;

        ['boosters', 'consumables', 'protections'].forEach(category => {
            if (inventory[category]) {
                const before = inventory[category].length;
                inventory[category] = inventory[category].filter(item => {
                    return !item.expiresAt || item.expiresAt > now;
                });
                if (inventory[category].length < before) {
                    cleaned = true;
                    console.log(`🗑️ Cleaned expired items from ${category}`);
                }
            }
        });

        if (cleaned && window.globalState) {
            window.globalState.state.inventory = inventory;
            window.globalState.saveToStorage();
        }

        return cleaned;
    }

    /**
     * Save inventory to storage (proxy to GlobalStateManager)
     */
    saveToStorage() {
        if (window.globalState) {
            window.globalState.saveToStorage();
        }
    }

    /**
     * Load inventory from storage (proxy to GlobalStateManager)
     */
    loadFromStorage() {
        if (window.globalState) {
            return window.globalState.getInventory();
        }
        return this.getDefaultInventory();
    }
}

// Create global instance
window.unifiedInventoryManager = new UnifiedInventoryManager();

// Also create legacy alias for backwards compatibility
window.inventoryManager = window.unifiedInventoryManager;

console.log('✅ Unified Inventory Manager loaded (proxying to GlobalStateManager)');
