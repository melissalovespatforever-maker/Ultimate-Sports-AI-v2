/* ============================================
   REAL-TIME ODDS CLIENT
   WebSocket client for live betting odds
   ============================================ */

class LiveOddsClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.subscriptions = new Set();
        this.oddsCache = new Map();
        this.lineMovements = new Map();
        this.callbacks = {
            onUpdate: [],
            onMovement: [],
            onConnect: [],
            onDisconnect: [],
            onError: []
        };
        
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
    }

    // ============================================
    // CONNECTION
    // ============================================

    connect() {
        if (this.socket && this.connected) {
            console.log('✅ Already connected to odds WebSocket');
            return;
        }

        try {
            // Get backend URL
            const backendUrl = window.api?.backendUrl || 'http://localhost:3001';
            
            console.log('🔌 Connecting to live odds WebSocket...');
            
            this.socket = io(backendUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
                timeout: 10000
            });

            this.setupEventListeners();

        } catch (error) {
            console.error('❌ Failed to connect to odds WebSocket:', error);
            this.triggerCallbacks('onError', { error: error.message });
        }
    }

    setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Connected to live odds WebSocket');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.triggerCallbacks('onConnect');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from odds WebSocket:', reason);
            this.connected = false;
            this.triggerCallbacks('onDisconnect', { reason });
            
            if (reason === 'io server disconnect') {
                this.socket.connect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Odds WebSocket connection error:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('❌ Max reconnection attempts reached');
                this.triggerCallbacks('onError', { 
                    error: 'Failed to connect after multiple attempts' 
                });
            }
        });

        // Odds events
        this.socket.on('odds_connected', (data) => {
            console.log('🎰 Odds service connected:', data);
        });

        this.socket.on('odds_update', (data) => {
            console.log(`📊 Odds update for ${data.sport}:`, data.count, 'games');
            this.handleOddsUpdate(data);
        });

        this.socket.on('odds_snapshot', (data) => {
            console.log(`📸 Odds snapshot for ${data.sport}:`, data.odds.length, 'games');
            this.handleOddsUpdate(data);
        });

        this.socket.on('line_movement_alert', (data) => {
            console.log(`🚨 Line movement alert:`, data.movements.length, 'movements');
            this.handleLineMovement(data);
        });

        this.socket.on('best_odds', (data) => {
            console.log('💰 Best odds received:', data);
            this.triggerCallbacks('onUpdate', { type: 'best_odds', data });
        });

        this.socket.on('line_movement', (data) => {
            console.log('📈 Line movement history received:', data);
            this.triggerCallbacks('onUpdate', { type: 'line_movement_history', data });
        });

        this.socket.on('subscription_confirmed', (data) => {
            console.log('✅ Subscription confirmed:', data);
            data.sports.forEach(sport => this.subscriptions.add(sport));
        });

        this.socket.on('tracking_confirmed', (data) => {
            console.log('🎯 Game tracking confirmed:', data);
        });

        this.socket.on('odds_error', (data) => {
            console.error('❌ Odds error:', data);
            this.triggerCallbacks('onError', data);
        });

        this.socket.on('error', (data) => {
            console.error('❌ Error:', data);
            this.triggerCallbacks('onError', data);
        });

        this.socket.on('pong_odds', (data) => {
            console.log('🏓 Pong received:', data);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.subscriptions.clear();
            console.log('👋 Disconnected from odds WebSocket');
        }
    }

    // ============================================
    // SUBSCRIPTIONS
    // ============================================

    subscribe(sports = ['basketball_nba', 'americanfootball_nfl'], options = {}) {
        if (!this.connected) {
            console.error('❌ Not connected. Call connect() first.');
            return false;
        }

        const data = {
            sports: Array.isArray(sports) ? sports : [sports],
            markets: options.markets || ['h2h', 'spreads', 'totals'],
            bookmakers: options.bookmakers || ['fanduel', 'draftkings', 'betmgm'],
            alertOnMovement: options.alertOnMovement !== false
        };

        this.socket.emit('subscribe_odds', data);
        console.log('📡 Subscribing to odds:', data.sports);
        return true;
    }

    unsubscribe(sports) {
        if (!this.connected) return false;

        const data = {
            sports: Array.isArray(sports) ? sports : [sports]
        };

        this.socket.emit('unsubscribe_odds', data);
        console.log('📡 Unsubscribing from odds:', data.sports);
        
        data.sports.forEach(sport => this.subscriptions.delete(sport));
        return true;
    }

    trackGame(sport, gameId) {
        if (!this.connected) return false;

        this.socket.emit('track_game', { sport, gameId });
        console.log(`🎯 Tracking game: ${sport} - ${gameId}`);
        return true;
    }

    // ============================================
    // DATA REQUESTS
    // ============================================

    getLiveOdds(sport, gameId = null) {
        if (!this.connected) {
            console.error('❌ Not connected');
            return Promise.reject(new Error('Not connected'));
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 10000);

            this.socket.once('live_odds', (data) => {
                clearTimeout(timeout);
                resolve(data);
            });

            this.socket.once('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });

            this.socket.emit('get_live_odds', { sport, gameId });
        });
    }

    getLineMovement(sport, gameId, bookmaker = null) {
        if (!this.connected) {
            return Promise.reject(new Error('Not connected'));
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 10000);

            this.socket.once('line_movement', (data) => {
                clearTimeout(timeout);
                resolve(data);
            });

            this.socket.once('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });

            this.socket.emit('get_line_movement', { sport, gameId, bookmaker });
        });
    }

    getBestOdds(sport, gameId, market = 'h2h') {
        if (!this.connected) {
            return Promise.reject(new Error('Not connected'));
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 10000);

            this.socket.once('best_odds', (data) => {
                clearTimeout(timeout);
                resolve(data);
            });

            this.socket.once('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });

            this.socket.emit('get_best_odds', { sport, gameId, market });
        });
    }

    ping() {
        if (this.connected) {
            this.socket.emit('ping_odds');
        }
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    handleOddsUpdate(data) {
        const { sport, odds, movements = [] } = data;

        // Update cache
        if (!this.oddsCache.has(sport)) {
            this.oddsCache.set(sport, new Map());
        }

        const sportCache = this.oddsCache.get(sport);
        odds.forEach(game => {
            sportCache.set(game.gameId, game);
        });

        // Trigger update callbacks
        this.triggerCallbacks('onUpdate', {
            type: 'odds_update',
            sport,
            odds,
            movements,
            timestamp: Date.now()
        });

        // Handle movements
        if (movements && movements.length > 0) {
            this.handleLineMovement({ sport, movements, timestamp: data.timestamp });
        }
    }

    handleLineMovement(data) {
        const { sport, movements } = data;

        // Store movements
        movements.forEach(movement => {
            const key = `${sport}:${movement.gameId}`;
            if (!this.lineMovements.has(key)) {
                this.lineMovements.set(key, []);
            }
            this.lineMovements.get(key).push(movement);
        });

        // Trigger movement callbacks
        this.triggerCallbacks('onMovement', {
            sport,
            movements,
            timestamp: Date.now()
        });
    }

    // ============================================
    // CALLBACKS
    // ============================================

    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }

    triggerCallbacks(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} callback:`, error);
                }
            });
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    getCachedOdds(sport, gameId = null) {
        const sportCache = this.oddsCache.get(sport);
        if (!sportCache) return null;

        if (gameId) {
            return sportCache.get(gameId);
        }

        return Array.from(sportCache.values());
    }

    getLineMovements(sport, gameId) {
        const key = `${sport}:${gameId}`;
        return this.lineMovements.get(key) || [];
    }

    isConnected() {
        return this.connected;
    }

    getSubscriptions() {
        return Array.from(this.subscriptions);
    }

    clearCache() {
        this.oddsCache.clear();
        this.lineMovements.clear();
        console.log('🗑️ Odds cache cleared');
    }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

window.liveOddsClient = new LiveOddsClient();

console.log('📊 Live Odds Client loaded');
