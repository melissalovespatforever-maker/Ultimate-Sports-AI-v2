// ============================================
// TIER RESTRICTIONS MODULE
// Enforce subscription tier limits across all features
// ============================================

console.log('🔒 Loading Tier Restrictions Module');

class TierRestrictions {
    constructor() {
        this.currentTier = 'free';
        this.tierLimits = {
            free: {
                // Mini-Games Limits
                maxDailyGames: 5,
                maxBetAmount: 100,
                minBetAmount: 10,
                gameAccess: ['slots', 'wheel', 'coinflip', 'penalty', 'trivia'], // All games but limited plays
                
                // AI Coaches
                maxCoachAccess: 3, // Only 3 coaches
                aiPredictions: false,
                coachChat: false,
                
                // Sports Lounge
                loungeAccess: true,
                chatMessages: 20, // 20 messages per day
                leaderboardAccess: false,
                
                // Profile & Features
                customAvatar: false,
                gameHistory: 10, // Last 10 games only
                achievements: false,
                
                // General
                dailyCoins: 100,
                maxCoins: 5000,
                adFree: false
            },
            pro: {
                // Mini-Games Limits
                maxDailyGames: 15,
                maxBetAmount: 500,
                minBetAmount: 10,
                gameAccess: ['slots', 'wheel', 'coinflip', 'penalty', 'trivia'], // All games
                
                // AI Coaches
                maxCoachAccess: 8, // 8 coaches
                aiPredictions: true,
                coachChat: true,
                
                // Sports Lounge
                loungeAccess: true,
                chatMessages: 100, // 100 messages per day
                leaderboardAccess: true,
                
                // Profile & Features
                customAvatar: true,
                gameHistory: 50, // Last 50 games
                achievements: true,
                
                // General
                dailyCoins: 500,
                maxCoins: 25000,
                adFree: false
            },
            vip: {
                // Mini-Games Limits
                maxDailyGames: -1, // Unlimited
                maxBetAmount: 2000,
                minBetAmount: 10,
                gameAccess: ['slots', 'wheel', 'coinflip', 'penalty', 'trivia'], // All games + exclusive
                
                // AI Coaches
                maxCoachAccess: -1, // All coaches
                aiPredictions: true,
                coachChat: true,
                
                // Sports Lounge
                loungeAccess: true,
                chatMessages: -1, // Unlimited
                leaderboardAccess: true,
                
                // Profile & Features
                customAvatar: true,
                gameHistory: -1, // Unlimited
                achievements: true,
                
                // General
                dailyCoins: 2000,
                maxCoins: -1, // Unlimited
                adFree: true
            }
        };

        this.dailyUsage = this.loadDailyUsage();
        this.init();
    }

    init() {
        this.updateTierFromUser();
        
        // Subscribe to auth state changes
        if (typeof appState !== 'undefined') {
            appState.subscribe(() => this.updateTierFromUser());
        }

        // Reset daily usage at midnight
        this.scheduleDailyReset();
    }

    updateTierFromUser() {
        if (typeof appState !== 'undefined' && appState.user) {
            this.currentTier = appState.user.subscription_tier || 'free';
        } else {
            // Check localStorage for offline mode
            const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
            this.currentTier = profile.subscriptionTier || 'free';
        }
        
        console.log(`🔒 Current tier: ${this.currentTier.toUpperCase()}`);
    }

    // ============================================
    // MINI-GAMES RESTRICTIONS
    // ============================================

    canPlayGame(gameName) {
        const limits = this.tierLimits[this.currentTier];
        const gameMap = {
            'Lucky Slots': 'slots',
            'Prize Wheel': 'wheel',
            'Coin Flip': 'coinflip',
            'Penalty Shootout': 'penalty',
            'Sports Trivia': 'trivia'
        };

        const gameId = gameMap[gameName] || gameName.toLowerCase();

        // Check game access
        if (!limits.gameAccess.includes(gameId)) {
            return {
                allowed: false,
                reason: `${gameName} is only available for PRO and VIP members`,
                upgradeRequired: 'pro'
            };
        }

        // Check daily limit
        if (limits.maxDailyGames !== -1) {
            const played = this.dailyUsage.gamesPlayed || 0;
            if (played >= limits.maxDailyGames) {
                return {
                    allowed: false,
                    reason: `Daily game limit reached (${limits.maxDailyGames} games). Upgrade for more!`,
                    upgradeRequired: 'pro'
                };
            }
        }

        return { allowed: true };
    }

