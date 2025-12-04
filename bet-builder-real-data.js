// ============================================
// BET BUILDER - REAL DATA INTEGRATION
// Fetch live games with real odds
// ============================================

console.log('🎯 Loading Bet Builder Real Data Module');

const betBuilderRealData = {
    availableGames: [],
    loading: false,
    lastUpdate: null,
    refreshInterval: null,

    // Initialize
    async init() {
        console.log('🎯 Initializing Bet Builder Real Data');
        await this.loadLiveGames();
        this.startAutoRefresh();
    },

    // Load live games from backend
    async loadLiveGames() {
        if (this.loading) {
            console.log('⏳ Already loading games, skipping duplicate request');
            return;
        }
        
        this.loading = true;
        console.log('📡 Fetching live games with odds from API...');
        console.log('🔗 Backend URL:', CONFIG.API_BASE_URL);

        try {
            // Fetch from top 2 sports in parallel for speed
            const sports = [
                { key: 'basketball_nba', display: 'NBA' },
                { key: 'americanfootball_nfl', display: 'NFL' }
            ];

            // Fetch in parallel (much faster!)
            // Use bookmakers param to limit to top 5 for speed
            const topBooks = 'draftkings,fanduel,betmgm,pointsbet,williamhill';
            
            const promises = sports.map(sport => 
                fetch(`${CONFIG.API_BASE_URL}/api/odds/${sport.key}?bookmakers=${topBooks}`, {
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(15000) // Increased to 15 seconds
                })
                .then(res => {
                    if (!res.ok) {
                        console.error(`❌ ${sport.display} API error: ${res.status}`);
                        return null;
                    }
                    return res.json();
                })
                .then(data => ({ sport: sport.display, data }))
                .catch(error => {
                    console.error(`❌ Failed to load ${sport.display}:`, error.message);
                    return { sport: sport.display, data: null };
                })
            );

            const results = await Promise.all(promises);
            
            const allGames = [];
            
            results.forEach(({ sport, data }) => {
                if (data?.success && data?.games) {
                    console.log(`✅ ${sport}: ${data.games.length} games loaded`);
                    // Only take first 8 games per sport
                    data.games.slice(0, 8).forEach(game => {
                        const transformed = this.transformGame(game, sport);
                        if (transformed) allGames.push(transformed);
                    });
                } else {
                    console.warn(`⚠️ ${sport}: No games available`);
                }
            });

            if (allGames.length === 0) {
                console.warn('⚠️ No games available from any sport (might be offseason)');
                console.log('📦 Loading demo games for testing');
                this.loadFallbackGames();
                return;
            }

            this.availableGames = allGames;
            this.lastUpdate = new Date();
            
            console.log(`✅ Loaded ${allGames.length} total games with real odds`);
            
            // Update bet builder UI
            if (window.betBuilder) {
                window.betBuilder.render();
            }

        } catch (error) {
            console.error('❌ Critical error loading live games:', error);
            console.error('Error details:', error.stack);
            // Show fallback mock data
            this.loadFallbackGames();
        } finally {
            this.loading = false;
            console.log('✅ Load complete - loading flag cleared');
        }
    },

    // Fallback games if API fails
    loadFallbackGames() {
        console.log('📦 Loading demo games (fallback)');
        this.availableGames = [
            {
                id: 'fallback-1',
                sport: 'NBA',
                game: 'Lakers @ Celtics',
                homeTeam: 'Celtics',
                awayTeam: 'Lakers',
                homeOdds: -140,
                awayOdds: +120,
                time: 'Today 7:30 PM',
                commence_time: new Date(Date.now() + 3600000).toISOString(),
                bookmaker: 'DraftKings'
            },
            {
                id: 'fallback-2',
                sport: 'NFL',
                game: 'Cowboys @ Eagles',
                homeTeam: 'Eagles',
                awayTeam: 'Cowboys',
                homeOdds: -165,
                awayOdds: +145,
                time: 'Today 8:15 PM',
                commence_time: new Date(Date.now() + 7200000).toISOString(),
                bookmaker: 'FanDuel'
            }
        ];
        this.lastUpdate = new Date();
        
        if (window.betBuilder) {
            window.betBuilder.render();
        }
    },

    // Transform API game data to bet builder format
    transformGame(game, sportDisplay) {
        try {
            // Get best moneyline odds
            const h2h = game.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h');
            if (!h2h) return null;

            const homeOdds = h2h.outcomes.find(o => o.name === game.home_team);
            const awayOdds = h2h.outcomes.find(o => o.name === game.away_team);

            if (!homeOdds || !awayOdds) return null;

            // Convert decimal odds to American odds
            const homePrice = this.decimalToAmerican(homeOdds.price);
            const awayPrice = this.decimalToAmerican(awayOdds.price);

            // Format game time
            const gameTime = new Date(game.commence_time);
            const timeStr = this.formatGameTime(gameTime);

            return {
                id: game.id,
                sport: sportDisplay,
                game: `${game.away_team} @ ${game.home_team}`,
                homeTeam: game.home_team,
                awayTeam: game.away_team,
                homeOdds: homePrice,
                awayOdds: awayPrice,
                time: timeStr,
                commence_time: game.commence_time,
                bookmaker: game.bookmakers[0]?.title || 'Best Odds'
            };
        } catch (error) {
            console.warn('Failed to transform game:', error);
            return null;
        }
    },

    // Convert decimal odds to American odds
    decimalToAmerican(decimal) {
        if (decimal >= 2.0) {
            return Math.round((decimal - 1) * 100);
        } else {
            return Math.round(-100 / (decimal - 1));
        }
    },

    // Format game time for display
    formatGameTime(date) {
        const now = new Date();
        const diff = date - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (diff < 0) {
            return 'LIVE';
        } else if (hours < 1) {
            const mins = Math.floor(diff / (1000 * 60));
            return `in ${mins}m`;
        } else if (hours < 24) {
            const time = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            return `Today ${time}`;
        } else if (hours < 48) {
            const time = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            return `Tomorrow ${time}`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        }
    },

    // Start auto-refresh every 2 minutes
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing bet builder games...');
            this.loadLiveGames();
        }, 2 * 60 * 1000); // 2 minutes
    },

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    // Get games sorted by time
    getGamesSorted() {
        return this.availableGames
            .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time))
            .slice(0, 15); // Limit to 15 games
    }
};

// Export globally
window.betBuilderRealData = betBuilderRealData;

// Initialize when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        betBuilderRealData.init();
    });
} else {
    betBuilderRealData.init();
}

console.log('✅ Bet Builder Real Data Module loaded');
