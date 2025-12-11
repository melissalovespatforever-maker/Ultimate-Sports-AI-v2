// ============================================
// ENHANCED LIVE SCORES
// Beautiful real-time sports scores with filtering
// ============================================

class LiveScoresEnhanced {
    constructor() {
        this.games = [];
        this.currentSport = 'all';
        this.isLoading = false;
        this.autoRefreshInterval = null;
    }

    async init() {
        console.log('⚡ Initializing enhanced live scores...');
        this.renderEnhancedUI();
        this.attachEventListeners();
        await this.loadGames();
        this.startAutoRefresh();
    }

    renderEnhancedUI() {
        const scoresPage = document.getElementById('scores-page');
        if (!scoresPage) return;

        const pageContent = scoresPage.querySelector('.page-content');
        if (!pageContent) return;

        pageContent.innerHTML = `
            <!-- Hero Section -->
            <div class="live-scores-hero">
                <h2 class="live-scores-title">
                    <span>⚡ Live Scores</span>
                    <span class="live-indicator-badge">
                        <span class="live-dot-pulse"></span>
                        LIVE
                    </span>
                </h2>
                <p class="live-scores-subtitle">Real-time scores from all major leagues</p>
            </div>

            <!-- Sport Filters -->
            <div class="sport-filters">
                <button class="sport-filter-btn active" data-sport="all">
                    <span class="sport-filter-icon">🌎</span>
                    All Sports
                </button>
                <button class="sport-filter-btn" data-sport="basketball_nba">
                    <span class="sport-filter-icon">🏀</span>
                    NBA
                </button>
                <button class="sport-filter-btn" data-sport="americanfootball_nfl">
                    <span class="sport-filter-icon">🏈</span>
                    NFL
                </button>
                <button class="sport-filter-btn" data-sport="baseball_mlb">
                    <span class="sport-filter-icon">⚾</span>
                    MLB
                </button>
                <button class="sport-filter-btn" data-sport="icehockey_nhl">
                    <span class="sport-filter-icon">🏒</span>
                    NHL
                </button>
                <button class="sport-filter-btn" data-sport="soccer_epl">
                    <span class="sport-filter-icon">⚽</span>
                    Soccer
                </button>
            </div>

            <!-- Games Container -->
            <div class="games-container" id="games-container">
                ${this.getLoadingState()}
            </div>

            <!-- Refresh Button -->
            <button class="refresh-scores-btn" id="refresh-scores-btn" title="Refresh Scores">
                <i class="fas fa-sync-alt"></i>
            </button>
        `;
    }

