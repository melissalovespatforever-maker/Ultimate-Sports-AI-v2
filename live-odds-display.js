/* ============================================
   LIVE ODDS DISPLAY UI
   Beautiful real-time odds visualization
   ============================================ */

class LiveOddsDisplay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        this.currentSport = 'basketball_nba';
        this.oddsData = [];
        this.selectedBookmakers = ['fanduel', 'draftkings', 'betmgm'];
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.connectToLiveOdds();
    }

    render() {
        this.container.innerHTML = `
            <div class="live-odds-container">
                <!-- Header -->
                <div class="live-odds-header">
                    <div class="header-left">
                        <h2 class="header-title">
                            <i class="fas fa-chart-line"></i>
                            Live Betting Odds
                        </h2>
                        <div class="live-indicator">
                            <div class="live-dot"></div>
                            <span>LIVE</span>
                        </div>
                    </div>
                    <div class="header-right">
                        <select id="sport-selector" class="sport-select">
                            <option value="basketball_nba">🏀 NBA</option>
                            <option value="americanfootball_nfl">🏈 NFL</option>
                            <option value="baseball_mlb">⚾ MLB</option>
                            <option value="icehockey_nhl">🏒 NHL</option>
                            <option value="soccer_epl">⚽ EPL</option>
                        </select>
                        <button id="refresh-odds" class="icon-btn">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>

                <!-- Connection Status -->
                <div id="connection-status" class="connection-status disconnected">
                    <i class="fas fa-plug"></i>
                    <span>Connecting to live odds...</span>
                </div>

                <!-- Odds Grid -->
                <div id="odds-grid" class="odds-grid">
                    <!-- Will be populated dynamically -->
                </div>

                <!-- Empty State -->
                <div id="empty-state" class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>No live odds available</p>
                    <small>Games will appear here when odds are available</small>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Sport selector
        const sportSelector = document.getElementById('sport-selector');
        if (sportSelector) {
            sportSelector.addEventListener('change', (e) => {
                this.changeSport(e.target.value);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-odds');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshOdds();
            });
        }
    }

    connectToLiveOdds() {
        if (!window.liveOddsClient) {
            console.error('❌ Live odds client not loaded');
            return;
        }

        const client = window.liveOddsClient;

        // Connect
        client.connect();

        // Setup callbacks
        client.on('onConnect', () => {
            console.log('✅ Connected to live odds');
            this.updateConnectionStatus('connected');
            
            // Subscribe to odds
            client.subscribe([this.currentSport], {
                alertOnMovement: true
            });
        });

        client.on('onDisconnect', () => {
            console.log('❌ Disconnected from live odds');
            this.updateConnectionStatus('disconnected');
        });

        client.on('onUpdate', (data) => {
            if (data.type === 'odds_update') {
                this.handleOddsUpdate(data);
            }
        });

        client.on('onMovement', (data) => {
            this.handleLineMovement(data);
        });

        client.on('onError', (error) => {
            console.error('❌ Odds error:', error);
            this.showError(error.error || 'Failed to fetch odds');
        });
    }

    handleOddsUpdate(data) {
        const { sport, odds } = data;
        
        if (sport !== this.currentSport) return;

        this.oddsData = odds;
        this.renderOdds();
    }

    handleLineMovement(data) {
        const { movements } = data;

        movements.forEach(movement => {
            this.showLineMovementAlert(movement);
            this.highlightMovement(movement);
        });
    }

    renderOdds() {
        const grid = document.getElementById('odds-grid');
        const emptyState = document.getElementById('empty-state');

        if (!grid) return;

        if (this.oddsData.length === 0) {
            grid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        grid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        grid.innerHTML = this.oddsData.map(game => this.createGameCard(game)).join('');
    }

    createGameCard(game) {
        const bestOdds = this.findBestOdds(game);
        const hasArbitrage = this.detectArbitrage(bestOdds);

        return `
            <div class="odds-card ${hasArbitrage ? 'has-arbitrage' : ''}" data-game-id="${game.gameId}">
                <div class="odds-card-header">
                    <div class="matchup">
                        <div class="team away-team">
                            <span class="team-name">${game.awayTeam}</span>
                            ${bestOdds.awayTeam ? `<span class="best-odds">${this.formatOdds(bestOdds.awayTeam.price)}</span>` : ''}
                        </div>
                        <div class="vs-divider">@</div>
                        <div class="team home-team">
                            <span class="team-name">${game.homeTeam}</span>
                            ${bestOdds.homeTeam ? `<span class="best-odds">${this.formatOdds(bestOdds.homeTeam.price)}</span>` : ''}
                        </div>
                    </div>
                    <div class="game-time">
                        <i class="fas fa-clock"></i>
                        ${this.formatGameTime(game.commenceTime)}
                    </div>
                </div>

                ${hasArbitrage ? `
                    <div class="arbitrage-alert">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Arbitrage Opportunity: ${hasArbitrage.profitMargin}% guaranteed profit</span>
                    </div>
                ` : ''}

                <div class="odds-bookmakers">
                    ${game.bookmakers.slice(0, 3).map(bm => this.createBookmakerRow(bm, game)).join('')}
                </div>

                <div class="odds-card-footer">
                    <button class="view-more-btn" onclick="liveOddsDisplay.showGameDetails('${game.gameId}')">
                        <i class="fas fa-chart-bar"></i>
                        View All Odds & Movements
                    </button>
                </div>
            </div>
        `;
    }

    createBookmakerRow(bookmaker, game) {
        const h2h = bookmaker.markets.h2h;
        const spreads = bookmaker.markets.spreads;

        if (!h2h) return '';

        const awayOdds = h2h.outcomes.find(o => o.name === game.awayTeam);
        const homeOdds = h2h.outcomes.find(o => o.name === game.homeTeam);

        return `
            <div class="bookmaker-row">
                <div class="bookmaker-name">
                    ${bookmaker.title}
                </div>
                <div class="bookmaker-odds">
                    <div class="odds-value away" data-bookmaker="${bookmaker.name}" data-team="${game.awayTeam}">
                        ${awayOdds ? this.formatOdds(awayOdds.price) : '-'}
                    </div>
                    <div class="odds-value home" data-bookmaker="${bookmaker.name}" data-team="${game.homeTeam}">
                        ${homeOdds ? this.formatOdds(homeOdds.price) : '-'}
                    </div>
                </div>
            </div>
        `;
    }

    findBestOdds(game) {
        const best = {
            homeTeam: null,
            awayTeam: null
        };

        game.bookmakers.forEach(bm => {
            const h2h = bm.markets.h2h;
            if (!h2h) return;

            h2h.outcomes.forEach(outcome => {
                if (outcome.name === game.homeTeam) {
                    if (!best.homeTeam || outcome.price > best.homeTeam.price) {
                        best.homeTeam = {
                            bookmaker: bm.title,
                            price: outcome.price
                        };
                    }
                } else if (outcome.name === game.awayTeam) {
                    if (!best.awayTeam || outcome.price > best.awayTeam.price) {
                        best.awayTeam = {
                            bookmaker: bm.title,
                            price: outcome.price
                        };
                    }
                }
            });
        });

        return best;
    }

    detectArbitrage(bestOdds) {
        if (!bestOdds.homeTeam || !bestOdds.awayTeam) return null;

        const calc = (price) => {
            if (price > 0) return 100 / (price + 100);
            return (-price) / (-price + 100);
        };

        const homeImplied = calc(bestOdds.homeTeam.price);
        const awayImplied = calc(bestOdds.awayTeam.price);
        const totalImplied = homeImplied + awayImplied;

        if (totalImplied < 1) {
            return {
                profitMargin: (((1 / totalImplied) - 1) * 100).toFixed(2)
            };
        }

        return null;
    }

    showLineMovementAlert(movement) {
        const alert = document.createElement('div');
        alert.className = 'line-movement-toast';
        alert.innerHTML = `
            <div class="toast-icon ${movement.direction}">
                <i class="fas fa-arrow-${movement.direction === 'up' ? 'up' : 'down'}"></i>
            </div>
            <div class="toast-content">
                <strong>${movement.team}</strong>
                <span>${movement.bookmaker}: ${this.formatOdds(movement.previousPrice)} → ${this.formatOdds(movement.currentPrice)}</span>
                ${movement.isSteamMove ? '<span class="steam-badge">STEAM MOVE</span>' : ''}
            </div>
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            alert.style.transform = 'translateX(400px)';
            setTimeout(() => alert.remove(), 400);
        }, 5000);
    }

    highlightMovement(movement) {
        const gameCard = this.container.querySelector(`[data-game-id="${movement.gameId}"]`);
        if (!gameCard) return;

        const oddsValue = gameCard.querySelector(
            `[data-bookmaker="${movement.bookmaker}"][data-team="${movement.team}"]`
        );

        if (oddsValue) {
            oddsValue.classList.add('odds-moved', movement.direction);
            setTimeout(() => {
                oddsValue.classList.remove('odds-moved', movement.direction);
            }, 2000);
        }
    }

    showGameDetails(gameId) {
        const game = this.oddsData.find(g => g.gameId === gameId);
        if (!game) return;

        // Get line movement history
        if (window.liveOddsClient && window.liveOddsClient.isConnected()) {
            window.liveOddsClient.getLineMovement(this.currentSport, gameId)
                .then(data => {
                    this.openGameModal(game, data);
                })
                .catch(error => {
                    console.error('Failed to get line movement:', error);
                    this.openGameModal(game, null);
                });
        } else {
            this.openGameModal(game, null);
        }
    }

    openGameModal(game, movementData) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'game-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${game.awayTeam} @ ${game.homeTeam}</h3>
                    <button class="modal-close" onclick="this.closest('.game-details-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <!-- All bookmakers odds -->
                    <div class="all-bookmakers">
                        ${game.bookmakers.map(bm => this.createDetailedBookmakerView(bm, game)).join('')}
                    </div>

                    <!-- Line movement chart -->
                    ${movementData ? `
                        <div class="line-movement-chart">
                            <h4>Line Movement History</h4>
                            ${this.createLineMovementChart(movementData)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    createDetailedBookmakerView(bookmaker, game) {
        return `
            <div class="detailed-bookmaker">
                <h4>${bookmaker.title}</h4>
                <div class="markets-grid">
                    ${Object.keys(bookmaker.markets).map(marketKey => {
                        const market = bookmaker.markets[marketKey];
                        return `
                            <div class="market-section">
                                <h5>${this.formatMarketName(marketKey)}</h5>
                                ${market.outcomes.map(outcome => `
                                    <div class="outcome-row">
                                        <span>${outcome.name} ${outcome.point ? `(${outcome.point})` : ''}</span>
                                        <span class="odds">${this.formatOdds(outcome.price)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    createLineMovementChart(movementData) {
        // Simplified chart visualization
        return `
            <div class="movement-list">
                ${movementData.movements.slice(0, 10).map(m => `
                    <div class="movement-item">
                        <div class="movement-info">
                            <strong>${m.team}</strong>
                            <span>${m.bookmaker}</span>
                        </div>
                        <div class="movement-change ${m.direction}">
                            ${this.formatOdds(m.previousPrice)} → ${this.formatOdds(m.currentPrice)}
                            <i class="fas fa-arrow-${m.direction === 'up' ? 'up' : 'down'}"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    changeSport(sport) {
        this.currentSport = sport;
        this.oddsData = [];
        this.renderOdds();

        if (window.liveOddsClient && window.liveOddsClient.isConnected()) {
            // Unsubscribe from old sport
            window.liveOddsClient.unsubscribe([this.currentSport]);
            
            // Subscribe to new sport
            window.liveOddsClient.subscribe([sport], {
                alertOnMovement: true
            });
        }
    }

    refreshOdds() {
        if (window.liveOddsClient && window.liveOddsClient.isConnected()) {
            window.liveOddsClient.getLiveOdds(this.currentSport)
                .then(data => {
                    this.handleOddsUpdate({ sport: this.currentSport, odds: data.odds });
                })
                .catch(error => {
                    console.error('Failed to refresh odds:', error);
                });
        }
    }

    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connection-status');
        if (!statusEl) return;

        statusEl.className = `connection-status ${status}`;
        
        if (status === 'connected') {
            statusEl.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Connected - Live updates active</span>
            `;
        } else {
            statusEl.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>Disconnected - Reconnecting...</span>
            `;
        }
    }

    showError(message) {
        if (window.premiumUI && window.premiumUI.toast) {
            window.premiumUI.toast(message, 'error', 3000);
        } else {
            alert(message);
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    formatOdds(price) {
        if (!price && price !== 0) return '-';
        return price > 0 ? `+${price}` : price.toString();
    }

    formatGameTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = date - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 0) return 'Live';
        if (diffHours < 24) return `${diffHours}h`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    formatMarketName(key) {
        const names = {
            'h2h': 'Moneyline',
            'spreads': 'Point Spread',
            'totals': 'Over/Under'
        };
        return names[key] || key;
    }
}

// Global instance
window.liveOddsDisplay = null;

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('live-odds-container');
    if (container) {
        window.liveOddsDisplay = new LiveOddsDisplay('live-odds-container');
    }
});
