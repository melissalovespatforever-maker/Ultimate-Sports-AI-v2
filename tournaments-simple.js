// ============================================
// TOURNAMENTS SIMPLE MODULE
// Dynamic Tournaments powered by Live Sports Data
// ============================================

console.log('🏆 Loading Tournaments Module');

class TournamentsSimple {
    constructor() {
        this.tournaments = [];
        try {
            this.init();
        } catch (e) {
            console.error('❌ Tournaments init error:', e);
        }
    }

    init() {
        try {
            // Wait for DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.setupTournaments();
                });
            } else {
                this.setupTournaments();
            }
        } catch (e) {
            console.error('Tournaments init error:', e);
        }
    }

    setupTournaments() {
        const container = document.getElementById('tournaments-container');
        if (!container) return;

        // Observe when tournaments page becomes visible
        const observer = new MutationObserver(() => {
            const tournamentsPage = document.getElementById('tournaments-page');
            if (tournamentsPage && tournamentsPage.classList.contains('active')) {
                this.loadTournaments();
            }
        });

        const tournamentsPage = document.getElementById('tournaments-page');
        if (tournamentsPage) {
            observer.observe(tournamentsPage, { attributes: true, attributeFilter: ['class'] });
        }

        // Also render if page is already active
        if (tournamentsPage?.classList.contains('active')) {
            this.loadTournaments();
        }
    }

    async loadTournaments() {
        const container = document.getElementById('tournaments-container');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto 20px;"></div>
                <p>Loading active tournaments from live schedule...</p>
            </div>
        `;

        try {
            // Generate tournaments based on real data
            this.tournaments = await this.generateDynamicTournaments();
            this.renderTournaments();
        } catch (e) {
            console.error('Error loading tournaments:', e);
            container.innerHTML = `<div class="error-state">Failed to load tournaments. Please try again.</div>`;
        }
    }

    async generateDynamicTournaments() {
        const generated = [];
        const sportsService = window.sportsDataService;

        if (!sportsService) {
            // Fallback if service not ready
            return this.getDemoTournaments();
        }

        // Define tournament types to check
        const configs = [
            { type: 'NFL', name: 'Gridiron Gauntlet', entry: 100, prize: 10000, icon: 'fas fa-football-ball', color: '#10b981' },
            { type: 'NBA', name: 'Hardwood Heroes', entry: 50, prize: 5000, icon: 'fas fa-basketball-ball', color: '#f59e0b' },
            { type: 'MLB', name: 'Grand Slam Daily', entry: 25, prize: 2500, icon: 'fas fa-baseball-ball', color: '#3b82f6' },
            { type: 'NHL', name: 'Ice Breaker Cup', entry: 50, prize: 4000, icon: 'fas fa-hockey-puck', color: '#0ea5e9' },
            { type: 'SOCCER', name: 'Global Striker League', entry: 75, prize: 7500, icon: 'fas fa-futbol', color: '#8b5cf6' }
        ];

        let idCounter = 1;

        for (const config of configs) {
            try {
                // Get games for this sport
                const games = await sportsService.getGames(config.type);
                
                // Only create tournament if there are games (upcoming or live)
                const validGames = games.filter(g => g.status === 'pre' || g.status === 'in');
                
                if (validGames.length >= 2) {
                    generated.push({
                        id: idCounter++,
                        name: config.name,
                        type: config.type,
                        entryFee: config.entry,
                        prizePool: config.prize,
                        participants: Math.floor(Math.random() * 80) + 20, // Simulated count
                        maxParticipants: 100,
                        startTime: validGames[0].statusDisplay, // Time of first game
                        difficulty: 'Open',
                        icon: config.icon,
                        color: config.color,
                        games: validGames.slice(0, 10) // Limit to 10 games
                    });
                }
            } catch (e) {
                console.warn(`Skipping ${config.type} tournament:`, e);
            }
        }

        // If no real tournaments found, use demo ones
        if (generated.length === 0) {
            return this.getDemoTournaments();
        }

        // Add a "Multi-Sport" Mega Tournament if we have enough total games
        const allGames = await sportsService.getAllUpcomingGames();
        if (allGames.length > 5) {
            generated.push({
                id: 99,
                name: 'Mega Sports Parlay',
                type: 'Multi-Sport',
                entryFee: 500,
                prizePool: 50000,
                participants: Math.floor(Math.random() * 40) + 10,
                maxParticipants: 200,
                startTime: 'Today',
                difficulty: 'Expert',
                icon: 'fas fa-trophy',
                color: '#ec4899',
                games: allGames.slice(0, 12)
            });
        }

        return generated;
    }

    getDemoTournaments() {
        return [
            {
                id: 1,
                name: 'Weekend Warrior Championship',
                type: 'NFL',
                entryFee: 100,
                prizePool: 10000,
                participants: 45,
                maxParticipants: 100,
                startTime: 'Saturday 1:00 PM',
                difficulty: 'Intermediate',
                icon: 'fas fa-football-ball',
                color: '#10b981',
                games: []
            },
            {
                id: 2,
                name: 'NBA Slam Dunk Contest',
                type: 'NBA',
                entryFee: 50,
                prizePool: 5000,
                participants: 78,
                maxParticipants: 100,
                startTime: 'Friday 7:30 PM',
                difficulty: 'Beginner',
                icon: 'fas fa-basketball-ball',
                color: '#f59e0b',
                games: []
            }
        ];
    }

    renderTournaments() {
        const container = document.getElementById('tournaments-container');
        if (!container) return;

        const tournaments = this.tournaments;

        container.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <!-- Tournament Stats -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-info">
                            <h4>${tournaments.length}</h4>
                            <p>Active Tournaments</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <h4>${tournaments.reduce((sum, t) => sum + t.participants, 0)}</h4>
                            <p>Total Players</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="stat-info">
                            <h4>${(tournaments.reduce((sum, t) => sum + t.prizePool, 0) / 1000).toFixed(0)}K</h4>
                            <p>Total Prizes</p>
                        </div>
                    </div>
                </div>

                <!-- Tournament Cards -->
                <div style="display: grid; gap: 24px;">
                    ${tournaments.map(t => this.createTournamentCard(t)).join('')}
                </div>
            </div>
        `;

        // Add join button handlers
        container.querySelectorAll('.tournament-join-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tournamentId = btn.dataset.id;
                this.joinTournament(tournamentId);
            });
        });
    }

    createTournamentCard(tournament) {
        const fillPercentage = (tournament.participants / tournament.maxParticipants) * 100;
        const almostFull = fillPercentage > 75;

        return `
            <div style="background: var(--bg-card); border: 2px solid var(--border-color); border-radius: 16px; padding: 24px; transition: all 0.3s ease; cursor: pointer;" 
                 class="tournament-card"
                 onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 24px rgba(0,0,0,0.1)'; this.style.borderColor='var(--primary)';"
                 onmouseout="this.style.transform=''; this.style.boxShadow=''; this.style.borderColor='var(--border-color)';">
                
                <div style="display: flex; align-items: start; gap: 20px;">
                    <!-- Icon -->
                    <div style="width: 80px; height: 80px; border-radius: 16px; background: ${tournament.color}; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                        <i class="${tournament.icon}" style="font-size: 40px;"></i>
                    </div>

                    <!-- Content -->
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                            <div>
                                <h3 style="margin: 0 0 8px; font-size: 20px;">${tournament.name}</h3>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <span style="background: var(--bg-tertiary); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; color: ${tournament.color};">
                                        ${tournament.type}
                                    </span>
                                    <span style="background: var(--bg-tertiary); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                                        ${tournament.difficulty}
                                    </span>
                                    ${almostFull ? '<span style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">🔥 Almost Full!</span>' : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Stats Grid -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 16px;">
                            <div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; text-transform: uppercase; font-weight: 600;">Entry Fee</div>
                                <div style="font-size: 18px; font-weight: 700; color: var(--primary);">
                                    <i class="fas fa-coins"></i> ${tournament.entryFee}
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; text-transform: uppercase; font-weight: 600;">Prize Pool</div>
                                <div style="font-size: 18px; font-weight: 700; color: var(--accent);">
                                    <i class="fas fa-trophy"></i> ${tournament.prizePool.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; text-transform: uppercase; font-weight: 600;">Starts</div>
                                <div style="font-size: 14px; font-weight: 600;">
                                    <i class="fas fa-clock"></i> ${tournament.startTime}
                                </div>
                            </div>
                        </div>

                        <!-- Participants Progress -->
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                                <span style="font-weight: 600;">
                                    <i class="fas fa-users"></i> ${tournament.participants}/${tournament.maxParticipants} Players
                                </span>
                                <span style="color: var(--text-secondary);">${fillPercentage.toFixed(0)}% Full</span>
                            </div>
                            <div style="background: var(--bg-tertiary); border-radius: 8px; height: 8px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, ${tournament.color}, var(--accent)); width: ${fillPercentage}%; height: 100%; transition: width 0.5s;"></div>
                            </div>
                        </div>

                        <!-- Join Button -->
                        <button class="btn btn-primary tournament-join-btn" data-id="${tournament.id}" style="width: 100%;">
                            <i class="fas fa-play"></i> Enter Tournament
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    joinTournament(tournamentId) {
        const tournament = this.tournaments.find(t => t.id === parseInt(tournamentId));
        if (!tournament) return;

        // Get current balance
        const balance = window.globalState?.getBalance?.() || 
                       parseInt(localStorage.getItem('unified_balance') || '1000');

        if (balance < tournament.entryFee) {
            this.showNotification(`❌ Insufficient coins! Need ${tournament.entryFee}`, 'error');
            return;
        }

        // Confirm dialog
        if (!confirm(`Join ${tournament.name} for ${tournament.entryFee} coins?`)) return;

        // Deduct coins
        if (window.globalState?.deductCoins) {
            window.globalState.deductCoins(tournament.entryFee, `Tournament: ${tournament.name}`);
        } else {
            localStorage.setItem('unified_balance', (balance - tournament.entryFee).toString());
        }

        this.showNotification(`✅ Joined ${tournament.name}! Get ready to make picks!`, 'success');

        // Launch Picks Interface
        this.openPicksInterface(tournament);
    }

    openPicksInterface(tournament) {
        // Create modal for picks
        const modal = document.createElement('div');
        modal.className = 'coach-picks-modal active'; // Reusing existing modal styles
        
        const gamesList = tournament.games.length > 0 
            ? tournament.games.map((game, i) => `
                <div class="pick-card visible" style="display: block;">
                    <div class="pick-header">
                        <div class="pick-matchup">
                            <h4>${game.awayTeam.name} @ ${game.homeTeam.name}</h4>
                            <span class="pick-time">${game.statusDisplay}</span>
                        </div>
                    </div>
                    <div class="pick-actions" style="margin-top: 15px;">
                        <button class="pick-action-btn" onclick="this.classList.toggle('active'); this.nextElementSibling.classList.remove('active');">
                            ${game.awayTeam.shortName} ${game.odds ? game.odds.details.includes(game.awayTeam.shortName) ? game.odds.details.split(' ')[1] : '' : ''}
                        </button>
                        <button class="pick-action-btn" onclick="this.classList.toggle('active'); this.previousElementSibling.classList.remove('active');">
                            ${game.homeTeam.shortName} ${game.odds ? game.odds.details.includes(game.homeTeam.shortName) ? game.odds.details.split(' ')[1] : '' : ''}
                        </button>
                    </div>
                </div>
            `).join('')
            : '<div style="padding: 20px; text-align: center;">No games available for picking right now. Check back later!</div>';

        modal.innerHTML = `
            <div class="coach-picks-overlay" onclick="this.parentElement.remove()"></div>
            <div class="coach-picks-container">
                <div class="coach-picks-header" style="background: ${tournament.color};">
                    <div class="picks-header-left">
                        <div style="background: rgba(255,255,255,0.2); width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white;">
                            <i class="${tournament.icon}"></i>
                        </div>
                        <div class="picks-coach-info">
                            <h3 style="color: white;">${tournament.name}</h3>
                            <p style="color: rgba(255,255,255,0.8);">Make your predictions to win the ${tournament.prizePool.toLocaleString()} coin pool!</p>
                        </div>
                    </div>
                    <button class="picks-close-btn" onclick="this.closest('.coach-picks-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="coach-picks-list" style="max-height: 60vh; overflow-y: auto; padding: 20px;">
                    ${gamesList}
                </div>

                <div class="picks-footer">
                    <button class="btn-primary" style="width: 100%;" onclick="alert('✅ Picks submitted! Good luck!'); this.closest('.coach-picks-modal').remove();">
                        Submit Picks
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showNotification(msg, type) {
        if (window.showToast) {
            window.showToast(msg, type);
        } else {
            alert(msg);
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tournamentsManager = new TournamentsSimple();
    });
} else {
    window.tournamentsManager = new TournamentsSimple();
}
