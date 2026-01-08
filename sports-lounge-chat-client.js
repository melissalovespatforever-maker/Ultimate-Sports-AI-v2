/**
 * SPORTS LOUNGE CHAT CLIENT
 * Real-time WebSocket chat implementation with moderation
 */

import { logger } from './logger.js';
import { chatSummaryService } from './chat-summary-service.js';

class SportsLoungeChat {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.currentChannel = 'general';
        this.messages = [];
        this.onlineUsers = [];
        this.typingTimeout = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.moderation = null; // Will be set to window.chatModeration
        
        // Tracking for summary
        this.missedMessages = [];
        this.isWindowFocused = true;
        this.setupFocusTracking();
    }

    setupFocusTracking() {
        window.addEventListener('focus', () => {
            this.isWindowFocused = true;
            this.checkMissedMessages();
        });
        window.addEventListener('blur', () => {
            this.isWindowFocused = false;
        });

        // Also track tab switching within the lounge
        document.querySelectorAll('.lounge-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.isChatTabActive = (tabName === 'chat-room');
                if (this.isChatTabActive) {
                    this.checkMissedMessages();
                }
            });
        });
        
        // Initial state
        this.isChatTabActive = document.getElementById('chat-room')?.classList.contains('active');
    }

    checkMissedMessages() {
        if (this.missedMessages.length >= 5) {
            this.showCatchUpButton();
        }
    }

    showCatchUpButton() {
        const chatContainer = document.querySelector('.chat-container-full');
        if (!chatContainer || document.getElementById('chat-catch-up-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'chat-catch-up-btn';
        btn.className = 'catch-up-btn';
        btn.innerHTML = `<i class="fas fa-bolt"></i> Catch Up (${this.missedMessages.length})`;
        btn.onclick = () => this.generateSummary();
        
        const actions = chatContainer.querySelector('.chat-actions');
        if (actions) actions.appendChild(btn);
    }

    generateSummary() {
        const summary = chatSummaryService.summarize(this.missedMessages);
        if (summary) {
            const container = document.getElementById('chat-messages');
            chatSummaryService.renderSummaryUI(summary, container);
        }
        
        this.missedMessages = [];
        document.getElementById('chat-catch-up-btn')?.remove();
    }

    // ============================================
    // CONNECTION
    // ============================================

    connect() {
        const WS_URL = window.CONFIG?.API_BASE_URL || 
                      (window.location.hostname === 'localhost' 
                        ? 'http://localhost:3000'
                        : 'https://ultimate-sports-ai-backend-production.up.railway.app');

        console.log(`💬 Attempting to connect to chat server at ${WS_URL}...`);

        // Load Socket.IO client if not already loaded
        if (typeof io === 'undefined') {
            console.warn('⚠️ Socket.IO client not loaded - using fallback mode');
            this.useFallbackMode();
            return;
        }

        try {
            this.socket = io(`${WS_URL}/chat`, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: this.maxReconnectAttempts,
                timeout: 5000 // 5 second connection timeout
            });

            this.setupEventListeners();
            this.authenticate();
            
            // Fallback if connection fails
            setTimeout(() => {
                if (!this.connected) {
                    console.warn('⚠️ WebSocket connection timeout - using fallback mode');
                    this.useFallbackMode();
                }
            }, 10000);
        } catch (error) {
            console.error('❌ Connection error:', error);
            this.useFallbackMode();
        }
    }
    
    useFallbackMode() {
        console.log('📱 Using local fallback chat mode');
        this.connected = false;
        this.updateConnectionStatus(false);
        
        // Show fallback status
        const statusEl = document.querySelector('.chat-connection-status');
        if (statusEl) {
            statusEl.className = 'chat-connection-status fallback';
            statusEl.textContent = 'Local Mode';
        }
        
        // The sports-lounge-fixed.js will handle local chat
    }

    authenticate() {
        // Get user data from global state
        const globalState = window.globalState || (window.parent && window.parent.globalState);
        
        const userData = {
            userId: globalState?.user?.id || Math.floor(Math.random() * 1000000),
            username: globalState?.user?.username || 'Guest User',
            avatar: globalState?.user?.avatar || '🎮'
        };

        console.log('🔐 Authenticating as:', userData.username);
        this.socket.emit('auth', userData);
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Connected to chat server');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from chat server');
            this.connected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.showError('Unable to connect to chat. Please refresh.');
            }
        });

        // Chat events
        this.socket.on('message:new', (message) => {
            this.handleNewMessage(message);
        });

        this.socket.on('message:reaction', (data) => {
            this.handleReaction(data);
        });

        this.socket.on('message:deleted', (data) => {
            this.handleDeletedMessage(data);
        });

        // User events
        this.socket.on('user:joined', (data) => {
            this.handleUserJoined(data);
        });

        this.socket.on('user:left', (data) => {
            this.handleUserLeft(data);
        });

        this.socket.on('online:users', (users) => {
            this.onlineUsers = users;
            this.updateOnlineCount(users.length);
        });

        this.socket.on('online:count', (data) => {
            this.updateOnlineCount(data.count);
        });

        // Typing indicators
        this.socket.on('typing:indicator', (data) => {
            this.handleTypingIndicator(data);
        });

        // Channel events
        this.socket.on('channel:history', (data) => {
            this.loadChannelHistory(data);
        });

        // Errors
        this.socket.on('error', (error) => {
            console.error('Chat error:', error);
            this.showError(error.message || 'An error occurred');
        });
    }

    // ============================================
    // MESSAGE HANDLING
    // ============================================

    sendMessage(message) {
        if (!this.connected) {
            this.showError('Not connected to chat');
            return;
        }

        if (!message || message.trim().length === 0) {
            return;
        }

        // Initialize moderation if not already done
        if (!this.moderation && window.chatModeration) {
            this.moderation = window.chatModeration;
        }

        // Apply moderation filters
        if (this.moderation) {
            const userId = localStorage.getItem('unified_user_id') || 'guest';
            const username = localStorage.getItem('unified_username') || 'Guest';
            
            const validation = this.moderation.validateMessage(message.trim(), userId, username);
            
            // Message blocked
            if (!validation.allowed) {
                this.showError(validation.reason || 'Message blocked by moderation');
                logger.warn('Chat', `Message blocked: ${validation.reason}`);
                return;
            }

            // Show warnings to user
            if (validation.warnings && validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    this.showWarning(warning);
                });
            }

            // Use filtered message
            message = validation.message;
        }

        this.socket.emit('message:send', {
            message: message.trim(),
            channel: this.currentChannel
        });

        // Clear input
        const input = document.getElementById('chat-input');
        if (input) input.value = '';

        // Stop typing indicator
        this.stopTyping();
    }

    handleNewMessage(message) {
        this.messages.push(message);
        
        // Record for trending topics
        if (!message.isSystem && chatSummaryService) {
            chatSummaryService.recordMessage(message.message);
        }

        // Track missed messages for summary if user is not looking at chat
        const isUserLookingAtChat = this.isWindowFocused && this.isChatTabActive;
        if (!isUserLookingAtChat && !message.isSystem) {
            this.missedMessages.push(message);
        }

        this.renderMessage(message);
        this.scrollToBottom();
        
        // Play sound notification (optional)
        this.playMessageSound();
    }

    renderMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${message.isSystem ? 'system-message' : ''}`;
        messageEl.dataset.messageId = message.id;

        const time = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageEl.innerHTML = `
            <div class="message-avatar">${message.avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${this.escapeHtml(message.username)}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${message.message}</div>
                ${!message.isSystem ? `
                    <div class="message-actions">
                        <button class="msg-action" onclick="sportsLoungeChat.reactToMessage('${message.id}', '👍')" title="Like">
                            👍
                        </button>
                        <button class="msg-action" onclick="sportsLoungeChat.reactToMessage('${message.id}', '🔥')" title="Fire">
                            🔥
                        </button>
                        <button class="msg-action gift-btn" onclick="sportsLoungeChat.openGiftMenu('${message.id}', '${this.escapeHtml(message.username)}')" title="Send Gift">
                            🎁 Gift
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        messagesContainer.appendChild(messageEl);

        // Limit message history (keep last 100)
        const allMessages = messagesContainer.querySelectorAll('.chat-message');
        if (allMessages.length > 100) {
            allMessages[0].remove();
        }
    }

    reactToMessage(messageId, emoji) {
        if (!this.connected) return;
        
        this.socket.emit('message:react', {
            messageId,
            emoji
        });
    }

    openGiftMenu(messageId, username) {
        const giftOverlay = document.createElement('div');
        giftOverlay.className = 'gift-menu-overlay';
        giftOverlay.innerHTML = `
            <div class="gift-menu-content">
                <div class="gift-header">
                    <h3>Send Gift to ${username}</h3>
                    <button onclick="this.closest('.gift-menu-overlay').remove()">×</button>
                </div>
                <div class="gift-items">
                    <div class="gift-item" onclick="sportsLoungeChat.sendGift('${messageId}', 'beer', 50)">
                        <span class="gift-emoji">🍺</span>
                        <span class="gift-name">Cold Beer</span>
                        <span class="gift-cost">50 🪙</span>
                    </div>
                    <div class="gift-item" onclick="sportsLoungeChat.sendGift('${messageId}', 'foam_finger', 100)">
                        <span class="gift-emoji">☝️</span>
                        <span class="gift-name">Foam Finger</span>
                        <span class="gift-cost">100 🪙</span>
                    </div>
                    <div class="gift-item" onclick="sportsLoungeChat.sendGift('${messageId}', 'pizza', 200)">
                        <span class="gift-emoji">🍕</span>
                        <span class="gift-name">Party Pizza</span>
                        <span class="gift-cost">200 🪙</span>
                    </div>
                    <div class="gift-item" onclick="sportsLoungeChat.sendGift('${messageId}', 'trophy', 500)">
                        <span class="gift-emoji">🏆</span>
                        <span class="gift-name">Mini Trophy</span>
                        <span class="gift-cost">500 🪙</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(giftOverlay);
    }

    sendGift(messageId, giftType, cost) {
        const globalState = window.globalState || (window.parent && window.parent.globalState);
        const user = globalState?.getUser();
        
        if (!user || user.ultimate_coins < cost) {
            this.showError('Not enough coins for this gift!');
            return;
        }

        // Deduct coins
        user.ultimate_coins -= cost;
        globalState.setUser(user);
        
        // Emit gift event
        this.socket.emit('message:gift', {
            messageId,
            giftType,
            cost,
            sender: user.username
        });

        // Close menu
        document.querySelector('.gift-menu-overlay')?.remove();
        this.showError(`Gift sent! (${cost} coins deducted)`, 'success');
        
        // Trigger a shoutbox-like message locally or via socket
        this.showSystemMessage(`✨ ${user.username} sent a gift to the chat!`);
    }

    handleReaction(data) {
        // Add visual reaction to message
        const messageEl = document.querySelector(`[data-message-id="${data.messageId}"]`);
        if (messageEl) {
            const reactionsContainer = messageEl.querySelector('.message-reactions') || 
                this.createReactionsContainer(messageEl);
            
            const reactionEl = document.createElement('span');
            reactionEl.className = 'reaction';
            reactionEl.textContent = data.emoji;
            reactionEl.title = `${data.username} reacted`;
            reactionsContainer.appendChild(reactionEl);
        }
    }

    createReactionsContainer(messageEl) {
        const container = document.createElement('div');
        container.className = 'message-reactions';
        messageEl.querySelector('.message-content').appendChild(container);
        return container;
    }

    handleDeletedMessage(data) {
        const messageEl = document.querySelector(`[data-message-id="${data.messageId}"]`);
        if (messageEl) {
            messageEl.classList.add('deleted');
            const textEl = messageEl.querySelector('.message-text');
            if (textEl) {
                textEl.innerHTML = '<em>This message was deleted</em>';
            }
        }
    }

    // ============================================
    // CHANNEL MANAGEMENT
    // ============================================

    switchChannel(channelName) {
        if (this.currentChannel === channelName) return;
        
        console.log(`📢 Switching to #${channelName}`);
        this.currentChannel = channelName;
        this.socket.emit('channel:join', channelName);
        
        // Clear current messages
        this.clearMessages();
        
        // Update UI
        this.updateActiveChannel(channelName);
    }

    loadChannelHistory(data) {
        console.log(`📜 Loading history for #${data.channel}:`, data.messages.length, 'messages');
        this.clearMessages();
        data.messages.forEach(msg => this.renderMessage(msg));
        this.scrollToBottom();
    }

    clearMessages() {
        const container = document.getElementById('chat-messages');
        if (container) container.innerHTML = '';
        this.messages = [];
    }

    updateActiveChannel(channelName) {
        document.querySelectorAll('.chat-category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.channel === channelName) {
                btn.classList.add('active');
            }
        });
    }

    // ============================================
    // TYPING INDICATORS
    // ============================================

    startTyping() {
        if (!this.connected) return;
        
        this.socket.emit('typing:start');
        
        // Auto-stop after 3 seconds
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => this.stopTyping(), 3000);
    }

    stopTyping() {
        if (!this.connected) return;
        this.socket.emit('typing:stop');
        clearTimeout(this.typingTimeout);
    }

    handleTypingIndicator(data) {
        const indicator = document.getElementById('typing-indicator');
        if (!indicator) return;

        if (data.isTyping) {
            indicator.textContent = `${data.username} is typing...`;
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    }

    // ============================================
    // USER PRESENCE
    // ============================================

    handleUserJoined(data) {
        if (data.username && !data.channel) {
            this.showSystemMessage(`${data.username} joined the lounge`);
        }
    }

    handleUserLeft(data) {
        if (data.username && !data.channel) {
            this.showSystemMessage(`${data.username} left the lounge`);
        }
    }

    updateOnlineCount(count) {
        const countElements = document.querySelectorAll('#chat-online-count, #online-count');
        countElements.forEach(el => {
            el.textContent = count.toLocaleString();
        });
    }

    // ============================================
    // UI HELPERS
    // ============================================

    updateConnectionStatus(connected) {
        const statusEl = document.querySelector('.chat-connection-status');
        if (statusEl) {
            statusEl.className = `chat-connection-status ${connected ? 'connected' : 'disconnected'}`;
            statusEl.textContent = connected ? 'Connected' : 'Disconnected';
        }
    }

    showSystemMessage(text) {
        this.handleNewMessage({
            id: Date.now(),
            userId: 0,
            username: 'System',
            avatar: '🤖',
            message: text,
            timestamp: new Date(),
            isSystem: true
        });
    }

    showError(message, type = 'error') {
        logger.error('Chat', message);
        
        // Don't show error toasts for normal fallback transitions
        if (message.includes('unavailable') || message.includes('Failed to connect')) {
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = 'chat-error-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInUp 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    showWarning(message) {
        const toast = document.createElement('div');
        toast.className = 'chat-warning-toast';
        toast.textContent = `⚠️ ${message}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #f59e0b;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInUp 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    scrollToBottom() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    playMessageSound() {
        // Optional: play a subtle notification sound
        // You can add an audio element or use Web Audio API
    }
}

// ============================================
// INITIALIZATION
// ============================================

let sportsLoungeChat = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
} else {
    initChat();
}

function initChat() {
    sportsLoungeChat = new SportsLoungeChat();
    
    // Connect to WebSocket
    sportsLoungeChat.connect();
    
    // Setup UI event handlers
    setupChatUI();
    
    // Expose to window for inline event handlers
    window.sportsLoungeChat = sportsLoungeChat;
    
    console.log('✅ Sports Lounge Chat initialized');
}

function setupChatUI() {
    // Chat input - send on Enter
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = chatInput.value.trim();
                if (message) {
                    sportsLoungeChat.sendMessage(message);
                }
            }
        });

        // Typing indicators
        chatInput.addEventListener('input', () => {
            sportsLoungeChat.startTyping();
        });
    }

    // Channel buttons
    document.querySelectorAll('.chat-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const channel = btn.dataset.channel;
            if (channel) {
                sportsLoungeChat.switchChannel(channel);
            }
        });
    });

    // Send button (backup for mobile)
    const sendBtn = document.querySelector('.btn-send');
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const message = chatInput?.value.trim();
            if (message) {
                sportsLoungeChat.sendMessage(message);
            }
        });
    }
}

// Export for global access
window.SportsLounge = window.SportsLounge || {};
window.SportsLounge.chat = sportsLoungeChat;
window.SportsLounge.sendMessage = () => {
    const input = document.getElementById('chat-input');
    if (input && sportsLoungeChat) {
        sportsLoungeChat.sendMessage(input.value);
    }
};

console.log('✅ Sports Lounge Chat Client loaded');
