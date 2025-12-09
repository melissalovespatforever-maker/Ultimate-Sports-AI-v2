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
    // Get user data from appState (single source of truth)
    const user = window.appState?.user || null;
    
    // If no user from appState, check localStorage for guest data
    let profileData = {
        name: user?.name || user?.username || localStorage.getItem('guestUsername') || 'Guest User',
        coins: parseInt(localStorage.getItem('sportsLoungeBalance')) || 1000,
        wins: 0,
        streak: 0,
        avatar: user?.avatar || localStorage.getItem('guestAvatar') || '😊'
    };

    // Calculate real wins and streak from game stats
    const slotsStats = JSON.parse(localStorage.getItem('slotsStats')) || { wins: 0 };
    const wheelStats = JSON.parse(localStorage.getItem('wheelStats')) || { wins: 0 };
    const coinflipStats = JSON.parse(localStorage.getItem('coinflipStats')) || { wins: 0 };
    const penaltyStats = JSON.parse(localStorage.getItem('penaltyStats')) || { wins: 0 };
    const triviaStats = JSON.parse(localStorage.getItem('triviaStats')) || { wins: 0 };
    
    profileData.wins = slotsStats.wins + wheelStats.wins + coinflipStats.wins + 
                      penaltyStats.wins + triviaStats.wins;
    
    // Get streak from localStorage or calculate
    profileData.streak = parseInt(localStorage.getItem('currentStreak')) || 0;
    
    // Update UI with real profile data
    const nameEl = document.getElementById('user-name');
    if (nameEl) {
        nameEl.textContent = profileData.name;
    }

    // Update avatar display
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
        avatarEl.textContent = profileData.avatar;
    }

    // Update coins display
    const coinsEl = document.querySelector('.profile-coins');
    if (coinsEl) {
        coinsEl.textContent = profileData.coins.toLocaleString();
    }

    // Update wins display
    const winsEl = document.querySelector('.profile-wins');
    if (winsEl) {
        winsEl.textContent = profileData.wins;
    }

    // Update streak display
    const streakEl = document.querySelector('.profile-streak');
    if (streakEl) {
        streakEl.textContent = profileData.streak;
    }

    console.log('✅ Sports Lounge profile loaded:', profileData.name, '| Coins:', profileData.coins, '| Wins:', profileData.wins);
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
// GAME BUTTONS & INTERACTIONS
// ============================================

function initializeGameButtons() {
    // Game cards - Check if they have actual games
    document.querySelectorAll('.btn-game-play, .btn-game-launch').forEach(btn => {
        btn.addEventListener('click', function() {
            const gameCard = this.closest('.game-card, .featured-game');
            const gameName = gameCard ? gameCard.querySelector('h3, h2').textContent : 'This Game';
            
            // Map game names to URLs
            const gameUrls = {
                'Lucky Slots': 'minigame-slots.html',
                'Prize Wheel': 'minigame-wheel.html',
                'Coin Flip': 'minigame-coinflip.html',
                'Penalty Shootout': 'minigame-penalty-shootout.html',
                'Sports Trivia': 'minigame-trivia.html'
            };
            
            if (gameUrls[gameName]) {
                window.location.href = gameUrls[gameName];
            } else {
                showComingSoon(gameName);
            }
        });
    });

    // Mini game buttons (if they exist in other sections)
    document.querySelectorAll('.minigame-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const game = this.querySelector('span').textContent;
            
            const gameUrls = {
                'Slots': 'minigame-slots.html',
                'Wheel': 'minigame-wheel.html',
                'Flip': 'minigame-coinflip.html'
            };
            
            if (gameUrls[game]) {
                window.location.href = gameUrls[game];
            } else {
                showComingSoon(`${game} Mini Game`);
            }
        });
    });

    // Leaderboard filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            console.log(`Leaderboard filtered to: ${filter}`);
            showNotification(`Showing ${filter} rankings`);
        });
    });

    // Profile button
    const profileBtn = document.querySelector('.btn-profile');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            showComingSoon('Full Profile View');
        });
    }

    // Tournament join button
    document.querySelectorAll('.btn-tournament-join, .activity-action').forEach(btn => {
        btn.addEventListener('click', () => {
            showComingSoon('Tournament System');
        });
    });
}

function showComingSoon(feature) {
    showNotification(`🚀 ${feature} is coming soon! This feature is currently in development.`, 'info');
}

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
