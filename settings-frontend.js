// ============================================
// SETTINGS FRONTEND MODULE
// User preferences and app settings
// ============================================

console.log('⚙️ Loading Settings Module');

class SettingsManager {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupSettings());
        } else {
            this.setupSettings();
        }
    }

    setupSettings() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        // Observe when settings page becomes visible
        const observer = new MutationObserver(() => {
            const settingsPage = document.getElementById('settings-page');
            if (settingsPage && settingsPage.classList.contains('active')) {
                this.renderSettings();
            }
        });

        const settingsPage = document.getElementById('settings-page');
        if (settingsPage) {
            observer.observe(settingsPage, { attributes: true, attributeFilter: ['class'] });
        }

        // Also render if page is already active
        if (settingsPage?.classList.contains('active')) {
            this.renderSettings();
        }
    }

    renderSettings() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        // Load current settings
        const settings = this.getSettings();

        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <!-- Account Settings -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 20px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-user-circle"></i>
                        Account Settings
                    </h3>
                    
                    <div style="display: grid; gap: 20px;">
                        <!-- Display Name -->
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 14px;">
                                Display Name
                            </label>
                            <input type="text" id="setting-display-name" value="${settings.displayName}" 
                                   style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-tertiary); font-size: 16px;">
                        </div>

                        <!-- Email (Read-only) -->
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 14px;">
                                Email Address
                            </label>
                            <input type="email" value="${settings.email}" readonly
                                   style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-tertiary); font-size: 16px; opacity: 0.7; cursor: not-allowed;">
                            <p style="font-size: 12px; color: var(--text-secondary); margin: 8px 0 0;">Contact support to change your email</p>
                        </div>
                    </div>
                </div>

                <!-- Notification Settings -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 20px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-bell"></i>
                        Notifications
                    </h3>
                    
                    <div style="display: grid; gap: 16px;">
                        ${this.createToggle('Email Notifications', 'Receive updates via email', 'emailNotifications', settings.emailNotifications)}
                        ${this.createToggle('Push Notifications', 'Browser push notifications', 'pushNotifications', settings.pushNotifications)}
                        ${this.createToggle('Live Score Alerts', 'Get alerts for live games', 'liveScoreAlerts', settings.liveScoreAlerts)}
                        ${this.createToggle('Tournament Updates', 'Updates on tournaments you joined', 'tournamentUpdates', settings.tournamentUpdates)}
                    </div>
                </div>

                <!-- Display Settings -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 20px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-palette"></i>
                        Display & Accessibility
                    </h3>
                    
                    <div style="display: grid; gap: 16px;">
                        ${this.createToggle('Dark Mode', 'Use dark theme (always on)', 'darkMode', true, true)}
                        ${this.createToggle('Animations', 'Enable visual animations', 'animations', settings.animations)}
                        ${this.createToggle('Sound Effects', 'Play sound effects', 'soundEffects', settings.soundEffects)}
                        ${this.createToggle('Auto-Refresh Scores', 'Automatically refresh live scores', 'autoRefresh', settings.autoRefresh)}
                    </div>
                </div>

                <!-- Privacy Settings -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 20px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-shield-alt"></i>
                        Privacy & Security
                    </h3>
                    
                    <div style="display: grid; gap: 16px;">
                        ${this.createToggle('Show Profile Publicly', 'Make your profile visible to others', 'publicProfile', settings.publicProfile)}
                        ${this.createToggle('Show Stats on Leaderboard', 'Display your stats on leaderboards', 'showOnLeaderboard', settings.showOnLeaderboard)}
                        <div style="padding: 16px 0; border-top: 1px solid var(--border-color); margin-top: 8px;">
                            <button class="btn btn-secondary" onclick="window.settingsManager.exportData()" style="width: 100%; margin-bottom: 12px;">
                                <i class="fas fa-download"></i> Export My Data
                            </button>
                            <button class="btn btn-secondary" onclick="window.settingsManager.clearCache()" style="width: 100%;">
                                <i class="fas fa-trash-alt"></i> Clear Cache
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Save Button -->
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" id="save-settings-btn" style="flex: 1;">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button class="btn btn-secondary" onclick="window.settingsManager.resetToDefaults()">
                        <i class="fas fa-undo"></i> Reset to Defaults
                    </button>
                </div>

                <!-- App Info -->
                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border-color); text-align: center; color: var(--text-secondary);">
                    <p style="margin: 0 0 8px; font-size: 14px;">
                        <strong>Ultimate Sports AI</strong> v4.0.0
                    </p>
                    <p style="margin: 0; font-size: 12px;">
                        <a href="/legal/terms-of-service.html" target="_blank" style="color: var(--primary);">Terms</a> • 
                        <a href="/legal/privacy-policy.html" target="_blank" style="color: var(--primary);">Privacy</a> • 
                        <a href="mailto:support@ultimatesportsai.com" style="color: var(--primary);">Support</a>
                    </p>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachEventListeners();
    }

    createToggle(label, description, id, checked, disabled = false) {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${label}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">${description}</div>
                </div>
                <label class="toggle-switch" style="margin-left: 16px;">
                    <input type="checkbox" id="setting-${id}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
    }

    attachEventListeners() {
        // Save button
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        // Toggle switches - add change listeners
        const toggles = document.querySelectorAll('#settings-container input[type="checkbox"]');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                // Auto-save on toggle change
                this.saveSettings(false); // false = don't show toast
            });
        });

        // Display name input
        const displayNameInput = document.getElementById('setting-display-name');
        if (displayNameInput) {
            displayNameInput.addEventListener('blur', () => {
                this.saveSettings(false);
            });
        }
    }

    getSettings() {
        const saved = localStorage.getItem('userSettings');
        const defaults = {
            displayName: typeof appState !== 'undefined' ? (appState.user?.name || 'Guest User') : 'Guest User',
            email: typeof appState !== 'undefined' ? (appState.user?.email || 'guest@ultimatesports.ai') : 'guest@ultimatesports.ai',
            emailNotifications: true,
            pushNotifications: false,
            liveScoreAlerts: true,
            tournamentUpdates: true,
            darkMode: true,
            animations: true,
            soundEffects: true,
            autoRefresh: true,
            publicProfile: true,
            showOnLeaderboard: true
        };

        if (saved) {
            try {
                return { ...defaults, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Failed to parse settings');
            }
        }

        return defaults;
    }

    saveSettings(showToastMsg = true) {
        const settings = {
            displayName: document.getElementById('setting-display-name')?.value || 'Guest User',
            email: this.getSettings().email,
            emailNotifications: document.getElementById('setting-emailNotifications')?.checked ?? true,
            pushNotifications: document.getElementById('setting-pushNotifications')?.checked ?? false,
            liveScoreAlerts: document.getElementById('setting-liveScoreAlerts')?.checked ?? true,
            tournamentUpdates: document.getElementById('setting-tournamentUpdates')?.checked ?? true,
            darkMode: true,
            animations: document.getElementById('setting-animations')?.checked ?? true,
            soundEffects: document.getElementById('setting-soundEffects')?.checked ?? true,
            autoRefresh: document.getElementById('setting-autoRefresh')?.checked ?? true,
            publicProfile: document.getElementById('setting-publicProfile')?.checked ?? true,
            showOnLeaderboard: document.getElementById('setting-showOnLeaderboard')?.checked ?? true
        };

        localStorage.setItem('userSettings', JSON.stringify(settings));

        // Update guest username if changed
        if (settings.displayName) {
            localStorage.setItem('guestUsername', settings.displayName);
            if (typeof appState !== 'undefined') {
                appState.user.name = settings.displayName;
                appState.notify();
            }
        }

        if (showToastMsg && typeof showToast === 'function') {
            showToast('Settings saved successfully! ✅', 'success');
        }
    }

    resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            localStorage.removeItem('userSettings');
            this.renderSettings();
            if (typeof showToast === 'function') {
                showToast('Settings reset to defaults', 'success');
            }
        }
    }

    exportData() {
        const data = {
            settings: this.getSettings(),
            analytics: localStorage.getItem('userAnalytics'),
            guestUsername: localStorage.getItem('guestUsername'),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ultimate-sports-ai-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        if (typeof showToast === 'function') {
            showToast('Data exported successfully! 📦', 'success');
        }
    }

    clearCache() {
        if (confirm('This will clear all cached data. Are you sure?')) {
            // Clear specific cache items but keep auth
            const keysToKeep = ['auth_token', 'userSettings', 'guestUsername', 'hasSeenUsernamePicker'];
            const allKeys = Object.keys(localStorage);
            
            allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });

            if (typeof showToast === 'function') {
                showToast('Cache cleared successfully! 🗑️', 'success');
            }
        }
    }
}

// Add toggle switch CSS if not already present
if (!document.getElementById('toggle-switch-styles')) {
    const style = document.createElement('style');
    style.id = 'toggle-switch-styles';
    style.textContent = `
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 28px;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--bg-tertiary);
            transition: 0.3s;
            border-radius: 28px;
            border: 2px solid var(--border-color);
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: 0.3s;
            border-radius: 50%;
        }

        input:checked + .toggle-slider {
            background: linear-gradient(135deg, var(--primary), var(--accent));
            border-color: var(--primary);
        }

        input:checked + .toggle-slider:before {
            transform: translateX(22px);
        }

        input:disabled + .toggle-slider {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}

// Initialize settings manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.settingsManager = new SettingsManager();
    });
} else {
    window.settingsManager = new SettingsManager();
}

console.log('✅ Settings module loaded');
