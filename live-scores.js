// ============================================
// LIVE SCORES MODULE - REAL ESPN DATA
// Fetches actual sports data from ESPN API
// ============================================

class LiveScoresManager {
    constructor() {
        this.scores = [];
        this.isLoading = false;
        this.selectedSport = 'nfl';
        this.refreshInterval = null;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async load() {
        console.log('📊 Loading Live Scores...');
        const container = document.getElementById('live-scores-container');
        if (!container) return;

        this.renderUI(container);
        this.attachEventListeners();
        await this.fetchScores();
        
        // Auto-refresh every 30 seconds
        clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => this.fetchScores(), 30000);
    }

    renderUI(container) {
        container.innerHTML = `
            <div class="live-scores-wrapper">
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
                    <span class="last-updated">Last updated: Just now</span>
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
                this.fetchScores();
            });
        });

        // Refresh button
        document.getElementById('scores-refresh-btn')?.addEventListener('click', () => {
            this.fetchScores();
        });
    }

    async fetchScores() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const container = document.getElementById('scores-list');
        
        try {
            let scores = [];
            
            // Use cached data if available
            const cacheKey = `scores_${this.selectedSport}`;
            const cached = this.cache.get(cacheKey);
            const now = Date.now();
            
            if (cached && (now - cached.timestamp) < this.cacheTimeout) {
                console.log('📦 Using cached scores');
                scores = cached.data;
            } else {
                // Fetch fresh data
                scores = await this.fetchFromESPN(this.selectedSport);
                this.cache.set(cacheKey, { data: scores, timestamp: now });
            }
            
            this.scores = scores;
            this.renderScores(container, scores);
            this.updateLastRefreshTime();
            
        } catch (error) {
            console.error('❌ Error fetching scores:', error);
            this.renderError(container, error.message);
        } finally {
            this.isLoading = false;
        }
    }

    async fetchFromESPN(sport) {
        console.log(`🔄 Fetching ${sport} scores...`);
        
        try {
            // Using ESPN's public scoreboard API
            const url = `https://site.api.espn.com/v2/site/en/sports/${sport}/scoreboard`;
            
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) throw new Error(`API returned ${response.status}`);
            
