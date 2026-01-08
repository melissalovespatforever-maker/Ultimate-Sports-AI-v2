// ============================================
// LIVE SCORES MODULE - UNIFIED SPORTS DATA
// Now uses the robust SportsDataService as source of truth
// ============================================

class LiveScoresManager {
    constructor() {
        this.scores = [];
        this.upcoming = [];
        this.isLoading = false;
        this.selectedSport = 'NFL'; // Default to NFL (uppercase for consistency)
        this.refreshInterval = null;
        this.sportsService = window.sportsDataService;
    }

    async load() {
        console.log('📊 Loading Live Scores (Unified Data Mode)...');
        
        // Wait for service if not ready
        if (!this.sportsService) {
            console.warn('⚠️ SportsDataService not found, waiting...');
            setTimeout(() => this.load(), 500);
            return;
        }

        const container = document.getElementById('live-scores-container');
        if (!container) return;

        this.renderUI(container);
        this.attachEventListeners();
        
        // Start polling loop
        this.startLiveUpdates();
        
        // Initial fetch
        await this.fetchData();
    }

    startLiveUpdates() {
        // Poll every 30 seconds for live data
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => this.fetchData(true), 30000);
    }

    async fetchData(isAutoRefresh = false) {
        if (!this.sportsService) return;
        
        try {
            this.isLoading = true;
            if (!isAutoRefresh) this.renderLoading();

            const games = await this.sportsService.getGames(this.selectedSport, true); // Force refresh
            
            // Separate Live vs Upcoming vs Final
            this.liveGames = games.filter(g => g.isLive);
            this.upcomingGames = games.filter(g => g.status === 'pre');
            this.finishedGames = games.filter(g => g.status === 'post');
            
            this.renderScores();
            this.updateLastSyncTime();
            
        } catch (error) {
            console.error('❌ Error fetching scores:', error);
            if (!isAutoRefresh) this.renderError('Failed to load live scores.');
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
                    <div class="connection-status connected" id="connection-status">
                        <span class="status-dot"></span>
                        <span class="status-text">Live ESPN Data Active</span>
                    </div>
                    <button class="odds-dashboard-btn" onclick="window.globalOddsComparison?.open(window.liveScoresManager.selectedSport)">
                        <i class="fas fa-chart-bar"></i> Odds Dashboard
                    </button>
                </div>
                
                <div class="scores-filter-bar">
                    <button class="score-filter-btn active" data-sport="NFL">
                        <i class="fas fa-football-ball"></i> NFL
                    </button>
                    <button class="score-filter-btn" data-sport="NBA">
                        <i class="fas fa-basketball-ball"></i> NBA
                    </button>
                    <button class="score-filter-btn" data-sport="NHL">
                        <i class="fas fa-hockey-puck"></i> NHL
                    </button>
                    <button class="score-filter-btn" data-sport="MLB">
                        <i class="fas fa-baseball-ball"></i> MLB
                    </button>
                    <button class="score-filter-btn" data-sport="SOCCER">
                        <i class="fas fa-futbol"></i> SOCCER
                    </button>
                    <button class="score-filter-btn" data-sport="NCAAF">
                        <i class="fas fa-university"></i> NCAAF
                    </button>
                </div>
                
                <div class="scores-refresh-bar">
                    <button id="scores-refresh-btn" class="btn-small">
                        <i class="fas fa-sync-alt"></i> Refresh Now
                    </button>
                    <span class="last-updated">Last updated: Waiting...</span>
                </div>
                
                <div id="scores-content-area">
                    <!-- Sections will be injected here -->
                </div>
            </div>
        `;
    }

    renderLoading() {
        const content = document.getElementById('scores-content-area');
        if (content) {
            content.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Fetching real-time data from ESPN...</p>
                </div>
            `;
        }
    }

    renderError(msg) {
        const content = document.getElementById('scores-content-area');
        if (content) {
            content.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${msg}</div>`;
        }
    }

    renderScores() {
        const content = document.getElementById('scores-content-area');
        if (!content) return;

        let html = '';

        // 1. Live Games Section
        if (this.liveGames.length > 0) {
            html += `
                <div class="section-header live">
                    <h3><span class="pulse-dot"></span> Live Now</h3>
                </div>
                <div class="scores-list live-list">
                    ${this.liveGames.map(g => this.renderGameCard(g)).join('')}
                </div>
            `;
        }

        // 2. Upcoming Games
        if (this.upcomingGames.length > 0) {
            html += `
                <div class="section-header">
                    <h3>Upcoming</h3>
                </div>
                <div class="scores-list">
                    ${this.upcomingGames.map(g => this.renderGameCard(g)).join('')}
                </div>
            `;
        } else if (this.liveGames.length === 0 && this.finishedGames.length === 0) {
            html += `<div class="no-games"><i class="fas fa-calendar-times"></i> No games scheduled for today.</div>`;
        }

        // 3. Finished Games (Collapsible or at bottom)
        if (this.finishedGames.length > 0) {
            html += `
                <div class="section-header finished">
                    <h3>Final Scores</h3>
                </div>
                <div class="scores-list finished-list">
                    ${this.finishedGames.map(g => this.renderGameCard(g)).join('')}
                </div>
            `;
        }

        content.innerHTML = html;
    }

    renderGameCard(game) {
        const statusClass = game.isLive ? 'status-live' : game.isCompleted ? 'status-final' : 'status-pre';
        const statusText = game.isLive ? 'LIVE' : game.statusDisplay;
        
        // Winner logic for final games
        const homeWinner = game.isCompleted && parseInt(game.homeTeam.score) > parseInt(game.awayTeam.score);
        const awayWinner = game.isCompleted && parseInt(game.awayTeam.score) > parseInt(game.homeTeam.score);

        // Hype Meter Color
        const hypeColor = game.hypeLevel > 80 ? '#ef4444' : (game.hypeLevel > 50 ? '#f59e0b' : '#3b82f6');
        const hypeIcon = game.hypeLevel > 80 ? '🔥' : (game.hypeLevel > 50 ? '⚡' : '📈');

        const fallbackLogo = 'https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN';
        
        // Resolve logos using global resolver with team IDs
        const homeLogo = window.resolveSportsLogo ? 
                        window.resolveSportsLogo(game.homeTeam.id || game.homeTeam.shortName, game.sport, game.homeTeam.logo) : 
                        (game.homeTeam.logo || fallbackLogo);
        const awayLogo = window.resolveSportsLogo ? 
                        window.resolveSportsLogo(game.awayTeam.id || game.awayTeam.shortName, game.sport, game.awayTeam.logo) : 
                        (game.awayTeam.logo || fallbackLogo);

        // Odds History Sparkline
        const oddsHistory = this.sportsService.getOddsHistory(game.id);
        const hasHistory = oddsHistory.length > 1;
        const sparklineHtml = hasHistory ? this.generateSparkline(oddsHistory) : '';

        // Check if user has already voted
        const votedGames = JSON.parse(localStorage.getItem('user_voted_games') || '[]');
        const hasVoted = votedGames.includes(game.id);

        return `
            <div class="game-card ${game.isLive ? 'live-card' : ''}" data-game-id="${game.id}">
                <div class="game-header">
                    <span class="game-status-badge ${statusClass}">${statusText}</span>
                    <span class="game-venue">${game.venue}</span>
                    <div class="hype-meter-container" title="Hype Level: ${game.hypeLevel}%">
                        <span class="hype-icon">${hypeIcon}</span>
                        <div class="hype-bar-bg">
                            <div class="hype-bar-fill" style="width: ${game.hypeLevel}%; background-color: ${hypeColor};"></div>
                        </div>
                        <button class="hype-vote-btn ${hasVoted ? 'voted' : ''}" 
                                onclick="event.stopPropagation(); window.liveScoresManager.castHypeVote('${game.id}')"
                                ${hasVoted ? 'disabled' : ''}>
                            <i class="fas fa-fire"></i>
                            <span class="vote-count">${this.sportsService.getVotesForGame(game.id)}</span>
                        </button>
                    </div>
                </div>
                
                <div class="game-teams" onclick="window.liveScoresManager.openCommentary('${game.id}')">
                    <!-- Away Team -->
                    <div class="team-row ${awayWinner ? 'winner' : ''}">
                        <div class="team-meta">
                            <img src="${awayLogo}" onerror="this.onerror=null; this.src='${fallbackLogo}'" alt="${game.awayTeam.shortName}" class="team-logo">
                            <div class="team-name-group">
                                <span class="team-name">${game.awayTeam.name}</span>
                                <span class="team-record">${game.awayTeam.record}</span>
                            </div>
                        </div>
                        <div class="team-score">${game.awayTeam.score !== undefined ? game.awayTeam.score : '-'}</div>
                    </div>

                    <!-- Home Team -->
                    <div class="team-row ${homeWinner ? 'winner' : ''}">
                        <div class="team-meta">
                            <img src="${homeLogo}" onerror="this.onerror=null; this.src='${fallbackLogo}'" alt="${game.homeTeam.shortName}" class="team-logo">
                            <div class="team-name-group">
                                <span class="team-name">${game.homeTeam.name}</span>
                                <span class="team-record">${game.homeTeam.record}</span>
                            </div>
                        </div>
                        <div class="team-score">${game.homeTeam.score !== undefined ? game.homeTeam.score : '-'}</div>
                    </div>
                </div>
                
                <div class="game-footer">
                    ${game.odds ? `
                        <div class="game-odds">
                            <div class="odds-current">
                                <span class="odds-pill"><i class="fas fa-chart-line"></i> ${game.odds.details}</span>
                                <span class="odds-pill"><i class="fas fa-arrows-alt-v"></i> O/U ${game.odds.overUnder}</span>
                            </div>
                            ${sparklineHtml}
                        </div>
                    ` : ''}

                    <div class="game-actions">
                        <button class="game-action-btn" onclick="event.stopPropagation(); window.liveScoresManager.openCommentary('${game.id}')">
                            <i class="fas fa-microphone"></i> Commentary
                        </button>
                        <button class="game-action-btn betting-btn" onclick="event.stopPropagation(); window.liveScoresManager.openBettingOdds('${game.id}')">
                            <i class="fas fa-chart-line"></i> Live Odds
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    generateSparkline(history) {
        if (history.length < 2) return '';
        
        const width = 80;
        const height = 24;
        const padding = 2;
        
        const values = history.map(p => p.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        
        const points = history.map((p, i) => {
            const x = (i / (history.length - 1)) * width;
            const y = height - (((p.value - min) / range) * (height - padding * 2) + padding);
            return `${x},${y}`;
        }).join(' ');

        // Determine trend color
        const first = values[0];
        const last = values[values.length - 1];
        const color = last < first ? '#10b981' : (last > first ? '#ef4444' : '#64748b'); // Green if odds improved (value decreased for spread), Red if worsened
        const trend = last < first ? 'Sharpening' : (last > first ? 'Fading' : 'Stable');
        const movement = ((last - first) / (Math.abs(first) || 1) * 100).toFixed(1);

        return `
            <div class="odds-sparkline" 
                 title="Market Movement: ${trend} (${movement}%)"
                 onclick="event.stopPropagation(); window.liveScoresManager.showSparklineTooltip('${trend}', '${movement}%')">
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                    <polyline fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
                </svg>
            </div>
        `;
    }

    showSparklineTooltip(trend, movement) {
        if (typeof showToast === 'function') {
            const icon = trend === 'Sharpening' ? '📈' : (trend === 'Fading' ? '📉' : '↔️');
            showToast(`${icon} Market ${trend}: ${movement} movement over 60m`, 'info');
        } else {
            alert(`Market ${trend}: ${movement} movement over 60m`);
        }
    }

    async castHypeVote(gameId) {
        if (!this.sportsService) return;

        const success = await this.sportsService.voteForGame(gameId);
        if (success) {
            if (typeof showToast === 'function') {
                showToast('🔥 Hype increased!', 'success');
            }
            
            // Re-render scores to show updated hype and button state
            this.fetchData(true); 

            // Play sound if available
            if (window.soundEffects) {
                window.soundEffects.playSound('click');
            }
        }
    }

    openCommentary(gameId) {
        // Find the game data
        const allGames = [...this.liveGames, ...this.upcomingGames, ...this.finishedGames];
        const game = allGames.find(g => g.id === gameId);
        
        if (game && window.liveCommentaryOverlay) {
            window.liveCommentaryOverlay.open(game);
            
            // Play sound
            if (window.soundEffects) {
                window.soundEffects.playSound('notification');
            }
        }
    }

    openBettingOdds(gameId) {
        // Find the game data
        const allGames = [...this.liveGames, ...this.upcomingGames, ...this.finishedGames];
        const game = allGames.find(g => g.id === gameId);
        
        if (game && window.bettingOddsTracker) {
            // Format game data for betting odds tracker
            const bettingGame = {
                awayTeam: game.awayTeam.name,
                homeTeam: game.homeTeam.name,
                awayTeamId: game.awayTeam.id,
                homeTeamId: game.homeTeam.id,
                awayScore: game.awayTeam.score || 0,
                homeScore: game.homeTeam.score || 0,
                time: game.time,
                status: game.statusDisplay,
                sport: game.sport,
                id: game.id
            };
            
            window.bettingOddsTracker.open(bettingGame);
            
            // Play sound
            if (window.soundEffects) {
                window.soundEffects.playSound('click');
            }
        }
    }

    attachEventListeners() {
        // Sport filter buttons
        document.querySelectorAll('.score-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.score-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedSport = btn.dataset.sport;
                this.fetchData();
            });
        });

        // Refresh button
        document.getElementById('scores-refresh-btn')?.addEventListener('click', () => {
            this.fetchData(true);
        });
    }

    updateLastSyncTime() {
        const el = document.querySelector('.last-updated');
        if (el) {
            const time = new Date().toLocaleTimeString();
            const source = this.sportsService.isUsingMockData ? '(Simulated Mode)' : '(Live ESPN)';
            el.textContent = `Last updated: ${time} ${source}`;
        }
        
        // Update connection status badge
        const statusBadge = document.getElementById('connection-status');
        if (statusBadge) {
            if (this.sportsService.isUsingMockData) {
                statusBadge.className = 'connection-status simulated';
                statusBadge.querySelector('.status-text').textContent = 'Simulated Data Active';
            } else {
                statusBadge.className = 'connection-status connected';
                statusBadge.querySelector('.status-text').textContent = 'Live ESPN Data Active';
            }
        }
    }
}

// Global Export & Init
window.liveScoresManager = new LiveScoresManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.liveScoresManager.load());
} else {
    window.liveScoresManager.load();
}
