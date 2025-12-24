// ============================================
// ACHIEVEMENTS SHOWCASE
// Display achievements on profile
// ============================================

class AchievementsShowcase {
    constructor() {
        this.currentCategory = 'all';
        this.selectedAchievement = null;
    }

    renderShowcase() {
        if (!window.achievementsSystem) {
            console.warn('Achievements system not loaded');
            return;
        }

        const container = document.getElementById('achievements-showcase-container');
        if (!container) return;

        const stats = window.achievementsSystem.userStats;
        const allAchievements = window.achievementsSystem.achievements;
        const unlockedCount = window.achievementsSystem.getUnlockedCount();
        const totalCount = window.achievementsSystem.getTotalCount();

        // Get featured achievements (most recent unlocked + highest XP)
        const featured = this.getFeaturedAchievements();

        const html = `
            <div class="achievements-showcase">
                <h3>
                    <i class="fas fa-trophy"></i> 
                    Achievements
                </h3>

                <!-- Progress Summary -->
                <div class="achievement-progress-summary">
                    <div class="progress-stat">
                        <span class="progress-stat-value">${unlockedCount}</span>
                        <span class="progress-stat-label">Unlocked</span>
                    </div>
                    <div class="progress-stat">
                        <span class="progress-stat-value">${totalCount - unlockedCount}</span>
                        <span class="progress-stat-label">Remaining</span>
                    </div>
                    <div class="progress-stat">
                        <span class="progress-stat-value">${Math.round((unlockedCount / totalCount) * 100)}%</span>
                        <span class="progress-stat-label">Complete</span>
                    </div>
                    <div class="progress-stat">
                        <span class="progress-stat-value">${this.getTotalXPEarned()}</span>
                        <span class="progress-stat-label">Total XP</span>
                    </div>
                </div>

                <!-- Featured Achievements -->
                <div style="margin-bottom: 12px;">
                    <strong style="font-size: 14px; color: var(--text-secondary);">Featured</strong>
                </div>
                <div class="featured-achievements">
                    ${featured.map(achievement => this.renderAchievementBadge(achievement)).join('')}
                </div>

                <!-- View All Button -->
                <button class="view-all-achievements-btn" onclick="achievementsShowcase.toggleFullView()">
                    <i class="fas fa-list"></i>
                    <span id="view-all-text">View All Achievements</span>
                </button>

                <!-- Full Achievement List (Hidden by default) -->
                <div id="full-achievements-view" style="display: none;">
                    <!-- Category Filters -->
                    <div class="achievement-categories">
                        <button class="achievement-category-btn active" data-category="all" onclick="achievementsShowcase.filterCategory('all')">
                            All
                        </button>
                        <button class="achievement-category-btn" data-category="login" onclick="achievementsShowcase.filterCategory('login')">
                            🔥 Login
                        </button>
                        <button class="achievement-category-btn" data-category="rank" onclick="achievementsShowcase.filterCategory('rank')">
                            🏅 Rank
                        </button>
                        <button class="achievement-category-btn" data-category="betting" onclick="achievementsShowcase.filterCategory('betting')">
                            🎲 Betting
                        </button>
                        <button class="achievement-category-btn" data-category="tournament" onclick="achievementsShowcase.filterCategory('tournament')">
                            🏆 Tournament
                        </button>
                        <button class="achievement-category-btn" data-category="coins" onclick="achievementsShowcase.filterCategory('coins')">
                            💰 Coins
                        </button>
                        <button class="achievement-category-btn" data-category="social" onclick="achievementsShowcase.filterCategory('social')">
                            👥 Social
                        </button>
                    </div>

                    <!-- Achievement Grid -->
                    <div class="achievements-grid" id="achievements-grid">
                        ${this.renderAllAchievements()}
                    </div>
                </div>
            </div>

            <!-- Achievement Detail Modal -->
            <div class="achievement-modal" id="achievement-modal" onclick="achievementsShowcase.closeModal(event)">
                <div class="achievement-modal-content" onclick="event.stopPropagation()">
                    <button class="achievement-modal-close" onclick="achievementsShowcase.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div id="achievement-modal-body"></div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    getFeaturedAchievements() {
        const allAchievements = Object.values(window.achievementsSystem.achievements);
        
        // Get unlocked achievements sorted by XP (highest first)
        const unlocked = allAchievements
            .filter(a => a.unlocked)
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 3);

        // If less than 3 unlocked, fill with locked high-value achievements
        if (unlocked.length < 3) {
            const locked = allAchievements
                .filter(a => !a.unlocked)
                .sort((a, b) => b.xp - a.xp)
                .slice(0, 3 - unlocked.length);
            return [...unlocked, ...locked];
        }

        return unlocked;
    }

    getTotalXPEarned() {
        const allAchievements = Object.values(window.achievementsSystem.achievements);
        const totalXP = allAchievements
            .filter(a => a.unlocked)
            .reduce((sum, a) => sum + a.xp, 0);
        return totalXP.toLocaleString();
    }

    renderAchievementBadge(achievement) {
        const isRare = achievement.xp >= 1000;
        const rareClass = isRare && achievement.unlocked ? 'rare' : '';
        
        return `
            <div class="achievement-badge ${achievement.unlocked ? '' : 'locked'} ${rareClass}" 
                 onclick="achievementsShowcase.showAchievementDetail('${achievement.id}')">
                <span class="achievement-icon">${achievement.icon}</span>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-xp">+${achievement.xp} XP</div>
            </div>
        `;
    }

    renderAllAchievements() {
        let achievements = Object.values(window.achievementsSystem.achievements);
        
        // Filter by category
        if (this.currentCategory !== 'all') {
            achievements = achievements.filter(a => a.category === this.currentCategory);
        }

        // Sort: unlocked first (by XP desc), then locked (by XP desc)
        achievements.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            return b.xp - a.xp;
        });

        return achievements.map(achievement => this.renderAchievementBadge(achievement)).join('');
    }

    filterCategory(category) {
        this.currentCategory = category;

        // Update button states
        document.querySelectorAll('.achievement-category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });

        // Re-render grid
        const grid = document.getElementById('achievements-grid');
        if (grid) {
            grid.innerHTML = this.renderAllAchievements();
        }
    }

    toggleFullView() {
        const fullView = document.getElementById('full-achievements-view');
        const viewAllText = document.getElementById('view-all-text');
        const button = document.querySelector('.view-all-achievements-btn');
        
        if (fullView.style.display === 'none') {
            fullView.style.display = 'block';
            viewAllText.innerHTML = 'Hide Achievements';
            button.querySelector('i').className = 'fas fa-chevron-up';
        } else {
            fullView.style.display = 'none';
            viewAllText.innerHTML = 'View All Achievements';
            button.querySelector('i').className = 'fas fa-list';
        }
    }

    showAchievementDetail(achievementId) {
        const achievement = window.achievementsSystem.achievements[achievementId];
        if (!achievement) return;

        const modal = document.getElementById('achievement-modal');
        const modalBody = document.getElementById('achievement-modal-body');

        const statusHtml = achievement.unlocked
            ? '<div class="achievement-modal-status">✅ Unlocked</div>'
            : '<div class="achievement-modal-status locked">🔒 Locked</div>';

        modalBody.innerHTML = `
            <div class="achievement-modal-icon">${achievement.icon}</div>
            <h2 class="achievement-modal-name">${achievement.name}</h2>
            <p class="achievement-modal-description">${achievement.description}</p>
            <div class="achievement-modal-xp">+${achievement.xp} XP</div>
            ${statusHtml}
        `;

        modal.classList.add('active');

        // Play sound if unlocked
        if (achievement.unlocked && window.soundEffects) {
            window.soundEffects.playSound('click');
        }
    }

    closeModal(event) {
        if (event && event.target !== event.currentTarget) return;
        const modal = document.getElementById('achievement-modal');
        modal.classList.remove('active');
    }

    // Update showcase when achievements change
    refresh() {
        this.renderShowcase();
    }
}

// Create global instance
const achievementsShowcase = new AchievementsShowcase();
window.achievementsShowcase = achievementsShowcase;

// Helper function for testing
window.testAchievements = function() {
    console.log('🎮 Testing Achievement Showcase...');
    
    // Unlock some test achievements
    const testAchievements = ['first-login', 'rank-bronze', 'first-bet', 'streak-3', 'coins-1k'];
    
    testAchievements.forEach(id => {
        if (window.achievementsSystem) {
            window.achievementsSystem.unlockAchievement(id);
        }
    });
    
    console.log('✅ Unlocked 5 test achievements!');
    console.log('💡 Navigate to Profile to see them in the showcase');
    console.log('💡 Use achievementsShowcase.showAchievementDetail("achievement-id") to view details');
};

// Auto-refresh when profile is viewed
document.addEventListener('DOMContentLoaded', () => {
    // Listen for profile page navigation
    const observer = new MutationObserver(() => {
        const profilePage = document.getElementById('profile-page');
        if (profilePage && profilePage.classList.contains('active')) {
            setTimeout(() => achievementsShowcase.renderShowcase(), 100);
        }
    });

    const profilePage = document.getElementById('profile-page');
    if (profilePage) {
        observer.observe(profilePage, { attributes: true, attributeFilter: ['class'] });
    }
});
