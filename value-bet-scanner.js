/**
 * AI Value Bet & Arbitrage Scanner
 * Scans for mathematical edges (Arbitrage) and statistical edges (Value Bets)
 * across multiple simulated sportsbooks.
 */

class ValueBetScanner {
    constructor() {
        this.sportsbooks = [
            { id: 'draftkings', name: 'DraftKings', color: '#53D337' },
            { id: 'fanduel', name: 'FanDuel', color: '#0079FF' },
            { id: 'betmgm', name: 'BetMGM', color: '#D4AF37' },
            { id: 'caesars', name: 'Caesars', color: '#002855' },
            { id: 'pointsbet', name: 'PointsBet', color: '#F23535' }
        ];
        this.lastScanTime = null;
    }

    /**
     * Open the Value Scanner Modal
     */
    async open() {
        // Show loading toast
        if (typeof showToast === 'function') showToast('🔍 Scanning markets for opportunities...', 'info');

        // Fetch games (reuse logic from BettingOddsTracker/SmartParlayGenerator)
        const games = await this.fetchGamesWithMultiBookOdds();
        
        // Analyze
        const arbOpportunities = this.scanForArbitrage(games);
        const valueBets = this.scanForValue(games);
        const playerProps = await this.scanPlayerProps(games);

        this.renderScannerModal(arbOpportunities, valueBets, playerProps);
    }

    /**
     * Simulate fetching games with odds from multiple books
     */
    async fetchGamesWithMultiBookOdds() {
        if (!window.sportsDataService) return [];
        
        // Get base games
        const liveGames = await window.sportsDataService.getAllLiveGames();
        const upcomingGames = await window.sportsDataService.getAllUpcomingGames();
        const allGames = [...liveGames, ...upcomingGames.slice(0, 15)];

        // Enhance with simulated multi-book odds
        return allGames.map(game => {
            const baseOdds = window.smartParlayGenerator.getGameOdds(game);
            return {
                ...game,
                marketOdds: this.generateMultiBookOdds(baseOdds)
            };
        });
    }

    /**
     * Generate variations of odds for different books
     */
    generateMultiBookOdds(baseOdds) {
        const markets = { moneyline: {}, spread: {}, total: {} };

        // Moneyline variations
        this.sportsbooks.forEach(book => {
            // Add random variance to create arb opportunities occasionally
            const variance = (Math.random() - 0.5) * 25; 
            markets.moneyline[book.id] = {
                book: book,
                home: Math.round(baseOdds.moneyline.home + variance),
                away: Math.round(baseOdds.moneyline.away - variance) // Inverse movement usually
            };
        });

        // Spread variations
        this.sportsbooks.forEach(book => {
             const variance = (Math.random() - 0.5) * 1.5; // Spread points variance
             markets.spread[book.id] = {
                 book: book,
                 homeLine: baseOdds.spread.home + (Math.random() > 0.8 ? 0.5 : 0),
                 awayLine: baseOdds.spread.away + (Math.random() > 0.8 ? -0.5 : 0),
                 homeOdds: -110 + Math.floor(Math.random() * 10),
                 awayOdds: -110 + Math.floor(Math.random() * 10)
             };
        });

        return markets;
    }

