/**
 * ============================================
 * LIVE IN-GAME BETTING SYSTEM
 * Real-time betting with dynamic odds updates
 * ============================================
 */

console.log('🎰 Loading Live Betting System');

class LiveBettingSystem {
    constructor() {
        this.activeBets = new Map();
        this.oddsHistory = new Map();
        this.liveGames = [];
        this.oddsUpdateInterval = null;
        this.selectedGame = null;
        this.betSlip = [];
        
        // Betting markets
        this.markets = {
            MONEYLINE: 'Moneyline',
            SPREAD: 'Spread',
            TOTAL: 'Over/Under',
            NEXT_SCORE: 'Next to Score',
            QUARTER_WINNER: 'Quarter/Period Winner',
            PLAYER_PROP: 'Player Prop'
        };

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.createLiveBettingPage();
        this.startOddsUpdater();
        console.log('✅ Live Betting System Ready');
    }

    createLiveBettingPage() {
        // Check if page already exists
        if (document.getElementById('live-betting-page')) return;

        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        const page = document.createElement('div');
        page.id = 'live-betting-page';
        page.className = 'page';
        page.innerHTML = `
            <div class="page-header gradient-header">
                <div style="flex: 1;">
                    <h1><i class="fas fa-bolt"></i> Live In-Game Betting</h1>
                    <p class="page-subtitle">Real-time odds on live games - bet while you watch!</p>
                </div>
                <button class="btn-view-history" onclick="window.open('betting-history.html', '_blank')" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease;">
                    <i class="fas fa-history"></i>
                    <span>View History</span>
                </button>
            </div>

            <div class="live-betting-layout">
                <!-- Left: Game List -->
                <div class="live-games-sidebar">
                    <div class="sidebar-header">
                        <h3><i class="fas fa-tv"></i> Live Games</h3>
                        <span class="live-indicator">
                            <span class="pulse-dot"></span>
                            LIVE
                        </span>
                    </div>
                    <div id="live-games-list" class="games-list">
                        <p class="loading-text">Loading live games...</p>
                    </div>
                </div>

                <!-- Center: Betting Markets -->
                <div class="betting-markets-main">
                    <div id="betting-markets-container">
                        <div class="empty-state">
                            <i class="fas fa-hand-pointer" style="font-size: 64px; color: var(--text-muted); margin-bottom: 24px;"></i>
                            <h3>Select a Live Game</h3>
                            <p style="color: var(--text-secondary);">Choose a game from the left to view betting markets</p>
                        </div>
                    </div>
                </div>

                <!-- Right: Bet Slip -->
                <div class="bet-slip-sidebar">
                    <div class="bet-slip-header">
                        <h3><i class="fas fa-receipt"></i> Bet Slip</h3>
                        <button class="btn-clear-slip" id="clear-bet-slip">
                            <i class="fas fa-trash"></i> Clear
                        </button>
                    </div>
                    <div id="bet-slip-content" class="bet-slip-content">
                        <div class="empty-slip">
                            <i class="fas fa-clipboard"></i>
                            <p>Add bets to get started</p>
                        </div>
                    </div>
                    <div class="bet-slip-footer">
                        <div class="slip-total">
                            <span>Total Stake:</span>
                            <span id="total-stake">0</span> coins
                        </div>
                        <div class="slip-payout">
                            <span>Potential Win:</span>
                            <span id="potential-payout">0</span> coins
                        </div>
                        <button class="btn-place-bets" id="place-live-bets" disabled>
                            <i class="fas fa-check"></i> Place Live Bets
                        </button>
                    </div>
                </div>
            </div>
        `;

        mainContent.appendChild(page);

        // Add to navigation
        this.addToNavigation();
    }

