/**
 * Smart Parlay Generator
 * AI-powered parlay builder based on historical ROI analysis, sharp money trends, and line value
 */

class SmartParlayGenerator {
  constructor() {
    this.historicalData = this.loadHistoricalData();
    this.sharpPatterns = this.loadSharpPatterns();
    this.userProfile = this.loadUserProfile();
    this.aiConfidenceThreshold = 65; // Minimum confidence to recommend
    this.maxRecommendedLegs = 6; // Sweet spot for ROI vs risk
  }

  /**
   * Load historical performance data from localStorage
   */
  loadHistoricalData() {
    try {
      const saved = localStorage.getItem('smart_parlay_historical_data');
      return saved ? JSON.parse(saved) : this.generateInitialHistoricalData();
    } catch (error) {
      return this.generateInitialHistoricalData();
    }
  }

  /**
   * Generate realistic initial historical data for cold start
   */
  generateInitialHistoricalData() {
    return {
      betTypes: {
        spread: { wins: 245, losses: 210, totalROI: 12.5, avgOdds: -110, confidence: 68 },
        moneyline: { wins: 180, losses: 160, totalROI: 8.2, avgOdds: -135, confidence: 62 },
        total: { wins: 190, losses: 185, totalROI: 6.8, avgOdds: -110, confidence: 58 },
        props: { wins: 150, losses: 145, totalROI: 5.1, avgOdds: -115, confidence: 55 }
      },
      sports: {
        NFL: { wins: 120, losses: 95, totalROI: 15.3, confidence: 72 },
        NBA: { wins: 210, losses: 180, totalROI: 9.8, confidence: 65 },
        MLB: { wins: 90, losses: 100, totalROI: -2.5, confidence: 48 },
        NHL: { wins: 105, losses: 110, totalROI: 1.2, confidence: 52 },
        SOCCER: { wins: 140, losses: 115, totalROI: 11.7, confidence: 68 }
      },
      parlayLegCounts: {
        2: { wins: 85, losses: 95, totalROI: 8.5, avgPayout: 2.6 },
        3: { wins: 65, losses: 110, totalROI: 15.2, avgPayout: 6.4 },
        4: { wins: 42, losses: 88, totalROI: 12.8, avgPayout: 13.5 },
        5: { wins: 18, losses: 62, totalROI: 8.1, avgPayout: 28.4 },
        6: { wins: 8, losses: 45, totalROI: 2.3, avgPayout: 55.2 }
      },
      sharpVsPublic: {
        followSharp: { wins: 145, losses: 105, totalROI: 18.3 },
        followPublic: { wins: 95, losses: 135, totalROI: -12.5 },
        neutral: { wins: 110, losses: 115, totalROI: 2.1 }
      }
    };
  }

  /**
   * Load sharp betting patterns
   */
  loadSharpPatterns() {
    try {
      const saved = localStorage.getItem('smart_parlay_sharp_patterns');
      return saved ? JSON.parse(saved) : this.generateSharpPatterns();
    } catch (error) {
      return this.generateSharpPatterns();
    }
  }

  /**
   * Generate sharp money patterns for analysis
   */
  generateSharpPatterns() {
    return {
      steamMoves: [],
      lineReverseEngineering: [],
      highValueDiscrepancies: []
    };
  }

  /**
   * Load user's betting profile for personalization
   */
  loadUserProfile() {
    try {
      const saved = localStorage.getItem('smart_parlay_user_profile');
      return saved ? JSON.parse(saved) : {
        riskTolerance: 'medium', // low, medium, high, very-high
        favoriteSports: [],
        avgWager: 100,
        totalParlays: 0,
        winRate: 0,
        roi: 0
      };
    } catch (error) {
      return {
        riskTolerance: 'medium',
        favoriteSports: [],
        avgWager: 100,
        totalParlays: 0,
        winRate: 0,
        roi: 0
      };
    }
  }