    /**
     * Scan for Arbitrage Opportunities (Guaranteed Profit)
     */
    scanForArbitrage(games) {
        const opportunities = [];

        games.forEach(game => {
            // Check Moneyline Arbitrage
            const ml = game.marketOdds.moneyline;
            let bestHome = { odds: -Infinity, book: null };
            let bestAway = { odds: -Infinity, book: null };

            // Find best odds for each side
            Object.values(ml).forEach(odds => {
                if (odds.home > bestHome.odds) bestHome = { odds: odds.home, book: odds.book };
                if (odds.away > bestAway.odds) bestAway = { odds: odds.away, book: odds.book };
            });

            // Calculate Implied Probabilities
            const probHome = this.getImpliedProbability(bestHome.odds);
            const probAway = this.getImpliedProbability(bestAway.odds);
            const totalImplied = probHome + probAway;

            // If total probability < 100%, arbitrage exists
            if (totalImplied < 1.0) {
                const roi = ((1 / totalImplied) - 1) * 100;
                opportunities.push({
                    type: 'Arbitrage',
                    game: `${game.awayTeam.shortName} @ ${game.homeTeam.shortName}`,
                    market: 'Moneyline',
                    profit: roi.toFixed(2),
                    bet1: { team: game.homeTeam.shortName, odds: bestHome.odds, book: bestHome.book },
                    bet2: { team: game.awayTeam.shortName, odds: bestAway.odds, book: bestAway.book },
                    totalImplied: (totalImplied * 100).toFixed(2)
                });
            }
        });

        // Sort by profitability
        return opportunities.sort((a, b) => b.profit - a.profit);
    }

    /**
     * Scan for Value Bets (Edge vs AI Projection)
     */
    scanForValue(games) {
        const valueBets = [];

        games.forEach(game => {
            // Get AI "True" Probability (simulated from SmartParlayGenerator score)
            // A score of 50 = 50% win prob (roughly). We'll treat AI score as a proxy for "True Win Prob %"
            // Note: In a real system, you'd have a distinct probability model.
            
            // Generate scores if not present
            const odds = window.smartParlayGenerator.getGameOdds(game);
            
            // Analyze Moneyline Value
            const ml = game.marketOdds.moneyline;
            
            // Assume AI has an opinion
            const aiScore = window.smartParlayGenerator.calculateBetScore({ type: 'Moneyline', americanOdds: odds.moneyline.home }, game).totalScore;
            const aiProbHome = (aiScore + 10) / 100; // Boosting slightly for demo logic
            const aiProbAway = 1 - aiProbHome;

            // Check each book for value
            Object.values(ml).forEach(market => {
                // Home Value
                const impliedHome = this.getImpliedProbability(market.home);
                const edgeHome = aiProbHome - impliedHome;
                if (edgeHome > 0.05) { // 5% edge threshold
                    valueBets.push({
                        game: `${game.awayTeam.shortName} @ ${game.homeTeam.shortName}`,
                        team: game.homeTeam.shortName,
                        market: 'Moneyline',
                        book: market.book,
                        odds: market.home,
                        trueProb: (aiProbHome * 100).toFixed(1),
                        impliedProb: (impliedHome * 100).toFixed(1),
                        edge: (edgeHome * 100).toFixed(1),
                        ev: this.calculateEV(market.home, aiProbHome).toFixed(1)
                    });
                }

                // Away Value
                const impliedAway = this.getImpliedProbability(market.away);
                const edgeAway = aiProbAway - impliedAway;
                if (edgeAway > 0.05) {
                    valueBets.push({
                        game: `${game.awayTeam.shortName} @ ${game.homeTeam.shortName}`,
                        team: game.awayTeam.shortName,
                        market: 'Moneyline',
                        book: market.book,
                        odds: market.away,
                        trueProb: (aiProbAway * 100).toFixed(1),
                        impliedProb: (impliedAway * 100).toFixed(1),
                        edge: (edgeAway * 100).toFixed(1),
                        ev: this.calculateEV(market.away, aiProbAway).toFixed(1)
                    });
                }
            });
        });

        return valueBets.sort((a, b) => parseFloat(b.ev) - parseFloat(a.ev));
    }

    getImpliedProbability(americanOdds) {
        if (americanOdds > 0) {
            return 100 / (americanOdds + 100);
        } else {
            return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
        }
    }

    calculateEV(americanOdds, trueProb) {
        const decimalOdds = americanOdds > 0 ? (americanOdds / 100) + 1 : (100 / Math.abs(americanOdds)) + 1;
        return ((decimalOdds * trueProb) - 1) * 100;
    }

