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
        if (window.currencyManager) {
            return window.currencyManager.getBalance();
        }
        // Fallback
        return parseInt(localStorage.getItem('ultimateCoins') || '1000');
    },

    // Set user balance (use unified currency system)
    setUserBalance(amount) {
        if (window.currencyManager) {
            window.currencyManager.setBalance(amount);
        } else {
            localStorage.setItem('ultimateCoins', amount.toString());
        }
        this.updateBalanceDisplay();
    },

    // Update balance display
    updateBalanceDisplay() {
        if (window.currencyManager) {
            window.currencyManager.updateAllDisplays();
        } else {
            const balance = this.getUserBalance();
            const balanceElements = document.querySelectorAll('.profile-coins, .balance-amount');
            balanceElements.forEach(el => {
                el.textContent = balance.toLocaleString();
            });
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
        // Use unified currency system
        if (window.currencyManager) {
            const result = window.currencyManager.deductCoins(price, `Purchased ${this.getItemName(itemId)}`);
            if (result === false) {
                this.showNotification(`❌ Insufficient balance! You need ${price.toLocaleString()} Ultimate Coins.`, 'error');
                return;
            }
        } else {
            const balance = this.getUserBalance();
            if (balance < price) {
                this.showNotification(`❌ Insufficient balance! You need ${price.toLocaleString()} coins.`, 'error');
                return;
            }
            this.setUserBalance(balance - price);
        }

        // Apply item effect
        this.applyItemEffect(itemId);

        // Add to profile inventory if available
        if (window.ProfileInventory) {
            window.ProfileInventory.addItem('boosters', {
                id: itemId,
                name: this.getItemName(itemId),
                price: price,
                purchaseDate: Date.now()
            });
        }

        // Show success
        this.showNotification(`✅ Purchase successful! ${this.getItemName(itemId)} activated!`, 'success');

        // Log purchase
        this.logPurchase(itemId, price);

        // Update balance display
        this.updateBalanceDisplay();
    },

    // Purchase avatar
    purchaseAvatar(itemId, price, tier) {
        // Use unified currency system
        if (window.currencyManager) {
            const result = window.currencyManager.deductCoins(price, `Purchased ${this.getItemName(itemId)}`);
            if (result === false) {
                this.showNotification(`❌ Insufficient balance! You need ${price.toLocaleString()} Ultimate Coins.`, 'error');
                return;
            }
        } else {
            const balance = this.getUserBalance();
            if (balance < price) {
                this.showNotification(`❌ Insufficient balance! You need ${price.toLocaleString()} coins.`, 'error');
                return;
            }
            this.setUserBalance(balance - price);
        }

        // Save avatar to inventory
        this.addToInventory('avatar', itemId, tier);

        // Add to profile inventory if available
        if (window.ProfileInventory) {
            window.ProfileInventory.addItem('avatars', {
                id: itemId,
                name: this.getItemName(itemId),
                price: price,
                tier: tier,
                purchaseDate: Date.now()
            });
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
            if (window.achievementsSystem) {
                window.achievementsSystem.addPermanentXPBoost(effect.bonus * 100); // Convert to percentage
                this.showNotification(`💎 You now have a permanent +${effect.bonus * 100}% XP boost!`, 'success');
            } else {
                console.warn('Achievements system not loaded');
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
            const permanentBonuses = JSON.parse(localStorage.getItem('permanentBonuses') || '{}');
            permanentBonuses[effect.stat] = (permanentBonuses[effect.stat] || 0) + effect.bonus;
            localStorage.setItem('permanentBonuses', JSON.stringify(permanentBonuses));
        }
    },

    // Purchase coins with real money via PayPal
    purchaseCoins(packageName, coins, priceUSD) {
        console.log(`💳 Initiating coin purchase: ${packageName} - ${coins} coins for $${priceUSD}`);

        // Check if PayPal integration is available
        if (window.PayPalShop && window.PayPalShop.initialized) {
            // Use PayPal integration
            const item = {
                id: `coins-${packageName}`,
                name: `${coins.toLocaleString()} Ultimate Coins`,
                description: `${packageName} coin bundle`,
                price: coins,
                coins: coins
            };
            
            this.showNotification('💳 Opening PayPal checkout...', 'info');
            
            // Create PayPal button dynamically
            const modalHtml = `
                <div class="paypal-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 999999; display: flex; align-items: center; justify-content: center;">
                    <div style="background: var(--bg-card); border-radius: 16px; padding: 32px; max-width: 500px; width: 90%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            <h2 style="margin: 0;">Purchase Coins</h2>
                            <button onclick="this.closest('.paypal-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">×</button>
                        </div>
                        <div style="text-align: center; margin-bottom: 24px;">
                            <div style="font-size: 48px; margin-bottom: 16px;">💰</div>
                            <h3 style="margin: 0 0 8px;">${coins.toLocaleString()} Ultimate Coins</h3>
                            <p style="color: var(--text-secondary); margin: 0;">$${priceUSD} USD</p>
                        </div>
                        <div id="paypal-button-container-${packageName}"></div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Render PayPal button in modal
            window.PayPalShop.createPayPalButton(`paypal-button-container-${packageName}`, item);
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
        // Add coins using unified currency manager
        if (window.currencyManager) {
            window.currencyManager.addCoins(coins, `Purchased ${packageName} bundle`);
        } else {
            const balance = this.getUserBalance();
            this.setUserBalance(balance + coins);
        }

        // Add to profile inventory
        if (window.ProfileInventory) {
            window.ProfileInventory.addItem('purchaseHistory', {
                type: 'coins',
                package: packageName,
                coins: coins,
                priceUSD: priceUSD,
                purchaseDate: Date.now()
            });
        }

        // Track purchase for achievements
        if (window.achievementsSystem) {
            window.achievementsSystem.userStats.itemsPurchased++;
            window.achievementsSystem.saveStats();
            window.achievementsSystem.unlockAchievement('shop-first');
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
