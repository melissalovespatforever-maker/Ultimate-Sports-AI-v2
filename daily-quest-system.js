/**
 * DAILY QUEST SYSTEM
 * Manages daily challenges, progress tracking, and rewards.
 */

class DailyQuestSystem {
    constructor() {
        this.QUESTS_STORAGE_KEY = 'daily_quests_data';
        this.QUEST_DEFINITIONS = [
            {
                id: 'play_games',
                title: 'Game Enthusiast',
                description: 'Play 3 minigames in the Sports Lounge',
                target: 3,
                reward: 500,
                icon: '🎮',
                category: 'games_played'
            },
            {
                id: 'win_coins',
                title: 'Big Winner',
                description: 'Win a total of 1,000 coins',
                target: 1000,
                reward: 750,
                icon: '💰',
                category: 'coins_won'
            },
            {
                id: 'place_bets',
                title: 'High Roller',
                description: 'Place 5 bets on any sport or game',
                target: 5,
                reward: 600,
                icon: '🎲',
                category: 'bets_placed'
            },
            {
                id: 'visit_shop',
                title: 'Window Shopper',
                description: 'Visit the Item Shop',
                target: 1,
                reward: 200,
                icon: '🛒',
                category: 'shop_visited'
            },
            {
                id: 'slot_spins',
                title: 'Lucky Seven',
                description: 'Spin the Slot Machine 10 times',
                target: 10,
                reward: 450,
                icon: '🎰',
                category: 'slots_played'
            },
            {
                id: 'social_shout',
                title: 'Social Butterfly',
                description: 'Post a message in the Shoutbox',
                target: 1,
                reward: 150,
                icon: '💬',
                category: 'shoutbox_post'
            },
            {
                id: 'daily_login',
                title: 'Reliable Fan',
                description: 'Log in to the app',
                target: 1,
                reward: 100,
                icon: '📅',
                category: 'daily_login'
            }
        ];

        this.activeQuests = [];
        this.lastGeneratedDate = null;
        
        console.log('📜 Daily Quest System loaded.');
    }

    init() {
        this.loadQuests();
        this.checkAndGenerateDailyQuests();
        this.setupEventListeners();
        this.updateUI();
        this.updateBadge();
    }

