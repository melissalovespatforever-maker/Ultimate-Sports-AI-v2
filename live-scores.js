// ============================================
// LIVE SCORES MODULE - REAL SPORTS DATA
// Multiple data sources: ESPN, The Odds API, API-Football
// ============================================

console.log('⚽ Loading Live Scores Module with Real Data');

class LiveScoresManager {
    constructor() {
        this.currentSport = 'all';
        this.refreshInterval = null;
        this.cache = {
            data: null,
            timestamp: 0,
            ttl: 30000 // 30 seconds cache
        };
        
        // Free public APIs (no key required)
        this.apis = {
            espn: 'https://site.api.espn.com/apis/site/v2/sports',
            // Backup: ESPN Scoreboard API (completely free)
            nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
            nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
            mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
            nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
            soccer: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', // Premier League
            cfb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
            cbb: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'
        };
    }

    async load() {
        console.log('🔄 Loading live scores...');
        const container = document.getElementById('live-scores-container');
        if (!container) return;

        // Show loading
        this.showLoading(container);

        try {
            // Get scores from all sports
            const scores = await this.getAllScores();
            
            if (scores.length === 0) {
                this.showNoGames(container);
            } else {
                this.render(scores, container);
                console.log(`✅ Loaded ${scores.length} live/recent games`);
            }

            // Auto-refresh every 30 seconds
            this.startAutoRefresh();
        } catch (error) {
            console.error('❌ Error loading scores:', error);
            this.showError(container);
        }
    }

    async getAllScores() {
        // Check cache first
        const now = Date.now();
        if (this.cache.data && (now - this.cache.timestamp) < this.cache.ttl) {
            console.log('📦 Using cached scores');
            return this.filterBySport(this.cache.data);
        }

        const allGames = [];

        // Fetch from all sports in parallel
        const sports = [
            { name: 'NFL', url: this.apis.nfl, icon: '🏈' },
            { name: 'NBA', url: this.apis.nba, icon: '🏀' },
            { name: 'MLB', url: this.apis.mlb, icon: '⚾' },
            { name: 'NHL', url: this.apis.nhl, icon: '🏒' },
            { name: 'Premier League', url: this.apis.soccer, icon: '⚽' },
            { name: 'College Football', url: this.apis.cfb, icon: '🏈' },
            { name: 'College Basketball', url: this.apis.cbb, icon: '🏀' }
        ];

        const promises = sports.map(sport => 
            this.fetchSportScores(sport.url, sport.name, sport.icon)
                .catch(err => {
                    console.warn(`⚠️ Failed to fetch ${sport.name}:`, err.message);
                    return [];
                })
        );

        const results = await Promise.all(promises);
        results.forEach(games => allGames.push(...games));

        // Sort by game status (live first, then recent)
        allGames.sort((a, b) => {
            if (a.isLive && !b.isLive) return -1;
            if (!a.isLive && b.isLive) return 1;
            return new Date(b.date) - new Date(a.date);
        });

        // Cache results
        this.cache.data = allGames;
        this.cache.timestamp = now;

        return this.filterBySport(allGames);
    }

