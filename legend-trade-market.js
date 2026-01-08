/**
 * LegendTradeMarket - Global State Managed Trading Market
 * Handles cross-minigame legendary card trading and global listings.
 */
export class LegendTradeMarket {
    constructor() {
        this.trades = this.loadTrades();
        this.listeners = [];
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        console.log('🏛️ LegendTradeMarket Initialized');
        this.initialized = true;
        
        // Initial trade generation if empty
        if (this.trades.length === 0) {
            this.generateInitialTrades();
        }
    }

    loadTrades() {
        try {
            const saved = localStorage.getItem('ultimate_legend_market');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load market trades:', e);
            return [];
        }
    }

    saveTrades() {
        localStorage.setItem('ultimate_legend_market', JSON.stringify(this.trades));
        this.notifyListeners();
    }

    generateInitialTrades() {
        // Mock some high-value legendary trades from "System" or AI users
        const mockTraders = ['GridironPro', 'LegendHunter', 'StatsWhiz', 'ChampGM'];
        const legends = [
            { id: 'brady', name: 'Tom Brady', icon: '🏆', rarity: 'Legendary', OVR: 99 },
            { id: 'rice', name: 'Jerry Rice', icon: '🔥', rarity: 'Legendary', OVR: 99 },
            { id: 'sanders', name: 'Barry Sanders', icon: '💨', rarity: 'Legendary', OVR: 98 },
            { id: 'lewis', name: 'Ray Lewis', icon: '⚔️', rarity: 'Legendary', OVR: 97 }
        ];

        for (let i = 0; i < 5; i++) {
            const offer = legends[Math.floor(Math.random() * legends.length)];
            const request = legends[Math.floor(Math.random() * legends.length)];
            if (offer.id === request.id) continue;

            this.trades.push({
                id: `trade_${Math.random().toString(36).substr(2, 9)}`,
                trader: mockTraders[Math.floor(Math.random() * mockTraders.length)],
                offer,
                request,
                expires: Date.now() + (48 * 60 * 60 * 1000), // 48 hours
                verified: true
            });
        }
        this.saveTrades();
    }

    getTrades() {
        return this.trades.filter(t => t.expires > Date.now());
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notifyListeners() {
        const activeTrades = this.getTrades();
        this.listeners.forEach(l => l(activeTrades));
    }

    async proposeTrade(offerCard, requestCard) {
        // Implementation for user proposing a trade to the global market
        const newTrade = {
            id: `user_trade_${Date.now()}`,
            trader: window.globalState?.state?.user?.username || 'GuestUser',
            offer: offerCard,
            request: requestCard,
            expires: Date.now() + (24 * 60 * 60 * 1000),
            verified: false
        };

        this.trades.push(newTrade);
        this.saveTrades();
        return { success: true, trade: newTrade };
    }

    acceptTrade(tradeId) {
        const index = this.trades.findIndex(t => t.id === tradeId);
        if (index === -1) return { success: false, message: 'Trade not found or expired' };

        const trade = this.trades[index];
        
        // Remove from market
        this.trades.splice(index, 1);
        this.saveTrades();
        
        return { success: true, trade };
    }
}

// Export singleton instance if needed, but index.html expects the class
export default LegendTradeMarket;