    attachEventListeners() {
        // Sport filter buttons
        document.querySelectorAll('.sport-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sport = e.currentTarget.dataset.sport;
                this.filterBySport(sport);
                
                // Update active state
                document.querySelectorAll('.sport-filter-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-scores-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshScores();
            });
        }
    }

    async loadGames() {
        this.isLoading = true;
        
        try {
            const response = await fetch(`${window.API_URL}/api/scores/live`);
            if (response.ok) {
                const data = await response.json();
                this.games = data.games || [];
                this.renderGames();
            } else {
                this.renderEmptyState('Unable to load scores');
            }
        } catch (error) {
            console.error('Error loading games:', error);
            this.renderEmptyState('Connection error');
        } finally {
            this.isLoading = false;
        }
    }

    renderGames() {
        const container = document.getElementById('games-container');
        if (!container) return;

        const filteredGames = this.currentSport === 'all' 
            ? this.games 
            : this.games.filter(game => game.sport_key === this.currentSport);

        if (filteredGames.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = filteredGames.map(game => this.createGameCard(game)).join('');
        this.attachGameCardListeners();
    }

    createGameCard(game) {
        const isLive = game.status === 'live';
        const isCompleted = game.status === 'completed';
        const statusClass = isLive ? 'live' : isCompleted ? 'completed' : 'scheduled';
        
        const homeScore = game.home_score || 0;
        const awayScore = game.away_score || 0;

        return `
            <div class="game-card-enhanced ${statusClass}" data-game-id="${game.id}">
                <div class="game-card-header">
                    <div class="game-league">
                        <span class="league-icon">${this.getLeagueIcon(game.sport_key)}</span>
                        ${this.getLeagueName(game.sport_key)}
                    </div>
                    <div class="game-status ${statusClass}">
                        ${isLive ? '<span class="live-dot-pulse"></span>' : ''}
                        ${this.getStatusText(game)}
                    </div>
                </div>

                <div class="game-matchup">
                    <div class="team away">
                        <div class="team-name">${game.away_team}</div>
                        ${game.away_record ? `<div class="team-record">${game.away_record}</div>` : ''}
                    </div>

                    <div class="score-display">
                        <div class="score-numbers">
                            <span>${awayScore}</span>
                            <span class="score-separator">-</span>
                            <span>${homeScore}</span>
                        </div>
                        <div class="game-time">${this.getGameTime(game)}</div>
                    </div>

                    <div class="team home">
                        <div class="team-name">${game.home_team}</div>
                        ${game.home_record ? `<div class="team-record">${game.home_record}</div>` : ''}
                    </div>
                </div>

                <div class="game-footer">
                    <div class="game-stats">
                        ${game.venue ? `
                            <div class="game-stat-item">
                                <i class="fas fa-map-marker-alt"></i>
                                ${game.venue}
                            </div>
                        ` : ''}
                        ${game.tv ? `
                            <div class="game-stat-item">
                                <i class="fas fa-tv"></i>
                                ${game.tv}
                            </div>
                        ` : ''}
                    </div>
                    <div class="game-actions">
                        <button class="game-action-btn view-details-btn" data-game-id="${game.id}">
                            <i class="fas fa-chart-line"></i>
                            Stats
                        </button>
                        <button class="game-action-btn make-pick-btn" data-game-id="${game.id}">
                            <i class="fas fa-bullseye"></i>
                            Pick
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachGameCardListeners() {
        // View details buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameId = e.currentTarget.dataset.gameId;
                this.viewGameDetails(gameId);
            });
        });

        // Make pick buttons
        document.querySelectorAll('.make-pick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameId = e.currentTarget.dataset.gameId;
                this.makePick(gameId);
            });
        });
    }

    viewGameDetails(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        window.showToast(`📊 Viewing details for ${game.away_team} @ ${game.home_team}`, 'info');
        // In a real app, navigate to game details page
    }

    makePick(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        window.showToast(`🎯 Make your pick for this game!`, 'success');
        // In a real app, open pick modal
    }

    getLeagueIcon(sportKey) {
        const icons = {
            'basketball_nba': '🏀',
            'americanfootball_nfl': '🏈',
            'baseball_mlb': '⚾',
            'icehockey_nhl': '🏒',
            'soccer_epl': '⚽',
            'tennis_atp': '🎾',
            'mma_mixed_martial_arts': '🥊'
        };
        return icons[sportKey] || '🏆';
    }

    getLeagueName(sportKey) {
        const names = {
            'basketball_nba': 'NBA',
            'americanfootball_nfl': 'NFL',
            'baseball_mlb': 'MLB',
            'icehockey_nhl': 'NHL',
            'soccer_epl': 'Premier League',
            'tennis_atp': 'ATP Tour',
            'mma_mixed_martial_arts': 'MMA'
        };
        return names[sportKey] || 'Game';
    }

    getStatusText(game) {
        if (game.status === 'live') return 'LIVE';
        if (game.status === 'completed') return 'FINAL';
        return 'UPCOMING';
    }

    getGameTime(game) {
        if (game.status === 'live') {
            return game.time_remaining || 'IN PROGRESS';
        }
        if (game.status === 'completed') {
            return 'FINAL';
        }
        if (game.commence_time) {
            const gameDate = new Date(game.commence_time);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (gameDate.toDateString() === today.toDateString()) {
                return gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            } else if (gameDate.toDateString() === tomorrow.toDateString()) {
                return 'Tomorrow ' + gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            } else {
                return gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        }
        return 'TBD';
    }

    filterBySport(sport) {
        this.currentSport = sport;
        this.renderGames();
    }

    async refreshScores() {
        const btn = document.getElementById('refresh-scores-btn');
        if (btn) {
            btn.classList.add('spinning');
        }

        await this.loadGames();

        if (btn) {
            setTimeout(() => {
                btn.classList.remove('spinning');
            }, 1000);
        }

        window.showToast('✅ Scores refreshed!', 'success');
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.autoRefreshInterval = setInterval(() => {
            this.loadGames();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }

    getLoadingState() {
        return `
            <div class="game-card-skeleton">
                <div class="skeleton-line" style="width: 40%;"></div>
                <div class="skeleton-score"></div>
                <div class="skeleton-line" style="width: 60%; margin: 0 auto;"></div>
            </div>
            <div class="game-card-skeleton">
                <div class="skeleton-line" style="width: 40%;"></div>
                <div class="skeleton-score"></div>
                <div class="skeleton-line" style="width: 60%; margin: 0 auto;"></div>
            </div>
        `;
    }

    getEmptyState() {
        return `
            <div class="empty-state-scores">
                <div class="empty-state-icon">🏆</div>
                <h3 class="empty-state-title">No games right now</h3>
                <p class="empty-state-desc">Check back later for live scores and upcoming games</p>
            </div>
        `;
    }

    renderEmptyState(message) {
        const container = document.getElementById('games-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state-scores">
                    <div class="empty-state-icon">😔</div>
                    <h3 class="empty-state-title">${message}</h3>
                    <p class="empty-state-desc">Please try again later</p>
                </div>
            `;
        }
    }
}

// Initialize when navigating to scores page
document.addEventListener('DOMContentLoaded', () => {
    window.liveScoresEnhanced = new LiveScoresEnhanced();
    
    // Initialize when scores page is shown
    const observer = new MutationObserver(() => {
        const scoresPage = document.getElementById('scores-page');
        if (scoresPage && scoresPage.classList.contains('active')) {
            if (window.liveScoresEnhanced && !window.liveScoresEnhanced.isLoading) {
                window.liveScoresEnhanced.init();
            }
        }
    });

    observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class']
    });
});
