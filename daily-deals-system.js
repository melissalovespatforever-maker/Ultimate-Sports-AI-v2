/**
 * DAILY DEALS SYSTEM
 * Limited-time discount offers that rotate daily with countdown timers
 * Features: Daily reset, limited stock, urgency indicators, exclusive deals
 */

const DailyDealsSystem = {
    
    // Deal database with pricing and discount info
    dealDatabase: [
        {
            id: 'coin-2x-deal',
            name: '2x Coin Booster',
            normalPrice: 500,
            dealPrice: 299,
            category: 'boosters',
            icon: '💰',
            discount: 40,
            emoji: '💰',
            stock: 50,
            description: 'Double coin earnings',
            tier: 'standard',
            type: 'time-limited'
        },
        {
            id: 'xp-2x-deal',
            name: '2x XP Booster',
            normalPrice: 400,
            dealPrice: 219,
            category: 'boosters',
            icon: '📈',
            discount: 45,
            stock: 50,
            description: 'Double XP gains',
            tier: 'standard',
            type: 'time-limited'
        },
        {
            id: 'mega-pack-deal',
            name: 'Mega Booster Pack',
            normalPrice: 800,
            dealPrice: 449,
            category: 'boosters',
            icon: '🎁',
            discount: 44,
            stock: 30,
            description: '2x Coins + 2x XP',
            tier: 'pro',
            type: 'time-limited'
        },
        {
            id: 'jordan-1-deal',
            name: 'Jordan 1 Icon',
            normalPrice: 1500,
            dealPrice: 999,
            category: 'avatars',
            icon: '👟',
            discount: 33,
            stock: 20,
            description: 'Legendary sneaker',
            tier: 'pro',
            type: 'limited-stock'
        },
        {
            id: 'crown-deal',
            name: 'Ultimate Crown',
            normalPrice: 2500,
            dealPrice: 1599,
            category: 'avatars',
            icon: '👑',
            discount: 36,
            stock: 15,
            description: 'Royalty in game',
            tier: 'pro',
            type: 'limited-stock'
        },
        {
            id: 'money-tree-deal',
            name: 'Money Tree',
            normalPrice: 5000,
            dealPrice: 2999,
            category: 'avatars',
            icon: '🌳',
            discount: 40,
            stock: 10,
            description: 'Wealth avatar',
            tier: 'vip',
            type: 'limited-stock'
        },
        {
            id: 'scrooge-deal',
            name: 'Scrooge McDuck',
            normalPrice: 6000,
            dealPrice: 3499,
            category: 'avatars',
            icon: '🦆',
            discount: 42,
            stock: 10,
            description: 'Swimming in wealth',
            tier: 'vip',
            type: 'limited-stock'
        },
        {
            id: 'streak-shield-deal',
            name: 'Streak Shield',
            normalPrice: 600,
            dealPrice: 349,
            category: 'boosters',
            icon: '🛡️',
            discount: 42,
            stock: 40,
            description: 'Protect your streak',
            tier: 'standard',
            type: 'time-limited'
        },
        {
            id: 'championship-ring-deal',
            name: 'Championship Ring',
            normalPrice: 25000,
            dealPrice: 14999,
            category: 'exclusive',
            icon: '💎',
            discount: 40,
            stock: 5,
            description: 'Symbol of victory',
            tier: 'exclusive',
            type: 'lightning-deal'
        },
        {
            id: 'golden-coin-deal',
            name: 'Golden Diamond Coin',
            normalPrice: 50000,
            dealPrice: 29999,
            category: 'exclusive',
            icon: '🏆',
            discount: 40,
            stock: 3,
            description: '+5% permanent bonus',
            tier: 'exclusive',
            type: 'lightning-deal'
        },

    ],

    // Get today's date as a simple day counter
    getTodayKey() {
        const date = new Date();
        return Math.floor(date.getTime() / (1000 * 60 * 60 * 24)); // Day number since epoch
    },

    // Get featured deals for today (shuffled but consistent daily)
    getFeaturedDeals() {
        const dayKey = this.getTodayKey();
        
        // Seed random number generator with day key
        const seededRandom = (seed) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        // Select 6 random deals based on day
        const shuffled = this.dealDatabase
            .map((deal, idx) => ({
                deal,
                sort: seededRandom(dayKey * 997 + idx * 13)
            }))
            .sort((a, b) => a.sort - b.sort)
            .slice(0, 6)
            .map(item => item.deal);

        return shuffled;
    },

    // Get deals by category
    getDealsByCategory(category) {
        return this.getFeaturedDeals().filter(deal => deal.category === category);
    },

    // Sync stock from backend
    async syncStockFromBackend() {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            
            if (!token) return; // No auth, use localStorage
            
            const response = await fetch(`${window.API_BASE_URL}/api/shop/deals/stock`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.stock) {
                    // Update localStorage with backend stock levels
                    Object.keys(data.stock).forEach(dealId => {
                        localStorage.setItem(`dealStock_${dealId}`, data.stock[dealId].toString());
                        localStorage.setItem(`dealStockDay_${dealId}`, this.getTodayKey().toString());
                    });
                    console.log('✅ Daily deals stock synced from backend');
                }
            }
        } catch (error) {
            console.warn('Could not sync stock from backend:', error);
            // Continue with localStorage
        }
    },

    // Get time remaining until next daily reset (midnight)
    getTimeUntilReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilReset = tomorrow - now;
        const hoursLeft = Math.floor(msUntilReset / (1000 * 60 * 60));
        const minutesLeft = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((msUntilReset % (1000 * 60)) / 1000);

        return {
            ms: msUntilReset,
            hours: hoursLeft,
            minutes: minutesLeft,
            seconds: secondsLeft,
            formatted: `${hoursLeft}h ${minutesLeft}m`
        };
    },

    // Get stock level for a deal
    getDealStock(dealId) {
        const key = `dealStock_${dealId}`;
        const stored = parseInt(localStorage.getItem(key) || '');
        
        if (isNaN(stored)) {
            // First time - set initial stock for today
            const deal = this.dealDatabase.find(d => d.id === dealId);
            if (deal) {
                localStorage.setItem(key, deal.stock.toString());
                localStorage.setItem(`dealStockDay_${dealId}`, this.getTodayKey().toString());
                return deal.stock;
            }
            return 0;
        }

        // Check if it's a new day
        const storedDay = parseInt(localStorage.getItem(`dealStockDay_${dealId}`) || '0');
        if (storedDay !== this.getTodayKey()) {
            // New day - reset stock
            const deal = this.dealDatabase.find(d => d.id === dealId);
            if (deal) {
                localStorage.setItem(key, deal.stock.toString());
                localStorage.setItem(`dealStockDay_${dealId}`, this.getTodayKey().toString());
                return deal.stock;
            }
        }

        return stored;
    },

    // Reduce stock for a deal
    reduceStock(dealId) {
        const current = this.getDealStock(dealId);
        if (current > 0) {
            localStorage.setItem(`dealStock_${dealId}`, (current - 1).toString());
            return true;
        }
        return false;
    },

    // Purchase a deal
    async purchaseDeal(dealId) {
        const balance = ShopSystem.getUserBalance();
        const deal = this.dealDatabase.find(d => d.id === dealId);

        if (!deal) {
            ShopSystem.showNotification('❌ Deal not found!', 'error');
            return false;
        }

        const stock = this.getDealStock(dealId);
        if (stock <= 0) {
            ShopSystem.showNotification('❌ This deal has sold out!', 'error');
            return false;
        }

        if (balance < deal.dealPrice) {
            ShopSystem.showNotification(
                `❌ Need ${deal.dealPrice.toLocaleString()} coins. You have ${balance.toLocaleString()}`,
                'error'
            );
            return false;
        }

        // Try to purchase via backend API
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            
            if (token) {
                const response = await fetch(`${window.API_BASE_URL}/api/shop/deals/purchase`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        dealId: dealId,
                        dealName: deal.name,
                        normalPrice: deal.normalPrice,
                        dealPrice: deal.dealPrice,
                        discount: deal.discount,
                        category: deal.category
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Update balance from server response
                    ShopSystem.setUserBalance(data.newBalance);
                    
                    // Update stock display
                    this.reduceStock(dealId);
                    
                    // Show success with savings info
                    ShopSystem.showNotification(
                        `✅ Deal! Saved ${data.savings.toLocaleString()} coins! 🎉`,
                        'success'
                    );
                    
                    return true;
                } else {
                    const error = await response.json();
                    ShopSystem.showNotification(`❌ ${error.error || 'Purchase failed'}`, 'error');
                    return false;
                }
            }
        } catch (error) {
            console.warn('Backend purchase failed, using fallback:', error);
        }

        // Fallback to localStorage if backend fails or no token
        // Deduct coins
        ShopSystem.setUserBalance(balance - deal.dealPrice);

        // Reduce stock
        this.reduceStock(dealId);

        // Apply the actual deal (use normal item ID for effect)
        const normalItemId = deal.id.replace('-deal', '');
        ShopSystem.applyItemEffect(normalItemId);

        // Save purchase history
        this.logDealPurchase(deal);

        // Show success with savings info
        const savings = deal.normalPrice - deal.dealPrice;
        ShopSystem.showNotification(
            `✅ Deal! Saved ${savings.toLocaleString()} coins! 🎉`,
            'success'
        );

        return true;
    },

    // Log deal purchase
    logDealPurchase(deal) {
        const purchases = JSON.parse(localStorage.getItem('dealPurchases') || '[]');
        purchases.push({
            dealId: deal.id,
            name: deal.name,
            dealPrice: deal.dealPrice,
            normalPrice: deal.normalPrice,
            savings: deal.normalPrice - deal.dealPrice,
            timestamp: Date.now()
        });
        localStorage.setItem('dealPurchases', JSON.stringify(purchases.slice(-50))); // Keep last 50
    },

    // Initialize deals display
    async init() {
        console.log('💝 Daily Deals System initialized');
        
        // Sync stock from backend first
        await this.syncStockFromBackend();
        
        this.renderDealsSection();
        this.startTimerUpdates();
    },

    // Render deals section
    renderDealsSection() {
        const deals = this.getFeaturedDeals();
        const shopGrid = document.querySelector('.shop-grid');
        
        if (!shopGrid) return;

        // Check if deals section exists
        let dealsSection = document.getElementById('deals-section');
        if (!dealsSection) {
            // Create deals section at top
            dealsSection = document.createElement('div');
            dealsSection.id = 'deals-section';
            dealsSection.className = 'daily-deals-container';
            shopGrid.insertBefore(dealsSection, shopGrid.firstChild);
        }

        const timeRemaining = this.getTimeUntilReset();

        dealsSection.innerHTML = `
            <div class="deals-header">
                <div class="deals-title-section">
                    <h2 class="deals-title">
                        <i class="fas fa-bolt"></i> Daily Flash Deals
                        <span class="deals-badge">LIMITED TIME</span>
                    </h2>
                    <p class="deals-subtitle">Exclusive offers that refresh daily!</p>
                </div>
                <div class="countdown-timer">
                    <div class="timer-label">⏰ Resets in</div>
                    <div class="timer-display">
                        <span class="timer-hours">${timeRemaining.hours}</span>h
                        <span class="timer-minutes">${timeRemaining.minutes}</span>m
                        <span class="timer-seconds">${timeRemaining.seconds}</span>s
                    </div>
                </div>
            </div>

            <div class="deals-grid">
                ${deals.map(deal => this.renderDealCard(deal)).join('')}
            </div>
        `;
    },

    // Render individual deal card
    renderDealCard(deal) {
        const stock = this.getDealStock(deal.id);
        const soldOut = stock <= 0;
        const lowStock = stock > 0 && stock <= 5;

        const stockDisplay = soldOut 
            ? '<span class="stock-badge sold-out">SOLD OUT</span>'
            : lowStock
            ? `<span class="stock-badge low-stock">Only ${stock} left!</span>`
            : `<span class="stock-badge">${stock} in stock</span>`;

        const urgencyClass = deal.type === 'lightning-deal' 
            ? 'lightning-deal'
            : lowStock 
            ? 'low-stock-deal'
            : 'standard-deal';

        return `
            <div class="deal-card ${urgencyClass} ${soldOut ? 'sold-out' : ''}" data-deal-id="${deal.id}">
                <div class="deal-header">
                    <span class="deal-discount">-${deal.discount}%</span>
                    ${deal.type === 'lightning-deal' ? '<span class="deal-type">⚡ LIGHTNING</span>' : ''}
                    ${deal.type === 'limited-stock' ? '<span class="deal-type">📦 LIMITED</span>' : ''}
                </div>

                <div class="deal-icon">
                    ${deal.image ? `<img src="${deal.image}" alt="${deal.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">` : deal.emoji || deal.icon}
                </div>

                <h3 class="deal-name">${deal.name}</h3>
                <p class="deal-description">${deal.description}</p>

                <div class="deal-pricing">
                    <span class="deal-normal-price">
                        <span class="price-strike">${deal.normalPrice.toLocaleString()}</span>
                    </span>
                    <span class="deal-price">
                        ${deal.dealPrice.toLocaleString()}
                        <span class="price-currency">🪙</span>
                    </span>
                </div>

                <div class="deal-stock">
                    ${stockDisplay}
                </div>

                <button class="btn-deal-buy ${soldOut ? 'disabled' : ''}" 
                        onclick="DailyDealsSystem.purchaseDeal('${deal.id}')"
                        ${soldOut ? 'disabled' : ''}>
                    ${soldOut ? '❌ SOLD OUT' : `💳 GET DEAL`}
                </button>

                <div class="deal-savings">
                    Save ${(deal.normalPrice - deal.dealPrice).toLocaleString()} coins!
                </div>
            </div>
        `;
    },

    // Update timer display
    updateTimers() {
        const timers = document.querySelectorAll('.timer-hours, .timer-minutes, .timer-seconds');
        if (timers.length === 0) return;

        const timeRemaining = this.getTimeUntilReset();

        const hoursEl = document.querySelector('.timer-hours');
        const minutesEl = document.querySelector('.timer-minutes');
        const secondsEl = document.querySelector('.timer-seconds');

        if (hoursEl) hoursEl.textContent = String(timeRemaining.hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(timeRemaining.minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(timeRemaining.seconds).padStart(2, '0');

        // Update timer display color based on urgency
        const timerDisplay = document.querySelector('.timer-display');
        if (timerDisplay && timeRemaining.hours < 1) {
            timerDisplay.style.color = '#ef4444'; // Red for last hour
        }
    },

    // Start continuous timer updates
    startTimerUpdates() {
        this.updateTimers();
        setInterval(() => this.updateTimers(), 1000);

        // Check daily reset at midnight
        const resetCheck = setInterval(() => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                this.renderDealsSection();
                clearInterval(resetCheck);
                this.startTimerUpdates();
            }
        }, 60000); // Check every minute
    },

    // Get all deals purchased today
    getPurchasedDealsToday() {
        const purchases = JSON.parse(localStorage.getItem('dealPurchases') || '[]');
        const todayKey = this.getTodayKey();
        
        return purchases.filter(p => {
            const purchaseDay = Math.floor(p.timestamp / (1000 * 60 * 60 * 24));
            return purchaseDay === todayKey;
        });
    },

    // Get total savings from deals today
    getTotalSavingsToday() {
        return this.getPurchasedDealsToday()
            .reduce((total, p) => total + p.savings, 0);
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => DailyDealsSystem.init(), 500);
});

// Export for global access
window.DailyDealsSystem = DailyDealsSystem;

console.log('✅ Daily Deals System Loaded');
