/**
 * ULTIMATE INVENTORY SYSTEM
 * Single source of truth for all user items, boosters, avatars, and consumables
 * Fully integrated with GlobalStateManager, ShopSystem, and backend sync
 */

class InventorySystem {
    constructor() {
        this.STORAGE_KEY = 'ultimate_inventory';
        this.inventory = this.getDefaultInventory();
        this.listeners = [];
        
        console.log('📦 Inventory System initialized');
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
        this.loadInventory();
        this.setupEventListeners();
        this.startBoosterMonitor();
        
        // Expose globally
        window.inventorySystem = this;
        
        return this;
    }

    getDefaultInventory() {
        return {
            boosters: [],      // Temporary multipliers (2x coins, 3x XP, etc.)
            avatars: [],       // Cosmetic profile pictures
            cosmetics: [],     // Badges, frames, effects
            consumables: [],   // One-time use items (shields, mystery boxes)
            permanents: [],    // Permanent bonuses (diamond ring, golden coin)
            purchaseHistory: []
        };
    }

    // ============================================
    // LOAD & SAVE
    // ============================================

    loadInventory() {
        try {
            let loadedInventory = null;

            // Check GlobalStateManager first (single source of truth)
            if (window.globalState && window.globalState.state.inventory) {
                loadedInventory = window.globalState.state.inventory;
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem(this.STORAGE_KEY);
                if (stored) {
                    loadedInventory = JSON.parse(stored);
                }
            }

            // Ensure we have a valid inventory object with all required categories
            const defaults = this.getDefaultInventory();
            if (loadedInventory && typeof loadedInventory === 'object') {
                // Merge loaded inventory with defaults to ensure all keys exist
                this.inventory = {
                    ...defaults,
                    ...loadedInventory
                };
                
                // Ensure all categories are arrays (prevent corruption)
                Object.keys(defaults).forEach(key => {
                    if (!Array.isArray(this.inventory[key])) {
                        this.inventory[key] = [];
                    }
                });
            } else {
                this.inventory = defaults;
            }

            // Sync to GlobalState if available
            if (window.globalState) {
                window.globalState.state.inventory = this.inventory;
                window.globalState.saveToStorage();
            }
        } catch (error) {
            this.inventory = this.getDefaultInventory();
        }
    }

    saveInventory() {
        try {
            // Save to localStorage
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.inventory));
            
            // Sync to GlobalState
            if (window.globalState) {
                window.globalState.state.inventory = this.inventory;
                window.globalState.saveToStorage();
            }

            // Notify listeners
            this.notifyListeners();

