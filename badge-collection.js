// ============================================
// BADGE COLLECTION UI
// ============================================

class BadgeCollectionUI {
    constructor() {
        this.achievements = window.achievementsSystem;
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderStats();
        this.renderSeries();
        this.renderBadges();
        console.log('✅ Badge Collection UI initialized');
    }

    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setFilter(e.currentTarget.dataset.filter);
            });
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });

        // Update title
        const categoryTitle = document.getElementById('category-title');
        const titles = {
            'all': 'All Achievements',
            'login': 'Login Streaks',
            'betting': 'Betting Achievements',
            'tournament': 'Tournament Victories',
            'minigames': 'Minigame Mastery',
            'collection': 'Card Collection',
            'coins': 'Wealth Achievements',
            'rank': 'Rank Progression',
            'social': 'Social Achievements',
            'special': 'Special Events'
        };
        categoryTitle.textContent = titles[filter] || 'All Achievements';

        this.renderBadges();
    }

    renderStats() {
        const unlocked = this.achievements.getUnlockedCount();
        const total = this.achievements.getTotalCount();
        const percentage = Math.round((unlocked / total) * 100);

        document.getElementById('unlocked-count').textContent = unlocked;
        document.getElementById('total-count').textContent = total;
        document.getElementById('completion-fill').style.width = `${percentage}%`;
    }

    renderSeries() {
        const seriesGrid = document.getElementById('series-grid');
        const allSeries = this.achievements.getAllSeries();
        
        if (Object.keys(allSeries).length === 0) {
            seriesGrid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No progressive series available.</p>';
            return;
        }

        seriesGrid.innerHTML = '';

        Object.entries(allSeries).forEach(([seriesName, achievements]) => {
            const status = this.achievements.getSeriesStatus(seriesName);
            if (!status) return;

            const unlockedCount = achievements.filter(a => a.unlocked).length;
            const totalCount = achievements.length;
            const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

            const card = document.createElement('div');
            card.className = 'series-card';
            
            card.innerHTML = `
                <div class="series-header">
                    <h3 class="series-name">${this.formatSeriesName(seriesName)}</h3>
                    <span class="series-completion">${unlockedCount}/${totalCount}</span>
                </div>
                
                <div class="series-tiers">
                    ${achievements.map(ach => `
                        <div class="tier-badge ${ach.unlocked ? 'unlocked' : ''}" title="${ach.name}">
                            ${ach.icon}
                        </div>
                    `).join('')}
                </div>

                ${status.progress ? `
                    <div class="series-progress">
                        <div class="progress-label">
                            <span>${status.nextTier ? status.nextTier.name : 'Completed!'}</span>
                            <span>${status.progress.current} / ${status.progress.target}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${status.progress.percentage}%"></div>
                        </div>
                    </div>
                ` : ''}
            `;

            seriesGrid.appendChild(card);
        });
    }

    formatSeriesName(name) {
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    renderBadges() {
        const badgesGrid = document.getElementById('badges-grid');
        const emptyState = document.getElementById('empty-state');
        
        let achievements = Object.values(this.achievements.achievements);

        // Filter by category
        if (this.currentFilter !== 'all') {
            achievements = achievements.filter(a => a.category === this.currentFilter);
        }

        if (achievements.length === 0) {
            badgesGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        badgesGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        badgesGrid.innerHTML = '';

        // Sort: unlocked first, then by XP
        achievements.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            return b.xp - a.xp;
        });

        achievements.forEach(achievement => {
            const card = this.createBadgeCard(achievement);
            badgesGrid.appendChild(card);
        });
    }

    createBadgeCard(achievement) {
        const card = document.createElement('div');
        card.className = `badge-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        
        // Get progress if available
        let progressHTML = '';
        if (!achievement.unlocked && achievement.progressType) {
            const progress = this.achievements.getAchievementProgress(achievement.id);
            if (progress) {
                progressHTML = `
                    <div class="badge-progress">
                        <div class="progress-text">
                            ${progress.current} / ${progress.target}
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                        </div>
                    </div>
                `;
            }
        }

        card.innerHTML = `
            <span class="badge-icon">${achievement.icon}</span>
            <h3 class="badge-name">${achievement.name}</h3>
            <p class="badge-description">${achievement.description}</p>
            <span class="badge-xp">+${achievement.xp} XP</span>
            ${progressHTML}
            <div class="unlock-status ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <i class="fas fa-${achievement.unlocked ? 'check-circle' : 'lock'}"></i>
                ${achievement.unlocked ? 'Unlocked' : 'Locked'}
            </div>
        `;

        card.addEventListener('click', () => {
            this.showBadgeDetail(achievement);
        });

        return card;
    }

    showBadgeDetail(achievement) {
        const modal = document.getElementById('badge-modal');
        const detail = document.getElementById('badge-detail');

        const progress = achievement.progressType ? 
            this.achievements.getAchievementProgress(achievement.id) : null;

        const categoryNames = {
            'login': 'Login & Engagement',
            'betting': 'Betting & Wagering',
            'tournament': 'Tournament Play',
            'minigames': 'Minigames',
            'collection': 'Card Collection',
            'coins': 'Coins & Wealth',
            'rank': 'Rank & Progression',
            'social': 'Social',
            'special': 'Special Events'
        };

        detail.innerHTML = `
            <span class="badge-icon">${achievement.icon}</span>
            <h2 class="badge-name">${achievement.name}</h2>
            <p class="badge-description">${achievement.description}</p>
            <span class="badge-xp">+${achievement.xp} XP</span>
            
            <div class="unlock-status ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <i class="fas fa-${achievement.unlocked ? 'check-circle' : 'lock'}"></i>
                ${achievement.unlocked ? 'Achievement Unlocked!' : 'Not Unlocked Yet'}
            </div>

            ${progress ? `
                <div class="badge-progress" style="margin-top: 2rem;">
                    <div class="progress-label">
                        <span>Progress</span>
                        <span>${progress.current} / ${progress.target}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                    </div>
                </div>
            ` : ''}

            <div class="badge-meta">
                <div class="meta-item">
                    <div class="meta-label">Category</div>
                    <div class="meta-value">${categoryNames[achievement.category] || 'General'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">XP Reward</div>
                    <div class="meta-value">${achievement.xp}</div>
                </div>
                ${achievement.series ? `
                    <div class="meta-item">
                        <div class="meta-label">Series</div>
                        <div class="meta-value" style="font-size: 1rem;">Tier ${achievement.tier}</div>
                    </div>
                ` : ''}
                ${achievement.rarity ? `
                    <div class="meta-item">
                        <div class="meta-label">Rarity</div>
                        <div class="meta-value" style="text-transform: capitalize;">${achievement.rarity}</div>
                    </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
    }

    refresh() {
        this.renderStats();
        this.renderSeries();
        this.renderBadges();
    }
}

// Close modal function
function closeBadgeModal() {
    document.getElementById('badge-modal').classList.remove('active');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.badgeCollectionUI = new BadgeCollectionUI();
});
