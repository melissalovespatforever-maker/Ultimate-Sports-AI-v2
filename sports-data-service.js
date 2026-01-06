// ==========================================
// SPORTS DATA SERVICE (Unified ESPN Integration)
// Source of truth for Live Scores, Schedule, and Game Data
// ==========================================

const SPORTS_CONFIG = {
    ENDPOINTS: {
        NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
        NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
        MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
        NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
        SOCCER: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', // Premier League default
        NCAAF: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
        NCAAB: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'
    },
    CACHE_DURATION: 60000, // 1 minute cache for live data
    LONG_CACHE_DURATION: 300000 // 5 minutes for future/past
};

class SportsDataService {
    constructor() {
        this.cache = new Map();
        this.activeRequests = new Map();
        this.isUsingMockData = false;
        this.userVotes = this.loadVotes();
        this.oddsHistory = new Map(); // gameId -> [{timestamp, value}]
        this.MAX_HISTORY_POINTS = 20; // Keep last 20 data points
    }

    /**
     * Track odds movement over time
     */
    trackOddsMovement(gameId, odds, gameName = 'Game') {
        if (!odds || !odds.details) return;

        // Try to extract a numeric value from odds (e.g., "KC -3.5" -> -3.5)
        const numericMatch = odds.details.match(/(-?\d+\.?\d*)/);
        if (!numericMatch) return;

        const value = parseFloat(numericMatch[1]);
        const now = Date.now();

        if (!this.oddsHistory.has(gameId)) {
            this.oddsHistory.set(gameId, []);
        }

        const history = this.oddsHistory.get(gameId);
        
        // Only add if value changed or enough time passed (prevent redundant points)
        const lastPoint = history[history.length - 1];
        if (!lastPoint || lastPoint.value !== value || (now - lastPoint.timestamp > 60000)) {
            
            // Check for Sharp Alert if we have previous data
            if (lastPoint && lastPoint.value !== value) {
                const diff = value - lastPoint.value;
                const movementPercent = ((diff) / (Math.abs(lastPoint.value) || 1) * 100).toFixed(1);
                const absMovement = Math.abs(parseFloat(movementPercent));
                
                // If movement is > 3.0%, trigger Sharp Alert
                if (absMovement >= 3.0 && window.ActivityFeed) {
                    const trend = diff < 0 ? 'Sharpening' : 'Fading';
                    window.ActivityFeed.logSharpAlert(gameName, trend, absMovement);
                    
                    // Small delay to prevent alert spam for the same game
                    if (this._lastAlertTime === gameId && (now - (this._alertCooldowns?.[gameId] || 0) < 300000)) {
                        // Skip if alerted in last 5 mins
                    } else {
                        if (!this._alertCooldowns) this._alertCooldowns = {};
                        this._alertCooldowns[gameId] = now;
                    }
                }
            }

            history.push({ timestamp: now, value: value });
            
            // Limit history size
            if (history.length > this.MAX_HISTORY_POINTS) {
                history.shift();
            }
        }
    }

    getOddsHistory(gameId) {
        return this.oddsHistory.get(gameId) || [];
    }

