/**
 * LIVE ODDS SIDEBAR
 * Real-time betting odds display for Sports Lounge chat sidebar
 */

import { logger } from './logger.js';

class LiveOddsSidebar {
    constructor() {
        this.updateInterval = null;
        this.currentSport = 'NFL';
        this.refreshRate = 30000; // 30 seconds
        this.featuredGames = [];
        
        this.init();
    }

    init() {
        logger.info('LiveOdds', 'Sidebar initialized');
        this.loadFeaturedOdds();
        this.startAutoRefresh();
    }

    async loadFeaturedOdds() {
        const container = document.getElementById('live-odds-sidebar-container');
        if (!container) return;

        try {
            // Try to get odds from sportsDataService
            const games = await this.fetchOddsData();
            
            if (games && games.length > 0) {
                this.featuredGames = games.slice(0, 5); // Top 5 games
                this.renderOdds();
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            logger.error('LiveOdds', 'Failed to load odds:', error);
            this.showErrorState();
        }
    }

    async fetchOddsData() {
        // Try to use the global sports data service
        if (window.sportsDataService && typeof window.sportsDataService.getGames === 'function') {
            try {
                // Fetch for multiple sports or a primary one
                const sports = ['NFL', 'NBA', 'SOCCER'];
                const allGames = await Promise.all(sports.map(s => window.sportsDataService.getGames(s)));
                
                // Flatten and filter for games with odds that aren't finished
                const filteredGames = allGames.flat()
                    .filter(game => game.odds && !game.isCompleted)
                    .sort((a, b) => (a.isLive === b.isLive) ? 0 : a.isLive ? -1 : 1); // Live games first
                
                return filteredGames;
            } catch (err) {
                logger.error('LiveOdds', 'Service fetch failed:', err);
            }
        }

        // Fallback to mock data for demo
        return this.getMockOdds();
    }

    getMockOdds() {
        return [
            {
                id: 'mock1',
                sport: 'NFL',
                homeTeam: { name: 'Chiefs', shortName: 'KC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
                awayTeam: { name: 'Bills', shortName: 'BUF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
                startTime: new Date(Date.now() + 7200000).toISOString(),
                odds: {
                    homeMoneyline: -150,
                    awayMoneyline: +130,
                    spread: { home: -3.5, away: +3.5 },
                    overUnder: 52.5
                }
            },
            {
                id: 'mock2',
                sport: 'NBA',
                homeTeam: { name: 'Lakers', shortName: 'LAL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png' },
                awayTeam: { name: 'Warriors', shortName: 'GSW', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png' },
                startTime: new Date(Date.now() + 10800000).toISOString(),
                odds: {
                    homeMoneyline: +110,
                    awayMoneyline: -130,
                    spread: { home: +2.5, away: -2.5 },
                    overUnder: 225.5
                }
            }
        ];
    }

    renderOdds() {
        const container = document.getElementById('live-odds-sidebar-container');
        if (!container) return;

        container.innerHTML = `
            <div class="odds-list">
                ${this.featuredGames.map(game => this.renderOddsCard(game)).join('')}
            </div>
        `;

        this.attachClickHandlers();
    }

    renderOddsCard(game) {
        const startTime = new Date(game.date || game.startTime);
        const timeUntil = game.isLive ? 'LIVE' : this.getTimeUntil(startTime);
        
        // ESPN Data parsing
        let displayOdds = 'N/A';
        
        if (game.odds && game.odds.details) {
            displayOdds = game.odds.details;
        }
        
        const fallbackLogo = 'https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN';

        return `
            <div class="odds-card" data-game-id="${game.id}">
                <div class="odds-header">
                    <span class="odds-sport-tag">${game.sport}</span>
                    <span class="odds-time ${game.isLive ? 'live' : ''}">${timeUntil}</span>
                </div>
                <div class="odds-matchup">
                    <div class="odds-team">
                        <img src="${game.awayTeam.logo}" class="odds-team-logo" onerror="this.onerror=null; this.src='${fallbackLogo}'">
                        <span class="odds-team-name">${game.awayTeam.shortName}</span>
                        <span class="odds-score">${game.isLive ? game.awayTeam.score : ''}</span>
                    </div>
                    <div class="odds-divider">@</div>
                    <div class="odds-team">
                        <img src="${game.homeTeam.logo}" class="odds-team-logo" onerror="this.onerror=null; this.src='${fallbackLogo}'">
                        <span class="odds-team-name">${game.homeTeam.shortName}</span>
                        <span class="odds-score">${game.isLive ? game.homeTeam.score : ''}</span>
                    </div>
                </div>
                <div class="odds-details">
                    <div class="odds-detail-item">
                        <span class="odds-label">Line:</span>
                        <span class="odds-detail-value">${displayOdds}</span>
                    </div>
                    <div class="odds-detail-item">
                        <span class="odds-label">O/U:</span>
                        <span class="odds-detail-value">${game.odds?.overUnder || 'N/A'}</span>
                    </div>
                </div>
                <button class="odds-bet-btn" data-game-id="${game.id}">
                    <i class="fas fa-ticket-alt"></i> Quick Bet
                </button>
            </div>
        `;
    }

    formatMoneyline(value) {
        if (value > 0) return `+${value}`;
        return value.toString();
    }

    formatSpread(value) {
        if (value > 0) return `+${value}`;
        return value.toString();
    }

    getTimeUntil(date) {
        const now = new Date();
        const diff = date - now;
        
        if (diff < 0) return 'Live';
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    attachClickHandlers() {
        const betButtons = document.querySelectorAll('.odds-bet-btn');
        betButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const gameId = btn.dataset.gameId;
                this.handleQuickBet(gameId);
            });
        });

        const oddsCards = document.querySelectorAll('.odds-card');
        oddsCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('odds-bet-btn')) {
                    const gameId = card.dataset.gameId;
                    this.showOddsDetails(gameId);
                }
            });
        });
    }

    handleQuickBet(gameId) {
        const game = this.featuredGames.find(g => g.id === gameId);
        if (!game) return;

        logger.info('LiveOdds', 'Quick bet initiated for:', gameId);

        // Show quick bet modal
        this.showQuickBetModal(game);
    }

    showQuickBetModal(game) {
        const modal = document.createElement('div');
        modal.className = 'odds-bet-modal-overlay';
        
        const oddsDetails = game.odds?.details || 'N/A';
        const overUnder = game.odds?.overUnder || 'N/A';

        modal.innerHTML = `
            <div class="odds-bet-modal">
                <div class="odds-bet-header">
                    <h3>Quick Bet</h3>
                    <button class="odds-bet-close" onclick="this.closest('.odds-bet-modal-overlay').remove()">×</button>
                </div>
                <div class="odds-bet-content">
                    <div class="odds-bet-matchup">
                        <span>${game.awayTeam.name} @ ${game.homeTeam.name}</span>
                    </div>
                    <div class="odds-bet-options">
                        <button class="odds-bet-option" data-type="spread" data-val="${oddsDetails}">
                            <span class="bet-label">Main Line</span>
                            <span class="bet-odds">${oddsDetails}</span>
                        </button>
                        <button class="odds-bet-option" data-type="total" data-val="${overUnder}">
                            <span class="bet-label">Over/Under</span>
                            <span class="bet-odds">${overUnder}</span>
                        </button>
                        <button class="odds-bet-option" data-type="ml" data-team="away">
                            <span class="bet-label">${game.awayTeam.shortName} Win</span>
                            <span class="bet-odds">ML</span>
                        </button>
                        <button class="odds-bet-option" data-type="ml" data-team="home">
                            <span class="bet-label">${game.homeTeam.shortName} Win</span>
                            <span class="bet-odds">ML</span>
                        </button>
                    </div>
                    <div class="odds-bet-amount">
                        <label>Bet Amount (coins)</label>
                        <input type="number" id="bet-amount-input" value="100" min="10" max="10000" step="10">
                    </div>
                    <div class="bet-coach-insight" style="padding: 12px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
                        <i class="fas fa-robot"></i> <strong>Coach Tip:</strong> 
                        ${this.generateCoachTip(game)}
                    </div>
                    <button class="odds-bet-confirm" onclick="window.liveOddsSidebar.confirmBet('${game.id}')">
                        Place Bet
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add event listeners for bet option selection
        modal.querySelectorAll('.odds-bet-option').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.odds-bet-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    generateCoachTip(game) {
        if (game.isLive) {
            const scoreDiff = Math.abs((parseInt(game.homeTeam.score) || 0) - (parseInt(game.awayTeam.score) || 0));
            if (scoreDiff < 5) return "This is a tight one! Momentum favors the next score.";
            return "Leading team is controlling the pace. Look for total points.";
        }
        
        const tips = [
            "The public is heavy on the favorite here.",
            "Sharp money is moving the line slightly.",
            "Weather might play a factor in the total.",
            "Both teams are rested and ready for a shootout.",
            "Defensive battle expected; consider the Under."
        ];
        return tips[Math.floor(Math.random() * tips.length)];
    }

    confirmBet(gameId) {
        const modal = document.querySelector('.odds-bet-modal-overlay');
        const selectedOption = modal.querySelector('.odds-bet-option.selected');
        const amountInput = modal.querySelector('#bet-amount-input');

        if (!selectedOption) {
            alert('Please select a bet option');
            return;
        }

        const amount = parseInt(amountInput.value);
        if (amount < 10 || amount > 10000) {
            alert('Bet amount must be between 10 and 10,000 coins');
            return;
        }

        const betType = selectedOption.dataset.type;
        const team = selectedOption.dataset.team;
        const odds = selectedOption.querySelector('.bet-odds').textContent;

        logger.info('LiveOdds', 'Bet confirmed:', { gameId, betType, team, amount, odds });

        // TODO: Integrate with actual betting system
        // For now, just show success message
        this.showBetConfirmation(amount);
        modal.remove();
    }

    showBetConfirmation(amount) {
        const loungeChat = window.sportsLoungeChat;
        if (loungeChat) {
            loungeChat.showSystemMessage(`✅ Bet placed! ${amount} coins wagered. Good luck! 🍀`);
        }

        // Add to chat if possible
        if (window.chatSummaryService) {
            window.chatSummaryService.recordMessage('bet placed betting');
        }
    }

    showOddsDetails(gameId) {
        const game = this.featuredGames.find(g => g.id === gameId);
        if (!game) return;

        logger.info('LiveOdds', 'Showing details for:', gameId);
        // Could expand card or navigate to full odds page
    }

    showEmptyState() {
        const container = document.getElementById('live-odds-sidebar-container');
        if (!container) return;

        container.innerHTML = `
            <div class="odds-empty-state">
                <i class="fas fa-chart-line" style="font-size: 32px; opacity: 0.3; margin-bottom: 8px;"></i>
                <p>No live odds available</p>
                <small>Check back soon for upcoming games</small>
            </div>
        `;
    }

    showErrorState() {
        const container = document.getElementById('live-odds-sidebar-container');
        if (!container) return;

        container.innerHTML = `
            <div class="odds-error-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px; color: #ef4444; margin-bottom: 8px;"></i>
                <p>Failed to load odds</p>
                <button onclick="window.liveOddsSidebar.loadFeaturedOdds()" class="odds-retry-btn">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>
        `;
    }

    startAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.loadFeaturedOdds();
        }, this.refreshRate);

        logger.info('LiveOdds', `Auto-refresh started (every ${this.refreshRate / 1000}s)`);
    }

    stopAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    changeSport(sport) {
        this.currentSport = sport;
        this.loadFeaturedOdds();
    }

    destroy() {
        this.stopAutoRefresh();
    }
}

// Global instance
export const liveOddsSidebar = new LiveOddsSidebar();
window.liveOddsSidebar = liveOddsSidebar;