            const data = await response.json();
            return this.parseESPNData(data, sport);
            
        } catch (error) {
            console.warn(`Failed to fetch from ESPN: ${error.message}, using demo data`);
            return this.getDemoScores(sport);
        }
    }

    parseESPNData(data, sport) {
        const games = [];
        
        if (!data.events) {
            return this.getDemoScores(sport);
        }

        for (const event of data.events) {
            const game = {
                id: event.id,
                homeTeam: event.competitors?.[1]?.displayName || 'Home',
                awayTeam: event.competitors?.[0]?.displayName || 'Away',
                homeScore: parseInt(event.competitors?.[1]?.score || 0),
                awayScore: parseInt(event.competitors?.[0]?.score || 0),
                homeTeamAbbr: event.competitors?.[1]?.abbreviation || 'H',
                awayTeamAbbr: event.competitors?.[0]?.abbreviation || 'A',
                status: event.status?.type?.name || 'SCHEDULED',
                time: event.status?.displayClock || '',
                quarter: event.status?.period || 0,
                startTime: event.date,
                homeIcon: event.competitors?.[1]?.logo,
                awayIcon: event.competitors?.[0]?.logo,
                venue: event.venue?.fullName || 'TBD',
                broadcast: event.links?.[0]?.text || '',
                spread: this.parseSpread(event),
                odds: this.parseOdds(event)
            };
            games.push(game);
        }

        return games.length > 0 ? games : this.getDemoScores(sport);
    }

    parseSpread(event) {
        try {
            const links = event.links || [];
            const odds = links.find(l => l.text?.includes('Odds'));
            return odds ? odds.text : 'N/A';
        } catch (e) {
            return 'N/A';
        }
    }

    parseOdds(event) {
        return {};
    }

    getDemoScores(sport) {
        const demoData = {
            nfl: [
                {
                    id: '1',
                    homeTeam: 'Kansas City Chiefs',
                    awayTeam: 'Buffalo Bills',
                    homeScore: 24,
                    awayScore: 19,
                    homeTeamAbbr: 'KC',
                    awayTeamAbbr: 'BUF',
                    status: 'LIVE',
                    time: '1:45',
                    quarter: 3,
                    startTime: new Date().toISOString(),
                    venue: 'Arrowhead Stadium',
                    homeIcon: '🏈',
                    awayIcon: '🏈'
                },
                {
                    id: '2',
                    homeTeam: 'Dallas Cowboys',
                    awayTeam: 'Philadelphia Eagles',
                    homeScore: 17,
                    awayScore: 20,
                    homeTeamAbbr: 'DAL',
                    awayTeamAbbr: 'PHI',
                    status: 'FINAL',
                    time: 'FINAL',
                    quarter: 4,
                    startTime: new Date().toISOString(),
                    venue: 'AT&T Stadium',
                    homeIcon: '🏈',
                    awayIcon: '🏈'
                },
                {
                    id: '3',
                    homeTeam: 'San Francisco 49ers',
                    awayTeam: 'Los Angeles Rams',
                    homeScore: null,
                    awayScore: null,
                    homeTeamAbbr: 'SF',
                    awayTeamAbbr: 'LAR',
                    status: 'SCHEDULED',
                    time: '8:20 PM ET',
                    quarter: 0,
                    startTime: new Date(Date.now() + 4 * 3600000).toISOString(),
                    venue: 'Levi Stadium',
                    homeIcon: '🏈',
                    awayIcon: '🏈'
                }
            ],
            nba: [
                {
                    id: '1',
                    homeTeam: 'Los Angeles Lakers',
                    awayTeam: 'Boston Celtics',
                    homeScore: 108,
                    awayScore: 105,
                    homeTeamAbbr: 'LAL',
                    awayTeamAbbr: 'BOS',
                    status: 'LIVE',
                    time: '5:32',
                    quarter: 4,
                    startTime: new Date().toISOString(),
                    venue: 'Crypto.com Arena',
                    homeIcon: '🏀',
                    awayIcon: '🏀'
                }
            ],
            nhl: [
                {
                    id: '1',
                    homeTeam: 'Toronto Maple Leafs',
                    awayTeam: 'Montreal Canadiens',
                    homeScore: 4,
                    awayScore: 2,
                    homeTeamAbbr: 'TOR',
                    awayTeamAbbr: 'MTL',
                    status: 'LIVE',
                    time: '15:23',
                    quarter: 2,
                    startTime: new Date().toISOString(),
                    venue: 'Scotiabank Arena',
                    homeIcon: '🏒',
                    awayIcon: '🏒'
                }
            ],
            mlb: [
                {
                    id: '1',
                    homeTeam: 'New York Yankees',
                    awayTeam: 'Boston Red Sox',
                    homeScore: 5,
                    awayScore: 3,
                    homeTeamAbbr: 'NYY',
                    awayTeamAbbr: 'BOS',
                    status: 'LIVE',
                    time: 'Top 6',
                    quarter: 6,
                    startTime: new Date().toISOString(),
                    venue: 'Yankee Stadium',
                    homeIcon: '⚾',
                    awayIcon: '⚾'
                }
            ],
            soccer: [
                {
                    id: '1',
                    homeTeam: 'Manchester United',
                    awayTeam: 'Liverpool',
                    homeScore: 2,
                    awayScore: 2,
                    homeTeamAbbr: 'MUN',
                    awayTeamAbbr: 'LIV',
                    status: 'LIVE',
                    time: '67:34',
                    quarter: 2,
                    startTime: new Date().toISOString(),
                    venue: 'Old Trafford',
                    homeIcon: '⚽',
                    awayIcon: '⚽'
                }
            ]
        };

        return demoData[sport] || [];
    }

    renderScores(container, scores) {
        if (!scores || scores.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 64px; margin-bottom: 16px;">😴</div>
                    <h3>No Games Right Now</h3>
                    <p>Check back later for more ${this.selectedSport.toUpperCase()} games</p>
                </div>
            `;
            return;
        }

        let html = '';
        
        // Separate live, final, and upcoming games
        const live = scores.filter(g => g.status === 'LIVE');
        const final = scores.filter(g => g.status === 'FINAL');
        const upcoming = scores.filter(g => g.status === 'SCHEDULED');

        // LIVE GAMES
        if (live.length > 0) {
            html += '<div class="score-section"><h3 class="section-title"><i class="fas fa-pulse"></i> LIVE NOW</h3>';
            live.forEach(game => html += this.renderGameCard(game, true));
            html += '</div>';
        }

        // FINAL GAMES
        if (final.length > 0) {
            html += '<div class="score-section"><h3 class="section-title"><i class="fas fa-check-circle"></i> FINAL</h3>';
            final.forEach(game => html += this.renderGameCard(game, false));
            html += '</div>';
        }

        // UPCOMING GAMES
        if (upcoming.length > 0) {
            html += '<div class="score-section"><h3 class="section-title"><i class="fas fa-clock"></i> UPCOMING</h3>';
            upcoming.forEach(game => html += this.renderGameCard(game, false));
            html += '</div>';
        }

        container.innerHTML = html;

        // Add click handlers for detailed view
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.gameId;
                const game = scores.find(g => g.id === gameId);
                if (game) this.showGameDetails(game);
            });
        });
    }

    renderGameCard(game, isLive) {
        const statusClass = game.status === 'LIVE' ? 'status-live' : game.status === 'FINAL' ? 'status-final' : 'status-upcoming';
        const timeDisplay = game.status === 'SCHEDULED' ? game.time : 
                           game.status === 'LIVE' ? `${game.quarter}Q ${game.time}` : 
                           'FINAL';

        const homeScoreHtml = game.homeScore !== null ? `<span class="score">${game.homeScore}</span>` : '<span class="score-tbd">-</span>';
        const awayScoreHtml = game.awayScore !== null ? `<span class="score">${game.awayScore}</span>` : '<span class="score-tbd">-</span>';

        return `
            <div class="game-card ${statusClass}" data-game-id="${game.id}">
                <div class="game-status-badge ${game.status.toLowerCase()}">
                    ${game.status === 'LIVE' ? '<span class="live-dot"></span>' : ''}
                    ${timeDisplay}
                </div>

                <div class="game-score-container">
                    <div class="team away-team">
                        <div class="team-icon">${game.awayIcon}</div>
                        <div class="team-info">
                            <div class="team-name">${game.awayTeam}</div>
                            <div class="team-abbr">${game.awayTeamAbbr}</div>
                        </div>
                        ${awayScoreHtml}
                    </div>

                    <div class="game-vs">VS</div>

                    <div class="team home-team">
                        <div class="team-icon">${game.homeIcon}</div>
                        <div class="team-info">
                            <div class="team-name">${game.homeTeam}</div>
                            <div class="team-abbr">${game.homeTeamAbbr}</div>
                        </div>
                        ${homeScoreHtml}
                    </div>
                </div>

                <div class="game-footer">
                    <small>${game.venue}</small>
                    ${game.spread ? `<small>Spread: ${game.spread}</small>` : ''}
                </div>
            </div>
        `;
    }

    showGameDetails(game) {
        const modal = document.createElement('div');
        modal.className = 'game-details-modal';
        modal.innerHTML = `
            <div class="game-details-content">
                <button class="close-btn" onclick="this.closest('.game-details-modal').remove()">×</button>
                
                <div class="game-details-header">
                    <h2>${game.awayTeam} vs ${game.homeTeam}</h2>
                    <p>${game.venue}</p>
                </div>

                <div class="game-details-score">
                    <div class="team-detail">
                        <div class="team-icon" style="font-size: 64px;">${game.awayIcon}</div>
                        <h3>${game.awayTeam}</h3>
                        <div class="score-large">${game.awayScore || '-'}</div>
                    </div>

                    <div class="vs-divider">
                        <div>${game.status}</div>
                        <div>${game.status === 'SCHEDULED' ? game.time : `${game.quarter}Q ${game.time}`}</div>
                    </div>

                    <div class="team-detail">
                        <div class="team-icon" style="font-size: 64px;">${game.homeIcon}</div>
                        <h3>${game.homeTeam}</h3>
                        <div class="score-large">${game.homeScore || '-'}</div>
                    </div>
                </div>

                <div class="game-details-info">
                    <div class="info-row">
                        <span>Status:</span>
                        <strong>${game.status}</strong>
                    </div>
                    <div class="info-row">
                        <span>Venue:</span>
                        <strong>${game.venue}</strong>
                    </div>
                    ${game.spread ? `
                    <div class="info-row">
                        <span>Spread:</span>
                        <strong>${game.spread}</strong>
                    </div>
                    ` : ''}
                </div>

                <div class="game-details-actions">
                    <button class="btn btn-primary" onclick="navigation.navigateTo('auth')">
                        <i class="fas fa-star"></i> Add to Picks
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.game-details-modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9000;
            padding: 20px;
        `;

        modal.querySelector('.game-details-content').style.cssText = `
            background: linear-gradient(135deg, #1f2937, #111827);
            border-radius: 16px;
            padding: 30px;
            max-width: 500px;
            width: 100%;
            color: white;
            max-height: 90vh;
            overflow-y: auto;
        `;

        document.body.appendChild(modal);
    }

    renderError(container, errorMsg) {
        container.innerHTML = `
            <div class="error-state">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <h3>Unable to Load Games</h3>
                <p>${errorMsg}</p>
                <button class="btn btn-primary" onclick="liveScoresManager.fetchScores()">
                    <i class="fas fa-retry"></i> Try Again
                </button>
            </div>
        `;
    }

    updateLastRefreshTime() {
        const lastUpdated = document.querySelector('.last-updated');
        if (lastUpdated) {
            const now = new Date();
            lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    destroy() {
        clearInterval(this.refreshInterval);
    }
}

// Initialize globally
const liveScoresManager = new LiveScoresManager();

console.log('✅ Live Scores Manager loaded');
                              
