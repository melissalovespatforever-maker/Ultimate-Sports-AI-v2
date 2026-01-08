/**
 * SPORTS LOUNGE - Redesigned & Fully Functional
 * Real data integration with WebSocket Chat and Enhanced Shop
 */

console.log('🏟️ Sports Lounge Starting (Redesigned)...');

// ============================================
// STATE & DATA
// ============================================

let currentTab = 'game-room';
let currentChannel = 'general';
let chatSocket = null;
let userData = {
    id: 0,
    name: 'Guest User',
    avatar: '🎮',
    coins: 1000,
    wins: 0,
    streak: 0
};

const MOCK_ACTIVITIES = [
    { icon: '🔥', text: '@SportsFan won a 5-leg parlay!', badge: '+$250', type: 'win' },
    { icon: '⚔️', text: '@ParlayKing challenged @BetMaster', type: 'challenge' },
    { icon: '🧠', text: '@TriviaGuru answered 20 questions in a row!', type: 'trivia' },
    { icon: '💎', text: '@HighRoller purchased VIP avatar!', badge: '10,000', type: 'purchase' },
    { icon: '🎰', text: '@LuckySlots hit the jackpot!', badge: '+$500', type: 'win' }
];

const MOCK_TROPHIES = [
    { name: 'Grand Championship', icon: '🏆', date: 'Season 1 Champion' },
    { name: 'Football Tournament', icon: '🏈', date: 'January 2025' },
    { name: 'Basketball Tournament', icon: '🏀', date: 'March 2024' },
    { name: 'Baseball Tournament', icon: '⚾', date: 'October 2024' },
    { name: 'VIP Elite Achievement', icon: '💎', date: 'November 2024' }
];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Initializing Sports Lounge...');
    
    try {
        loadUserData();
        initializeTabs();
        initializeGameButtons();
        initializeMobileSidebar();
        // initializeChat(); // Disabled in favor of sports-lounge-chat-client.js
        initializeLoungeShop();
        initializeLiveStats();
        initializeActivityFeed();
        loadTrophies();
        initializeLiveScores();
        
        console.log('✅ Sports Lounge Initialized Successfully');
    } catch (error) {
        console.error('❌ Initialization Error:', error);
    }
});

// ============================================
// USER DATA
// ============================================

function loadUserData() {
    // Try to get from global state first (prefer parent if in iframe)
    const globalState = window.globalState || (window.parent && window.parent.globalState);
    
    if (globalState && globalState.state) {
        const state = globalState.state;
        
        // GUEST ACCESS: If not authenticated, we still allow access to the lounge as a guest
        userData.id = state.user?.id || 0;
        userData.name = state.user?.username || state.user?.name || 'Guest User';
        userData.coins = globalState.getBalance ? globalState.getBalance() : 10000;
        userData.avatar = state.user?.avatar || '🎮';
        userData.wins = state.stats?.wins || 0;
        userData.streak = state.stats?.streak || 0;
        
        console.log('✅ User data loaded from GlobalState:', userData.name, '| Coins:', userData.coins);
    } else {
        // Fallback to localStorage (Mirror GlobalStateManager defaults)
        userData.id = parseInt(localStorage.getItem('unified_user_id') || '0');
        userData.name = localStorage.getItem('unified_username') || 'Guest User';
        userData.coins = parseInt(localStorage.getItem('unified_balance') || '10000');
        userData.avatar = localStorage.getItem('unified_avatar') || '🎮';
        
        // Stats fallback
        userData.wins = parseInt(localStorage.getItem('user_wins') || '0');
        userData.streak = parseInt(localStorage.getItem('user_streak') || '0');
        
        console.log('⚠️ GlobalState not found, using localStorage fallback');
    }
    
    // Update UI
    updateUserDisplay();
}

function updateUserDisplay() {
    const elements = {
        name: document.getElementById('user-name'),
        avatar: document.getElementById('user-avatar'),
        wins: document.getElementById('profile-wins'),
        streak: document.getElementById('profile-streak')
    };
    
    if (elements.name) elements.name.textContent = userData.name;
    if (elements.avatar) elements.avatar.textContent = userData.avatar;
    if (elements.wins) elements.wins.textContent = userData.wins;
    if (elements.streak) elements.streak.textContent = userData.streak;
    
    // Balance is managed by parent window ONLY (no duplicate displays)
    console.log('✅ User display updated (balance managed by parent)');
}

