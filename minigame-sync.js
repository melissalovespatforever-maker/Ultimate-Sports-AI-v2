// ============================================
// MINIGAME SYNC UTILITY
// Keeps minigames in sync with global state and backend
// Now includes automatic transaction queue integration
// ============================================

const MinigameSync = {
    // Internal state
    _sessionId: null,
    _gameName: null,
    
    // Initialize game session
    init(gameName) {
        this._gameName = gameName;
        this._sessionId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🎮 MinigameSync initialized for: ${gameName}`);
        return this;
    },
    
    // Get balance from global state or parent
    getBalance() {
        if (window.parent && window.parent !== window && window.parent.globalState) {
            return window.parent.globalState.getBalance();
        } else if (window.globalState) {
            return window.globalState.getBalance();
        } else {
            return parseInt(localStorage.getItem('unified_balance') || 
                          localStorage.getItem('ultimateCoins') || 
                          localStorage.getItem('sportsLoungeBalance') || '10000');
        }
    },

    // Set balance in global state or parent (internal use only)
    setBalance(amount) {
        if (window.parent && window.parent !== window && window.parent.globalState) {
            window.parent.globalState.setBalance(amount);
        } else if (window.globalState) {
            window.globalState.setBalance(amount);
        } else {
            localStorage.setItem('unified_balance', amount.toString());
        }
    },

    // Deduct coins with validation (for bets/purchases)
    deductCoins(amount, reason = 'Game purchase', metadata = {}) {
        const balance = this.getBalance();
        
        if (balance < amount) {
            console.warn(`❌ Insufficient balance! Need ${amount}, have ${balance}`);
            return false;
        }

        // Use global state manager if available (includes transaction queueing)
        const globalState = window.parent?.globalState || window.globalState;
        if (globalState && typeof globalState.deductCoins === 'function') {
            const result = globalState.deductCoins(amount, reason, {
                game: this._gameName || 'Unknown Game',
                sessionId: this._sessionId,
                ...metadata
            });
            
            if (result !== false) {
                console.log(`💸 ${reason}: -${amount} coins (New balance: ${result})`);
                this.syncWithParent();
                return true;
            }
            return false;
        }

        // Fallback to direct balance update (no queue)
        const newBalance = balance - amount;
        this.setBalance(newBalance);
        console.log(`💸 ${reason}: -${amount} coins (New balance: ${newBalance})`);
        console.warn('⚠️ Transaction not queued - global state not available');
        
        return true;
    },

    // Add coins (for wins/rewards)
    addCoins(amount, reason = 'Game reward', metadata = {}) {
        // Use global state manager if available (includes transaction queueing)
        const globalState = window.parent?.globalState || window.globalState;
        
        let finalAmount = amount;
        let appliedMultiplier = 1.0;

        // Apply global multiplier if available
        if (globalState && typeof globalState.getMultiplier === 'function') {
            appliedMultiplier = globalState.getMultiplier('coins');
        } else if (window.currencyManager && typeof window.currencyManager.getMultiplier === 'function') {
            appliedMultiplier = window.currencyManager.getMultiplier('coins');
        }

        if (appliedMultiplier > 1.0) {
            finalAmount = Math.floor(amount * appliedMultiplier);
            
            // Add multiplier info to metadata for transaction logging
            metadata.baseAmount = amount;
            metadata.multiplier = appliedMultiplier;
            
            console.log(`✨ Multiplier applied: ${appliedMultiplier}x (Base: ${amount}, Final: ${finalAmount})`);
            
            // Show a small toast for the boost if possible
            if (window.showToast) {
                window.showToast(`✨ Boost Active! +${Math.round((appliedMultiplier - 1) * 100)}% Coins`, 'success');
            } else if (window.parent && window.parent.showToast) {
                window.parent.showToast(`✨ Boost Active! +${Math.round((appliedMultiplier - 1) * 100)}% Coins`, 'success');
            }
        }

        if (globalState && typeof globalState.addCoins === 'function') {
            const newBalance = globalState.addCoins(finalAmount, reason, {
                game: this._gameName || 'Unknown Game',
                sessionId: this._sessionId,
                ...metadata
            });
            
            console.log(`💰 ${reason}: +${finalAmount} coins (New balance: ${newBalance})`);
            this.syncWithParent();
            return newBalance;
        }

        // Fallback to direct balance update (no queue)
        const balance = this.getBalance();
        const newBalance = balance + finalAmount;
        this.setBalance(newBalance);
        console.log(`💰 ${reason}: +${finalAmount} coins (New balance: ${newBalance})`);
        console.warn('⚠️ Transaction not queued - global state not available');
        
        return newBalance;
    },
    
    // Record a bet (convenience method)
    recordBet(betAmount) {
        return this.deductCoins(
            betAmount,
            `${this._gameName || 'Game'} - Bet placed`,
            { type: 'bet', betAmount }
        );
    },
    
    // Record a win (convenience method)
    recordWin(payout, gameData = {}) {
        const metadata = { 
            type: 'win', 
            payout, 
            game: this._gameName || 'Unknown Game',
            sessionId: this._sessionId,
            ...gameData 
        };
        
        // If payout > 0, addCoins will handle both the coins and the win stat on the backend
        if (payout > 0) {
            return this.addCoins(payout, `${this._gameName || 'Game'} - Win`, metadata);
        } else {
            // Otherwise just record the win stat
            const globalState = window.parent?.globalState || window.globalState;
            if (globalState && typeof globalState.recordWin === 'function') {
                return globalState.recordWin(metadata);
            }
        }
    },
    
    // Record a loss (convenience method)
    recordLoss(betAmount, gameData = {}) {
        const metadata = {
            type: 'loss',
            betAmount,
            game: this._gameName || 'Unknown Game',
            sessionId: this._sessionId,
            ...gameData
        };

        const globalState = window.parent?.globalState || window.globalState;
        if (globalState && typeof globalState.recordLoss === 'function') {
            return globalState.recordLoss(metadata);
        }
    },
    
    // Check if user can afford amount
    canAfford(amount) {
        return this.getBalance() >= amount;
    },

    // Request fresh state from parent (if in iframe)
    requestStateFromParent() {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'requestState' }, '*');
        }
    },

    // Setup message listener for parent communication
    setupParentListener() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'stateUpdate' && event.data.balance) {
                // Balance updated from parent
                window.dispatchEvent(new CustomEvent('balanceUpdated', { 
                    detail: { balance: event.data.balance } 
                }));
            }
        });
    },

    // Send balance update back to parent
    syncWithParent() {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ 
                type: 'updateBalance', 
                balance: this.getBalance() 
            }, '*');
        }
    },

    /**
     * Report progress toward a daily quest
     * @param {string} category The quest category (e.g., 'slots_played', 'games_played')
     * @param {number} amount Progress increment (default 1)
     */
    reportQuestProgress(category, amount = 1) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ 
                type: 'questProgress', 
                category: category, 
                amount: amount 
            }, '*');
        } else {
            // If not in iframe, try direct call
            if (window.dailyQuests) {
                window.dailyQuests.updateProgress(category, amount);
            }
        }
    },

    // Save game data to localStorage
    saveGameData(gameId, data) {
        const key = `game_${gameId}_data`;
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Load game data from localStorage
    loadGameData(gameId) {
        const key = `game_${gameId}_data`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // Track game result
    trackGameResult(gameId, won, coinReward = 0, streak = 0) {
        const results = JSON.parse(localStorage.getItem('game_results') || '[]');
        
        results.push({
            gameId,
            won,
            coinReward,
            streak,
            timestamp: Date.now()
        });

        // Keep only last 100 results
        if (results.length > 100) {
            results.shift();
        }

        localStorage.setItem('game_results', JSON.stringify(results));

        // Update global stats via single source of truth (GlobalStateManager)
        if (won) {
            this.recordWin(coinReward, { gameId, streak });
        } else {
            this.recordLoss(0, { gameId, streak });
        }
        
        // Check for tournament mode
        const urlParams = new URLSearchParams(window.location.search);
        const tournamentId = urlParams.get('tournamentId');
        const matchId = urlParams.get('matchId');
        
        if (tournamentId && matchId) {
            this.recordTournamentResult(tournamentId, matchId, won);
        }
    },

    // Record a result specifically for the tournament system
    recordTournamentResult(tournamentId, matchId, won) {
        console.log(`🏆 Recording tournament result for ${tournamentId} / ${matchId}: ${won ? 'WIN' : 'LOSS'}`);
        
        // We need to know the player ID of the user. 
        // In our tournament system, the user is added with a player ID like 'player-X'
        // We'll let the TournamentSystem handle finding the correct ID from the bracket
        // by passing a special 'USER' flag as winner if won=true.
        
        const tournaments = JSON.parse(localStorage.getItem('active_tournaments') || '{}');
        const tournament = tournaments[tournamentId];
        
        if (!tournament) return;
        
        const match = tournament.rounds.flatMap(r => r.matches).find(m => m.id === matchId);
        if (!match) return;
        
        const player1 = tournament.participants.find(p => p.id === match.player1);
        const isUserP1 = player1 && player1.isUser;
        
        const winner = won ? (isUserP1 ? match.player1 : match.player2) : (isUserP1 ? match.player2 : match.player1);
        
        const result = {
            tournamentId,
            matchId,
            winner,
            score1: won ? (isUserP1 ? 100 : 0) : (isUserP1 ? 0 : 100),
            score2: won ? (isUserP1 ? 0 : 100) : (isUserP1 ? 100 : 0),
            timestamp: Date.now()
        };
        
        const resultKey = `tournament_result_${tournamentId}_${matchId}`;
        localStorage.setItem(resultKey, JSON.stringify(result));
        
        // Also notify via postMessage if in iframe
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'tournamentMatchResult',
                ...result
            }, '*');
        }
    },

    // Get game statistics
    getGameStats(gameId) {
        const results = JSON.parse(localStorage.getItem('game_results') || '[]');
        const gameResults = results.filter(r => r.gameId === gameId);
        
        return {
            played: gameResults.length,
            won: gameResults.filter(r => r.won).length,
            lost: gameResults.filter(r => !r.won).length,
            totalEarnings: gameResults.reduce((sum, r) => sum + r.coinReward, 0)
        };
    }
};

// Auto-setup parent listener on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MinigameSync.setupParentListener();
        MinigameSync.requestStateFromParent();
    });
} else {
    MinigameSync.setupParentListener();
    MinigameSync.requestStateFromParent();
}

// Make globally available
window.MinigameSync = MinigameSync;

console.log('✅ Minigame Sync utility loaded');