            // Dispatch event
            window.dispatchEvent(new CustomEvent('inventoryUpdated', {
                detail: { inventory: this.inventory }
            }));

        } catch (error) {
            if (window.Logger) window.Logger.error('Error saving inventory:', error);
        }
    }

    // ============================================
    // ADD ITEMS
    // ============================================

    addItem(itemData) {
        const {
            item_id,
            item_name,
            item_type,
            quantity = 1,
            metadata = {},
            duration = null,
            expires_at = null
        } = itemData;

        console.log(`📦 Adding item: ${item_name} (${item_type})`);

        // Determine category
        const category = this.getCategoryFromType(item_type);

        if (!this.inventory[category]) {
            console.error(`❌ Invalid category: ${category}`);
            return false;
        }

        // Special handling for boosters
        if (category === 'boosters' && duration) {
            return this.addBooster(itemData);
        }

        // Check if item already exists
        const existingIndex = this.inventory[category].findIndex(i => i.id === item_id);

        if (existingIndex !== -1) {
            // Stack quantity
            this.inventory[category][existingIndex].quantity += quantity;
            console.log(`✅ Stacked ${item_name} (now ${this.inventory[category][existingIndex].quantity})`);
        } else {
            // Add new item
            const newItem = {
                id: item_id,
                name: item_name,
                type: item_type,
                quantity: quantity,
                metadata: metadata,
                expiresAt: expires_at,
                addedAt: Date.now()
            };

            this.inventory[category].push(newItem);
            console.log(`✅ Added ${item_name} to ${category}`);
        }

        // Add to purchase history
        this.addToPurchaseHistory(itemData);

        // Save and notify
        this.saveInventory();
        this.showNotification(`Added ${item_name} to inventory!`, 'success');

        // Sync to backend if authenticated
        if (window.globalState?.state.isAuthenticated) {
            this.syncToBackend(itemData);
        }

        return true;
    }

    addBooster(itemData) {
        const {
            item_id,
            item_name,
            item_type,
            metadata = {},
            duration = 3600000 // Default 1 hour
        } = itemData;

        const multiplier = parseFloat(metadata.multiplier || metadata.value || 2);
        const stat = metadata.stat || 'coins';

        const booster = {
            id: item_id,
            name: item_name,
            type: item_type,
            stat: stat,
            multiplier: multiplier,
            quantity: 1,
            metadata: metadata,
            activatedAt: Date.now(),
            expiresAt: Date.now() + duration,
            duration: duration,
            addedAt: Date.now()
        };

        this.inventory.boosters.push(booster);
        console.log(`🚀 Booster activated: ${item_name} (${multiplier}x ${stat} for ${duration / 1000}s)`);

        this.saveInventory();
        this.showNotification(`${item_name} activated! ${multiplier}x ${stat} boost!`, 'success');

        return true;
    }

    addToPurchaseHistory(itemData) {
        this.inventory.purchaseHistory.unshift({
            id: itemData.item_id,
            name: itemData.item_name,
            type: itemData.item_type,
            quantity: itemData.quantity || 1,
            price: itemData.metadata?.price || 0,
            timestamp: Date.now()
        });

        // Keep last 100 purchases
        if (this.inventory.purchaseHistory.length > 100) {
            this.inventory.purchaseHistory = this.inventory.purchaseHistory.slice(0, 100);
        }
    }

    // ============================================
    // REMOVE ITEMS
    // ============================================

    removeItem(item_id, quantity = 1) {
        let removed = false;

        // Search all categories
        for (const category of Object.keys(this.inventory)) {
            if (category === 'purchaseHistory') continue;

            const items = this.inventory[category];
            const index = items.findIndex(i => i.id === item_id);

            if (index !== -1) {
                const item = items[index];

                if (item.quantity > quantity) {
                    item.quantity -= quantity;
                    console.log(`📦 Reduced ${item.name} quantity to ${item.quantity}`);
                } else {
                    items.splice(index, 1);
                    console.log(`📦 Removed ${item.name} from inventory`);
                }

                removed = true;
                break;
            }
        }

        if (removed) {
            this.saveInventory();
            return true;
        }

        console.warn(`⚠️ Item ${item_id} not found in inventory`);
        return false;
    }

    // ============================================
    // USE ITEMS
    // ============================================

    useItem(item_id) {
        const item = this.findItem(item_id);
        
        if (!item) {
            this.showNotification('Item not found!', 'error');
            return false;
        }

        console.log(`🎯 Using item: ${item.name}`);

        // Handle different item types
        switch (item.type) {
            case 'consumable':
                return this.useConsumable(item);
            case 'booster':
                // Boosters are auto-activated on purchase
                this.showNotification('Booster is already active!', 'info');
                return true;
            case 'avatar':
                return this.equipAvatar(item);
            case 'cosmetic':
                return this.equipCosmetic(item);
            default:
                this.showNotification('This item cannot be used', 'error');
                return false;
        }
    }

    useConsumable(item) {
        // Handle specific consumables
        if (item.id === 'streak-shield') {
            // Activate shield protection
            localStorage.setItem('streakShieldActive', 'true');
            this.showNotification('🛡️ Streak Shield activated! Your next loss won\'t reset your streak.', 'success');
        } else if (item.id === 'mystery-box') {
            // Open mystery box
            this.openMysteryBox();
        } else if (item.id.includes('coins')) {
            // Coin pack
            const amount = parseInt(item.metadata?.coins || 1000);
            if (window.globalState) {
                window.globalState.addCoins(amount, `Used ${item.name}`);
            }
        }

        // Remove one from inventory
        this.removeItem(item.id, 1);
        return true;
    }

    equipAvatar(item) {
        const avatar = item.metadata?.emoji || item.metadata?.icon || '😊';
        
        if (window.globalState) {
            window.globalState.setAvatar(avatar);
            this.showNotification(`Avatar equipped: ${avatar}`, 'success');
            return true;
        }

        return false;
    }

    equipCosmetic(item) {
        // Mark cosmetic as equipped
        this.inventory.cosmetics.forEach(c => {
            c.equipped = (c.id === item.id);
        });

        this.saveInventory();
        this.showNotification(`${item.name} equipped!`, 'success');
        return true;
    }

    openMysteryBox() {
        const prizes = [
            { type: 'coins', amount: 500, chance: 40 },
            { type: 'coins', amount: 1000, chance: 30 },
            { type: 'coins', amount: 2500, chance: 15 },
            { type: 'booster', id: 'coin-2x', name: '2x Coin Booster', chance: 10 },
            { type: 'booster', id: 'coin-3x', name: '3x Coin Booster', chance: 5 }
        ];

        // Roll for prize
        const roll = Math.random() * 100;
        let cumulative = 0;
        let prize = null;

        for (const p of prizes) {
            cumulative += p.chance;
            if (roll <= cumulative) {
                prize = p;
                break;
            }
        }

        if (!prize) prize = prizes[0]; // Fallback

        // Grant prize
        if (prize.type === 'coins') {
            if (window.globalState) {
                window.globalState.addCoins(prize.amount, 'Mystery Box');
            }
            this.showNotification(`🎁 Mystery Box: +${prize.amount} coins!`, 'success');
        } else if (prize.type === 'booster') {
            this.addBooster({
                item_id: prize.id,
                item_name: prize.name,
                item_type: 'booster',
                duration: 3600000,
                metadata: { multiplier: prize.id.includes('3x') ? 3 : 2, stat: 'coins' }
            });
        }

        // Confetti
        if (window.confetti) {
            window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    }

    // ============================================
    // QUERIES
    // ============================================

    findItem(item_id) {
        for (const category of Object.keys(this.inventory)) {
            if (category === 'purchaseHistory') continue;

            const item = this.inventory[category].find(i => i.id === item_id);
            if (item) return item;
        }
        return null;
    }

    hasItem(item_id) {
        return this.findItem(item_id) !== null;
    }

    getItemsByType(type) {
        const category = this.getCategoryFromType(type);
        return this.inventory[category] || [];
    }

    getActiveBoosters() {
        const now = Date.now();
        if (!this.inventory || !Array.isArray(this.inventory.boosters)) return [];
        return this.inventory.boosters.filter(b => b && b.expiresAt > now);
    }

    getMultiplier(stat = 'coins') {
        let multiplier = 1.0;

        // Add active boosters
        const boosters = this.getActiveBoosters();
        if (Array.isArray(boosters)) {
            boosters.forEach(booster => {
                if (booster.stat === stat || booster.stat === 'both') {
                    multiplier += (parseFloat(booster.multiplier) - 1 || 0);
                }
            });
        }

        // Add permanent bonuses
        if (this.inventory && Array.isArray(this.inventory.permanents)) {
            this.inventory.permanents.forEach(perm => {
                if (perm.stat === stat) {
                    multiplier += (parseFloat(perm.bonus) || 0);
                }
            });
        }

        return multiplier;
    }

    getAllItems() {
        return this.inventory;
    }

    getItemCount() {
        let count = 0;
        for (const category of Object.keys(this.inventory)) {
            if (category === 'purchaseHistory') continue;
            count += this.inventory[category].length;
        }
        return count;
    }

    // ============================================
    // HELPERS
    // ============================================

    getCategoryFromType(type) {
        const map = {
            'booster': 'boosters',
            'avatar': 'avatars',
            'cosmetic': 'cosmetics',
            'consumable': 'consumables',
            'permanent': 'permanents'
        };

        // If already plural, return as-is
        if (type.endsWith('s')) return type;

        // Map singular to plural
        return map[type] || type + 's';
    }

    // ============================================
    // BOOSTER MONITORING
    // ============================================

    startBoosterMonitor() {
        if (this.boosterInterval) clearInterval(this.boosterInterval);

        this.boosterInterval = setInterval(() => {
            this.cleanExpiredBoosters();
        }, 10000); // Check every 10 seconds
    }

    cleanExpiredBoosters() {
        const now = Date.now();
        if (!this.inventory || !Array.isArray(this.inventory.boosters)) return;
        
        const originalCount = this.inventory.boosters.length;

        this.inventory.boosters = this.inventory.boosters.filter(b => b && b.expiresAt > now);

        if (this.inventory.boosters.length < originalCount) {
            const expired = originalCount - this.inventory.boosters.length;
            console.log(`🧹 Cleaned ${expired} expired booster(s)`);
            this.saveInventory();
            this.showNotification(`${expired} booster(s) expired`, 'info');
        }
    }

    // ============================================
    // BACKEND SYNC
    // ============================================

    async syncToBackend(itemData) {
        if (!window.globalState?.state.isAuthenticated) return;

        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            const response = await fetch(`${window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app'}/api/inventory/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData),
                credentials: 'include'
            });

            if (response.ok) {
                console.log('✅ Inventory synced to backend');
            }
        } catch (error) {
            console.warn('⚠️ Backend sync failed (will retry later):', error.message);
        }
    }

    async syncAllToBackend() {
        if (!window.globalState?.state.isAuthenticated) return;

        console.log('🔄 Syncing entire inventory to backend...');

        for (const category of Object.keys(this.inventory)) {
            if (category === 'purchaseHistory') continue;

            for (const item of this.inventory[category]) {
                await this.syncToBackend({
                    item_id: item.id,
                    item_name: item.name,
                    item_type: item.type,
                    quantity: item.quantity || 1,
                    metadata: item.metadata || {},
                    expires_at: item.expiresAt || null
                });
            }
        }

        console.log('✅ Full inventory sync complete');
    }

    // ============================================
    // UI RENDERING
    // ============================================

    renderInventoryUI(containerId = 'inventory-content') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container #${containerId} not found`);
            return;
        }

        const totalItems = this.getItemCount();

        if (totalItems === 0) {
            container.innerHTML = `
                <div class="inventory-empty-state">
                    <i class="fas fa-box-open" style="font-size: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 8px;">Your inventory is empty</h3>
                    <p style="color: var(--text-secondary); font-size: 14px;">Visit the Shop to purchase items and boosters!</p>
                </div>
            `;
            return;
        }

        let html = '<div class="inventory-grid">';

        // Boosters Section
        if (this.inventory.boosters.length > 0) {
            html += this.renderCategory('Boosters', this.inventory.boosters, '🚀');
        }

        // Avatars Section
        if (this.inventory.avatars.length > 0) {
            html += this.renderCategory('Avatars', this.inventory.avatars, '👤');
        }

        // Consumables Section
        if (this.inventory.consumables.length > 0) {
            html += this.renderCategory('Consumables', this.inventory.consumables, '🎁');
        }

        // Cosmetics Section
        if (this.inventory.cosmetics.length > 0) {
            html += this.renderCategory('Cosmetics', this.inventory.cosmetics, '✨');
        }

        // Permanents Section
        if (this.inventory.permanents.length > 0) {
            html += this.renderCategory('Permanent Bonuses', this.inventory.permanents, '💎');
        }

        html += '</div>';

        container.innerHTML = html;

        // Add event listeners
        this.attachItemListeners();
    }

    renderCategory(title, items, icon) {
        let html = `
            <div class="inventory-category">
                <h3 class="category-title">
                    <span>${icon}</span>
                    ${title}
                    <span class="item-count">${items.length}</span>
                </h3>
                <div class="category-items">
        `;

        items.forEach(item => {
            html += this.renderItem(item);
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    renderItem(item) {
        const icon = item.metadata?.icon || item.metadata?.emoji || '📦';
        const description = item.metadata?.description || 'No description';
        const quantity = item.quantity || 1;
        const isExpiring = item.expiresAt && (item.expiresAt - Date.now()) < 300000; // Less than 5 min

        let statusBadge = '';
        if (item.expiresAt) {
            const remaining = item.expiresAt - Date.now();
            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                statusBadge = `<div class="item-timer ${isExpiring ? 'expiring' : ''}">${minutes}:${seconds.toString().padStart(2, '0')}</div>`;
            } else {
                statusBadge = '<div class="item-timer expired">EXPIRED</div>';
            }
        }

        if (item.equipped) {
            statusBadge = '<div class="item-equipped">EQUIPPED</div>';
        }

        return `
            <div class="inventory-item" data-item-id="${item.id}">
                ${statusBadge}
                <div class="item-icon">${icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-description">${description}</div>
                ${quantity > 1 ? `<div class="item-quantity">x${quantity}</div>` : ''}
                <button class="btn-use-item" data-item-id="${item.id}">
                    ${item.type === 'avatar' ? 'Equip' : item.type === 'booster' ? 'Active' : 'Use'}
                </button>
            </div>
        `;
    }

    attachItemListeners() {
        document.querySelectorAll('.btn-use-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = btn.getAttribute('data-item-id');
                this.useItem(itemId);
                
                // Re-render after short delay
                setTimeout(() => this.renderInventoryUI(), 500);
            });
        });
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    setupEventListeners() {
        // Listen for inventory updates from other systems
        window.addEventListener('inventoryUpdated', (e) => {
            if (e.detail?.refresh) {
                this.loadInventory();
            }
        });

        // Listen for shop purchases
        window.addEventListener('itemPurchased', (e) => {
            if (e.detail?.item) {
                this.addItem(e.detail.item);
            }
        });
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.inventory);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    }

    // ============================================
    // NOTIFICATIONS
    // ============================================

    showNotification(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // ============================================
    // UTILITY
    // ============================================

    clearInventory() {
        this.inventory = this.getDefaultInventory();
        this.saveInventory();
        console.log('🗑️ Inventory cleared');
    }

    exportInventory() {
        return JSON.stringify(this.inventory, null, 2);
    }

    importInventory(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.inventory = imported;
            this.saveInventory();
            console.log('✅ Inventory imported');
            return true;
        } catch (error) {
            console.error('❌ Failed to import inventory:', error);
            return false;
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Create and initialize global instance
window.inventorySystem = new InventorySystem().init();

// Add CSS for inventory UI
const inventoryStyles = document.createElement('style');
inventoryStyles.textContent = `
    .inventory-empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
    }

    .inventory-grid {
        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    .inventory-category {
        background: var(--bg-secondary);
        border-radius: 16px;
        padding: 24px;
    }

    .category-title {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 20px;
    }

    .category-title span:first-child {
        font-size: 24px;
    }

    .item-count {
        margin-left: auto;
        background: var(--primary-color);
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
    }

    .category-items {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
    }

    .inventory-item {
        background: var(--bg-card);
        border: 2px solid var(--border-color);
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .inventory-item:hover {
        border-color: var(--primary-color);
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .item-icon {
        font-size: 48px;
        margin-bottom: 8px;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }

    .item-name {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
    }

    .item-description {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.4;
    }

    .item-quantity {
        position: absolute;
        top: 12px;
        right: 12px;
        background: var(--primary-color);
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
    }

    .item-timer {
        position: absolute;
        top: 12px;
        left: 12px;
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        font-family: monospace;
    }

    .item-timer.expiring {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        animation: pulse 1s infinite;
    }

    .item-timer.expired {
        background: rgba(100, 100, 100, 0.2);
        color: #888;
    }

    .item-equipped {
        position: absolute;
        top: 12px;
        left: 12px;
        background: rgba(99, 102, 241, 0.2);
        color: var(--primary-color);
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
    }

    .btn-use-item {
        margin-top: auto;
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .btn-use-item:hover {
        background: #4f46e5;
        transform: scale(1.05);
    }

    .btn-use-item:disabled {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        cursor: not-allowed;
        opacity: 0.5;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    @media (max-width: 768px) {
        .category-items {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
    }
`;
document.head.appendChild(inventoryStyles);

console.log('✅ Ultimate Inventory System loaded');