function updateBalance(newBalance) {
    // Single source of truth: Always update GlobalStateManager
    const globalState = window.globalState || (window.parent && window.parent.globalState);
    
    if (globalState && globalState.setBalance) {
        // We use setBalance for direct updates
        globalState.setBalance(newBalance);
        userData.coins = globalState.getBalance ? globalState.getBalance() : newBalance;
    } else {
        // Emergency Fallback
        userData.coins = newBalance;
        localStorage.setItem('unified_balance', newBalance.toString());
        localStorage.setItem('ultimateCoins', newBalance.toString());
    }
    
    updateUserDisplay();
    
    // Notify parent window of balance update
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            action: 'balance_updated',
            balance: newBalance
        }, '*');
    }
}

// ============================================
// TAB NAVIGATION
// ============================================

function initializeTabs() {
    const tabs = document.querySelectorAll('.lounge-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    console.log('✅ Tabs initialized:', tabs.length);
}

function switchTab(tabName) {
    console.log('🎯 Switching to tab:', tabName);
    
    // Track shop visits for daily quests
    if (tabName === 'shop') {
        const globalState = window.globalState || (window.parent && window.parent.globalState);
        if (globalState) {
            window.parent.dispatchEvent(new CustomEvent('shopOpened'));
        }
    }
    
    // Update tab buttons
    document.querySelectorAll('.lounge-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(tabName);
    if (activeContent) {
        activeContent.classList.add('active');
        currentTab = tabName;
        
        // Load tab-specific content
        handleTabActivation(tabName);
        
        console.log('✅ Tab switched to:', tabName);
    } else {
        console.error('❌ Tab content not found:', tabName);
    }
}

function handleTabActivation(tabName) {
    switch(tabName) {
        case 'shop':
            updateUserDisplay();
            if (window.ShopSystem && typeof window.ShopSystem.updateBalanceDisplay === 'function') {
                window.ShopSystem.updateBalanceDisplay();
            }
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'quests':
            loadQuests();
            break;
        case 'trophy-room':
            loadTrophies();
            break;
    }
}

// ============================================
// GAME BUTTONS
// ============================================

function initializeGameButtons() {
    const gameButtons = document.querySelectorAll('.btn-game-play, .btn-game-launch');
    
    gameButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const gamePage = button.getAttribute('data-game');
            
            if (gamePage) {
                console.log('🎮 Launching game:', gamePage);
                window.location.href = gamePage;
            } else {
                console.error('❌ No game URL specified');
            }
        });
    });
    
    console.log('✅ Game buttons initialized:', gameButtons.length);
}

// ============================================
// MOBILE SIDEBAR
// ============================================

function initializeMobileSidebar() {
    const toggleBtn = document.getElementById('mobile-sidebar-toggle');
    const sidebar = document.querySelector('.lounge-column');
    
    if (!toggleBtn || !sidebar) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    toggleBtn.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');
        toggleBtn.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Change icon based on state
        const icon = toggleBtn.querySelector('i');
        if (isOpen) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-chart-bar';
        }
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        toggleBtn.classList.remove('active');
        overlay.classList.remove('active');
        const icon = toggleBtn.querySelector('i');
        icon.className = 'fas fa-chart-bar';
    });

    console.log('✅ Mobile sidebar initialized');
}

// ============================================
// CHAT SYSTEM (WEBSOCKET INTEGRATED)
// ============================================