    canPlaceBet(amount) {
        const limits = this.tierLimits[this.currentTier];

        if (amount < limits.minBetAmount) {
            return {
                allowed: false,
                reason: `Minimum bet is ${limits.minBetAmount} coins`
            };
        }

        if (amount > limits.maxBetAmount) {
            return {
                allowed: false,
                reason: `Maximum bet for ${this.currentTier.toUpperCase()} tier is ${limits.maxBetAmount} coins. Upgrade for higher limits!`,
                upgradeRequired: this.currentTier === 'free' ? 'pro' : 'vip'
            };
        }

        return { allowed: true };
    }

    trackGamePlayed() {
        this.dailyUsage.gamesPlayed = (this.dailyUsage.gamesPlayed || 0) + 1;
        this.saveDailyUsage();
    }

    getGameLimits() {
        const limits = this.tierLimits[this.currentTier];
        const played = this.dailyUsage.gamesPlayed || 0;

        return {
            tier: this.currentTier,
            maxDailyGames: limits.maxDailyGames,
            gamesPlayedToday: played,
            gamesRemaining: limits.maxDailyGames === -1 ? -1 : Math.max(0, limits.maxDailyGames - played),
            maxBetAmount: limits.maxBetAmount,
            minBetAmount: limits.minBetAmount,
            availableGames: limits.gameAccess
        };
    }

    // ============================================
    // COACH RESTRICTIONS
    // ============================================

    canAccessCoach(coachIndex) {
        const limits = this.tierLimits[this.currentTier];
        
        if (limits.maxCoachAccess === -1) {
            return { allowed: true }; // VIP: All coaches
        }

        if (coachIndex < limits.maxCoachAccess) {
            return { allowed: true };
        }

        return {
            allowed: false,
            reason: `This coach is only available for ${limits.maxCoachAccess === 3 ? 'PRO' : 'VIP'} members`,
            upgradeRequired: limits.maxCoachAccess === 3 ? 'pro' : 'vip'
        };
    }

    canUseCoachFeature(feature) {
        const limits = this.tierLimits[this.currentTier];

        switch(feature) {
            case 'predictions':
                if (!limits.aiPredictions) {
                    return {
                        allowed: false,
                        reason: 'AI Predictions are only available for PRO and VIP members',
                        upgradeRequired: 'pro'
                    };
                }
                break;

            case 'chat':
                if (!limits.coachChat) {
                    return {
                        allowed: false,
                        reason: 'Coach Chat is only available for PRO and VIP members',
                        upgradeRequired: 'pro'
                    };
                }
                break;
        }

        return { allowed: true };
    }

    // ============================================
    // SPORTS LOUNGE RESTRICTIONS
    // ============================================

    canSendChatMessage() {
        const limits = this.tierLimits[this.currentTier];
        
        if (limits.chatMessages === -1) {
            return { allowed: true }; // Unlimited
        }

        const sent = this.dailyUsage.chatMessages || 0;
        if (sent >= limits.chatMessages) {
            return {
                allowed: false,
                reason: `Daily message limit reached (${limits.chatMessages} messages). Upgrade for more!`,
                upgradeRequired: 'pro'
            };
        }

        return { allowed: true };
    }

    trackChatMessage() {
        this.dailyUsage.chatMessages = (this.dailyUsage.chatMessages || 0) + 1;
        this.saveDailyUsage();
    }

    canAccessLeaderboard() {
        const limits = this.tierLimits[this.currentTier];
        
        if (!limits.leaderboardAccess) {
            return {
                allowed: false,
                reason: 'Leaderboards are only available for PRO and VIP members',
                upgradeRequired: 'pro'
            };
        }

        return { allowed: true };
    }

    // ============================================
    // PROFILE RESTRICTIONS
    // ============================================

