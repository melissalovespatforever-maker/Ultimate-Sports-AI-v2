/**
 * Trending Now Widget for Dashboard
 * Displays high-hype games, popular minigames, and community activity.
 */

class TrendingWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        if (!this.container) return;
        
        this.renderLayout();
        await this.updateData();
        
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => this.updateData(), 30000);
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="trending-widget">
                <div class="trending-header">
                    <h2><i class="fas fa-chart-line"></i> Trending Now</h2>
                    <div class="live-indicator">
                        <div class="live-dot" style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                        LIVE FEED
                    </div>
                </div>
                
                <div class="trending-grid">
                    <!-- Hype Matches -->
                    <div class="trending-card" id="trending-matches-card">
                        <div class="card-title">
                            <i class="fas fa-fire" style="color: #f59e0b;"></i> Hot Matches
                        </div>
                        <div class="match-list" id="trending-matches-list">
                            <div class="loading-placeholder" style="height: 150px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">
                                <i class="fas fa-circle-notch fa-spin"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Popular Minigames -->
                    <div class="trending-card">
                        <div class="card-title">
                            <i class="fas fa-gamepad" style="color: #6366f1;"></i> Hottest Minigames
                        </div>
                        <div class="minigame-list">
                            <div class="trending-game-item" onclick="appNavigation.navigateTo('sports-lounge')">
                                <div class="game-bg" style="background-image: url('https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=200&auto=format&fit=crop');"></div>
                                <div class="game-overlay">
                                    <div class="game-name">Penalty Shootout</div>
                                    <div class="game-players"><i class="fas fa-user-friends"></i> 142 Active</div>
                                </div>
                            </div>
                            <div class="trending-game-item" onclick="appNavigation.navigateTo('sports-lounge')">
                                <div class="game-bg" style="background-image: url('https://images.unsplash.com/photo-1518605336327-68b069ae81ed?q=80&w=200&auto=format&fit=crop');"></div>
                                <div class="game-overlay">
                                    <div class="game-name">Ultimate Coinflip</div>
                                    <div class="game-players"><i class="fas fa-user-friends"></i> 89 Active</div>
                                </div>
                            </div>
                            <div class="trending-game-item" onclick="appNavigation.navigateTo('sports-lounge')">
                                <div class="game-bg" style="background-image: url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=200&auto=format&fit=crop');"></div>
                                <div class="game-overlay">
                                    <div class="game-name">Arcade Hoops</div>
                                    <div class="game-players"><i class="fas fa-user-friends"></i> 56 Active</div>
                                </div>
                            </div>
                            <div class="trending-game-item" onclick="appNavigation.navigateTo('sports-lounge')">
                                <div class="game-bg" style="background-image: url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop');"></div>
                                <div class="game-overlay">
                                    <div class="game-name">Retro Tecmo</div>
                                    <div class="game-players"><i class="fas fa-user-friends"></i> 24 Active</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Platform Pulse -->
                    <div class="trending-card">
                        <div class="card-title">
                            <i class="fas fa-heartbeat" style="color: #10b981;"></i> Community Pulse
                        </div>
                        <div class="community-stats">
                            <div class="stat-row">
                                <span class="stat-label">Total Coins Won Today</span>
                                <span class="stat-value">1.4M <span class="stat-trend trend-up"><i class="fas fa-caret-up"></i> 12%</span></span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Hype Votes Cast</span>
                                <span class="stat-value" id="trending-total-votes">4.2K</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Active Challenges</span>
                                <span class="stat-value">18</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Global Multiplier</span>
                                <span class="stat-value" id="trending-global-mult">x1.0</span>
                            </div>
                        </div>
                    </div>

                    <!-- Public Consensus Heat Map -->
                    <div class="trending-card" id="trending-consensus-card">
                        <div class="card-title">
                            <i class="fas fa-users" style="color: #3b82f6;"></i> Public Consensus
                        </div>
                        <div class="consensus-list" id="trending-consensus-list">
                            <div class="loading-placeholder" style="height: 150px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">
                                <i class="fas fa-circle-notch fa-spin"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async updateData() {
        try {
            // 1. Get high hype matches
            if (!window.sportsDataService) return;
            
            const liveGames = await window.sportsDataService.getAllLiveGames();
            const upcomingGames = await window.sportsDataService.getAllUpcomingGames();
            
            // Combine and sort by hype
            const allGames = [...liveGames, ...upcomingGames].sort((a, b) => b.hypeLevel - a.hypeLevel);
            const topMatches = allGames.slice(0, 3);
            
            this.renderMatches(topMatches);
            
            // 2. Render Consensus (Top 3 games with highest spread variance)
            this.renderConsensus(allGames.slice(0, 3));

            // 3. Update stats
            let multiplier = 1.0;
            if (window.globalState && typeof window.globalState.getMultiplier === 'function') {
                multiplier = window.globalState.getMultiplier();
            } else if (window.currencyManager && typeof window.currencyManager.getMultiplier === 'function') {
                multiplier = window.currencyManager.getMultiplier();
            }
            
            const multEl = document.getElementById('trending-global-mult');
            if (multEl) multEl.textContent = `x${multiplier.toFixed(1)}`;
            
            // 3. Update votes (simulated increment for pulse effect)
            const votesEl = document.getElementById('trending-total-votes');
            if (votesEl) {
                const currentVotes = parseInt(votesEl.textContent.replace('K', '').replace('.', '')) || 4200;
                const newVotes = (currentVotes + Math.floor(Math.random() * 5)) / 1000;
                votesEl.textContent = `${newVotes.toFixed(1)}K`;
            }

        } catch (error) {
            console.error('Error updating trending widget:', error);
        }
    }

    renderMatches(matches) {
        const list = document.getElementById('trending-matches-list');
        if (!list) return;
        
        if (matches.length === 0) {
            list.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No trending matches right now. Check back soon!</div>`;
            return;
        }

        const fallbackLogo = 'https://play.rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN';
        
        const getSanitizedLogo = (logo, team, sport) => {
            if (window.resolveSportsLogo) {
                const identifier = team.id || team.shortName || team.name || '';
                return window.resolveSportsLogo(identifier, sport, logo);
            }
            return logo || fallbackLogo;
        };

        list.innerHTML = matches.map(match => {
            const homeLogo = getSanitizedLogo(match.homeTeam.logo, match.homeTeam, match.sport);
            const awayLogo = getSanitizedLogo(match.awayTeam.logo, match.awayTeam, match.sport);

            return `
                <div class="trending-match-item" onclick="appNavigation.navigateTo('live-scores')">
                    <div class="match-logos-combined">
                        <img src="${homeLogo}" 
                             onerror="this.onerror=null; this.src='${fallbackLogo}';" 
                             alt="${match.homeTeam.shortName}" class="match-logo">
                        <img src="${awayLogo}" 
                             onerror="this.onerror=null; this.src='${fallbackLogo}';" 
                             alt="${match.awayTeam.shortName}" class="match-logo secondary-logo">
                    </div>
                    <div class="match-info">
                        <div class="match-teams">${match.homeTeam.shortName} vs ${match.awayTeam.shortName}</div>
                        <div class="match-status">${match.statusDisplay} ${match.isLive ? '<span style="color: #ef4444; font-weight: 800;">• LIVE</span>' : ''}</div>
                    </div>
                    <div class="hype-badge">
                        <i class="fas fa-fire"></i> ${match.hypeLevel}%
                    </div>
                </div>
            `;
        }).join('');
    }

    renderConsensus(matches) {
        const list = document.getElementById('trending-consensus-list');
        if (!list) return;

        if (matches.length === 0) {
            list.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No consensus data available.</div>`;
            return;
        }

        const fallbackLogo = 'https://play.rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN';

        const getSanitizedLogo = (logo, team, sport) => {
            if (window.resolveSportsLogo) {
                const identifier = team.id || team.shortName || team.name || '';
                return window.resolveSportsLogo(identifier, sport, logo);
            }
            return logo || fallbackLogo;
        };

        list.innerHTML = matches.map(match => {
            // Use deterministic consensus based on game ID to avoid flickering
            const seed = match.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const homePercent = 30 + (seed % 41); // 30-70%
            const awayPercent = 100 - homePercent;
            const isHomeFavorite = homePercent > awayPercent;
            const dominantPercent = isHomeFavorite ? homePercent : awayPercent;
            
            // Color based on dominance
            let barColor = '#3b82f6'; // Default blue
            if (dominantPercent > 65) barColor = '#ef4444'; // High consensus (Red)
            else if (dominantPercent > 55) barColor = '#f59e0b'; // Moderate (Orange)

            const homeLogo = getSanitizedLogo(match.homeTeam.logo, match.homeTeam, match.sport);
            const awayLogo = getSanitizedLogo(match.awayTeam.logo, match.awayTeam, match.sport);

            return `
                <div class="consensus-item" onclick="appNavigation.navigateTo('live-scores')">
                    <div class="consensus-header">
                        <div class="consensus-matchup">
                            <span class="team-abbr">${match.awayTeam.shortName}</span>
                            <span class="vs">@</span>
                            <span class="team-abbr">${match.homeTeam.shortName}</span>
                        </div>
                        <div class="consensus-badge" style="background: ${barColor}20; color: ${barColor}">
                            ${dominantPercent}% ${isHomeFavorite ? match.homeTeam.shortName : match.awayTeam.shortName}
                        </div>
                    </div>
                    
                    <div class="consensus-bar-container">
                        <div class="consensus-bar-fill" style="width: ${awayPercent}%; background: ${!isHomeFavorite && dominantPercent > 55 ? barColor : '#3b82f6'};"></div>
                        <div class="consensus-bar-split"></div>
                        <div class="consensus-bar-fill" style="width: ${homePercent}%; background: ${isHomeFavorite && dominantPercent > 55 ? barColor : '#3b82f6'}; opacity: ${isHomeFavorite ? 1 : 0.5}"></div>
                    </div>
                    
                    <div class="consensus-labels">
                        <div class="team-side left">
                            <img src="${awayLogo}" onerror="this.onerror=null; this.src='${fallbackLogo}';" class="mini-logo">
                            <span>${awayPercent}%</span>
                        </div>
                        <button class="consensus-share-btn" onclick="event.stopPropagation(); window.trendingWidget.shareConsensus({
                            homeTeam: '${match.homeTeam.shortName}',
                            awayTeam: '${match.awayTeam.shortName}',
                            dominantTeam: '${isHomeFavorite ? match.homeTeam.shortName : match.awayTeam.shortName}',
                            dominantPercent: ${dominantPercent}
                        })">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <div class="team-side right">
                            <span>${homePercent}%</span>
                            <img src="${homeLogo}" onerror="this.onerror=null; this.src='${fallbackLogo}';" class="mini-logo">
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    shareConsensus(data) {
        if (window.socialShareManager) {
            window.socialShareManager.openShare({
                title: 'Share Consensus',
                text: `🚨 Public Consensus Alert! ${data.dominantPercent}% of bets are on ${data.dominantTeam} in ${data.awayTeam} vs ${data.homeTeam}. #UltimateSportsAI`,
                type: 'consensus',
                details: data
            });
        }
    }
}

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Add container if it doesn't exist (failsafe)
    if (!document.getElementById('trending-now-container')) {
        const homePage = document.getElementById('home-page');
        if (homePage) {
            const container = document.createElement('div');
            container.id = 'trending-now-container';
            homePage.appendChild(container);
        }
    }
    
    // Create widget
    window.trendingWidget = new TrendingWidget('trending-now-container');
});