function initializeChat() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-chat');
    
    // Setup Socket.io connection if possible
    try {
        const socketUrl = (window.CONFIG && window.CONFIG.WS_URL) || 'https://ultimate-sports-ai-backend-production.up.railway.app';
        chatSocket = io(`${socketUrl}/chat`, {
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true
        });

        chatSocket.on('connect', () => {
            console.log('💬 Chat connected to backend');
            const statusEl = document.getElementById('chat-status');
            if (statusEl) {
                statusEl.textContent = 'Connected';
                statusEl.style.color = '#10b981';
            }
            
            // Authenticate with backend
            chatSocket.emit('auth', {
                userId: userData.id,
                username: userData.name,
                avatar: userData.avatar
            });
        });

        chatSocket.on('connect_error', (error) => {
            console.warn('⚠️ Chat connection error:', error.message);
            const statusEl = document.getElementById('chat-status');
            if (statusEl) {
                statusEl.textContent = 'Simulated Mode';
                statusEl.style.color = '#fbbf24';
            }
        });

        chatSocket.on('message:new', (msg) => {
            addChatMessage(msg.username, msg.avatar, msg.message, msg.userId === userData.id);
        });

        chatSocket.on('channel:history', (data) => {
            const messagesEl = document.getElementById('chat-messages');
            if (messagesEl) {
                messagesEl.innerHTML = '';
                if (data.messages && data.messages.length > 0) {
                    data.messages.forEach(msg => {
                        addChatMessage(msg.username, msg.avatar, msg.message, msg.userId === userData.id);
                    });
                } else {
                    addChatMessage('System', '🤖', `Welcome to #${data.channel}! Be the first to start the conversation.`, false);
                }
            }
        });

        chatSocket.on('online:count', (data) => {
            const countEl = document.getElementById('chat-online-count');
            const heroCountEl = document.getElementById('online-count');
            if (countEl) countEl.textContent = data.count;
            if (heroCountEl) heroCountEl.textContent = (1200 + data.count).toLocaleString(); // Add base online users for aesthetic
        });

    } catch (e) {
        console.warn('⚠️ Socket.io initialization failed:', e);
    }

    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendChatMessage);
    }
    
    // Initialize chat categories
    const categoryBtns = document.querySelectorAll('.chat-category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const channel = btn.getAttribute('data-channel');
            switchChannel(channel);
        });
    });
    
    // Load initial channel
    switchChannel('general');
    
    console.log('✅ Chat initialized');
}

function switchChannel(channel) {
    currentChannel = channel;
    
    if (chatSocket && chatSocket.connected) {
        chatSocket.emit('channel:join', channel);
    } else {
        // Simulated fallback
        const messagesEl = document.getElementById('chat-messages');
        if (!messagesEl) return;
        messagesEl.innerHTML = '';
        addChatMessage('System', '🤖', `Welcome to #${channel} (Simulated Mode)!`, false);
    }
    
    console.log('💬 Switched to channel:', channel);
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    if (chatSocket && chatSocket.connected) {
        chatSocket.emit('message:send', {
            message: message,
            channel: currentChannel
        });
    } else {
        // Fallback simulation
        addChatMessage(userData.name, userData.avatar, message, true);
        
        // Simulate reply
        setTimeout(() => {
            const replies = ['Nice!', 'Who you betting on?', 'Lounge is fire today', 'Good luck!', 'Let\'s go!'];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            addChatMessage('Player' + Math.floor(Math.random() * 100), '👤', randomReply, false);
        }, 1500);
    }
    
    // Clear input
    input.value = '';

    // Track for daily quests
    window.parent.dispatchEvent(new CustomEvent('shoutboxMessage'));
}