    loadQuests() {
        const stored = localStorage.getItem(this.QUESTS_STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.activeQuests = data.quests || [];
                this.lastGeneratedDate = data.lastGeneratedDate;
                console.log('📜 Loaded quests from storage:', this.activeQuests.length);
            } catch (e) {
                console.error('Failed to parse quest data', e);
            }
        }
    }

    saveQuests() {
        const data = {
            quests: this.activeQuests,
            lastGeneratedDate: this.lastGeneratedDate
        };
        localStorage.setItem(this.QUESTS_STORAGE_KEY, JSON.stringify(data));
    }

    checkAndGenerateDailyQuests() {
        const today = new Date().toDateString();
        if (this.lastGeneratedDate !== today) {
            this.generateNewQuests(today);
        }
    }

    generateNewQuests(dateString) {
        console.log('📜 Generating new daily quests for', dateString);
        
        // Shuffle and pick 3 unique quests
        const shuffled = [...this.QUEST_DEFINITIONS].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        
        this.activeQuests = selected.map(q => ({
            ...q,
            progress: 0,
            completed: false,
            claimed: false
        }));
        
        // Auto-complete login quest if selected
        const loginQuest = this.activeQuests.find(q => q.id === 'daily_login');
        if (loginQuest) {
            loginQuest.progress = 1;
            loginQuest.completed = true;
        }

        this.lastGeneratedDate = dateString;
        this.saveQuests();
    }

    updateBadge() {
        const claimableCount = this.activeQuests.filter(q => q.completed && !q.claimed).length;
        const buttons = [
            document.getElementById('daily-quests-btn'),
            document.querySelector('.menu-item[onclick*="dailyQuests.renderToModal"]')
        ];

        buttons.forEach(btn => {
            if (!btn) return;
            
            let badge = btn.querySelector('.quest-badge');
            if (claimableCount > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'quest-badge';
                    btn.style.position = 'relative';
                    btn.appendChild(badge);
                }
                badge.textContent = claimableCount;
            } else if (badge) {
                badge.remove();
            }
        });
    }

    updateProgress(category, amount = 1) {
        let changed = false;
        this.activeQuests.forEach(quest => {
            if (quest.category === category && !quest.completed) {
                quest.progress += amount;
                if (quest.progress >= quest.target) {
                    quest.progress = quest.target;
                    quest.completed = true;
                    this.notifyQuestCompleted(quest);
                }
                changed = true;
            }
        });

        if (changed) {
            this.saveQuests();
            this.updateUI();
            this.updateBadge();
        }
    }

    notifyQuestCompleted(quest) {
        if (typeof showToast === 'function') {
            showToast(`Quest Completed: ${quest.title}! 🏆`, 'success');
        }
        
        if (window.soundEffects) {
            window.soundEffects.playSound('win');
        }
        
        // Visual feedback if possible
        if (window.confetti && typeof window.confetti.celebrate === 'function') {
            window.confetti.celebrate();
        }

        this.updateBadge();
    }

    claimReward(questId) {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (quest && quest.completed && !quest.claimed) {
            quest.claimed = true;
            
            // Add coins via globalState
            if (window.globalState) {
                window.globalState.addCoins(quest.reward, `Daily Quest: ${quest.title}`);
            } else if (window.currencyManager) {
                window.currencyManager.addCoins(quest.reward, `Daily Quest: ${quest.title}`);
            }
            
            this.saveQuests();
            this.updateUI();
            this.updateBadge();
            
            if (window.confetti) {
                window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }
            
            return true;
        }
        return false;
    }

    setupEventListeners() {
        // Listen for common events from the app
        window.addEventListener('gameCompleted', (e) => this.updateProgress('games_played', 1));
        window.addEventListener('coinsWon', (e) => this.updateProgress('coins_won', e.detail.amount));
        window.addEventListener('betPlaced', (e) => this.updateProgress('bets_placed', 1));
        window.addEventListener('shopOpened', (e) => this.updateProgress('shop_visited', 1));
        window.addEventListener('slotSpun', (e) => this.updateProgress('slots_played', 1));
        window.addEventListener('shoutboxMessage', (e) => this.updateProgress('shoutbox_post', 1));
        
        // Listen for messages from iframes
        window.addEventListener('message', (event) => {
            if (event.data.type === 'questProgress') {
                this.updateProgress(event.data.category, event.data.amount);
            }
        });
    }

    updateUI() {
        const questContainer = document.getElementById('daily-quests-container');
        if (!questContainer) return;

        if (this.activeQuests.length === 0) {
            questContainer.innerHTML = '<p class="no-quests">No quests available today.</p>';
            return;
        }

        questContainer.innerHTML = this.activeQuests.map(quest => {
            const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
            let statusClass = '';
            let btnText = 'Claim Reward';
            let btnDisabled = !quest.completed || quest.claimed;

            if (quest.claimed) {
                statusClass = 'claimed';
                btnText = 'Claimed';
            } else if (quest.completed) {
                statusClass = 'completed';
            }

            return `
                <div class="quest-card ${statusClass}">
                    <div class="quest-icon">${quest.icon}</div>
                    <div class="quest-info">
                        <div class="quest-title">${quest.title}</div>
                        <div class="quest-desc">${quest.description}</div>
                        <div class="quest-progress-bar">
                            <div class="quest-progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="quest-progress-text">${quest.progress} / ${quest.target}</div>
                    </div>
                    <div class="quest-reward">
                        <div class="reward-amount">+${quest.reward} 💰</div>
                        <button class="quest-claim-btn" 
                                ${btnDisabled ? 'disabled' : ''} 
                                onclick="window.dailyQuests.claimReward('${quest.id}')">
                            ${btnText}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderToModal() {
        const existing = document.getElementById('daily-quest-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'daily-quest-modal';
        modal.className = 'daily-quest-modal';
        modal.innerHTML = `
            <div class="daily-quest-content">
                <div class="quest-header">
                    <h2>Daily Quests</h2>
                    <button class="close-quest-modal" onclick="window.dailyQuests.closeModal()">&times;</button>
                </div>
                <div class="quest-subtitle">Complete daily tasks to earn extra Ultimate Coins!</div>
                <div id="daily-quests-container" class="daily-quests-list">
                    <!-- Populated by JS -->
                </div>
                <div class="quest-footer">
                    Quests reset in <span id="quest-reset-timer">--:--:--</span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.updateUI();
        this.startResetTimer();
        
        setTimeout(() => modal.classList.add('active'), 10);
    }

    closeModal() {
        const modal = document.getElementById('daily-quest-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    startResetTimer() {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const diff = tomorrow - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            const timerEl = document.getElementById('quest-reset-timer');
            if (timerEl) {
                timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        };
        
        updateTimer();
        this.resetInterval = setInterval(updateTimer, 1000);
    }
}

// Global Instance
window.dailyQuests = new DailyQuestSystem();
window.dailyQuests.init();