    /**
     * Scan for Player Prop Value
     */
    async scanPlayerProps(games) {
        const propOpportunities = [];
        
        // Get top 3-4 games for prop analysis
        const topGames = games.slice(0, 4);
        
        topGames.forEach(game => {
            const players = this.generatePlayerPropsForGame(game);
            
            players.forEach(player => {
                player.props.forEach(prop => {
                    // Analyze value for each prop
                    const analysis = this.analyzePropValue(prop, player, game);
                    
                    if (analysis.hasValue) {
                        propOpportunities.push({
                            game: `${game.awayTeam.shortName} @ ${game.homeTeam.shortName}`,
                            player: player.name,
                            team: player.team,
                            position: player.position,
                            prop: prop.type,
                            line: prop.line,
                            overOdds: prop.overOdds,
                            underOdds: prop.underOdds,
                            recommendation: analysis.recommendation, // 'OVER' or 'UNDER'
                            confidence: analysis.confidence, // 0-100
                            edge: analysis.edge,
                            ev: analysis.ev,
                            aiProjection: analysis.aiProjection,
                            book: analysis.book,
                            trend: analysis.trend, // Recent performance trend
                            matchupRating: analysis.matchupRating // Opponent matchup (Easy/Average/Tough)
                        });
                    }
                });
            });
        });
        
        // Sort by confidence and EV
        return propOpportunities.sort((a, b) => (b.confidence * parseFloat(b.ev)) - (a.confidence * parseFloat(a.ev)));
    }

    /**
     * Generate simulated player props for a game
     */
    generatePlayerPropsForGame(game) {
        const sport = game.sport || 'NFL';
        const players = [];
        
        // Sport-specific prop types
        const propTypes = {
            'NFL': [
                { type: 'Passing Yards', avgLine: 265.5, variance: 50 },
                { type: 'Rushing Yards', avgLine: 75.5, variance: 25 },
                { type: 'Receiving Yards', avgLine: 68.5, variance: 20 },
                { type: 'Passing TDs', avgLine: 1.5, variance: 1 },
                { type: 'Receptions', avgLine: 5.5, variance: 2 }
            ],
            'NBA': [
                { type: 'Points', avgLine: 24.5, variance: 8 },
                { type: 'Rebounds', avgLine: 8.5, variance: 3 },
                { type: 'Assists', avgLine: 6.5, variance: 2 },
                { type: 'Pts+Rebs+Asts', avgLine: 38.5, variance: 10 },
                { type: '3-Pointers Made', avgLine: 2.5, variance: 1 }
            ],
            'MLB': [
                { type: 'Strikeouts', avgLine: 6.5, variance: 2 },
                { type: 'Hits', avgLine: 1.5, variance: 0.5 },
                { type: 'Total Bases', avgLine: 1.5, variance: 1 },
                { type: 'RBIs', avgLine: 0.5, variance: 0.5 }
            ],
            'NHL': [
                { type: 'Goals', avgLine: 0.5, variance: 0.5 },
                { type: 'Shots on Goal', avgLine: 3.5, variance: 1 },
                { type: 'Points', avgLine: 0.5, variance: 0.5 }
            ],
            'SOCCER': [
                { type: 'Goals', avgLine: 0.5, variance: 0.5 },
                { type: 'Shots on Target', avgLine: 2.5, variance: 1 },
                { type: 'Assists', avgLine: 0.5, variance: 0.5 }
            ]
        };
        
        const availableProps = propTypes[sport] || propTypes['NFL'];
        
        // Generate 2-3 star players per team
        const homeStars = this.generateStarPlayers(game.homeTeam, sport, 2);
        const awayStars = this.generateStarPlayers(game.awayTeam, sport, 2);
        
        [...homeStars, ...awayStars].forEach(player => {
            const playerProps = availableProps.slice(0, 3).map(propType => {
                const line = propType.avgLine + (Math.random() - 0.5) * propType.variance;
                return {
                    type: propType.type,
                    line: line.toFixed(1),
                    overOdds: -110 + Math.floor(Math.random() * 20) - 10,
                    underOdds: -110 + Math.floor(Math.random() * 20) - 10
                };
            });
            
            players.push({
                ...player,
                props: playerProps
            });
        });
        
        return players;
    }

