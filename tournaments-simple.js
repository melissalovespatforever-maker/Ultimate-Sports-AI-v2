// ============================================
// TOURNAMENTS SIMPLE MODULE
// Display and manage tournaments
// ============================================

console.log('🏆 Loading Tournaments Module');

class TournamentsSimple {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupTournaments());
        } else {
            this.setupTournaments();
        }
    }

    setupTournaments() {
        const container = document.getElementById('tournaments-container');
        if (!container) return;

        // Observe when tournaments page becomes visible
        const observer = new MutationObserver(() => {
            const tournamentsPage = document.getElementById('tournaments-page');
            if (tournamentsPage && tournamentsPage.classList.contains('active')) {
                this.renderTournaments();
            }
        });

        const tournamentsPage = document.getElementById('tournaments-page');
        if (tournamentsPage) {
            observer.observe(tournamentsPage, { attributes: true, attributeFilter: ['class'] });
        }

        // Also render if page is already active
        if (tournamentsPage?.classList.contains('active')) {
            this.renderTournaments();
        }
    }

    renderTournaments() {
        const container = document.getElementById('tournaments-container');
        if (!container) return;

        // Demo tournaments data
        const tournaments = [
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
                color: '#10b981'
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
                color: '#f59e0b'
            },
            {
                id: 3,
                name: 'Multi-Sport Masters',
                type: 'Multi-Sport',
                entryFee: 250,
                prizePool: 50000,
                participants: 32,
                maxParticipants: 50,
                startTime: 'Sunday 12:00 PM',
                difficulty: 'Expert',
                icon: 'fas fa-trophy',
                color: '#8b5cf6'
            }
        ];

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

                <!-- Info Section -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-top: 32px;">
                    <h3 style="margin: 0 0 16px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-info-circle"></i>
                        How Tournaments Work
                    </h3>
                    <div style="display: grid; gap: 16px;">
                        <div style="display: flex; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                                <i class="fas fa-ticket-alt"></i>
                            </div>
                            <div>
                                <div style="font-weight: 600; margin-bottom: 4px;">1. Join a Tournament</div>
                                <div style="color: var(--text-secondary); font-size: 14px;">Pay the entry fee using your coins to enter the competition</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div>
                                <div style="font-weight: 600; margin-bottom: 4px;">2. Make Your Picks</div>
                                <div style="color: var(--text-secondary); font-size: 14px;">Choose your predictions for upcoming games in the tournament</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                                <i class="fas fa-crown"></i>
                            </div>
                            <div>
                                <div style="font-weight: 600; margin-bottom: 4px;">3. Win Prizes</div>
                                <div style="color: var(--text-secondary); font-size: 14px;">Top performers share the prize pool based on accuracy</div>
                            </div>
                        </div>
                    </div>
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
                            <i class="fas fa-plus-circle"></i> Join Tournament
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    joinTournament(tournamentId) {
        // Show modal or confirmation
        if (typeof showToast === 'function') {
            showToast('Tournament feature coming soon! 🏆', 'info');
        } else {
            alert('Tournament joining will be available soon!');
        }
    }
}

// Initialize tournaments manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tournamentsManager = new TournamentsSimple();
    });
} else {
    window.tournamentsManager = new TournamentsSimple();
}

console.log('✅ Tournaments module loaded');
