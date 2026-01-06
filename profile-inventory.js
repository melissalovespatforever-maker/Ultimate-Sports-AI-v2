// ============================================
// PROFILE INVENTORY SYSTEM
// Track purchased items, active boosters, avatars
// ============================================

console.log('🎒 Loading Profile Inventory System');

class ProfileInventory {
    constructor() {
        this.STORAGE_KEY = 'userInventory';
        this.EQUIPPED_AVATAR_KEY = 'equippedAvatar';
        this.AVATAR_DATA = {
            'jordan-1': { name: 'Jordan 1 Icon', icon: '👟', color: '#FF6B6B', tier: 'PRO' },
            'js-4': { name: "J's 4 Avatar", icon: '🏀', color: '#FFD93D', tier: 'PRO' },
            'king-chess': { name: 'King Chess Piece', icon: '♔', color: '#C0C0C0', tier: 'PRO' },
            'lucky-charm': { name: 'Lucky Charm', icon: '🍀', color: '#52B788', tier: 'PRO' },
            'crown': { name: 'Ultimate Crown', icon: '👑', color: '#FFD700', tier: 'PRO' },
            'money-tree': { name: 'Money Tree', icon: '🌳', color: '#2D6A4F', tier: 'VIP' },
            'scrooge': { name: 'Scrooge McDuck', icon: '🦆', color: '#B8860B', tier: 'VIP' },
            'game-boys': { name: 'Game Boys Stack', icon: '🕹️', color: '#8B4513', tier: 'VIP' },
            'gotrich': { name: 'Gotrich Baller', icon: '💰', color: '#FFD700', tier: 'VIP' },
            'guccii-duffel': { name: 'Guccii Duffel', icon: '👜', color: '#8B0000', tier: 'VIP' },
            'elite-player': { name: 'Elite Origins Avatar', icon: '👤', color: '#60a5fa', tier: 'SEASON' },
            'origins-ring': { name: 'Season 1 Origins Ring', icon: '💍', color: '#ffd700', tier: 'SEASON' }
        };
        this.init();
    }

    init() {
        console.log('✨ Initializing Profile Inventory');
        this.loadInventory();
    }

    // Get full inventory
    getInventory() {
        // Use GlobalStateManager as the single source of truth
        if (window.globalState) {
            return window.globalState.getInventory();
        }

        // Fallback to unified inventory manager for compatibility
        if (window.unifiedInventoryManager) {
            return window.unifiedInventoryManager.getInventory();
        }

        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return this.getDefaultInventory();
        
        try {
            const parsed = JSON.parse(stored);
            
            // Migration: If inventory was an array (old version), convert to new object structure
            if (Array.isArray(parsed)) {
                console.log('🔄 Migrating old array-based inventory to new object structure');
                const newInventory = this.getDefaultInventory();
                parsed.forEach(item => {
                    // Try to sort old items into new categories
                    if (item.id && (item.id.includes('coin') || item.id.includes('xp'))) {
                        newInventory.boosters.push(item);
                    } else if (item.id && this.AVATAR_DATA[item.id]) {
                        newInventory.avatars.push(item);
                    } else {
                        newInventory.consumables.push(item);
                    }
                    // Add to purchase history with proper structure
                    newInventory.purchaseHistory.push({
                        id: item.id,
                        name: item.name || 'Unknown Item',
                        category: item.category || 'unknown',
                        price: item.price || 0,
                        timestamp: item.purchasedAt || item.timestamp || Date.now()
                    });
                });
                return newInventory;
            }
            
            // Ensure all required properties exist
            const defaults = this.getDefaultInventory();
            return {
                ...defaults,
                ...parsed,
                boosters: parsed.boosters || [],
                avatars: parsed.avatars || [],
                cosmetics: parsed.cosmetics || [],
                consumables: parsed.consumables || [],
                purchaseHistory: parsed.purchaseHistory || []
            };
        } catch (e) {
            console.error('❌ Error parsing inventory:', e);
            return this.getDefaultInventory();
        }
    }