function addChatMessage(user, avatar, message, isMe = false) {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isMe ? 'message-own' : ''}`;
    messageDiv.style.cssText = `
        display: flex;
        gap: 12px;
        padding: 12px;
        background: ${isMe ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
        border-radius: 12px;
        margin-bottom: 8px;
        border: ${isMe ? '1px solid var(--primary-color)' : 'none'};
        animation: slideIn 0.3s ease;
    `;
    
    messageDiv.innerHTML = `
        <div style="font-size: 24px;">${avatar}</div>
        <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong style="color: ${isMe ? 'var(--primary-color)' : '#fff'};">
                    ${user} ${isMe ? '(You)' : ''}
                </strong>
                <span style="color: #888; font-size: 12px;">Just now</span>
            </div>
            <div style="color: rgba(255,255,255,0.9); line-height: 1.4;">${escapeHtml(message)}</div>
        </div>
    `;
    
    messagesEl.appendChild(messageDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ============================================
// SHOP SYSTEM (INTEGRATED)
// ============================================

function initializeLoungeShop() {
    // Buy Buttons - delegate to global ShopSystem if available
    const buyButtons = document.querySelectorAll('.btn-buy');
    buyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = button.getAttribute('data-item');
            const price = parseInt(button.getAttribute('data-price'));
            
            handlePurchase(itemId, price);
        });
    });

    // Category Buttons are handled by shop-system.js
    console.log('✅ Lounge Shop buttons initialized');
}

function filterShopItems(category) {
    if (window.ShopSystem && typeof window.ShopSystem.filterItems === 'function') {
        window.ShopSystem.filterItems(category);
    } else {
        const sections = document.querySelectorAll('.shop-section');
        sections.forEach(section => {
            if (category === 'all' || section.getAttribute('data-category') === category) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }
}

function handlePurchase(itemId, price) {
    console.log(`🛒 Lounge purchase requested: ${itemId} (${price} coins)`);
    
    // Check if ShopSystem exists globally
    const shopSystem = window.ShopSystem || (window.parent && window.parent.ShopSystem);
    
    if (shopSystem && typeof shopSystem.purchase === 'function') {
        const success = shopSystem.purchase(itemId, price);
        if (success) {
            // Refresh user display after purchase
            setTimeout(() => {
                loadUserData();
                if (currentTab === 'inventory') {
                    loadInventory();
                }
            }, 500);
            
            // Track for quests
            window.dispatchEvent(new CustomEvent('shopOpened'));
        }
    } else {
        // Fallback for standalone mode or if script failed
        const currentBalance = userData.coins;
        if (currentBalance < price) {
            showNotification('❌ Not enough coins!', 'error');
            return;
        }
        
        updateBalance(currentBalance - price);
        
        // Add to local inventory
        const inventory = JSON.parse(localStorage.getItem('userInventory') || '[]');
        inventory.push({
            id: itemId,
            purchasedAt: Date.now()
        });
        localStorage.setItem('userInventory', JSON.stringify(inventory));
        
        showNotification(`✅ Successfully purchased ${itemId}!`, 'success');
        
        // Refresh displays
        setTimeout(() => loadUserData(), 500);
    }
}

// ============================================
// DAILY QUESTS
// ============================================

function loadQuests() {
    if (window.dailyQuests && typeof window.dailyQuests.updateUI === 'function') {
        window.dailyQuests.updateUI();
        window.dailyQuests.startResetTimer();
    } else {
        const container = document.getElementById('daily-quests-container');
        if (container) {
            container.innerHTML = '<div class="loading-state">Quest system initializing...</div>';
        }
    }
}

// ============================================
// INVENTORY
// ============================================

function loadInventory() {
    if (window.inventorySystem && typeof window.inventorySystem.renderInventoryUI === 'function') {
        window.inventorySystem.renderInventoryUI('inventory-content');
    } else {
        const inventoryContent = document.getElementById('inventory-content');
        if (inventoryContent) {
            inventoryContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>Loading inventory...</p>
                </div>
            `;
        }
    }
}

// ============================================
// TROPHIES
// ============================================

function loadTrophies() {
    const trophiesGrid = document.getElementById('trophies-grid');
    if (!trophiesGrid) return;
    
    trophiesGrid.innerHTML = MOCK_TROPHIES.map(trophy => `
        <div class="trophy-display" style="padding: 24px; background: rgba(255,255,255,0.05); border-radius: 12px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 12px;">${trophy.icon}</div>
            <h3 style="margin: 0 0 4px 0; color: white;">${trophy.name}</h3>
            <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">${trophy.date}</p>
        </div>
    `).join('');
    
    if (document.getElementById('trophy-count')) document.getElementById('trophy-count').textContent = MOCK_TROPHIES.length;
}

// ============================================
// LIVE STATS
// ============================================

function initializeLiveStats() {
    setInterval(() => {
        updateLiveStat('online-count', 1247, 20);
        updateLiveStat('active-battles', 23, 5);
        updateLiveStat('hot-streak', 12, 3);
        updateLiveStat('chat-online-count', 247, 10);
    }, 5000);
}

