// ============================================
// ACHIEVEMENTS SYSTEM
// ============================================

class AchievementsSystem {
    constructor() {
        this.achievements = {
            // Login Streaks
            'first-login': {
                id: 'first-login',
                name: 'Welcome Aboard',
                description: 'Complete your first login',
                icon: '👋',
                xp: 100,
                category: 'login',
                unlocked: false
            },
            'streak-3': {
                id: 'streak-3',
                name: 'Getting Started',
                description: 'Login 3 days in a row',
                icon: '🔥',
                xp: 200,
                category: 'login',
                unlocked: false
            },
            'streak-7': {
                id: 'streak-7',
                name: 'Week Warrior',
                description: 'Login 7 days in a row',
                icon: '⚡',
                xp: 500,
                category: 'login',
                unlocked: false
            },
            'streak-30': {
                id: 'streak-30',
                name: 'Monthly Master',
                description: 'Login 30 days in a row',
                icon: '🌟',
                xp: 2000,
                category: 'login',
                unlocked: false
            },
            'streak-100': {
                id: 'streak-100',
                name: 'Century Club',
                description: 'Login 100 days in a row',
                icon: '👑',
                xp: 10000,
                category: 'login',
                unlocked: false
            },

            // Rank Achievements
            'rank-bronze': {
                id: 'rank-bronze',
                name: 'Bronze Rookie',
                description: 'Reach Bronze rank',
                icon: '🥉',
                xp: 100,
                category: 'rank',
                unlocked: false
            },
            'rank-silver': {
                id: 'rank-silver',
                name: 'Silver Scout',
                description: 'Reach Silver rank',
                icon: '🥈',
                xp: 300,
                category: 'rank',
                unlocked: false
            },
            'rank-gold': {
                id: 'rank-gold',
                name: 'Golden Pro',
                description: 'Reach Gold rank',
                icon: '🥇',
                xp: 800,
                category: 'rank',
                unlocked: false
            },
            'rank-platinum': {
                id: 'rank-platinum',
                name: 'Platinum Elite',
                description: 'Reach Platinum rank',
                icon: '💎',
                xp: 2000,
                category: 'rank',
                unlocked: false
            },
            'rank-diamond': {
                id: 'rank-diamond',
                name: 'Diamond Legend',
                description: 'Reach Diamond rank',
                icon: '💠',
                xp: 5000,
                category: 'rank',
                unlocked: false
            },

            // Betting Achievements
            'first-bet': {
                id: 'first-bet',
                name: 'First Wager',
                description: 'Place your first bet',
                icon: '🎲',
                xp: 100,
                category: 'betting',
                unlocked: false
            },
            'win-10': {
                id: 'win-10',
                name: 'Hot Streak',
                description: 'Win 10 bets',
                icon: '🔥',
                xp: 500,
                category: 'betting',
                unlocked: false
            },
            'win-50': {
                id: 'win-50',
                name: 'Betting Master',
                description: 'Win 50 bets',
                icon: '⭐',
                xp: 2500,
                category: 'betting',
                unlocked: false
            },
            'perfect-parlay': {
                id: 'perfect-parlay',
                name: 'Parlay Perfect',
                description: 'Win a 5-leg parlay',
                icon: '🎯',
                xp: 1000,
                category: 'betting',
                unlocked: false
            },

            // Tournament Achievements
            'tournament-entry': {
                id: 'tournament-entry',
                name: 'Tournament Debut',
                description: 'Enter your first tournament',
                icon: '🏆',
                xp: 200,
                category: 'tournament',
                unlocked: false
            },
            'tournament-win': {
                id: 'tournament-win',
                name: 'Champion',
                description: 'Win a tournament',
                icon: '👑',
                xp: 1500,
                category: 'tournament',
                unlocked: false
            },
            'tournament-3wins': {
                id: 'tournament-3wins',
                name: 'Triple Threat',
                description: 'Win 3 tournaments',
                icon: '🔱',
                xp: 5000,
                category: 'tournament',
                unlocked: false
            },

            // Coins Achievements
            'coins-1k': {
                id: 'coins-1k',
                name: 'Starter Saver',
                description: 'Earn 1,000 total coins',
                icon: '💰',
                xp: 100,
                category: 'coins',
                unlocked: false
            },
            'coins-10k': {
                id: 'coins-10k',
                name: 'Coin Collector',
                description: 'Earn 10,000 total coins',
                icon: '💸',
                xp: 500,
                category: 'coins',
                unlocked: false
            },
            'coins-100k': {
                id: 'coins-100k',
                name: 'Wealthy Winner',
                description: 'Earn 100,000 total coins',
                icon: '🤑',
                xp: 2000,
                category: 'coins',
                unlocked: false
            },
            'coins-1m': {
                id: 'coins-1m',
                name: 'Millionaire',
                description: 'Earn 1,000,000 total coins',
                icon: '💎',
                xp: 10000,
                category: 'coins',
                unlocked: false
            },

            // Social Achievements
            'chat-first': {
                id: 'chat-first',
                name: 'Social Butterfly',
                description: 'Send your first chat message',
                icon: '💬',
                xp: 50,
                category: 'social',
                unlocked: false
            },
            'shop-first': {
                id: 'shop-first',
                name: 'First Purchase',
                description: 'Buy your first item from shop',
                icon: '🛍️',
                xp: 100,
                category: 'social',
                unlocked: false
            }
        };

        this.userStats = this.loadStats();
        this.init();
    }

