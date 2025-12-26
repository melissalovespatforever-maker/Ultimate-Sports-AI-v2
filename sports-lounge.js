/**
 * SPORTS LOUNGE - Interactive JavaScript
 * Real-time updates, chat, and social features
 */

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏟️ Sports Lounge initialized');
    
    initializeTabs();
    initializeLiveStats();
    initializeActivityFeed();
    initializeChat();
    loadUserProfile();
    startRealTimeUpdates();
    initializeGameButtons();
    
    // Listen for balance updates from parent window or global
    window.addEventListener('balanceUpdated', (event) => {
        console.log('💰 Balance updated in Sports Lounge:', event.detail.balance);
        const coinElements = document.querySelectorAll('.profile-coins, .balance-amount');
        coinElements.forEach(el => {
            el.textContent = event.detail.balance.toLocaleString();
        });
    });
    
    // Listen for messages from parent window
    window.addEventListener('message', (event) => {
        if (event.data.type === 'balanceUpdate') {
            const coinElements = document.querySelectorAll('.profile-coins, .balance-amount');
            coinElements.forEach(el => {
                el.textContent = event.data.balance.toLocaleString();
            });
        }
    });
});

// ============================================
// TAB SWITCHING
// ============================================

function initializeTabs() {
    const tabs = document.querySelectorAll('.lounge-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabName = tab.getAttribute('data-tab');
            const content = document.getElementById(tabName);
            if (content) {
                content.classList.add('active');
            }
            
            // If shop tab is opened, update balance display
            if (tabName === 'shop') {
                setTimeout(() => {
                    if (window.ShopSystem) {
                        window.ShopSystem.updateBalanceDisplay();
                    }
                    // Also sync with parent if in iframe
                    if (window.parent && window.parent.currencyManager) {
                        const balance = window.parent.currencyManager.getBalance();
                        const coinElements = document.querySelectorAll('.profile-coins, .balance-amount');
                        coinElements.forEach(el => {
                            el.textContent = balance.toLocaleString();
                        });
                    }
                }, 100);
            }
            
            console.log(`Switched to ${tabName} tab`);
        });
    });
}

// ============================================
// LIVE STATS
// ============================================

function initializeLiveStats() {
    // Simulate real-time stat updates
    setInterval(() => {
        updateOnlineCount();
        updateActiveBattles();
        updateHotStreaks();
    }, 5000);
}

function updateOnlineCount() {
    const countEl = document.getElementById('online-count');
    if (!countEl) return;
    
    const current = parseInt(countEl.textContent.replace(',', ''));
    const change = Math.floor(Math.random() * 20) - 10;
    const newCount = Math.max(1000, current + change);
    
    animateNumber(countEl, newCount);
}

function updateActiveBattles() {
    const countEl = document.getElementById('active-battles');
    if (!countEl) return;
    
    const current = parseInt(countEl.textContent);
    const change = Math.floor(Math.random() * 6) - 3;
    const newCount = Math.max(10, current + change);
    
    animateNumber(countEl, newCount, false);
}

function updateHotStreaks() {
    const countEl = document.getElementById('hot-streak');
    if (!countEl) return;
    
    const current = parseInt(countEl.textContent);
    const change = Math.floor(Math.random() * 4) - 2;
    const newCount = Math.max(5, current + change);
    
    animateNumber(countEl, newCount, false);
}

function animateNumber(element, targetValue, useCommas = true) {
    const currentValue = parseInt(element.textContent.replace(',', ''));
    const duration = 500;
    const steps = 20;
    const increment = (targetValue - currentValue) / steps;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        const newValue = Math.round(currentValue + (increment * step));
        element.textContent = useCommas ? newValue.toLocaleString() : newValue;
        
        if (step >= steps) {
            clearInterval(timer);
            element.textContent = useCommas ? targetValue.toLocaleString() : targetValue;
        }
    }, duration / steps);
}

// ============================================
// ACTIVITY FEED
// ============================================

let activityFeed = [];

function initializeActivityFeed() {
    // Load initial activities
    loadActivities();
    
    // Add new activities periodically
    setInterval(() => {
        addRandomActivity();
    }, 15000);
}