function updateLiveStat(elementId, baseValue, variance) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const change = Math.floor(Math.random() * variance * 2) - variance;
    const newValue = Math.max(baseValue - variance, baseValue + change);
    
    element.textContent = newValue.toLocaleString();
}

// ============================================
// ACTIVITY FEED
// ============================================

function initializeActivityFeed() {
    const feedEl = document.getElementById('activity-feed');
    if (!feedEl) return;
    
    MOCK_ACTIVITIES.forEach(activity => addActivity(activity));
    
    setInterval(() => {
        const randomActivity = MOCK_ACTIVITIES[Math.floor(Math.random() * MOCK_ACTIVITIES.length)];
        addActivity(randomActivity);
    }, 15000);
}

function addActivity(activity) {
    const feedEl = document.getElementById('activity-feed');
    if (!feedEl) return;
    
    const activityDiv = document.createElement('div');
    activityDiv.style.cssText = `
        display: flex; align-items: center; gap: 12px; padding: 12px;
        background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px;
        animation: slideIn 0.5s ease;
    `;
    
    activityDiv.innerHTML = `
        <div style="font-size: 24px;">${activity.icon}</div>
        <div style="flex: 1; font-size: 13px; color: white;">${activity.text}</div>
        ${activity.badge ? `<div style="background: var(--primary-color); padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${activity.badge}</div>` : ''}
    `;
    
    feedEl.insertBefore(activityDiv, feedEl.firstChild);
    if (feedEl.children.length > 10) feedEl.removeChild(feedEl.lastChild);
}

// ============================================
// UTILITIES
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 24px; right: 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white; padding: 16px 24px; border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); z-index: 10000;
        animation: slideInRight 0.3s ease; font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// LIVE SCORES WIDGET (ESPN)
// ============================================

let currentScoreLeague = 'NFL';
let scoreRefreshInterval = null;

function initializeLiveScores() {
    const leagues = document.querySelectorAll('.score-leagues span');
    leagues.forEach(league => {
        league.addEventListener('click', () => {
            leagues.forEach(l => l.classList.remove('active'));
            league.classList.add('active');
            currentScoreLeague = league.getAttribute('data-league');
            fetchAndRenderScores();
        });
    });

    fetchAndRenderScores();
    if (scoreRefreshInterval) clearInterval(scoreRefreshInterval);
    scoreRefreshInterval = setInterval(fetchAndRenderScores, 60000);
}

async function fetchAndRenderScores() {
    const container = document.getElementById('live-scores-container');
    if (!container) return;

    try {
        if (!window.sportsDataService) return;
        const games = await window.sportsDataService.getGames(currentScoreLeague);
        
        if (!games || games.length === 0) {
            container.innerHTML = `<div class="score-loading">No ${currentScoreLeague} games today.</div>`;
            return;
        }

        container.innerHTML = games.slice(0, 5).map(game => `
            <div class="score-item">
                <div class="score-header">
                    <span>${game.sport}</span>
                    <span class="score-status ${game.isLive ? 'live' : ''}">${game.statusDisplay}</span>
                </div>
                <div class="score-teams">
                    <div class="score-team">
                        <div class="team-info">
                            <img src="${game.awayTeam.logo}" class="team-logo-small" onerror="this.src='https://play.rosebud.ai/assets/team-placeholder.png'">
                            <span class="team-name-abbr">${game.awayTeam.shortName}</span>
                        </div>
                        <span class="team-score-val">${game.awayTeam.score}</span>
                    </div>
                    <div class="score-team">
                        <div class="team-info">
                            <img src="${game.homeTeam.logo}" class="team-logo-small" onerror="this.src='https://play.rosebud.ai/assets/team-placeholder.png'">
                            <span class="team-name-abbr">${game.homeTeam.shortName}</span>
                        </div>
                        <span class="team-score-val">${game.homeTeam.score}</span>
                    </div>
                </div>
                <div class="score-footer">
                    <span>${game.venue}</span>
                    ${game.odds ? `<span>${game.odds.details}</span>` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error fetching scores:', error);
        container.innerHTML = `<div class="score-loading">Error loading scores.</div>`;
    }
}

