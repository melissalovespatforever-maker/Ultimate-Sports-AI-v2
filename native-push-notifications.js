/**
 * Native Push Notifications Service
 * iOS & Android push notifications via Capacitor
 * Handles registration, permissions, and notification events
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

class NativePushNotificationService {
    constructor() {
        this.isNative = Capacitor.isNativePlatform();
        this.platform = Capacitor.getPlatform(); // 'ios' or 'android' or 'web'
        this.deviceToken = null;
        this.registrationId = null;
        this.listeners = {
            tokenReceived: [],
            notificationReceived: [],
            notificationOpened: []
        };
        
        console.log(`[Push Notifications] Platform: ${this.platform}, Native: ${this.isNative}`);
    }

    /**
     * Initialize push notifications
     * Must be called after user grants permission
     */
    async initialize() {
        if (!this.isNative) {
            console.log('[Push Notifications] Web platform - using web push instead');
            return this.initializeWebPush();
        }

        try {
            console.log('[Push Notifications] Initializing native push notifications...');

            // Request permissions
            const permissionResult = await this.requestPermissions();
            if (!permissionResult) {
                console.log('[Push Notifications] Permission denied');
                return false;
            }

            // Register for push notifications
            await PushNotifications.register();

            // Setup listeners
            this.setupListeners();

            console.log('[Push Notifications] Successfully initialized');
            return true;
        } catch (error) {
            console.error('[Push Notifications] Initialization error:', error);
            return false;
        }
    }

    /**
     * Request notification permissions from user
     */
    async requestPermissions() {
        try {
            const result = await PushNotifications.requestPermissions();
            
            if (result.receive === 'granted') {
                console.log('[Push Notifications] Permission granted');
                return true;
            } else {
                console.log('[Push Notifications] Permission denied or not determined');
                return false;
            }
        } catch (error) {
            console.error('[Push Notifications] Permission request error:', error);
            return false;
        }
    }

    /**
     * Check current permission status
     */
    async checkPermissions() {
        try {
            const result = await PushNotifications.checkPermissions();
            return result.receive === 'granted';
        } catch (error) {
            console.error('[Push Notifications] Check permissions error:', error);
            return false;
        }
    }

    /**
     * Setup event listeners for push notifications
     */
    setupListeners() {
        // Token registration successful
        PushNotifications.addListener('registration', (token) => {
            console.log('[Push Notifications] Registration success:', token.value);
            this.deviceToken = token.value;
            
            // Send token to backend
            this.sendTokenToBackend(token.value);
            
            // Notify listeners
            this.listeners.tokenReceived.forEach(callback => callback(token.value));
        });

        // Registration failed
        PushNotifications.addListener('registrationError', (error) => {
            console.error('[Push Notifications] Registration error:', error);
        });

        // Notification received while app is in foreground
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[Push Notifications] Notification received:', notification);
            
            // Show local notification if app is in foreground
            this.showLocalNotification(notification);
            
            // Notify listeners
            this.listeners.notificationReceived.forEach(callback => callback(notification));
        });

        // Notification tapped/opened
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('[Push Notifications] Notification action performed:', notification);
            
            // Handle notification tap
            this.handleNotificationTap(notification);
            
            // Notify listeners
            this.listeners.notificationOpened.forEach(callback => callback(notification));
        });

        // App state changes (background/foreground)
        App.addListener('appStateChange', ({ isActive }) => {
            console.log('[Push Notifications] App state changed:', isActive ? 'active' : 'background');
            
            if (isActive) {
                // Clear badge count when app is opened
                this.clearBadgeCount();
            }
        });
    }

    /**
     * Send device token to backend for push notification targeting
     */
    async sendTokenToBackend(token) {
        try {
            const API_URL = 'https://ultimate-sports-ai-backend.up.railway.app';
            const authToken = localStorage.getItem('token');
            
            if (!authToken) {
                console.log('[Push Notifications] No auth token - skipping backend registration');
                return;
            }

            const response = await fetch(`${API_URL}/api/notifications/register-device`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    deviceToken: token,
                    platform: this.platform,
                    deviceInfo: {
                        model: Capacitor.getPlatform(),
                        osVersion: await this.getOSVersion()
                    }
                })
            });

            if (response.ok) {
                console.log('[Push Notifications] Token registered with backend');
            } else {
                console.error('[Push Notifications] Failed to register token with backend');
            }
        } catch (error) {
            console.error('[Push Notifications] Error sending token to backend:', error);
        }
    }

    /**
     * Show local notification (for foreground notifications)
     */
    async showLocalNotification(notification) {
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    title: notification.title || 'Ultimate Sports AI',
                    body: notification.body || '',
                    id: Date.now(),
                    schedule: { at: new Date(Date.now() + 100) },
                    sound: 'beep.wav',
                    attachments: notification.data?.image ? [{ id: 'image', url: notification.data.image }] : [],
                    actionTypeId: '',
                    extra: notification.data || {}
                }]
            });
        } catch (error) {
            console.error('[Push Notifications] Error showing local notification:', error);
        }
    }

    /**
     * Handle notification tap (deep linking)
     */
    handleNotificationTap(notificationAction) {
        const notification = notificationAction.notification;
        const data = notification.data;

        console.log('[Push Notifications] Handling notification tap:', data);

        // Route based on notification type
        if (data.type) {
            switch (data.type) {
                case 'new_pick':
                    window.location.href = '/sports-lounge.html?tab=ai-coaches';
                    break;
                case 'game_result':
                    window.location.href = '/my-bets.html';
                    break;
                case 'tournament_update':
                    window.location.href = '/tournaments.html';
                    break;
                case 'achievement_unlocked':
                    window.location.href = '/profile.html?tab=achievements';
                    break;
                case 'daily_deal':
                    window.location.href = '/sports-lounge.html?tab=shop';
                    break;
                case 'friend_request':
                    window.location.href = '/profile.html?tab=friends';
                    break;
                case 'challenge_invite':
                    window.location.href = '/tournaments.html?tab=challenges';
                    break;
                default:
                    window.location.href = '/sports-lounge.html';
            }
        }
    }

    /**
     * Clear badge count
     */
    async clearBadgeCount() {
        if (this.platform === 'ios') {
            try {
                await PushNotifications.removeAllDeliveredNotifications();
            } catch (error) {
                console.error('[Push Notifications] Error clearing badge:', error);
            }
        }
    }

    /**
     * Get all delivered notifications
     */
    async getDeliveredNotifications() {
        try {
            const result = await PushNotifications.getDeliveredNotifications();
            return result.notifications;
        } catch (error) {
            console.error('[Push Notifications] Error getting delivered notifications:', error);
            return [];
        }
    }

    /**
     * Remove specific notification
     */
    async removeNotification(id) {
        try {
            await PushNotifications.removeDeliveredNotifications({
                notifications: [{ id }]
            });
        } catch (error) {
            console.error('[Push Notifications] Error removing notification:', error);
        }
    }

    /**
     * Remove all delivered notifications
     */
    async removeAllNotifications() {
        try {
            await PushNotifications.removeAllDeliveredNotifications();
        } catch (error) {
            console.error('[Push Notifications] Error removing all notifications:', error);
        }
    }

    /**
     * Add listener for specific events
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Remove listener
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Get device token
     */
    getDeviceToken() {
        return this.deviceToken;
    }

    /**
     * Check if running on native platform
     */
    isNativePlatform() {
        return this.isNative;
    }

    /**
     * Get platform name
     */
    getPlatform() {
        return this.platform;
    }

    /**
     * Get OS version
     */
    async getOSVersion() {
        try {
            const info = await App.getInfo();
            return info.version;
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Fallback to web push notifications
     */
    async initializeWebPush() {
        console.log('[Push Notifications] Initializing web push...');
        
        if (!('Notification' in window)) {
            console.log('[Push Notifications] Browser does not support notifications');
            return false;
        }

        if (!('serviceWorker' in navigator)) {
            console.log('[Push Notifications] Browser does not support service workers');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('[Push Notifications] Web push permission granted');
                
                // Register service worker for web push
                const registration = await navigator.serviceWorker.ready;
                
                // Subscribe to push notifications
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.getVAPIDPublicKey()
                });

                console.log('[Push Notifications] Web push subscription:', subscription);
                
                // Send subscription to backend
                await this.sendWebPushSubscription(subscription);
                
                return true;
            } else {
                console.log('[Push Notifications] Web push permission denied');
                return false;
            }
        } catch (error) {
            console.error('[Push Notifications] Web push initialization error:', error);
            return false;
        }
    }

    /**
     * Get VAPID public key for web push
     */
    getVAPIDPublicKey() {
        // This should match your backend VAPID public key
        return 'YOUR_VAPID_PUBLIC_KEY_HERE';
    }

    /**
     * Send web push subscription to backend
     */
    async sendWebPushSubscription(subscription) {
        try {
            const API_URL = 'https://ultimate-sports-ai-backend.up.railway.app';
            const authToken = localStorage.getItem('token');
            
            if (!authToken) {
                console.log('[Push Notifications] No auth token - skipping subscription registration');
                return;
            }

            const response = await fetch(`${API_URL}/api/notifications/register-web-push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    platform: 'web'
                })
            });

            if (response.ok) {
                console.log('[Push Notifications] Web push subscription registered');
            } else {
                console.error('[Push Notifications] Failed to register web push subscription');
            }
        } catch (error) {
            console.error('[Push Notifications] Error sending subscription to backend:', error);
        }
    }

    /**
     * Schedule local notification (for testing or offline scenarios)
     */
    async scheduleLocalNotification({ title, body, delay = 0, data = {} }) {
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    title,
                    body,
                    id: Date.now(),
                    schedule: { at: new Date(Date.now() + delay) },
                    sound: 'beep.wav',
                    extra: data
                }]
            });
            
            console.log('[Push Notifications] Local notification scheduled');
        } catch (error) {
            console.error('[Push Notifications] Error scheduling local notification:', error);
        }
    }

    /**
     * Request local notification permissions
     */
    async requestLocalNotificationPermissions() {
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } catch (error) {
            console.error('[Push Notifications] Local notification permission error:', error);
            return false;
        }
    }
}

// Create singleton instance
const nativePushNotifications = new NativePushNotificationService();

// Auto-initialize on app load (if user is logged in)
window.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('token');
    
    if (authToken) {
        console.log('[Push Notifications] User logged in - initializing notifications');
        await nativePushNotifications.initialize();
    }
});

// Export for use in other modules
export default nativePushNotifications;
window.nativePushNotifications = nativePushNotifications;