function loadActivities() {
    const feedEl = document.getElementById('activity-feed');
    if (!feedEl) return;
    
    // Activities are already in HTML, just keep them
    const items = feedEl.querySelectorAll('.activity-item');
    activityFeed = Array.from(items);
}

function addRandomActivity() {
    const feedEl = document.getElementById('activity-feed');
    if (!feedEl) return;
    
    const activities = [
        {
            type: 'win',
            icon: '🔥',
            text: '<strong>@LuckyStreak</strong> just won a 4-leg parlay!',
            badge: '+$180'
        },
        {
            type: 'challenge',
            icon: '⚔️',
            text: '<strong>@BetKing</strong> challenged <strong>@AcePicks</strong>',
            badge: null
        },
        {
            type: 'trivia',
            icon: '🧠',
            text: '<strong>@BrainiacBets</strong> answered 15 questions perfectly!',
            badge: null
        },
        {
            type: 'tournament',
            icon: '🏆',
            text: '<strong>@Champion23</strong> advanced to semifinals',
            badge: null
        }
    ];
    
    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    const item = document.createElement('div');
    item.className = `activity-item ${activity.type}`;
    item.style.animation = 'slideInRight 0.5s ease';
    
    item.innerHTML = `
        <div class="activity-avatar">${activity.icon}</div>
        <div class="activity-content">
            ${activity.text}
            <span class="activity-time">Just now</span>
        </div>
        ${activity.badge ? `<div class="activity-badge">${activity.badge}</div>` : ''}
    `;
    
    // Add to top of feed
    feedEl.insertBefore(item, feedEl.firstChild);
    
    // Remove old items if too many
    const items = feedEl.querySelectorAll('.activity-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }
    
    // Update times
    updateActivityTimes();
}

function updateActivityTimes() {
    // This would normally calculate real time differences
    // For now, it's static in HTML
}

// ============================================
// CHAT SYSTEM
// ============================================

let currentChannel = 'general';
let chatHistory = {
    'general': [],
    'nfl': [],
    'nba': [],
    'live': [],
    'strategy': []
};

// Mock data for initial population
const MOCK_MESSAGES = {
    'general': [
        { user: 'SportsFan', avatar: '🏈', message: 'Anyone watching the game tonight?', time: '5m ago' },
        { user: 'BetKing', avatar: '👑', message: 'Just hit a massive parlay! +5000 coins', time: '3m ago' },
        { user: 'Rookie101', avatar: '🎲', message: 'How do I unlock the VIP shop?', time: '1m ago' }
    ],
    'nfl': [
        { user: 'TouchdownTom', avatar: '🏆', message: 'Mahomes is unstoppable right now', time: '10m ago' },
        { user: 'DefenseWins', avatar: '🛡️', message: 'Points allowed per game stats are updated?', time: '5m ago' },
        { user: 'GridironGuru', avatar: '🏈', message: 'Taking the over on the KC game for sure', time: '2m ago' }
    ],
    'nba': [
        { user: 'DunkMaster', avatar: '🏀', message: 'Lakers looking shaky without AD', time: '15m ago' },
        { user: 'ThreePointGod', avatar: '👌', message: 'Curry with 30pts in the first half! Insane.', time: '8m ago' },
        { user: 'CourtSide', avatar: '🎟️', message: 'Who ya got for MVP this year?', time: '4m ago' }
    ],
    'live': [
        { user: 'LiveBet247', avatar: '⏱️', message: 'Odds just shifted huge on the Knicks game', time: '1m ago' },
        { user: 'InPlayPro', avatar: '📈', message: 'Hammering the under right now', time: '30s ago' },
        { user: 'ScoreWatcher', avatar: '👀', message: 'Tie game! Overtime incoming?', time: '10s ago' }
    ],
    'strategy': [
        { user: 'MathWhiz', avatar: '🧮', message: 'Always check the EV before placing that prop bet', time: '20m ago' },
        { user: 'SharpShooter', avatar: '🎯', message: 'Bankroll management is key guys. 1-2% per unit.', time: '12m ago' },
        { user: 'TrendSpotter', avatar: '📉', message: 'Home underdogs covering 60% this month', time: '5m ago' }
    ]
};

function initializeChat() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    // Handle Enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Handle Send Button (if not already handled inline)
    const sendBtn = document.querySelector('.btn-send');
    if(sendBtn) {
        sendBtn.onclick = sendMessage;
    }
    
    // Initialize Categories
    initializeChatCategories();

    // Load initial channel
    loadChannel('general');
    
    // Start simulation of other users
    startChatSimulation();
}

