// ============================================
// BET RESULT TRACKER
// Automatic bet result tracking from ESPN API
// ============================================

console.log('🎯 Loading Bet Result Tracker');

class BetResultTracker {
    constructor() {
        this.apiBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports';
        this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
        this.intervalId = null;
        this.isChecking = false;
        this.lastCheckTimestamp = null;
        this.sports = {
            'NBA': 'basketball/nba',
            'NBA Basketball': 'basketball/nba',
            'NFL': 'football/nfl',
            'NFL Football': 'football/nfl',
            'MLB': 'baseball/mlb',
            'MLB Baseball': 'baseball/mlb',
            'NHL': 'hockey/nhl',
            'NHL Hockey': 'hockey/nhl',
            'Soccer': 'soccer/usa.1',
            'International Soccer': 'soccer/eng.1'
        };
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
        console.log('🎯 Bet Result Tracker initialized');
        
        // Check immediately on init
        this.checkAllBets();
        
        // Start periodic checking
        this.startAutoCheck();
        
        // Check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Page visible, checking bets...');
                this.checkAllBets();
            }
        });
        
        // Check when My Bets page is loaded
        window.addEventListener('myBetsPageLoaded', () => {
            console.log('📋 My Bets page loaded, checking results...');
            this.checkAllBets();
        });
    }

    startAutoCheck() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        this.intervalId = setInterval(() => {
            this.checkAllBets();
        }, this.checkInterval);
        
        console.log(`✅ Auto-check started (every ${this.checkInterval / 60000} minutes)`);
    }

    stopAutoCheck() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏸️ Auto-check stopped');
        }
    }

    // ============================================
    // MAIN CHECK FUNCTION
    // ============================================

    async checkAllBets() {
        if (this.isChecking) {
            console.log('⏳ Already checking, skipping...');
            return;
        }

        this.isChecking = true;
        this.lastCheckTimestamp = Date.now();

        console.log('🔄 Checking all pending bets...');

        // Get My Bets manager
        const myBetsManager = window.myBetsManager;
        if (!myBetsManager) {
            console.warn('⚠️ My Bets manager not available');
            this.isChecking = false;
            return;
        }

        // Get all pending bets
        const pendingBets = myBetsManager.bets.filter(bet => bet.status === 'pending');
        
        if (pendingBets.length === 0) {
            console.log('✅ No pending bets to check');
            this.isChecking = false;
            return;
        }

        console.log(`📊 Checking ${pendingBets.length} pending bets`);

        // Check each bet
        let updatedCount = 0;
        for (const bet of pendingBets) {
            try {
                const result = await this.checkBetResult(bet);
                if (result) {
                    myBetsManager.updateBet(bet.id, { status: result });
                    updatedCount++;
                    console.log(`✅ Updated bet ${bet.id}: ${result}`);
                    
                    // Show notification
                    this.showResultNotification(bet, result);
                }
            } catch (error) {
                console.error(`❌ Error checking bet ${bet.id}:`, error);
            }
        }

        if (updatedCount > 0) {
            console.log(`✨ Updated ${updatedCount} bet(s)`);
            
            // Refresh My Bets page if open
            if (window.myBetsManager && typeof window.myBetsManager.renderBets === 'function') {
                window.myBetsManager.renderBets();
            }
        }

        this.isChecking = false;
    }

    // ============================================
    // BET RESULT CHECKING
    // ============================================

    async checkBetResult(bet) {
        try {
            // Parse team names from matchup
            const teams = this.parseTeams(bet.match);
            if (!teams) {
                console.warn('⚠️ Could not parse teams from:', bet.match);
                return null;
            }

            // Get sport endpoint
            const sportEndpoint = this.sports[bet.sport];
            if (!sportEndpoint) {
                console.warn('⚠️ Unsupported sport:', bet.sport);
                return null;
            }

            // Fetch recent/completed games
            const games = await this.fetchGames(sportEndpoint);
            if (!games || games.length === 0) {
                console.log('ℹ️ No games found for', bet.sport);
                return null;
            }

            // Find matching game
            const matchingGame = this.findMatchingGame(games, teams);
            if (!matchingGame) {
                console.log('ℹ️ No matching game found for:', bet.match);
                return null;
            }

            // Check if game is final
            if (!this.isGameFinal(matchingGame)) {
                console.log('⏳ Game not final yet:', bet.match);
                return null;
            }

            // Determine bet result
            const result = this.determineBetResult(bet, matchingGame);
            return result;

        } catch (error) {
            console.error('❌ Error checking bet result:', error);
            return null;
        }
    }

    // ============================================
    // ESPN API INTEGRATION
    // ============================================

    async fetchGames(sportEndpoint) {
        try {
            const url = `${this.apiBaseUrl}/${sportEndpoint}/scoreboard`;
            console.log('🔄 Fetching from ESPN:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`ESPN API error: ${response.status}`);
            }

            const data = await response.json();
            const games = data.events || [];
            
            console.log(`✅ Fetched ${games.length} games from ESPN`);
            return games;

        } catch (error) {
            console.error('❌ ESPN API fetch failed:', error);
            return [];
        }
    }

    // ============================================
    // GAME MATCHING
    // ============================================

    parseTeams(matchupText) {
        // Handle various formats: "Lakers vs Warriors", "Lakers @ Warriors", "LAL vs GSW"
        const patterns = [
            /(.+?)\s+vs\s+(.+)/i,
            /(.+?)\s+@\s+(.+)/i,
            /(.+?)\s+at\s+(.+)/i
        ];

        for (const pattern of patterns) {
            const match = matchupText.match(pattern);
            if (match) {
                return {
                    team1: match[1].trim(),
                    team2: match[2].trim()
                };
            }
        }

        return null;
    }

    findMatchingGame(games, teams) {
        for (const game of games) {
            if (!game.competitions || !game.competitions[0]) continue;

            const competition = game.competitions[0];
            const competitors = competition.competitors || [];

            if (competitors.length !== 2) continue;

            const homeTeam = competitors.find(c => c.homeAway === 'home');
            const awayTeam = competitors.find(c => c.homeAway === 'away');

            if (!homeTeam || !awayTeam) continue;

            // Get team names and abbreviations
            const homeNames = [
                homeTeam.team.displayName,
                homeTeam.team.shortDisplayName,
                homeTeam.team.abbreviation,
                homeTeam.team.name
            ].filter(Boolean).map(n => n.toLowerCase());

            const awayNames = [
                awayTeam.team.displayName,
                awayTeam.team.shortDisplayName,
                awayTeam.team.abbreviation,
                awayTeam.team.name
            ].filter(Boolean).map(n => n.toLowerCase());

            // Check if bet teams match game teams
            const team1Lower = teams.team1.toLowerCase();
            const team2Lower = teams.team2.toLowerCase();

            const team1Match = homeNames.some(name => name.includes(team1Lower) || team1Lower.includes(name)) ||
                              awayNames.some(name => name.includes(team1Lower) || team1Lower.includes(name));
            
            const team2Match = homeNames.some(name => name.includes(team2Lower) || team2Lower.includes(name)) ||
                              awayNames.some(name => name.includes(team2Lower) || team2Lower.includes(name));

            if (team1Match && team2Match) {
                console.log('✅ Found matching game:', homeTeam.team.displayName, 'vs', awayTeam.team.displayName);
                return game;
            }
        }

        return null;
    }

    isGameFinal(game) {
        if (!game.status) return false;
        
        const statusType = game.status.type?.state?.toLowerCase();
        const completed = game.status.type?.completed;
        
        return completed === true || statusType === 'post' || statusType === 'final';
    }

    // ============================================
    // BET RESULT DETERMINATION
    // ============================================

    determineBetResult(bet, game) {
        const competition = game.competitions[0];
        const competitors = competition.competitors;

        const homeTeam = competitors.find(c => c.homeAway === 'home');
        const awayTeam = competitors.find(c => c.homeAway === 'away');

        const homeScore = parseInt(homeTeam.score) || 0;
        const awayScore = parseInt(awayTeam.score) || 0;

        console.log('📊 Final Score:', `${awayTeam.team.displayName} ${awayScore} @ ${homeTeam.team.displayName} ${homeScore}`);

        // Determine which team was picked
        const pickLower = bet.pick.toLowerCase();
        const matchLower = bet.match.toLowerCase();

        // Extract team from pick
        let pickedTeam = null;
        let isHomeTeam = false;

        // Check if home team is in the pick
        const homeNames = [homeTeam.team.displayName, homeTeam.team.abbreviation, homeTeam.team.name];
        const awayNames = [awayTeam.team.displayName, awayTeam.team.abbreviation, awayTeam.team.name];

        for (const name of homeNames) {
            if (pickLower.includes(name.toLowerCase())) {
                pickedTeam = homeTeam;
                isHomeTeam = true;
                break;
            }
        }

        if (!pickedTeam) {
            for (const name of awayNames) {
                if (pickLower.includes(name.toLowerCase())) {
                    pickedTeam = awayTeam;
                    isHomeTeam = false;
                    break;
                }
            }
        }

        if (!pickedTeam) {
            console.warn('⚠️ Could not determine picked team from:', bet.pick);
            return null;
        }

        // Determine bet type and result
        if (pickLower.includes('ml') || pickLower.includes('moneyline')) {
            // Moneyline bet
            return this.checkMoneyline(isHomeTeam, homeScore, awayScore);
        } else if (pickLower.match(/[+-]\d+\.?\d*/)) {
            // Spread bet
            const spread = this.extractSpread(bet.pick);
            return this.checkSpread(isHomeTeam, homeScore, awayScore, spread);
        } else if (pickLower.includes('over') || pickLower.includes('under') || pickLower.match(/[ou]\s*\d+/i)) {
            // Over/Under bet
            const total = homeScore + awayScore;
            const line = this.extractTotal(bet.pick);
            return this.checkOverUnder(pickLower, total, line);
        }

        console.warn('⚠️ Unknown bet type:', bet.pick);
        return null;
    }

    checkMoneyline(isHomeTeam, homeScore, awayScore) {
        if (isHomeTeam) {
            return homeScore > awayScore ? 'won' : 'lost';
        } else {
            return awayScore > homeScore ? 'won' : 'lost';
        }
    }

    checkSpread(isHomeTeam, homeScore, awayScore, spread) {
        if (isHomeTeam) {
            const adjustedScore = homeScore + spread;
            return adjustedScore > awayScore ? 'won' : 'lost';
        } else {
            const adjustedScore = awayScore + spread;
            return adjustedScore > homeScore ? 'won' : 'lost';
        }
    }

    checkOverUnder(pickText, total, line) {
        const isOver = pickText.includes('over') || pickText.match(/\bo\s*\d+/i);
        
        if (isOver) {
            return total > line ? 'won' : 'lost';
        } else {
            return total < line ? 'won' : 'lost';
        }
    }

    extractSpread(pickText) {
        const match = pickText.match(/([+-]\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 0;
    }

    extractTotal(pickText) {
        const match = pickText.match(/[ou]\s*(\d+\.?\d*)/i);
        return match ? parseFloat(match[1]) : 0;
    }

    // ============================================
    // NOTIFICATIONS
    // ============================================

    showResultNotification(bet, result) {
        const isWin = result === 'won';
        const emoji = isWin ? '🎉' : '😔';
        const message = `${emoji} Bet Result: ${bet.match} - ${isWin ? 'WON' : 'LOST'}!`;

        // Show toast notification
        if (window.showToast) {
            window.showToast(message, isWin ? 'success' : 'error');
        }

        // Browser notification (if permission granted)
        this.showBrowserNotification(bet, result);

        console.log(`${emoji} ${bet.match} - ${result.toUpperCase()}`);
    }

    showBrowserNotification(bet, result) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const isWin = result === 'won';
            new Notification('Bet Result Updated! ' + (isWin ? '🎉' : '😔'), {
                body: `${bet.match}\n${bet.pick}\nResult: ${result.toUpperCase()}`,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `bet-${bet.id}`,
                requireInteraction: false
            });
        } else if (Notification.permission !== 'denied') {
            // Request permission
            Notification.requestPermission();
        }
    }

    // ============================================
    // MANUAL TRIGGERS
    // ============================================

    async checkNow() {
        console.log('🔄 Manual check triggered');
        await this.checkAllBets();
        return this.lastCheckTimestamp;
    }

    getStatus() {
        return {
            isChecking: this.isChecking,
            lastCheck: this.lastCheckTimestamp,
            autoCheckEnabled: !!this.intervalId,
            checkInterval: this.checkInterval
        };
    }
}

// ============================================
// INITIALIZATION
// ============================================

let betResultTracker;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        betResultTracker = new BetResultTracker();
        betResultTracker.init();
        window.betResultTracker = betResultTracker;
    });
} else {
    betResultTracker = new BetResultTracker();
    betResultTracker.init();
    window.betResultTracker = betResultTracker;
}

console.log('✅ Bet Result Tracker Module loaded');
