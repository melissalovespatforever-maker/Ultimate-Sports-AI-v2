/**
 * 1V1 PARLAY BATTLE - Complete Multiplayer System
 * Multiple game modes with real-time opponent simulation
 */

// Initialize MinigameSync
const gameSync = MinigameSync.init('Parlay Battle');

// Game State
const battleState = {
    currentMode: null,
    opponent: null,
    yourPicks: [],
    opponentPicks: [],
    battleGames: [],
    timer: null,
    timeLeft: 0
};

// Mode Configurations
const modes = {
    'quick-picks': {
        name: 'Quick Picks',
        icon: '⚡',
        picks: 3,
        timeLimit: 30,
        minBet: 50,
        maxBet: 500,
        multiplier: 5
    },
    'parlay-wars': {
        name: 'Parlay Wars',
        icon: '🔥',
        picks: 5,
        timeLimit: 120,
        minBet: 100,
        maxBet: 1000,
        multiplier: 10
    },
    'td-showdown': {
        name: 'TD Showdown',
        icon: '🏈',
        picks: 4,
        timeLimit: 90,
        minBet: 75,
        maxBet: 750,
        multiplier: 7
    },
    'buzzer-beater': {
        name: 'Buzzer Beater',
        icon: '🏀',
        picks: 3,
        timeLimit: 60,
        minBet: 100,
        maxBet: 800,
        multiplier: 8
    },
    'home-run-derby': {
        name: 'Home Run Derby',
        icon: '⚾',
        picks: 3,
        timeLimit: 60,
        minBet: 50,
        maxBet: 600,
        multiplier: 6
    },
    'hat-trick': {
        name: 'Hat Trick',
        icon: '🏒',
        picks: 3,
        timeLimit: 45,
        minBet: 60,
        maxBet: 700,
        multiplier: 6.5
    }
};

// Opponent pool (simulated players)
const opponentPool = [
    { name: 'ParlayKing', avatar: '👑', rank: 12, skillLevel: 0.7 },
    { name: 'BetMaster', avatar: '💎', rank: 15, skillLevel: 0.65 },
    { name: 'SportsFanatic', avatar: '🔥', rank: 18, skillLevel: 0.6 },
    { name: 'QuickPick', avatar: '⚡', rank: 20, skillLevel: 0.55 },
    { name: 'LuckyStreak', avatar: '🍀', rank: 10, skillLevel: 0.75 },
    { name: 'ProGamer', avatar: '🎮', rank: 8, skillLevel: 0.8 },
    { name: 'AcePicks', avatar: '🎯', rank: 14, skillLevel: 0.68 },
    { name: 'HotShot', avatar: '🌟', rank: 16, skillLevel: 0.62 },
    { name: 'BetBoss', avatar: '💰', rank: 11, skillLevel: 0.72 },
    { name: 'ChampPlayer', avatar: '🏆', rank: 9, skillLevel: 0.78 }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('⚔️ Parlay Battle initialized');
    initializeModeButtons();
});

// Initialize mode selection buttons
function initializeModeButtons() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modeCard = btn.closest('.mode-card');
            const mode = modeCard.dataset.mode;
            startMatchmaking(mode);
        });
    });
}

// Start matchmaking
function startMatchmaking(mode) {
    console.log(`Starting matchmaking for ${mode}`);
    battleState.currentMode = mode;
    
    // Switch to matchmaking screen
    switchScreen('matchmaking-screen');
    
    // Simulate matchmaking (2-4 seconds)
    const matchmakingTime = 2000 + Math.random() * 2000;
    
    setTimeout(() => {
        findOpponent();
        startBattle();
    }, matchmakingTime);
}

// Find opponent
function findOpponent() {
    // Select random opponent
    battleState.opponent = opponentPool[Math.floor(Math.random() * opponentPool.length)];
    console.log(`Matched with: ${battleState.opponent.name}`);
}

