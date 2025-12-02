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
        
        // Subscribe to auth state changes
        appState.subscribe(() => this.updateProfileDisplay());
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

        if (!user) {
            profileView.style.display = 'none';
            notLoggedIn.style.display = 'block';
            return;
        }

        // Show profile
        profileView.style.display = 'block';
        notLoggedIn.style.display = 'none';

        // Update profile display
        document.getElementById('profile-name').textContent = user.name || 'User';
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-tier').textContent = (user.subscription_tier || 'FREE') + ' TIER';

        // Format date
        if (user.created_at) {
            const date = new Date(user.created_at);
            document.getElementById('profile-created').textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Populate edit form
        document.getElementById('edit-name').value = user.name || '';
        document.getElementById('edit-email').value = user.email || '';

        // Show profile view by default
        this.showProfileView();
    }

    showProfileView() {
        document.getElementById('profile-view').style.display = 'block';
        document.getElementById('profile-edit').style.display = 'none';
        document.getElementById('profile-password').style.display = 'none';
    }

    showEditForm() {
        document.getElementById('profile-view').style.display = 'none';
        document.getElementById('profile-edit').style.display = 'block';
        document.getElementById('profile-password').style.display = 'none';
    }

    showPasswordForm() {
        document.getElementById('profile-view').style.display = 'none';
        document.getElementById('profile-edit').style.display = 'none';
        document.getElementById('profile-password').style.display = 'block';
        
        // Clear password fields
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
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

// Initialize profile manager
const profileManager = new ProfileManager();

console.log('✅ Profile Management Module loaded');
