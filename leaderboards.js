/**
 * GLOBAL LEADERBOARDS - Live Rankings System
 * Real-time updates with category filtering
 */

// Leaderboard State
const leaderboardState = {
    category: 'overall',
    period: 'today',
    displayedPlayers: 20,
    allPlayers: [],
    searchQuery: '',
    lastUpdate: Date.now()
};

// Player avatars pool
const avatarPool = ['👑', '🔥', '💎', '⚡', '🎯', '🌟', '💪', '🚀', '🎮', '🏆', '⭐', '💰', '🦅', '🐺', '🦁', '🐉', '⚔️', '🛡️', '🎪', '🎭'];

// Country flags pool
const countryPool = ['🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇪🇸', '🇮🇹', '🇧🇷', '🇲🇽', '🇯🇵', '🇰🇷', '🇮🇳', '🇨🇳'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏆 Leaderboards initialized');
    
    generateLeaderboardData();
    loadUserRank();
    renderLeaderboard();
    initializeFilters();
    initializeSearch();
    startRealTimeUpdates();
    updateLastUpdateTime();
});

// Generate realistic leaderboard data
function generateLeaderboardData() {
    const playerNames = [
        'ParlayKing', 'BetMaster', 'HotStreak', 'QuickPick', 'LuckyStreak',
        'ProGamer', 'AcePicks', 'HotShot', 'BetBoss', 'ChampPlayer',
        'SportsFanatic', 'TriviaGuru', 'BrainiacBets', 'CoinCollector', 'WinStreak',
        'DiamondHands', 'Bullseye', 'StarPlayer', 'ThunderBolt', 'IceMan',
        'FireStarter', 'StormChaser', 'NightOwl', 'DayTrader', 'MoonShot',
        'RocketMan', 'SpeedDemon', 'PowerPlayer', 'MegaWin', 'BigBaller',
        'HighRoller', 'AllStar', 'MVPPicks', 'GoldenBoy', 'SilverFox',
        'IronWill', 'SteelNerve', 'BoldMoves', 'SmartBets', 'SharpShooter',
        'FastBreak', 'ClutchTime', 'GameChanger', 'PlayMaker', 'ScoreKeeper',
        'WinMachine', 'BetWizard', 'PickMaster', 'StreakHunter', 'CoinMaster',
        'VictoryLap', 'TopDog', 'AlphaBet', 'BetaTest', 'GammaRay',
        'DeltaForce', 'EpsilonWave', 'ZetaPower', 'EtaStrike', 'ThetaBurst',
        'IotaSpark', 'KappaStar', 'LambdaLight', 'MuMomentum', 'NuNinja',
        'XiWarrior', 'OmicronOne', 'PiPlayer', 'RhoRocket', 'SigmaGrind',
        'TauTitan', 'UpsilonUltra', 'PhiPhenom', 'ChiChamp', 'PsiPower',
        'OmegaBoss', 'AlphaOmega', 'BetaBlast', 'GammaGod', 'DeltaDemon',
        'TurboBoost', 'NitroRush', 'HyperSpeed', 'UltraWin', 'MegaMind',
        'GigaBrain', 'TeraForce', 'PetaPower', 'ExaEnergy', 'ZettaZone',
        'YottaYield', 'QuantumLeap', 'CosmicWin', 'GalacticGamer', 'StellarStreak',
        'NebulaNinja', 'SupernovaStrike', 'BlackHoleBets', 'WormholeWin', 'DarkMatterDeal'
    ];

    leaderboardState.allPlayers = [];

    for (let i = 0; i < 100; i++) {
        const baseScore = 5000 - (i * 40) - Math.random() * 50;
        const wins = Math.floor(200 - (i * 1.5) - Math.random() * 10);
        const losses = Math.floor(wins * (0.1 + Math.random() * 0.3));
        const winRate = Math.round((wins / (wins + losses)) * 100);
        const streak = Math.floor(Math.random() * 15);
        
        const badges = [];
        if (i < 10) badges.push('👑');
        if (winRate >= 80) badges.push('🔥');
        if (wins >= 150) badges.push('💎');
        if (streak >= 10) badges.push('⚡');

        leaderboardState.allPlayers.push({
            rank: i + 1,
            name: playerNames[i] || `Player${i + 1}`,
            avatar: avatarPool[Math.floor(Math.random() * avatarPool.length)],
            country: countryPool[Math.floor(Math.random() * countryPool.length)],
            score: Math.round(baseScore),
            wins,
            losses,
            winRate,
            streak,
            badges,
            coins: Math.floor(5000 + Math.random() * 50000),
            isOnline: Math.random() > 0.3
        });
    }
}