// Start battle
function startBattle() {
    const modeConfig = modes[battleState.currentMode];
    
    // Reset state
    battleState.yourPicks = [];
    battleState.opponentPicks = [];
    battleState.timeLeft = modeConfig.timeLimit;
    
    // Load games for this mode
    loadBattleGames();
    
    // Update UI
    document.getElementById('current-mode-indicator').textContent = `${modeConfig.icon} ${modeConfig.name}`;
    document.getElementById('opponent-name').textContent = battleState.opponent.name;
    document.getElementById('opponent-avatar').textContent = battleState.opponent.avatar;
    
    // Update your info
    const user = window.appState?.user || { name: localStorage.getItem('guestUsername') || 'You', avatar: localStorage.getItem('guestAvatar') || '😊' };
    document.getElementById('your-name').textContent = user.name;
    document.getElementById('your-avatar').textContent = user.avatar;
    
    // Switch to battle screen
    switchScreen('battle-screen');
    
    // Start timer
    startTimer();
    
    // Simulate opponent making picks
    simulateOpponentPicks();
}

// Load games for battle
function loadBattleGames() {
    const modeConfig = modes[battleState.currentMode];
    const sports = getSportsForMode(battleState.currentMode);
    
    // Generate random games
    const gameCount = modeConfig.picks + 5; // Extra games to choose from
    battleState.battleGames = [];
    
    for (let i = 0; i < gameCount; i++) {
        const sport = sports[Math.floor(Math.random() * sports.length)];
        const teams = getTeamsForSport(sport);
        
        // Pick two random teams
        const team1 = teams[Math.floor(Math.random() * teams.length)];
        let team2 = teams[Math.floor(Math.random() * teams.length)];
        while (team2.name === team1.name) {
            team2 = teams[Math.floor(Math.random() * teams.length)];
        }
        
        // Generate odds
        const spread = (Math.random() * 10 - 5).toFixed(1);
        const odds1 = spread > 0 ? -110 : +110;
        const odds2 = spread < 0 ? -110 : +110;
        
        battleState.battleGames.push({
            id: `game-${i}`,
            sport,
            team1: { ...team1, odds: odds1, spread: spread > 0 ? `+${spread}` : spread },
            team2: { ...team2, odds: odds2, spread: spread < 0 ? `+${Math.abs(spread)}` : `-${Math.abs(spread)}` }
        });
    }
    
    renderGames();
}

// Get sports for mode
function getSportsForMode(mode) {
    switch (mode) {
        case 'td-showdown':
            return ['NFL'];
        case 'buzzer-beater':
            return ['NBA'];
        case 'home-run-derby':
            return ['MLB'];
        case 'hat-trick':
            return ['NHL'];
        default:
            return ['NBA', 'NFL', 'MLB', 'NHL'];
    }
}

// Get teams for sport
function getTeamsForSport(sport) {
    const teams = {
        NBA: [
            { name: 'Lakers', logo: '🏀' }, { name: 'Celtics', logo: '☘️' }, 
            { name: 'Warriors', logo: '⚡' }, { name: 'Suns', logo: '☀️' },
            { name: 'Bucks', logo: '🦌' }, { name: 'Nuggets', logo: '⛰️' }
        ],
        NFL: [
            { name: 'Chiefs', logo: '🏈' }, { name: '49ers', logo: '⛏️' },
            { name: 'Bills', logo: '🦬' }, { name: 'Eagles', logo: '🦅' },
            { name: 'Cowboys', logo: '⭐' }, { name: 'Ravens', logo: '🐦' }
        ],
        MLB: [
            { name: 'Dodgers', logo: '⚾' }, { name: 'Yankees', logo: '🗽' },
            { name: 'Astros', logo: '🚀' }, { name: 'Braves', logo: '🪓' },
            { name: 'Padres', logo: '🌴' }, { name: 'Mets', logo: '🍎' }
        ],
        NHL: [
            { name: 'Bruins', logo: '🐻' }, { name: 'Avalanche', logo: '❄️' },
            { name: 'Lightning', logo: '⚡' }, { name: 'Rangers', logo: '🗽' },
            { name: 'Maple Leafs', logo: '🍁' }, { name: 'Oilers', logo: '🛢️' }
        ]
    };
    
    return teams[sport] || teams.NBA;
}

