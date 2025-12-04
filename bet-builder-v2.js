// ============================================
// BET BUILDER V2 - ULTIMATE EDITION
// Advanced parlay builder with live odds comparison
// Integrated with top sportsbooks & AI coaches
// ============================================

console.log('🎯 Loading Ultimate Bet Builder V2');

const betBuilderV2 = {
    // State
    selectedPicks: [],
    allGames: [],
    searchResults: [],
    filters: {
        sport: 'all',
        market: 'h2h',
        status: 'all', // all, live, upcoming
        bookmaker: 'best'
    },
    searchTerm: '',
    loading: false,
    selectedTab: 'popular', // popular, search, ai-picks
    
    // Constants
    SPORTS: [
        { key: 'all', name: 'All Sports', icon: '🏆' },
        { key: 'basketball_nba', name: 'NBA', icon: '🏀' },
        { key: 'americanfootball_nfl', name: 'NFL', icon: '🏈' }
        // Coming soon: MLB, NHL, EPL
        // { key: 'baseball_mlb', name: 'MLB', icon: '⚾' },
        // { key: 'icehockey_nhl', name: 'NHL', icon: '🏒' },
        // { key: 'soccer_epl', name: 'EPL', icon: '⚽' }
    ],

    MARKETS: [
        { key: 'h2h', name: 'Moneyline', icon: '💰' },
        { key: 'spreads', name: 'Spread', icon: '📊' },
        { key: 'totals', name: 'Over/Under', icon: '🎯' }
    ],

    TOP_BOOKMAKERS: [
        { key: 'draftkings', name: 'DraftKings', color: '#53D337', popular: true },
        { key: 'fanduel', name: 'FanDuel', color: '#1E8CEB', popular: true },
        { key: 'betmgm', name: 'BetMGM', color: '#B8860B', popular: true },
        { key: 'caesars', name: 'Caesars', color: '#FFD700', popular: true },
        { key: 'pointsbet', name: 'PointsBet', color: '#FF6B35', popular: true },
        { key: 'williamhill', name: 'William Hill', color: '#005EB8', popular: false },
        { key: 'barstool', name: 'Barstool', color: '#000000', popular: false },
        { key: 'betrivers', name: 'BetRivers', color: '#005DAA', popular: false }
    ],

    // Initialize
    async init() {
        console.log('🎯 Initializing Ultimate Bet Builder V2');
        
        // Check if we're on the bet builder page
        const container = document.getElementById('bet-builder-container');
        if (!container) {
            console.log('⏭️ Bet builder container not found, skipping init');
            return;
        }
        
        this.loadSavedPicks();
        await this.loadAllGames();
        this.render();
        this.setupAutoRefresh();
    },

    // Load all games from all sports
    async loadAllGames() {
        if (this.loading) return;
        
        this.loading = true;
        console.log('📡 Loading games from all sports...');

        try {
            // Only fetch sports that backend is currently working for
            // NBA is confirmed working. NFL endpoint is currently returning 500 errors.
            // TODO: Re-enable NFL once backend issue is resolved
            const sports = ['basketball_nba']; // 'americanfootball_nfl' temporarily disabled
            const bookmakers = this.TOP_BOOKMAKERS.slice(0, 5).map(b => b.key).join(',');
            
            const promises = sports.map(sport =>
                fetch(`${CONFIG.API_BASE_URL}/api/odds/${sport}?bookmakers=${bookmakers}`, {
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(15000)
                })
                .then(async res => {
                    if (!res.ok) {
                        console.warn(`⚠️ ${sport} API returned ${res.status} ${res.statusText}`);
                        return null;
                    }
                    return res.json();
                })
                .then(data => ({ sport, data }))
                .catch(err => {
                    console.warn(`⚠️ Failed to load ${sport}:`, err.message);
                    return { sport, data: null };
                })
            );

            const results = await Promise.all(promises);
            const allGames = [];
            let successCount = 0;
            let errorCount = 0;

            results.forEach(({ sport, data }) => {
                if (data?.success && data?.games && data.games.length > 0) {
                    console.log(`✅ ${sport}: ${data.games.length} games`);
                    data.games.forEach(game => {
                        const transformed = this.transformGame(game, sport);
                        if (transformed) allGames.push(transformed);
                    });
                    successCount++;
                } else if (data?.games && data.games.length === 0) {
                    console.log(`ℹ️ ${sport}: No games scheduled (offseason or no upcoming games)`);
                    successCount++;
                } else {
                    console.warn(`⚠️ ${sport}: Failed to load (backend may not support this sport yet)`);
                    errorCount++;
                }
            });

            if (allGames.length === 0) {
                if (errorCount === sports.length) {
                    console.warn('⚠️ All sport APIs failed - backend may be experiencing issues');
                } else {
                    console.log('ℹ️ No games currently scheduled across all sports (likely offseason)');
                }
                console.log('📦 Loading fallback demo games so you can test the interface');
                this.loadMockGames();
                this.lastUpdate = new Date();
            } else {
                this.allGames = allGames;
                this.lastUpdate = new Date();
                console.log(`✅ Loaded ${allGames.length} total games with real odds (${successCount}/${sports.length} sports loaded)`);
            }

        } catch (error) {
            console.error('❌ Critical error loading games:', error);
            console.log('📦 Loading fallback demo games');
            this.loadMockGames();
            this.lastUpdate = new Date();
        } finally {
            this.loading = false;
            this.render();
        }
    },

    // Transform game data
    transformGame(game, sportKey) {
        try {
            const sportName = this.SPORTS.find(s => s.key === sportKey)?.name || sportKey;
            const sportIcon = this.SPORTS.find(s => s.key === sportKey)?.icon || '🏆';

            // Extract all markets
            const markets = {};
            
            if (game.bookmakers && game.bookmakers.length > 0) {
                game.bookmakers.forEach(bookmaker => {
                    bookmaker.markets.forEach(market => {
                        if (!markets[market.key]) {
                            markets[market.key] = [];
                        }
                        
                        markets[market.key].push({
                            bookmaker: bookmaker.title,
                            bookmakerKey: bookmaker.key,
                            outcomes: market.outcomes.map(outcome => ({
                                name: outcome.name,
                                price: this.decimalToAmerican(outcome.price),
                                point: outcome.point || null
                            }))
                        });
                    });
                });
            }

            // Calculate best odds
            const bestOdds = this.calculateBestOdds(markets);

            // Determine if live
            const commenceTime = new Date(game.commence_time);
            const isLive = commenceTime < new Date();
            const isUpcoming = commenceTime > new Date();

            return {
                id: game.id,
                sport: sportName,
                sportKey: sportKey,
                sportIcon: sportIcon,
                homeTeam: game.home_team,
                awayTeam: game.away_team,
                commence_time: game.commence_time,
                commenceTime: commenceTime,
                isLive: isLive,
                isUpcoming: isUpcoming,
                timeDisplay: this.formatGameTime(commenceTime),
                markets: markets,
                bestOdds: bestOdds,
                bookmakerCount: game.bookmakers?.length || 0
            };
        } catch (error) {
            console.warn('Failed to transform game:', error);
            return null;
        }
    },

    // Calculate best odds from all bookmakers
    calculateBestOdds(markets) {
        const best = {};

        Object.keys(markets).forEach(marketKey => {
            const allOutcomes = {};
            
            markets[marketKey].forEach(bookmakerMarket => {
                bookmakerMarket.outcomes.forEach(outcome => {
                    if (!allOutcomes[outcome.name]) {
                        allOutcomes[outcome.name] = [];
                    }
                    allOutcomes[outcome.name].push({
                        price: outcome.price,
                        point: outcome.point,
                        bookmaker: bookmakerMarket.bookmaker,
                        bookmakerKey: bookmakerMarket.bookmakerKey
                    });
                });
            });

            // Find best odds for each outcome
            best[marketKey] = {};
            Object.keys(allOutcomes).forEach(outcomeName => {
                const sorted = allOutcomes[outcomeName].sort((a, b) => b.price - a.price);
                best[marketKey][outcomeName] = sorted[0];
            });
        });

        return best;
    },

    // Convert decimal to American odds
    decimalToAmerican(decimal) {
        if (decimal >= 2.0) {
            return Math.round((decimal - 1) * 100);
        } else {
            return Math.round(-100 / (decimal - 1));
        }
    },

    // Format game time
    formatGameTime(date) {
        const now = new Date();
        const diff = date - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (diff < 0) {
            return 'LIVE';
        } else if (hours < 1) {
            const mins = Math.floor(diff / (1000 * 60));
            return `${mins}m`;
        } else if (hours < 24) {
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        } else if (hours < 48) {
            return `Tomorrow ${date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            })}`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        }
    },

    // Load mock games (for demo/testing)
    loadMockGames() {
        console.log('📦 Loading demo games for testing');
        this.allGames = [
            {
                id: 'mock-1',
                sport: 'NBA',
                sportKey: 'basketball_nba',
                sportIcon: '🏀',
                homeTeam: 'Los Angeles Lakers',
                awayTeam: 'Boston Celtics',
                commence_time: new Date(Date.now() + 7200000).toISOString(),
                isLive: false,
                isUpcoming: true,
                timeDisplay: '7:30 PM',
                bestOdds: {
                    h2h: {
                        'Los Angeles Lakers': { price: -140, bookmaker: 'DraftKings', bookmakerKey: 'draftkings' },
                        'Boston Celtics': { price: +120, bookmaker: 'FanDuel', bookmakerKey: 'fanduel' }
                    }
                },
                bookmakerCount: 5
            },
            {
                id: 'mock-2',
                sport: 'NFL',
                sportKey: 'americanfootball_nfl',
                sportIcon: '🏈',
                homeTeam: 'Kansas City Chiefs',
                awayTeam: 'Buffalo Bills',
                commence_time: new Date(Date.now() + 10800000).toISOString(),
                isLive: false,
                isUpcoming: true,
                timeDisplay: '8:15 PM',
                bestOdds: {
                    h2h: {
                        'Kansas City Chiefs': { price: -165, bookmaker: 'BetMGM', bookmakerKey: 'betmgm' },
                        'Buffalo Bills': { price: +145, bookmaker: 'DraftKings', bookmakerKey: 'draftkings' }
                    }
                },
                bookmakerCount: 5
            }
        ];
    },

    // Search games
    searchGames(query) {
        this.searchTerm = query.toLowerCase();
        
        if (!query) {
            this.searchResults = [];
            return;
        }

        this.searchResults = this.allGames.filter(game => 
            game.homeTeam.toLowerCase().includes(this.searchTerm) ||
            game.awayTeam.toLowerCase().includes(this.searchTerm) ||
            game.sport.toLowerCase().includes(this.searchTerm)
        );

        console.log(`🔍 Found ${this.searchResults.length} games matching "${query}"`);
        this.render();
    },

    // Filter games
    filterGames() {
        let filtered = [...this.allGames];

        // Filter by sport
        if (this.filters.sport !== 'all') {
            filtered = filtered.filter(g => g.sportKey === this.filters.sport);
        }

        // Filter by status
        if (this.filters.status === 'live') {
            filtered = filtered.filter(g => g.isLive);
        } else if (this.filters.status === 'upcoming') {
            filtered = filtered.filter(g => g.isUpcoming);
        }

        return filtered;
    },

    // Get popular games (upcoming, sorted by time)
    getPopularGames() {
        return this.allGames
            .filter(g => g.isUpcoming)
            .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time))
            .slice(0, 20);
    },

    // Add pick to parlay
    addPick(pick) {
        // Check if already exists
        const exists = this.selectedPicks.find(p => 
            p.gameId === pick.gameId && p.selection === pick.selection
        );

        if (exists) {
            this.showToast('Pick already in your parlay', 'warning');
            return;
        }

        // Check for conflicts (same game)
        const conflict = this.selectedPicks.find(p => p.gameId === pick.gameId);
        if (conflict) {
            this.showToast('Cannot add multiple picks from the same game', 'error');
            return;
        }

        this.selectedPicks.push(pick);
        this.savePicks();
        this.calculateParlayOdds();
        this.render();
        this.showToast('Pick added! 🎯', 'success');
    },

    // Remove pick
    removePick(index) {
        this.selectedPicks.splice(index, 1);
        this.savePicks();
        this.calculateParlayOdds();
        this.render();
    },

    // Clear all picks
    clearAllPicks() {
        if (confirm('Clear all picks from your parlay?')) {
            this.selectedPicks = [];
            this.savePicks();
            this.calculateParlayOdds();
            this.render();
        }
    },

    // Calculate parlay odds
    calculateParlayOdds() {
        if (this.selectedPicks.length === 0) {
            this.parlayOdds = 0;
            this.potentialPayout = 0;
            return { odds: 0, payout: 0, profit: 0 };
        }

        let totalDecimal = 1;
        
        this.selectedPicks.forEach(pick => {
            const odds = pick.odds;
            const decimal = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
            totalDecimal *= decimal;
        });

        const parlayOdds = totalDecimal >= 2.0 
            ? Math.round((totalDecimal - 1) * 100)
            : Math.round(-100 / (totalDecimal - 1));

        const wager = parseFloat(document.getElementById('parlay-wager-v2')?.value || 0);
        const payout = wager * totalDecimal;
        const profit = payout - wager;

        return { odds: parlayOdds, payout, profit, totalDecimal };
    },

    // Save picks to localStorage
    savePicks() {
        localStorage.setItem('bet_builder_v2_picks', JSON.stringify(this.selectedPicks));
    },

    // Load saved picks
    loadSavedPicks() {
        const saved = localStorage.getItem('bet_builder_v2_picks');
        if (saved) {
            try {
                this.selectedPicks = JSON.parse(saved);
            } catch (e) {
                this.selectedPicks = [];
            }
        }
    },

    // Setup auto-refresh
    setupAutoRefresh() {
        setInterval(() => {
            console.log('🔄 Auto-refreshing odds...');
            this.loadAllGames();
        }, 2 * 60 * 1000); // Every 2 minutes
    },

    // Show toast
    showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    },

    // Main render function
    render() {
        const container = document.getElementById('bet-builder-container');
        if (!container) return;

        const parlayData = this.calculateParlayOdds();

        container.innerHTML = `
            <div class="bet-builder-v2-wrapper">
                ${this.renderHeader()}
                <div class="bet-builder-v2-layout">
                    ${this.renderBetSlip(parlayData)}
                    ${this.renderMainContent()}
                </div>
            </div>
        `;

        this.attachEventListeners();
    },

    // Render header
    renderHeader() {
        return `
            <div class="bb-v2-header">
                <div class="bb-v2-header-content">
                    <div class="bb-v2-title">
                        <div class="bb-v2-title-icon">🎯</div>
                        <div>
                            <h1>Ultimate Bet Builder</h1>
                            <p>Compare odds from 5 top sportsbooks • NBA games live (NFL coming soon)</p>
                        </div>
                    </div>
                    <div class="bb-v2-header-stats">
                        <div class="bb-v2-stat">
                            <div class="bb-v2-stat-value">${this.allGames.length}</div>
                            <div class="bb-v2-stat-label">Games</div>
                        </div>
                        <div class="bb-v2-stat">
                            <div class="bb-v2-stat-value">2</div>
                            <div class="bb-v2-stat-label">Sports</div>
                        </div>
                        <div class="bb-v2-stat">
                            <div class="bb-v2-stat-value">5</div>
                            <div class="bb-v2-stat-label">Books</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Render bet slip (sidebar)
    renderBetSlip(parlayData) {
        return `
            <div class="bb-v2-bet-slip">
                <div class="bb-v2-slip-header">
                    <h3>
                        <i class="fas fa-clipboard-list"></i>
                        Bet Slip (${this.selectedPicks.length})
                    </h3>
                    ${this.selectedPicks.length > 0 ? `
                        <button class="bb-v2-clear-btn" onclick="betBuilderV2.clearAllPicks()">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>

                ${this.selectedPicks.length === 0 ? `
                    <div class="bb-v2-empty-slip">
                        <div class="bb-v2-empty-icon">🎯</div>
                        <h4>No Picks Yet</h4>
                        <p>Select games below to build your parlay</p>
                    </div>
                ` : `
                    <div class="bb-v2-picks-list">
                        ${this.selectedPicks.map((pick, index) => `
                            <div class="bb-v2-pick-card">
                                <div class="bb-v2-pick-header">
                                    <span class="bb-v2-pick-sport">${pick.sportIcon} ${pick.sport}</span>
                                    <button class="bb-v2-pick-remove" onclick="betBuilderV2.removePick(${index})">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="bb-v2-pick-game">${pick.game}</div>
                                <div class="bb-v2-pick-selection">
                                    <strong>${pick.selection}</strong>
                                    <span class="bb-v2-pick-odds">${pick.odds > 0 ? '+' : ''}${pick.odds}</span>
                                </div>
                                <div class="bb-v2-pick-bookmaker">
                                    <i class="fas fa-bookmark"></i>
                                    ${pick.bookmaker}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="bb-v2-parlay-summary">
                        <div class="bb-v2-parlay-odds">
                            <span>Parlay Odds:</span>
                            <strong>${parlayData.odds > 0 ? '+' : ''}${parlayData.odds}</strong>
                        </div>

                        <div class="bb-v2-wager-input">
                            <label>Wager Amount</label>
                            <div class="bb-v2-input-wrapper">
                                <span class="bb-v2-currency">$</span>
                                <input 
                                    type="number" 
                                    id="parlay-wager-v2" 
                                    placeholder="0.00" 
                                    min="0" 
                                    step="0.01"
                                    oninput="betBuilderV2.render()"
                                >
                            </div>
                        </div>

                        <div class="bb-v2-payout-display">
                            <div class="bb-v2-payout-row">
                                <span>Potential Win:</span>
                                <strong class="bb-v2-profit">$${parlayData.profit.toFixed(2)}</strong>
                            </div>
                            <div class="bb-v2-payout-row">
                                <span>Total Payout:</span>
                                <strong class="bb-v2-payout">$${parlayData.payout.toFixed(2)}</strong>
                            </div>
                        </div>

                        <button class="bb-v2-place-bet-btn" onclick="betBuilderV2.placeBet()">
                            <i class="fas fa-check-circle"></i>
                            Place Parlay
                        </button>

                        <button class="bb-v2-ai-optimize-btn" onclick="betBuilderV2.optimizeWithAI()">
                            <i class="fas fa-magic"></i>
                            AI Optimize
                        </button>
                    </div>
                `}
            </div>
        `;
    },

    // Render main content
    renderMainContent() {
        return `
            <div class="bb-v2-main-content">
                ${this.renderTabs()}
                ${this.renderFilters()}
                ${this.renderGames()}
            </div>
        `;
    },

    // Render tabs
    renderTabs() {
        return `
            <div class="bb-v2-tabs">
                <button 
                    class="bb-v2-tab ${this.selectedTab === 'popular' ? 'active' : ''}"
                    onclick="betBuilderV2.switchTab('popular')"
                >
                    <i class="fas fa-fire"></i>
                    Popular Games
                </button>
                <button 
                    class="bb-v2-tab ${this.selectedTab === 'search' ? 'active' : ''}"
                    onclick="betBuilderV2.switchTab('search')"
                >
                    <i class="fas fa-search"></i>
                    Search All Games
                </button>
                <button 
                    class="bb-v2-tab ${this.selectedTab === 'ai-picks' ? 'active' : ''}"
                    onclick="betBuilderV2.switchTab('ai-picks')"
                >
                    <i class="fas fa-robot"></i>
                    AI Picks
                </button>
            </div>
        `;
    },

    // Render filters
    renderFilters() {
        if (this.selectedTab === 'ai-picks') return '';

        return `
            <div class="bb-v2-filters">
                ${this.selectedTab === 'search' ? `
                    <div class="bb-v2-search-bar">
                        <i class="fas fa-search"></i>
                        <input 
                            type="text" 
                            placeholder="Search teams, games, leagues..."
                            id="bb-v2-search-input"
                            value="${this.searchTerm}"
                            oninput="betBuilderV2.searchGames(this.value)"
                        >
                    </div>
                ` : ''}

                <div class="bb-v2-filter-row">
                    <select class="bb-v2-select" onchange="betBuilderV2.setFilter('sport', this.value)">
                        ${this.SPORTS.map(sport => `
                            <option value="${sport.key}" ${this.filters.sport === sport.key ? 'selected' : ''}>
                                ${sport.icon} ${sport.name}
                            </option>
                        `).join('')}
                    </select>

                    <select class="bb-v2-select" onchange="betBuilderV2.setFilter('market', this.value)">
                        ${this.MARKETS.map(market => `
                            <option value="${market.key}" ${this.filters.market === market.key ? 'selected' : ''}>
                                ${market.icon} ${market.name}
                            </option>
                        `).join('')}
                    </select>

                    <select class="bb-v2-select" onchange="betBuilderV2.setFilter('status', this.value)">
                        <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>All Games</option>
                        <option value="live" ${this.filters.status === 'live' ? 'selected' : ''}>🔴 Live</option>
                        <option value="upcoming" ${this.filters.status === 'upcoming' ? 'selected' : ''}>⏰ Upcoming</option>
                    </select>

                    <button class="bb-v2-refresh-btn" onclick="betBuilderV2.loadAllGames()">
                        <i class="fas fa-sync-alt"></i>
                        Refresh
                    </button>
                </div>
            </div>
        `;
    },

    // Render games
    renderGames() {
        if (this.selectedTab === 'ai-picks') {
            return this.renderAIPicks();
        }

        const games = this.selectedTab === 'search' && this.searchTerm
            ? this.searchResults
            : this.getPopularGames();

        if (this.loading) {
            return `
                <div class="bb-v2-loading">
                    <div class="spinner"></div>
                    <p>Loading games from all sports...</p>
                </div>
            `;
        }

        if (games.length === 0) {
            return `
                <div class="bb-v2-empty">
                    <div class="bb-v2-empty-icon">🔍</div>
                    <h3>No games found</h3>
                    <p>${this.searchTerm ? 'Try a different search term' : 'Check back soon for upcoming games'}</p>
                </div>
            `;
        }

        return `
            <div class="bb-v2-games-grid">
                ${games.map(game => this.renderGameCard(game)).join('')}
            </div>
        `;
    },

    // Render game card
    renderGameCard(game) {
        const market = game.bestOdds[this.filters.market] || game.bestOdds.h2h || {};
        const homeOdds = market[game.homeTeam];
        const awayOdds = market[game.awayTeam];

        return `
            <div class="bb-v2-game-card ${game.isLive ? 'live' : ''}">
                <div class="bb-v2-game-header">
                    <div class="bb-v2-game-sport">
                        <span>${game.sportIcon}</span>
                        ${game.sport}
                    </div>
                    <div class="bb-v2-game-time">
                        ${game.isLive ? '<span class="live-badge">🔴 LIVE</span>' : ''}
                        ${game.timeDisplay}
                    </div>
                </div>

                <div class="bb-v2-game-matchup">
                    <div class="bb-v2-team-row">
                        <div class="bb-v2-team-name">
                            <span class="bb-v2-team-icon">🏆</span>
                            ${game.awayTeam}
                        </div>
                        ${awayOdds ? `
                            <div class="bb-v2-odds-group">
                                <div class="bb-v2-best-odds">
                                    <span class="bb-v2-odds-value">${awayOdds.price > 0 ? '+' : ''}${awayOdds.price}</span>
                                    <span class="bb-v2-bookmaker">${awayOdds.bookmaker}</span>
                                </div>
                                <button 
                                    class="bb-v2-add-pick-btn"
                                    onclick='betBuilderV2.addPick({
                                        gameId: "${game.id}",
                                        game: "${game.awayTeam} @ ${game.homeTeam}",
                                        selection: "${game.awayTeam} ML",
                                        odds: ${awayOdds.price},
                                        bookmaker: "${awayOdds.bookmaker}",
                                        bookmakerKey: "${awayOdds.bookmakerKey}",
                                        sport: "${game.sport}",
                                        sportIcon: "${game.sportIcon}"
                                    })'
                                >
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        ` : '<div class="bb-v2-no-odds">-</div>'}
                    </div>

                    <div class="bb-v2-vs">@</div>

                    <div class="bb-v2-team-row">
                        <div class="bb-v2-team-name">
                            <span class="bb-v2-team-icon">🏠</span>
                            ${game.homeTeam}
                        </div>
                        ${homeOdds ? `
                            <div class="bb-v2-odds-group">
                                <div class="bb-v2-best-odds">
                                    <span class="bb-v2-odds-value">${homeOdds.price > 0 ? '+' : ''}${homeOdds.price}</span>
                                    <span class="bb-v2-bookmaker">${homeOdds.bookmaker}</span>
                                </div>
                                <button 
                                    class="bb-v2-add-pick-btn"
                                    onclick='betBuilderV2.addPick({
                                        gameId: "${game.id}",
                                        game: "${game.awayTeam} @ ${game.homeTeam}",
                                        selection: "${game.homeTeam} ML",
                                        odds: ${homeOdds.price},
                                        bookmaker: "${homeOdds.bookmaker}",
                                        bookmakerKey: "${homeOdds.bookmakerKey}",
                                        sport: "${game.sport}",
                                        sportIcon: "${game.sportIcon}"
                                    })'
                                >
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        ` : '<div class="bb-v2-no-odds">-</div>'}
                    </div>
                </div>

                <div class="bb-v2-game-footer">
                    <button class="bb-v2-compare-btn" onclick="betBuilderV2.showOddsComparison('${game.id}')">
                        <i class="fas fa-chart-bar"></i>
                        Compare All ${game.bookmakerCount} Books
                    </button>
                </div>
            </div>
        `;
    },

    // Render AI picks
    renderAIPicks() {
        if (!window.aiCoachesManager || !window.aiCoachesManager.coaches) {
            return `
                <div class="bb-v2-empty">
                    <div class="bb-v2-empty-icon">🤖</div>
                    <h3>AI Coaches Loading...</h3>
                    <p>Please wait while we fetch AI predictions</p>
                </div>
            `;
        }

        const coaches = window.aiCoachesManager.coaches;

        return `
            <div class="bb-v2-ai-picks-section">
                <div class="bb-v2-ai-header">
                    <h3>🤖 AI Coach Recommendations</h3>
                    <p>Expert AI predictions powered by advanced analytics</p>
                </div>

                <div class="bb-v2-coaches-grid">
                    ${coaches.map(coach => `
                        <div class="bb-v2-coach-card">
                            <div class="bb-v2-coach-header">
                                <div class="bb-v2-coach-avatar">${coach.avatar}</div>
                                <div class="bb-v2-coach-info">
                                    <h4>${coach.name}</h4>
                                    <p>${coach.specialty}</p>
                                </div>
                                <div class="bb-v2-coach-accuracy">
                                    <div class="bb-v2-accuracy-circle">${coach.accuracy?.toFixed(0) || 0}%</div>
                                </div>
                            </div>

                            <div class="bb-v2-coach-picks">
                                ${coach.recentPicks?.slice(0, 3).map(pick => `
                                    <div class="bb-v2-coach-pick">
                                        <div class="bb-v2-coach-pick-game">${pick.game}</div>
                                        <div class="bb-v2-coach-pick-selection">
                                            <strong>${pick.pick}</strong>
                                            <span class="bb-v2-coach-pick-odds">${pick.odds}</span>
                                        </div>
                                        <div class="bb-v2-coach-pick-confidence">
                                            <div class="bb-v2-confidence-bar">
                                                <div class="bb-v2-confidence-fill" style="width: ${pick.confidence}%"></div>
                                            </div>
                                            <span>${pick.confidence}% confidence</span>
                                        </div>
                                    </div>
                                `).join('') || '<p class="bb-v2-no-picks">No picks available</p>'}
                            </div>

                            <button 
                                class="bb-v2-use-picks-btn"
                                onclick="betBuilderV2.useCoachPicks(${coach.id})"
                                ${!coach.recentPicks || coach.recentPicks.length === 0 ? 'disabled' : ''}
                            >
                                <i class="fas fa-magic"></i>
                                Use These Picks
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Switch tab
    switchTab(tab) {
        this.selectedTab = tab;
        this.render();
    },

    // Set filter
    setFilter(key, value) {
        this.filters[key] = value;
        this.render();
    },

    // Show odds comparison modal
    showOddsComparison(gameId) {
        const game = this.allGames.find(g => g.id === gameId);
        if (!game) return;

        // This would open a modal showing all bookmakers' odds
        alert(`Odds comparison for ${game.awayTeam} @ ${game.homeTeam}\n\nThis feature would show all ${game.bookmakerCount} bookmakers' odds in a detailed comparison table.`);
    },

    // Use coach picks
    useCoachPicks(coachId) {
        const coach = window.aiCoachesManager?.coaches?.find(c => c.id === coachId);
        if (!coach || !coach.recentPicks) return;

        this.selectedPicks = [];

        coach.recentPicks.forEach(pick => {
            const betPick = {
                gameId: `coach-${coachId}-${pick.game}`,
                game: pick.game,
                selection: pick.pick,
                odds: this.parseOdds(pick.odds),
                bookmaker: 'Best Available',
                bookmakerKey: 'best',
                sport: coach.specialty.split(' ')[0],
                sportIcon: '🏆',
                coachName: coach.name,
                confidence: pick.confidence
            };

            this.selectedPicks.push(betPick);
        });

        this.savePicks();
        this.calculateParlayOdds();
        this.selectedTab = 'popular';
        this.render();
        this.showToast(`Loaded ${this.selectedPicks.length} picks from ${coach.name}! 🎯`, 'success');
    },

    // Parse odds string
    parseOdds(oddsString) {
        if (typeof oddsString === 'number') return oddsString;
        const match = oddsString.match(/([+-]?\d+)/);
        return match ? parseInt(match[1]) : 0;
    },

    // Optimize with AI
    optimizeWithAI() {
        if (this.selectedPicks.length < 2) {
            this.showToast('Add at least 2 picks to optimize', 'warning');
            return;
        }

        alert('🤖 AI Optimization\n\nThis feature would analyze your parlay and suggest:\n\n• Better odds from different bookmakers\n• Alternative picks with higher success probability\n• Optimal parlay combinations\n• Risk assessment and recommendations');
    },

    // Place bet
    placeBet() {
        if (this.selectedPicks.length < 2) {
            this.showToast('Add at least 2 picks to place a parlay', 'error');
            return;
        }

        const wager = parseFloat(document.getElementById('parlay-wager-v2')?.value || 0);
        if (wager <= 0) {
            this.showToast('Enter a wager amount', 'error');
            return;
        }

        const parlayData = this.calculateParlayOdds();
        
        const confirmed = confirm(
            `Place ${this.selectedPicks.length}-Leg Parlay?\n\n` +
            `Wager: $${wager.toFixed(2)}\n` +
            `Odds: ${parlayData.odds > 0 ? '+' : ''}${parlayData.odds}\n` +
            `Potential Win: $${parlayData.profit.toFixed(2)}\n` +
            `Total Payout: $${parlayData.payout.toFixed(2)}`
        );

        if (!confirmed) return;

        // Save to history
        const history = JSON.parse(localStorage.getItem('parlay_history_v2') || '[]');
        history.unshift({
            id: Date.now(),
            picks: this.selectedPicks,
            wager: wager,
            odds: parlayData.odds,
            payout: parlayData.payout,
            profit: parlayData.profit,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });
        localStorage.setItem('parlay_history_v2', JSON.stringify(history.slice(0, 50)));

        // Clear picks
        this.selectedPicks = [];
        this.savePicks();
        this.render();

        this.showToast('Parlay placed successfully! 🎉', 'success');
    },

    // Attach event listeners
    attachEventListeners() {
        // Event listeners are handled inline with onclick attributes
        // This function is kept for future dynamic listeners
    }
};

// Initialize when loaded
window.addEventListener('load', () => {
    if (document.getElementById('bet-builder-container')) {
        betBuilderV2.init();
    }
});

// Export globally
window.betBuilderV2 = betBuilderV2;

console.log('✅ Ultimate Bet Builder V2 loaded');