// Load user's rank
function loadUserRank() {
    const user = window.appState?.user || {
        name: localStorage.getItem('guestUsername') || 'You',
        avatar: localStorage.getItem('guestAvatar') || '😊'
    };

    // Get user stats
    const parlayStats = JSON.parse(localStorage.getItem('parlayBattleStats')) || { games: 0, wins: 0 };
    const streakStats = JSON.parse(localStorage.getItem('beatTheStreakStats')) || { games: 0, wins: 0 };
    const triviaStats = JSON.parse(localStorage.getItem('triviaStats')) || { games: 0, wins: 0 };
    
    const totalGames = parlayStats.games + streakStats.games + triviaStats.games;
    const totalWins = parlayStats.wins + streakStats.wins + triviaStats.wins;
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
    
    // Calculate score based on performance
    const score = (totalWins * 50) + (winRate * 10);

    // Find rank position
    const betterPlayers = leaderboardState.allPlayers.filter(p => p.score > score).length;
    const userRank = betterPlayers + 1;

    // Update UI
    document.getElementById('your-name').textContent = user.name;
    document.getElementById('your-avatar').textContent = user.avatar;
    document.querySelector('.rank-number').textContent = `#${userRank}`;
    document.getElementById('your-score').textContent = score.toLocaleString();
    document.getElementById('your-wins').textContent = totalWins;
    document.getElementById('your-winrate').textContent = `${winRate}%`;

    // Update rank change (simulated)
    const rankChange = Math.floor(Math.random() * 10) - 3;
    const rankChangeEl = document.querySelector('.rank-change');
    if (rankChange > 0) {
        rankChangeEl.classList.add('up');
        rankChangeEl.classList.remove('down');
        rankChangeEl.innerHTML = `<i class="fas fa-arrow-up"></i> +${rankChange}`;
    } else if (rankChange < 0) {
        rankChangeEl.classList.add('down');
        rankChangeEl.classList.remove('up');
        rankChangeEl.innerHTML = `<i class="fas fa-arrow-down"></i> ${rankChange}`;
    }

    // Calculate progress to next rank
    if (userRank > 1) {
        const nextPlayer = leaderboardState.allPlayers[userRank - 2];
        const pointsNeeded = nextPlayer.score - score;
        const progress = Math.max(0, Math.min(100, ((score % 100) / 100) * 100));
        
        document.querySelector('.progress-info span:last-child').textContent = `${Math.max(1, pointsNeeded)} pts needed`;
        document.querySelector('.progress-fill').style.width = `${progress}%`;
    }
}

// Render leaderboard
function renderLeaderboard() {
    // Update podium (top 3)
    updatePodium();
    
    // Update table
    updateTable();
    
    // Update stats
    updateStats();
}