// Render games
function renderGames() {
    const container = document.getElementById('games-selection');
    const modeConfig = modes[battleState.currentMode];
    
    container.innerHTML = battleState.battleGames.map(game => `
        <div class="game-option ${battleState.yourPicks.find(p => p.gameId === game.id) ? 'selected' : ''}" data-game-id="${game.id}">
            <span class="game-sport">${game.sport}</span>
            <div class="game-matchup">
                <div>
                    <div class="team-name">${game.team1.logo} ${game.team1.name}</div>
                    <div class="game-odds">${game.team1.spread} (${game.team1.odds})</div>
                </div>
                <div style="text-align: right;">
                    <div class="team-name">${game.team2.name} ${game.team2.logo}</div>
                    <div class="game-odds">${game.team2.spread} (${game.team2.odds})</div>
                </div>
            </div>
            <button class="pick-team-btn ${battleState.yourPicks.find(p => p.gameId === game.id && p.team === 'team1') ? 'selected' : ''}" 
                    onclick="selectPick('${game.id}', 'team1')">
                Pick ${game.team1.name}
            </button>
            <button class="pick-team-btn ${battleState.yourPicks.find(p => p.gameId === game.id && p.team === 'team2') ? 'selected' : ''}" 
                    onclick="selectPick('${game.id}', 'team2')" 
                    style="margin-top: 10px;">
                Pick ${game.team2.name}
            </button>
        </div>
    `).join('');
}

// Select a pick
window.selectPick = function(gameId, team) {
    const modeConfig = modes[battleState.currentMode];
    
    // Remove any existing pick for this game
    battleState.yourPicks = battleState.yourPicks.filter(p => p.gameId !== gameId);
    
    // Add new pick
    battleState.yourPicks.push({ gameId, team });
    
    // Limit to max picks
    if (battleState.yourPicks.length > modeConfig.picks) {
        battleState.yourPicks.shift();
    }
    
    // Update UI
    renderGames();
    updatePicksDisplay();
    
    // Enable submit button if enough picks
    const submitBtn = document.getElementById('submit-battle-picks');
    submitBtn.disabled = battleState.yourPicks.length !== modeConfig.picks;
};

// Update picks display
function updatePicksDisplay() {
    const modeConfig = modes[battleState.currentMode];
    document.getElementById('your-picks').innerHTML = `
        <div class="picks-count">${battleState.yourPicks.length} / ${modeConfig.picks} picks</div>
    `;
    document.getElementById('opponent-picks').innerHTML = `
        <div class="picks-count">${battleState.opponentPicks.length} / ${modeConfig.picks} picks</div>
    `;
}

// Timer
function startTimer() {
    const timerEl = document.getElementById('battle-timer');
    
    battleState.timer = setInterval(() => {
        battleState.timeLeft--;
        timerEl.textContent = battleState.timeLeft;
        
        if (battleState.timeLeft <= 0) {
            clearInterval(battleState.timer);
            autoSubmitBattle();
        }
    }, 1000);
}

// Simulate opponent picks
function simulateOpponentPicks() {
    const modeConfig = modes[battleState.currentMode];
    const pickInterval = (modeConfig.timeLimit * 1000) / modeConfig.picks;
    
    let picksMade = 0;
    const opponentTimer = setInterval(() => {
        if (picksMade >= modeConfig.picks) {
            clearInterval(opponentTimer);
            return;
        }
        
        // Select a random game the opponent hasn't picked yet
        const availableGames = battleState.battleGames.filter(g => 
            !battleState.opponentPicks.find(p => p.gameId === g.id)
        );
        
        if (availableGames.length > 0) {
            const game = availableGames[Math.floor(Math.random() * availableGames.length)];
            const team = Math.random() > 0.5 ? 'team1' : 'team2';
            
            battleState.opponentPicks.push({ gameId: game.id, team });
            picksMade++;
            updatePicksDisplay();
        }
    }, pickInterval);
}

// Submit battle
document.getElementById('submit-battle-picks')?.addEventListener('click', () => {
    const modeConfig = modes[battleState.currentMode];
    
    if (battleState.yourPicks.length !== modeConfig.picks) {
        alert(`Please select ${modeConfig.picks} picks!`);
        return;
    }
    
    clearInterval(battleState.timer);
    processResults();
});

