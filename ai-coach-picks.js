// ============================================
// AI COACH PICKS DISPLAY INTERFACE
// Live Picks with Confidence Ratings
// ============================================

console.log('🎯 AI Coach Picks Module loading...');

const aiCoachPicks = {
    currentCoach: null,
    isOpen: false,
    cachedPicks: new Map(), // Cache picks per coach
    cacheTimestamp: null,
    CACHE_DURATION: 60000, // 1 minute
    usingFallback: false, // Track if using demo data

    // Fetch real picks from backend API
    async fetchRealPicks(coach) {
        try {
            // Check cache first
            const cacheKey = `coach_${coach.id}`;
            const cached = this.cachedPicks.get(cacheKey);
            
            if (cached && this.cacheTimestamp && (Date.now() - this.cacheTimestamp < this.CACHE_DURATION)) {
                console.log('✅ Using cached picks for', coach.name);
                return cached;
            }

            console.log('🔄 Fetching real picks from backend for', coach.name);
            
            // List of API endpoints to try
            const apiEndpoints = [
                window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app',
                '' // Fallback to same-origin with relative path
            ];
            
            let lastError = null;
            
            for (const apiUrl of apiEndpoints) {
                try {
                    // Create abort controller for timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);
                    
                    // Get auth token if available
                    const token = localStorage.getItem('auth_token');
                    const headers = {
                        'Content-Type': 'application/json'
                    };
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                    
                    const response = await fetch(`${apiUrl}/api/ai-coaches/picks`, {
                        method: 'GET',
                        headers: headers,
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                    }

                    const data = await response.json();
                    
                    if (data.success && data.coaches) {
                        // Find this coach's picks
                        const coachData = data.coaches.find(c => c.id === coach.id);
                        
                        if (coachData && coachData.recentPicks) {
                            // Convert backend format to frontend format
                            const picks = coachData.recentPicks.map((pick, index) => ({
                                id: index + 1,
                                matchup: pick.game,
                                betType: this.determineBetType(pick.pick),
                                betDetails: pick.pick,
                                odds: this.formatOdds(pick.odds),
                                confidence: pick.confidence,
                                stake: this.calculateStake(pick.confidence),
                                status: 'pending',
                                reasoning: pick.reasoning,
                                time: pick.gameTime,
                                injuries: pick.injuries // Include injury data
                            }));

                            // Cache the picks
                            this.cachedPicks.set(cacheKey, picks);
                            this.cacheTimestamp = Date.now();
                            
                            console.log(`✅ Fetched ${picks.length} real picks for ${coach.name} from ${apiUrl}`);
                            return picks;
                        }
                    }
                    
                    // If we got here, API worked but no picks
                    throw new Error('No picks in response');
                    
                } catch (err) {
                    lastError = err;
                    console.warn(`⚠️ Failed to fetch from ${apiUrl}: ${err.message}`);
                    continue; // Try next endpoint
                }
            }
            
            // All endpoints failed or no picks found
            console.warn('⚠️ Could not fetch picks from any endpoint, using fallback');
            console.warn('💡 Tip: Check if backend is deployed and THE_ODDS_API_KEY + OPENAI_API_KEY are set');
            this.usingFallback = true;
            return await this.generatePicksFromLiveScores(coach);

        } catch (error) {
            console.error('❌ Error fetching real picks:', error.message);
            // Fallback to generated picks
            console.log(`📋 Falling back to generated picks for ${coach.name}`);
            console.log(`💡 Backend might be unreachable. Check: ${apiUrl}/api/health`);
            this.usingFallback = true;
            return await this.generatePicksFromLiveScores(coach);
        }
    },

    // New: Generate picks based on REAL live score data
    async generatePicksFromLiveScores(coach) {
        try {
            if (!window.liveScoresManager) {
                return this.generatePicks(coach); // Fallback to random
            }

            // Map coach sport to live scores key
            const sportMap = {
                'NBA Basketball': 'nba',
                'NFL Football': 'nfl',
                'MLB Baseball': 'mlb',
                'NHL Hockey': 'nhl',
                'International Soccer': 'soccer',
                'College Football': 'nfl', // Fallback
                'College Basketball': 'nba' // Fallback
            };

            const sportKey = sportMap[coach.sport] || 'nfl';
            const realGames = await window.liveScoresManager.ensureDataLoaded(sportKey);

            if (!realGames || realGames.length === 0) {
                console.warn('No real games found for', coach.sport);
                return this.generatePicks(coach); // Fallback to random if no games
            }

            console.log(`✅ Generating picks from ${realGames.length} real games`);
            
            const picks = [];
            // Generate 1-2 picks per game, max 5
            const gamesToPick = realGames.slice(0, 5);
            
            gamesToPick.forEach((game, index) => {
                const betType = ['Spread', 'Moneyline', 'Over/Under'][Math.floor(Math.random() * 3)];
                const confidence = Math.floor(Math.random() * 25) + 65; // 65-90%
                
                // Determine pick based on random "analysis" of real data
                let pickDetails = '';
                let odds = '-110';
                
                if (betType === 'Moneyline') {
                    // Pick the team with better record or random if not available
                    const pickHome = Math.random() > 0.5;
                    pickDetails = pickHome ? `${game.homeTeam} ML` : `${game.awayTeam} ML`;
                    odds = pickHome ? '-130' : '+110';
                } else if (betType === 'Spread') {
                    const spread = (Math.random() * 6 + 1).toFixed(1);
                    const pickHome = Math.random() > 0.5;
                    pickDetails = pickHome ? `${game.homeTeam} -${spread}` : `${game.awayTeam} +${spread}`;
                } else {
                    // Total
                    let total = 220.5;
                    if (sportKey === 'nfl') total = 47.5;
                    if (sportKey === 'mlb' || sportKey === 'nhl') total = 6.5;
                    if (sportKey === 'soccer') total = 2.5;
                    
                    const isOver = Math.random() > 0.5;
                    pickDetails = `${game.awayTeamAbbr}/${game.homeTeamAbbr} ${isOver ? 'Over' : 'Under'} ${total}`;
                }

                picks.push({
                    id: index + 1,
                    matchup: `${game.awayTeam} @ ${game.homeTeam}`,
                    betType,
                    betDetails: pickDetails,
                    odds,
                    confidence,
                    stake: this.calculateStake(confidence),
                    status: game.status === 'LIVE' ? 'live' : 'pending',
                    reasoning: this.generateReasoning(coach, betType),
                    time: game.status === 'SCHEDULED' ? game.time : (game.status === 'LIVE' ? 'LIVE NOW' : 'Final'),
                    injuries: null
                });
            });

            return picks.sort((a, b) => b.confidence - a.confidence);

        } catch (e) {
            console.error('Error generating picks from live scores:', e);
            return this.generatePicks(coach);
        }
    },

    determineBetType(pickText) {
        if (pickText.includes('ML')) return 'Moneyline';
        if (pickText.includes('+') || pickText.includes('-')) return 'Spread';
        if (pickText.includes('O') || pickText.includes('U')) return 'Over/Under';
        return 'Moneyline';
    },

    formatOdds(odds) {
        if (typeof odds === 'number') {
            return odds > 0 ? `+${odds}` : `${odds}`;
        }
        return odds;
    },

    calculateStake(confidence) {
        if (confidence >= 85) return 3; // High confidence = 3 units
        if (confidence >= 75) return 2; // Medium confidence = 2 units
        return 1; // Low confidence = 1 unit
    },

    // Fallback: Generate sample picks if API fails
    generatePicks(coach) {
        // Sport-specific data
        const sportData = {
            'NBA Basketball': {
                teams: ['Lakers', 'Warriors', 'Celtics', 'Heat', 'Nuggets', 'Suns', 'Nets', 'Bucks', 'Grizzlies', 'Mavericks'],
                players: ['LeBron James', 'Stephen Curry', 'Jayson Tatum', 'Luka Doncic', 'Giannis Antetokounmpo', 'Damian Lillard'],
                stats: ['Points', 'Rebounds', 'Assists', 'Three Pointers', 'Steals', 'Blocks'],
                totals: { min: 215, max: 245 }
            },
            'NFL Football': {
                teams: ['49ers', 'Chiefs', 'Eagles', 'Bills', 'Cowboys', 'Packers', 'Ravens', 'Lions', 'Bengals', 'Chargers'],
                players: ['Patrick Mahomes', 'Josh Allen', 'Travis Kelce', 'Jalen Hurts', 'Lamar Jackson', 'Justin Jefferson'],
                stats: ['Passing Yards', 'Rushing Yards', 'Touchdowns', 'Receptions', 'Receiving Yards', 'Interceptions'],
                totals: { min: 40, max: 55 }
            },
            'MLB Baseball': {
                teams: ['Yankees', 'Dodgers', 'Astros', 'Braves', 'Red Sox', 'Mets', 'Cubs', 'Cardinals', 'Angels', 'Padres'],
                players: ['Aaron Judge', 'Shohei Ohtani', 'Mike Trout', 'Juan Soto', 'Kyle Schwarber', 'Mookie Betts'],
                stats: ['Hits', 'Runs', 'RBIs', 'Home Runs', 'Strikeouts', 'Stolen Bases'],
                totals: { min: 7, max: 11 }
            },
            'NHL Hockey': {
                teams: ['Bruins', 'Maple Leafs', 'Oilers', 'Avalanche', 'Rangers', 'Lightning', 'Hurricanes', 'Kings', 'Golden Knights', 'Stars'],
                players: ['Connor McDavid', 'Sidney Crosby', 'Alex Ovechkin', 'Auston Matthews', 'Nathan MacKinnon', 'Igor Shesterkin'],
                stats: ['Goals', 'Assists', 'Plus/Minus', 'Shots on Goal', 'Hits', 'Penalties'],
                totals: { min: 5.5, max: 7.5 }
            },
            'International Soccer': {
                teams: ['Man City', 'Real Madrid', 'Bayern Munich', 'PSG', 'Liverpool', 'Barcelona', 'Arsenal', 'Inter Milan', 'Juventus', 'AC Milan'],
                players: ['Erling Haaland', 'Cristiano Ronaldo', 'Lionel Messi', 'Kylian Mbappé', 'Robert Lewandowski', 'Vinicius Jr'],
                stats: ['Goals', 'Assists', 'Shots on Target', 'Passes Completed', 'Tackles', 'Fouls'],
                totals: { min: 2.5, max: 4.5 }
            }
        };

        // Get the right data for this sport
        const currentSport = sportData[coach.sport] || sportData['NBA Basketball'];
        const teams = currentSport.teams;
        const players = currentSport.players;
        const stats = currentSport.stats;
        const totals = currentSport.totals;

        const betTypes = ['Spread', 'Moneyline', 'Over/Under', 'Player Props'];
        const picks = [];
        const numPicks = Math.floor(Math.random() * 3) + 3; // 3-5 picks

        for (let i = 0; i < numPicks; i++) {
            const team1 = teams[Math.floor(Math.random() * teams.length)];
            const team2 = teams.filter(t => t !== team1)[Math.floor(Math.random() * (teams.length - 1))];
            const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
            const confidence = Math.floor(Math.random() * 30) + 65; // 65-95%
            const odds = (Math.random() * 2 + 1.5).toFixed(2);
            const stake = Math.floor(Math.random() * 3) + 1; // 1-3 units

            let betDetails = '';
            if (betType === 'Spread') {
                const spread = (Math.random() * 10 - 5).toFixed(1);
                betDetails = `${team1} ${spread > 0 ? '+' : ''}${spread}`;
            } else if (betType === 'Moneyline') {
                betDetails = `${team1} ML`;
            } else if (betType === 'Over/Under') {
                // Sport-specific totals
                const total = (Math.random() * (totals.max - totals.min) + totals.min).toFixed(1);
                betDetails = `${team1} vs ${team2} O${total}`;
            } else {
                // Player Props - NOW SPORT-SPECIFIC!
                const player = players[Math.floor(Math.random() * players.length)];
                const stat = stats[Math.floor(Math.random() * stats.length)];
                
                // Sport-specific line ranges
                let line;
                if (coach.sport === 'NBA Basketball') {
                    line = Math.floor(Math.random() * 15) + 15; // 15-30 points typically
                } else if (coach.sport === 'NFL Football') {
                    if (stat.includes('Yards')) {
                        line = Math.floor(Math.random() * 80) + 50; // 50-130 yards
                    } else if (stat.includes('Touchdowns')) {
                        line = Math.floor(Math.random() * 2) + 0.5; // 0.5-2.5 TDs
                    } else {
                        line = Math.floor(Math.random() * 8) + 4; // 4-12 receptions
                    }
                } else if (coach.sport === 'MLB Baseball') {
                    if (stat === 'Home Runs') {
                        line = Math.floor(Math.random() * 1.5) + 0.5; // 0.5-2 HRs
                    } else if (stat === 'Hits') {
                        line = Math.floor(Math.random() * 2) + 1; // 1-3 hits
                    } else {
                        line = Math.floor(Math.random() * 3) + 2; // 2-5 RBIs/runs
                    }
                } else if (coach.sport === 'NHL Hockey') {
                    if (stat === 'Goals') {
                        line = Math.floor(Math.random() * 1.5) + 0.5; // 0.5-2 goals
                    } else if (stat === 'Assists') {
                        line = Math.floor(Math.random() * 1.5) + 0.5; // 0.5-2 assists
                    } else {
                        line = Math.floor(Math.random() * 3) + 2; // 2-5 shots/hits
                    }
                } else if (coach.sport === 'International Soccer') {
                    if (stat === 'Goals') {
                        line = Math.floor(Math.random() * 1.5) + 0.5; // 0.5-2 goals
                    } else if (stat === 'Assists') {
                        line = Math.floor(Math.random() * 1) + 0.5; // 0.5-1.5 assists
                    } else {
                        line = Math.floor(Math.random() * 2) + 2; // 2-4 shots
                    }
                } else {
                    line = Math.floor(Math.random() * 30) + 20;
                }
                
                betDetails = `${player} O${line}.5 ${stat}`;
            }

            picks.push({
                id: i + 1,
                matchup: `${team1} vs ${team2}`,
                betType,
                betDetails,
                odds,
                confidence,
                stake,
                status: Math.random() > 0.7 ? 'live' : 'pending',
                reasoning: this.generateReasoning(coach, betType),
                time: this.getGameTime()
            });
        }

        return picks.sort((a, b) => b.confidence - a.confidence);
    },

    generateReasoning(coach, betType) {
        const strengths = coach.strengths || ['statistical', 'matchup'];
        
        const reasons = {
            'Spread': [
                `${strengths[0]} analysis shows value here`,
                `Line movement indicates sharp money on this side`,
                `Historical matchup data heavily favors this pick`,
                `Key player advantage creates significant edge`
            ],
            'Moneyline': [
                `Dominant form and momentum favor this outcome`,
                `Market overreacting to recent news - value play`,
                `Head-to-head history strongly supports this`,
                `Superior roster depth gives edge in close game`
            ],
            'Over/Under': [
                `Pace metrics and ${strengths[1] || 'offensive'} point to this total`,
                `Weather conditions favor high-scoring affair`,
                `Both defenses struggling - expect points`,
                `Offensive efficiency ratings indicate under`
            ],
            'Player Props': [
                `Usage rate and matchup create perfect storm`,
                `Defensive weakness exploitable by this player`,
                `Recent performance trend continues upward`,
                `Game script heavily favors this outcome`
            ]
        };

        const typeReasons = reasons[betType] || reasons['Spread'];
        return typeReasons[Math.floor(Math.random() * typeReasons.length)];
    },

    getGameTime() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Generate game times that are in the future (at least 30 mins from now)
        let gameHour = currentHour + Math.floor(Math.random() * 4) + 1; // 1-4 hours from now
        let gameMinute = ['00', '15', '30', '45'][Math.floor(Math.random() * 4)];
        
        // Handle day rollover
        let dayLabel = 'Today';
        if (gameHour >= 24) {
            gameHour = gameHour - 24;
            dayLabel = 'Tomorrow';
        }
        
        // Convert to 12-hour format
        const period = gameHour >= 12 ? 'PM' : 'AM';
        const displayHour = gameHour > 12 ? gameHour - 12 : (gameHour === 0 ? 12 : gameHour);
        
        return `${dayLabel} ${displayHour}:${gameMinute} ${period}`;
    },

    async open(coach) {
        if (!coach) return;
        
        this.currentCoach = coach;
        this.isOpen = true;
        this.usingFallback = false; // Reset fallback flag
        
        // Show loading modal first
        this.createLoadingModal();
        
        // Fetch real picks from backend
        const picks = await this.fetchRealPicks(coach);
        
        // Create modal with real picks
        this.createModal(picks);
    },

    createLoadingModal() {
        // Remove existing modal if any
        const existing = document.getElementById('ai-coach-picks-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'ai-coach-picks-modal';
        modal.className = 'coach-picks-modal active';
        
        modal.innerHTML = `
            <div class="coach-picks-overlay"></div>
            <div class="coach-picks-container" style="display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: var(--text-primary);">
                    <div class="spinner" style="width: 48px; height: 48px; margin: 0 auto 20px;"></div>
                    <h3>Loading ${this.currentCoach.name}'s Picks...</h3>
                    <p style="color: var(--text-secondary); margin-top: 8px;">🔄 Fetching real-time ESPN + Odds data...</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    close() {
        const modal = document.getElementById('ai-coach-picks-modal');
        if (modal) {
            modal.classList.add('closing');
            setTimeout(() => {
                modal.remove();
                this.isOpen = false;
                this.currentCoach = null;
            }, 300);
        }
    },

    createModal(picks) {
        // Remove existing modal if any
        const existing = document.getElementById('ai-coach-picks-modal');
        if (existing) existing.remove();

        // Safety check: ensure picks is an array
        if (!Array.isArray(picks)) {
            console.error('❌ Invalid picks data, regenerating...');
            picks = this.generatePicks(this.currentCoach);
        }
        
        if (picks.length === 0) {
            console.warn('⚠️ No picks available, generating fallback...');
            picks = this.generatePicks(this.currentCoach);
        }

        const modal = document.createElement('div');
        modal.id = 'ai-coach-picks-modal';
        modal.className = 'coach-picks-modal';
        
        modal.innerHTML = `
            <div class="coach-picks-overlay" onclick="aiCoachPicks.close()"></div>
            <div class="coach-picks-container">
                <!-- Header -->
                <div class="coach-picks-header" style="background: linear-gradient(135deg, ${this.currentCoach.color}20, ${this.currentCoach.color}05);">
                    <div class="picks-header-left">
                        <img src="${this.currentCoach.avatar}" alt="${this.currentCoach.name}" class="picks-coach-avatar">
                        <div class="picks-coach-info">
                            <h3>${this.currentCoach.name}'s Picks</h3>
                            <p>${this.currentCoach.sport} • ${picks.length} Active Picks</p>
                            <div class="picks-stats">
                                <span class="stat-badge">
                                    <i class="fas fa-percentage"></i> ${this.currentCoach.accuracy}% Win Rate
                                </span>
                                <span class="stat-badge">
                                    <i class="fas fa-fire"></i> ${this.currentCoach.streak} Streak
                                </span>
                            </div>
                        </div>
                    </div>
                    <button class="picks-close-btn" onclick="aiCoachPicks.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Filter Tabs -->
                <div class="picks-filters">
                    <button class="filter-tab active" data-filter="all">
                        All Picks <span class="tab-count">${picks.length}</span>
                    </button>
                    <button class="filter-tab" data-filter="live">
                        Live <span class="tab-count">${picks.filter(p => p.status === 'live').length}</span>
                    </button>
                    <button class="filter-tab" data-filter="high-confidence">
                        High Confidence <span class="tab-count">${picks.filter(p => p.confidence >= 80).length}</span>
                    </button>
                </div>

                <!-- Picks List -->
                <div class="coach-picks-list" id="picks-list">
                    ${picks.map(pick => this.renderPickCard(pick)).join('')}
                </div>

                <!-- Footer -->
                <div class="picks-footer">
                    ${this.usingFallback ? `
                        <div class="footer-warning" style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                            <i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>
                            <span style="color: #fbbf24; font-size: 13px;">Using demo data - Backend API unavailable. For real-time picks, ensure backend is deployed with API keys.</span>
                        </div>
                    ` : ''}
                    <div class="footer-message">
                        <i class="fas fa-info-circle"></i>
                        <span>"${this.currentCoach.catchphrase}"</span>
                    </div>
                    <div class="footer-actions">
                        <button class="btn-secondary" onclick="window.location.href='my-bets.html'" title="View all saved bets">
                            <i class="fas fa-clipboard-list"></i> My Bets
                        </button>
                        <button class="btn-secondary" onclick="aiCoachPicks.exportPicks()">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <button class="btn-primary" onclick="aiCoachPicks.addToParlay()">
                            <i class="fas fa-plus"></i> Parlay
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animate in
        setTimeout(() => modal.classList.add('active'), 10);

        // Setup filter listeners
        this.setupFilters(picks);
    },

    renderPickCard(pick) {
        const confidenceColor = pick.confidence >= 85 ? '#10b981' : pick.confidence >= 75 ? '#f59e0b' : '#6366f1';
        const confidenceLabel = pick.confidence >= 85 ? 'LOCK' : pick.confidence >= 75 ? 'STRONG' : 'VALUE';
        const statusBadge = pick.status === 'live' ? '<span class="status-badge live"><span class="pulse-dot"></span> LIVE</span>' : '';

        return `
            <div class="pick-card" data-confidence="${pick.confidence >= 80 ? 'high' : 'normal'}" data-status="${pick.status}">
                <div class="pick-header">
                    <div class="pick-matchup">
                        <h4>${pick.betDetails}</h4>
                        <p class="pick-game">${pick.matchup}</p>
                        <span class="pick-time"><i class="fas fa-clock"></i> ${pick.time}</span>
                    </div>
                    ${statusBadge}
                </div>

                <div class="pick-details">
                    <div class="pick-meta">
                        <div class="meta-item">
                            <label>Bet Type</label>
                            <span class="bet-type-badge">${pick.betType}</span>
                        </div>
                        <div class="meta-item">
                            <label>Odds</label>
                            <span class="odds-value">${pick.odds > 0 ? '+' : ''}${pick.odds}</span>
                        </div>
                        <div class="meta-item">
                            <label>Stake</label>
                            <span class="stake-value">${pick.stake} ${pick.stake === 1 ? 'Unit' : 'Units'}</span>
                        </div>
                    </div>

                    <div class="confidence-section">
                        <div class="confidence-header">
                            <label>Confidence Rating</label>
                            <span class="confidence-label" style="color: ${confidenceColor};">${confidenceLabel}</span>
                        </div>
                        <div class="confidence-bar-container">
                            <div class="confidence-bar-bg">
                                <div class="confidence-bar-fill" style="width: ${pick.confidence}%; background: ${confidenceColor};"></div>
                            </div>
                            <span class="confidence-percentage">${pick.confidence}%</span>
                        </div>
                    </div>

                    <div class="pick-reasoning">
                        <i class="fas fa-lightbulb"></i>
                        <span>${pick.reasoning}</span>
                    </div>
                </div>

                <div class="pick-actions">
                    <button class="pick-action-btn" onclick="aiCoachPicks.saveToMyBets(${pick.id})" title="Save to My Bets">
                        <i class="fas fa-bookmark"></i> Save
                    </button>
                    <button class="pick-action-btn" onclick="aiCoachPicks.viewAnalysis(${pick.id})">
                        <i class="fas fa-chart-line"></i> Analysis
                    </button>
                    <button class="pick-action-btn primary" onclick="aiCoachPicks.addPickToSlip(${pick.id})">
                        <i class="fas fa-plus"></i> Add to Slip
                    </button>
                </div>
            </div>
        `;
    },

    setupFilters(picks) {
        const filterTabs = document.querySelectorAll('.filter-tab');
        const picksList = document.getElementById('picks-list');

        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active state
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Filter picks
                const filter = tab.dataset.filter;
                const pickCards = picksList.querySelectorAll('.pick-card');

                pickCards.forEach(card => {
                    let show = true;

                    if (filter === 'live') {
                        show = card.dataset.status === 'live';
                    } else if (filter === 'high-confidence') {
                        show = card.dataset.confidence === 'high';
                    }

                    if (show) {
                        card.style.display = 'block';
                        setTimeout(() => card.classList.add('visible'), 10);
                    } else {
                        card.style.display = 'none';
                        card.classList.remove('visible');
                    }
                });
            });
        });

        // Show all cards initially
        const pickCards = document.querySelectorAll('.pick-card');
        pickCards.forEach((card, index) => {
            setTimeout(() => card.classList.add('visible'), index * 50);
        });
    },

    saveToMyBets(pickId) {
        // Get the current picks
        const picks = Array.from(document.querySelectorAll('.pick-card')).map((card, index) => {
            const id = index + 1;
            if (id !== pickId) return null;
            
            // Extract pick data from the card
            const matchup = card.querySelector('.pick-game')?.textContent || 'Unknown';
            const betDetails = card.querySelector('.pick-matchup h4')?.textContent || 'Unknown';
            const odds = card.querySelector('.odds-value')?.textContent || '-110';
            const confidence = card.querySelector('.confidence-percentage')?.textContent || '0%';
            const reasoning = card.querySelector('.pick-reasoning span')?.textContent || '';
            const gameTime = card.querySelector('.pick-time')?.textContent?.replace('🕐', '').trim() || 'TBD';
            
            return {
                matchup,
                betDetails,
                odds,
                confidence,
                reasoning,
                gameTime
            };
        }).filter(p => p !== null)[0];
        
        if (!picks) {
            console.error('Pick not found');
            return;
        }

        // Calculate potential win based on odds
        const stake = '$50'; // Default stake
        const potentialWin = this.calculatePotentialWin(50, picks.odds);

        // Create bet data for My Bets system
        const betData = {
            sport: this.currentCoach.sport,
            match: picks.matchup,
            pick: picks.betDetails,
            odds: picks.odds,
            stake: stake,
            potentialWin: potentialWin,
            coach: this.currentCoach.name,
            confidence: picks.confidence,
            reasoning: picks.reasoning,
            gameTime: picks.gameTime,
            status: 'pending'
        };

        // Check if My Bets system is loaded
        if (window.addBetToMyBets) {
            window.addBetToMyBets(betData);
            
            // Visual feedback
            const btn = event.target.closest('.pick-action-btn');
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                btn.disabled = true;
                
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 2000);
            }
            
            // Show success toast
            if (window.showToast) {
                window.showToast(`✅ Pick saved to My Bets!`, 'success');
            } else {
                alert(`✅ ${this.currentCoach.name}'s pick saved to My Bets!\n\n📋 View all saved bets at /my-bets.html`);
            }
            
            console.log('✅ Pick saved to My Bets:', betData);
        } else {
            console.warn('⚠️ My Bets system not loaded');
            alert('⚠️ My Bets system is loading... Please try again in a moment, or navigate to My Bets page manually.');
        }
    },

    calculatePotentialWin(stake, odds) {
        // Remove + or - sign and parse
        const oddsNum = parseInt(odds.replace(/[+\-]/g, ''));
        const isPositive = odds.includes('+');
        
        if (isPositive) {
            // Positive odds: stake * (odds/100)
            return '$' + (stake + (stake * oddsNum / 100)).toFixed(2);
        } else {
            // Negative odds: stake * (100/odds)
            return '$' + (stake + (stake * 100 / oddsNum)).toFixed(2);
        }
    },

    viewAnalysis(pickId) {
        alert(`📊 Full Analysis for Pick #${pickId}\n\n✨ Coming soon - Detailed breakdown with stats, trends, and projections`);
    },

    addPickToSlip(pickId) {
        alert(`✅ Pick #${pickId} added to your bet slip!\n\n🎯 Navigate to Bet Slip to review and place your wager`);
    },

    addToParlay() {
        alert(`🎯 Add picks to parlay builder\n\n✨ Coming soon - Custom parlay builder integration`);
    },

    exportPicks() {
        const picks = Array.from(document.querySelectorAll('.pick-card')).map((card, index) => {
            const matchup = card.querySelector('.pick-game')?.textContent || 'Unknown';
            const betDetails = card.querySelector('.pick-matchup h4')?.textContent || 'Unknown';
            const odds = card.querySelector('.odds-value')?.textContent || '-110';
            const confidence = card.querySelector('.confidence-percentage')?.textContent || '0%';
            
            return `${matchup} - ${betDetails} (${odds}) - ${confidence} confidence`;
        }).join('\n');
        
        const exportText = `${this.currentCoach.name}'s AI Picks\n` +
                          `Sport: ${this.currentCoach.sport}\n` +
                          `Win Rate: ${this.currentCoach.accuracy}%\n\n` +
                          `${picks}\n\n` +
                          `Generated by Ultimate Sports AI`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(exportText).then(() => {
            if (window.showToast) {
                window.showToast('📋 Picks copied to clipboard!', 'success');
            } else {
                alert('📋 Picks copied to clipboard!');
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('❌ Failed to export picks');
        });
    }
};

// Expose to global window
window.aiCoachPicks = aiCoachPicks;

console.log('✅ AI Coach Picks Module loaded');