    async fetchSportScores(url, sportName, icon) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return this.parseESPNData(data, sportName, icon);
        } catch (error) {
            console.error(`Error fetching ${sportName}:`, error);
            return [];
        }
    }

    parseESPNData(data, sportName, icon) {
        if (!data.events || data.events.length === 0) return [];

        return data.events.map(event => {
            const competition = event.competitions[0];
            const status = event.status;
            const homeTeam = competition.competitors.find(t => t.homeAway === 'home');
            const awayTeam = competition.competitors.find(t => t.homeAway === 'away');

            // Determine if game is live
            const isLive = status.type.state === 'in';
            const isCompleted = status.type.state === 'post';
            const isScheduled = status.type.state === 'pre';

            // Get game time/status
            let gameStatus = status.type.shortDetail || status.type.detail;
            if (isLive) {
                gameStatus = `🔴 LIVE - ${status.displayClock || ''}`;
            } else if (isCompleted) {
                gameStatus = 'Final';
            } else if (isScheduled) {
                const date = new Date(event.date);
                gameStatus = date.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                });
            }

            return {
                id: event.id,
                sport: sportName,
                sportIcon: icon,
                league: sportName,
                homeTeam: homeTeam.team.displayName || homeTeam.team.name,
                awayTeam: awayTeam.team.displayName || awayTeam.team.name,
                homeScore: homeTeam.score || '0',
                awayScore: awayTeam.score || '0',
                homeRecord: homeTeam.records ? homeTeam.records[0]?.summary : null,
                awayRecord: awayTeam.records ? awayTeam.records[0]?.summary : null,
                status: gameStatus,
                isLive: isLive,
                isCompleted: isCompleted,
                isScheduled: isScheduled,
                date: event.date,
                venue: competition.venue?.fullName,
                city: competition.venue?.address?.city,
                broadcast: competition.broadcasts?.[0]?.names?.[0],
                homeTeamLogo: homeTeam.team.logo,
                awayTeamLogo: awayTeam.team.logo
            };
        });
    }

    filterBySport(games) {
        if (this.currentSport === 'all') return games;
        return games.filter(g => g.sport === this.currentSport);
    }

    showLoading(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 24px;">
                <div style="font-size: 48px; margin-bottom: 16px;">
                    <i class="fas fa-spinner fa-spin" style="color: var(--primary);"></i>
                </div>
                <h3 style="margin-bottom: 8px;">Loading Live Scores</h3>
                <p style="color: var(--text-secondary);">Fetching data from ESPN...</p>
            </div>
        `;
    }

    showNoGames(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 24px;">
                <div style="font-size: 64px; margin-bottom: 24px;">⚽🏀🏈</div>
                <h2 style="margin-bottom: 12px;">No Live Games</h2>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    Check back later for live action!
                </p>
                <button class="btn btn-secondary" onclick="liveScoresManager.load()">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
        `;
    }

    showError(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 24px;">
                <div style="font-size: 64px; color: var(--danger); margin-bottom: 24px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2 style="margin-bottom: 12px;">Unable to Load Scores</h2>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    Please check your internet connection and try again
                </p>
                <button class="btn btn-primary" onclick="liveScoresManager.load()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }

    render(scores, container) {
        const html = `
            <!-- Sport Filter Tabs -->
            <div style="margin-bottom: 24px; display: flex; gap: 8px; flex-wrap: wrap; padding: 0 16px;">
                ${this.renderFilterTabs()}
            </div>

            <!-- Games List -->
            <div style="padding: 0 16px;">
                ${scores.map(game => this.renderGameCard(game)).join('')}
            </div>

            <!-- Last Updated -->
            <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12px;">
                <i class="fas fa-sync"></i> Auto-refreshing every 30 seconds
            </div>
        `;

        container.innerHTML = html;
        this.attachFilterListeners();
    }

    renderFilterTabs() {
        const sports = [
            { id: 'all', label: 'All', icon: '🎯' },
            { id: 'NFL', label: 'NFL', icon: '🏈' },
            { id: 'NBA', label: 'NBA', icon: '🏀' },
            { id: 'MLB', label: 'MLB', icon: '⚾' },
            { id: 'NHL', label: 'NHL', icon: '🏒' },
            { id: 'Premier League', label: 'Soccer', icon: '⚽' }
        ];

        return sports.map(sport => `
            <button 
                class="sport-filter-btn ${this.currentSport === sport.id ? 'active' : ''}" 
                data-sport="${sport.id}"
                style="
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    background: ${this.currentSport === sport.id ? 'var(--primary)' : 'var(--bg-card)'};
                    color: ${this.currentSport === sport.id ? 'white' : 'var(--text-secondary)'};
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                "
            >
                <span>${sport.icon}</span>
                <span>${sport.label}</span>
            </button>
        `).join('');
    }

    renderGameCard(game) {
        const statusBadgeColor = game.isLive ? 'var(--danger)' : 
                                 game.isCompleted ? 'var(--text-muted)' : 
                                 'var(--primary)';

        return `
            <div style="
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ${game.isLive ? 'border-left: 4px solid var(--danger);' : ''}
            ">
                <!-- Header: League & Status -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px;">${game.sportIcon}</span>
                        <span style="color: var(--text-secondary); font-size: 12px; font-weight: 600; text-transform: uppercase;">
                            ${game.league}
                        </span>
                    </div>
                    <span style="
                        padding: 4px 12px;
                        border-radius: 12px;
                        background: ${statusBadgeColor};
                        color: white;
                        font-size: 10px;
                        font-weight: 700;
                        text-transform: uppercase;
                    ">
                        ${game.isLive ? '🔴 LIVE' : game.isCompleted ? 'FINAL' : 'UPCOMING'}
                    </span>
                </div>

                <!-- Teams & Scores -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <!-- Teams -->
                    <div style="flex: 1;">
                        <!-- Away Team -->
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            ${game.awayTeamLogo ? `
                                <img src="${game.awayTeamLogo}" alt="${game.awayTeam}" 
                                     style="width: 32px; height: 32px; object-fit: contain;">
                            ` : ''}
                            <div>
                                <div style="font-weight: 600; font-size: 16px;">${game.awayTeam}</div>
                                ${game.awayRecord ? `
                                    <div style="color: var(--text-muted); font-size: 12px;">${game.awayRecord}</div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Home Team -->
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${game.homeTeamLogo ? `
                                <img src="${game.homeTeamLogo}" alt="${game.homeTeam}" 
                                     style="width: 32px; height: 32px; object-fit: contain;">
                            ` : ''}
                            <div>
                                <div style="font-weight: 600; font-size: 16px;">${game.homeTeam}</div>
                                ${game.homeRecord ? `
                                    <div style="color: var(--text-muted); font-size: 12px;">${game.homeRecord}</div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Scores -->
                    <div style="text-align: center; padding: 0 24px; min-width: 60px;">
                        <div style="font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
                            ${game.awayScore}
                        </div>
                        <div style="font-size: 28px; font-weight: 700; color: var(--text-primary);">
                            ${game.homeScore}
                        </div>
                    </div>
                </div>

                <!-- Footer: Status & Venue -->
                <div style="
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                ">
                    <div style="color: var(--text-secondary); font-size: 13px; font-weight: 600;">
                        ${game.status}
                    </div>
                    ${game.venue || game.broadcast ? `
                        <div style="color: var(--text-muted); font-size: 12px;">
                            ${game.broadcast ? `📺 ${game.broadcast}` : ''}
                            ${game.venue && game.city ? `📍 ${game.city}` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    attachFilterListeners() {
        document.querySelectorAll('.sport-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sport = e.currentTarget.dataset.sport;
                this.currentSport = sport;
                this.load();
            });
        });
    }

    startAutoRefresh() {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing scores...');
            this.load();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    destroy() {
        this.stopAutoRefresh();
        this.cache = { data: null, timestamp: 0, ttl: 30000 };
    }
}

// Create global instance
const liveScoresManager = new LiveScoresManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = liveScoresManager;
}

console.log('✅ Live Scores Module loaded with Real ESPN Data');