    // Default inventory structure
    getDefaultInventory() {
        return {
            boosters: [],        // Active boosters with expiry
            avatars: [],         // Owned avatars
            cosmetics: [],       // Badges, name colors, etc.
            consumables: [],     // Streak shields, XP coins, etc.
            purchaseHistory: []  // All past purchases
        };
    }

    // Save inventory
    saveInventory(inventory) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(inventory));
        this.updateDisplay();
    }

    // Load inventory data
    loadInventory() {
        this.inventory = this.getInventory();
        console.log('📦 Inventory loaded:', this.inventory);
    }

    // Add item to inventory
    addItem(category, item) {
        const inventory = this.getInventory();
        
        if (!inventory[category]) {
            inventory[category] = [];
        }

        // Check if item already exists
        const exists = inventory[category].find(i => i.id === item.id);
        if (!exists) {
            inventory[category].push({
                ...item,
                purchasedAt: Date.now()
            });
            
            // Add to purchase history
            inventory.purchaseHistory.push({
                id: item.id,
                name: item.name,
                category,
                price: item.price,
                timestamp: Date.now()
            });

            this.saveInventory(inventory);
            console.log(`✅ Added ${item.name} to ${category}`);
            return true;
        }
        
        return false;
    }

    // Activate booster
    activateBooster(boosterId, duration) {
        const inventory = this.getInventory();
        
        const booster = {
            id: boosterId,
            name: this.getBoosterName(boosterId),
            activatedAt: Date.now(),
            expiresAt: Date.now() + duration,
            duration: duration,
            multiplier: this.getBoosterMultiplier(boosterId)
        };

        inventory.boosters.push(booster);
        this.saveInventory(inventory);
        
        console.log(`🚀 Activated ${booster.name} for ${duration/60000} minutes`);
        return booster;
    }

    // Get active boosters
    getActiveBoosters() {
        const inventory = this.getInventory();
        const now = Date.now();
        
        if (!inventory || !inventory.boosters || !Array.isArray(inventory.boosters)) {
            console.warn('⚠️ Inventory or boosters array missing');
            return [];
        }
        
        // Filter out expired boosters
        const active = inventory.boosters.filter(b => b && b.expiresAt > now);
        
        // Clean up expired boosters
        if (active.length !== inventory.boosters.length) {
            inventory.boosters = active;
            this.saveInventory(inventory);
        }
        
        return active;
    }

    // Check if booster is active
    hasActiveBooster(type) {
        const active = this.getActiveBoosters();
        return active.some(b => b.id.includes(type));
    }

    // Get total multiplier for a stat
    getTotalMultiplier(stat) {
        const active = this.getActiveBoosters();
        let multiplier = 1;
        
        active.forEach(booster => {
            if (booster.id.includes(stat)) {
                multiplier *= booster.multiplier;
            }
        });
        
        return multiplier;
    }

    // Render inventory UI in profile page
    renderInventorySection() {
        const container = document.getElementById('profile-inventory-section');
        if (!container) return;

        const inventory = this.getInventory();
        const activeBoosters = this.getActiveBoosters();
        const balance = window.currencyManager ? window.currencyManager.getBalance() : 0;

        container.innerHTML = `
            <!-- Avatar Customization Preview -->
            <div style="margin-bottom: 32px;">
                <h3 style="margin-bottom: 16px;">
                    <i class="fas fa-user-circle"></i> Avatar Customization
                </h3>
                ${this.renderAvatarPreview()}
            </div>

            <!-- Coin Balance -->
            <div style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center; color: white;">
                <div style="font-size: 48px; font-weight: 700; margin-bottom: 8px;">
                    💰 ${balance.toLocaleString()}
                </div>
                <div style="font-size: 16px; opacity: 0.9;">Ultimate Coins</div>
                <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">Virtual currency - No cash value</div>
            </div>

            <!-- Active Boosters -->
            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px;">
                    <i class="fas fa-rocket"></i> Active Boosters (${activeBoosters.length})
                </h3>
                ${activeBoosters.length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
                        ${activeBoosters.map(booster => this.renderBoosterCard(booster)).join('')}
                    </div>
                ` : `
                    <div style="background: var(--bg-tertiary); border-radius: 12px; padding: 32px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;">🚀</div>
                        <p style="color: var(--text-secondary); margin: 0;">No active boosters</p>
                        <button class="btn btn-secondary" style="margin-top: 16px;" onclick="event.stopPropagation(); window.appNavigation && window.appNavigation.navigateTo ? window.appNavigation.navigateTo('shop') : window.location.href='#shop';">
                            Visit Shop
                        </button>
                    </div>
                `}
            </div>

            <!-- Owned Avatars -->
            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px;">
                    <i class="fas fa-user-circle"></i> Avatar Collection (${inventory.avatars.length})
                </h3>
                ${inventory.avatars.length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px;">
                        ${inventory.avatars.map(avatar => this.renderAvatarCard(avatar)).join('')}
                    </div>
                ` : `
                    <div style="background: var(--bg-tertiary); border-radius: 12px; padding: 32px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;">👤</div>
                        <p style="color: var(--text-secondary); margin: 0;">No avatars collected yet</p>
                        <button class="btn btn-secondary" style="margin-top: 16px;" onclick="event.stopPropagation(); window.appNavigation && window.appNavigation.navigateTo ? window.appNavigation.navigateTo('shop') : window.location.href='#shop';">
                            Browse Avatars
                        </button>
                    </div>
                `}
            </div>

            <!-- Consumables -->
            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px;">
                    <i class="fas fa-box"></i> Consumables (${inventory.consumables.length})
                </h3>
                ${inventory.consumables.length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                        ${inventory.consumables.map(item => this.renderConsumableCard(item)).join('')}
                    </div>
                ` : `
                    <div style="background: var(--bg-tertiary); border-radius: 12px; padding: 24px; text-align: center;">
                        <div style="font-size: 36px; margin-bottom: 8px; opacity: 0.5;">📦</div>
                        <p style="color: var(--text-secondary); margin: 0; font-size: 14px;">No consumables in inventory</p>
                    </div>
                `}
            </div>

            <!-- Purchase History -->
            <div>
                <h3 style="margin-bottom: 16px;">
                    <i class="fas fa-history"></i> Purchase History (${inventory.purchaseHistory.length})
                </h3>
                ${inventory.purchaseHistory.length > 0 ? `
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${inventory.purchaseHistory.slice().reverse().slice(0, 10).map(purchase => this.renderPurchaseHistoryItem(purchase)).join('')}
                    </div>
                ` : `
                    <div style="background: var(--bg-tertiary); border-radius: 12px; padding: 24px; text-align: center;">
                        <p style="color: var(--text-secondary); margin: 0; font-size: 14px;">No purchases yet</p>
                    </div>
                `}
            </div>
        `;
    }

    // Render booster card
    renderBoosterCard(booster) {
        const timeLeft = booster.expiresAt - Date.now();
        const minutesLeft = Math.floor(timeLeft / 60000);
        const secondsLeft = Math.floor((timeLeft % 60000) / 1000);

        return `
            <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1)); border: 2px solid var(--primary); border-radius: 12px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="font-size: 24px;">🚀</div>
                    <span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                        ${booster.multiplier}x
                    </span>
                </div>
                <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${booster.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">
                    ⏱️ ${minutesLeft}m ${secondsLeft}s left
                </div>
                <div style="background: var(--bg-tertiary); height: 4px; border-radius: 2px; margin-top: 8px; overflow: hidden;">
                    <div style="background: var(--primary); height: 100%; width: ${(timeLeft / booster.duration) * 100}%;"></div>
                </div>
            </div>
        `;
    }

    // Render avatar card
    renderAvatarCard(avatar) {
        const equipped = this.getEquippedAvatar();
        const isEquipped = equipped && equipped.id === avatar.id;
        const avatarData = this.AVATAR_DATA[avatar.id];
        const borderColor = isEquipped ? (avatarData?.color || 'var(--primary)') : 'var(--border-color)';
        const bgColor = avatarData?.color ? `${avatarData.color}10` : 'var(--bg-tertiary)';

        return `
            <div style="background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 12px; padding: 12px; text-align: center; cursor: pointer; transition: all 0.3s ease; position: relative;" 
                 data-avatar-id="${avatar.id}"
                 onmouseover="this.style.borderColor='${avatarData?.color || 'var(--primary)'}'; this.style.transform='scale(1.08)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)'" 
                 onmouseout="this.style.borderColor='${borderColor}'; this.style.transform='scale(1)'; this.style.boxShadow='none'"
                 onclick="event.stopPropagation(); window.profileInventory.selectAvatar('${avatar.id}')">
                ${isEquipped ? `<div style="position: absolute; top: 4px; right: 4px; background: ${avatarData?.color || 'var(--primary)'}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">✓</div>` : ''}
                <div style="font-size: 44px; margin-bottom: 8px;">${avatar.icon || '👤'}</div>
                <div style="font-size: 11px; font-weight: 600; line-height: 1.2;">${avatar.name || 'Avatar'}</div>
            </div>
        `;
    }

    // Get equipped avatar
    getEquippedAvatar() {
        const equippedId = localStorage.getItem(this.EQUIPPED_AVATAR_KEY);
        if (equippedId && this.AVATAR_DATA[equippedId]) {
            return { id: equippedId, ...this.AVATAR_DATA[equippedId] };
        }
        return null;
    }

    // Select and equip an avatar
    selectAvatar(avatarId) {
        const inventory = this.getInventory();
        const avatar = inventory.avatars.find(a => a.id === avatarId);
        
        if (!avatar) {
            this.showNotification('Avatar not found', 'error');
            return;
        }

        // Save as equipped avatar in profile-inventory
        localStorage.setItem(this.EQUIPPED_AVATAR_KEY, avatarId);
        
        // Sync with GlobalStateManager (the ultimate source of truth)
        const globalState = window.globalState || (window.parent && window.parent.globalState);
        if (globalState && typeof globalState.setAvatar === 'function') {
            globalState.setAvatar(avatar.icon || '👤');
        }

        this.showNotification(`✅ Equipped ${avatar.name}!`, 'success');
        
        // Update display
        this.renderInventorySection();
        
        // Trigger animation
        const preview = document.getElementById('avatar-customization-preview');
        if (preview) {
            preview.style.animation = 'none';
            setTimeout(() => {
                preview.style.animation = 'avatarEquipped 0.6s ease';
            }, 10);
        }
    }

    // Render avatar customization preview
    renderAvatarPreview() {
        const equipped = this.getEquippedAvatar();
        
        if (!equipped) {
            return `
                <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(236, 72, 153, 0.05)); border: 2px dashed var(--primary); border-radius: 20px; padding: 40px; text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">👤</div>
                    <h3 style="margin: 0 0 8px; color: var(--text-secondary);">No Avatar Equipped</h3>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">Select an avatar from your collection to equip it</p>
                </div>
            `;
        }

        return `
            <div id="avatar-customization-preview" style="background: linear-gradient(135deg, ${equipped.color}15, ${equipped.color}05); border: 2px solid ${equipped.color}40; border-radius: 20px; padding: 40px; text-align: center; margin-bottom: 32px; transition: all 0.3s ease;">
                <div style="font-size: 100px; line-height: 1; margin-bottom: 20px; display: inline-block; background: ${equipped.color}20; padding: 20px; border-radius: 16px;">
                    ${equipped.icon}
                </div>
                <h2 style="margin: 16px 0 8px; color: ${equipped.color};">${equipped.name}</h2>
                <div style="display: flex; justify-content: center; align-items: center; gap: 16px; flex-wrap: wrap;">
                    <span style="background: ${equipped.color}20; color: ${equipped.color}; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 12px;">
                        ${equipped.tier} TIER
                    </span>
                    <span style="background: var(--primary); color: white; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 12px;">
                        ✓ EQUIPPED
                    </span>
                </div>
                <div style="margin-top: 20px; padding: 16px; background: ${equipped.color}05; border-radius: 12px;">
                    <p style="margin: 0; color: var(--text-secondary); font-size: 13px;">
                        Your profile displays this avatar to other users
                    </p>
                </div>
            </div>
        `;
    }

    // Render consumable card
    renderConsumableCard(item) {
        return `
            <div style="background: var(--bg-tertiary); border-radius: 12px; padding: 16px; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 8px;">${this.getItemIcon(item.id)}</div>
                <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${item.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">Qty: ${item.quantity || 1}</div>
                <button class="btn btn-primary btn-sm" style="width: 100%; padding: 8px; font-size: 12px;" 
                        onclick="profileInventory.useConsumable('${item.id}')">
                    Use
                </button>
            </div>
        `;
    }

    // Render purchase history item
    renderPurchaseHistoryItem(purchase) {
        const date = new Date(purchase.timestamp);
        const price = purchase.price || 0; // Handle missing price
        return `
            <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600; font-size: 13px;">${purchase.name || 'Unknown Item'}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">
                        ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="color: var(--primary); font-weight: 600;">-${price.toLocaleString()}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">coins</div>
                </div>
            </div>
        `;
    }

    // Helper: Get booster name
    getBoosterName(id) {
        const names = {
            'coin-2x': '2x Coin Booster',
            'coin-3x': '3x Coin Booster',
            'xp-2x': '2x XP Booster',
            'xp-3x': '3x XP Booster'
        };
        return names[id] || 'Booster';
    }

    // Helper: Get booster multiplier
    getBoosterMultiplier(id) {
        if (id.includes('3x')) return 3;
        if (id.includes('2x')) return 2;
        return 1;
    }

    // Helper: Get item icon
    getItemIcon(id) {
        const icons = {
            'streak-shield': '🛡️',
            'xp-coin': '⭐',
            'lucky-charm': '🍀',
            'mega-pack': '🎁'
        };
        return icons[id] || '📦';
    }

    // Use consumable item
    useConsumable(itemId) {
        const inventory = this.getInventory();
        const itemIndex = inventory.consumables.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1) {
            console.warn('Item not found in inventory');
            return;
        }

        const item = inventory.consumables[itemIndex];
        
        // Apply item effect
        this.applyConsumableEffect(item);
        
        // Reduce quantity or remove
        if (item.quantity && item.quantity > 1) {
            item.quantity--;
        } else {
            inventory.consumables.splice(itemIndex, 1);
        }

        this.saveInventory(inventory);
        this.showNotification(`✅ Used ${item.name}!`, 'success');
    }

    // Apply consumable effect
    applyConsumableEffect(item) {
        switch(item.id) {
            case 'streak-shield':
                // Protect next loss from breaking streak
                localStorage.setItem('streakShieldActive', 'true');
                console.log('🛡️ Streak shield activated');
                break;
            case 'xp-coin':
                // Grant bonus XP
                if (window.achievementsSystem) {
                    window.achievementsSystem.addXP(500);
                }
                break;
            case 'lucky-charm':
                // Increase win probability (cosmetic)
                console.log('🍀 Lucky charm activated');
                break;
        }
    }

    // Update all displays
    updateDisplay() {
        this.renderInventorySection();
        
        // Update booster timers every second
        this.updateBoosterTimers();
    }

    // Update booster timers (call every second)
    updateBoosterTimers() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            const active = this.getActiveBoosters();
            if (active.length > 0) {
                this.renderInventorySection();
            } else {
                clearInterval(this.timerInterval);
            }
        }, 1000);
    }

    // Show notification
    showNotification(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(message);
        }
    }
}

// Add avatar customization animations
const avatarStyles = document.createElement('style');
avatarStyles.textContent = `
    @keyframes avatarEquipped {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    @keyframes avatarPulse {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        }
        50% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
        }
    }

    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .avatar-customization-container {
        animation: slideInDown 0.4s ease;
    }

    [data-avatar-id] {
        box-shadow: none;
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(avatarStyles);

// Initialize globally
const profileInventory = new ProfileInventory();
window.profileInventory = profileInventory;

// Render when profile page becomes active
window.addEventListener('profilePageLoad', () => {
    console.log('👤 Profile page loaded, rendering inventory');
    profileInventory.renderInventorySection();
});

console.log('✅ Profile Inventory System loaded');
