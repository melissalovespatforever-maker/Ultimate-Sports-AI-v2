/**
 * BEAT THE STREAK - Sports Prediction Game
 * Pick winners daily and build your streak!
 */

// Game State
const gameState = {
    coins: 1000,
    currentStreak: 0,
    bestStreak: 0,
    mode: 'double', // single, double, triple
    selectedPicks: [],
    todaysGames: [],
    hasPlayedToday: false
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('📈 Beat the Streak initialized');
    checkDailyReset();
    loadGameState();
    initializeModes();
    loadTodaysGames();
    updateUI();
    
    // Listen for balance updates from parent
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'requestState' }, '*');
        window.addEventListener('message', (event) => {
            if (event.data.type === 'stateUpdate' && event.data.balance) {
                gameState.coins = event.data.balance;
                updateUI();
            }
        });
    }
});

// Check if it's a new day
function checkDailyReset() {
    const lastPlayedDate = localStorage.getItem('beatTheStreakDate');
    const today = new Date().toDateString();
    
    if (lastPlayedDate !== today) {
        gameState.hasPlayedToday = false;
        localStorage.removeItem('beatTheStreakPicks');
    } else {
        gameState.hasPlayedToday = localStorage.getItem('beatTheStreakPlayed') === 'true';
    }
}

// Load saved state
function loadGameState() {
    // Get coins from global state or parent
    if (window.parent && window.parent !== window && window.parent.globalState) {
        gameState.coins = window.parent.globalState.getBalance();
    } else if (window.globalState) {
        gameState.coins = window.globalState.getBalance();
    } else {
        gameState.coins = parseInt(localStorage.getItem('unified_balance') || localStorage.getItem('sportsLoungeBalance') || '1000');
    }
    
    gameState.currentStreak = parseInt(localStorage.getItem('beatTheStreakCurrent')) || 0;
    gameState.bestStreak = parseInt(localStorage.getItem('beatTheStreakBest')) || 0;
    
    document.getElementById('coins-display').textContent = gameState.coins.toLocaleString();
    document.getElementById('current-streak').textContent = gameState.currentStreak;
    document.getElementById('best-streak').textContent = gameState.bestStreak;
}

// Sync coins back to parent
function syncCoinsWithParent() {
    if (window.parent && window.parent !== window && window.parent.globalState) {
        window.parent.globalState.setBalance(gameState.coins);
    } else if (window.globalState) {
        window.globalState.setBalance(gameState.coins);
    }
    localStorage.setItem('unified_balance', gameState.coins.toString());
}

// Initialize game modes
function initializeModes() {
    const modeCards = document.querySelectorAll('.mode-card');
    
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove active from all
            modeCards.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            card.classList.add('active');
            
            // Update mode
            gameState.mode = card.dataset.mode;
            gameState.selectedPicks = [];
            
            // Update UI
            updateConfirmSection();
            renderGames();
            
            console.log(`Mode changed to: ${gameState.mode}`);
        });
    });
}

