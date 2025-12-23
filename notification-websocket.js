// ============================================
// REAL-TIME WEBSOCKET NOTIFICATION HANDLER
// Connects to backend for live pick updates
// ============================================

console.log('🔌 WebSocket notification handler loading...');

class WebSocketNotificationHandler {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.backoffDelay = 1000;
        this.eventListeners = {};
        this.init();
    }

    /**
     * Initialize WebSocket connection
     */
    init() {
        const apiUrl = window.CONFIG?.API_BASE_URL || 
                      'https://ultimate-sports-ai-backend-production.up.railway.app';
        
        // Convert HTTPS to WSS and HTTP to WS
        const wsUrl = apiUrl
            .replace('https://', 'wss://')
            .replace('http://', 'ws://');

        console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

        try {
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.backoffDelay = 1000;
                console.log('✅ WebSocket connected');
                this.emit('connected');
                
                // Subscribe to pick notifications
                this.subscribeToPicks();
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', error);
            };

            this.socket.onclose = () => {
                this.isConnected = false;
                console.log('❌ WebSocket disconnected');
                this.emit('disconnected');
                this.attemptReconnect();
            };

        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.attemptReconnect();
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        const { type, payload } = data;

        console.log(`📨 WebSocket message: ${type}`, payload);

        switch (type) {
            case 'pick:created':
                this.handlePickCreated(payload);
                break;
            case 'pick:result':
                this.handlePickResult(payload);
                break;
            case 'coach:streak:update':
                this.handleStreakUpdate(payload);
                break;
            case 'injury:alert':
                this.handleInjuryAlert(payload);
                break;
            case 'market:movement':
                this.handleMarketMovement(payload);
                break;
            default:
                console.warn(`Unknown message type: ${type}`);
        }

        this.emit(type, payload);
    }

    /**
     * Handle new pick notification
     */
    handlePickCreated(data) {
        const { coach_name, pick, matchup, confidence, odds, reasoning } = data;

        console.log(`🎲 New pick from ${coach_name}: ${pick}`);

        if (window.picksNotificationUI) {
            window.picksNotificationUI.showNotification({
                coach: coach_name,
                pick: pick,
                matchup: matchup,
                confidence: confidence,
                odds: odds,
                reasoning: reasoning,
                type: 'pick'
            });
        }
    }

    /**
     * Handle pick result
     */
    handlePickResult(data) {
        const { coach_name, pick, result, matchup } = data;
        const resultType = result === 'win' ? 'win' : 'loss';

        console.log(`${result === 'win' ? '✅' : '❌'} Pick ${result}: ${pick}`);

        if (window.picksNotificationUI) {
            window.picksNotificationUI.showNotification({
                coach: coach_name,
                pick: `${result.toUpperCase()}: ${pick}`,
                matchup: matchup,
                confidence: 100,
                odds: result,
                type: resultType
            });
        }
    }

    /**
     * Handle streak update
     */
    handleStreakUpdate(data) {
        const { coach_name, streak, accuracy } = data;

        console.log(`🔥 ${coach_name} on ${streak}-game streak (${accuracy}% accurate)`);

        if (window.picksNotificationUI) {
            window.picksNotificationUI.showNotification({
                coach: coach_name,
                pick: `🔥 ${streak}-Game Winning Streak!`,
                matchup: `${accuracy}% Win Rate`,
                confidence: accuracy,
                odds: streak,
                type: 'streak'
            });
        }
    }

    /**
     * Handle injury alert
     */
    handleInjuryAlert(data) {
        const { player_name, team, status, impact } = data;

        console.log(`⚠️ Injury: ${player_name} (${team}) - ${status}`);

        if (window.picksNotificationUI) {
            window.picksNotificationUI.showNotification({
                coach: 'Injury Alert',
                pick: `${player_name} (${team})`,
                matchup: status,
                confidence: impact === 'high' ? 95 : 70,
                odds: impact,
                type: 'injury'
            });
        }
    }

    /**
     * Handle market movement
     */
    handleMarketMovement(data) {
        const { matchup, movement_direction, new_odds, change } = data;

        console.log(`💹 Market Movement: ${matchup} - ${movement_direction} ${Math.abs(change)} points`);

        if (window.picksNotificationUI) {
            window.picksNotificationUI.showNotification({
                coach: 'Market Movement',
                pick: `${matchup}`,
                matchup: `${movement_direction} by ${Math.abs(change)} → ${new_odds}`,
                confidence: 50,
                odds: new_odds,
                type: 'market'
            });
        }
    }

    /**
     * Subscribe to picks
     */
    subscribeToPicks() {
        if (!this.isConnected || !this.socket) return;

        try {
            const token = localStorage.getItem('auth_token');
            this.socket.send(JSON.stringify({
                type: 'subscribe:picks',
                payload: {
                    token: token,
                    userId: token ? window.appState?.user?.id : null
                }
            }));

            console.log('📥 Subscribed to pick notifications');
        } catch (error) {
            console.error('Error subscribing to picks:', error);
        }
    }

    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

        setTimeout(() => {
            this.init();
        }, this.backoffDelay);

        // Exponential backoff
        this.backoffDelay = Math.min(this.backoffDelay * 2, 30000);
    }

    /**
     * Send message to server
     */
    send(type, payload) {
        if (!this.isConnected || !this.socket) {
            console.warn('WebSocket not connected');
            return;
        }

        try {
            this.socket.send(JSON.stringify({
                type: type,
                payload: payload
            }));
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
        }
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event]
                .filter(cb => cb !== callback);
        }
    }

    /**
     * Emit event
     */
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Check connection status
     */
    isReady() {
        return this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * Disconnect
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.isConnected = false;
            console.log('🔌 WebSocket disconnected');
        }
    }
}

// Initialize globally (only if not already initialized)
if (!window.wsNotificationHandler) {
    const wsHandler = new WebSocketNotificationHandler();
    window.wsNotificationHandler = wsHandler;
    console.log('✅ WebSocket notification handler ready');
                      }
