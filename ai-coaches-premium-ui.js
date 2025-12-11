// ============================================
// ENHANCED AI COACHES PAGE
// Premium coach cards with live performance
// ============================================

class AICoachesEnhanced {
    constructor() {
        this.coaches = [];
        this.currentTier = 'all';
        this.userTier = 'free';
    }

    async init() {
        console.log('🤖 Initializing enhanced AI coaches...');
        this.getUserTier();
        this.renderEnhancedUI();
        this.attachEventListeners();
        await this.loadCoaches();
    }

    getUserTier() {
        const user = window.currentUser || {};
        this.userTier = user.subscription_tier || 'free';
    }

    renderEnhancedUI() {
        const coachesPage = document.getElementById('coaches-page');
        if (!coachesPage) return;

        const pageContent = coachesPage.querySelector('.page-content');
        if (!pageContent) return;

        pageContent.innerHTML = `
            <!-- Hero Section -->
            <div class="coaches-hero">
                <h2 class="coaches-title">🤖 AI Coaches</h2>
                <p class="coaches-subtitle">11 expert AI coaches with real-time picks</p>
            </div>

            <!-- Tier Filters -->
            <div class="tier-filters">
                <button class="tier-filter-btn active" data-tier="all">
                    <i class="fas fa-globe"></i>
                    All Coaches
                </button>
                <button class="tier-filter-btn" data-tier="free">
                    <i class="fas fa-unlock"></i>
                    Free (3)
                </button>
                <button class="tier-filter-btn" data-tier="pro">
                    <i class="fas fa-star"></i>
                    PRO (4)
                </button>
                <button class="tier-filter-btn" data-tier="vip">
                    <i class="fas fa-crown"></i>
                    VIP (4)
                </button>
            </div>

            <!-- Coaches Grid -->
            <div class="coaches-grid-enhanced" id="coaches-grid">
                <!-- Coach cards will be inserted here -->
            </div>

            <!-- Leaderboard -->
            <div class="coaches-leaderboard">
                <div class="leaderboard-header">
                    <h3 class="leaderboard-title">
                        <i class="fas fa-trophy"></i>
                        Top Performers This Month
                    </h3>
                </div>
                <div class="leaderboard-list" id="coaches-leaderboard">
                    <!-- Leaderboard items will be inserted here -->
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Tier filter buttons
        document.querySelectorAll('.tier-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentTier = e.currentTarget.dataset.tier;
                
                // Update active state
                document.querySelectorAll('.tier-filter-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Re-render coaches
                this.renderCoaches();
            });
        });
    }

    async loadCoaches() {
        try {
            const response = await fetch(`${window.API_URL}/api/ai-coaches/all`);
            if (response.ok) {
                const data = await response.json();
                this.coaches = data.coaches || this.getMockCoaches();
            } else {
                this.coaches = this.getMockCoaches();
            }
        } catch (error) {
            console.error('Error loading coaches:', error);
            this.coaches = this.getMockCoaches();
        }

        this.renderCoaches();
        this.renderLeaderboard();
    }

    getMockCoaches() {
        return [
            { id: 1, name: 'The Analyst', specialty: 'NBA', avatar: '🤖', tier: 'PRO', accuracy: 74.2, total_picks: 547, current_streak: 12 },
            { id: 2, name: 'Sharp Shooter', specialty: 'NFL', avatar: '🏈', tier: 'VIP', accuracy: 71.8, total_picks: 423, current_streak: 8 },
            { id: 3, name: 'Data Dragon', specialty: 'MLB', avatar: '⚾', tier: 'PRO', accuracy: 69.4, total_picks: 612, current_streak: 5 },
            { id: 4, name: 'Ice Breaker', specialty: 'NHL', avatar: '🏒', tier: 'VIP', accuracy: 72.6, total_picks: 389, current_streak: 15 },
            { id: 5, name: 'El Futbolista', specialty: 'Soccer', avatar: '⚽', tier: 'VIP', accuracy: 70.3, total_picks: 478, current_streak: 9 },
            { id: 6, name: 'Gridiron Guru', specialty: 'NCAAF', avatar: '🏈', tier: 'PRO', accuracy: 68.9, total_picks: 534, current_streak: 7 },
            { id: 7, name: 'Ace of Aces', specialty: 'Tennis', avatar: '🎾', tier: 'PRO', accuracy: 73.1, total_picks: 445, current_streak: 11 },
            { id: 8, name: 'Brawl Boss', specialty: 'MMA', avatar: '🥊', tier: 'VIP', accuracy: 75.3, total_picks: 367, current_streak: 13 },
            { id: 9, name: 'Green Master', specialty: 'Golf', avatar: '⛳', tier: 'PRO', accuracy: 67.8, total_picks: 401, current_streak: 6 },
            { id: 10, name: 'March Madness', specialty: 'NCAAB', avatar: '🏀', tier: 'PRO', accuracy: 70.5, total_picks: 589, current_streak: 9 },
            { id: 11, name: 'Pixel Prophet', specialty: 'Esports', avatar: '🎮', tier: 'VIP', accuracy: 76.2, total_picks: 512, current_streak: 14 }
        ];
    }

    renderCoaches() {
        const container = document.getElementById('coaches-grid');
        if (!container) return;

        const filteredCoaches = this.currentTier === 'all' 
            ? this.coaches 
            : this.coaches.filter(coach => coach.tier.toLowerCase() === this.currentTier);

        container.innerHTML = filteredCoaches.map(coach => this.createCoachCard(coach)).join('');
        this.attachCoachCardListeners();
    }

    createCoachCard(coach) {
        const isLocked = this.isCoachLocked(coach);
        const tierClass = coach.tier.toLowerCase();

        return `
            <div class="coach-card-premium ${tierClass}" data-coach-id="${coach.id}">
                ${isLocked ? this.getLockOverlay(coach.tier) : ''}
                
                <div class="coach-card-header-enhanced">
                    <div class="coach-tier-badge-float ${tierClass}">${coach.tier}</div>
                    <div class="coach-avatar-enhanced">
                        ${coach.avatar}
                        <div class="coach-status-indicator"></div>
                    </div>
                    <h3 class="coach-name-enhanced">${coach.name}</h3>
                    <p class="coach-specialty-enhanced">${coach.specialty} Specialist</p>
                </div>

                <div class="coach-stats-row">
                    <div class="coach-stat-mini">
                        <span class="coach-stat-value-mini accent">${coach.accuracy}%</span>
                        <span class="coach-stat-label-mini">Accuracy</span>
                    </div>
                    <div class="coach-stat-mini">
                        <span class="coach-stat-value-mini">${coach.total_picks}</span>
                        <span class="coach-stat-label-mini">Picks</span>
                    </div>
                    <div class="coach-stat-mini">
                        <span class="coach-stat-value-mini">${coach.current_streak}</span>
                        <span class="coach-stat-label-mini">Streak</span>
                    </div>
                </div>

                <div class="coach-performance-bar">
                    <div class="coach-performance-fill" style="width: ${coach.accuracy}%"></div>
                </div>

                <div class="coach-card-footer-enhanced">
                    <button class="coach-action-btn-enhanced view-picks-btn" data-coach-id="${coach.id}" ${isLocked ? 'disabled' : ''}>
                        <i class="fas fa-chart-line"></i>
                        View Picks
                    </button>
                    <button class="coach-action-btn-enhanced primary follow-btn" data-coach-id="${coach.id}" ${isLocked ? 'disabled' : ''}>
                        <i class="fas fa-user-plus"></i>
                        Follow
                    </button>
                </div>
            </div>
        `;
    }

    isCoachLocked(coach) {
        const tierLevels = { 'free': 0, 'pro': 1, 'vip': 2 };
        const coachLevel = tierLevels[coach.tier.toLowerCase()] || 0;
        const userLevel = tierLevels[this.userTier.toLowerCase()] || 0;
        return coachLevel > userLevel;
    }

    getLockOverlay(tier) {
        return `
            <div class="coach-lock-overlay">
                <div class="lock-icon-large">🔒</div>
                <h4 class="lock-title">${tier} Coach</h4>
                <p class="lock-desc">Upgrade to ${tier} to unlock this expert AI coach</p>
                <button class="unlock-btn" onclick="window.showUpgradePrompt && window.showUpgradePrompt('${tier}')">
                    <i class="fas fa-crown"></i> Upgrade Now
                </button>
            </div>
        `;
    }

    attachCoachCardListeners() {
        // View picks buttons
        document.querySelectorAll('.view-picks-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const coachId = e.currentTarget.dataset.coachId;
                this.viewCoachPicks(coachId);
            });
        });

        // Follow buttons
        document.querySelectorAll('.follow-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const coachId = e.currentTarget.dataset.coachId;
                this.followCoach(coachId);
            });
        });
    }

    viewCoachPicks(coachId) {
        const coach = this.coaches.find(c => c.id == coachId);
        if (!coach) return;

        if (window.showToast) {
            window.showToast(`📊 Viewing ${coach.name}'s picks...`, 'info');
        }
        // In real app, navigate to coach details
    }

    followCoach(coachId) {
        const coach = this.coaches.find(c => c.id == coachId);
        if (!coach) return;

        if (window.showToast) {
            window.showToast(`✅ Now following ${coach.name}!`, 'success');
        }
        // In real app, save to backend
    }

    renderLeaderboard() {
        const container = document.getElementById('coaches-leaderboard');
        if (!container) return;

        // Sort by accuracy
        const topCoaches = [...this.coaches]
            .sort((a, b) => b.accuracy - a.accuracy)
            .slice(0, 5);

        container.innerHTML = topCoaches.map((coach, index) => `
            <div class="leaderboard-item" data-coach-id="${coach.id}">
                <div class="leaderboard-rank ${index < 3 ? 'top' : ''}">#${index + 1}</div>
                <div class="leaderboard-avatar">${coach.avatar}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${coach.name}</div>
                    <div class="leaderboard-stats">${coach.specialty} • ${coach.total_picks} picks</div>
                </div>
                <div class="leaderboard-accuracy">${coach.accuracy}%</div>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.leaderboard-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const coachId = e.currentTarget.dataset.coachId;
                this.viewCoachPicks(coachId);
            });
        });
    }
}

// Initialize when navigating to coaches page
document.addEventListener('DOMContentLoaded', () => {
    window.aiCoachesEnhanced = new AICoachesEnhanced();
    
    // Initialize when coaches page is shown
    const observer = new MutationObserver(() => {
        const coachesPage = document.getElementById('coaches-page');
        if (coachesPage && coachesPage.classList.contains('active')) {
            if (window.aiCoachesEnhanced) {
                window.aiCoachesEnhanced.init();
            }
        }
    });

    observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class']
    });
});