// Load today's games (simulated - in production, fetch from ESPN API)
function loadTodaysGames() {
    const sports = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer'];
    const teams = {
        NBA: [
            { name: 'Lakers', logo: '🏀', record: '42-18' },
            { name: 'Celtics', logo: '☘️', record: '45-15' },
            { name: 'Warriors', logo: '⚡', record: '38-22' },
            { name: 'Suns', logo: '☀️', record: '40-20' },
            { name: 'Bucks', logo: '🦌', record: '43-17' },
            { name: 'Nuggets', logo: '⛰️', record: '41-19' }
        ],
        NFL: [
            { name: 'Chiefs', logo: '🏈', record: '12-4' },
            { name: '49ers', logo: '⛏️', record: '11-5' },
            { name: 'Bills', logo: '🦬', record: '10-6' },
            { name: 'Eagles', logo: '🦅', record: '11-5' },
            { name: 'Cowboys', logo: '⭐', record: '9-7' },
            { name: 'Ravens', logo: '🐦', record: '12-4' }
        ],
        MLB: [
            { name: 'Dodgers', logo: '⚾', record: '85-45' },
            { name: 'Yankees', logo: '🗽', record: '82-48' },
            { name: 'Astros', logo: '🚀', record: '80-50' },
            { name: 'Braves', logo: '🪓', record: '83-47' },
            { name: 'Padres', logo: '🌴', record: '78-52' },
            { name: 'Mets', logo: '🍎', record: '76-54' }
        ],
        NHL: [
            { name: 'Bruins', logo: '🐻', record: '48-12-8' },
            { name: 'Avalanche', logo: '❄️', record: '45-15-8' },
            { name: 'Lightning', logo: '⚡', record: '42-18-8' },
            { name: 'Rangers', logo: '🗽', record: '40-20-8' },
            { name: 'Maple Leafs', logo: '🍁', record: '38-22-8' },
            { name: 'Oilers', logo: '🛢️', record: '43-17-8' }
        ],
        Soccer: [
            { name: 'Man City', logo: '⚽', record: '24-3-2' },
            { name: 'Arsenal', logo: '🔴', record: '23-4-2' },
            { name: 'Liverpool', logo: '🔴', record: '22-5-2' },
            { name: 'Chelsea', logo: '🔵', record: '20-6-3' },
            { name: 'Real Madrid', logo: '👑', record: '25-2-2' },
            { name: 'Barcelona', logo: '🔵', record: '23-4-2' }
        ]
    };

    // Generate 12 random games
    gameState.todaysGames = [];
    const gamesToGenerate = 12;
    
    for (let i = 0; i < gamesToGenerate; i++) {
        const sport = sports[Math.floor(Math.random() * sports.length)];
        const sportTeams = teams[sport];
        
        // Pick two random teams
        const team1Index = Math.floor(Math.random() * sportTeams.length);
        let team2Index = Math.floor(Math.random() * sportTeams.length);
        while (team2Index === team1Index) {
            team2Index = Math.floor(Math.random() * sportTeams.length);
        }
        
        const team1 = sportTeams[team1Index];
        const team2 = sportTeams[team2Index];
        
        // Generate random time
        const hour = Math.floor(Math.random() * 12) + 1;
        const minute = Math.random() > 0.5 ? '00' : '30';
        const ampm = Math.random() > 0.5 ? 'PM' : 'PM';
        
        gameState.todaysGames.push({
            id: `game-${i}`,
            sport,
            team1,
            team2,
            time: `${hour}:${minute} ${ampm} ET`,
            favorite: Math.random() > 0.5 ? 'team1' : 'team2'
        });
    }
    
    renderGames();
}