    addToNavigation() {
        // Add to drawer menu
        const dashboardSection = document.querySelector('.drawer-menu .menu-section:has([data-page="home"])');
        if (dashboardSection) {
            const menuItem = document.createElement('button');
            menuItem.className = 'menu-item';
            menuItem.setAttribute('data-page', 'live-betting');
            menuItem.innerHTML = `
                <i class="fas fa-bolt"></i>
                <span>Live Betting</span>
                <span class="badge badge-live">LIVE</span>
            `;
            dashboardSection.insertBefore(menuItem, dashboardSection.querySelector('[data-page="my-bets"]'));
        }

        // Add to bottom nav (replace Analytics)
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            const analyticsBtn = bottomNav.querySelector('[data-page="analytics"]');
            if (analyticsBtn) {
                analyticsBtn.setAttribute('data-page', 'live-betting');
                analyticsBtn.innerHTML = `
                    <i class="fas fa-bolt"></i>
                    <span>Live Bets</span>
                `;
            }
        }
    }

    async loadLiveGames() {
        const sportsService = window.sportsDataService;
        if (!sportsService) {
            console.warn('Sports data service not ready');
            return;
        }

        try {
            // Get live games from all sports
            const allGames = await sportsService.getAllUpcomingGames();
            this.liveGames = allGames.filter(game => game.isLive || game.status === 'in');

            this.renderLiveGamesList();
        } catch (error) {
            console.error('Error loading live games:', error);
        }
    }

    renderLiveGamesList() {
        const container = document.getElementById('live-games-list');
        if (!container) return;

        if (this.liveGames.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-calendar-times"></i>
                    <p>No live games at the moment</p>
                    <small>Check back during game times!</small>
                </div>
            `;
            return;
        }

        container.innerHTML = this.liveGames.map(game => {
            const isSelected = this.selectedGame && this.selectedGame.id === game.id;
            return `
                <div class="live-game-card ${isSelected ? 'selected' : ''}" data-game-id="${game.id}">
                    <div class="game-sport-badge">${game.sport}</div>
                    <div class="game-status-live">
                        <span class="pulse-dot"></span>
                        ${game.statusDisplay}
                    </div>
                    <div class="game-teams">
                        <div class="team">
                            <img src="${window.resolveSportsLogo(game.awayTeam.id, game.sport, game.awayTeam.logo)}" 
                                 alt="${game.awayTeam.abbreviation}" 
                                 class="team-logo-small">
                            <span>${game.awayTeam.abbreviation}</span>
                            <span class="score">${game.awayScore || 0}</span>
                        </div>
                        <div class="team">
                            <img src="${window.resolveSportsLogo(game.homeTeam.id, game.sport, game.homeTeam.logo)}" 
                                 alt="${game.homeTeam.abbreviation}" 
                                 class="team-logo-small">
                            <span>${game.homeTeam.abbreviation}</span>
                            <span class="score">${game.homeScore || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.live-game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.gameId;
                const game = this.liveGames.find(g => g.id === gameId);
                if (game) {
                    this.selectGame(game);
                }
            });
        });
    }

    selectGame(game) {
        this.selectedGame = game;
        
        // Update UI
        document.querySelectorAll('.live-game-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.gameId === game.id);
        });

        // Generate and render betting markets
        this.renderBettingMarkets(game);
    }

    renderBettingMarkets(game) {
        const container = document.getElementById('betting-markets-container');
        if (!container) return;

        // Generate dynamic odds for the game
        const odds = this.generateDynamicOdds(game);

        container.innerHTML = `
            <div class="betting-game-header">
                <div class="game-header-teams">
                    <div class="team-header away">
                        <img src="${window.resolveSportsLogo(game.awayTeam.id, game.sport, game.awayTeam.logo)}" 
                             alt="${game.awayTeam.name}" 
                             class="team-logo-medium">
                        <div>
                            <h3>${game.awayTeam.name}</h3>
                            <div class="current-score">${game.awayScore || 0}</div>
                        </div>
                    </div>
                    <div class="game-time-status">
                        <div class="status-badge live">
                            <span class="pulse-dot"></span>
                            LIVE
                        </div>
                        <div class="game-clock">${game.statusDisplay}</div>
                    </div>
                    <div class="team-header home">
                        <div>
                            <h3>${game.homeTeam.name}</h3>
                            <div class="current-score">${game.homeScore || 0}</div>
                        </div>
                        <img src="${window.resolveSportsLogo(game.homeTeam.id, game.sport, game.homeTeam.logo)}" 
                             alt="${game.homeTeam.name}" 
                             class="team-logo-medium">
                    </div>
                </div>
            </div>

            <div class="odds-update-notice">
                <i class="fas fa-sync-alt fa-spin"></i>
                Odds updating every 10 seconds
            </div>

            <!-- Moneyline Market -->
            <div class="betting-market">
                <div class="market-header">
                    <h4><i class="fas fa-trophy"></i> Moneyline - Game Winner</h4>
                    <span class="market-badge">Most Popular</span>
                </div>
                <div class="market-options">
                    <div class="bet-option" data-market="moneyline" data-selection="away" data-odds="${odds.moneyline.away}">
                        <div class="option-team">
                            <span class="team-name">${game.awayTeam.abbreviation}</span>
                            <small>Away</small>
                        </div>
                        <div class="option-odds">
                            <span class="odds-value">${this.formatOdds(odds.moneyline.away)}</span>
                            <span class="odds-change ${odds.moneyline.awayTrend}">${odds.moneyline.awayTrend === 'up' ? '↑' : odds.moneyline.awayTrend === 'down' ? '↓' : ''}</span>
                        </div>
                    </div>
                    <div class="bet-option" data-market="moneyline" data-selection="home" data-odds="${odds.moneyline.home}">
                        <div class="option-team">
                            <span class="team-name">${game.homeTeam.abbreviation}</span>
                            <small>Home</small>
                        </div>
                        <div class="option-odds">
                            <span class="odds-value">${this.formatOdds(odds.moneyline.home)}</span>
                            <span class="odds-change ${odds.moneyline.homeTrend}">${odds.moneyline.homeTrend === 'up' ? '↑' : odds.moneyline.homeTrend === 'down' ? '↓' : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Spread Market -->
            <div class="betting-market">
                <div class="market-header">
                    <h4><i class="fas fa-chart-line"></i> Point Spread</h4>
                </div>
                <div class="market-options">
                    <div class="bet-option" data-market="spread" data-selection="away" data-odds="${odds.spread.awayOdds}" data-line="${odds.spread.awayLine}">
                        <div class="option-team">
                            <span class="team-name">${game.awayTeam.abbreviation} ${odds.spread.awayLine > 0 ? '+' : ''}${odds.spread.awayLine}</span>
                            <small>Cover ${Math.abs(odds.spread.awayLine)} points</small>
                        </div>
                        <div class="option-odds">
                            <span class="odds-value">${this.formatOdds(odds.spread.awayOdds)}</span>
                            <span class="odds-change ${odds.spread.awayTrend}">${odds.spread.awayTrend === 'up' ? '↑' : odds.spread.awayTrend === 'down' ? '↓' : ''}</span>
                        </div>
                    </div>
                    <div class="bet-option" data-market="spread" data-selection="home" data-odds="${odds.spread.homeOdds}" data-line="${odds.spread.homeLine}">
                        <div class="option-team">
                            <span class="team-name">${game.homeTeam.abbreviation} ${odds.spread.homeLine > 0 ? '+' : ''}${odds.spread.homeLine}</span>
                            <small>Cover ${Math.abs(odds.spread.homeLine)} points</small>
                        </div>
                        <div class="option-odds">
                            <span class="odds-value">${this.formatOdds(odds.spread.homeOdds)}</span>
                            <span class="odds-change ${odds.spread.homeTrend}">${odds.spread.homeTrend === 'up' ? '↑' : odds.spread.homeTrend === 'down' ? '↓' : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Total (Over/Under) Market -->
            <div class="betting-market">
                <div class="market-header">
                    <h4><i class="fas fa-calculator"></i> Total Points (Over/Under)</h4>
                </div>
                <div class="market-options">
                    <div class="bet-option" data-market="total" data-selection="over" data-odds="${odds.total.overOdds}" data-line="${odds.total.line}">
                        <div class="option-team">
                            <span class="team-name">Over ${odds.total.line}</span>
                            <small>Combined score exceeds ${odds.total.line}</small>
                        </div>
                        <div class="option-odds">
                            <span class="odds-value">${this.formatOdds(odds.total.overOdds)}</span>
                            <span class="odds-change ${odds.total.overTrend}">${odds.total.overTrend === 'up' ? '↑' : odds.total.overTrend === 'down' ? '↓' : ''}</span>
                        </div>
                    </div>
                    <div class="bet-option" data-market="total" data-selection="under" data-odds="${odds.total.underOdds}" data-line="${odds.total.line}">
                        <div class="option-team">
                            <span class="team-name">Under ${odds.total.line}</span>
                            <small>Combined score under ${odds.total.line}</small>
                        </div>
                        <div class="option-odds">
                            <span class="odds-value">${this.formatOdds(odds.total.underOdds)}</span>
                            <span class="odds-change ${odds.total.underTrend}">${odds.total.underTrend === 'up' ? '↑' : odds.total.underTrend === 'down' ? '↓' : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Next Score Market -->
            <div class="betting-market featured">
                <div class="market-header">
                    <h4><i class="fas fa-bolt"></i> Next to Score</h4>
                    <span class="market-badge hot">🔥 HOT</span>
                </div>
                <div class="market-options">
                    <div class="bet-option" data-market="next-score" data-selection="away" data-odds="${odds.nextScore.away}">
                        <div class="option-team">
                            <span class="team-name">${game.awayTeam.abbreviation}</span>
                            <small>Next score</small>
                        </div>
                        <div class="option-odds">
                            <span class="odds-value">${this.formatOdds(odds.nextScore.away)}</span>
                        </div>
                    </div>
                    <div class="bet-option" data-market="next-score" data-selection="home" data-odds="${odds.nextScore.home}">
                        <div class="option-team">
                            <span class="team-name">${game.homeTeam.abbreviation}</span>
                            <small>Next score</small>
                        </div>
                        <div class="option-odds">
                            <span class="odds-value">${this.formatOdds(odds.nextScore.home)}</span>
                        </div>
                    </div>
                    <div class="bet-option" data-market="next-score" data-selection="none" data-odds="${odds.nextScore.none}">
                        <div class="option-team">
                            <span class="team-name">No Score</span>
                            <small>Rest of quarter/period</small>
                        </div>
                        <div class="option-odds">
                            <span class="odds-value">${this.formatOdds(odds.nextScore.none)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add click handlers to bet options
        container.querySelectorAll('.bet-option').forEach(option => {
            option.addEventListener('click', () => {
                this.addToBetSlip(game, option);
            });
        });
    }

    generateDynamicOdds(game) {
        // Generate realistic odds based on current score and game state
        const scoreDiff = (game.homeScore || 0) - (game.awayScore || 0);
        const totalScore = (game.homeScore || 0) + (game.awayScore || 0);

        // Store previous odds for trend calculation
        const gameKey = game.id;
        const prevOdds = this.oddsHistory.get(gameKey) || null;

        // Moneyline odds (shift based on score)
        let awayML = scoreDiff > 0 ? 150 + (scoreDiff * 20) : -120 - (Math.abs(scoreDiff) * 15);
        let homeML = scoreDiff < 0 ? 150 + (Math.abs(scoreDiff) * 20) : -120 - (scoreDiff * 15);

        // Spread (shifts with score momentum)
        let spreadLine = -scoreDiff + (Math.random() * 2 - 1); // Add small variance
        spreadLine = Math.round(spreadLine * 2) / 2; // Round to nearest 0.5

        // Total (adjusts based on pace)
        let totalLine = 220; // Default
        if (game.sport === 'NBA') totalLine = 220;
        else if (game.sport === 'NFL') totalLine = 47;
        else if (game.sport === 'NHL') totalLine = 6;
        else if (game.sport === 'MLB') totalLine = 9;
        
        // Adjust based on current pace
        totalLine += (totalScore > totalLine / 2) ? 4 : -2;
        totalLine = Math.round(totalLine * 2) / 2;

        // Next score odds (based on momentum)
        const recentMomentum = scoreDiff; // Simplified
        let nextScoreAway = recentMomentum < 0 ? -130 : 120;
        let nextScoreHome = recentMomentum > 0 ? -130 : 120;

        const odds = {
            moneyline: {
                away: awayML,
                home: homeML,
                awayTrend: this.calculateTrend(prevOdds?.moneyline?.away, awayML),
                homeTrend: this.calculateTrend(prevOdds?.moneyline?.home, homeML)
            },
            spread: {
                awayLine: spreadLine,
                homeLine: -spreadLine,
                awayOdds: -110,
                homeOdds: -110,
                awayTrend: this.calculateTrend(prevOdds?.spread?.awayLine, spreadLine),
                homeTrend: this.calculateTrend(prevOdds?.spread?.homeLine, -spreadLine)
            },
            total: {
                line: totalLine,
                overOdds: -110,
                underOdds: -110,
                overTrend: this.calculateTrend(prevOdds?.total?.line, totalLine),
                underTrend: this.calculateTrend(prevOdds?.total?.line, totalLine, true)
            },
            nextScore: {
                away: nextScoreAway,
                home: nextScoreHome,
                none: 300
            }
        };

        // Store for next comparison
        this.oddsHistory.set(gameKey, odds);

        return odds;
    }

    calculateTrend(oldValue, newValue, inverse = false) {
        if (oldValue === null || oldValue === undefined) return 'neutral';
        
        const diff = newValue - oldValue;
        if (Math.abs(diff) < 0.1) return 'neutral';
        
        if (inverse) {
            return diff > 0 ? 'down' : 'up';
        }
        return diff > 0 ? 'up' : 'down';
    }

    formatOdds(odds) {
        if (odds > 0) return `+${odds}`;
        return odds.toString();
    }

    addToBetSlip(game, optionElement) {
        const market = optionElement.dataset.market;
        const selection = optionElement.dataset.selection;
        const odds = parseFloat(optionElement.dataset.odds);
        const line = optionElement.dataset.line ? parseFloat(optionElement.dataset.line) : null;

        // Create bet object
        const bet = {
            id: `${game.id}_${market}_${selection}_${Date.now()}`,
            gameId: game.id,
            game: game,
            market: market,
            selection: selection,
            odds: odds,
            line: line,
            stake: 100, // Default stake
            timestamp: Date.now()
        };

        // Add to slip
        this.betSlip.push(bet);
        
        // Visual feedback
        optionElement.classList.add('added-to-slip');
        setTimeout(() => optionElement.classList.remove('added-to-slip'), 500);

        this.renderBetSlip();
    }

    renderBetSlip() {
        const container = document.getElementById('bet-slip-content');
        if (!container) return;

        if (this.betSlip.length === 0) {
            container.innerHTML = `
                <div class="empty-slip">
                    <i class="fas fa-clipboard"></i>
                    <p>Add bets to get started</p>
                </div>
            `;
            document.getElementById('place-live-bets').disabled = true;
            return;
        }

        container.innerHTML = this.betSlip.map(bet => `
            <div class="slip-bet-card" data-bet-id="${bet.id}">
                <div class="slip-bet-header">
                    <div class="slip-bet-game">
                        <small>${bet.game.awayTeam.abbreviation} @ ${bet.game.homeTeam.abbreviation}</small>
                        <span class="slip-bet-market">${this.getMarketLabel(bet.market, bet.selection, bet.line)}</span>
                    </div>
                    <button class="btn-remove-bet" data-bet-id="${bet.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="slip-bet-odds">
                    <span>Odds: ${this.formatOdds(bet.odds)}</span>
                </div>
                <div class="slip-bet-stake">
                    <label>Stake:</label>
                    <input type="number" 
                           class="stake-input" 
                           data-bet-id="${bet.id}" 
                           value="${bet.stake}" 
                           min="10" 
                           step="10">
                    <span class="coin-label">coins</span>
                </div>
                <div class="slip-bet-payout">
                    <span>To Win:</span>
                    <strong>${this.calculatePayout(bet.stake, bet.odds)} coins</strong>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.btn-remove-bet').forEach(btn => {
            btn.addEventListener('click', () => {
                const betId = btn.dataset.betId;
                this.removeFromBetSlip(betId);
            });
        });

        container.querySelectorAll('.stake-input').forEach(input => {
            input.addEventListener('input', () => {
                const betId = input.dataset.betId;
                const newStake = parseInt(input.value) || 0;
                this.updateBetStake(betId, newStake);
            });
        });

        this.updateBetSlipTotals();
        document.getElementById('place-live-bets').disabled = false;

        // Setup place bets button
        document.getElementById('place-live-bets').onclick = () => this.placeBets();
        document.getElementById('clear-bet-slip').onclick = () => this.clearBetSlip();
    }

    getMarketLabel(market, selection, line) {
        if (market === 'moneyline') {
            return `${selection.toUpperCase()} to Win`;
        } else if (market === 'spread') {
            return `${selection.toUpperCase()} ${line > 0 ? '+' : ''}${line}`;
        } else if (market === 'total') {
            return `${selection.toUpperCase()} ${line}`;
        } else if (market === 'next-score') {
            return `Next Score: ${selection.toUpperCase()}`;
        }
        return selection;
    }

    calculatePayout(stake, odds) {
        if (odds > 0) {
            return Math.round(stake * (odds / 100));
        } else {
            return Math.round(stake * (100 / Math.abs(odds)));
        }
    }

    updateBetStake(betId, newStake) {
        const bet = this.betSlip.find(b => b.id === betId);
        if (bet) {
            bet.stake = newStake;
            this.updateBetSlipTotals();
        }
    }

    removeFromBetSlip(betId) {
        this.betSlip = this.betSlip.filter(b => b.id !== betId);
        this.renderBetSlip();
    }

    clearBetSlip() {
        this.betSlip = [];
        this.renderBetSlip();
    }

    updateBetSlipTotals() {
        const totalStake = this.betSlip.reduce((sum, bet) => sum + bet.stake, 0);
        const totalPayout = this.betSlip.reduce((sum, bet) => 
            sum + this.calculatePayout(bet.stake, bet.odds), 0);

        document.getElementById('total-stake').textContent = totalStake.toLocaleString();
        document.getElementById('potential-payout').textContent = totalPayout.toLocaleString();
    }

    async placeBets() {
        if (this.betSlip.length === 0) return;

        // Check balance
        if (window.globalState) {
            const totalStake = this.betSlip.reduce((sum, bet) => sum + bet.stake, 0);
            const balance = window.globalState.getBalance();
            
            if (balance < totalStake) {
                if (window.globalState.showNotification) {
                    window.globalState.showNotification(
                        'Insufficient coins to place these bets',
                        'error'
                    );
                }
                return;
            }

            // Deduct stakes
            for (const bet of this.betSlip) {
                await window.globalState.deductCoins(
                    bet.stake,
                    `Live Bet: ${this.getMarketLabel(bet.market, bet.selection, bet.line)}`,
                    { 
                        type: 'live_bet',
                        gameId: bet.gameId,
                        market: bet.market,
                        odds: bet.odds
                    }
                );

                // Store active bet
                const activeBet = {
                    ...bet,
                    status: 'pending',
                    placedAt: Date.now()
                };
                this.activeBets.set(bet.id, activeBet);
                
                // Save to localStorage for betting history
                this.saveBetToHistory(activeBet);
            }

            // Success notification
            if (window.globalState.showNotification) {
                window.globalState.showNotification(
                    `✅ ${this.betSlip.length} live bet(s) placed successfully!`,
                    'success'
                );
            }

            // Confetti
            if (window.confetti) {
                window.confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.7 }
                });
            }

            // Clear slip
            this.clearBetSlip();
        }
    }

    startOddsUpdater() {
        // Update odds every 10 seconds for live games
        this.oddsUpdateInterval = setInterval(() => {
            if (this.selectedGame && document.getElementById('betting-markets-container')) {
                this.renderBettingMarkets(this.selectedGame);
            }
        }, 10000);

        // Refresh live games list every 30 seconds
        setInterval(() => {
            this.loadLiveGames();
        }, 30000);

        // Initial load
        this.loadLiveGames();

        console.log('🔄 Odds updater started (10s intervals)');
    }

    stopOddsUpdater() {
        if (this.oddsUpdateInterval) {
            clearInterval(this.oddsUpdateInterval);
            this.oddsUpdateInterval = null;
        }
    }

    saveBetToHistory(bet) {
        try {
            const historyKey = 'betting_history';
            let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            
            // Add new bet
            history.push(bet);
            
            // Keep only last 500 bets to avoid storage limits
            if (history.length > 500) {
                history = history.slice(-500);
            }
            
            localStorage.setItem(historyKey, JSON.stringify(history));
            console.log('💾 Bet saved to history:', bet.id);
        } catch (error) {
            console.error('Error saving bet to history:', error);
        }
    }

    updateBetStatus(betId, status, result = {}) {
        const bet = this.activeBets.get(betId);
        if (!bet) return;

        // Update active bet
        bet.status = status;
        bet.settledAt = Date.now();
        if (result.payout !== undefined) bet.payout = result.payout;
        if (result.profit !== undefined) bet.profit = result.profit;

        // Update in localStorage
        try {
            const historyKey = 'betting_history';
            let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            const index = history.findIndex(b => b.id === betId);
            
            if (index !== -1) {
                history[index] = { ...history[index], ...bet };
                localStorage.setItem(historyKey, JSON.stringify(history));
                console.log('✅ Bet status updated:', betId, status);
            }
        } catch (error) {
            console.error('Error updating bet status:', error);
        }

        // Remove from active bets if settled
        if (status === 'won' || status === 'lost') {
            this.activeBets.delete(betId);
        }
    }
}

// Initialize system
if (!window.liveBettingSystem) {
    window.liveBettingSystem = new LiveBettingSystem();
}