// Update podium
function updatePodium() {
    const top3 = leaderboardState.allPlayers.slice(0, 3);
    
    if (top3.length >= 1) {
        document.getElementById('podium-1-avatar').textContent = top3[0].avatar;
        document.getElementById('podium-1-name').textContent = top3[0].name;
        document.getElementById('podium-1-score').textContent = `${top3[0].score.toLocaleString()} pts`;
        document.getElementById('podium-1-stats').textContent = `${top3[0].wins} wins • ${top3[0].winRate}% WR`;
    }
    
    if (top3.length >= 2) {
        document.getElementById('podium-2-avatar').textContent = top3[1].avatar;
        document.getElementById('podium-2-name').textContent = top3[1].name;
        document.getElementById('podium-2-score').textContent = `${top3[1].score.toLocaleString()} pts`;
        document.getElementById('podium-2-stats').textContent = `${top3[1].wins} wins • ${top3[1].winRate}% WR`;
    }
    
    if (top3.length >= 3) {
        document.getElementById('podium-3-avatar').textContent = top3[2].avatar;
        document.getElementById('podium-3-name').textContent = top3[2].name;
        document.getElementById('podium-3-score').textContent = `${top3[2].score.toLocaleString()} pts`;
        document.getElementById('podium-3-stats').textContent = `${top3[2].wins} wins • ${top3[2].winRate}% WR`;
    }
}

// Update table
function updateTable() {
    const container = document.getElementById('leaderboard-rows');
    const displayPlayers = leaderboardState.allPlayers
        .filter(player => {
            if (!leaderboardState.searchQuery) return true;
            return player.name.toLowerCase().includes(leaderboardState.searchQuery.toLowerCase());
        })
        .slice(0, leaderboardState.displayedPlayers);
    
    container.innerHTML = displayPlayers.map(player => `
        <div class="table-row ${player.name === (localStorage.getItem('guestUsername') || 'You') ? 'you' : ''}">
            <div class="table-cell rank-cell">
                ${player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
            </div>
            <div class="table-cell player-cell">
                <div class="player-avatar-table">${player.avatar}</div>
                <div class="player-info-table">
                    <div class="player-name-table">
                        ${player.name}
                        ${player.isOnline ? '<span style="color: #10b981; font-size: 10px;">●</span>' : ''}
                    </div>
                    <div class="player-country">${player.country}</div>
                </div>
            </div>
            <div class="table-cell stat-cell">
                <span class="score-value">${player.score.toLocaleString()}</span>
            </div>
            <div class="table-cell stat-cell">
                ${player.wins}
            </div>
            <div class="table-cell stat-cell">
                <span class="winrate-value">${player.winRate}%</span>
            </div>
            <div class="table-cell stat-cell">
                ${player.streak > 0 ? `
                    <span class="streak-badge">
                        🔥 ${player.streak}
                    </span>
                ` : '-'}
            </div>
            <div class="table-cell badges-cell">
                ${player.badges.join(' ')}
            </div>
        </div>
    `).join('');

    // Update load more button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (leaderboardState.displayedPlayers >= leaderboardState.allPlayers.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'flex';
    }
}

// Update stats
function updateStats() {
    const totalPlayers = leaderboardState.allPlayers.length;
    const activeNow = leaderboardState.allPlayers.filter(p => p.isOnline).length;
    const battlesToday = Math.floor(totalPlayers * 2.5 + Math.random() * 500);
    const coinsWonToday = (battlesToday * 250 / 1000).toFixed(1);

    document.getElementById('total-players').textContent = totalPlayers.toLocaleString();
    document.getElementById('active-now').textContent = activeNow.toLocaleString();
    document.getElementById('battles-today').textContent = battlesToday.toLocaleString();
    document.getElementById('coins-won-today').textContent = `${coinsWonToday}M`;
}

// Initialize filters
function initializeFilters() {
    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            leaderboardState.category = tab.dataset.category;
            console.log(`Category changed to: ${leaderboardState.category}`);
            
            // Re-sort based on category
            sortByCategory();
            renderLeaderboard();
        });
    });

    // Time filters
    document.querySelectorAll('.time-filter').forEach(filter => {
        filter.addEventListener('click', () => {
            document.querySelectorAll('.time-filter').forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            
            leaderboardState.period = filter.dataset.period;
            console.log(`Period changed to: ${leaderboardState.period}`);
            
            // Adjust scores based on period
            adjustScoresForPeriod();
            renderLeaderboard();
        });
    });

    // Load more button
    document.getElementById('load-more-btn').addEventListener('click', () => {
        leaderboardState.displayedPlayers += 20;
        updateTable();
    });
}