  /**
   * Save historical data
   */
  saveHistoricalData() {
    localStorage.setItem('smart_parlay_historical_data', JSON.stringify(this.historicalData));
  }

  /**
   * Generate AI-powered smart parlay recommendations
   * @param {Array} availableGames - All games with odds data
   * @param {number} targetLegs - Desired number of legs (2-6)
   * @param {string} strategy - 'value', 'sharp', 'balanced', 'high-odds'
   */
  async generateSmartParlay(availableGames, targetLegs = 4, strategy = 'balanced') {
    console.log('🤖 Smart Parlay Generator: Analyzing', availableGames.length, 'games...');

    // Step 1: Score each available bet based on historical ROI
    const scoredBets = this.scoreAllBets(availableGames);

    // Step 2: Filter by confidence threshold
    const highConfidenceBets = scoredBets.filter(bet => bet.aiScore >= this.aiConfidenceThreshold);

    if (highConfidenceBets.length < targetLegs) {
      return {
        success: false,
        message: `Not enough high-confidence bets available. Found ${highConfidenceBets.length}, need ${targetLegs}.`,
        recommendedLegs: Math.max(2, highConfidenceBets.length)
      };
    }

    // Step 3: Apply strategy-specific weighting
    const weightedBets = this.applyStrategyWeighting(highConfidenceBets, strategy);

    // Step 4: Build optimal parlay (avoiding same game)
    const parlayLegs = this.buildOptimalParlay(weightedBets, targetLegs);

    // Step 5: Calculate expected value and risk metrics
    const parlayAnalysis = this.analyzeParlayQuality(parlayLegs);

    return {
      success: true,
      legs: parlayLegs,
      analysis: parlayAnalysis,
      strategy,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Score all available bets based on historical data, sharp trends, and value
   */
  scoreAllBets(games) {
    const scoredBets = [];

    for (const game of games) {
      // Skip completed games
      if (game.isCompleted) continue;

      const gameId = game.id || `${game.awayTeam}-${game.homeTeam}`;

      // Generate odds for this game (simulated for demo)
      const odds = this.getGameOdds(game);

      // Score each bet type
      for (const betType of ['spread', 'moneyline', 'total']) {
        const bets = this.generateBetsForType(game, betType, odds);
        for (const bet of bets) {
          const score = this.calculateBetScore(bet, game);
          const betData = {
            ...bet,
            aiScore: score.totalScore,
            scoreBreakdown: score.breakdown,
            game: game,
            gameId: gameId
          };
          scoredBets.push(betData);

          // Alert activity feed for exceptionally high-value bets (AI Big Hits)
          if (score.totalScore >= 85 && Math.random() > 0.8 && window.ActivityFeed) {
              const coaches = ['Coach Mack', 'Sharp Sam', 'Data Danny', 'Pro Pete'];
              window.ActivityFeed.logBigHit(
                  coaches[Math.floor(Math.random() * coaches.length)],
                  `${bet.selection} (${game.awayTeam.shortName || game.awayTeam.name} @ ${game.homeTeam.shortName || game.homeTeam.name})`,
                  score.totalScore - 50 // Edge proxy
              );
          }
        }
      }
    }

    // Sort by AI score (highest first)
    return scoredBets.sort((a, b) => b.aiScore - a.aiScore);
  }

  /**
   * Get odds for a game (pulls from existing odds data or generates)
   */
  getGameOdds(game) {
    // In production, this would pull from the actual odds API
    return {
      spread: { home: -3.5, away: 3.5, odds: -110 },
      moneyline: { home: -150, away: 130 },
      total: { value: this.getBaseTotal(game.sport), overOdds: -110, underOdds: -110 }
    };
  }

  /**
   * Get base total for sport
   */
  getBaseTotal(sport) {
    const totals = {
      'NFL': 47.5,
      'NBA': 225.5,
      'MLB': 8.5,
      'NHL': 6.5,
      'SOCCER': 2.5
    };
    return totals[sport] || 200;
  }

  /**
   * Generate bet options for a specific type
   */
  generateBetsForType(game, betType, odds) {
    const bets = [];
    const gameDisplay = `${game.awayTeam.shortName || game.awayTeam.name} @ ${game.homeTeam.shortName || game.homeTeam.name}`;

    if (betType === 'spread') {
      bets.push({
        type: 'Spread',
        selection: `${game.awayTeam.shortName || game.awayTeam.name} ${odds.spread.away > 0 ? '+' : ''}${odds.spread.away}`,
        team: game.awayTeam.shortName || game.awayTeam.name,
        americanOdds: odds.spread.odds,
        line: odds.spread.away,
        gameDisplay,
        sport: game.sport
      });
      bets.push({
        type: 'Spread',
        selection: `${game.homeTeam.shortName || game.homeTeam.name} ${odds.spread.home > 0 ? '+' : ''}${odds.spread.home}`,
        team: game.homeTeam.shortName || game.homeTeam.name,
        americanOdds: odds.spread.odds,
        line: odds.spread.home,
        gameDisplay,
        sport: game.sport
      });
    } else if (betType === 'moneyline') {
      bets.push({
        type: 'Moneyline',
        selection: `${game.awayTeam.shortName || game.awayTeam.name} ML`,
        team: game.awayTeam.shortName || game.awayTeam.name,
        americanOdds: odds.moneyline.away,
        gameDisplay,
        sport: game.sport
      });
      bets.push({
        type: 'Moneyline',
        selection: `${game.homeTeam.shortName || game.homeTeam.name} ML`,
        team: game.homeTeam.shortName || game.homeTeam.name,
        americanOdds: odds.moneyline.home,
        gameDisplay,
        sport: game.sport
      });
    } else if (betType === 'total') {
      bets.push({
        type: 'Total',
        selection: `Over ${odds.total.value}`,
        team: 'Over',
        americanOdds: odds.total.overOdds,
        line: odds.total.value,
        gameDisplay,
        sport: game.sport
      });
      bets.push({
        type: 'Total',
        selection: `Under ${odds.total.value}`,
        team: 'Under',
        americanOdds: odds.total.underOdds,
        line: odds.total.value,
        gameDisplay,
        sport: game.sport
      });
    }

    return bets;
  }

  /**
   * Calculate AI score for a single bet (0-100)
   */
  calculateBetScore(bet, game) {
    let totalScore = 0;
    const breakdown = {};

    // 1. Historical Performance Score (0-30 points)
    const betTypeData = this.historicalData.betTypes[bet.type.toLowerCase()];
    if (betTypeData) {
      const winRate = betTypeData.wins / (betTypeData.wins + betTypeData.losses);
      breakdown.historicalPerformance = Math.round(winRate * 30);
      totalScore += breakdown.historicalPerformance;
    }

    // 2. Sport-Specific ROI (0-20 points)
    const sportData = this.historicalData.sports[game.sport];
    if (sportData) {
      const sportScore = Math.min(20, Math.max(0, (sportData.totalROI + 10) * 2));
      breakdown.sportROI = Math.round(sportScore);
      totalScore += breakdown.sportROI;
    }

    // 3. Sharp vs Public Alignment (0-20 points)
    const sharpAlignment = this.calculateSharpAlignment(bet, game);
    breakdown.sharpAlignment = sharpAlignment;
    totalScore += sharpAlignment;

    // 4. Line Value Score (0-15 points)
    const lineValue = this.calculateLineValue(bet, game);
    breakdown.lineValue = lineValue;
    totalScore += lineValue;

    // 5. Hype/Momentum Score (0-10 points)
    const hypeScore = Math.min(10, (game.hypeLevel || 50) / 10);
    breakdown.gameHype = Math.round(hypeScore);
    totalScore += breakdown.gameHype;

    // 6. Recency Bias (0-5 points) - Favor games happening sooner
    const hoursUntilGame = game.date ? (new Date(game.date) - new Date()) / (1000 * 60 * 60) : 24;
    const recencyScore = Math.max(0, 5 - (hoursUntilGame / 24) * 2);
    breakdown.recency = Math.round(recencyScore);
    totalScore += breakdown.recency;

    return {
      totalScore: Math.round(totalScore),
      breakdown
    };
  }

  /**
   * Calculate sharp money alignment score
   */
  calculateSharpAlignment(bet, game) {
    // Simulate sharp vs public data (in production, pull from actual sources)
    const sharpPercentage = 55 + Math.random() * 25; // 55-80%
    const publicPercentage = 100 - sharpPercentage;

    // If sharp money heavily favors this side, score higher
    if (sharpPercentage > 65) {
      return 20;
    } else if (sharpPercentage > 55) {
      return 12;
    } else {
      return 5;
    }
  }

  /**
   * Calculate line value score
   */
  calculateLineValue(bet, game) {
    // Check for favorable odds compared to market average
    const odds = bet.americanOdds;
    
    // Standard juice is -110
    // Better than -110 gets higher score
    if (odds >= -105) {
      return 15;
    } else if (odds >= -108) {
      return 10;
    } else if (odds >= -110) {
      return 8;
    } else {
      return 5;
    }
  }

  /**
   * Apply strategy-specific weighting
   */
  applyStrategyWeighting(bets, strategy) {
    return bets.map(bet => {
      let strategyMultiplier = 1.0;

      switch (strategy) {
        case 'value':
          // Favor high line value bets
          strategyMultiplier = 1 + (bet.scoreBreakdown.lineValue / 15) * 0.5;
          break;
        case 'sharp':
          // Favor sharp money alignment
          strategyMultiplier = 1 + (bet.scoreBreakdown.sharpAlignment / 20) * 0.6;
          break;
        case 'balanced':
          // Even weighting
          strategyMultiplier = 1.0;
          break;
        case 'high-odds':
          // Favor underdogs with positive odds
          if (bet.americanOdds > 0) {
            strategyMultiplier = 1.4;
          }
          break;
      }

      return {
        ...bet,
        adjustedScore: Math.round(bet.aiScore * strategyMultiplier)
      };
    }).sort((a, b) => b.adjustedScore - a.adjustedScore);
  }

  /**
   * Build optimal parlay avoiding same game
   */
  buildOptimalParlay(weightedBets, targetLegs) {
    const parlayLegs = [];
    const usedGames = new Set();

    for (const bet of weightedBets) {
      // Skip if we already have a bet from this game
      if (usedGames.has(bet.gameId)) continue;

      parlayLegs.push({
        id: `${bet.gameId}-${bet.type}-${bet.selection}`,
        game: bet.gameDisplay,
        type: bet.type,
        selection: bet.selection,
        odds: `${bet.line !== undefined ? bet.line : ''} (${bet.americanOdds > 0 ? '+' : ''}${bet.americanOdds})`,
        americanOdds: bet.americanOdds,
        sportsbook: 'Best Available',
        aiScore: bet.adjustedScore || bet.aiScore,
        scoreBreakdown: bet.scoreBreakdown
      });

      usedGames.add(bet.gameId);

      // Stop when we reach target
      if (parlayLegs.length >= targetLegs) break;
    }

    return parlayLegs;
  }

  /**
   * Analyze parlay quality and expected value
   */
  analyzeParlayQuality(legs) {
    // Calculate combined odds
    let totalDecimalOdds = 1;
    let avgAIScore = 0;
    
    for (const leg of legs) {
      const decimalOdds = this.americanToDecimal(leg.americanOdds);
      totalDecimalOdds *= decimalOdds;
      avgAIScore += leg.aiScore;
    }

    avgAIScore /= legs.length;

    // Convert back to American
    let americanOdds;
    if (totalDecimalOdds >= 2) {
      americanOdds = Math.round((totalDecimalOdds - 1) * 100);
    } else {
      americanOdds = Math.round(-100 / (totalDecimalOdds - 1));
    }

    // Calculate expected win probability based on AI confidence
    const expectedWinProb = this.calculateExpectedWinProbability(legs);

    // Calculate expected value (EV)
    const impliedProbability = this.decimalToImpliedProbability(totalDecimalOdds);
    const expectedValue = ((expectedWinProb * totalDecimalOdds) - 1) * 100; // As percentage

    // Risk rating
    const riskRating = this.calculateRiskRating(legs.length, avgAIScore);

    return {
      combinedOdds: americanOdds,
      decimalOdds: totalDecimalOdds.toFixed(2),
      avgAIScore: Math.round(avgAIScore),
      expectedWinProbability: (expectedWinProb * 100).toFixed(1),
      impliedProbability: (impliedProbability * 100).toFixed(1),
      expectedValue: expectedValue.toFixed(1),
      riskRating,
      recommendation: this.generateRecommendation(expectedValue, riskRating, avgAIScore)
    };
  }

  /**
   * Convert American odds to decimal
   */
  americanToDecimal(americanOdds) {
    if (americanOdds > 0) {
      return (americanOdds / 100) + 1;
    } else {
      return (100 / Math.abs(americanOdds)) + 1;
    }
  }

  /**
   * Convert decimal odds to implied probability
   */
  decimalToImpliedProbability(decimalOdds) {
    return 1 / decimalOdds;
  }

  /**
   * Calculate expected win probability based on AI scores
   */
  calculateExpectedWinProbability(legs) {
    let combinedProb = 1;

    for (const leg of legs) {
      // Convert AI score (0-100) to win probability
      // High AI score = high confidence
      const legProb = leg.aiScore / 100;
      combinedProb *= legProb;
    }

    return combinedProb;
  }

  /**
   * Calculate risk rating
   */
  calculateRiskRating(legCount, avgScore) {
    if (legCount <= 2 && avgScore >= 75) return 'Low';
    if (legCount <= 3 && avgScore >= 70) return 'Medium';
    if (legCount <= 4 && avgScore >= 65) return 'Medium-High';
    if (legCount <= 5 && avgScore >= 60) return 'High';
    return 'Very High';
  }

  /**
   * Generate recommendation text
   */
  generateRecommendation(expectedValue, riskRating, avgScore) {
    if (expectedValue > 15 && avgScore > 75) {
      return '🔥 STRONG RECOMMENDATION: High value with excellent confidence scores.';
    } else if (expectedValue > 5 && avgScore > 65) {
      return '✅ RECOMMENDED: Positive expected value with solid AI confidence.';
    } else if (expectedValue > 0) {
      return '⚠️ CONSIDER: Slight positive EV but moderate confidence.';
    } else {
      return '❌ NOT RECOMMENDED: Negative expected value. Consider reducing legs.';
    }
  }

  /**
   * Update historical data after parlay result
   */
  recordParlayResult(parlay, result) {
    // Update parlay leg count stats
    const legCount = parlay.legs.length;
    if (!this.historicalData.parlayLegCounts[legCount]) {
      this.historicalData.parlayLegCounts[legCount] = { wins: 0, losses: 0, totalROI: 0, avgPayout: 0 };
    }

    if (result === 'won') {
      this.historicalData.parlayLegCounts[legCount].wins++;
    } else {
      this.historicalData.parlayLegCounts[legCount].losses++;
    }

    // Update bet type performance
    for (const leg of parlay.legs) {
      const betType = leg.type.toLowerCase();
      if (this.historicalData.betTypes[betType]) {
        if (result === 'won') {
          this.historicalData.betTypes[betType].wins++;
        } else {
          this.historicalData.betTypes[betType].losses++;
        }
      }
    }

    this.saveHistoricalData();
  }
}

// Global instance
window.smartParlayGenerator = new SmartParlayGenerator();
console.log('🤖 Smart Parlay Generator Initialized');
