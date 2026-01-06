// ============================================
// DAILY REWARDS SYSTEM
// Manages daily login bonuses and streak UI
// ============================================

class DailyRewardsSystem {
    constructor() {
        this.rewards = [
            { day: 1, coins: 100, xp: 0, icon: '💰' },
            { day: 2, coins: 150, xp: 0, icon: '💰' },
            { day: 3, coins: 200, xp: 0, icon: '💰' },
            { day: 4, coins: 250, xp: 0, icon: '💰' },
            { day: 5, coins: 300, xp: 0, icon: '💰' },
            { day: 6, coins: 400, xp: 0, icon: '💰' },
            { day: 7, coins: 1000, xp: 100, icon: '💎' } // Big reward
        ];
        
        this.STORAGE_KEY_LAST_CLAIM = 'daily_reward_last_claim';
        this.STORAGE_KEY_STREAK = 'daily_reward_streak'; // Separate from achievements for safety
        
        // Don't auto-init, wait for app state or manual trigger
        console.log('📅 Daily Rewards System loaded.');
    }

    init() {
        this.checkRewards();
    }

    checkRewards() {
        console.log('📅 Checking daily reward eligibility...');
        
        // Verify user is authenticated
        const user = window.appState && window.appState.user;
        if (!user) {
            console.log('📅 Skip daily reward check: User not authenticated.');
            return;
        }

        // Use per-user keys for persistence
        const userId = user.id || 'guest';
        this.currentLastClaimKey = `${this.STORAGE_KEY_LAST_CLAIM}_${userId}`;
        this.currentStreakKey = `${this.STORAGE_KEY_STREAK}_${userId}`;

        // Check if we should show the modal
        if (this.checkEligibility()) {
            this.prepareModal();
            // Show with a slight delay to ensure UI is ready
            setTimeout(() => this.showModal(), 1000);
        } else {
            console.log('📅 Daily reward already claimed today.');
        }
    }

    checkEligibility() {
        if (!this.currentLastClaimKey) return false;
        const lastClaim = localStorage.getItem(this.currentLastClaimKey);
        const today = new Date().toDateString();
        
        return lastClaim !== today;
    }