    init() {
        this.loadAchievements();
        this.checkLoginStreak();
        console.log('✅ Achievements system initialized');
    }

    loadStats() {
        const saved = localStorage.getItem('user_stats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            xp: 0,
            level: 1,
            rank: 'Unranked',
            loginStreak: 0,
            lastLogin: null,
            totalLogins: 0,
            totalCoinsEarned: 0,
            totalBetsPlaced: 0,
            totalBetsWon: 0,
            tournamentsEntered: 0,
            tournamentsWon: 0,
            chatMessagesSent: 0,
            itemsPurchased: 0,
            xpBoostActive: false,
            xpBoostExpiry: null,
            permanentXPBoost: 0 // Percentage boost
        };
    }

    saveStats() {
        localStorage.setItem('user_stats', JSON.stringify(this.userStats));
    }

    loadAchievements() {
        const saved = localStorage.getItem('achievements_unlocked');
        if (saved) {
            const unlocked = JSON.parse(saved);
            unlocked.forEach(id => {
                if (this.achievements[id]) {
                    this.achievements[id].unlocked = true;
                }
            });
        }
    }

    saveAchievements() {
        const unlocked = Object.values(this.achievements)
            .filter(a => a.unlocked)
            .map(a => a.id);
        localStorage.setItem('achievements_unlocked', JSON.stringify(unlocked));
    }

    unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return false;

        achievement.unlocked = true;
        this.saveAchievements();
        
        // Award XP
        this.addXP(achievement.xp, `Achievement: ${achievement.name}`);

        // Show notification
        this.showAchievementNotification(achievement);
        
        // Refresh showcase if visible
        if (window.achievementsShowcase) {
            window.achievementsShowcase.refresh();
        }
        
