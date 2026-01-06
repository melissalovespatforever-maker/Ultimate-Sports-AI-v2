// ============================================
// WEBSOCKET CLIENT
// Real-time connection to Ultimate Sports AI
// ============================================

class SportsWebSocketClient {
    constructor(serverUrl = null) {
        this.serverUrl = serverUrl || this.detectServerUrl();
        this.socket = null;
        this.isConnected = false;
        this.subscribedSports = new Set();
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.messageQueue = [];

        console.log('📱 SportsWebSocket initializing...');
    }

    /**
     * Detect server URL from current environment
     */
    detectServerUrl() {
        if (typeof window !== 'undefined') {
            // Priority 1: Window Config (Production Backend)
            if (window.CONFIG?.API_BASE_URL) return window.CONFIG.API_BASE_URL;

            // Priority 2: Standard Production Railway URL
            const RAILWAY_URL = 'https://ultimate-sports-ai-backend-production.up.railway.app';
            
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isDev) {
                return 'http://localhost:3001';
            } else {
                return RAILWAY_URL;
            }
        }
        return 'http://localhost:3001';
    }

    /**
     * Load Socket.io from CDN if not already loaded
     */
    async loadSocketIO() {
        return new Promise((resolve) => {
            if (typeof io !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.2/socket.io.js';
            script.onload = resolve;
            script.onerror = () => console.error('Failed to load Socket.io');
            document.head.appendChild(script);
        });
    }

    /**
     * Connect to WebSocket server
     */
    async connect() {
        try {
            // Only load Socket.io in browser environment
            if (typeof window !== 'undefined') {
                await this.loadSocketIO();
            }

            console.log(`🔌 Connecting to ${this.serverUrl}...`);

            // For Node.js/server-side
            if (typeof require !== 'undefined') {
                const ioClient = require('socket.io-client');
                this.socket = ioClient(this.serverUrl);
            } else {
                // Browser-side
                this.socket = io(this.serverUrl, {
                    reconnection: true,
                    reconnectionDelay: this.reconnectDelay,
                    reconnectionDelayMax: 10000,
                    reconnectionAttempts: this.maxReconnectAttempts
                });
            }

            this.setupEventListeners();
            return new Promise((resolve) => {
                this.socket.on('connect', () => {
                    console.log('✅ WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.flushMessageQueue();
                    resolve();
                });
            });
        } catch (error) {
            console.error('❌ Connection error:', error);
            this.handleReconnect();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            this.isConnected = false;
            this.handleReconnect();
        });

        this.socket.on('error', (error) => {
            console.error('⚠️  WebSocket error:', error);
            this.emit('error', { error });
        });

        // Listen for score updates
        this.socket.on('score_update', (data) => {
            console.log(`📊 Score update: ${data.sport} - ${data.gameCount} games`);
            this.emit('score_update', data);
        });

        // Listen for sync status
        this.socket.on('sync_status', (data) => {
            console.log(`📡 Sync status: ${data.status}`);
            this.emit('sync_status', data);
        });

        // Listen for heartbeat
        this.socket.on('scheduler_heartbeat', (data) => {
            this.emit('heartbeat', data);
        });

        // Listen for game events
        this.socket.on('game_event', (data) => {
            console.log(`🎯 Game event: ${data.eventType}`);
            this.emit('game_event', data);
        });

        // Listen for notifications
        this.socket.on('notification', (data) => {
            console.log(`📢 ${data.title}: ${data.message}`);
            this.emit('notification', data);
        });

        // Listen for subscriptions
        this.socket.on('subscribed', (data) => {
            console.log(`✅ Subscribed to ${data.sport}`);
            this.subscribedSports.add(data.sport);
            this.emit('subscribed', data);
        });

        this.socket.on('unsubscribed', (data) => {
            console.log(`❌ Unsubscribed from ${data.sport}`);
            this.subscribedSports.delete(data.sport);
            this.emit('unsubscribed', data);
        });
    }

    /**
     * Handle reconnection
     */
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
            
            setTimeout(() => {
                this.connect().catch(err => {
                    console.error('Reconnection failed:', err);
                });
            }, this.reconnectDelay);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.emit('max_reconnect_failed', { attempts: this.reconnectAttempts });
        }
    }

    /**
     * Flush queued messages
     */
    flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            console.log(`📨 Sending queued message: ${msg.event}`);
            this.socket.emit(msg.event, msg.data);
        }
    }

    /**
     * Subscribe to a sport
     */
    subscribe(sport) {
        const message = {
            event: 'subscribe',
            data: { sport }
        };

        if (this.isConnected) {
            this.socket.emit('subscribe', message.data);
        } else {
            this.messageQueue.push(message);
        }
    }

    /**
     * Unsubscribe from a sport
     */
    unsubscribe(sport) {
        const message = {
            event: 'unsubscribe',
            data: { sport }
        };

        if (this.isConnected) {
            this.socket.emit('unsubscribe', message.data);
        } else {
            this.messageQueue.push(message);
        }
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // Also directly listen on socket if connected
        if (this.socket && event !== 'error') {
            this.socket.on(event, callback);
        }
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }

        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    /**
     * Emit event to all listeners
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    /**
     * Disconnect
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
            console.log('🔌 WebSocket disconnected');
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            subscribedSports: Array.from(this.subscribedSports),
            serverUrl: this.serverUrl,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Make available globally for browser scripts
if (typeof window !== 'undefined') {
    window.SportsWebSocketClient = SportsWebSocketClient;
    window.WebSocketClient = SportsWebSocketClient; // Alias
}

// Export for ES6 modules
export { SportsWebSocketClient };
export const WebSocketClient = SportsWebSocketClient;

// Export for CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SportsWebSocketClient, WebSocketClient: SportsWebSocketClient };
}

console.log('✅ SportsWebSocket client loaded');