    getStreakInfo() {
        if (!this.currentLastClaimKey) return { streak: 1, dayIndex: 0 };
        
        // We need to calculate streak based on last claim
        const lastClaimDate = localStorage.getItem(this.currentLastClaimKey);
        let currentStreak = parseInt(localStorage.getItem(this.currentStreakKey) || '0');
        
        if (!lastClaimDate) {
            return { streak: 1, dayIndex: 0 }; // First time ever
        }

        const today = new Date();
        const lastDate = new Date(lastClaimDate);
        
        // Helper to check if date is yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toDateString() === yesterday.toDateString()) {
            // Streak continues
            return { streak: currentStreak + 1, dayIndex: (currentStreak) % 7 };
        } else if (lastDate.toDateString() === today.toDateString()) {
            // Already claimed today
            return { streak: currentStreak, dayIndex: (currentStreak - 1 + 7) % 7 };
        } else {
            // Streak broken (or > 1 day gap)
            return { streak: 1, dayIndex: 0 };
        }
    }

    getCurrentReward() {
        const { dayIndex } = this.getStreakInfo();
        return this.rewards[dayIndex];
    }

    prepareModal() {
        // Create modal DOM if not exists
        if (!document.getElementById('daily-reward-modal')) {
            this.createModalDOM();
        }
        
        const { streak, dayIndex } = this.getStreakInfo();
        const currentReward = this.rewards[dayIndex];
        
        // Update Streak Display
        const streakValue = document.getElementById('daily-streak-value');
        if (streakValue) streakValue.textContent = streak;
        
        // Render Grid
        const grid = document.getElementById('daily-grid');
        if (grid) {
            grid.innerHTML = this.rewards.map((reward, index) => {
                let className = 'daily-day-card';
                let statusIcon = '';
                
                if (index < dayIndex) {
                    className += ' claimed';
                    statusIcon = '<i class="fas fa-check-circle status-icon"></i>';
                } else if (index === dayIndex) {
                    className += ' active today';
                }
                
                if (reward.day === 7) className += ' day-7';
                
                return `
                    <div class="${className}">
                        ${statusIcon}
                        <div class="day-label">Day ${reward.day}</div>
                        <div class="reward-icon-small">${reward.icon}</div>
                        <div class="reward-amount-small">${reward.coins}</div>
                        ${reward.xp > 0 ? `<div style="font-size: 9px; color: #a855f7;">+${reward.xp} XP</div>` : ''}
                    </div>
                `;
            }).join('');
        }
        
        // Update Button
        const btn = document.getElementById('daily-claim-btn');
        if (btn) {
            btn.innerHTML = `
                <span>Claim Reward</span>
                <div style="font-size: 12px; font-weight: normal; opacity: 0.9;">
                    ${currentReward.coins} Coins ${currentReward.xp > 0 ? `+ ${currentReward.xp} XP` : ''}
                </div>
            `;
            
            // Bind click
            btn.onclick = () => this.claimReward();
        }
    }

    createModalDOM() {
        const div = document.createElement('div');
        div.id = 'daily-reward-modal';
        div.className = 'daily-reward-modal';
        div.innerHTML = `
            <div class="daily-reward-content">
                <button class="daily-close-btn" onclick="window.dailyRewards.closeModal()">&times;</button>
                
                <div class="daily-reward-header">
                    <div class="daily-reward-title">Daily Bonus</div>
                    <div class="daily-reward-subtitle">Come back every day for bigger rewards!</div>
                </div>

                <div class="streak-display-container">
                    <span class="streak-counter" id="daily-streak-value">1</span>
                    <span class="streak-label">Day Streak</span>
                </div>

                <div class="daily-grid" id="daily-grid">
                    <!-- Populated by JS -->
                </div>

                <button id="daily-claim-btn" class="claim-btn">
                    Claim Reward
                </button>
            </div>
        `;
        document.body.appendChild(div);
    }

    showModal() {
        const modal = document.getElementById('daily-reward-modal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
            
            // Play sound
            if (window.soundEffects) window.soundEffects.playSound('click');
        }
    }

    closeModal() {
        const modal = document.getElementById('daily-reward-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    }

    claimReward() {
        const { streak, dayIndex } = this.getStreakInfo();
        const reward = this.rewards[dayIndex];
        
        // 1. Give Coins
        if (window.currencyManager) {
            window.currencyManager.addCoins(reward.coins, 'Daily Login Bonus');
        }
        
        // 2. Give XP (if any)
        if (reward.xp > 0 && window.achievementsSystem) {
            window.achievementsSystem.addXP(reward.xp, 'Daily Login Bonus');
        }
        
        // 3. Update State
        if (this.currentLastClaimKey) {
            localStorage.setItem(this.currentLastClaimKey, new Date().toDateString());
            localStorage.setItem(this.currentStreakKey, streak.toString());
        }
        
        // 4. Update Achievement System Streak (syncing)
        if (window.achievementsSystem && window.achievementsSystem.userStats) {
            window.achievementsSystem.userStats.loginStreak = streak;
            window.achievementsSystem.userStats.lastLogin = new Date().toDateString();
            window.achievementsSystem.saveStats();
            if (typeof window.achievementsSystem.checkAchievements === 'function') {
                window.achievementsSystem.checkAchievements(); 
            }
        }
        
        // 5. Visual Feedback
        if (window.confetti && typeof window.confetti.celebrate === 'function') {
            window.confetti.celebrate();
        } else if (window.confetti) {
            window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        if (window.soundEffects) window.soundEffects.playSound('win');
        
        // 6. Close Modal
        this.closeModal();
        
        // 7. Show Toast
        if (typeof showToast === 'function') {
            showToast(`Received ${reward.coins} Coins${reward.xp > 0 ? ` & ${reward.xp} XP` : ''}!`, 'success');
        }
    }
}

// Global Instance
window.dailyRewards = new DailyRewardsSystem();
