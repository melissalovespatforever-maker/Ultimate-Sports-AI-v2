/**
 * TROPHY CASE MANAGER
 * Dynamically populates the Trophy Case based on AchievementsSystem
 */

class TrophyCaseManager {
    constructor() {
        this.containerId = 'trophy-room';
        this.init();
    }

    init() {
        console.log('🏆 Initializing Trophy Case Manager...');
        this.setupTabObserver();
    }

    setupTabObserver() {
        // We want to refresh the trophy case whenever the tab becomes active
        const tabs = document.querySelectorAll('.lounge-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.dataset.tab === 'trophy-room') {
                    this.render();
                }
            });
        });
    }

    render() {
        if (!window.achievementsSystem) {
            console.warn('Achievements system not found');
            return;
        }

        const stats = window.achievementsSystem.userStats;
        const achievements = window.achievementsSystem.achievements;

        // Render Season Pass Track
        this.renderSeasonPass(stats);

        // Update Case Stats
        this.updateStats(stats, achievements);

        // Update Rings
        this.updateRings(achievements);

        // Update Trophies
        this.updateTrophies(achievements);
        
        console.log('✅ Trophy Case updated');
    }

    renderSeasonPass(stats) {
        const container = document.getElementById('season-pass-container');
        if (!container) {
            // Create container if it doesn't exist (it should be in the HTML, but let's be safe)
            const header = document.querySelector('.trophy-case-header');
            if (header) {
                const passDiv = document.createElement('div');
                passDiv.id = 'season-pass-container';
                passDiv.className = 'season-pass-track';
                header.after(passDiv);
                this.renderSeasonPass(stats);
            }
            return;
        }

        // Season progress logic (based on total tournaments won and XP)
        const seasonXP = (stats.tournamentsWon * 1000) + (stats.xp / 10);
        const currentLevel = Math.floor(seasonXP / 2000) + 1;
        const nextLevelXP = currentLevel * 2000;
        const levelProgress = ((seasonXP % 2000) / 2000) * 100;

        const rewards = [
            { level: 2, name: '500 Coins', icon: '🪙', claimed: stats.claimedSeasonRewards?.includes(2) },
            { level: 5, name: 'Elite Avatar', icon: '👤', claimed: stats.claimedSeasonRewards?.includes(5) },
            { level: 10, name: 'Champion Ring', icon: '💍', claimed: stats.claimedSeasonRewards?.includes(10) },
            { level: 15, name: '5000 Coins', icon: '💰', claimed: stats.claimedSeasonRewards?.includes(15) },
            { level: 20, name: 'Mythic Trophy', icon: '🏆', claimed: stats.claimedSeasonRewards?.includes(20) }
        ];

        container.innerHTML = `
            <div class="season-header">
                <div class="season-info">
                    <span class="season-tag">SEASON 1: ORIGINS</span>
                    <h2>Tier ${currentLevel} <small>${Math.floor(seasonXP)} / ${nextLevelXP} SXP</small></h2>
                </div>
                <div class="season-timer">
                    <i class="fas fa-clock"></i> 14 Days Remaining
                </div>
            </div>
            <div class="season-progress-track">
                <div class="progress-bar-bg">
                    <div class="progress-fill" style="width: ${levelProgress}%"></div>
                </div>
                <div class="rewards-timeline">
                    ${rewards.map(reward => `
                        <div class="reward-node ${currentLevel >= reward.level ? 'unlocked' : ''} ${reward.claimed ? 'claimed' : ''}" 
                             onclick="window.trophyCaseManager.claimReward(${reward.level})">
                            <div class="reward-icon">${reward.icon}</div>
                            <div class="reward-level">Lvl ${reward.level}</div>
                            <div class="reward-tooltip">${reward.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    claimReward(level) {
        if (!window.achievementsSystem) return;
        const stats = window.achievementsSystem.userStats;
        const seasonXP = (stats.tournamentsWon * 1000) + (stats.xp / 10);
        const currentLevel = Math.floor(seasonXP / 2000) + 1;

        if (currentLevel < level) {
            if (typeof showToast !== 'undefined') showToast(`Locked! Reach Season Level ${level} to claim.`, 'info');
            return;
        }

        if (!stats.claimedSeasonRewards) stats.claimedSeasonRewards = [];
        if (stats.claimedSeasonRewards.includes(level)) {
            if (typeof showToast !== 'undefined') showToast('Reward already claimed!', 'info');
            return;
        }

        stats.claimedSeasonRewards.push(level);
        
        // Grant actual rewards
        if (level === 2) {
            window.globalState.addCoins(500, 'Season Reward');
        } else if (level === 5) {
            window.profileInventory.addItem('avatars', { id: 'elite-player', name: 'Elite Origins Avatar', icon: '👤', price: 0 });
        } else if (level === 10) {
            window.profileInventory.addItem('avatars', { id: 'origins-ring', name: 'Season 1 Origins Ring', icon: '💍', price: 0 });
        } else if (level === 15) {
            window.globalState.addCoins(5000, 'Season Reward');
        } else if (level === 20) {
            // Unlock a special trophy
            if (window.achievementsSystem) {
                window.achievementsSystem.unlockAchievement('perfect-season'); // Just an example
            }
        }
        
        window.achievementsSystem.saveStats();
        this.render();
        
        if (typeof showToast !== 'undefined') showToast(`🎁 Claimed Level ${level} reward!`, 'success');
        if (window.confetti) window.confetti.celebrate();
    }

    updateStats(stats, achievements) {
        const trophyItems = [
            'nfl-champ', 'nba-champ', 'mlb-champ', 'soccer-champ', 
            'tournament-win', 'tournament-3wins', 'tournament-5wins',
            'coins-100k', 'coins-1m'
        ];
        const ringItems = ['tournament-5wins', 'perfect-season', 'hall-of-fame', 'rank-diamond'];
        
        const trophyCount = trophyItems.filter(id => achievements[id]?.unlocked).length;
        const ringCount = ringItems.filter(id => achievements[id]?.unlocked).length;
        
        const statNumbers = document.querySelectorAll('.case-stats .stat-number');
        if (statNumbers.length >= 3) {
            statNumbers[0].textContent = trophyCount;
            statNumbers[1].textContent = ringCount;
            statNumbers[2].textContent = stats.totalLogins || 0; // "Special Events" as total participation
        }
    }

    updateRings(achievements) {
        const ringsGrid = document.querySelector('.rings-grid');
        if (!ringsGrid) return;

        // Define ring mappings
        const ringMappings = [
            {
                id: 'tournament-win',
                title: 'Ultimate Sports Champion',
                subtitle: 'Grand Champion - Season 1',
                img: 'https://rosebud.ai/assets/Championship ring 1.png?shqb',
                badge: 'LEGENDARY',
                unlocked: achievements['tournament-win']?.unlocked
            },
            {
                id: 'tournament-3wins',
                title: 'Diamond Elite Champion',
                subtitle: 'Tournament Winner - Elite Division',
                img: 'https://rosebud.ai/assets/Ultimate sports championship diamond ring.png?1Esq',
                badge: 'EPIC',
                unlocked: achievements['tournament-3wins']?.unlocked
            },
            {
                id: 'tournament-5wins',
                title: 'Platinum Champion Ring',
                subtitle: 'Unlock by winning 5 tournaments',
                img: 'https://rosebud.ai/assets/Championship ring 1.png?shqb',
                badge: 'EPIC',
                target: 5,
                progressType: 'tournamentsWon',
                unlocked: achievements['tournament-5wins']?.unlocked
            },
            {
                id: 'perfect-season',
                title: 'Perfect Season Ring',
                subtitle: 'Win every battle for 30 days',
                img: 'https://rosebud.ai/assets/Ultimate sports championship diamond ring.png?1Esq',
                badge: 'MYTHIC',
                target: 30,
                progressType: 'perfectDays',
                unlocked: achievements['perfect-season']?.unlocked
            },
            {
                id: 'hall-of-fame',
                title: 'Hall of Fame Ring',
                subtitle: 'Reach Legendary tier status',
                img: 'https://rosebud.ai/assets/Championship ring 1.png?shqb',
                badge: 'HALL OF FAME',
                target: 1000000,
                progressType: 'xp',
                unlocked: achievements['hall-of-fame']?.unlocked
            }
        ];

        ringsGrid.innerHTML = ringMappings.map(ring => {
            if (ring.unlocked) {
                return `
                    <div class="ring-display featured-ring">
                        <div class="ring-glow"></div>
                        <img src="${ring.img}" alt="${ring.title}" class="ring-image">
                        <div class="ring-info">
                            <h3>${ring.title}</h3>
                            <p>${ring.subtitle}</p>
                            <div class="ring-badge ${ring.badge.toLowerCase().replace(' ', '-')}">${ring.badge}</div>
                        </div>
                    </div>
                `;
            } else {
                const current = window.achievementsSystem.userStats[ring.progressType] || 0;
                const percentage = Math.min(100, (current / ring.target) * 100);
                return `
                    <div class="ring-display locked-ring">
                        <div class="lock-overlay">
                            <i class="fas fa-lock"></i>
                            <p>${ring.title}</p>
                        </div>
                        <div class="ring-silhouette"></div>
                        <div class="ring-info">
                            <h3>${ring.title}</h3>
                            <p>${ring.subtitle}</p>
                            <div class="progress-mini">
                                <div class="progress-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="ring-progress">${current.toLocaleString()} / ${ring.target.toLocaleString()}</div>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }

    updateTrophies(achievements) {
        const trophiesGrid = document.querySelector('.trophies-grid');
        if (!trophiesGrid) return;

        const trophyMappings = [
            { id: 'tournament-win', title: 'Grand Championship', img: 'https://rosebud.ai/assets/Ultimate sports ai trophy.png?REjH' },
            { id: 'nfl-champ', title: 'Football Tournament', img: 'https://rosebud.ai/assets/Soccer tournament.png?ok1w' },
            { id: 'nba-champ', title: 'Basketball Tournament', img: 'https://rosebud.ai/assets/Basketball trophy.png?28RZ' },
            { id: 'mlb-champ', title: 'Baseball Tournament', img: 'https://rosebud.ai/assets/Baseball trophy.png?ZPlR' },
            { id: 'soccer-champ', title: 'Soccer Parlay Master', img: 'https://rosebud.ai/assets/Soccer parlay trophy.png?ePTo' },
            { id: 'rank-platinum', title: 'VIP Elite Achievement', img: 'https://rosebud.ai/assets/Vip trophy.png?q8fV' },
            { id: 'coins-100k', title: 'High Roller Trophy', img: 'https://rosebud.ai/assets/Money bag trophy.png?ELGp' },
            { id: 'rank-diamond', title: 'World Champion', img: 'https://rosebud.ai/assets/World trophy.png?7n3n' }
        ];

        trophiesGrid.innerHTML = trophyMappings.map(trophy => {
            const unlocked = achievements[trophy.id]?.unlocked;
            if (unlocked) {
                return `
                    <div class="trophy-display ${trophy.id === 'tournament-win' ? 'grand-trophy' : ''}">
                        ${trophy.id === 'tournament-win' ? '<div class="trophy-spotlight"></div>' : ''}
                        <img src="${trophy.img}" alt="${trophy.title}" class="trophy-image">
                        <div class="trophy-info">
                            <h3>${trophy.title}</h3>
                            <p>${achievements[trophy.id].description}</p>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="trophy-display locked-trophy">
                        <div class="lock-overlay">
                            <i class="fas fa-lock"></i>
                            <p>Locked</p>
                        </div>
                        <div class="trophy-silhouette" style="background-image: url('${trophy.img}'); background-size: contain; background-repeat: no-repeat; background-position: center; filter: grayscale(1) brightness(0.2);"></div>
                        <div class="trophy-info">
                            <h3>${trophy.title}</h3>
                            <p>Complete achievement to unlock</p>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', () => {
    window.trophyCaseManager = new TrophyCaseManager();
});