// Sort by category
function sortByCategory() {
    switch (leaderboardState.category) {
        case 'overall':
            leaderboardState.allPlayers.sort((a, b) => b.score - a.score);
            break;
        case 'parlay-battle':
            leaderboardState.allPlayers.sort((a, b) => b.wins - a.wins);
            break;
        case 'beat-streak':
            leaderboardState.allPlayers.sort((a, b) => b.streak - a.streak);
            break;
        case 'trivia':
            leaderboardState.allPlayers.sort((a, b) => b.winRate - a.winRate);
            break;
        case 'coins':
            leaderboardState.allPlayers.sort((a, b) => b.coins - a.coins);
            break;
    }
    
    // Update ranks
    leaderboardState.allPlayers.forEach((player, index) => {
        player.rank = index + 1;
    });
}

// Adjust scores for time period
function adjustScoresForPeriod() {
    const multipliers = {
        today: 0.3,
        week: 0.6,
        month: 0.85,
        alltime: 1.0
    };
    
    const multiplier = multipliers[leaderboardState.period] || 1.0;
    
    leaderboardState.allPlayers.forEach(player => {
        player.score = Math.floor(player.score * multiplier + Math.random() * 100);
    });
    
    leaderboardState.allPlayers.sort((a, b) => b.score - a.score);
    leaderboardState.allPlayers.forEach((player, index) => {
        player.rank = index + 1;
    });
}

// Initialize search
function initializeSearch() {
    const searchInput = document.getElementById('player-search');
    
    searchInput.addEventListener('input', (e) => {
        leaderboardState.searchQuery = e.target.value;
        updateTable();
    });
}

// Real-time updates
function startRealTimeUpdates() {
    // Update scores slightly every 10 seconds
    setInterval(() => {
        leaderboardState.allPlayers.forEach(player => {
            // Random small score changes
            const change = Math.floor(Math.random() * 10) - 3;
            player.score = Math.max(0, player.score + change);
            
            // Random online status changes
            if (Math.random() < 0.05) {
                player.isOnline = !player.isOnline;
            }
        });
        
        // Re-sort and update
        sortByCategory();
        renderLeaderboard();
        updateLastUpdateTime();
        
        leaderboardState.lastUpdate = Date.now();
    }, 10000); // Every 10 seconds
}

// Update last update time
function updateLastUpdateTime() {
    const timeEl = document.getElementById('last-updated-time');
    const secondsAgo = Math.floor((Date.now() - leaderboardState.lastUpdate) / 1000);
    
    if (secondsAgo < 5) {
        timeEl.textContent = 'Just now';
    } else if (secondsAgo < 60) {
        timeEl.textContent = `${secondsAgo}s ago`;
    } else {
        const minutesAgo = Math.floor(secondsAgo / 60);
        timeEl.textContent = `${minutesAgo}m ago`;
    }
}

// Refresh leaderboards
window.refreshLeaderboards = function() {
    console.log('🔄 Refreshing leaderboards...');
    
    const btn = document.querySelector('.refresh-btn i');
    btn.style.transform = 'rotate(360deg)';
    
    setTimeout(() => {
        // Simulate data refresh
        adjustScoresForPeriod();
        renderLeaderboard();
        leaderboardState.lastUpdate = Date.now();
        updateLastUpdateTime();
        
        btn.style.transform = 'rotate(0deg)';
    }, 500);
};

// Update time display periodically
setInterval(updateLastUpdateTime, 1000);

// Export for debugging
window.leaderboardState = leaderboardState;
