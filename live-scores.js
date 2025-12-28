// ============================================
// LIVE SCORES MODULE - WEBSOCKET REAL-TIME
// Fetches actual sports data from ESPN API
// REAL-TIME updates via WebSocket broadcaster
// ============================================

// WebSocket client will be loaded from websocket-client.js
// Access it via window.SportsWebSocketClient or window.WebSocketClient

class LiveScoresManager {
    constructor() {
        this.scores = [];
        this.isLoading = false;
        this.selectedSport = 'nfl';
        this.refreshInterval = null;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.wsClient = null;
        this.isConnected = false;
    }

    async load() {
        console.log('📊 Loading Live Scores (WebSocket Mode)...');
        const container = document.getElementById('live-scores-container');
        if (!container) return;

        this.renderUI(container);
        this.attachEventListeners();
        
        // Initialize WebSocket connection
        this.initializeWebSocket();
        
        // Fetch initial scores
        await this.fetchScores();
    }

    // ============================================
    // WEBSOCKET INITIALIZATION
    // ============================================

    initializeWebSocket() {
        try {
            // Get WebSocketClient from global scope
            const WebSocketClient = window.SportsWebSocketClient || window.WebSocketClient;
            
            if (!WebSocketClient) {
                console.warn('⚠️ WebSocket client not available, using polling');
                this.startPolling();
                return;
            }
            
            // Initialize WebSocket client
            // Use backend WebSocket URL, not current page URL
            const wsUrl = window.CONFIG?.WS_URL || 'wss://ultimate-sports-ai-backend-production.up.railway.app';
            console.log('🔌 Connecting to WebSocket:', wsUrl);
            
            this.wsClient = new WebSocketClient(wsUrl, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5
            });

            // Listen for connection events
            this.wsClient.on('connect', () => {
                console.log('✅ Connected to live scores WebSocket');
                this.isConnected = true;
                this.updateConnectionStatus('connected');
                
                // Subscribe to all sports
                this.subscribeToAllSports();
            });

            this.wsClient.on('disconnect', () => {
                console.log('❌ Disconnected from WebSocket');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
            });

            // Listen for score updates from broadcaster
            this.wsClient.on('score_update', (data) => {
                console.log('📡 Score update received:', data);
                this.handleScoreUpdate(data);
            });

            // Listen for game events
            this.wsClient.on('game_event', (data) => {
                console.log('🎯 Game event:', data);
                this.handleGameEvent(data);
            });

            // Listen for sync status
            this.wsClient.on('sync_status', (data) => {
                console.log('🔄 Sync status:', data);
                this.updateLastSyncTime(data.timestamp);
            });

            // Listen for notifications
            this.wsClient.on('notifications', (data) => {
                console.log('📢 Notification:', data);
                this.showNotification(data);
            });

        } catch (error) {
            console.error('❌ WebSocket initialization error:', error);
            // Fall back to polling if WebSocket fails
            this.startPolling();
        }
    }

    subscribeToAllSports() {
        const sports = ['nfl', 'nba', 'nhl', 'mlb', 'soccer'];
        sports.forEach(sport => {
            if (this.wsClient) {
                this.wsClient.subscribe(sport);
            }
        });
        console.log('✅ Subscribed to all sports');
    }

    // ============================================
    // SCORE UPDATE HANDLERS
    // ============================================

    handleScoreUpdate(data) {
        const { sport, games } = data;
        
        // Only show updates for currently selected sport
        if (sport === this.selectedSport) {
            this.scores = games || [];
            this.renderScores();
            
            // Animate the update
            this.animateScoreUpdate();
        }
    }

    handleGameEvent(data) {
        const { sport, game, event } = data;
        
        if (sport === this.selectedSport) {
            // Find and update the game
            const gameIndex = this.scores.findIndex(g => g.id === game.id);
            if (gameIndex !== -1) {
                this.scores[gameIndex] = { ...this.scores[gameIndex], ...game };
                this.renderScores();
                
                // Show visual notification
                this.highlightUpdatedGame(gameIndex);
            }
        }
    }

    animateScoreUpdate() {
        const scoresList = document.getElementById('scores-list');
        if (scoresList) {
            scoresList.classList.add('scores-updated');
            setTimeout(() => {
                scoresList.classList.remove('scores-updated');
            }, 500);
        }
    }

    highlightUpdatedGame(index) {
        const gameElements = document.querySelectorAll('.game-card');
        if (gameElements[index]) {
            gameElements[index].classList.add('updated');
            setTimeout(() => {
                gameElements[index].classList.remove('updated');
            }, 1500);
        }
    }

    // ============================================
    // POLLING FALLBACK (if WebSocket fails)
    // ============================================

    startPolling() {
        console.log('⚠️  WebSocket unavailable, falling back to polling...');
        clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => this.fetchScores(), 30000);
    }

    // ============================================
    // HTTP API FALLBACK
    // ============================================

    async fetchScores() {
        try {
            this.isLoading = true;
            const apiUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
            const endpoint = `${apiUrl}/api/scores/${this.selectedSport}`;
            
            console.log('📡 Fetching scores from:', endpoint);
            
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.scores = data.events || [];
            this.renderScores();
            this.updateLastSyncTime(new Date());
            
        } catch (error) {
            console.error('❌ Error fetching scores:', error);
            this.showError('Failed to load scores. Retrying...');
            
            // Retry in 5 seconds
            setTimeout(() => this.fetchScores(), 5000);
        } finally {
            this.isLoading = false;
        }
    }

    // ============================================
    // UI RENDERING
    // ============================================

    renderUI(container) {
        container.innerHTML = `
            <div class="live-scores-wrapper">
                <div class="scores-header">
                    <div class="connection-status" id="connection-status">
                        <span class="status-dot"></span>
                        <span class="status-text">Connecting...</span>
                    </div>
                </div>
                
                <div class="scores-filter-bar">
                    <button class="score-filter-btn active" data-sport="nfl">
                        <i class="fas fa-football-ball"></i> NFL
                    </button>
                    <button class="score-filter-btn" data-sport="nba">
                        <i class="fas fa-basketball-ball"></i> NBA
                    </button>
                    <button class="score-filter-btn" data-sport="nhl">
                        <i class="fas fa-hockey-puck"></i> NHL
                    </button>
                    <button class="score-filter-btn" data-sport="mlb">
                        <i class="fas fa-baseball-ball"></i> MLB
                    </button>
                    <button class="score-filter-btn" data-sport="soccer">
                        <i class="fas fa-futbol"></i> SOCCER
                    </button>
                </div>
                
                <div class="scores-refresh-bar">
                    <button id="scores-refresh-btn" class="btn-small">
                        <i class="fas fa-sync-alt"></i> Refresh Now
                    </button>
                    <span class="last-updated">Last updated: Waiting...</span>
                </div>
                
                <div id="scores-list" class="scores-list">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading games...</p>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Sport filter buttons
        document.querySelectorAll('.score-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.score-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedSport = btn.dataset.sport;
                
                // Resubscribe WebSocket to new sport
                if (this.wsClient && this.isConnected) {
                    this.wsClient.emit('sport_change', { sport: this.selectedSport });
                }
                
                this.fetchScores();
            });
        });

        // Refresh button
        document.getElementById('scores-refresh-btn')?.addEventListener('click', () => {
            this.fetchScores();
        });
    }

    renderScores() {
        const scoresList = document.getElementById('scores-list');
        if (!scoresList) return;

        if (this.scores.length === 0) {
            scoresList.innerHTML = '<p class="no-games">No games found</p>';
            return;
        }

        scoresList.innerHTML = this.scores.map(game => this.renderGameCard(game)).join('');
    }

    renderGameCard(game) {
        const homeTeam = game.competitions?.[0]?.home;
        const awayTeam = game.competitions?.[0]?.away;
        const status = game.status?.type?.description || 'TBD';
        const time = new Date(game.date).toLocaleString();

        return `
            <div class="game-card" data-game-id="${game.id}">
                <div class="game-header">
                    <span class="game-time">${time}</span>
                    <span class="game-status">${status}</span>
                </div>
                
                <div class="game-matchup">
                    <div class="team away-team">
                        <img src="${awayTeam?.logo || ''}" alt="${awayTeam?.displayName}" class="team-logo">
                        <div class="team-info">
                            <p class="team-name">${awayTeam?.displayName || 'Away'}</p>
                            <p class="team-score">${awayTeam?.score || '-'}</p>
                        </div>
                    </div>
                    
                    <div class="vs-badge">VS</div>
                    
                    <div class="team home-team">
                        <div class="team-info">
                            <p class="team-name">${homeTeam?.displayName || 'Home'}</p>
                            <p class="team-score">${homeTeam?.score || '-'}</p>
                        </div>
                        <img src="${homeTeam?.logo || ''}" alt="${homeTeam?.displayName}" class="team-logo">
                    </div>
                </div>
                
                <div class="game-details">
                    ${game.competitions?.[0]?.venue ? `<p class="venue">${game.competitions[0].venue.fullName}</p>` : ''}
                    ${game.competitions?.[0]?.broadcasts ? `<p class="broadcast">${game.competitions[0].broadcasts[0].names[0]}</p>` : ''}
                </div>
            </div>
        `;
    }

    // ============================================
    // STATUS UPDATES
    // ============================================

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        const dotElement = statusElement.querySelector('.status-dot');
        const textElement = statusElement.querySelector('.status-text');

        if (status === 'connected') {
            dotElement.className = 'status-dot connected';
            textElement.textContent = '🟢 Connected - Real-time updates active';
            statusElement.classList.remove('disconnected');
        } else if (status === 'disconnected') {
            dotElement.className = 'status-dot disconnected';
            textElement.textContent = '🔴 Disconnected - Using polling (30s)';
            statusElement.classList.add('disconnected');
        } else if (status === 'connecting') {
            dotElement.className = 'status-dot connecting';
            textElement.textContent = '🟡 Connecting...';
        }
    }

    updateLastSyncTime(timestamp) {
        const lastUpdatedElement = document.querySelector('.last-updated');
        if (!lastUpdatedElement) return;

        const time = new Date(timestamp);
        const formattedTime = time.toLocaleTimeString();
        lastUpdatedElement.textContent = `Last updated: ${formattedTime}`;
    }

    showError(message) {
        const scoresList = document.getElementById('scores-list');
        if (scoresList) {
            scoresList.innerHTML = `<p class="error-message">${message}</p>`;
        }
    }

    showNotification(data) {
        console.log('📢 Showing notification:', data);
        // Implement notification UI if needed
    }

    // ============================================
    // CLEANUP
    // ============================================

    destroy() {
        clearInterval(this.refreshInterval);
        if (this.wsClient) {
            this.wsClient.disconnect();
        }
    }
}

// Export the manager
export { LiveScoresManager };

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const manager = new LiveScoresManager();
        manager.load();
        
        // Store in window for debugging
        window.liveScoresManager = manager;
    });
} else {
    const manager = new LiveScoresManager();
    manager.load();
    window.liveScoresManager = manager;
                }