// Render games
function renderGames() {
    const container = document.getElementById('games-container');
    
    if (gameState.hasPlayedToday) {
        container.innerHTML = `
            <div class="loading-state">
                <div style="font-size: 64px; margin-bottom: 20px;">⏰</div>
                <h2>Come Back Tomorrow!</h2>
                <p style="opacity: 0.7; margin-top: 10px;">You've already made your picks for today. New games available daily at midnight.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = gameState.todaysGames.map(game => `
        <div class="game-pick-card ${gameState.selectedPicks.includes(game.id) ? 'selected' : ''}" data-game-id="${game.id}">
            <div class="game-header">
                <span class="sport-badge">${game.sport}</span>
                <span class="game-time"><i class="fas fa-clock"></i> ${game.time}</span>
            </div>
            <div class="matchup">
                <div class="team">
                    <div class="team-logo">${game.team1.logo}</div>
                    <div class="team-name">${game.team1.name}</div>
                    <div class="team-record">${game.team1.record}</div>
                </div>
                <div class="vs-divider">VS</div>
                <div class="team">
                    <div class="team-logo">${game.team2.logo}</div>
                    <div class="team-name">${game.team2.name}</div>
                    <div class="team-record">${game.team2.record}</div>
                </div>
            </div>
            <div class="pick-buttons">
                <button class="pick-btn ${gameState.selectedPicks.find(p => p === game.id + '-team1') ? 'selected' : ''}" 
                        onclick="selectPick('${game.id}', 'team1')">
                    Pick ${game.team1.name}
                </button>
                <button class="pick-btn ${gameState.selectedPicks.find(p => p === game.id + '-team2') ? 'selected' : ''}" 
                        onclick="selectPick('${game.id}', 'team2')">
                    Pick ${game.team2.name}
                </button>
            </div>
        </div>
    `).join('');
}

// Select a pick
window.selectPick = function(gameId, team) {
    // Remove any existing pick for this game
    gameState.selectedPicks = gameState.selectedPicks.filter(p => !p.startsWith(gameId));
    
    // Add new pick
    const pickId = `${gameId}-${team}`;
    gameState.selectedPicks.push(pickId);
    
    // Limit picks based on mode
    const maxPicks = {
        single: 1,
        double: 2,
        triple: 3
    }[gameState.mode];
    
    if (gameState.selectedPicks.length > maxPicks) {
        gameState.selectedPicks.shift(); // Remove oldest pick
    }
    
    renderGames();
    updateConfirmSection();
};

// Update confirm section
function updateConfirmSection() {
    const confirmSection = document.getElementById('confirm-section');
    const picksCount = document.getElementById('picks-count');
    const potentialReward = document.getElementById('potential-reward');
    const submitBtn = document.getElementById('submit-picks-btn');
    
    const maxPicks = {
        single: 1,
        double: 2,
        triple: 3
    }[gameState.mode];
    
    const rewards = {
        single: 50,
        double: 150,
        triple: 400
    };
    
    picksCount.textContent = `${gameState.selectedPicks.length} / ${maxPicks} picks`;
    potentialReward.textContent = `${rewards[gameState.mode]} coins`;
    
    // Show section if picks selected
    if (gameState.selectedPicks.length > 0) {
        confirmSection.classList.add('show');
    } else {
        confirmSection.classList.remove('show');
    }
    
    // Enable button only if correct number of picks
    submitBtn.disabled = gameState.selectedPicks.length !== maxPicks;
}

// Submit picks
document.getElementById('submit-picks-btn')?.addEventListener('click', () => {
    const maxPicks = {
        single: 1,
        double: 2,
        triple: 3
    }[gameState.mode];
    
    if (gameState.selectedPicks.length !== maxPicks) {
        alert(`Please select ${maxPicks} pick(s) before submitting!`);
        return;
    }
    
    // Simulate results (60% win rate)
    const allWin = Math.random() < 0.6;
    
    processResults(allWin);
});

// Process results
function processResults(won) {
    const rewards = {
        single: 50,
        double: 150,
        triple: 400
    };
    
    const reward = rewards[gameState.mode];
    
    if (won) {
        // Win - increase streak
        gameState.currentStreak++;
        gameState.coins += reward;
        
        // Update best streak
        if (gameState.currentStreak > gameState.bestStreak) {
            gameState.bestStreak = gameState.currentStreak;
            localStorage.setItem('beatTheStreakBest', gameState.bestStreak);
        }
        
        showResults(true, reward);
    } else {
        // Loss - reset streak
        const oldStreak = gameState.currentStreak;
        gameState.currentStreak = 0;
        
        showResults(false, 0, oldStreak);
    }
    
    // Save state
    localStorage.setItem('sportsLoungeBalance', gameState.coins);
    localStorage.setItem('beatTheStreakCurrent', gameState.currentStreak);
    localStorage.setItem('beatTheStreakDate', new Date().toDateString());
    localStorage.setItem('beatTheStreakPlayed', 'true');
    
    // Update stats
    const stats = JSON.parse(localStorage.getItem('beatTheStreakStats')) || { games: 0, wins: 0 };
    stats.games++;
    if (won) stats.wins++;
    localStorage.setItem('beatTheStreakStats', JSON.stringify(stats));
    
    gameState.hasPlayedToday = true;
}

// Show results modal
function showResults(won, coinsEarned, lostStreak = 0) {
    const modal = document.getElementById('results-modal');
    const icon = document.getElementById('results-icon');
    const title = document.getElementById('results-title');
    const message = document.getElementById('results-message');
    const streakValue = document.getElementById('result-streak');
    const coinsValue = document.getElementById('result-coins');
    
    if (won) {
        icon.textContent = '🎉';
        title.textContent = 'Streak Continues!';
        message.textContent = 'You nailed all your picks! Keep it going!';
        streakValue.textContent = gameState.currentStreak;
        coinsValue.textContent = `+${coinsEarned}`;
    } else {
        icon.textContent = '😢';
        title.textContent = 'Streak Ended';
        message.textContent = lostStreak > 0 
            ? `Your ${lostStreak}-game streak has ended. Come back tomorrow to start fresh!`
            : 'Better luck tomorrow! New picks available daily.';
        streakValue.textContent = '0';
        coinsValue.textContent = '0';
    }
    
    modal.classList.add('show');
}

// Update UI
function updateUI() {
    document.getElementById('coins-display').textContent = gameState.coins.toLocaleString();
    document.getElementById('current-streak').textContent = gameState.currentStreak;
    document.getElementById('best-streak').textContent = gameState.bestStreak;
}

// Export for global access
window.beatTheStreakGame = gameState;
