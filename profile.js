// ============================================
// PROFILE MANAGEMENT MODULE
// Handle profile view, edit, and password change
// ============================================

console.log('👤 Loading Profile Management Module');

class ProfileManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupProfileButtons();
        this.setupEditForm();
        this.setupPasswordForm();
        
        // Subscribe to global state changes
        if (window.globalState) {
            window.globalState.subscribe(() => this.updateProfileDisplay());
        } else if (typeof appState !== 'undefined') {
            appState.subscribe(() => this.updateProfileDisplay());
        }
        
        // Initial display update
        setTimeout(() => this.updateProfileDisplay(), 100);
    }

    setupProfileButtons() {
        document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
            this.showEditForm();
        });

        document.getElementById('change-password-btn')?.addEventListener('click', () => {
            this.showPasswordForm();
        });

        document.getElementById('transaction-history-btn')?.addEventListener('click', () => {
            window.open('purchase-history.html', '_blank');
        });

        document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
            if (window.authManager) {
                window.authManager.logout();
            } else if (window.socialAuthService) {
                window.socialAuthService.logout();
            }
        });

        document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
            this.showProfileView();
        });

        document.getElementById('cancel-password-btn')?.addEventListener('click', () => {
            this.showProfileView();
        });

        document.querySelector('.avatar-edit-btn')?.addEventListener('click', () => {
            window.globalState?.showNotification('Avatar uploads coming soon to Pro members!', 'info');
        });
    }

    setupEditForm() {
        const form = document.getElementById('edit-profile-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleEditProfile();
        });
    }

    setupPasswordForm() {
        const form = document.getElementById('change-password-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleChangePassword();
        });
    }

    updateProfileDisplay() {
        const user = window.globalState?.appState?.user || window.appState?.user;
        const profileView = document.getElementById('profile-view');
        const notLoggedIn = document.getElementById('profile-not-logged-in');

        // Safety check
        if (!profileView || !notLoggedIn) return;

        if (!user) {
            profileView.style.display = 'none';
            notLoggedIn.style.display = 'block';
            return;
        }

        profileView.style.display = 'block';
        notLoggedIn.style.display = 'none';

        // Update basic info
        this.updateElementText('profile-name', user.username || user.name || 'User');
        this.updateElementText('profile-email', user.email);
        this.updateElementText('profile-tier', (user.subscription_tier || 'FREE') + ' TIER');
        
        // Update subscription card
        this.updateElementText('current-plan-name', user.subscription_tier ? `${user.subscription_tier} VIP` : 'Free Plan');

        // Update creation date
        if (user.created_at) {
            const date = new Date(user.created_at);
            this.updateElementText('profile-created', date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            }));
        }

        // Update detailed stats
        this.updateStatsDisplay(user);
        
        // Update level & prestige
        this.updatePrestigeDisplay();

        // Update achievements showcase
        if (window.achievementsShowcase) {
            window.achievementsShowcase.renderShowcase('#achievements-showcase-container');
        }

        // Fetch and render recent activity
        this.fetchRecentActivity();

        // Populate edit form
        const editName = document.getElementById('edit-name');
        const editEmail = document.getElementById('edit-email');
        if (editName) editName.value = user.username || user.name || '';
        if (editEmail) editEmail.value = user.email || '';

        this.showProfileView();
    }

    updateElementText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    updateStatsDisplay(user) {
        this.updateElementText('profile-login-streak', user.login_streak || 0);
        this.updateElementText('profile-win-rate', (user.win_rate || 0) + '%');
        this.updateElementText('profile-total-picks', user.total_picks || 0);
        
        const unlocked = window.achievementsSystem?.getUnlockedCount() || 0;
        const total = window.achievementsSystem?.getTotalCount() || 30;
        this.updateElementText('profile-achievements', `${unlocked}/${total}`);
    }

    updatePrestigeDisplay() {
        if (!window.achievementsSystem) return;

        const stats = window.achievementsSystem.userStats;
        const progress = window.achievementsSystem.getProgress();

        this.updateElementText('profile-level', stats.level);
        this.updateElementText('profile-rank', stats.rank || 'Rookie');
        this.updateElementText('xp-percent-text', progress.progress + '%');
        this.updateElementText('profile-xp-current', progress.xpInCurrentLevel);
        this.updateElementText('profile-xp-total', 500);

        const xpBar = document.getElementById('profile-xp-bar');
        if (xpBar) xpBar.style.width = progress.progress + '%';

        const starContainer = document.getElementById('prestige-stars');
        if (starContainer) {
            const starCount = Math.max(1, Math.min(5, Math.floor(stats.level / 5) + 1));
            starContainer.innerHTML = Array(starCount).fill('<i class="fas fa-star"></i>').join('');
        }
    }

    async fetchRecentActivity() {
        const container = document.getElementById('recent-activity-list');
        if (!container) return;

        try {
            const history = await window.globalState?.getBettingHistory() || [];
            
            if (history.length === 0) {
                container.innerHTML = '<div class="activity-placeholder">No recent activity detected. Start making picks to see history!</div>';
                return;
            }

            container.innerHTML = history.slice(0, 5).map(bet => `
                <div class="activity-item">
                    <div class="activity-icon ${bet.status?.toLowerCase() || 'pending'}">
                        <i class="fas ${bet.status === 'WON' ? 'fa-check' : (bet.status === 'LOST' ? 'fa-times' : 'fa-clock')}"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-title">${bet.event_name || 'Bet on Match'}</div>
                        <div class="activity-meta">
                            <span class="activity-time">${new Date(bet.created_at).toLocaleDateString()}</span>
                            <span class="activity-outcome ${bet.status?.toLowerCase() || 'pending'}">${bet.status || 'PENDING'}</span>
                        </div>
                    </div>
                    <div class="activity-payout ${bet.payout > 0 ? 'positive' : ''}">
                        ${bet.payout > 0 ? '+' : ''}${(bet.payout || 0).toLocaleString()} 🪙
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.warn('Could not fetch recent activity:', error);
            container.innerHTML = '<div class="activity-placeholder">Recent activity temporarily unavailable.</div>';
        }
    }

    showProfileView() {
        const profileView = document.getElementById('profile-view');
        const profileEdit = document.getElementById('profile-edit');
        const profilePassword = document.getElementById('profile-password');
        
        if (profileView) profileView.style.display = 'block';
        if (profileEdit) profileEdit.style.display = 'none';
        if (profilePassword) profilePassword.style.display = 'none';
    }

    showEditForm() {
        const profileView = document.getElementById('profile-view');
        const profileEdit = document.getElementById('profile-edit');
        const profilePassword = document.getElementById('profile-password');
        
        if (profileView) profileView.style.display = 'none';
        if (profileEdit) profileEdit.style.display = 'block';
        if (profilePassword) profilePassword.style.display = 'none';
    }

    showPasswordForm() {
        const profileView = document.getElementById('profile-view');
        const profileEdit = document.getElementById('profile-edit');
        const profilePassword = document.getElementById('profile-password');
        
        if (profileView) profileView.style.display = 'none';
        if (profileEdit) profileEdit.style.display = 'none';
        if (profilePassword) profilePassword.style.display = 'block';
        
        const currentPassword = document.getElementById('current-password');
        const newPassword = document.getElementById('new-password');
        const confirmPassword = document.getElementById('confirm-password');
        
        if (currentPassword) currentPassword.value = '';
        if (newPassword) newPassword.value = '';
        if (confirmPassword) confirmPassword.value = '';
    }

    async handleEditProfile() {
        const name = document.getElementById('edit-name').value.trim();
        const email = document.getElementById('edit-email').value.trim();

        if (!name || name.length < 2) {
            window.globalState?.showNotification('Name must be at least 2 characters', 'error');
            return;
        }

        const user = window.globalState?.appState?.user;
        if (name === user?.username && email === user?.email) {
            this.showProfileView();
            return;
        }

        try {
            window.globalState?.showNotification('Updating profile...', 'info');
            const token = localStorage.getItem('auth_token');
            const apiUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
            
            const response = await fetch(`${apiUrl}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: name, email })
            });

            if (!response.ok) throw new Error('Failed to update profile');
            const data = await response.json();

            if (window.globalState) {
                window.globalState.setUser({ ...user, ...data.user });
            }

            window.globalState?.showNotification('Profile updated successfully!', 'success');
            this.showProfileView();
        } catch (error) {
            window.globalState?.showNotification(error.message || 'Failed to update profile', 'error');
        }
    }

    async handleChangePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!currentPassword) {
            window.globalState?.showNotification('Please enter your current password', 'error');
            return;
        }

        if (newPassword.length < 8) {
            window.globalState?.showNotification('New password must be at least 8 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            window.globalState?.showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            window.globalState?.showNotification('Updating password...', 'info');
            const token = localStorage.getItem('auth_token');
            const apiUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
            
            const response = await fetch(`${apiUrl}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            if (!response.ok) throw new Error('Failed to change password');

            window.globalState?.showNotification('Password changed successfully!', 'success');
            this.showProfileView();
        } catch (error) {
            window.globalState?.showNotification(error.message || 'Failed to change password', 'error');
        }
    }
}

// Defer initialization until DOM is ready and appState exists
let profileManager;

function initProfileManager() {
    if (typeof appState !== 'undefined' || window.globalState) {
        if (!profileManager) {
            profileManager = new ProfileManager();
            console.log('✅ Profile Manager initialized');
        } else {
            profileManager.updateProfileDisplay();
            console.log('🔄 Profile Manager re-initialized');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileManager);
} else {
    initProfileManager();
}

window.reinitProfile = initProfileManager;
console.log('✅ Profile Management Module loaded');