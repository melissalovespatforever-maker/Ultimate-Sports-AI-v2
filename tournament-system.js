/**
 * TOURNAMENT SYSTEM - Real-Time Bracket Competitions
 * Live bracket visualization, matchmaking, and progression
 */

console.log('🏆 Loading Tournament System...');

class TournamentSystem {
    constructor() {
        this.currentTournament = null;
        this.userRegistrations = new Set();
        this.activeBrackets = new Map();
        this.liveMatches = [];
        
        this.tournamentTypes = {
            'single-elimination': { name: 'Single Elimination', rounds: true },
            'double-elimination': { name: 'Double Elimination', losers: true },
            'round-robin': { name: 'Round Robin', groups: true }
        };
        
        this.init();
    }

    init() {
        console.log('🎮 Initializing Tournament System');
        this.loadActiveTournaments();
        this.setupEventListeners();
        this.startLiveUpdates();
    }

    // ============================================
    // TOURNAMENT MANAGEMENT
    // ============================================

    loadActiveTournaments() {
        // Load from localStorage for persistence
        const stored = localStorage.getItem('active_tournaments');
        if (stored) {
            try {
                const tournaments = JSON.parse(stored);
                this.activeBrackets = new Map(Object.entries(tournaments));
            } catch (e) {
                console.error('Error loading tournaments:', e);
            }
        }

        // Create demo tournaments if none exist
        if (this.activeBrackets.size === 0) {
            this.createDemoTournaments();
        }
    }

    createDemoTournaments() {
        // Weekly Championship Tournament
        const weeklyChampionship = {
            id: 'weekly-championship-001',
            name: 'Weekly Championship',
            type: 'single-elimination',
            status: 'registration',
            game: 'parlay-battle',
            entryFee: 500,
            prizePool: 10000,
            maxPlayers: 16,
            currentPlayers: 8,
            startTime: Date.now() + (3600000 * 2), // Starts in 2 hours
            rounds: [],
            participants: this.generateDemoParticipants(8),
            prizes: {
                1: 5000,
                2: 3000,
                3: 1500,
                4: 500
            }
        };

        // All-Star Double Elimination
        const allStarElite = {
            id: 'all-star-double-elim',
            name: 'All-Star Elite (Double Elimination)',
            type: 'double-elimination',
            status: 'registration',
            game: 'parlay-battle',
            entryFee: 1500,
            prizePool: 50000,
            maxPlayers: 8,
            currentPlayers: 4,
            startTime: Date.now() + (3600000 * 4), 
            rounds: [],
            participants: this.generateDemoParticipants(4),
            prizes: {
                1: 30000,
                2: 15000,
                3: 5000
            }
        };

        // Diamond League Tournament (In Progress)
        const diamondLeague = {
            id: 'diamond-league-042',
            name: 'Diamond League',
            type: 'single-elimination',
            status: 'active',
            game: 'trivia',
            entryFee: 1000,
            prizePool: 25000,
            maxPlayers: 16,
            currentPlayers: 16,
            startTime: Date.now() - (3600000), // Started 1 hour ago
            currentRound: 2,
            rounds: this.generateDemoRounds(16),
            participants: this.generateDemoParticipants(16),
            prizes: {
                1: 12500,
                2: 7500,
                3: 3000,
                4: 2000
            }
        };
        
        this.activeBrackets.set('weekly-championship-001', weeklyChampionship);
        this.activeBrackets.set('all-star-double-elim', allStarElite);
        this.activeBrackets.set('diamond-league-042', diamondLeague);
        
        this.saveTournaments();
        console.log('✅ Demo tournaments created');
    }

    generateDemoParticipants(count) {
        const names = [
            'ParlayKing', 'BetMaster', 'SportsFanatic', 'TriviaGuru',
            'LuckyStreak', 'AcePicks', 'GridironGuru', 'DunkMaster',
            'ChampionBets', 'WinStreak', 'BetPro', 'GameChanger',
            'TopShot', 'ElitePicks', 'VictoryLap', 'AllStar'
        ];

        return Array.from({ length: count }, (_, i) => ({
            id: `player-${i + 1}`,
            name: names[i] || `Player ${i + 1}`,
            avatar: ['🏆', '👑', '⚡', '🔥', '💎', '🎯', '🌟', '💪'][i % 8],
            seed: i + 1,
            wins: Math.floor(Math.random() * 50),
            rating: 1000 + Math.floor(Math.random() * 500)
        }));
    }

    generateDemoRounds(playerCount) {
        const rounds = [];
        let roundSize = playerCount;
        let roundNum = 1;

        while (roundSize > 1) {
            const matches = [];
            for (let i = 0; i < roundSize / 2; i++) {
                const match = {
                    id: `r${roundNum}-m${i + 1}`,
                    player1: `player-${i * 2 + 1}`,
                    player2: `player-${i * 2 + 2}`,
                    winner: null,
                    score1: 0,
                    score2: 0,
                    status: roundNum === 1 ? 'active' : 'pending'
                };

                // Simulate some completed matches
                if (roundNum === 1 && i < 4) {
                    match.status = 'completed';
                    match.score1 = Math.floor(Math.random() * 100);
                    match.score2 = Math.floor(Math.random() * 100);
                    match.winner = match.score1 > match.score2 ? match.player1 : match.player2;
                }

                matches.push(match);
            }

            rounds.push({
                round: roundNum,
                name: this.getRoundName(roundNum, playerCount),
                matches: matches,
                status: roundNum === 1 ? 'active' : 'pending'
            });

            roundSize /= 2;
            roundNum++;
        }

        return rounds;
    }