    /**
     * Generate star players for a team
     */
    generateStarPlayers(team, sport, count) {
        const positions = {
            'NFL': ['QB', 'RB', 'WR', 'TE'],
            'NBA': ['PG', 'SG', 'SF', 'PF', 'C'],
            'MLB': ['SP', '1B', 'OF', 'SS'],
            'NHL': ['C', 'LW', 'RW', 'D', 'G'],
            'SOCCER': ['ST', 'MF', 'DF', 'GK']
        };
        
        const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        const firstNames = ['James', 'John', 'Robert', 'Michael', 'David', 'Chris', 'Daniel', 'Matt', 'Alex', 'Ryan'];
        
        const availablePositions = positions[sport] || positions['NFL'];
        const players = [];
        
        for (let i = 0; i < count; i++) {
            players.push({
                name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${names[Math.floor(Math.random() * names.length)]}`,
                team: team.shortName,
                position: availablePositions[i % availablePositions.length],
                rating: 75 + Math.floor(Math.random() * 20) // 75-95 rating
            });
        }
        
        return players;
    }

    /**
     * Analyze if a prop has value
     */
    analyzePropValue(prop, player, game) {
        // Simulate AI projection (in production, this would use actual model)
        const baseProjection = parseFloat(prop.line);
        const variance = baseProjection * 0.15; // 15% variance
        const aiProjection = baseProjection + (Math.random() - 0.5) * variance;
        
        // Determine if Over or Under has value
        const overImplied = this.getImpliedProbability(prop.overOdds);
        const underImplied = this.getImpliedProbability(prop.underOdds);
        
        // AI's opinion on probability of going over
        const aiOverProb = aiProjection > baseProjection ? 0.55 + (Math.random() * 0.15) : 0.35 + (Math.random() * 0.15);
        const aiUnderProb = 1 - aiOverProb;
        
        // Calculate edges
        const overEdge = aiOverProb - overImplied;
        const underEdge = aiUnderProb - underImplied;
        
        // Determine if there's value (5% threshold)
        let hasValue = false;
        let recommendation = null;
        let bestEdge = 0;
        let bestOdds = 0;
        let bestProb = 0;
        
        if (overEdge > 0.05) {
            hasValue = true;
            recommendation = 'OVER';
            bestEdge = overEdge;
            bestOdds = prop.overOdds;
            bestProb = aiOverProb;
        } else if (underEdge > 0.05) {
            hasValue = true;
            recommendation = 'UNDER';
            bestEdge = underEdge;
            bestOdds = prop.underOdds;
            bestProb = aiUnderProb;
        }
        
        // Generate additional context
        const trend = this.generatePerformanceTrend(prop.line);
        const matchupRating = this.generateMatchupRating();
        
        // Calculate confidence (0-100)
        let confidence = 50 + (bestEdge * 100);
        if (trend.direction === recommendation) confidence += 10;
        if (matchupRating === 'Easy') confidence += 5;
        if (matchupRating === 'Tough') confidence -= 5;
        confidence = Math.min(100, Math.max(0, confidence));
        
        return {
            hasValue,
            recommendation,
            edge: (bestEdge * 100).toFixed(1),
            ev: this.calculateEV(bestOdds, bestProb).toFixed(1),
            confidence: Math.round(confidence),
            aiProjection: aiProjection.toFixed(1),
            book: this.sportsbooks[Math.floor(Math.random() * this.sportsbooks.length)],
            trend,
            matchupRating
        };
    }

    /**
     * Generate simulated performance trend
     */
    generatePerformanceTrend(lineValue) {
        const directions = ['OVER', 'UNDER', 'MIXED'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const gamesCount = 5;
        const line = parseFloat(lineValue);
        
        // Generate 5 numeric history points
        const history = [];
        for (let i = 0; i < gamesCount; i++) {
            let val;
            if (direction === 'OVER') {
                val = line * (0.8 + Math.random() * 0.7); // Mostly over
            } else if (direction === 'UNDER') {
                val = line * (0.4 + Math.random() * 0.7); // Mostly under
            } else {
                val = line * (0.5 + Math.random() * 1.0); // Mixed
            }
            history.push(parseFloat(val.toFixed(1)));
        }

        const hits = history.filter(v => direction === 'OVER' ? v > line : (direction === 'UNDER' ? v < line : false)).length;
        const hitRate = (hits / gamesCount) * 100;
        
        return {
            direction,
            games: gamesCount,
            history,
            hitRate: Math.round(hitRate),
            description: direction === 'OVER' ? `Hit OVER in ${hits}/${gamesCount} last games` :
                        direction === 'UNDER' ? `Hit UNDER in ${hits}/${gamesCount} last games` :
                        `Mixed performance in last ${gamesCount} games`
        };
    }

    renderPropSparkline(history, line) {
        const width = 120;
        const height = 40;
        const padding = 5;
        
        const min = Math.min(...history, line) * 0.8;
        const max = Math.max(...history, line) * 1.2;
        const range = max - min || 1;
        
        const getY = (val) => height - (((val - min) / range) * (height - padding * 2) + padding);
        const lineY = getY(line);
        
        const points = history.map((val, i) => {
            const x = (i / (history.length - 1)) * width;
            const y = getY(val);
            return `${x},${y}`;
        }).join(' ');

        return `
            <div class="prop-history-chart" title="Last 5 games performance vs line">
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                    <!-- Target Line -->
                    <line x1="0" y1="${lineY}" x2="${width}" y2="${lineY}" stroke="rgba(255,255,255,0.2)" stroke-dasharray="2,2" />
                    <!-- History Line -->
                    <polyline fill="none" stroke="#fbbf24" stroke-width="2" points="${points}" />
                    <!-- Data Points -->
                    ${history.map((val, i) => {
                        const x = (i / (history.length - 1)) * width;
                        const y = getY(val);
                        return `<circle cx="${x}" cy="${y}" r="2" fill="${val > line ? '#10b981' : '#ef4444'}" />`;
                    }).join('')}
                </svg>
            </div>
        `;
    }

    /**
     * Generate matchup difficulty rating
     */
    generateMatchupRating() {
        const ratings = ['Easy', 'Average', 'Tough'];
        return ratings[Math.floor(Math.random() * ratings.length)];
    }

    renderScannerModal(arbs, valueBets, playerProps) {
        const modal = document.createElement('div');
        modal.className = 'value-scanner-overlay';
        modal.innerHTML = `
            <div class="value-scanner-modal">
                <div class="scanner-header">
                    <h2><i class="fas fa-radar"></i> AI Value & Arbitrage Scanner</h2>
                    <button class="close-btn" onclick="document.querySelector('.value-scanner-overlay').remove()">✕</button>
                </div>
                
                <div class="scanner-tabs">
                    <button class="scanner-tab active" onclick="window.valueBetScanner.switchTab('value')">
                        <i class="fas fa-gem"></i> Value Bets (${valueBets.length})
                    </button>
                    <button class="scanner-tab" onclick="window.valueBetScanner.switchTab('arb')">
                        <i class="fas fa-balance-scale"></i> Arbitrage (${arbs.length})
                    </button>
                    <button class="scanner-tab" onclick="window.valueBetScanner.switchTab('props')">
                        <i class="fas fa-user-chart"></i> Player Props
                    </button>
                </div>

                <div class="scanner-content">
                    <!-- Value Bets Section -->
                    <div id="value-tab-content" class="scanner-section active">
                        ${valueBets.length > 0 ? valueBets.map(bet => `
                            <div class="value-bet-card">
                                <div class="bet-header">
                                    <span class="game-matchup">${bet.game}</span>
                                    <span class="ev-badge">+${bet.ev}% EV</span>
                                </div>
                                <div class="bet-details-grid">
                                    <div class="bet-info">
                                        <div class="bet-selection">${bet.team}</div>
                                        <div class="bet-market">${bet.market}</div>
                                    </div>
                                    <div class="book-info">
                                        <div class="book-name" style="color: ${bet.book.color}">${bet.book.name}</div>
                                        <div class="book-odds">${bet.odds > 0 ? '+' : ''}${bet.odds}</div>
                                    </div>
                                    <div class="edge-info">
                                        <div class="prob-row">
                                            <span>True Prob:</span> <strong>${bet.trueProb}%</strong>
                                        </div>
                                        <div class="prob-row">
                                            <span>Implied:</span> <span class="muted">${bet.impliedProb}%</span>
                                        </div>
                                        <div class="edge-bar">
                                            <div class="edge-fill" style="width: ${Math.min(100, parseFloat(bet.edge)*5)}%"></div>
                                        </div>
                                    </div>
                                </div>
                                <button class="bet-action-btn" onclick="window.bettingOddsTracker?.addToParlay({
                                    game: '${bet.game}',
                                    type: '${bet.market}',
                                    selection: '${bet.team}',
                                    odds: '${bet.odds}',
                                    americanOdds: ${bet.odds},
                                    sportsbook: '${bet.book.name}'
                                }); document.querySelector('.value-scanner-overlay').remove();">
                                    Add to Slip
                                </button>
                            </div>
                        `).join('') : '<div class="empty-state">No value bets found above threshold.</div>'}
                    </div>

                    <!-- Arbitrage Section -->
                    <div id="arb-tab-content" class="scanner-section">
                         ${arbs.length > 0 ? arbs.map(arb => `
                            <div class="arb-card">
                                <div class="arb-header">
                                    <span class="profit-badge">💰 Guaranteed ${arb.profit}% Profit</span>
                                    <span class="arb-game">${arb.game}</span>
                                </div>
                                <div class="arb-legs">
                                    <div class="arb-leg">
                                        <div class="leg-book" style="border-left: 4px solid ${arb.bet1.book.color}">
                                            ${arb.bet1.book.name}
                                        </div>
                                        <div class="leg-selection">
                                            ${arb.bet1.team} @ <strong>${arb.bet1.odds > 0 ? '+' : ''}${arb.bet1.odds}</strong>
                                        </div>
                                    </div>
                                    <div class="arb-divider">VS</div>
                                    <div class="arb-leg">
                                        <div class="leg-book" style="border-left: 4px solid ${arb.bet2.book.color}">
                                            ${arb.bet2.book.name}
                                        </div>
                                        <div class="leg-selection">
                                            ${arb.bet2.team} @ <strong>${arb.bet2.odds > 0 ? '+' : ''}${arb.bet2.odds}</strong>
                                        </div>
                                    </div>
                                </div>
                                <div class="arb-calc-info">
                                    Total Implied Probability: ${arb.totalImplied}% (< 100%)
                                </div>
                            </div>
                         `).join('') : '<div class="empty-state">No arbitrage opportunities found currently. Markets are efficient.</div>'}
                    </div>

                    <!-- Player Props Section -->
                    <div id="props-tab-content" class="scanner-section">
                        ${playerProps.length > 0 ? playerProps.map(prop => `
                            <div class="prop-value-card">
                                <div class="prop-card-header">
                                    <div class="prop-player-info">
                                        <div class="prop-player-name">${prop.player}</div>
                                        <div class="prop-player-meta">${prop.position} · ${prop.team}</div>
                                    </div>
                                    <div class="prop-confidence-badge confidence-${prop.confidence >= 80 ? 'high' : prop.confidence >= 65 ? 'medium' : 'low'}">
                                        ${prop.confidence}% Confidence
                                    </div>
                                </div>
                                
                                <div class="prop-matchup-bar">
                                    <span class="prop-game-text">${prop.game}</span>
                                    <span class="matchup-rating rating-${prop.matchupRating.toLowerCase()}">${prop.matchupRating} Matchup</span>
                                </div>

                                <div class="prop-bet-details">
                                    <div class="prop-main-bet">
                                        <div class="prop-type">${prop.prop}</div>
                                        <div class="prop-recommendation ${prop.recommendation === 'OVER' ? 'rec-over' : 'rec-under'}">
                                            <span class="rec-arrow">${prop.recommendation === 'OVER' ? '↑' : '↓'}</span>
                                            ${prop.recommendation} ${prop.line}
                                        </div>
                                        <div class="prop-odds">
                                            ${prop.recommendation === 'OVER' ? prop.overOdds : prop.underOdds > 0 ? '+' : ''}${prop.recommendation === 'OVER' ? prop.overOdds : prop.underOdds}
                                        </div>
                                    </div>
                                    
                                    <div class="prop-book-badge" style="border-left: 3px solid ${prop.book.color}">
                                        ${prop.book.name}
                                    </div>
                                </div>

                                <div class="prop-analysis-grid">
                                    <div class="prop-stat">
                                        <div class="prop-stat-label">AI Projection</div>
                                        <div class="prop-stat-value">${prop.aiProjection}</div>
                                    </div>
                                    <div class="prop-stat">
                                        <div class="prop-stat-label">Edge</div>
                                        <div class="prop-stat-value edge-positive">+${prop.edge}%</div>
                                    </div>
                                    <div class="prop-stat">
                                        <div class="prop-stat-label">Expected Value</div>
                                        <div class="prop-stat-value ev-positive">+${prop.ev}%</div>
                                    </div>
                                </div>

                                <div class="prop-trend-section">
                                    <div class="trend-icon ${prop.trend.direction === prop.recommendation ? 'trend-aligned' : 'trend-neutral'}">
                                        ${prop.trend.direction === prop.recommendation ? '🔥' : '📊'}
                                    </div>
                                    <div class="trend-text">${prop.trend.description}</div>
                                    ${this.renderPropSparkline(prop.trend.history, parseFloat(prop.line))}
                                </div>

                                <button class="prop-action-btn" onclick="window.bettingOddsTracker?.addToParlay({
                                    game: '${prop.game}',
                                    type: '${prop.prop}',
                                    selection: '${prop.player} ${prop.recommendation} ${prop.line}',
                                    odds: '${prop.recommendation === 'OVER' ? prop.overOdds : prop.underOdds}',
                                    americanOdds: ${prop.recommendation === 'OVER' ? prop.overOdds : prop.underOdds},
                                    sportsbook: '${prop.book.name}'
                                }); document.querySelector('.value-scanner-overlay').remove();">
                                    <i class="fas fa-plus-circle"></i> Add to Parlay
                                </button>
                            </div>
                        `).join('') : '<div class="empty-state">No player prop value found above threshold. Try different games or refresh.</div>'}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
    }

    switchTab(tab) {
        document.querySelectorAll('.scanner-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.scanner-section').forEach(s => s.classList.remove('active'));
        
        const tabs = ['value', 'arb', 'props'];
        const index = tabs.indexOf(tab);
        if (index !== -1) {
            document.querySelectorAll('.scanner-tab')[index].classList.add('active');
            document.getElementById(`${tab}-tab-content`).classList.add('active');
        }
    }
}

// Global Instance
window.valueBetScanner = new ValueBetScanner();
console.log('📡 Value Bet Scanner Initialized');
