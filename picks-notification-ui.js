// ============================================
// PICKS NOTIFICATION UI COMPONENT
// Real-time in-app notifications for coach picks
// ============================================

console.log('📢 Picks Notification UI Module loading...');

class PicksNotificationUI {
    constructor() {
        this.notifications = [];
        this.notificationContainer = null;
        this.isInitialized = false;
        this.wsClient = null;
        this.unreadCount = 0;
        this.pollInterval = null;
        this.initUI();
        this.startPolling();
    }

    /**
     * Initialize notification UI container
     */
    initUI() {
        // Create container if it doesn't exist
        if (!document.getElementById('picks-notification-container')) {
            const container = document.createElement('div');
            container.id = 'picks-notification-container';
            container.className = 'picks-notification-container';
            container.innerHTML = `
                <style>
                    .picks-notification-container {
                        position: fixed;
                        top: 80px;
                        right: 16px;
                        z-index: 10000;
                        max-width: 380px;
                        pointer-events: none;
                    }

                    .notification-item {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 12px;
                        padding: 16px;
                        margin-bottom: 12px;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                        animation: slideIn 0.3s ease-out;
                        pointer-events: auto;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        border-left: 4px solid #ffd700;
                    }

                    .notification-item:hover {
                        transform: translateX(-4px);
                        box-shadow: 0 12px 32px rgba(0,0,0,0.2);
                    }

                    .notification-item.success {
                        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                        border-left-color: #38ef7d;
                    }

                    .notification-item.error {
                        background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
                        border-left-color: #ff6b6b;
                    }

                    .notification-item.info {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-left-color: #00d4ff;
                    }

                    .notification-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                    }

                    .notification-title {
                        color: #fff;
                        font-weight: 600;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .notification-icon {
                        font-size: 18px;
                    }

                    .notification-close {
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: #fff;
                        width: 24px;
                        height: 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    }

                    .notification-close:hover {
                        background: rgba(255,255,255,0.3);
                    }

                    .notification-body {
                        color: rgba(255,255,255,0.9);
                        font-size: 13px;
                        line-height: 1.5;
                        margin-bottom: 8px;
                    }

                    .notification-meta {
                        display: flex;
                        gap: 12px;
                        font-size: 12px;
                        color: rgba(255,255,255,0.7);
                        border-top: 1px solid rgba(255,255,255,0.1);
                        padding-top: 8px;
                    }

                    .notification-stat {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .notification-confidence {
                        background: rgba(255,255,255,0.15);
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-weight: 600;
                    }

                    @keyframes slideIn {
                        from {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }

                    @keyframes slideOut {
                        from {
                            transform: translateX(0);
                            opacity: 1;
                        }
                        to {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                    }

                    .notification-item.removing {
                        animation: slideOut 0.3s ease-in forwards;
                    }

                    /* Badge for unread notifications */
                    .notification-badge {
                        position: fixed;
                        bottom: 100px;
                        right: 16px;
                        background: linear-gradient(135deg, #ff6b6b, #ff4757);
                        color: white;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 12px;
                        box-shadow: 0 4px 12px rgba(255,71,87,0.3);
                        z-index: 9999;
                        animation: pulse 2s infinite;
                    }

                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }

                    /* Mobile responsive */
                    @media (max-width: 480px) {
                        .picks-notification-container {
                            right: 8px;
                            left: 8px;
                            max-width: none;
                        }

                        .notification-item {
                            margin-bottom: 8px;
                            padding: 12px;
                        }
                    }
                </style>
            `;
            document.body.appendChild(container);
            this.notificationContainer = container;
        } else {
            this.notificationContainer = document.getElementById('picks-notification-container');
        }

        this.isInitialized = true;
        console.log('✅ Notification UI initialized');
    }

    /**
     * Show a new notification
     */
    showNotification(data) {
        if (!this.notificationContainer) return;

        const notification = {
            id: Date.now(),
            coach: data.coach,
            pick: data.pick,
            matchup: data.matchup,
            confidence: data.confidence,
            odds: data.odds,
            reasoning: data.reasoning,
            type: data.type || 'info',
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(notification);
        this.unreadCount++;

        const element = this.createNotificationElement(notification);
        this.notificationContainer.insertBefore(element, this.notificationContainer.firstChild);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 8000);

        // Update badge
        this.updateBadge();

        // Play sound
        this.playNotificationSound(data.type);

        console.log(`📬 New notification: ${data.coach} - ${data.pick}`);
    }

