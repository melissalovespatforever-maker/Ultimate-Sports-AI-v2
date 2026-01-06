/**
 * Player Profile Modal System
 * Displays detailed player information when selected from search results
 */

class PlayerProfileModal {
    constructor() {
        this.modal = null;
        this.currentPlayer = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createModal();
        this.attachEventListeners();
        console.log('👤 Player Profile Modal initialized');
    }

    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('player-profile-modal');
        if (existing) existing.remove();

        const modalHTML = `
            <div class="player-profile-modal" id="player-profile-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-container">
                    <div class="modal-content">
                        <!-- Header -->
                        <div class="player-header">
                            <button class="modal-close-btn" aria-label="Close">
                                <i class="fas fa-times"></i>
                            </button>
                            <div class="player-hero">
                                <div class="player-jersey">
                                    <div class="jersey-number" id="player-jersey-number">23</div>
                                </div>
                                <div class="player-hero-info">
                                    <h1 class="player-name" id="player-name">Loading...</h1>
                                    <div class="player-meta">
                                        <span class="player-position" id="player-position">PG</span>
                                        <span class="meta-separator">•</span>
                                        <span class="player-team" id="player-team">Team Name</span>
                                    </div>
                                </div>
                            </div>
                            <div class="player-quick-stats">
                                <div class="quick-stat">
                                    <div class="stat-value" id="stat-1-value">--</div>
                                    <div class="stat-label" id="stat-1-label">PPG</div>
                                </div>
                                <div class="quick-stat">
                                    <div class="stat-value" id="stat-2-value">--</div>
                                    <div class="stat-label" id="stat-2-label">RPG</div>
                                </div>
                                <div class="quick-stat">
                                    <div class="stat-value" id="stat-3-value">--</div>
                                    <div class="stat-label" id="stat-3-label">APG</div>
                                </div>
                            </div>
                        </div>

                        <!-- Tabs -->
                        <div class="profile-tabs">
                            <button class="tab-btn active" data-tab="overview">
                                <i class="fas fa-chart-line"></i> Overview
                            </button>
                            <button class="tab-btn" data-tab="stats">
                                <i class="fas fa-table"></i> Stats
                            </button>
                            <button class="tab-btn" data-tab="games">
                                <i class="fas fa-calendar"></i> Games
                            </button>
                            <button class="tab-btn" data-tab="achievements">
                                <i class="fas fa-trophy"></i> Achievements
                            </button>
                        </div>

                        <!-- Tab Content -->
                        <div class="profile-content">
                            <!-- Overview Tab -->
                            <div class="tab-content active" data-content="overview">
                                <div class="content-grid">
                                    <!-- Bio Card -->
                                    <div class="profile-card">
                                        <div class="card-header">
                                            <i class="fas fa-user-circle"></i>
                                            <h3>Bio</h3>
                                        </div>
                                        <div class="card-body">
                                            <div class="bio-grid">
                                                <div class="bio-item">
                                                    <span class="bio-label">Height</span>
                                                    <span class="bio-value" id="player-height">6'8"</span>
                                                </div>
                                                <div class="bio-item">
                                                    <span class="bio-label">Weight</span>
                                                    <span class="bio-value" id="player-weight">250 lbs</span>
                                                </div>
                                                <div class="bio-item">
                                                    <span class="bio-label">Age</span>
                                                    <span class="bio-value" id="player-age">28</span>
                                                </div>
                                                <div class="bio-item">
                                                    <span class="bio-label">College</span>
                                                    <span class="bio-value" id="player-college">St. Vincent-St. Mary HS</span>
                                                </div>
                                                <div class="bio-item">
                                                    <span class="bio-label">Draft</span>
                                                    <span class="bio-value" id="player-draft">2003 (1st Overall)</span>
                                                </div>
                                                <div class="bio-item">
                                                    <span class="bio-label">Experience</span>
                                                    <span class="bio-value" id="player-experience">21 years</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Season Stats Card -->
                                    <div class="profile-card">
                                        <div class="card-header">
                                            <i class="fas fa-chart-bar"></i>
                                            <h3>Season Stats</h3>
                                        </div>
                                        <div class="card-body">
                                            <div class="stats-list" id="season-stats-list">
                                                <div class="stat-row">
                                                    <span class="stat-name">Points Per Game</span>
                                                    <span class="stat-bar-container">
                                                        <span class="stat-bar" style="width: 85%;"></span>
                                                    </span>
                                                    <span class="stat-number">25.7</span>
                                                </div>
                                                <div class="stat-row">
                                                    <span class="stat-name">Rebounds Per Game</span>
                                                    <span class="stat-bar-container">
                                                        <span class="stat-bar" style="width: 70%;"></span>
                                                    </span>
                                                    <span class="stat-number">7.3</span>
                                                </div>
                                                <div class="stat-row">
                                                    <span class="stat-name">Assists Per Game</span>
                                                    <span class="stat-bar-container">
                                                        <span class="stat-bar" style="width: 75%;"></span>
                                                    </span>
                                                    <span class="stat-number">7.5</span>
                                                </div>
                                                <div class="stat-row">
                                                    <span class="stat-name">Field Goal %</span>
                                                    <span class="stat-bar-container">
                                                        <span class="stat-bar" style="width: 54%;"></span>
                                                    </span>
                                                    <span class="stat-number">54.0%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Performance Trend Card -->
                                    <div class="profile-card full-width">
                                        <div class="card-header">
                                            <i class="fas fa-chart-line"></i>
                                            <h3>Recent Performance</h3>
                                        </div>
                                        <div class="card-body">
                                            <div class="performance-chart" id="performance-chart">
                                                <div class="chart-placeholder">
                                                    <i class="fas fa-chart-area" style="font-size: 48px; color: var(--primary); opacity: 0.3;"></i>
                                                    <p style="margin-top: 16px; color: var(--text-secondary);">Performance visualization coming soon</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Stats Tab -->
                            <div class="tab-content" data-content="stats">
                                <div class="profile-card">
                                    <div class="card-header">
                                        <i class="fas fa-table"></i>
                                        <h3>Detailed Statistics</h3>
                                    </div>
                                    <div class="card-body">
                                        <div class="stats-table-container">
                                            <table class="stats-table">
                                                <thead>
                                                    <tr>
                                                        <th>Category</th>
                                                        <th>2023-24</th>
                                                        <th>Career</th>
                                                        <th>Rank</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="detailed-stats-body">
                                                    <tr>
                                                        <td>Points</td>
                                                        <td>25.7</td>
                                                        <td>27.2</td>
                                                        <td><span class="rank-badge rank-elite">Top 5%</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td>Rebounds</td>
                                                        <td>7.3</td>
                                                        <td>7.5</td>
                                                        <td><span class="rank-badge rank-good">Top 25%</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td>Assists</td>
                                                        <td>7.5</td>
                                                        <td>7.3</td>
                                                        <td><span class="rank-badge rank-elite">Top 10%</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td>Steals</td>
                                                        <td>1.3</td>
                                                        <td>1.5</td>
                                                        <td><span class="rank-badge rank-good">Top 30%</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td>Blocks</td>
                                                        <td>0.5</td>
                                                        <td>0.8</td>
                                                        <td><span class="rank-badge rank-average">Average</span></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Games Tab -->
                            <div class="tab-content" data-content="games">
                                <div class="profile-card">
                                    <div class="card-header">
                                        <i class="fas fa-calendar"></i>
                                        <h3>Recent Games</h3>
                                    </div>
                                    <div class="card-body">
                                        <div class="games-list" id="recent-games-list">
                                            <div class="game-item">
                                                <div class="game-date">Dec 15, 2024</div>
                                                <div class="game-matchup">
                                                    <span class="game-teams">LAL vs GSW</span>
                                                    <span class="game-result win">W 115-112</span>
                                                </div>
                                                <div class="game-stats">28 PTS • 8 REB • 11 AST</div>
                                            </div>
                                            <div class="game-item">
                                                <div class="game-date">Dec 13, 2024</div>
                                                <div class="game-matchup">
                                                    <span class="game-teams">LAL @ PHX</span>
                                                    <span class="game-result loss">L 108-116</span>
                                                </div>
                                                <div class="game-stats">22 PTS • 6 REB • 9 AST</div>
                                            </div>
                                            <div class="game-item">
                                                <div class="game-date">Dec 11, 2024</div>
                                                <div class="game-matchup">
                                                    <span class="game-teams">LAL vs DEN</span>
                                                    <span class="game-result win">W 124-120</span>
                                                </div>
                                                <div class="game-stats">31 PTS • 7 REB • 8 AST</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Achievements Tab -->
                            <div class="tab-content" data-content="achievements">
                                <div class="content-grid">
                                    <div class="profile-card">
                                        <div class="card-header">
                                            <i class="fas fa-trophy"></i>
                                            <h3>Career Highlights</h3>
                                        </div>
                                        <div class="card-body">
                                            <div class="achievements-list">
                                                <div class="achievement-item">
                                                    <div class="achievement-icon">🏆</div>
                                                    <div class="achievement-info">
                                                        <div class="achievement-title">4× NBA Champion</div>
                                                        <div class="achievement-desc">2012, 2013, 2016, 2020</div>
                                                    </div>
                                                </div>
                                                <div class="achievement-item">
                                                    <div class="achievement-icon">⭐</div>
                                                    <div class="achievement-info">
                                                        <div class="achievement-title">4× NBA MVP</div>
                                                        <div class="achievement-desc">2009, 2010, 2012, 2013</div>
                                                    </div>
                                                </div>
                                                <div class="achievement-item">
                                                    <div class="achievement-icon">🎯</div>
                                                    <div class="achievement-info">
                                                        <div class="achievement-title">19× All-Star</div>
                                                        <div class="achievement-desc">2005-2023</div>
                                                    </div>
                                                </div>
                                                <div class="achievement-item">
                                                    <div class="achievement-icon">👑</div>
                                                    <div class="achievement-info">
                                                        <div class="achievement-title">All-Time Scoring Leader</div>
                                                        <div class="achievement-desc">40,000+ Career Points</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="profile-card">
                                        <div class="card-header">
                                            <i class="fas fa-medal"></i>
                                            <h3>Season Awards</h3>
                                        </div>
                                        <div class="card-body">
                                            <div class="awards-grid">
                                                <div class="award-badge">
                                                    <i class="fas fa-star"></i>
                                                    <span>All-NBA First Team</span>
                                                </div>
                                                <div class="award-badge">
                                                    <i class="fas fa-shield-alt"></i>
                                                    <span>All-Defensive Team</span>
                                                </div>
                                                <div class="award-badge">
                                                    <i class="fas fa-fire"></i>
                                                    <span>Player of the Month</span>
                                                </div>
                                                <div class="award-badge">
                                                    <i class="fas fa-bolt"></i>
                                                    <span>Player of the Week (3x)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Action Footer -->
                        <div class="profile-footer">
                            <button class="action-btn btn-secondary" onclick="window.playerProfileModal.close()">
                                <i class="fas fa-times"></i> Close
                            </button>
                            <button class="action-btn btn-primary" onclick="window.playerProfileModal.followPlayer()">
                                <i class="fas fa-star"></i> Follow Player
                            </button>
                            <button class="action-btn btn-primary" onclick="window.playerProfileModal.viewTeam()">
                                <i class="fas fa-users"></i> View Team
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('player-profile-modal');
    }

    attachEventListeners() {
        if (!this.modal) return;

        // Close button
        const closeBtn = this.modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Backdrop click
        const backdrop = this.modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.close());
        }

        // Tab switching
        const tabBtns = this.modal.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        this.modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        this.modal.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabName);
        });
    }

    open(playerData) {
        this.currentPlayer = playerData;
        this.populateData(playerData);
        this.modal.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    close() {
        this.modal.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = ''; // Restore scroll
        this.currentPlayer = null;

        // Reset to overview tab
        setTimeout(() => {
            this.switchTab('overview');
        }, 300);
    }

    populateData(player) {
        // Header Info
        this.setElementText('player-jersey-number', player.number || '0');
        this.setElementText('player-name', player.name || 'Unknown Player');
        this.setElementText('player-position', player.position || 'N/A');
        this.setElementText('player-team', player.team || 'Free Agent');

        // Quick Stats (top of modal)
        if (player.stats) {
            const statsParts = player.stats.split(' • ');
            this.setElementText('stat-1-value', statsParts[0] || '--');
            this.setElementText('stat-2-value', statsParts[1] || '--');
            this.setElementText('stat-3-value', statsParts[2] || '--');
        }

        // Bio
        this.setElementText('player-height', player.height || 'N/A');
        this.setElementText('player-weight', player.weight || 'N/A');
        this.setElementText('player-age', player.age || 'N/A');
        this.setElementText('player-college', player.college || 'N/A');
        this.setElementText('player-draft', player.draft || 'N/A');
        this.setElementText('player-experience', player.experience || 'N/A');
    }

    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }

    followPlayer() {
        if (!this.currentPlayer) return;

        const followed = JSON.parse(localStorage.getItem('followed_players') || '[]');
        if (!followed.includes(this.currentPlayer.id)) {
            followed.push(this.currentPlayer.id);
            localStorage.setItem('followed_players', JSON.stringify(followed));
            
            if (window.showToast) {
                window.showToast(`Now following ${this.currentPlayer.name}!`, 'success');
            }
        } else {
            if (window.showToast) {
                window.showToast(`You're already following ${this.currentPlayer.name}`, 'info');
            }
        }
    }

    viewTeam() {
        if (!this.currentPlayer) return;

        this.close();
        
        if (window.appNavigation) {
            window.appNavigation.navigateTo('live-scores');
        }
        
        if (window.showToast) {
            window.showToast(`Viewing ${this.currentPlayer.team} games...`, 'info');
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.playerProfileModal = new PlayerProfileModal();
});
