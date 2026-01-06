/**
 * Notification Preferences UI
 * User-friendly interface for managing push notification settings
 */

import nativePushNotifications from './native-push-notifications.js';

class NotificationPreferencesUI {
    constructor() {
        this.API_URL = 'https://ultimate-sports-ai-backend.up.railway.app';
        this.preferences = null;
    }

    /**
     * Initialize and render preferences UI
     */
    async initialize(containerId = 'notification-preferences') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[Notification Preferences] Container not found:', containerId);
            return;
        }

        // Load current preferences
        await this.loadPreferences();

        // Render UI
        container.innerHTML = this.renderHTML();

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Load user's current notification preferences
     */
    async loadPreferences() {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            if (!token) {
                console.log('[Notification Preferences] No auth token');
                return;
            }

            const response = await fetch(`${this.API_URL}/api/notifications/preferences`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.preferences = data.preferences;
                console.log('[Notification Preferences] Loaded:', this.preferences);
            } else {
                console.error('[Notification Preferences] Failed to load');
            }
        } catch (error) {
            console.error('[Notification Preferences] Load error:', error);
        }
    }

    /**
     * Save updated preferences to backend
     */
    async savePreferences(updates) {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            if (!token) {
                console.log('[Notification Preferences] No auth token');
                return false;
            }

            const response = await fetch(`${this.API_URL}/api/notifications/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const data = await response.json();
                this.preferences = data.preferences;
                console.log('[Notification Preferences] Saved:', this.preferences);
                
                // Show success message
                this.showToast('Notification preferences saved!', 'success');
                return true;
            } else {
                console.error('[Notification Preferences] Failed to save');
                this.showToast('Failed to save preferences', 'error');
                return false;
            }
        } catch (error) {
            console.error('[Notification Preferences] Save error:', error);
            this.showToast('Error saving preferences', 'error');
            return false;
        }
    }

    /**
     * Render preferences HTML
     */
    renderHTML() {
        const prefs = this.preferences || {};
        const isNative = nativePushNotifications.isNativePlatform();
        const platform = nativePushNotifications.getPlatform();

        return `
            <div class="notification-preferences-container">
                <div class="preferences-header">
                    <h2>📱 Notification Settings</h2>
                    <p class="platform-badge">${isNative ? `Native ${platform.toUpperCase()}` : 'Web Browser'}</p>
                </div>

                ${!isNative ? `
                    <div class="notification-warning">
                        <span>⚠️</span>
                        <div>
                            <strong>Browser Notifications</strong>
                            <p>For the best experience, download our native app to receive push notifications even when the browser is closed.</p>
                        </div>
                    </div>
                ` : ''}

                <!-- Master Toggle -->
                <div class="preference-section">
                    <div class="preference-item master-toggle">
                        <div class="preference-info">
                            <div class="preference-icon">🔔</div>
                            <div>
                                <h3>Push Notifications</h3>
                                <p>Enable or disable all push notifications</p>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="push_enabled" ${prefs.push_enabled !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Notification Types -->
                <div class="preference-section">
                    <h3 class="section-title">Notification Types</h3>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-icon">🎯</div>
                            <div>
                                <h4>New AI Picks</h4>
                                <p>Get notified when coaches release new picks</p>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="new_picks" ${prefs.new_picks !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-icon">📊</div>
                            <div>
                                <h4>Game Results</h4>
                                <p>Receive updates when your tracked games finish</p>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="game_results" ${prefs.game_results !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-icon">🏆</div>
                            <div>
                                <h4>Tournament Updates</h4>
                                <p>Get alerts about tournament progress and results</p>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="tournament_updates" ${prefs.tournament_updates !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-icon">🏅</div>
                            <div>
                                <h4>Achievements</h4>
                                <p>Be notified when you unlock new achievements</p>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="achievements" ${prefs.achievements !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-icon">🛍️</div>
                            <div>
                                <h4>Daily Deals</h4>
                                <p>Get alerts for new shop deals and limited offers</p>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="daily_deals" ${prefs.daily_deals !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-icon">👥</div>
                            <div>
                                <h4>Friend Requests</h4>
                                <p>Get notified when someone sends a friend request</p>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="friend_requests" ${prefs.friend_requests !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-icon">⚔️</div>
                            <div>
                                <h4>Challenge Invites</h4>
                                <p>Receive alerts for 1v1 and tournament invites</p>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="challenge_invites" ${prefs.challenge_invites !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-icon">📢</div>
                            <div>
                                <h4>Marketing & Updates</h4>
                                <p>Occasional news about new features and updates</p>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="marketing" ${prefs.marketing === true ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Quiet Hours (Future Feature) -->
                <div class="preference-section coming-soon">
                    <h3 class="section-title">⏰ Quiet Hours <span class="badge-soon">Coming Soon</span></h3>
                    <p class="section-description">Set specific hours when you don't want to receive notifications</p>
                    <div class="quiet-hours-controls disabled">
                        <input type="time" value="22:00" disabled>
                        <span>to</span>
                        <input type="time" value="08:00" disabled>
                    </div>
                </div>

                <!-- Test Notification Button -->
                ${isNative ? `
                    <div class="preference-section">
                        <button id="test-notification-btn" class="test-notification-btn">
                            <span>🔔</span>
                            Send Test Notification
                        </button>
                    </div>
                ` : ''}

                <!-- Device Info -->
                <div class="device-info">
                    <small>Platform: ${platform} | Native: ${isNative ? 'Yes' : 'No'}</small>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle switches
        const toggles = document.querySelectorAll('.notification-preferences-container input[type="checkbox"]');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                const prefKey = e.target.id;
                const value = e.target.checked;
                
                console.log(`[Notification Preferences] Changed ${prefKey} to ${value}`);
                
                // Save to backend
                await this.savePreferences({ [prefKey]: value });
            });
        });

        // Test notification button
        const testBtn = document.getElementById('test-notification-btn');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.sendTestNotification());
        }
    }

    /**
     * Send test notification
     */
    async sendTestNotification() {
        try {
            await nativePushNotifications.scheduleLocalNotification({
                title: 'Test Notification 🎉',
                body: 'This is a test notification from Ultimate Sports AI!',
                delay: 1000,
                data: { type: 'test' }
            });

            this.showToast('Test notification sent!', 'success');
        } catch (error) {
            console.error('[Notification Preferences] Test notification error:', error);
            this.showToast('Failed to send test notification', 'error');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `notification-toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Create singleton instance
const notificationPreferencesUI = new NotificationPreferencesUI();

// Export
export default notificationPreferencesUI;
window.notificationPreferencesUI = notificationPreferencesUI;