function initializeChatCategories() {
    const buttons = document.querySelectorAll('.chat-category-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            buttons.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--text-secondary)';
            });
            btn.classList.add('active');
            btn.style.background = 'rgba(255,255,255,0.1)';
            btn.style.color = 'white';
            
            // Switch channel
            const channel = btn.getAttribute('data-channel');
            loadChannel(channel);
        });
    });
}

function loadChannel(channel) {
    currentChannel = channel;
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;
    
    // Clear current view
    messagesEl.innerHTML = '';
    
    // Get stored local history for this channel (user's own messages + session history)
    const storedHistory = JSON.parse(localStorage.getItem(`chat_history_${channel}`)) || [];
    
    // If no stored history, load mocks
    // We combine mocks with stored history if desired, or just use mocks if empty
    let displayMessages = [];
    
    if (chatHistory[channel].length === 0 && storedHistory.length === 0) {
        // First load of session and no local storage -> use mocks
        displayMessages = [...(MOCK_MESSAGES[channel] || [])];
        chatHistory[channel] = displayMessages; // Cache in memory
    } else if (chatHistory[channel].length > 0) {
        // We have memory history (switched tabs)
        displayMessages = chatHistory[channel];
    } else {
        // We have local storage but no memory (refresh)
        // Combine mocks (older) with local storage (newer) if local storage is sparse?
        // For simplicity, just load local storage if exists, else mocks
        if (storedHistory.length > 0) {
            displayMessages = storedHistory;
        } else {
            displayMessages = [...(MOCK_MESSAGES[channel] || [])];
        }
        chatHistory[channel] = displayMessages;
    }

    // Render messages
    displayMessages.forEach(msg => {
        addChatMessageToUI(msg.user, msg.avatar, msg.message, msg.time, msg.isMe);
    });
    
    console.log(`💬 Switched to #${channel}`);
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    const messageText = input.value.trim();
    if (!messageText) return;
    
    // Get Real User Info
    const userInfo = getRealUserInfo();
    
    // Create Message Object
    const newMessage = {
        user: userInfo.name,
        avatar: userInfo.avatar,
        message: messageText,
        time: 'Just now',
        isMe: true,
        timestamp: Date.now()
    };
    
    // Add to memory
    if (!chatHistory[currentChannel]) chatHistory[currentChannel] = [];
    chatHistory[currentChannel].push(newMessage);
    
    // Add to Local Storage (Persistence)
    // Limit to last 50
    const stored = JSON.parse(localStorage.getItem(`chat_history_${currentChannel}`)) || [];
    stored.push(newMessage);
    if (stored.length > 50) stored.shift();
    localStorage.setItem(`chat_history_${currentChannel}`, JSON.stringify(stored));
    
    // Add to UI
    addChatMessageToUI(newMessage.user, newMessage.avatar, newMessage.message, newMessage.time, true);
    
    // Clear input
    input.value = '';
    
    // Scroll to bottom
    const messagesEl = document.getElementById('chat-messages');
    if (messagesEl) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Simulate a reply occasionally
    if (Math.random() > 0.7) {
        setTimeout(() => simulateReply(currentChannel), 2000 + Math.random() * 3000);
    }
}

function getRealUserInfo() {
    // 1. Try AppState (Global)
    if (window.appState?.user) {
        return {
            name: window.appState.user.username || window.appState.user.name,
            avatar: window.appState.user.avatar || '😎'
        };
    }
    
    // 2. Try LocalStorage Auth Token/Data
    const storedUser = localStorage.getItem('user_data'); // common storage key
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            return {
                name: parsed.username || parsed.name || 'Player1',
                avatar: parsed.avatar || '😎'
            };
        } catch (e) {}
    }

    // 3. Try Fallback Storage Keys
    const guestName = localStorage.getItem('username') || localStorage.getItem('guestUsername');
    const guestAvatar = localStorage.getItem('avatar') || localStorage.getItem('guestAvatar');

    return {
        name: guestName || 'Guest User',
        avatar: guestAvatar || '👤'
    };
}

