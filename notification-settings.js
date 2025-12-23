// ============================================
// NOTIFICATION SETTINGS & PREFERENCES
// User control over notification behavior
// ============================================

console.log('⚙️ Notification Settings Module loading...');

class NotificationSettings {
    constructor() {
        this.settings = this.loadSettings();
        this.initUI();
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const defaults = {
            enabled: true,
            soundEnabled: true,
            badgeEnabled: true,
            pollingEnabled: true,
            pollInterval: 30000, // 30 seconds
            notificationTypes: {
                pickCreated: true,
                pickResult: true,
                streakUpdate: true,
                injuryAlert: true,
                marketMovement: true
            },
            minConfidence: 60, // Only notify for picks >= 60% confidence
            selectedCoaches: [], // Empty = all coaches
            desktopNotifications: true,
            soundVolume: 0.3
        };

        try {
            const saved = localStorage.getItem('notification_settings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch (error) {
            console.error('Error loading settings:', error);
            return defaults;
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('notification_settings', JSON.stringify(this.settings));
            console.log('✅ Settings saved');
            this.applySettings();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Apply settings to active components
     */
    applySettings() {
        if (window.picksNotificationUI) {
            window.picksNotificationUI.setSoundEnabled(this.settings.soundEnabled);
            window.picksNotificationUI.setBadgeEnabled(this.settings.badgeEnabled);
            
            if (!this.settings.enabled) {
                window.picksNotificationUI.clearAll();
            }
        }

        // Update polling interval
        if (window.picksNotificationUI && this.settings.pollingEnabled) {
            if (window.picksNotificationUI.pollInterval) {
                clearInterval(window.picksNotificationUI.pollInterval);
            }
            window.picksNotificationUI.POLL_INTERVAL = this.settings.pollInterval;
            window.picksNotificationUI.startPolling();
        }
    }

    /**
     * Check if notification should be shown
     */
    shouldShowNotification(data) {
        // Check if notifications are enabled
        if (!this.settings.enabled) return false;

        // Check notification type
        const type = data.type || 'pickCreated';
        if (this.settings.notificationTypes[type] === false) return false;

        // Check confidence level (for picks)
        if (data.type === 'pick' && data.confidence < this.settings.minConfidence) {
            return false;
        }

        // Check selected coaches
        if (this.settings.selectedCoaches.length > 0) {
            if (!this.settings.selectedCoaches.includes(data.coach)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Initialize settings UI
     */
    initUI() {
        // Create settings modal
        const settingsBtn = document.getElementById('notification-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        // Remove existing modal
        const existing = document.getElementById('notification-settings-modal');
        if (existing) existing.remove();
