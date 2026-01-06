// ============================================
// SECURE API SERVICE
// Replace localStorage calls with secure backend API
// Add this to your app.js APIService class
// ============================================

/*
INSTRUCTIONS:
1. Copy these methods into your APIService class in app.js
2. Replace the existing APIService methods with these secure versions
3. All user data now comes from backend, not localStorage
*/

// Add these methods to your existing APIService class:

// ============================================
// USER PROFILE & WALLET METHODS
// ============================================

/**
 * Get current user's profile and stats
 * Replaces: localStorage.getItem('sportsLoungeBalance'), etc.
 */
async getUserProfile() {
    return this.request('/api/users/profile');
}

/**
 * Update user profile
 * Replaces: localStorage.setItem('guestUsername'), localStorage.setItem('guestAvatar')
 */
async updateUserProfile(username, avatar) {
    return this.request('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ username, avatar })
    });
}

/**
 * Perform wallet transaction (deduct or credit coins)
 * NOTE: Backend currently uses specific endpoints for transactions (join tournament, place bet).
 * This generic endpoint is not yet implemented.
 */
async walletTransaction(type, amount, reason, metadata = {}) {
    console.warn('Generic wallet transactions not supported. Use specific feature endpoints.');
    return { success: false, error: 'Not implemented' };
    /*
    return this.request('/api/users/me/wallet/transaction', {
        method: 'POST',
        body: JSON.stringify({ type, amount, reason, metadata })
    });
    */
}

/**
 * Get transaction history
 * NOTE: Currently not exposed via API
 */
async getTransactionHistory(limit = 50, offset = 0) {
    console.warn('Transaction history API not implemented');
    return { transactions: [] };
    // return this.request(`/api/users/me/wallet/transactions?limit=${limit}&offset=${offset}`);
}

// ============================================
// TOURNAMENT METHODS
// ============================================

/**
 * Get all available tournaments
 * Replaces: localStorage.getItem('tournaments')
 */
async getTournaments() {
    return this.request('/api/tournaments');
}

/**
 * Join a tournament (deducts entry fee server-side)
 * Replaces: localStorage-based tournament join
 */
async joinTournament(tournamentId) {
    return this.request(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST'
    });
}

/**
 * Get user's tournament history
 */
async getUserTournaments() {
    return this.request('/api/tournaments/user/registered');
}

// ============================================
// MINI-GAMES METHODS
// ============================================

/**
 * Start a game session (deducts wager)
 * Replaces: localStorage-based balance deduction
 */
async startGame(gameType, wager) {
    return this.request('/api/games/start', {
        method: 'POST',
        body: JSON.stringify({ gameType, wager })
    });
}

/**
 * Submit game result (credits prize if win)
 * Replaces: localStorage-based prize credit
 */
async submitGameResult(gameId, outcome, score = null, multiplier = 2) {
    return this.request(`/api/games/${gameId}/result`, {
        method: 'POST',
        body: JSON.stringify({ outcome, score, multiplier })
    });
}

/**
 * Get user's game statistics
 * Replaces: localStorage.getItem('slotsStats'), etc.
 */
async getGameStats() {
    console.warn('Game stats API not implemented');
    return { stats: {} };
    // return this.request('/api/users/me/games/stats');
}

// ============================================
// LEADERBOARD METHODS
// ============================================

/**
 * Get balance leaderboard (richest players)
 */
async getLeaderboardBalance(limit = 100) {
    return this.request(`/api/leaderboards/balance?limit=${limit}`);
}

/**
 * Get tournament winners leaderboard
 */
async getLeaderboardTournaments(limit = 100) {
    return this.request(`/api/leaderboards/tournaments?limit=${limit}`);
}

// ============================================
// HELPER METHODS
// ============================================

/**
 * Check if user has sufficient balance
 * @param {number} amount - Amount needed
 * @returns {Promise<boolean>}
 */
async hasSufficientBalance(amount) {
    try {
        const profile = await this.getUserProfile();
        return profile.user.balance >= amount;
    } catch (error) {
        console.error('Error checking balance:', error);
        return false;
    }
}

/**
 * Get user's current balance
 * @returns {Promise<number>}
 */
async getBalance() {
    try {
        const profile = await this.getUserProfile();
        return profile.user.balance;
    } catch (error) {
        console.error('Error fetching balance:', error);
        return 0;
    }
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*

// Example 1: Get user profile
const profile = await api.getUserProfile();
console.log('Balance:', profile.user.balance);
console.log('Username:', profile.user.username);
console.log('Tournaments Won:', profile.user.tournamentsWon);

// Example 2: Update profile
await api.updateUserProfile('CoolUser123', '🎮');

// Example 3: Deduct coins for tournament entry
const result = await api.walletTransaction(
    'deduct', 
    100, 
    'tournament_entry',
    { tournamentId: 5, tournamentName: 'Gold Masters' }
);
console.log('New balance:', result.newBalance);

// Example 4: Join tournament (deducts entry fee automatically)
const tournament = await api.joinTournament(5);
console.log('Joined tournament, new balance:', tournament.newBalance);

// Example 5: Start a game
const game = await api.startGame('slots', 50);
console.log('Game started:', game.gameId);
console.log('New balance:', game.newBalance);

// Example 6: Submit game result
const result = await api.submitGameResult(game.gameId, 'win', 100, 3);
console.log('Won:', result.prize);
console.log('New balance:', result.newBalance);

// Example 7: Get game stats
const stats = await api.getGameStats();
console.log('Slots stats:', stats.stats.slots);

// Example 8: Get leaderboard
const leaderboard = await api.getLeaderboardBalance();
console.log('Top 10:', leaderboard.rankings.slice(0, 10));

*/