    getRoundName(roundNum, totalPlayers) {
        const roundsToFinal = Math.log2(totalPlayers);
        const roundsRemaining = roundsToFinal - roundNum + 1;

        if (roundsRemaining === 0) return 'Final';
        if (roundsRemaining === 1) return 'Semi-Finals';
        if (roundsRemaining === 2) return 'Quarter-Finals';
        return `Round ${roundNum}`;
    }

    saveTournaments() {
        const obj = Object.fromEntries(this.activeBrackets);
        localStorage.setItem('active_tournaments', JSON.stringify(obj));
    }

    // ============================================
    // TOURNAMENT ACTIONS
    // ============================================

    registerForTournament(tournamentId) {
        const tournament = this.activeBrackets.get(tournamentId);
        if (!tournament) {
            this.showNotification('❌ Tournament not found', 'error');
            return false;
        }

        if (tournament.status !== 'registration') {
            this.showNotification('❌ Registration is closed', 'error');
            return false;
        }

        if (tournament.currentPlayers >= tournament.maxPlayers) {
            this.showNotification('❌ Tournament is full', 'error');
            return false;
        }

        const balance = this.getUserBalance();
        if (balance < tournament.entryFee) {
            this.showNotification('❌ Insufficient coins', 'error');
            return false;
        }

        // Show Matchmaking Lobby instead of immediate registration
        this.showMatchmakingLobby(tournament);
        return true;
    }