    /**
     * Create notification DOM element
     */
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification-item ${notification.type}`;
        element.dataset.id = notification.id;

        const confidenceColor = notification.confidence >= 70 ? '#38ef7d' : 
                                notification.confidence >= 50 ? '#ffd700' : '#ff6b6b';

        const icons = {
            'pick': '🎲',
            'win': '✅',
            'loss': '❌',
            'streak': '🔥',
            'market': '💹',
            'injury': '⚠️',
            'info': 'ℹ️'
        };

        const icon = icons[notification.type] || '📢';

        element.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">
                    <span class="notification-icon">${icon}</span>
                    <span>${notification.coach}</span>
                </div>
                <button class="notification-close" data-id="${notification.id}">✕</button>
            </div>
            <div class="notification-body">
                <strong>${notification.pick}</strong><br/>
                <small>${notification.matchup}</small>
            </div>
            <div class="notification-meta">
                <div class="notification-stat">
                    <span>📊</span>
                    <span class="notification-confidence" style="background-color: ${confidenceColor}; color: white; opacity: 0.9;">
                        ${notification.confidence}%
                    </span>
                </div>
                <div class="notification-stat">
                    <span>💰</span>
                    <span>${notification.odds}</span>
                </div>
                <div class="notification-stat">
                    <span>🕐</span>
                    <span>${this.formatTime(notification.timestamp)}</span>
                </div>
            </div>
            ${notification.reasoning ? `
                <div style="margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.8); font-style: italic;">
                    "${notification.reasoning}"
                </div>
            ` : ''}
        `;

        // Close button handler
        element.querySelector('.notification-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNotification(notification.id);
        });

        // Click handler
        element.addEventListener('click', () => {
            this.handleNotificationClick(notification);
        });

        return element;
    }

    /**
     * Remove notification
     */
    removeNotification(id) {
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.add('removing');
            setTimeout(() => {
                element.remove();
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateBadge();
            }, 300);
        }
    }

    /**
     * Handle notification click
     */
    handleNotificationClick(notification) {
        console.log('Notification clicked:', notification);
        
        // Emit custom event
        window.dispatchEvent(new CustomEvent('pick-notification-clicked', {
            detail: notification
        }));

        // Navigate to AI coaches if available
        if (window.navigation) {
            window.navigation.navigateTo('ai-coaches');
        }
    }

    /**
     * Update badge count
     */
    updateBadge() {
        let badge = document.querySelector('.notification-badge');
        
        if (this.unreadCount > 0) {
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'notification-badge';
                document.body.appendChild(badge);
            }
            badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
            badge.style.display = 'flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    /**
     * Format timestamp
     */
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) return 'now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Play notification sound
     */
    playNotificationSound(type = 'info') {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const sounds = {
                'pick': { freq: 800, duration: 0.2 },
                'win': { freq: 1000, duration: 0.3 },
                'loss': { freq: 400, duration: 0.4 },
                'streak': { freq: 900, duration: 0.25 },
                'market': { freq: 700, duration: 0.15 },
                'injury': { freq: 300, duration: 0.5 },
                'info': { freq: 600, duration: 0.1 }
            };

            const sound = sounds[type] || sounds['info'];

            oscillator.frequency.value = sound.freq;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + sound.duration);
        } catch (error) {
            console.warn('Sound playback error:', error);
        }
    }

    /**
     * Start polling for new picks (fallback for WebSocket)
     */
    startPolling() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        
        // Poll every 30 seconds for new picks
        this.pollInterval = setInterval(async () => {
            await this.checkForNewPicks();
        }, 30000);

        console.log('✅ Notification polling started');
    }

    /**
     * Check for new picks via API
     */
    async checkForNewPicks() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const apiUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
            
            const response = await fetch(`${apiUrl}/api/ai-coaches/picks`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            if (!data.coaches) return;

            // Check for new picks we haven't seen
            data.coaches.forEach(coach => {
                if (coach.recentPicks && coach.recentPicks.length > 0) {
                    const latestPick = coach.recentPicks[0];
                    
                    // Only show if pick is very recent (less than 2 minutes old)
                    const pickTime = new Date(latestPick.gameTime);
                    const now = new Date();
                    const ageMs = now - pickTime;
                    
                    if (ageMs < 120000) { // 2 minutes
                        this.showNotification({
                            coach: coach.name,
                            pick: latestPick.pick,
                            matchup: latestPick.game,
                            confidence: latestPick.confidence,
                            odds: latestPick.odds,
                            reasoning: latestPick.reasoning,
                            type: 'pick'
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Error checking for new picks:', error);
        }
    }

    /**
     * Mark all as read
     */
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
        this.updateBadge();
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notificationContainer.innerHTML = '';
        this.notifications = [];
        this.unreadCount = 0;
        this.updateBadge();
    }

    /**
     * Get notification history
     */
    getNotifications() {
        return this.notifications;
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
}

// Initialize globally
const picksNotificationUI = new PicksNotificationUI();
window.picksNotificationUI = picksNotificationUI;

console.log('✅ Picks Notification UI ready');
