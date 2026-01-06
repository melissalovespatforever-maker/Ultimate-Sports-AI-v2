/**
 * ============================================
 * SPORTS LOUNGE INVENTORY SYSTEM
 * Dedicated inventory UI for Sports Lounge tab
 * ============================================
 */

window.SportsLoungeInventory = {
    
    render() {
        const inventoryContent = document.getElementById('inventory-content');
        if (!inventoryContent) return;
        
        // Get inventory from GlobalStateManager (single source of truth)
        const globalState = window.parent?.globalState || window.globalState;
        const inventory = globalState ? globalState.getInventory() : this.getFallbackInventory();
        const balance = globalState ? globalState.getBalance() : 0;
        
        // Get active boosters
        const activeBoosters = (inventory.boosters || []).filter(b => b.expiresAt > Date.now());
        
        inventoryContent.innerHTML = `
            <!-- Current Balance Display -->
            <div style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center; color: white;">
                <div style="font-size: 48px; font-weight: 700; margin-bottom: 8px;">
                    💰 ${balance.toLocaleString()}
                </div>
                <div style="font-size: 16px; opacity: 0.9;">Ultimate Coins</div>
                <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">Virtual currency - No cash value</div>
            </div>

            <!-- Active Boosters Section -->
            <div style="margin-bottom: 32px;">
                <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-rocket"></i> Active Boosters (${activeBoosters.length})
                </h3>
                ${activeBoosters.length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                        ${activeBoosters.map(booster => this.renderBoosterCard(booster)).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: 32px; background: rgba(255,255,255,0.03); border-radius: 12px;">
                        <div style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;">🚀</div>
                        <p style="color: var(--text-secondary); margin: 0;">No active boosters</p>
                        <button class="btn btn-secondary" style="margin-top: 12px;" onclick="switchTab('shop')">Visit Shop</button>
                    </div>
                `}
            </div>

            <!-- Avatar Collection -->
            <div style="margin-bottom: 32px;">
                <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-user-circle"></i> Avatar Collection (${(inventory.avatars || []).length})
                </h3>
                ${(inventory.avatars || []).length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;">
                        ${(inventory.avatars || []).map(avatar => this.renderAvatarCard(avatar)).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: 32px; background: rgba(255,255,255,0.03); border-radius: 12px;">
                        <div style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;">👤</div>
                        <p style="color: var(--text-secondary); margin: 0;">No avatars collected</p>
                        <button class="btn btn-secondary" style="margin-top: 12px;" onclick="switchTab('shop')">Browse Avatars</button>
                    </div>
                `}
            </div>

            <!-- Consumables -->
            <div style="margin-bottom: 32px;">
                <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-box"></i> Consumables (${(inventory.consumables || []).length})
                </h3>
                ${(inventory.consumables || []).length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                        ${(inventory.consumables || []).map(item => this.renderConsumableCard(item)).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: 32px; background: rgba(255,255,255,0.03); border-radius: 12px;">
                        <div style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;">📦</div>
                        <p style="color: var(--text-secondary); margin: 0;">No consumables in inventory</p>
                    </div>
                `}
            </div>
        `;
        
        // Start booster timer updates
        this.startBoosterTimers();
    },

    renderBoosterCard(booster) {
        const timeLeft = Math.max(0, booster.expiresAt - Date.now());
        const minutesLeft = Math.floor(timeLeft / 60000);
        const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
        const progress = (timeLeft / (booster.duration || 1)) * 100;

        return `
            <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1)); border: 2px solid var(--primary); border-radius: 12px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
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
                    <div style="background: var(--primary); height: 100%; width: ${progress}%;"></div>
                </div>
            </div>
        `;
    },

    renderAvatarCard(avatar) {
        const equippedAvatar = localStorage.getItem('equippedAvatar');
        const isEquipped = equippedAvatar === avatar.icon;
        
        return `
            <div style="background: rgba(255,255,255,0.05); border: 2px solid ${isEquipped ? 'var(--primary)' : 'var(--border-color)'}; border-radius: 12px; padding: 16px; text-align: center; cursor: pointer; position: relative; transition: all 0.3s ease;"
                 onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='scale(1.05)'"
                 onmouseout="this.style.borderColor='${isEquipped ? 'var(--primary)' : 'var(--border-color)'}'; this.style.transform='scale(1)'"
                 onclick="SportsLoungeInventory.equipAvatar('${avatar.icon}', '${avatar.name || avatar.id}')">
                ${isEquipped ? '<div style="position: absolute; top: 4px; right: 4px; background: var(--primary); color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">✓</div>' : ''}
                <div style="font-size: 40px; margin-bottom: 8px;">${avatar.icon}</div>
                <div style="font-size: 11px; font-weight: 600; line-height: 1.2;">${avatar.name || avatar.id}</div>
            </div>
        `;
    },

    renderConsumableCard(item) {
        return `
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 8px;">${this.getItemIcon(item.id)}</div>
                <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${item.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">Qty: ${item.quantity || 1}</div>
                <button class="btn btn-primary btn-sm" style="width: 100%; padding: 8px; font-size: 12px;" 
                        onclick="SportsLoungeInventory.useConsumable('${item.id}')">
                    Use
                </button>
            </div>
        `;
    },

    getItemIcon(id) {
        const icons = {
            'streak-shield': '🛡️',
            'xp-coin': '⭐',
            'lucky-charm': '🍀',
            'mega-pack': '🎁'
        };
        return icons[id] || '📦';
    },

    equipAvatar(icon, name) {
        localStorage.setItem('equippedAvatar', icon);
        const globalState = window.parent?.globalState || window.globalState;
        if (globalState && typeof globalState.setAvatar === 'function') {
            globalState.setAvatar(icon);
        }
        this.showNotification(`✅ Equipped ${name}!`, 'success');
        this.render();
    },

    useConsumable(itemId) {
        const globalState = window.parent?.globalState || window.globalState;
        if (globalState && typeof globalState.removeItem === 'function') {
            globalState.removeItem(itemId, 'consumable', 1);
            this.showNotification('✅ Consumable used!', 'success');
            this.render();
        } else {
            this.showNotification('⚠️ Cannot use item right now', 'error');
        }
    },

    getFallbackInventory() {
        try {
            return JSON.parse(localStorage.getItem('userInventory') || '{"boosters":[],"avatars":[],"cosmetics":[],"consumables":[],"purchaseHistory":[]}');
        } catch (e) {
            return {"boosters":[],"avatars":[],"cosmetics":[],"consumables":[],"purchaseHistory":[]};
        }
    },

    showNotification(message, type) {
        if (window.showToast) {
            window.showToast(message, type);
        } else if (window.parent?.showToast) {
            window.parent.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },

    startBoosterTimers() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            const globalState = window.parent?.globalState || window.globalState;
            const inventory = globalState ? globalState.getInventory() : this.getFallbackInventory();
            const activeBoosters = (inventory.boosters || []).filter(b => b.expiresAt > Date.now());
            
            if (activeBoosters.length > 0) {
                this.render();
            } else {
                clearInterval(this.timerInterval);
            }
        }, 1000);
    }
};

console.log('✅ Sports Lounge Inventory System loaded');