function addChatMessageToUI(user, avatar, message, time, isMe = false) {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${isMe ? 'message-own' : ''}`;
    
    // Styling for own messages vs others
    const bg = isMe ? 'var(--primary-color)' : 'var(--bg-secondary)';
    const align = isMe ? 'flex-end' : 'flex-start';
    const textColor = isMe ? '#000' : 'var(--text-primary)'; // Primary color is usually bright, so black text
    // Assuming primary color is neon green/yellow, black text is good.
    // If primary is dark, white text. Let's use a safe specific style.
    
    // Determine styles based on context
    // We'll use inline styles to ensure it looks right without CSS changes if possible,
    // but adding a class is better. I'll add the styles via JS or update CSS if needed.
    // Let's use specific inline styles for the "Me" differentiation.
    
    const containerStyle = `
        display: flex; 
        gap: 12px; 
        padding: 12px; 
        background: ${isMe ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-secondary)'}; 
        border-radius: 12px; 
        margin-bottom: 8px;
        border: ${isMe ? '1px solid var(--primary-color)' : 'none'};
        animation: slideInRight 0.3s ease;
    `;

    messageEl.style.cssText = containerStyle;
    
    messageEl.innerHTML = `
        <div style="font-size: 24px; flex-shrink: 0;">${avatar}</div>
        <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong style="color: ${isMe ? 'var(--primary-color)' : 'var(--text-primary)'}; font-size: 14px;">
                    ${escapeHtml(user)} ${isMe ? '(You)' : ''}
                </strong>
                <span style="color: var(--text-secondary); font-size: 12px;">${time}</span>
            </div>
            <div style="color: var(--text-primary); font-size: 14px;">${escapeHtml(message)}</div>
        </div>
    `;
    
    messagesEl.appendChild(messageEl);
    
    // Scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function simulateReply(channel) {
    if (channel !== currentChannel) return; // Only show if still looking
    
    const replies = [
        "True that!",
        "I wouldn't bet on it.",
        "Wait, really?",
        "Lol",
        "Anyone want to 1v1?",
        "What are the odds on that?",
        "Nice win!",
        "Oof, bad beat."
    ];
    
    const randomUser = { name: 'SportsBot' + Math.floor(Math.random()*100), avatar: '🤖' };
    const randomMsg = replies[Math.floor(Math.random() * replies.length)];
    
    addChatMessageToUI(randomUser.name, randomUser.avatar, randomMsg, 'Just now');
    
    // Add to history
    if (!chatHistory[channel]) chatHistory[channel] = [];
    chatHistory[channel].push({
        user: randomUser.name,
        avatar: randomUser.avatar,
        message: randomMsg,
        time: 'Just now'
    });
}

function startChatSimulation() {
    setInterval(() => {
        // Randomly add messages to background channels so they have content when visited
        const channels = ['general', 'nfl', 'nba', 'live', 'strategy'];
        const randomChannel = channels[Math.floor(Math.random() * channels.length)];
        
        if (randomChannel !== currentChannel) {
             // Add to background history
             const fakeMsg = { 
                 user: 'RandomUser' + Math.floor(Math.random()*50), 
                 avatar: '👤', 
                 message: 'Simulated background activity...', 
                 time: '1m ago' 
             };
             if (!chatHistory[randomChannel]) chatHistory[randomChannel] = [];
             chatHistory[randomChannel].push(fakeMsg);
             // Keep size down
             if (chatHistory[randomChannel].length > 20) chatHistory[randomChannel].shift();
        }
    }, 10000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// USER PROFILE
// ============================================

function loadUserProfile() {
    // Get user data from appState (single source of truth)
    const user = window.appState?.user || null;
    
    // Get coins from unified currency system
    let coins = 1000; // Default
    if (window.parent && window.parent.currencyManager) {
        coins = window.parent.currencyManager.getBalance();
    } else if (window.currencyManager) {
        coins = window.currencyManager.getBalance();
    } else {
        coins = parseInt(localStorage.getItem('ultimateCoins')) || 1000;
    }
    
    // If no user from ap
