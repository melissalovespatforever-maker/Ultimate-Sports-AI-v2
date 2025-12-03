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
        
        // Subscribe to auth state changes - check if appState exists
        if (typeof appState !== 'undefined') {
            appState.subscribe(() => this.updateProfileDisplay());
        }
    }

    setupProfileButtons() {
        document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
            this.showEditForm();
        });

        document.getElementById('change-password-btn')?.addEventListener('click', () => {
            this.showPasswordForm();
        });

        document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
            authManager.logout();
        });

        document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
            this.showProfileView();
        });

        document.getElementById('cancel-password-btn')?.addEventListener('click', () => {
            this.showProfileView();
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
        const user = appState.user;
        const profileView = document.getElementById('profile-view');
        const notLoggedIn = document.getElementById('profile-not-logged-in');

        // Safety check - if elements don't exist, exit early
        if (!profileView || !notLoggedIn) {
            console.warn('⚠️ Profile display elements not found');
            return;
        }

        if (!user) {
            profileView.style.display = 'none';
            notLoggedIn.style.display = 'block';
            return;
        }

        // Show profile
        profileView.style.display = 'block';
        notLoggedIn.style.display = 'none';

        // Update profile display - with null checks
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileTier = document.getElementById('profile-tier');
        const profileCreated = document.getElementById('profile-created');
        const editName = document.getElementById('edit-name');
        const editEmail = document.getElementById('edit-email');

        if (profileName) profileName.textContent = user.name || 'User';
        if (profileEmail) profileEmail.textContent = user.email;
        if (profileTier) profileTier.textContent = (user.subscription_tier || 'FREE') + ' TIER';

        // Format date
        if (user.created_at && profileCreated) {
            const date = new Date(user.created_at);
            profileCreated.textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Populate edit form
        if (editName) editName.value = user.name || '';
        if (editEmail) editEmail.value = user.email || '';

        // Show profile view by default
        this.showProfileView();
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
        
        // Clear password fields
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

        // Validate
        if (!name || name.length < 2) {
            showToast('Name must be at least 2 characters', 'error');
            return;
        }

        if (!FormValidator.validateEmail(email)) {
            showToast('Please enter a valid email', 'error');
            return;
        }

        // Check if anything changed
        const user = appState.user;
        if (name === user.name && email === user.email) {
            showToast('No changes made', 'info');
            this.showProfileView();
            return;
        }

        try {
            showToast('Updating profile...', 'info');

            // Call API to update profile
            const response = await api.request('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ name, email })
            });

            // Update local state
            appState.user = { ...appState.user, ...response };
            appState.notify();

            showToast('Profile updated successfully!', 'success');
            this.showProfileView();
        } catch (error) {
            showToast(error.message || 'Failed to update profile', 'error');
        }
    }

    async handleChangePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validate
        if (!currentPassword) {
            showToast('Please enter your current password', 'error');
            return;
        }

        if (!FormValidator.validatePassword(newPassword)) {
            showToast('New password must be at least 6 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (currentPassword === newPassword) {
            showToast('New password must be different from current password', 'error');
            return;
        }

        try {
            showToast('Updating password...', 'info');

            // Call API to change password
            await api.request('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            showToast('Password changed successfully!', 'success');
            this.showProfileView();
        } catch (error) {
            showToast(error.message || 'Failed to change password', 'error');
        }
    }
}

// Defer initialization until DOM is ready and appState exists
let profileManager;

function initProfileManager() {
    if (typeof appState !== 'undefined') {
        if (!profileManager) {
            profileManager = new ProfileManager();
            console.log('✅ Profile Manager initialized');
        } else {
            // Re-update display when navigating back to profile
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

// Export for re-initialization when navigating to profile page
window.reinitProfile = initProfileManager;

console.log('✅ Profile Management Module loaded');