// Auto-submit if time runs out
function autoSubmitBattle() {
    if (battleState.yourPicks.length > 0) {
        processResults();
    } else {
        alert('Time\'s up! You didn\'t make any picks.');
        goToModeSelect();
    }
}

// Process results
function processResults() {
    // Simulate results for each pick
    const yourCorrect = battleState.yourPicks.filter(() => Math.random() < 0.55).length; // 55% win rate
    const opponentCorrect = battleState.opponentPicks.filter(() => 
        Math.random() < battleState.opponent.skillLevel
    ).length;
    
    const won = yourCorrect > opponentCorrect;
    const tie = yourCorrect === opponentCorrect;
    const modeConfig = modes[battleState.currentMode];
    
    // Calculate rewards
    let coinsWon = 0;
    let rankPoints = 0;
    
    if (won) {
        coinsWon = Math.floor(modeConfig.minBet + (yourCorrect * 50));
        rankPoints = 10 + (yourCorrect * 2);
        
        // Award coins using MinigameSync
        gameSync.addCoins(coinsWon, `${modeConfig.name} victory`, {
            mode: battleState.currentMode,
            correctPicks: yourCorrect,
            opponentCorrect: opponentCorrect,
            opponent: battleState.opponent.name,
            rankPoints: rankPoints
        });
    } else if (!tie) {
        // Lost - deduct entry fee
        const entryFee = Math.floor(modeConfig.minBet / 2);
        coinsWon = -entryFee;
        rankPoints = -5;
        
        gameSync.deductCoins(entryFee, `${modeConfig.name} loss`, {
            mode: battleState.currentMode,
            correctPicks: yourCorrect,
            opponentCorrect: opponentCorrect,
            opponent: battleState.opponent.name
        });
    }
    
    // Track stats
    const stats = JSON.parse(localStorage.getItem('parlayBattleStats')) || { games: 0, wins: 0 };
    stats.games++;
    if (won) stats.wins++;
    localStorage.setItem('parlayBattleStats', JSON.stringify(stats));
    
    // Show results
    showResults(won, yourCorrect, opponentCorrect, coinsWon, rankPoints);
}

// Show results
function showResults(won, yourScore, opponentScore, coinsWon, rankPoints) {
    const resultsIcon = document.getElementById('results-icon');
    const resultsTitle = document.getElementById('results-title');
    const resultsSubtitle = document.getElementById('results-subtitle');
    
    if (won) {
        resultsIcon.textContent = '🎉';
        resultsTitle.textContent = 'Victory!';
        resultsSubtitle.textContent = `You crushed ${battleState.opponent.name}!`;
    } else if (yourScore === opponentScore) {
        resultsIcon.textContent = '🤝';
        resultsTitle.textContent = 'Tie!';
        resultsSubtitle.textContent = 'Evenly matched!';
    } else {
        resultsIcon.textContent = '😢';
        resultsTitle.textContent = 'Defeat';
        resultsSubtitle.textContent = `${battleState.opponent.name} got you this time!`;
    }
    
    // Update scores
    document.getElementById('your-score').textContent = yourScore;
    document.getElementById('opponent-score').textContent = opponentScore;
    
    // Update rewards
    document.getElementById('coins-won').textContent = coinsWon > 0 ? `+${coinsWon} coins` : `${coinsWon} coins`;
    document.getElementById('rank-change').textContent = rankPoints > 0 ? `+${rankPoints} rank points` : `${rankPoints} rank points`;
    
    // Switch to results screen
    switchScreen('results-screen');
}

// Screen switching
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Navigation functions
window.cancelMatchmaking = function() {
    goToModeSelect();
};

window.goToModeSelect = function() {
    if (battleState.timer) {
        clearInterval(battleState.timer);
    }
    switchScreen('mode-screen');
};

window.playAgain = function() {
    if (battleState.currentMode) {
        startMatchmaking(battleState.currentMode);
    } else {
        goToModeSelect();
    }
};

// Export for debugging
window.battleState = battleState;