    showMatchmakingLobby(tournament) {
        const modal = document.createElement('div');
        modal.className = 'matchmaking-overlay';
        modal.innerHTML = `
            <div class="matchmaking-card">
                <div class="matchmaking-header">
                    <div class="loader-ring"></div>
                    <h2>Matchmaking Lobby</h2>
                    <p>${tournament.name}</p>
                </div>
                <div class="matchmaking-players">
                    <div class="lobby-player user" id="lobby-user">
                        <div class="player-avatar">${this.getUserInfo().avatar}</div>
                        <div class="player-name">${this.getUserInfo().name}</div>
                        <div class="player-status ready">READY</div>
                        <div class="chat-bubble" id="user-chat-bubble">GL everyone! 🍀</div>
                    </div>
                    <div class="lobby-vs">VS</div>
                    <div class="lobby-opponents" id="lobby-opponents">
                        <div class="lobby-player placeholder">?</div>
                        <div class="lobby-player placeholder">?</div>
                        <div class="lobby-player placeholder">?</div>
                    </div>
                </div>
                <div class="matchmaking-footer">
                    <div class="quick-chat-options">
                        <button class="btn-quick-chat" onclick="tournamentSystem.sendLobbyChat('Good luck!')">GL!</button>
                        <button class="btn-quick-chat" onclick="tournamentSystem.sendLobbyChat('Bring it on!')">⚔️</button>
                        <button class="btn-quick-chat" onclick="tournamentSystem.sendLobbyChat('Ready to win!')">🏆</button>
                    </div>
                    <div class="finding-status" id="finding-status">Finding worthy opponents...</div>
                    <button class="btn-cancel-matchmaking" id="cancel-matchmaking">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const cancelBtn = modal.querySelector('#cancel-matchmaking');
        const opponentsList = modal.querySelector('#lobby-opponents');
        const statusText = modal.querySelector('#finding-status');
        
        let foundCount = 0;
        const totalToFind = Math.min(3, tournament.maxPlayers - tournament.currentPlayers);
        
        const findingInterval = setInterval(() => {
            if (foundCount < totalToFind) {
                const opponent = this.generateDemoParticipants(1)[0];
                const placeholders = opponentsList.querySelectorAll('.placeholder');
                if (placeholders[foundCount]) {
                    const opponentEl = placeholders[foundCount];
                    opponentEl.innerHTML = `
                        <div class="player-avatar">${opponent.avatar}</div>
                        <div class="player-name">${opponent.name}</div>
                        <div class="player-status ready">CONNECTED</div>
                        <div class="chat-bubble" id="opp-${foundCount}-chat"></div>
                    `;
                    opponentEl.classList.remove('placeholder');
                    
                    // Bot quick chat
                    setTimeout(() => {
                        const bubble = opponentEl.querySelector('.chat-bubble');
                        if (bubble) {
                            const msgs = ['Let\'s go!', 'Good luck!', 'Who\'s ready?', 'I\'m the champ!', 'Nice avatar!'];
                            bubble.textContent = msgs[Math.floor(Math.random() * msgs.length)];
                            bubble.style.opacity = '1';
                            setTimeout(() => bubble.style.opacity = '0', 3000);
                        }
                    }, 800);

                    foundCount++;
                }
                
                if (foundCount === totalToFind) {
                    statusText.textContent = 'Opponents Found! Finalizing Bracket...';
                    setTimeout(() => {
                        clearInterval(findingInterval);
                        modal.remove();
                        this.finalizeRegistration(tournament.id);
                    }, 1500);
                }
            }
        }, 1200);

        cancelBtn.onclick = () => {
            clearInterval(findingInterval);
            modal.remove();
            this.showNotification('Matchmaking cancelled', 'info');
        };
    }

    sendLobbyChat(msg) {
        const bubble = document.getElementById('user-chat-bubble');
        if (bubble) {
            bubble.textContent = msg;
            bubble.style.opacity = '1';
            setTimeout(() => bubble.style.opacity = '0', 3000);
        }
    }

    finalizeRegistration(tournamentId) {
        const tournament = this.activeBrackets.get(tournamentId);
        if (!tournament) return;

        // Deduct entry fee
        this.deductCoins(tournament.entryFee, `Tournament Entry: ${tournament.name}`);

        // Add user to tournament
        const userInfo = this.getUserInfo();
        tournament.participants.push({
            id: `player-${tournament.currentPlayers + 1}`,
            name: userInfo.name,
            avatar: userInfo.avatar,
            seed: tournament.currentPlayers + 1,
            wins: 0,
            rating: 1000,
            isUser: true
        });

        tournament.currentPlayers++;
        this.userRegistrations.add(tournamentId);

        this.saveTournaments();
        this.showNotification(`✅ Registered for ${tournament.name}!`, 'success');
        this.renderTournamentList();
        
        // If it was the last slot, start immediately
        if (tournament.currentPlayers >= tournament.maxPlayers) {
            this.startTournament(tournament.id);
        }
    }

    unregisterFromTournament(tournamentId) {
        const tournament = this.activeBrackets.get(tournamentId);
        if (!tournament || tournament.status !== 'registration') {
            this.showNotification('❌ Cannot unregister', 'error');
            return false;
        }

        // Refund entry fee
        this.addCoins(tournament.entryFee, `Tournament Refund: ${tournament.name}`);

        // Remove user from tournament
        tournament.participants = tournament.participants.filter(p => !p.isUser);
        tournament.currentPlayers--;
        this.userRegistrations.delete(tournamentId);

        this.saveTournaments();
        this.showNotification('✅ Unregistered successfully', 'success');
        this.renderTournamentList();

        return true;
    }

    startTournament(tournamentId) {
        const tournament = this.activeBrackets.get(tournamentId);
        if (!tournament) return;

        tournament.status = 'active';
        tournament.startTime = Date.now();
        tournament.rounds = this.generateBracket(tournament.participants.length, tournament.participants);
        tournament.currentRound = 1;

        this.saveTournaments();
        this.renderTournamentBracket(tournamentId);
        this.showNotification(`🎮 ${tournament.name} has started!`, 'success');
    }

    generateBracket(playerCount, participants, type = 'single-elimination') {
        if (type === 'double-elimination') {
            return this.generateDoubleEliminationBracket(playerCount, participants);
        }
        
        const rounds = [];
        let roundSize = playerCount;
        let roundNum = 1;

        while (roundSize > 1) {
            const matches = [];
            for (let i = 0; i < roundSize / 2; i++) {
                matches.push({
                    id: `r${roundNum}-m${i + 1}`,
                    player1: roundNum === 1 ? participants[i * 2]?.id : null,
                    player2: roundNum === 1 ? participants[i * 2 + 1]?.id : null,
                    winner: null,
                    score1: 0,
                    score2: 0,
                    status: roundNum === 1 ? 'pending' : 'waiting'
                });
            }

            rounds.push({
                round: roundNum,
                name: this.getRoundName(roundNum, playerCount),
                matches: matches,
                status: roundNum === 1 ? 'pending' : 'waiting'
            });

            roundSize /= 2;
            roundNum++;
        }

        return rounds;
    }

    generateDoubleEliminationBracket(playerCount, participants) {
        // Winners Bracket (Standard)
        const winnersRounds = this.generateBracket(playerCount, participants, 'single-elimination');
        winnersRounds.forEach(r => r.bracket = 'winners');

        // Losers Bracket
        // Number of rounds in losers bracket is (log2(playerCount) - 1) * 2 + 1
        const losersRounds = [];
        const numWinnersRounds = winnersRounds.length;
        
        // Losers Round 1: Losers from Winners Round 1
        // (For 8 players: WR1 has 4 matches, LR1 has 2 matches)
        let roundNum = 1;
        let losersInRound = playerCount / 4; 
        
        while (losersInRound >= 1) {
            // First phase: matches between players already in losers bracket
            const matchesPhase1 = [];
            for (let i = 0; i < losersInRound; i++) {
                matchesPhase1.push({
                    id: `lr${roundNum}-m${i + 1}`,
                    player1: null,
                    player2: null,
                    winner: null,
                    score1: 0,
                    score2: 0,
                    bracket: 'losers',
                    status: 'waiting'
                });
            }
            losersRounds.push({
                round: roundNum,
                name: `Losers Round ${roundNum}`,
                matches: matchesPhase1,
                bracket: 'losers',
                status: 'waiting'
            });
            roundNum++;

            // Second phase: Winners of phase 1 vs Losers from Winners Bracket
            const matchesPhase2 = [];
            for (let i = 0; i < losersInRound; i++) {
                matchesPhase2.push({
                    id: `lr${roundNum}-m${i + 1}`,
                    player1: null,
                    player2: null,
                    winner: null,
                    score1: 0,
                    score2: 0,
                    bracket: 'losers',
                    status: 'waiting'
                });
            }
            losersRounds.push({
                round: roundNum,
                name: `Losers Round ${roundNum}`,
                matches: matchesPhase2,
                bracket: 'losers',
                status: 'waiting'
            });
            roundNum++;
            
            losersInRound /= 2;
        }

        // Grand Finals
        const grandFinals = {
            round: roundNum,
            name: 'Grand Finals',
            bracket: 'finals',
            status: 'waiting',
            matches: [{
                id: `gf-m1`,
                player1: null, // Winner of Winners
                player2: null, // Winner of Losers
                winner: null,
                score1: 0,
                score2: 0,
                status: 'waiting'
            }]
        };

        return {
            winners: winnersRounds,
            losers: losersRounds,
            finals: grandFinals
        };
    }

    // ============================================
    // RENDERING
    // ============================================

    setupEventListeners() {
        // Will be called when tournament page loads
        console.log('📡 Event listeners ready');
    }

    renderTournamentList() {
        const container = document.getElementById('tournaments-list');
        if (!container) return;

        const tournaments = Array.from(this.activeBrackets.values());
        
        // Sort by status and start time
        tournaments.sort((a, b) => {
            const statusOrder = { registration: 0, active: 1, completed: 2 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            return a.startTime - b.startTime;
        });

        container.innerHTML = tournaments.map(t => this.createTournamentCard(t)).join('');
    }

    createTournamentCard(tournament) {
        const isRegistered = this.userRegistrations.has(tournament.id);
        const timeUntilStart = tournament.startTime - Date.now();
        const statusClass = tournament.status === 'active' ? 'live' : 
                           tournament.status === 'registration' ? 'open' : 'closed';

        return `
            <div class="tournament-card ${statusClass}">
                <div class="tournament-header">
                    <div class="tournament-title">
                        <h3>${tournament.name}</h3>
                        <span class="tournament-status ${tournament.status}">
                            ${tournament.status === 'active' ? '🔴 LIVE' : 
                              tournament.status === 'registration' ? '🟢 Open' : '⚪ Completed'}
                        </span>
                    </div>
                    <div class="tournament-prize">
                        <div class="prize-pool">${tournament.prizePool.toLocaleString()} 🪙</div>
                        <div class="prize-label">Prize Pool</div>
                    </div>
                </div>

                <div class="tournament-info">
                    <div class="info-item">
                        <i class="fas fa-users"></i>
                        <span>${tournament.currentPlayers}/${tournament.maxPlayers} Players</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-coins"></i>
                        <span>${tournament.entryFee} Entry Fee</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-gamepad"></i>
                        <span>${this.getGameName(tournament.game)}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>${this.formatTime(timeUntilStart, tournament.status)}</span>
                    </div>
                </div>

                <div class="tournament-prizes">
                    <div class="prize-item">🥇 ${tournament.prizes[1].toLocaleString()}</div>
                    <div class="prize-item">🥈 ${tournament.prizes[2].toLocaleString()}</div>
                    <div class="prize-item">🥉 ${tournament.prizes[3].toLocaleString()}</div>
                </div>

                <div class="tournament-actions">
                    ${tournament.status === 'registration' ? `
                        ${isRegistered ? `
                            <button class="btn-tournament btn-registered" disabled>
                                <i class="fas fa-check"></i> Registered
                            </button>
                            <button class="btn-tournament-secondary" onclick="tournamentSystem.unregisterFromTournament('${tournament.id}')">
                                Leave
                            </button>
                        ` : `
                            <button class="btn-tournament" onclick="tournamentSystem.registerForTournament('${tournament.id}')">
                                <i class="fas fa-plus"></i> Join Tournament
                            </button>
                        `}
                    ` : tournament.status === 'active' ? `
                        <button class="btn-tournament" onclick="tournamentSystem.viewTournament('${tournament.id}')">
                            <i class="fas fa-eye"></i> View Bracket
                        </button>
                    ` : `
                        <button class="btn-tournament-secondary" onclick="tournamentSystem.viewTournament('${tournament.id}')">
                            <i class="fas fa-history"></i> View Results
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    viewTournament(tournamentId) {
        const tournament = this.activeBrackets.get(tournamentId);
        if (!tournament) return;

        this.currentTournament = tournament;
        
        // Switch to bracket view
        const listView = document.getElementById('tournaments-list-view');
        const bracketView = document.getElementById('tournament-bracket-view');
        
        if (listView) listView.style.display = 'none';
        if (bracketView) bracketView.style.display = 'block';

        this.renderTournamentBracket(tournamentId);
    }

    renderTournamentBracket(tournamentId) {
        const tournament = this.activeBrackets.get(tournamentId);
        if (!tournament) return;

        const container = document.getElementById('bracket-container');
        if (!container) return;

        const headerContainer = document.getElementById('bracket-header-info');
        if (headerContainer) {
            headerContainer.innerHTML = `
                <div class="bracket-header-content">
                    <div>
                        <h2>${tournament.name}</h2>
                        <p class="tournament-subtitle">
                            ${tournament.currentPlayers} Players • ${tournament.prizePool.toLocaleString()} 🪙 Prize Pool
                             • ${this.tournamentTypes[tournament.type]?.name || tournament.type}
                            ${tournament.status === 'active' ? ' • 🔴 LIVE' : ''}
                        </p>
                    </div>
                    <button class="btn-back" onclick="tournamentSystem.backToList()">
                        <i class="fas fa-arrow-left"></i> Back to Tournaments
                    </button>
                </div>
            `;
        }

        if (tournament.type === 'double-elimination' && tournament.rounds && tournament.rounds.winners) {
            this.renderDoubleEliminationBracket(container, tournament);
            return;
        }

        if (!tournament.rounds || tournament.rounds.length === 0) {
            container.innerHTML = `
                <div class="bracket-empty">
                    <i class="fas fa-hourglass-half"></i>
                    <h3>Bracket Not Started</h3>
                    <p>The tournament bracket will be generated when the tournament begins.</p>
                </div>
            `;
            return;
        }

        // Render standard bracket visualization
        container.innerHTML = `
            <div class="bracket-wrapper">
                <div class="bracket-section-title">Winners Bracket</div>
                <div class="bracket-rounds">
                    ${tournament.rounds.map((round, idx) => this.createRoundColumn(round, tournament, idx)).join('')}
                </div>
            </div>
        `;
    }

    renderDoubleEliminationBracket(container, tournament) {
        const bracket = tournament.rounds;
        
        container.innerHTML = `
            <div class="bracket-wrapper double-elim">
                <div class="bracket-section">
                    <div class="bracket-section-title"><i class="fas fa-crown"></i> Winners Bracket</div>
                    <div class="bracket-rounds">
                        ${bracket.winners.map((round, idx) => this.createRoundColumn(round, tournament, idx)).join('')}
                    </div>
                </div>

                <div class="bracket-section losers-section">
                    <div class="bracket-section-title"><i class="fas fa-skull"></i> Losers Bracket</div>
                    <div class="bracket-rounds">
                        ${bracket.losers.map((round, idx) => this.createRoundColumn(round, tournament, idx)).join('')}
                    </div>
                </div>

                <div class="bracket-section finals-section">
                    <div class="bracket-section-title"><i class="fas fa-trophy"></i> Grand Finals</div>
                    <div class="bracket-rounds">
                        ${this.createRoundColumn(bracket.finals, tournament, 99)}
                    </div>
                </div>
            </div>
        `;
    }

    createRoundColumn(round, tournament, roundIndex) {
        const isLastRound = roundIndex === tournament.rounds.length - 1;
        
        return `
            <div class="bracket-round ${isLastRound ? 'finals' : ''}">
                <div class="round-header">
                    <h3>${round.name}</h3>
                    <span class="round-status ${round.status}">${round.status}</span>
                </div>
                <div class="round-matches">
                    ${round.matches.map(match => this.createMatchCard(match, tournament, round)).join('')}
                </div>
            </div>
        `;
    }

    createMatchCard(match, tournament, round) {
        const player1 = tournament.participants.find(p => p.id === match.player1);
        const player2 = tournament.participants.find(p => p.id === match.player2);

        const isWinner1 = match.winner === match.player1;
        const isWinner2 = match.winner === match.player2;
        
        const isUserMatch = (player1 && player1.isUser) || (player2 && player2.isUser);
        const isUserTurn = isUserMatch && match.status === 'active';
        const isSpectatable = !isUserMatch && match.status === 'active';

        return `
            <div class="match-card ${match.status} ${isSpectatable ? 'spectatable' : ''}" 
                 ${isSpectatable ? `onclick="tournamentSystem.spectateMatch('${tournament.id}', '${match.id}')"` : ''}>
                <div class="match-player ${isWinner1 ? 'winner' : ''} ${match.status === 'active' ? 'active' : ''}">
                    ${player1 ? `
                        <div class="player-info">
                            <span class="player-avatar">${player1.avatar}</span>
                            <span class="player-name">${player1.name}</span>
                            ${player1.isUser ? '<span class="you-badge">YOU</span>' : ''}
                        </div>
                        <span class="player-score">${match.score1 || '-'}</span>
                    ` : `
                        <div class="player-info">
                            <span class="player-avatar">👤</span>
                            <span class="player-name">TBD</span>
                        </div>
                        <span class="player-score">-</span>
                    `}
                </div>
                
                <div class="match-divider">
                    ${match.status === 'active' ? '<span class="live-dot"></span>' : 'VS'}
                </div>
                
                <div class="match-player ${isWinner2 ? 'winner' : ''} ${match.status === 'active' ? 'active' : ''}">
                    ${player2 ? `
                        <div class="player-info">
                            <span class="player-avatar">${player2.avatar}</span>
                            <span class="player-name">${player2.name}</span>
                            ${player2.isUser ? '<span class="you-badge">YOU</span>' : ''}
                        </div>
                        <span class="player-score">${match.score2 || '-'}</span>
                    ` : `
                        <div class="player-info">
                            <span class="player-avatar">👤</span>
                            <span class="player-name">TBD</span>
                        </div>
                        <span class="player-score">-</span>
                    `}
                </div>
                
                ${isUserTurn ? `
                    <div class="match-overlay">
                        <button class="btn-play-match" onclick="tournamentSystem.playMatch('${tournament.id}', '${match.id}')">
                            <i class="fas fa-play"></i> Play Your Match
                        </button>
                    </div>
                ` : isSpectatable ? `
                    <div class="spectate-indicator">
                        <i class="fas fa-eye"></i> Click to Spectate
                    </div>
                ` : ''}
            </div>
        `;
    }

    spectateMatch(tournamentId, matchId) {
        const tournament = this.activeBrackets.get(tournamentId);
        if (!tournament) return;

        // Find match
        let match;
        if (tournament.type === 'double-elimination') {
            const allRounds = [...tournament.rounds.winners, ...tournament.rounds.losers, tournament.rounds.finals];
            for (const round of allRounds) {
                match = round.matches.find(m => m.id === matchId);
                if (match) break;
            }
        } else {
            for (const round of tournament.rounds) {
                match = round.matches.find(m => m.id === matchId);
                if (match) break;
            }
        }

        if (!match || match.status !== 'active') return;

        const p1 = tournament.participants.find(p => p.id === match.player1);
        const p2 = tournament.participants.find(p => p.id === match.player2);

        this.showSpectatorModal(p1, p2, (winnerId) => {
            match.status = 'completed';
            match.winner = winnerId;
            // Set final scores based on winner
            if (winnerId === match.player1) {
                match.score1 = 100;
                match.score2 = Math.floor(Math.random() * 90);
            } else {
                match.score2 = 100;
                match.score1 = Math.floor(Math.random() * 90);
            }
            this.advanceWinner(tournament, match);
            this.saveTournaments();
            this.renderTournamentBracket(tournament.id);
        });
    }

    showSpectatorModal(p1, p2, onComplete) {
        const modal = document.createElement('div');
        modal.className = 'spectator-modal-overlay';
        modal.innerHTML = `
            <div class="spectator-card">
                <div class="spectator-header">
                    <span class="live-label">🔴 LIVE SIMULATION</span>
                    <h3>${p1.name} vs ${p2.name}</h3>
                </div>
                <div class="sim-view">
                    <div class="sim-player">
                        <div class="sim-avatar">${p1.avatar}</div>
                        <div class="sim-name">${p1.name}</div>
                        <div class="sim-score" id="sim-score-1">0</div>
                    </div>
                    <div class="sim-vs">VS</div>
                    <div class="sim-player">
                        <div class="sim-avatar">${p2.avatar}</div>
                        <div class="sim-name">${p2.name}</div>
                        <div class="sim-score" id="sim-score-2">0</div>
                    </div>
                </div>
                <div class="sim-status" id="sim-status">Analyzing strategies...</div>
                <div class="sim-progress-bar">
                    <div class="sim-progress-fill" id="sim-progress"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Simulation logic
        let progress = 0;
        let s1 = 0;
        let s2 = 0;
        const interval = setInterval(() => {
            progress += 2;
            if (Math.random() > 0.7) s1 += Math.floor(Math.random() * 5);
            if (Math.random() > 0.7) s2 += Math.floor(Math.random() * 5);
            
            document.getElementById('sim-score-1').textContent = s1;
            document.getElementById('sim-score-2').textContent = s2;
            document.getElementById('sim-progress').style.width = `${progress}%`;
            
            const statuses = [
                'Calculating probabilities...',
                'Simulating offense...',
                'Defensive adjustments...',
                'Analyzing trends...',
                'Final seconds...',
                'Match point!'
            ];
            document.getElementById('sim-status').textContent = statuses[Math.floor(progress / 20)] || 'Finalizing results...';

            if (progress >= 100) {
                clearInterval(interval);
                const winnerId = s1 > s2 ? p1.id : p2.id;
                const winnerName = s1 > s2 ? p1.name : p2.name;
                document.getElementById('sim-status').textContent = `Winner: ${winnerName}!`;
                
                setTimeout(() => {
                    modal.remove();
                    onComplete(winnerId);
                }, 1500);
            }
        }, 50);
    }

    backToList() {
        const listView = document.getElementById('tournaments-list-view');
        const bracketView = document.getElementById('tournament-bracket-view');
        
        if (listView) listView.style.display = 'block';
        if (bracketView) bracketView.style.display = 'none';
    }

    // ============================================
    // LIVE UPDATES
    // ============================================

    startLiveUpdates() {
        setInterval(() => {
            this.updateLiveMatches();
            this.updateTournamentTimers();
        }, 5000);
    }

    updateLiveMatches() {
        const userInfo = this.getUserInfo();
        const userName = userInfo.name;

        this.activeBrackets.forEach(tournament => {
            if (tournament.status === 'active' && tournament.rounds) {
                tournament.rounds.forEach(round => {
                    if (round.status === 'active') {
                        round.matches.forEach(match => {
                            // Find player objects
                            const p1 = tournament.participants.find(p => p.id === match.player1);
                            const p2 = tournament.participants.find(p => p.id === match.player2);
                            
                            const isUserMatch = (p1 && p1.isUser) || (p2 && p2.isUser);

                            if (match.status === 'active') {
                                // If it's a bot match, simulate it
                                if (!isUserMatch) {
                                    if (Math.random() > 0.7) {
                                        match.score1 += Math.floor(Math.random() * 10);
                                        match.score2 += Math.floor(Math.random() * 10);

                                        // Check for winner
                                        if (Math.random() > 0.9) {
                                            match.status = 'completed';
                                            match.winner = match.score1 > match.score2 ? match.player1 : match.player2;
                                            this.advanceWinner(tournament, match);
                                        }
                                    }
                                } else {
                                    // User match - we don't simulate scores
                                    // But we check if the match was completed elsewhere (e.g. game finished)
                                    this.checkUserMatchStatus(tournament, match);
                                }
                            }
                        });
                    }
                });
            }
        });

        this.saveTournaments();
        
        // Update UI if viewing bracket
        if (this.currentTournament) {
            this.renderTournamentBracket(this.currentTournament.id);
        }
    }

    checkUserMatchStatus(tournament, match) {
        // Check if there's a result in localStorage for this specific match
        const resultKey = `tournament_result_${tournament.id}_${match.id}`;
        const result = localStorage.getItem(resultKey);
        
        if (result) {
            try {
                const data = JSON.parse(result);
                match.score1 = data.score1;
                match.score2 = data.score2;
                match.status = 'completed';
                match.winner = data.winner;
                
                localStorage.removeItem(resultKey);
                this.advanceWinner(tournament, match);
                
                if (match.winner.includes('player-') && tournament.participants.find(p => p.id === match.winner)?.isUser) {
                    this.showNotification('🏆 You won your tournament match!', 'success');
                    if (window.confetti) window.confetti.celebrate();
                } else {
                    this.showNotification('❌ You were eliminated from the tournament.', 'error');
                }
            } catch (e) {
                console.error('Error parsing match result:', e);
            }
        }
    }

    advanceWinner(tournament, match) {
        if (tournament.type === 'double-elimination') {
            return this.advanceWinnerDoubleElim(tournament, match);
        }

        // Existing Single Elimination Logic
        const currentRoundIdx = tournament.rounds.findIndex(r => r.matches.some(m => m.id === match.id));
        const nextRound = tournament.rounds[currentRoundIdx + 1];
        
        if (nextRound) {
            const matchIdx = tournament.rounds[currentRoundIdx].matches.findIndex(m => m.id === match.id);
            const nextMatchIdx = Math.floor(matchIdx / 2);
            const nextMatch = nextRound.matches[nextMatchIdx];
            
            if (nextMatch) {
                if (matchIdx % 2 === 0) {
                    nextMatch.player1 = match.winner;
                } else {
                    nextMatch.player2 = match.winner;
                }
                
                if (nextMatch.player1 && nextMatch.player2) {
                    nextMatch.status = 'pending';
                }
            }
        } else {
            tournament.status = 'completed';
            tournament.winner = match.winner;
            
            const winnerObj = tournament.participants.find(p => p.id === match.winner);
            if (winnerObj && winnerObj.isUser) {
                this.addCoins(tournament.prizes[1], `Tournament Winner: ${tournament.name}`);
                if (window.achievementsSystem) {
                    window.achievementsSystem.addStat('tournamentsWon', 1);
                }
            }
        }
        
        const currentRound = tournament.rounds[currentRoundIdx];
        if (currentRound.matches.every(m => m.status === 'completed')) {
            currentRound.status = 'completed';
            if (nextRound) {
                nextRound.status = 'active';
                nextRound.matches.forEach(m => {
                    if (m.status === 'pending') m.status = 'active';
                });
            }
        }
    }

    advanceWinnerDoubleElim(tournament, match) {
        const bracket = tournament.rounds;
        const loser = match.winner === match.player1 ? match.player2 : match.player1;
        
        // Find current round and bracket type
        let currentRound, currentRoundIdx, isWinners;
        
        // Check Winners Bracket
        currentRoundIdx = bracket.winners.findIndex(r => r.matches.some(m => m.id === match.id));
        if (currentRoundIdx !== -1) {
            currentRound = bracket.winners[currentRoundIdx];
            isWinners = true;
        } else {
            // Check Losers Bracket
            currentRoundIdx = bracket.losers.findIndex(r => r.matches.some(m => m.id === match.id));
            if (currentRoundIdx !== -1) {
                currentRound = bracket.losers[currentRoundIdx];
                isWinners = false;
            } else {
                // Check Finals
                if (bracket.finals.matches.some(m => m.id === match.id)) {
                    this.completeTournament(tournament, match.winner);
                    return;
                }
            }
        }

        if (isWinners) {
            // Winner moves forward in Winners Bracket
            const nextRound = bracket.winners[currentRoundIdx + 1];
            if (nextRound) {
                const matchIdx = currentRound.matches.findIndex(m => m.id === match.id);
                const nextMatch = nextRound.matches[Math.floor(matchIdx / 2)];
                if (matchIdx % 2 === 0) nextMatch.player1 = match.winner;
                else nextMatch.player2 = match.winner;
                if (nextMatch.player1 && nextMatch.player2) nextMatch.status = 'pending';
            } else {
                // Winner of Winners Bracket goes to Grand Finals
                bracket.finals.matches[0].player1 = match.winner;
            }

            // Loser moves to Losers Bracket Round 1
            const losersRound1 = bracket.losers[0];
            const matchIdx = currentRound.matches.findIndex(m => m.id === match.id);
            const targetMatch = losersRound1.matches[Math.floor(matchIdx / 2)];
            if (matchIdx % 2 === 0) targetMatch.player1 = loser;
            else targetMatch.player2 = loser;
            if (targetMatch.player1 && targetMatch.player2) targetMatch.status = 'pending';

        } else {
            // Winner moves forward in Losers Bracket
            const nextRound = bracket.losers[currentRoundIdx + 1];
            if (nextRound) {
                const matchIdx = currentRound.matches.findIndex(m => m.id === match.id);
                // Losers bracket logic for advancing winners is different between phase 1 and 2
                // But for simplicity in this implementation, we follow a linear flow
                const nextMatch = nextRound.matches[matchIdx]; 
                if (!nextMatch.player1) nextMatch.player1 = match.winner;
                else nextMatch.player2 = match.winner;
                if (nextMatch.player1 && nextMatch.player2) nextMatch.status = 'pending';
            } else {
                // Winner of Losers Bracket goes to Grand Finals
                bracket.finals.matches[0].player2 = match.winner;
                if (bracket.finals.matches[0].player1 && bracket.finals.matches[0].player2) {
                    bracket.finals.matches[0].status = 'pending';
                }
            }
        }

        // Activate next matches if round complete
        this.checkRoundCompletion(tournament, isWinners ? bracket.winners : bracket.losers, currentRoundIdx);
    }

    checkRoundCompletion(tournament, rounds, roundIdx) {
        const currentRound = rounds[roundIdx];
        if (currentRound.matches.every(m => m.status === 'completed')) {
            currentRound.status = 'completed';
            const nextRound = rounds[roundIdx + 1];
            if (nextRound) {
                nextRound.status = 'active';
                nextRound.matches.forEach(m => {
                    if (m.status === 'pending') m.status = 'active';
                });
            } else if (tournament.type === 'double-elimination' && rounds === tournament.rounds.losers) {
                // Losers bracket complete, activate finals if ready
                if (tournament.rounds.finals.matches[0].status === 'pending') {
                    tournament.rounds.finals.status = 'active';
                    tournament.rounds.finals.matches[0].status = 'active';
                }
            }
        }
    }

    completeTournament(tournament, winnerId) {
        tournament.status = 'completed';
        tournament.winner = winnerId;
        
        const winnerObj = tournament.participants.find(p => p.id === winnerId);
        if (winnerObj && winnerObj.isUser) {
            this.addCoins(tournament.prizes[1], `Tournament Winner: ${tournament.name}`);
            if (window.achievementsSystem) {
                window.achievementsSystem.addStat('tournamentsWon', 1);
            }
        }
        
        this.saveTournaments();
    }

    playMatch(tournamentId, matchId) {
        const tournament = this.activeBrackets.get(tournamentId);
        if (!tournament) return;
        
        const gameUrl = this.getGameUrl(tournament.game);
        const fullUrl = `${gameUrl}?tournamentId=${tournamentId}&matchId=${matchId}&mode=tournament`;
        
        console.log(`🚀 Launching tournament match: ${fullUrl}`);
        
        // Open game in a way that the lounge can handle (usually an iframe or redirect)
        if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
                type: 'launchGame',
                url: fullUrl,
                tournamentId: tournamentId,
                matchId: matchId
            }, '*');
        } else {
            window.location.href = fullUrl;
        }
    }

    getGameUrl(gameId) {
        const gameUrls = {
            'parlay-battle': 'minigame-parlay-battle.html',
            'trivia': 'minigame-trivia.html',
            'slots': 'minigame-slots.html',
            'wheel': 'minigame-wheel.html',
            'coinflip': 'minigame-coinflip.html'
        };
        return gameUrls[gameId] || 'index.html';
    }

    updateTournamentTimers() {
        // Auto-start tournaments when time is reached
        this.activeBrackets.forEach(tournament => {
            if (tournament.status === 'registration' && tournament.startTime <= Date.now()) {
                if (tournament.currentPlayers >= 4) {
                    this.startTournament(tournament.id);
                }
            }
        });
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    getUserBalance() {
        if (window.globalState) {
            return window.globalState.getBalance();
        }
        return parseInt(localStorage.getItem('unified_balance') || '1000');
    }

    addCoins(amount, reason) {
        if (window.globalState) {
            window.globalState.addCoins(amount, reason);
        } else {
            const balance = this.getUserBalance();
            localStorage.setItem('unified_balance', (balance + amount).toString());
        }
    }

    deductCoins(amount, reason) {
        if (window.globalState) {
            window.globalState.deductCoins(amount, reason);
        } else {
            const balance = this.getUserBalance();
            localStorage.setItem('unified_balance', (balance - amount).toString());
        }
    }

    getUserInfo() {
        if (window.globalState && window.globalState.state.user) {
            const user = window.globalState.state.user;
            return {
                name: user.name || user.username || 'You',
                avatar: user.avatar || '😎'
            };
        }
        return {
            name: localStorage.getItem('unified_username') || 'You',
            avatar: localStorage.getItem('unified_avatar') || '😎'
        };
    }

    getGameName(gameId) {
        const games = {
            'parlay-battle': 'Parlay Battle',
            'trivia': 'Sports Trivia',
            'slots': 'Lucky Slots',
            'wheel': 'Prize Wheel',
            'coinflip': 'Coin Flip'
        };
        return games[gameId] || gameId;
    }

    formatTime(ms, status) {
        if (status === 'active') {
            return 'In Progress';
        }
        if (status === 'completed') {
            return 'Completed';
        }

        if (ms < 0) {
            return 'Starting Soon';
        }

        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);

        if (hours > 0) {
            return `Starts in ${hours}h ${minutes}m`;
        }
        return `Starts in ${minutes}m`;
    }

    showNotification(message, type = 'success') {
        if (window.SportsLounge && typeof window.SportsLounge.showNotification === 'function') {
            window.SportsLounge.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
}

// Initialize tournament system
let tournamentSystem;

document.addEventListener('DOMContentLoaded', () => {
    tournamentSystem = new TournamentSystem();
    
    // Render tournament list if container exists
    if (document.getElementById('tournaments-list')) {
        tournamentSystem.renderTournamentList();
    }
    
    console.log('✅ Tournament System Ready');
});

// Export for global access
window.TournamentSystem = TournamentSystem;
window.tournamentSystem = tournamentSystem;

console.log('✅ Tournament System Loaded');