        return true;
    }

    showAchievementNotification(achievement) {
        if (typeof showToast !== 'undefined') {
            showToast(`🎉 Achievement Unlocked: ${achievement.name} (+${achievement.xp} XP)`, 'success');
        }
        
        // Play sound if available
        if (window.soundEffects) {
            window.soundEffects.playSound('achievement');
        }

        // Show confetti if available
        if (window.confetti) {
            window.confetti.celebrate();
        }
    }

    addXP(amount, reason = 'Activity') {
        // Apply boosts
        let finalAmount = amount;
        
        // Temporary boost
        if (this.userStats.xpBoostActive && Date.now() < this.userStats.xpBoostExpiry) {
            finalAmount *= 2; // 2x boost
        }
        
        // Permanent boost (from Blue Diamond Ring)
        if (this.userStats.permanentXPBoost > 0) {
            finalAmount *= (1 + this.userStats.permanentXPBoost / 100);
        }

        this.userStats.xp += Math.floor(finalAmount);
        this.checkLevelUp();
        this.updateRank();
        this.saveStats();

        console.log(`➕ XP: +${Math.floor(finalAmount)} (${reason})`);
    }

    checkLevelUp() {
        const xpForNextLevel = this.getXPForLevel(this.userStats.level + 1);
        if (this.userStats.xp >= xpForNextLevel) {
            this.userStats.level++;
            if (typeof showToast !== 'undefined') {
                showToast(`🎊 Level Up! You're now Level ${this.userStats.level}!`, 'success');
            }
            this.checkLevelUp(); // Check for multiple level ups
        }
    }

    getXPForLevel(level) {
        // Formula: level^2 * 100
        return Math.pow(level, 2) * 100;
    }

    updateRank() {
        const xp = this.userStats.xp;
        let newRank = 'Unranked';

        if (xp >= 100000) newRank = 'Diamond';
        else if (xp >= 50000) newRank = 'Platinum';
        else if (xp >= 20000) newRank = 'Gold';
        else if (xp >= 5000) newRank = 'Silver';
        else if (xp >= 1000) newRank = 'Bronze';

        if (newRank !== this.userStats.rank) {
            const oldRank = this.userStats.rank;
            this.userStats.rank = newRank;
            
            // Unlock rank achievement
            const rankId = `rank-${newRank.toLowerCase()}`;
            if (this.achievements[rankId]) {
                this.unlockAchievement(rankId);
            }

            if (oldRank !== 'Unranked') {
                if (typeof showToast !== 'undefined') {
                    showToast(`⬆️ Rank Up! You've reached ${newRank} rank!`, 'success');
                }
            }
        }
    }

    checkLoginStreak() {
        const today = new Date().toDateString();
        const lastLogin = this.userStats.lastLogin;

        if (lastLogin !== today) {
            // New day login
            if (lastLogin) {
                const lastDate = new Date(lastLogin);
                const todayDate = new Date(today);
                const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Consecutive day
                    this.userStats.loginStreak++;
                } else if (diffDays > 1) {
                    // Streak broken
                    this.userStats.loginStreak = 1;
                }
            } else {
                // First ever login
                this.userStats.loginStreak = 1;
                this.unlockAchievement('first-login');
            }

            this.userStats.lastLogin = today;
            this.userStats.totalLogins++;
            this.addXP(10, 'Daily Login');

            // Check streak achievements
            const streak = this.userStats.loginStreak;
            if (streak === 3) this.unlockAchievement('streak-3');
            if (streak === 7) this.unlockAchievement('streak-7');
            if (streak === 30) this.unlockAchievement('streak-30');
            if (streak === 100) this.unlockAchievement('streak-100');

            this.saveStats();
        }
    }

    activateXPBoost(durationHours = 1) {
        this.userStats.xpBoostActive = true;
        this.userStats.xpBoostExpiry = Date.now() + (durationHours * 60 * 60 * 1000);
        this.saveStats();
        
        if (typeof showToast !== 'undefined') {
            showToast(`⚡ XP Boost Active! 2x XP for ${durationHours} hour(s)!`, 'success');
        }
    }

    addPermanentXPBoost(percentage) {
        this.userStats.permanentXPBoost += percentage;
        this.saveStats();
    }

    getProgress() {
        const currentLevelXP = this.getXPForLevel(this.userStats.level);
        const nextLevelXP = this.getXPForLevel(this.userStats.level + 1);
        const xpInCurrentLevel = this.userStats.xp - currentLevelXP;
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
        const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

        return {
            level: this.userStats.level,
            xp: this.userStats.xp,
            currentLevelXP,
            nextLevelXP,
            xpInCurrentLevel,
            xpNeededForNextLevel,
            progress: Math.min(100, Math.max(0, progress))
        };
    }

    getAchievementsByCategory(category) {
        return Object.values(this.achievements).filter(a => a.category === category);
    }

    getUnlockedCount() {
        return Object.values(this.achievements).filter(a => a.unlocked).length;
    }

    getTotalCount() {
        return Object.values(this.achievements).length;
    }
}

// Create global instance
const achievementsSystem = new AchievementsSystem();
window.achievementsSystem = achievementsSystem;
