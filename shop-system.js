/**
 * SHOP SYSTEM - Purchase boosters, avatars, and exclusive items
 */

const ShopSystem = {
    
    // Initialize shop
    init() {
        console.log('🛒 Initializing Shop System');
        this.setupCategoryFilters();
        this.loadActiveBoosters();
        this.updateBoosterTimers();
        
        // Export to window for global access (including from iframes)
        window.ShopSystem = this;
        
        // Update balance display when shop tab is opened
        this.setupShopTabListener();
    },

    // Setup listener for shop tab
    setupShopTabListener() {
        const shopTab = document.querySelector('[data-tab="shop"]');
        if (shopTab) {
            shopTab.addEventListener('click', () => {
                setTimeout(() => this.updateBalanceDisplay(), 100);
            });
        }
    },

    // Get user balance (use unified currency system)
    getUserBalance() {
        // If in iframe, get from parent
        if (window.parent && window.parent !== window && window.parent.globalState) {
            return window.parent.globalState.getBalance();
        }
        // Use local global state
        if (window.globalState) {
            return window.globalState.getBalance();
        }
        // Use currency manager if available
        if (window.currencyManager) {
            return window.currencyManager.getBalance();
        }
        // Fallback
        return parseInt(localStorage.getItem('unified_balance') || localStorage.getItem('ultimateCoins') || '1000');
    },

    // Set user balance (use unified currency system)
    setUserBalance(amount) {
        // If in iframe, update parent
        if (window.parent && window.parent !== window && window.parent.globalState) {
            window.parent.globalState.setBalance(amount);
        } else if (window.globalState) {
            window.globalState.setBalance(amount);
        } else if (window.currencyManager) {
            window.currencyManager.setBalance(amount);
        } else {
            localStorage.setItem('unified_balance', amount.toString());
        }
        this.updateBalanceDisplay();
    },

    // Update balance display (delegates to global state - single source of truth)
    updateBalanceDisplay() {
        // Balance is managed exclusively by globalState -> header display
        // No local balance displays should exist
        if (window.globalState) {
            window.globalState.updateAllDisplays();
        } else if (window.parent && window.parent.globalState) {
            window.parent.globalState.updateAllDisplays();
        }
    },

    // Setup category filters
    setupCategoryFilters() {
        const filterButtons = document.querySelectorAll('.shop-cat-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Filter items
                const category = btn.dataset.category;
                this.filterItems(category);
            });
        });
    },

    // Filter shop items by category
    filterItems(category) {
        const sections = document.querySelectorAll('.shop-section');
        
        if (category === 'all') {
            sections.forEach(section => {
                section.style.display = 'block';
            });
        } else {
            sections.forEach(section => {
                const sectionCategory = section.dataset.category;
                if (sectionCategory === category) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        }
    },

    // Purchase item
    purchase(itemId, price) {
        console.log(`🛍️ Attempting to purchase ${itemId} for ${price}`);
        
        // Get global state manager (local or parent)
        const globalState = window.globalState || (window.parent && window.parent.globalState);
        
        if (!globalState) {
            console.error('❌ GlobalStateManager not found! Cannot process purchase.');
            this.showNotification('❌ System error: Please refresh the page', 'error');
            return false;
        }

        // Check balance first
        const currentBalance = globalState.getBalance();
        if (currentBalance < price) {
            this.showNotification(`❌ Insufficient balance! You need ${price.toLocaleString()} coins but have ${currentBalance.toLocaleString()}.`, 'error');
            console.warn(`Purchase failed: Need ${price}, have ${currentBalance}`);
            return false;
        }
        
        // Deduct coins through GlobalStateManager
        const result = globalState.deductCoins(price, `Purchased ${this.getItemName(itemId)}`, {
            type: 'shop_purchase',
            itemId: itemId,
            itemName: this.getItemName(itemId),
            category: 'booster',
            timestamp: Date.now()
        });
        
        if (result === false) {
            console.error('❌ Failed to deduct coins');
            this.showNotification('❌ Purchase failed. Please try again.', 'error');
            return false;
        }

        console.log(`✅ Coins deducted. New balance: ${result}`);

        // Get complete item data from asset mappings
        const assetData = window.getAssetData ? window.getAssetData(itemId) : null;
        
        // Determine correct category for inventory
        let inventoryType = 'booster';
        if (itemId === 'streak-shield' || itemId === '1000-coins') {
            inventoryType = 'consumable';
        } else if (assetData && assetData.category) {
            inventoryType = assetData.category.replace(/s$/, ''); // Convert plural to singular
        }

        // Add to inventory through GlobalStateManager (single source of truth)
        const itemAdded = globalState.addItem({
            item_id: itemId,
            item_name: assetData ? assetData.name : this.getItemName(itemId),
            item_type: inventoryType,
            quantity: 1,
            metadata: { 
                price: price,
                purchasedAt: Date.now(),
                imageUrl: assetData ? assetData.imageUrl : null,
                description: assetData ? assetData.description : '',
                duration: assetData ? assetData.duration : null
            }
        });

        if (!itemAdded) {
            console.warn('⚠️ Item not added to inventory (possibly failed)');
        } else {
            console.log(`✅ Item added to inventory: ${itemId} (${inventoryType})`);
        }

        // Apply item effect (activates booster if applicable)
        this.applyItemEffect(itemId);

        // Show success
        this.showNotification(`✅ Purchase successful! ${this.getItemName(itemId)} activated!`, 'success');

        // Update balance display
        this.updateBalanceDisplay();
        
        // Force refresh inventory display if on that tab
        if (window.profileInventory && typeof window.profileInventory.renderInventorySection === 'function') {
            setTimeout(() => window.profileInventory.renderInventorySection(), 100);
        }

        return true;
    },

    // Purchase avatar
    purchaseAvatar(itemId, price, tier) {
        console.log(`🛍️ Attempting to purchase avatar ${itemId} for ${price}`);
        
        // Get global state manager (local or parent)
        const globalState = window.globalState || (window.parent && window.parent.globalState);

        if (!globalState) {
            console.error('❌ GlobalStateManager not found!');
            this.showNotification('❌ System error: Please refresh the page', 'error');
            return false;
        }

        // Check balance first
        const currentBalance = globalState.getBalance();
        if (currentBalance < price) {
            this.showNotification(`❌ Insufficient balance! You need ${price.toLocaleString()} coins but have ${currentBalance.toLocaleString()}.`, 'error');
            return false;
        }

        // Deduct coins through GlobalStateManager
        const result = globalState.deductCoins(price, `Purchased ${this.getItemName(itemId)}`, {
            type: 'shop_purchase',
            itemId: itemId,
            itemName: this.getItemName(itemId),
            category: 'avatar',
            tier: tier
        });
            
        if (result === false) {
            console.error('❌ Failed to deduct coins for avatar');
            return false;
        }

        console.log(`✅ Coins deducted for avatar. New balance: ${result}`);

        // Add to inventory through GlobalStateManager (single source of truth)
        const itemAdded = globalState.addItem({
            item_id: itemId,
            item_name: this.getItemName(itemId),
            item_type: 'avatar',
            quantity: 1,
            metadata: { 
                tier: tier,
                price: price,
                purchasedAt: Date.now()
            }
        });

        if (!itemAdded) {
            console.warn('⚠️ Avatar not added to inventory (possibly failed)');
        } else {
            console.log(`✅ Avatar added to inventory: ${itemId}`);
        }

        // Show success with option to equip
        this.showNotification(`✅ Avatar unlocked! ${this.getItemName(itemId)} added to your collection!`, 'success');

        // Update button to show owned
        const button = document.querySelector(`[data-item-id="${itemId}"] .btn-buy`);
        if (button) {
            button.textContent = '✓ Owned';
            button.disabled = true;
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
        }

        // Log purchase
        this.logPurchase(itemId, price);

        // Update balance display
        this.updateBalanceDisplay();
    },

    // Apply item effect
    applyItemEffect(itemId) {
        const effects = {
            'coin-2x': {
                type: 'multiplier',
                stat: 'coins',
                value: 2,
                duration: 3600000 // 1 hour in ms
            },
            'coin-3x': {
                type: 'multiplier',
                stat: 'coins',
                value: 3,
                duration: 3600000
            },
            'xp-2x': {
                type: 'multiplier',
                stat: 'xp',
                value: 2,
                duration: 7200000 // 2 hours
            },
            'mega-pack': {
                type: 'multiplier',
                stat: 'both',
                coinValue: 2,
                xpValue: 2,
                duration: 10800000 // 3 hours
            },
            'streak-shield': {
                type: 'protection',
                stat: 'streak',
                uses: 1
            },
            'xp-booster-coin': {
                type: 'xp-boost',
                stat: 'xp',
                value: 2,
                duration: 3600000 // 1 hour
            },
            'blue-diamond-ring': {
                type: 'permanent-xp',
                stat: 'xp',
                bonus: 0.03 // 3% permanent XP boost
            },
            'championship-ring': {
                type: 'cosmetic',
                stat: 'badge',
                value: 'championship-ring'
            },
            'golden-coin': {
                type: 'permanent',
                stat: 'coins',
                bonus: 0.05 // 5% permanent bonus
            }
        };

        const effect = effects[itemId];
        if (!effect) return;

        // Save active booster
        if (effect.type === 'multiplier') {
            const activeBoosters = this.getActiveBoosters();
            activeBoosters.push({
                id: itemId,
                name: this.getItemName(itemId),
                stat: effect.stat,
                value: effect.coinValue || effect.value,
                xpValue: effect.xpValue,
                startTime: Date.now(),
                endTime: Date.now() + effect.duration,
                duration: effect.duration
            });
            localStorage.setItem('activeBoosters', JSON.stringify(activeBoosters));
        }

        // Handle XP Booster Coin
        if (effect.type === 'xp-boost') {
            if (window.achievementsSystem) {
                window.achievementsSystem.activateXPBoost(1); // 1 hour
            } else {
                console.warn('Achievements system not loaded');
            }
        }

        // Handle Blue Diamond Ring (permanent XP boost)
        if (effect.type === 'permanent-xp') {
            const globalState = window.globalState || (window.parent && window.parent.globalState);
            if (globalState && typeof globalState.addPermanentBonus === 'function') {
                globalState.addPermanentBonus('xp', effect.bonus);
                this.showNotification(`💎 You now have a permanent +${effect.bonus * 100}% XP boost!`, 'success');
            } else if (window.achievementsSystem) {
                window.achievementsSystem.addPermanentXPBoost(effect.bonus * 100); // Convert to percentage
                this.showNotification(`💎 You now have a permanent +${effect.bonus * 100}% XP boost!`, 'success');
            } else {
                console.warn('Global state or Achievements system not loaded');
            }
        }

        // Save protection items
        if (effect.type === 'protection') {
            const protections = JSON.parse(localStorage.getItem('protections') || '{}');
            protections[effect.stat] = (protections[effect.stat] || 0) + effect.uses;
            localStorage.setItem('protections', JSON.stringify(protections));
        }

        // Save cosmetic items
        if (effect.type === 'cosmetic') {
            const cosmetics = JSON.parse(localStorage.getItem('cosmetics') || '[]');
            if (!cosmetics.includes(effect.value)) {
                cosmetics.push(effect.value);
                localStorage.setItem('cosmetics', JSON.stringify(cosmetics));
            }
        }

        // Save permanent bonuses
        if (effect.type === 'permanent') {
            const globalState = window.globalState || (window.parent && window.parent.globalState);
            if (globalState && typeof globalState.addPermanentBonus === 'function') {
                globalState.addPermanentBonus('coins', effect.bonus);
                this.showNotification(`💰 You now have a permanent +${effect.bonus * 100}% Coin boost!`, 'success');
            } else {
                const permanentBonuses = JSON.parse(localStorage.getItem('permanentBonuses') || '{}');
                permanentBonuses[effect.stat] = (permanentBonuses[effect.stat] || 0) + effect.bonus;
                localStorage.setItem('permanentBonuses', JSON.stringify(permanentBonuses));
                this.showNotification(`💰 You now have a permanent +${effect.bonus * 100}% Coin boost!`, 'success');
            }
        }
    },

    // Purchase coins with real money via PayPal
    purchaseCoins(packageName, coins, priceUSD) {
        console.log(`💳 Initiating coin purchase: ${packageName} - ${coins} coins for $${priceUSD}`);

        // Wait for PayPal shop if not ready
        if (!window.PayPalShop) {
            this.showNotification('⏳ Loading payment system...', 'info');
            setTimeout(() => this.purchaseCoins(packageName, coins, priceUSD), 1000);
            return;
        }

        // Check if PayPal integration is available and initialized
        if (window.PayPalShop) {
            // Use PayPal integration
            const item = {
                id: `coins-${packageName}`,
                name: `${coins.toLocaleString()} Ultimate Coins`,
                description: `${packageName} coin bundle`,
                price: coins, // Used for logging
                coins: coins
            };
            
            this.showNotification('💳 Opening PayPal checkout...', 'info');
            
            // Create PayPal button dynamically
            const modalId = `paypal-modal-${Date.now()}`;
            const containerId = `paypal-btn-${Date.now()}`;
            
            const modalHtml = `
                <div class="paypal-modal" id="${modalId}" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 999999; display: flex; align-items: center; justify-content: center;">
                    <div style="background: var(--bg-card); border-radius: 16px; padding: 32px; max-width: 500px; width: 90%; border: 1px solid var(--border-color); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            <h2 style="margin: 0; color: var(--text-primary);">Purchase Coins</h2>
                            <button onclick="document.getElementById('${modalId}').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">×</button>
                        </div>
                        <div style="text-align: center; margin-bottom: 24px;">
                            <div style="font-size: 48px; margin-bottom: 16px;">💰</div>
                            <h3 style="margin: 0 0 8px; color: var(--text-primary);">${coins.toLocaleString()} Ultimate Coins</h3>
                            <p style="color: var(--text-secondary); margin: 0;">$${priceUSD} USD</p>
                        </div>
                        <div id="${containerId}" style="min-height: 150px; display: flex; justify-content: center; align-items: center;">
                            <div class="spinner"></div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Render PayPal button in modal
            // We pass the actual USD price here
            const payPalItem = { ...item, price: priceUSD * 1000, dealPrice: priceUSD * 1000 }; // Hack: coinsToUSD divides by 1000
            
            // Initialize button
            setTimeout(() => {
                const container = document.getElementById(containerId);
                if (container) container.innerHTML = ''; // Clear spinner
                window.PayPalShop.createPayPalButton(containerId, {
                    ...item,
                    price: priceUSD * 1000 // Ensure logic in PayPalShop converts back to correct USD
                });
            }, 500);
            
        } else {
            // Fallback: simulate purchase for testing
            this.showNotification('⚠️ PayPal not configured. Using test mode...', 'info');
            
            setTimeout(() => {
                this.completeCoinPurchase(packageName, coins, priceUSD);
            }, 1500);
        }
    },

    // Complete coin purchase (called after PayPal success)
    completeCoinPurchase(packageName, coins, priceUSD) {
        // Get global state manager (local or parent)
        const globalState = window.globalState || (window.parent && window.parent.globalState);

        // Add coins using unified currency manager
        if (globalState && typeof globalState.addCoins === 'function') {
            globalState.addCoins(coins, `Purchased ${packageName} bundle`, {
                type: 'purchase',
                package: packageName,
                priceUSD: priceUSD
            });
        } else {
            // Fallback for legacy/disconnected state
            const balance = this.getUserBalance();
            this.setUserBalance(balance + coins);
        }

        // Add to profile inventory
        const profileInventory = window.profileInventory || (window.parent && window.parent.profileInventory);
        if (profileInventory) {
            profileInventory.addItem('purchaseHistory', {
                type: 'coins',
                package: packageName,
                coins: coins,
                priceUSD: priceUSD,
                purchaseDate: Date.now()
            });
        }

        // Track purchase for achievements
        const achievementsSystem = window.achievementsSystem || (window.parent && window.parent.achievementsSystem);
        if (achievementsSystem) {
            // Check if stats object exists, if not initialize it (simple fallback)
            if (!achievementsSystem.userStats) achievementsSystem.userStats = { itemsPurchased: 0 };
            
            achievementsSystem.userStats.itemsPurchased++;
            if (achievementsSystem.saveStats) achievementsSystem.saveStats();
            if (achievementsSystem.unlockAchievement) achievementsSystem.unlockAchievement('shop-first');
        }

        // Log purchase
        this.logPurchase(`coins-${packageName}`, priceUSD, 'usd');

        // Update display
        this.updateBalanceDisplay();

        // Show success
        this.showNotification(`✅ Purchase complete! Added ${coins.toLocaleString()} Ultimate Coins!`, 'success');

        // Close modal if exists
        const modal = document.querySelector('.paypal-modal');
        if (modal) modal.remove();
    },

    // Get item name
    getItemName(itemId) {
        const names = {
            'coin-2x': '2x Coin Booster',
            'coin-3x': '3x Coin Booster',
            'xp-2x': '2x XP Booster',
            'mega-pack': 'Mega Booster Pack',
            'streak-shield': 'Streak Shield',
            'xp-booster-coin': 'XP Booster Coin',
            'blue-diamond-ring': 'Blue Diamond Ring',
            'championship-ring': 'Championship Ring',
            'golden-coin': 'Golden Diamond Coin',
            'jordan-1': 'Jordan 1 Icon',
            'js-4': "J's 4 Avatar",
            'king-chess': 'King Chess Piece',
            'lucky-charm': 'Lucky Charm',
            'crown': 'Ultimate Crown',
            'money-tree': 'Money Tree',
            'scrooge': 'Scrooge McDuck',
            'game-boys': 'Game Boys Stack',
            'gotrich': 'Gotrich Baller',
            'guccii-duffel': 'Guccii Duffel'
        };
        return names[itemId] || itemId;
    },

    // Get active boosters
    getActiveBoosters() {
        const boosters = JSON.parse(localStorage.getItem('activeBoosters') || '[]');
        // Filter out expired boosters
        const now = Date.now();
        const activeBoosters = boosters.filter(b => b.endTime > now);
        
        // Update localStorage if any were removed
        if (activeBoosters.length !== boosters.length) {
            localStorage.setItem('activeBoosters', JSON.stringify(activeBoosters));
        }
        
        return activeBoosters;
    },

    // Update booster timers
    updateBoosterTimers() {
        setInterval(() => {
            const boosters = this.getActiveBoosters();
            if (boosters.length > 0) {
                console.log(`Active boosters: ${boosters.length}`);
            }
        }, 60000); // Check every minute
    },

    // Load active boosters display
    loadActiveBoosters() {
        // Could show active boosters in UI
        const boosters = this.getActiveBoosters();
        console.log(`${boosters.length} active boosters`);
    },

    // Add item to inventory
    addToInventory(type, itemId, tier) {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
        if (!inventory[type]) {
            inventory[type] = [];
        }
        
        if (!inventory[type].includes(itemId)) {
            inventory[type].push(itemId);
            localStorage.setItem('inventory', JSON.stringify(inventory));
        }
    },

    // Log purchase
    logPurchase(itemId, price) {
        const purchases = JSON.parse(localStorage.getItem('shopPurchases') || '[]');
        purchases.push({
            itemId,
            price,
            timestamp: Date.now(),
            name: this.getItemName(itemId)
        });
        localStorage.setItem('shopPurchases', JSON.stringify(purchases));
    },

    // Show notification
    showNotification(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            z-index: 99999;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Apply coin multiplier
    applyMultiplier(baseAmount) {
        const boosters = this.getActiveBoosters();
        const permanentBonuses = JSON.parse(localStorage.getItem('permanentBonuses') || '{}');
        
        let multiplier = 1;
        
        // Add active boosters
        boosters.forEach(booster => {
            if (booster.stat === 'coins' || booster.stat === 'both') {
                multiplier *= booster.value;
            }
        });
        
        // Add permanent bonuses
        if (permanentBonuses.coins) {
            multiplier += permanentBonuses.coins;
        }
        
        return Math.floor(baseAmount * multiplier);
    },

    // Get protection count
    getProtectionCount(type) {
        const protections = JSON.parse(localStorage.getItem('protections') || '{}');
        return protections[type] || 0;
    },

    // Use protection
    useProtection(type) {
        const protections = JSON.parse(localStorage.getItem('protections') || '{}');
        if (protections[type] && protections[type] > 0) {
            protections[type]--;
            localStorage.setItem('protections', JSON.stringify(protections));
            return true;
        }
        return false;
    }
};

// Expose ShopSystem globally
window.ShopSystem = ShopSystem;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof ShopSystem.init === 'function') {
            ShopSystem.init();
        }
    });
} else {
    // DOM already loaded
    if (typeof ShopSystem.init === 'function') {
        ShopSystem.init();
    }
}

console.log('✅ ShopSystem loaded and available globally');

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize shop when page loads
document.addEventListener('DOMContentLoaded', () => {
    ShopSystem.init();
    ShopSystem.updateBalanceDisplay();
});

// Export for global access
window.ShopSystem = ShopSystem;

console.log('✅ Shop System Loaded');
