/**
 * SPORTS LOUNGE - Interactive JavaScript
 * Real-time updates, chat, and social features
 */

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏟️ Sports Lounge initialized');
    
    initializeLiveStats();
    initializeActivityFeed();
    initializeChat();
    loadUserProfile();
    startRealTimeUpdates();
});

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

let chatMessages = [];

function initializeChat() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    // Handle Enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Load demo messages
    loadDemoMessages();
}

function loadDemoMessages() {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;
    
    const demoMessages = [
        { user: 'ParlayKing', avatar: '👑', message: 'Who wants to battle? I\'m on a 5-game win streak!', time: '2m ago' },
        { user: 'SportsFan', avatar: '🏈', message: 'Anyone else taking Lakers tonight?', time: '3m ago' },
        { user: 'TriviaGuru', avatar: '🧠', message: 'Just beat the daily trivia! 50/50 correct 🔥', time: '5m ago' },
        { user: 'BetMaster', avatar: '💎', message: '@ParlayKing I\'ll take that challenge!', time: '7m ago' }
    ];
    
    demoMessages.forEach(msg => {
        addChatMessage(msg.user, msg.avatar, msg.message, msg.time);
    });
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Get user info (would come from auth system)
    const userName = document.getElementById('user-name')?.textContent || 'Guest';
    const userAvatar = '🎮';
    
    // Add message to chat
    addChatMessage(userName, userAvatar, message, 'Just now');
    
    // Clear input
    input.value = '';
    
    // Scroll to bottom
    const messagesEl = document.getElementById('chat-messages');
    if (messagesEl) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
}

function addChatMessage(user, avatar, message, time) {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    messageEl.style.display = 'flex';
    messageEl.style.gap = '12px';
    messageEl.style.padding = '12px';
    messageEl.style.background = 'var(--bg-secondary)';
    messageEl.style.borderRadius = '12px';
    messageEl.style.animation = 'slideInRight 0.3s ease';
    
    messageEl.innerHTML = `
        <div style="font-size: 24px; flex-shrink: 0;">${avatar}</div>
        <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong style="color: var(--text-primary); font-size: 14px;">${user}</strong>
                <span style="color: var(--text-secondary); font-size: 12px;">${time}</span>
            </div>
            <div style="color: var(--text-primary); font-size: 14px;">${escapeHtml(message)}</div>
        </div>
    `;
    
    messagesEl.appendChild(messageEl);
    
    // Scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    // Keep only last 50 messages
    const messages = messagesEl.querySelectorAll('.chat-message');
    if (messages.length > 50) {
        messages[0].remove();
    }
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
    // This would load from backend
    // For now, using demo data
    const profileData = {
        name: 'SportsFan2024',
        coins: 847,
        wins: 23,
        streak: 7,
        avatar: '🎮'
    };
    
    // Update UI with profile data
    const nameEl = document.getElementById('user-name');
    if (nameEl) {
        nameEl.textContent = profileData.name;
    }
}

// ============================================
// REAL-TIME UPDATES
// ============================================

function startRealTimeUpdates() {
    // This would connect to WebSocket
    // For now, using intervals
    
    setInterval(() => {
        updateLeaderboard();
        updateChallenges();
    }, 30000);
}

function updateLeaderboard() {
    // Update leaderboard positions
    // In production, this would fetch from backend
    console.log('📊 Leaderboard updated');
}

function updateChallenges() {
    // Update challenge progress
    // In production, this would sync with backend
    console.log('🎯 Challenges updated');
}

// ============================================
// ANIMATIONS
// ============================================

// Add slide-in animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// ============================================
// NAVIGATION
// ============================================

// Action card navigation
document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', function() {
        const href = this.getAttribute('onclick');
        if (href && href.includes('window.location.href')) {
            const url = href.match(/'([^']+)'/)[1];
            console.log('Navigating to:', url);
            // In production, this would navigate to the actual page
            showComingSoon(this.querySelector('h3').textContent);
        }
    });
});

function showComingSoon(feature) {
    alert(`🚀 ${feature} is coming soon!\n\nThis feature is currently in development and will be available in the next update.`);
}

// Mini game buttons
document.querySelectorAll('.minigame-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const game = this.querySelector('span').textContent;
        showComingSoon(`${game} Mini Game`);
    });
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: ${type === 'success' ? '#10b981' : '#6366f1'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Export functions for use in other scripts
window.SportsLounge = {
    sendMessage,
    showNotification,
    showComingSoon
};

console.log('✅ Sports Lounge fully loaded');