    loadVotes() {
        try {
            const saved = localStorage.getItem('game_hype_votes');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }

    saveVotes() {
        localStorage.setItem('game_hype_votes', JSON.stringify(this.userVotes));
    }

    /**
     * Cast a hype vote for a game
     */
    voteForGame(gameId) {
        // Simple local tracking to prevent spam
        const votedGames = JSON.parse(localStorage.getItem('user_voted_games') || '[]');
        if (votedGames.includes(gameId)) return false;

        votedGames.push(gameId);
        localStorage.setItem('user_voted_games', JSON.stringify(votedGames));

        // Update local vote count
        this.userVotes[gameId] = (this.userVotes[gameId] || 0) + 1;
        this.saveVotes();

        // Broadcast vote if possible (simulated for now, but could use WebSockets)
        if (window.socket && window.socket.connected) {
            window.socket.emit('game:hype_vote', { gameId });
        }
        
        // Return updated vote count
        return this.userVotes[gameId];
    }

    getVotesForGame(gameId) {
        return this.userVotes[gameId] || 0;
    }

    /**
     * Fetch games for a specific sport
     * @param {string} sportKey - NFL, NBA, etc.
     * @param {boolean} forceRefresh - Ignore cache
     */
    async getGames(sportKey, forceRefresh = false) {
        const endpoint = SPORTS_CONFIG.ENDPOINTS[sportKey];
        if (!endpoint) {
            console.error(`Unknown sport key: ${sportKey}`);
            return [];
        }

        const cacheKey = `games_${sportKey}`;
        const cached = this.cache.get(cacheKey);
        
        // Return cached data if valid
        if (!forceRefresh && cached && (Date.now() - cached.timestamp < SPORTS_CONFIG.CACHE_DURATION)) {
            return cached.data;
        }

        // Deduplicate simultaneous requests
        if (this.activeRequests.has(cacheKey)) {
            return this.activeRequests.get(cacheKey);
        }

        const request = this.fetchFromESPN(endpoint, sportKey);
        this.activeRequests.set(cacheKey, request);

        try {
            const data = await request;
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            this.activeRequests.delete(cacheKey);
            return data;
        } catch (error) {
            console.error(`Failed to fetch ${sportKey} games:`, error);
            this.activeRequests.delete(cacheKey);
            return cached ? cached.data : []; // Fallback to stale cache if available
        }
    }

    async fetchFromESPN(url, sportKey) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s timeout for stability

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const json = await response.json();
            this.isUsingMockData = false; // Successfully fetched real data
            return this.processESPNData(json, sportKey);
        } catch (e) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') {
                console.warn(`ESPN API Timeout for ${sportKey}. Switching to mock data.`);
            } else {
                console.warn(`ESPN API Error for ${sportKey}:`, e);
            }
            // Fallback to high-quality mock data so the app remains functional
            this.isUsingMockData = true; 
            return this.getMockGames(sportKey);
        }
    }

    getMockGames(sportKey) {
        console.log(`Generating mock data for ${sportKey}...`);
        const teams = {
            NFL: [['KC', 'Chiefs', 'E31837'], ['PHI', 'Eagles', '004C54'], ['BUF', 'Bills', '00338D'], ['SF', '49ers', 'AA0000']],
            NBA: [['LAL', 'Lakers', '552583'], ['GSW', 'Warriors', '1D428A'], ['BOS', 'Celtics', '007A33'], ['MIL', 'Bucks', '00471B']],
            MLB: [['NYY', 'Yankees', '003087'], ['LAD', 'Dodgers', '005A9C'], ['HOU', 'Astros', 'EB6E1F'], ['ATL', 'Braves', 'CE1141']],
            NHL: [['BOS', 'Bruins', 'FFB81C'], ['NYR', 'Rangers', '0038A8'], ['VGK', 'Golden Knights', 'B4975A'], ['TOR', 'Maple Leafs', '00205B']],
            SOCCER: [['84', 'Man City', '6CABDD'], ['359', 'Arsenal', 'EF0107'], ['364', 'Liverpool', 'C8102E'], ['360', 'Man United', 'DA291C']] // Soccer uses ID based logos on ESPN CDN
        };

        const activeTeams = teams[sportKey] || teams.NFL;
        const mockEvents = [];

        for (let i = 0; i < 4; i++) {
            const teamA = activeTeams[i % activeTeams.length];
            const teamB = activeTeams[(i + 1) % activeTeams.length];
            const isLive = i < 2;
            const isCompleted = i === 3;
            const state = isLive ? 'in' : (isCompleted ? 'post' : 'pre');
            
            const game = {
                id: `mock-${sportKey}-${i}`,
                sport: sportKey,
                date: new Date(),
                status: state,
                statusDisplay: isLive ? '2nd Quarter' : (isCompleted ? 'Final' : '7:00 PM'),
                isLive,
                isCompleted,
                venue: 'Virtual Arena',
                odds: { details: `${teamA[0]} ${((Math.random() > 0.5 ? -1 : 1) * (3.5 + (Math.random() * 2))).toFixed(1)}`, overUnder: 48.5 },
                homeTeam: {
                    id: teamA[0], // Store the ID for proper logo resolution
                    name: teamA[1],
                    shortName: teamA[0],
                    logo: this.resolveTeamLogo(teamA[0], sportKey, null),
                    score: isLive || isCompleted ? Math.floor(Math.random() * 30) : '0',
                    record: '10-2',
                    color: `#${teamA[2]}`
                },
                awayTeam: {
                    id: teamB[0], // Store the ID for proper logo resolution
                    name: teamB[1],
                    shortName: teamB[0],
                    logo: this.resolveTeamLogo(teamB[0], sportKey, null),
                    score: isLive || isCompleted ? Math.floor(Math.random() * 30) : '0',
                    record: '8-4',
                    color: `#${teamB[2]}`
                }
            };

            game.hypeLevel = this.calculateHype(game);
            mockEvents.push(game);
        }
        return mockEvents;
    }

    /**
     * Sanitizes and resolves team logos to prevent 404s
     * Uses the global resolveSportsLogo helper for consistency
     */
    resolveTeamLogo(id, sport, providedUrl) {
        if (window.resolveSportsLogo) {
            return window.resolveSportsLogo(id, sport, providedUrl);
        }
        
        // Basic fallback if global helper not yet available
        return providedUrl || 'https://play.rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN';
    }

    processESPNData(data, sportKey) {
        if (!data || !data.events) return [];

        return data.events.map(event => {
            const competition = event.competitions[0];
            const competitors = competition.competitors;
            const home = competitors.find(c => c.homeAway === 'home');
            const away = competitors.find(c => c.homeAway === 'away');
            
            // Status parsing
            const statusState = event.status.type.state; // 'pre', 'in', 'post'
            const isLive = statusState === 'in';
            const isCompleted = statusState === 'post';
            
            // Clock/Period
            let gameStatusDisplay = event.status.type.detail; // e.g., "Final", "10:00 - 1st Quarter"
            if (statusState === 'pre') {
                gameStatusDisplay = new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            // Odds (if available)
            let odds = null;
            if (competition.odds && competition.odds.length > 0) {
                odds = {
                    details: competition.odds[0].details, // e.g., "DAL -3.5"
                    overUnder: competition.odds[0].overUnder
                };
            }

            // SOCCER LOGO HARDENING - Force numeric IDs for known problematic teams
            const sanitizeLogoRaw = (id, logo) => {
                const idStr = String(id || '').toUpperCase();
                const logoStr = String(logo || '').toLowerCase();
                const normalizedSport = String(sportKey || '').toUpperCase();
                
                if (normalizedSport === 'SOCCER' || normalizedSport === 'EPL') {
                    if (idStr === '84' || idStr === 'MCI' || logoStr.includes('mci.png')) return 'https://a.espncdn.com/i/teamlogos/soccer/500/84.png';
                    if (idStr === '359' || idStr === 'ARS' || logoStr.includes('ars.png')) return 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png';
                }
                return this.resolveTeamLogo(id, sportKey, logo);
            };

            const processedGame = {
                id: event.id,
                sport: sportKey,
                date: new Date(event.date),
                status: statusState, // pre, in, post
                statusDisplay: gameStatusDisplay,
                isLive,
                isCompleted,
                venue: competition.venue?.fullName || 'TBD',
                odds: odds,
                homeTeam: {
                    id: home.team.id,
                    name: home.team.displayName,
                    shortName: home.team.abbreviation,
                    logo: sanitizeLogoRaw(home.team.id, home.team.logo),
                    score: home.score,
                    record: home.records?.[0]?.summary || '',
                    color: home.team.color ? `#${home.team.color}` : '#333'
                },
                awayTeam: {
                    id: away.team.id,
                    name: away.team.displayName,
                    shortName: away.team.abbreviation,
                    logo: sanitizeLogoRaw(away.team.id, away.team.logo),
                    score: away.score,
                    record: away.records?.[0]?.summary || '',
                    color: away.team.color ? `#${away.team.color}` : '#333'
                },
                // Raw data for detailed analysis if needed
                espnLink: event.links?.[0]?.href
            };

            // Track odds movement
            if (odds) {
                const gameName = `${away.team.abbreviation} @ ${home.team.abbreviation}`;
                this.trackOddsMovement(event.id, odds, gameName);
            }

            // Calculate Hype Level (0-100)
            processedGame.hypeLevel = this.calculateHype(processedGame);

            return processedGame;
        }).sort((a, b) => a.date - b.date);
    }

    /**
     * Calculate a hype score for a game based on various factors
     */
    calculateHype(game) {
        let hype = 30; // Base hype

        // 1. User Votes (Each vote adds 5 hype, up to 30)
        const votes = this.getVotesForGame(game.id);
        hype += Math.min(30, votes * 5);

        // 2. Closeness of score (for live or post games)
        if (game.isLive || game.isCompleted) {
            const scoreDiff = Math.abs(parseInt(game.homeTeam.score) - parseInt(game.awayTeam.score));
            if (scoreDiff <= 3) hype += 40;
            else if (scoreDiff <= 7) hype += 25;
            else if (scoreDiff <= 14) hype += 10;
        }

        // 2. High scoring games
        const totalScore = parseInt(game.homeTeam.score || 0) + parseInt(game.awayTeam.score || 0);
        if (totalScore > 40 && game.sport === 'NFL') hype += 15;
        if (totalScore > 220 && game.sport === 'NBA') hype += 15;

        // 3. Status (Live games are more hype)
        if (game.isLive) hype += 20;

        // 4. Matchup quality (Record based)
        // Simple logic: if both teams have winning records
        const isWinningRecord = (rec) => {
            if (!rec) return false;
            const [w, l] = rec.split('-').map(Number);
            return w > l;
        };

        if (isWinningRecord(game.homeTeam.record) && isWinningRecord(game.awayTeam.record)) {
            hype += 15;
        }

        // 5. Sport specific adjustments
        if (game.sport === 'SOCCER' && (game.homeTeam.score > 2 || game.awayTeam.score > 2)) hype += 20;

        return Math.min(100, hype);
    }

    /**
     * Get ALL games across all supported sports
     * Helpful for the "All Sports" view
     */
    async getAllLiveGames() {
        const sports = Object.keys(SPORTS_CONFIG.ENDPOINTS);
        const promises = sports.map(sport => this.getGames(sport));
        const results = await Promise.all(promises);
        
        return results.flat().filter(g => g.isLive);
    }

    async getAllUpcomingGames() {
        const sports = Object.keys(SPORTS_CONFIG.ENDPOINTS);
        const promises = sports.map(sport => this.getGames(sport));
        const results = await Promise.all(promises);
        
        return results.flat()
            .filter(g => g.status === 'pre')
            .sort((a, b) => a.date - b.date);
    }
}

// Global Instance
window.sportsDataService = new SportsDataService();
console.log('🏈 Sports Data Service Initialized (ESPN Integrated)');
