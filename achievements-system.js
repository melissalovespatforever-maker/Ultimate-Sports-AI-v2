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
                unlocked: false,
                series: 'login-streak',
                tier: 0,
                targetValue: 1,
                progressType: 'totalLogins'
            },
            'streak-3': {
                id: 'streak-3',
                name: 'Getting Started',
                description: 'Login 3 days in a row',
                icon: '🔥',
                xp: 200,
                category: 'login',
                unlocked: false,
                series: 'login-streak',
                tier: 1,
                targetValue: 3,
                progressType: 'loginStreak'
            },
            'streak-7': {
                id: 'streak-7',
                name: 'Week Warrior',
                description: 'Login 7 days in a row',
                icon: '⚡',
                xp: 500,
                category: 'login',
                unlocked: false,
                series: 'login-streak',
                tier: 2,
                targetValue: 7,
                progressType: 'loginStreak'
            },
            'streak-30': {
                id: 'streak-30',
                name: 'Monthly Master',
                description: 'Login 30 days in a row',
                icon: '🌟',
                xp: 2000,
                category: 'login',
                unlocked: false,
                series: 'login-streak',
                tier: 3,
                targetValue: 30,
                progressType: 'loginStreak'
            },
            'streak-100': {
                id: 'streak-100',
                name: 'Century Club',
                description: 'Login 100 days in a row',
                icon: '👑',
                xp: 10000,
                category: 'login',
                unlocked: false,
                series: 'login-streak',
                tier: 4,
                targetValue: 100,
                progressType: 'loginStreak'
            },

            // Rank Achievements
            'rank-bronze': {
                id: 'rank-bronze',
                name: 'Bronze Rookie',
                description: 'Reach Bronze rank',
                icon: '🥉',
                xp: 100,
                category: 'rank',
                unlocked: false,
                series: 'rank-up',
                tier: 1,
                targetValue: 1000,
                progressType: 'xp'
            },
            'rank-silver': {
                id: 'rank-silver',
                name: 'Silver Scout',
                description: 'Reach Silver rank',
                icon: '🥈',
                xp: 300,
                category: 'rank',
                unlocked: false,
                series: 'rank-up',
                tier: 2,
                targetValue: 5000,
                progressType: 'xp'
            },
            'rank-gold': {
                id: 'rank-gold',
                name: 'Golden Pro',
                description: 'Reach Gold rank',
                icon: '🥇',
                xp: 800,
                category: 'rank',
                unlocked: false,
                series: 'rank-up',
                tier: 3,
                targetValue: 20000,
                progressType: 'xp'
            },
            'rank-platinum': {
                id: 'rank-platinum',
                name: 'Platinum Elite',
                description: 'Reach Platinum rank',
                icon: '💎',
                xp: 2000,
                category: 'rank',
                unlocked: false,
                series: 'rank-up',
                tier: 4,
                targetValue: 50000,
                progressType: 'xp'
            },
            'rank-diamond': {
                id: 'rank-diamond',
                name: 'Diamond Legend',
                description: 'Reach Diamond rank',
                icon: '💠',
                xp: 5000,
                category: 'rank',
                unlocked: false,
                series: 'rank-up',
                tier: 5,
                targetValue: 100000,
                progressType: 'xp'
            },

            // Betting Achievements
            'first-bet': {
                id: 'first-bet',
                name: 'First Wager',
                description: 'Place your first bet',
                icon: '🎲',
                xp: 100,
                category: 'betting',
                unlocked: false,
                series: 'betting-volume',
                tier: 1,
                targetValue: 1,
                progressType: 'totalBetsPlaced'
            },
            'win-10': {
                id: 'win-10',
                name: 'Hot Streak',
                description: 'Win 10 bets',
                icon: '🔥',
                xp: 500,
                category: 'betting',
                unlocked: false,
                series: 'betting-wins',
                tier: 1,
                targetValue: 10,
                progressType: 'totalBetsWon'
            },
            'win-50': {
                id: 'win-50',
                name: 'Betting Master',
                description: 'Win 50 bets',
                icon: '⭐',
                xp: 2500,
                category: 'betting',
                unlocked: false,
                series: 'betting-wins',
                tier: 2,
                targetValue: 50,
                progressType: 'totalBetsWon'
            },
            'perfect-parlay': {
                id: 'perfect-parlay',
                name: 'Parlay Perfect',
                description: 'Win a 5-leg parlay',
                icon: '🎯',
                xp: 1000,
                category: 'betting',
                unlocked: false,
                // Unique achievement, no series
            },

            // Tournament Achievements
            'tournament-entry': {
                id: 'tournament-entry',
                name: 'Tournament Debut',
                description: 'Enter your first tournament',
                icon: '🏆',
                xp: 200,
                category: 'tournament',
                unlocked: false,
                series: 'tournament-participation',
                tier: 1,
                targetValue: 1,
                progressType: 'tournamentsEntered'
            },
            'tournament-win': {
                id: 'tournament-win',
                name: 'Champion',
                description: 'Win a tournament',
                icon: '👑',
                xp: 1500,
                category: 'tournament',
                unlocked: false,
                series: 'tournament-wins',
                tier: 1,
                targetValue: 1,
                progressType: 'tournamentsWon'
            },
            'tournament-3wins': {
                id: 'tournament-3wins',
                name: 'Triple Threat',
                description: 'Win 3 tournaments',
                icon: '🔱',
                xp: 5000,
                category: 'tournament',
                unlocked: false,
                series: 'tournament-wins',
                tier: 2,
                targetValue: 3,
                progressType: 'tournamentsWon'
            },
            'tournament-5wins': {
                id: 'tournament-5wins',
                name: 'Tournament Master',
                description: 'Win 5 tournaments',
                icon: '💍',
                xp: 10000,
                category: 'tournament',
                unlocked: false,
                series: 'tournament-wins',
                tier: 3,
                targetValue: 5,
                progressType: 'tournamentsWon'
            },
            'perfect-season': {
                id: 'perfect-season',
                name: 'Perfect Season',
                description: 'Win every battle for 30 days',
                icon: '✨',
                xp: 25000,
                category: 'tournament',
                unlocked: false,
                targetValue: 30,
                progressType: 'perfectDays'
            },
            'hall-of-fame': {
                id: 'hall-of-fame',
                name: 'Hall of Fame',
                description: 'Reach Legendary tier status',
                icon: '🏛️',
                xp: 50000,
                category: 'rank',
                unlocked: false,
                targetValue: 1000000,
                progressType: 'xp'
            },

            // Sport Specific Trophies
            'nfl-champ': {
                id: 'nfl-champ',
                name: 'Gridiron Greatness',
                description: 'Win an NFL themed tournament',
                icon: '🏈',
                xp: 2000,
                category: 'tournament',
                unlocked: false
            },
            'nba-champ': {
                id: 'nba-champ',
                name: 'Dunk Master',
                description: 'Win an NBA themed tournament',
                icon: '🏀',
                xp: 2000,
                category: 'tournament',
                unlocked: false
            },
            'mlb-champ': {
                id: 'mlb-champ',
                name: 'World Series Winner',
                description: 'Win an MLB themed tournament',
                icon: '⚾',
                xp: 2000,
                category: 'tournament',
                unlocked: false
            },
            'soccer-champ': {
                id: 'soccer-champ',
                name: 'Golden Boot',
                description: 'Win a Soccer themed tournament',
                icon: '⚽',
                xp: 2000,
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
                unlocked: false,
                series: 'wealth',
                tier: 1,
                targetValue: 1000,
                progressType: 'totalCoinsEarned'
            },
            'coins-10k': {
                id: 'coins-10k',
                name: 'Coin Collector',
                description: 'Earn 10,000 total coins',
                icon: '💸',
                xp: 500,
                category: 'coins',
                unlocked: false,
                series: 'wealth',
                tier: 2,
                targetValue: 10000,
                progressType: 'totalCoinsEarned'
            },
            'coins-100k': {
                id: 'coins-100k',
                name: 'Wealthy Winner',
                description: 'Earn 100,000 total coins',
                icon: '🤑',
                xp: 2000,
                category: 'coins',
                unlocked: false,
                series: 'wealth',
                tier: 3,
                targetValue: 100000,
                progressType: 'totalCoinsEarned'
            },
            'coins-1m': {
                id: 'coins-1m',
                name: 'Millionaire',
                description: 'Earn 1,000,000 total coins',
                icon: '💎',
                xp: 10000,
                category: 'coins',
                unlocked: false,
                series: 'wealth',
                tier: 4,
                targetValue: 1000000,
                progressType: 'totalCoinsEarned'
            },

            // Social Achievements
            'chat-first': {
                id: 'chat-first',
                name: 'Social Butterfly',
                description: 'Send your first chat message',
                icon: '💬',
                xp: 50,
                category: 'social',
                unlocked: false,
                series: 'social-chat',
                tier: 1,
                targetValue: 1,
                progressType: 'chatMessagesSent'
            },
            'shop-first': {
                id: 'shop-first',
                name: 'First Purchase',
                description: 'Buy your first item from shop',
                icon: '🛍️',
                xp: 100,
                category: 'social',
                unlocked: false,
                series: 'shopping',
                tier: 1,
                targetValue: 1,
                progressType: 'itemsPurchased'
            },

            // Minigame Achievements
            'minigame-master': {
                id: 'minigame-master',
                name: 'Game Master',
                description: 'Win at least 1 game in 5 different minigames',
                icon: '🎮',
                xp: 1000,
                category: 'minigames',
                unlocked: false,
                targetValue: 5,
                progressType: 'uniqueMinigamesWon'
            },
            'minigame-veteran': {
                id: 'minigame-veteran',
                name: 'Veteran Player',
                description: 'Win at least 1 game in all 11 minigames',
                icon: '🏅',
                xp: 5000,
                category: 'minigames',
                unlocked: false,
                targetValue: 11,
                progressType: 'uniqueMinigamesWon'
            },
            'lucky-streak': {
                id: 'lucky-streak',
                name: 'Lucky Streak',
                description: 'Win 5 Coin Flips in a row',
                icon: '🍀',
                xp: 500,
                category: 'minigames',
                unlocked: false
            },
            'plinko-jackpot': {
                id: 'plinko-jackpot',
                name: 'Plinko Jackpot',
                description: 'Hit the jackpot in Plinko',
                icon: '💥',
                xp: 750,
                category: 'minigames',
                unlocked: false
            },
            'slots-triple': {
                id: 'slots-triple',
                name: 'Triple Sevens',
                description: 'Get three 7s in Slots',
                icon: '🎰',
                xp: 1000,
                category: 'minigames',
                unlocked: false
            },
            'basketball-sharpshooter': {
                id: 'basketball-sharpshooter',
                name: 'Sharpshooter',
                description: 'Score 100+ points in Basketball',
                icon: '🎯',
                xp: 600,
                category: 'minigames',
                unlocked: false
            },
            'trivia-genius': {
                id: 'trivia-genius',
                name: 'Sports Genius',
                description: 'Answer 10 trivia questions correctly in a row',
                icon: '🧠',
                xp: 800,
                category: 'minigames',
                unlocked: false
            },
            'sim-undefeated': {
                id: 'sim-undefeated',
                name: 'Undefeated Season',
                description: 'Win 10 games in a row in Football Sim',
                icon: '🏆',
                xp: 1500,
                category: 'minigames',
                unlocked: false
            },

            // Collection Achievements
            'collector-starter': {
                id: 'collector-starter',
                name: 'Card Collector',
                description: 'Collect 10 unique player cards',
                icon: '🃏',
                xp: 200,
                category: 'collection',
                unlocked: false,
                series: 'collection',
                tier: 1,
                targetValue: 10,
                progressType: 'uniqueCardsOwned'
            },
            'collector-pro': {
                id: 'collector-pro',
                name: 'Elite Collector',
                description: 'Collect 50 unique player cards',
                icon: '📚',
                xp: 1000,
                category: 'collection',
                unlocked: false,
                series: 'collection',
                tier: 2,
                targetValue: 50,
                progressType: 'uniqueCardsOwned'
            },
            'collector-master': {
                id: 'collector-master',
                name: 'Master Collector',
                description: 'Collect 100 unique player cards',
                icon: '📖',
                xp: 5000,
                category: 'collection',
                unlocked: false,
                series: 'collection',
                tier: 3,
                targetValue: 100,
                progressType: 'uniqueCardsOwned'
            },
            'legend-owner': {
                id: 'legend-owner',
                name: 'Legend Owner',
                description: 'Own 5 Legend players',
                icon: '⭐',
                xp: 2000,
                category: 'collection',
                unlocked: false,
                targetValue: 5,
                progressType: 'legendsOwned'
            },

            // Special Event Achievements
            'early-adopter': {
                id: 'early-adopter',
                name: 'Early Adopter',
                description: 'Join during beta period',
                icon: '🚀',
                xp: 1000,
                category: 'special',
                unlocked: false,
                rarity: 'legendary'
            },
            'comeback-kid': {
                id: 'comeback-kid',
                name: 'Comeback Kid',
                description: 'Return after 30 days of inactivity',
                icon: '🔄',
                xp: 500,
                category: 'special',
                unlocked: false
            },
            'night-owl': {
                id: 'night-owl',
                name: 'Night Owl',
                description: 'Play between 2 AM - 5 AM',
                icon: '🦉',
                xp: 100,
                category: 'special',
                unlocked: false
            },
            'referral-master': {
                id: 'referral-master',
                name: 'Referral Master',
                description: 'Refer 10 friends',
                icon: '🤝',
                xp: 3000,
                category: 'social',
                unlocked: false,
                targetValue: 10,
                progressType: 'referralsCompleted'
            }
        };

        this.userStats = this.loadStats();
        this.init();
    }

    init() {
        this.loadAchievements();
        this.checkLoginStreak();
        // Initial check for any already completed but locked achievements
        setTimeout(() => {
            this.checkAchievements();
            this.checkSpecialAchievements();
        }, 1000); 
        console.log('✅ Achievements system initialized');
    }

    addStat(statName, value = 1) {
        if (typeof this.userStats[statName] === 'undefined') {
            this.userStats[statName] = 0;
        }
        
        this.userStats[statName] += value;
        this.saveStats();
        
        // Check achievements relevant to this stat
        this.checkAchievements(statName);
        
        // If specific stat listener exists (future proofing)
        if (this.onStatChange) this.onStatChange(statName, this.userStats[statName]);
    }

    checkAchievements(filterStat = null) {
        Object.values(this.achievements).forEach(achievement => {
            if (achievement.unlocked) return; // Already unlocked
            
            // Optimization: if filterStat is provided, only check achievements that track this stat
            if (filterStat && achievement.progressType !== filterStat) return;

            // Check if condition met
            if (achievement.progressType && typeof this.userStats[achievement.progressType] !== 'undefined') {
                const currentVal = this.userStats[achievement.progressType];
                if (currentVal >= achievement.targetValue) {
                    this.unlockAchievement(achievement.id);
                }
            }
        });
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
            permanentXPBoost: 0, // Percentage boost
            uniqueMinigamesWon: 0,
            uniqueCardsOwned: 0,
            legendsOwned: 0,
            referralsCompleted: 0,
            perfectDays: 0
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
        
        // Dispatch event for Shoutbox and other listeners
        window.dispatchEvent(new CustomEvent('achievementUnlocked', {
            detail: {
                id: achievement.id,
                name: achievement.name,
                xp: achievement.xp,
                icon: achievement.icon,
                rarity: achievement.rarity || (achievement.xp >= 5000 ? 'legendary' : achievement.xp >= 1000 ? 'rare' : 'common')
            }
        }));

        // Refresh showcase if visible
        if (window.achievementsShowcase) {
            window.achievementsShowcase.refresh();
        }

        // Broadcast unlock to leaderboards (real-time update)
        this.broadcastAchievementUnlock(achievementId, achievement);
        
        return true;
    }

    async broadcastAchievementUnlock(achievementId, achievement) {
        try {
            const username = localStorage.getItem('temp_username') || localStorage.getItem('username') || 'Player';
            
            // Broadcast via WebSocket if connected
            if (window.socket && window.socket.connected) {
                window.socket.emit('achievement:unlock', {
                    achievementId,
                    achievementName: achievement.name,
                    icon: achievement.icon,
                    xp: achievement.xp,
                    username: username,
                    timestamp: Date.now()
                });
            }

            // Also send to backend API for persistent leaderboard tracking
            const userId = localStorage.getItem('user_id');
            if (userId && window.CONFIG) {
                fetch(`${window.CONFIG.API_BASE_URL}/api/leaderboards-badges/broadcast-unlock`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    },
                    body: JSON.stringify({
                        userId,
                        achievementId
                    })
                }).catch(err => {
                    console.warn('Failed to broadcast achievement to backend:', err);
                });
            }
        } catch (error) {
            console.warn('Error broadcasting achievement:', error);
        }
    }

    showAchievementNotification(achievement) {
        // List of achievements that qualify for the "Trophy" notification
        const trophyAchievementIds = [
            'tournament-win', 'tournament-3wins', 'tournament-5wins',
            'nfl-champ', 'nba-champ', 'mlb-champ', 'soccer-champ',
            'rank-platinum', 'coins-100k', 'rank-diamond',
            'perfect-season', 'hall-of-fame'
        ];

        if (trophyAchievementIds.includes(achievement.id) && window.trophyNotification) {
            window.trophyNotification.show(achievement);
        } else {
            // Standard notification for non-trophy achievements
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

        const oldSeasonLevel = Math.floor(((this.userStats.tournamentsWon * 1000) + (this.userStats.xp / 10)) / 2000) + 1;

        this.userStats.xp += Math.floor(finalAmount);
        this.checkLevelUp();
        this.updateRank();
        
        // Check Season Level Up
        const newSeasonLevel = Math.floor(((this.userStats.tournamentsWon * 1000) + (this.userStats.xp / 10)) / 2000) + 1;
        if (newSeasonLevel > oldSeasonLevel) {
            if (typeof showToast !== 'undefined') {
                showToast(`🌟 Season Level Up! Reached Tier ${newSeasonLevel}`, 'success');
            }
        }

        this.saveStats();

        console.log(`➕ XP: +${Math.floor(finalAmount)} (${reason})`);
    }

    checkLevelUp() {
        const xpForNextLevel = this.getXPForLevel(this.userStats.level + 1);
        if (this.userStats.xp >= xpForNextLevel) {
            this.userStats.level++;
            
            // Trigger Mystery Box System
            if (window.mysteryBoxSystem) {
                window.mysteryBoxSystem.trigger(this.userStats.level);
            } else if (typeof showToast !== 'undefined') {
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

    // Progression Tier Helpers
    getAchievementProgress(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || !achievement.progressType) return null;

        const currentValue = this.userStats[achievement.progressType] || 0;
        const targetValue = achievement.targetValue || 0;
        
        // If it's a "total" stat, it accumulates. If it's a "streak", it can reset.
        // For now, we assume current value is what matters.
        
        return {
            current: currentValue,
            target: targetValue,
            percentage: Math.min(100, Math.max(0, (currentValue / targetValue) * 100)),
            isComplete: currentValue >= targetValue
        };
    }

    getAllSeries() {
        const seriesMap = {};
        
        Object.values(this.achievements).forEach(achievement => {
            if (achievement.series) {
                if (!seriesMap[achievement.series]) {
                    seriesMap[achievement.series] = [];
                }
                seriesMap[achievement.series].push(achievement);
            }
        });

        // Sort each series by tier
        Object.keys(seriesMap).forEach(seriesName => {
            seriesMap[seriesName].sort((a, b) => a.tier - b.tier);
        });

        return seriesMap;
    }

    // Helper method to track minigame wins
    recordMinigameWin(gameName) {
        // Track which unique minigames have been won
        const gamesWonKey = 'minigamesWon';
        let gamesWon = JSON.parse(localStorage.getItem(gamesWonKey) || '[]');
        
        if (!gamesWon.includes(gameName)) {
            gamesWon.push(gameName);
            localStorage.setItem(gamesWonKey, JSON.stringify(gamesWon));
            this.userStats.uniqueMinigamesWon = gamesWon.length;
            this.saveStats();
            
            // Check minigame achievements
            this.checkAchievements('uniqueMinigamesWon');
        }
    }

    // Helper method to unlock special achievements
    unlockSpecialAchievement(achievementId, reason = '') {
        const achievement = this.achievements[achievementId];
        if (!achievement) {
            console.warn(`Achievement ${achievementId} not found`);
            return false;
        }
        
        if (!achievement.unlocked) {
            console.log(`🎯 Special achievement unlocked: ${achievement.name}${reason ? ' (' + reason + ')' : ''}`);
            return this.unlockAchievement(achievementId);
        }
        
        return false;
    }

    // Check for time-based special achievements
    checkSpecialAchievements() {
        const hour = new Date().getHours();
        
        // Night Owl achievement
        if (hour >= 2 && hour < 5) {
            this.unlockSpecialAchievement('night-owl', 'Playing late at night');
        }
        
        // Check early adopter (if user joined before a certain date)
        const userCreated = localStorage.getItem('user_created_at');
        if (userCreated) {
            const createdDate = new Date(userCreated);
            const betaEndDate = new Date('2025-12-31'); // Adjust as needed
            if (createdDate < betaEndDate) {
                this.unlockSpecialAchievement('early-adopter', 'Beta user');
            }
        }
    }

    getSeriesStatus(seriesName) {
        const seriesAchievements = Object.values(this.achievements)
            .filter(a => a.series === seriesName)
            .sort((a, b) => a.tier - b.tier);
            
        if (seriesAchievements.length === 0) return null;

        // Find highest unlocked tier
        let highestUnlockedIndex = -1;
        for (let i = 0; i < seriesAchievements.length; i++) {
            if (seriesAchievements[i].unlocked) {
                highestUnlockedIndex = i;
            } else {
                break; 
            }
        }

        const currentTier = highestUnlockedIndex >= 0 ? seriesAchievements[highestUnlockedIndex] : null;
        const nextTier = highestUnlockedIndex + 1 < seriesAchievements.length ? seriesAchievements[highestUnlockedIndex + 1] : null;
        const completed = highestUnlockedIndex === seriesAchievements.length - 1;

        let progress = null;
        if (nextTier) {
            progress = this.getAchievementProgress(nextTier.id);
        } else if (completed && currentTier) {
            // If completed, show 100% of last tier
            progress = {
                current: currentTier.targetValue,
                target: currentTier.targetValue,
                percentage: 100,
                isComplete: true
            };
        }

        return {
            name: seriesName,
            achievements: seriesAchievements,
            currentTier,
            nextTier,
            completed,
            progress
        };
    }
}

// Create global instance
const achievementsSystem = new AchievementsSystem();
window.achievementsSystem = achievementsSystem;