    canCustomizeAvatar() {
        const limits = this.tierLimits[this.currentTier];
        
        if (!limits.customAvatar) {
            return {
                allowed: false,
                reason: 'Custom avatars are only available for PRO and VIP members',
                upgradeRequired: 'pro'
            };
        }

        return { allowed: true };
    }

    getGameHistoryLimit() {
        const limits = this.tierLimits[this.currentTier];
        return limits.gameHistory;
    }

    canViewAchievements() {
        const limits = this.tierLimits[this.currentTier];
        
        if (!limits.achievements) {
            return {
                allowed: false,
                reason: 'Achievements are only available for PRO and VIP members',
                upgradeRequired: 'pro'
            };
        }

        return { allowed: true };
    }

    // ============================================
    // COIN LIMITS
    // ============================================

    canReceiveCoins(amount) {
        const limits = this.tierLimits[this.currentTier];
        const currentBalance = parseInt(localStorage.getItem('sportsLounge_balance')) || 0;

        if (limits.maxCoins === -1) {
            return { allowed: true }; // Unlimited
        }

        if (currentBalance + amount > limits.maxCoins) {
            return {
                allowed: false,
                reason: `${this.currentTier.toUpperCase()} tier has a maximum balance of ${limits.maxCoins} coins. Upgrade for higher limits!`,
                upgradeRequired: this.currentTier === 'free' ? 'pro' : 'vip'
            };
        }

        return { allowed: true };
    }

    getDailyCoinsBonus() {
        const limits = this.tierLimits[this.currentTier];
        return limits.dailyCoins;
    }

    // ============================================
    // DAILY USAGE TRACKING
    // ============================================

    loadDailyUsage() {
        const stored = localStorage.getItem('daily_usage');
        if (!stored) {
            return this.resetDailyUsage();
        }

        const data = JSON.parse(stored);
        const today = new Date().toDateString();

        // Reset if it's a new day
        if (data.date !== today) {
            return this.resetDailyUsage();
        }

        return data;
    }

    saveDailyUsage() {
        localStorage.setItem('daily_usage', JSON.stringify(this.dailyUsage));
    }

    resetDailyUsage() {
        this.dailyUsage = {
            date: new Date().toDateString(),
            gamesPlayed: 0,
            chatMessages: 0,
            coinsEarned: 0
        };
        this.saveDailyUsage();
        return this.dailyUsage;
    }

    scheduleDailyReset() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        setTimeout(() => {
            this.resetDailyUsage();
            // Schedule next reset
            this.scheduleDailyReset();
        }, msUntilMidnight);
    }

    // ============================================
    // UI HELPERS
    // ============================================

    showUpgradePrompt(restriction) {
        if (typeof showUpgradeModal !== 'undefined') {
            showUpgradeModal(restriction.upgradeRequired, restriction.reason);
        } else {
            alert(`${restriction.reason}\n\nUpgrade to ${restriction.upgradeRequired.toUpperCase()} for full access!`);
        }
    }

    getTierBenefits(tier) {
        const limits = this.tierLimits[tier];
        return {
            tier: tier,
            games: limits.maxDailyGames === -1 ? 'Unlimited' : `${limits.maxDailyGames} per day`,
            maxBet: `${limits.maxBetAmount} coins`,
            coaches: limits.maxCoachAccess === -1 ? 'All Coaches' : `${limits.maxCoachAccess} Coaches`,
            predictions: limits.aiPredictions ? 'Yes' : 'No',
            chat: limits.chatMessages === -1 ? 'Unlimited' : `${limits.chatMessages} per day`,
            leaderboards: limits.leaderboardAccess ? 'Yes' : 'No',
            achievements: limits.achievements ? 'Yes' : 'No',
            adFree: limits.adFree ? 'Yes' : 'No',
            dailyBonus: `${limits.dailyCoins} coins`,
            maxBalance: limits.maxCoins === -1 ? 'Unlimited' : `${limits.maxCoins} coins`
        };
    }

    getCurrentTierInfo() {
        return {
            tier: this.currentTier,
            benefits: this.getTierBenefits(this.currentTier),
            limits: this.getGameLimits(),
            usage: this.dailyUsage
        };
    }
}

// Initialize tier restrictions
const tierRestrictions = new TierRestrictions();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TierRestrictions;
}

console.log('✅ Tier Restrictions Module Loaded');
