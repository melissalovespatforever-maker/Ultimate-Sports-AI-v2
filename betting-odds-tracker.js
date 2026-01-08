/**
 * BettingOddsTracker - Real-time odds monitoring with line movement alerts
 * Tracks spread, moneyline, and over/under across multiple sportsbooks
 */
export class BettingOddsTracker {
  constructor() {
    this.overlay = null;
    this.currentGame = null;
    this.oddsHistory = new Map(); // gameId -> historical odds
    this.updateInterval = null;
    this.alertThreshold = 0.5; // Alert on 0.5+ point movement
    this.activeAlerts = [];
    this.watchedBets = this.loadWatchedBets(); // User's tracked bets
    this.parlayLegs = []; // Current parlay being built
    
    // Simulated sportsbook names for demo
    this.sportsbooks = [
      { id: 'draftkings', name: 'DraftKings', color: '#53D337' },
      { id: 'fanduel', name: 'FanDuel', color: '#0079FF' },
      { id: 'betmgm', name: 'BetMGM', color: '#D4AF37' },
      { id: 'caesars', name: 'Caesars', color: '#002855' }
    ];
  }

  /**
   * Load watched bets from localStorage
   */
  loadWatchedBets() {
    try {
      const saved = localStorage.getItem('betting_watched_bets');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading watched bets:', error);
      return [];
    }
  }

  /**
   * Save watched bets to localStorage
   */
  saveWatchedBets() {
    try {
      localStorage.setItem('betting_watched_bets', JSON.stringify(this.watchedBets));
    } catch (error) {
      console.error('Error saving watched bets:', error);
    }
  }

  /**
   * Add a bet to the watch list
   */
  addToWatchList(bet) {
    const betId = `${bet.gameId}-${bet.type}-${bet.selection}`;
    
    // Check if already watching
    if (this.watchedBets.some(b => b.id === betId)) {
      if (typeof showToast === 'function') {
        showToast('Already watching this bet', 'info');
      }
      return;
    }

    this.watchedBets.push({
      id: betId,
      gameId: bet.gameId,
      game: bet.game,
      type: bet.type,
      selection: bet.selection,
      odds: bet.odds,
      addedAt: Date.now()
    });

    this.saveWatchedBets();
    
    if (typeof showToast === 'function') {
      showToast('✓ Added to watch list', 'success');
    }

    // Update the UI if watch list is open
    const watchListTab = this.overlay?.querySelector('#watchlistTab');
    if (watchListTab && watchListTab.classList.contains('active')) {
      this.renderWatchList();
    }
  }

  /**
   * Remove a bet from watch list
   */
  removeFromWatchList(betId) {
    this.watchedBets = this.watchedBets.filter(b => b.id !== betId);
    this.saveWatchedBets();
    this.renderWatchList();
    
    if (typeof showToast === 'function') {
      showToast('Removed from watch list', 'info');
    }
  }

  /**
   * Add a bet to parlay
   */
  addToParlay(bet) {
    const legId = `${bet.game}-${bet.type}-${bet.selection}`;
    
    // Check if already in parlay
    if (this.parlayLegs.some(leg => leg.id === legId)) {
      if (typeof showToast === 'function') {
        showToast('Already in parlay', 'info');
      }
      return;
    }

    // Check for same game (can't parlay same game in most books)
    const sameGame = this.parlayLegs.some(leg => leg.game === bet.game);
    if (sameGame) {
      if (typeof showToast === 'function') {
        showToast('Cannot parlay same game', 'error');
      }
      return;
    }

    this.parlayLegs.push({
      id: legId,
      game: bet.game,
      type: bet.type,
      selection: bet.selection,
      odds: bet.odds,
      americanOdds: bet.americanOdds,
      sportsbook: bet.sportsbook
    });

    this.updateParlayCount();
    
    if (typeof showToast === 'function') {
      showToast('✓ Added to parlay', 'success');
    }

    // Play sound
    if (window.soundEffects) {
      window.soundEffects.playSound('click');
    }
  }

  /**
   * Remove leg from parlay
   */
  removeFromParlay(legId) {
    this.parlayLegs = this.parlayLegs.filter(leg => leg.id !== legId);
    this.updateParlayCount();
    this.renderParlay();
    
    if (typeof showToast === 'function') {
      showToast('Removed from parlay', 'info');
    }
  }

  /**
   * Clear entire parlay
   */
  clearParlay() {
    this.parlayLegs = [];
    this.updateParlayCount();
    this.renderParlay();
    
    if (typeof showToast === 'function') {
      showToast('Parlay cleared', 'info');
    }
  }

  /**
   * Update parlay count badge
   */
  updateParlayCount() {
    const badge = this.overlay?.querySelector('#parlayCount');
    if (badge) {
      badge.textContent = this.parlayLegs.length;
      badge.style.display = this.parlayLegs.length > 0 ? 'inline-flex' : 'none';
    }
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
   * Calculate parlay payout
   */
  calculateParlayPayout(wager = 100) {
    if (this.parlayLegs.length === 0) return { totalOdds: 0, payout: 0, profit: 0 };

    // Convert all odds to decimal and multiply
    let totalDecimalOdds = 1;
    for (const leg of this.parlayLegs) {
      totalDecimalOdds *= this.americanToDecimal(leg.americanOdds);
    }

    const payout = wager * totalDecimalOdds;
    const profit = payout - wager;

    // Convert back to American odds for display
    let americanOdds;
    if (totalDecimalOdds >= 2) {
      americanOdds = Math.round((totalDecimalOdds - 1) * 100);
    } else {
      americanOdds = Math.round(-100 / (totalDecimalOdds - 1));
    }

    return {
      totalOdds: americanOdds,
      decimalOdds: totalDecimalOdds.toFixed(2),
      payout: payout.toFixed(2),
      profit: profit.toFixed(2),
      wager
    };
  }

  /**
   * Open odds tracker for a specific game
   */
  open(game) {
    if (this.overlay) this.close();
    
    this.currentGame = game;
    this.createOverlay();
    this.initializeOdds();
    this.startTracking();
  }

  /**
   * Create the overlay UI
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'betting-odds-overlay';
    this.overlay.innerHTML = `
      <div class="betting-odds-modal">
        <div class="betting-odds-header">
          <div class="betting-odds-matchup">
            <div class="betting-team-section">
              <img src="${window.resolveSportsLogo(this.currentGame.awayTeamId || this.currentGame.awayTeam, this.currentGame.sport)}" 
                   alt="${this.currentGame.awayTeam}" 
                   class="betting-team-logo"
                   onerror="this.src='https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN'">
              <div class="betting-team-info">
                <div class="betting-team-name">${this.currentGame.awayTeam}</div>
                <div class="betting-team-score">${this.currentGame.awayScore || '-'}</div>
              </div>
            </div>
            <div class="betting-matchup-info">
              <div class="betting-status">${this.currentGame.status}</div>
              <div class="betting-time">${this.currentGame.time || ''}</div>
            </div>
            <div class="betting-team-section">
              <div class="betting-team-info">
                <div class="betting-team-name">${this.currentGame.homeTeam}</div>
                <div class="betting-team-score">${this.currentGame.homeScore || '-'}</div>
              </div>
              <img src="${window.resolveSportsLogo(this.currentGame.homeTeamId || this.currentGame.homeTeam, this.currentGame.sport)}" 
                   alt="${this.currentGame.homeTeam}" 
                   class="betting-team-logo"
                   onerror="this.src='https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN'">
            </div>
          </div>
          <button class="betting-close-btn" onclick="window.bettingOddsTracker?.close()">✕</button>
        </div>

        <div class="betting-alerts-container" id="bettingAlerts"></div>

        <div class="betting-tabs">
          <button class="betting-tab active" data-tab="spreads">Spreads</button>
          <button class="betting-tab" data-tab="moneyline">Moneyline</button>
          <button class="betting-tab" data-tab="totals">Over/Under</button>
          <button class="betting-tab" data-tab="props">Player Props</button>
          <button class="betting-tab" data-tab="trends">Betting Trends</button>
          <button class="betting-tab parlay-tab" data-tab="parlay">
            Parlay Builder <span class="parlay-count" id="parlayCount">0</span>
          </button>
        </div>

        <div class="betting-content">
          <div id="spreadsTab" class="betting-tab-content active">
            <div class="betting-odds-grid" id="spreadsGrid"></div>
          </div>
          <div id="moneylineTab" class="betting-tab-content">
            <div class="betting-odds-grid" id="moneylineGrid"></div>
          </div>
          <div id="totalsTab" class="betting-tab-content">
            <div class="betting-odds-grid" id="totalsGrid"></div>
          </div>
          <div id="propsTab" class="betting-tab-content">
            <div class="betting-props-grid" id="propsGrid"></div>
          </div>
          <div id="trendsTab" class="betting-tab-content">
            <div class="betting-trends-container" id="trendsContainer"></div>
          </div>
          <div id="parlayTab" class="betting-tab-content">
            <div class="parlay-builder-container" id="parlayContainer"></div>
          </div>
        </div>

        <div class="betting-footer">
          <div class="betting-footer-actions" style="display: flex; gap: 8px; width: 100%; justify-content: space-between; align-items: center;">
             <div class="betting-best-odds">
                <span class="betting-best-label">Best Line:</span>
                <span id="bestOddsDisplay">-</span>
            </div>
            <button class="scanner-btn" onclick="window.valueBetScanner?.open()" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                <i class="fas fa-radar"></i> Value Scanner
            </button>
          </div>
          <div class="betting-disclaimer">
            For entertainment purposes only. Please gamble responsibly.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.attachEventListeners();
    
    // Fade in
    requestAnimationFrame(() => {
      this.overlay.classList.add('visible');
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Tab switching
    this.overlay.querySelectorAll('.betting-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Close on background click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  /**
   * Switch between odds tabs
   */
  switchTab(tabName) {
    // Update tab buttons
    this.overlay.querySelectorAll('.betting-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    this.overlay.querySelectorAll('.betting-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    this.overlay.querySelector(`#${tabName}Tab`).classList.add('active');

    // Update best odds display
    this.updateBestOdds(tabName);
  }

  /**
   * Initialize odds data for the game
   */
  initializeOdds() {
    const gameId = `${this.currentGame.awayTeam}-${this.currentGame.homeTeam}`;
    
    if (!this.oddsHistory.has(gameId)) {
      this.oddsHistory.set(gameId, {
        spreads: this.generateInitialOdds('spread'),
        moneyline: this.generateInitialOdds('moneyline'),
        totals: this.generateInitialOdds('totals'),
        props: this.generatePlayerProps(),
        trends: this.generateBettingTrends(),
        lineHistory: [],
        timestamp: Date.now()
      });
    }

    this.renderOdds();
  }

  /**
   * Generate realistic initial odds
   */
  generateInitialOdds(type) {
    const odds = [];
    
    for (const book of this.sportsbooks) {
      if (type === 'spread') {
        const baseSpread = -3.5 + (Math.random() - 0.5);
        odds.push({
          sportsbook: book,
          awaySpread: baseSpread.toFixed(1),
          awayOdds: -110 + Math.floor(Math.random() * 10),
          homeSpread: (-baseSpread).toFixed(1),
          homeOdds: -110 + Math.floor(Math.random() * 10),
          previousAwaySpread: baseSpread.toFixed(1),
          previousHomeSpread: (-baseSpread).toFixed(1)
        });
      } else if (type === 'moneyline') {
        const baseML = -150 + Math.floor(Math.random() * 50);
        odds.push({
          sportsbook: book,
          awayML: baseML,
          homeML: baseML > 0 ? -120 - Math.floor(Math.random() * 30) : 130 + Math.floor(Math.random() * 50),
          previousAwayML: baseML,
          previousHomeML: baseML > 0 ? -120 - Math.floor(Math.random() * 30) : 130 + Math.floor(Math.random() * 50)
        });
      } else if (type === 'totals') {
        const baseTotal = this.getBaseTotal(this.currentGame.sport);
        odds.push({
          sportsbook: book,
          total: baseTotal + (Math.random() - 0.5),
          overOdds: -110 + Math.floor(Math.random() * 10),
          underOdds: -110 + Math.floor(Math.random() * 10),
          previousTotal: baseTotal + (Math.random() - 0.5)
        });
      }
    }
    
    return odds;
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
      'Soccer': 2.5
    };
    return totals[sport] || 200;
  }

  /**
   * Generate player props
   */
  generatePlayerProps() {
    const props = [];
    const players = this.getTopPlayers();
    
    for (const player of players) {
      const propTypes = this.getPropTypes(this.currentGame.sport);
      for (const prop of propTypes) {
        props.push({
          player: player.name,
          team: player.team,
          prop: prop.name,
          line: prop.line,
          overOdds: -110 + Math.floor(Math.random() * 20) - 10,
          underOdds: -110 + Math.floor(Math.random() * 20) - 10,
          movement: 0
        });
      }
    }
    
    return props;
  }

  /**
   * Get top players for the game
   */
  getTopPlayers() {
    // In production, fetch from ESPN API
    return [
      { name: 'Star Player', team: this.currentGame.homeTeam },
      { name: 'Top Scorer', team: this.currentGame.awayTeam }
    ];
  }

  /**
   * Get prop types by sport
   */
  getPropTypes(sport) {
    const props = {
      'NFL': [
        { name: 'Passing Yards', line: 265.5 },
        { name: 'Rushing Yards', line: 75.5 },
        { name: 'Receiving Yards', line: 85.5 }
      ],
      'NBA': [
        { name: 'Points', line: 28.5 },
        { name: 'Rebounds', line: 9.5 },
        { name: 'Assists', line: 7.5 }
      ],
      'MLB': [
        { name: 'Strikeouts', line: 6.5 },
        { name: 'Hits', line: 1.5 },
        { name: 'Total Bases', line: 2.5 }
      ],
      'NHL': [
        { name: 'Goals', line: 0.5 },
        { name: 'Shots on Goal', line: 3.5 },
        { name: 'Points', line: 0.5 }
      ],
      'Soccer': [
        { name: 'Goals', line: 0.5 },
        { name: 'Shots on Target', line: 2.5 },
        { name: 'Assists', line: 0.5 }
      ]
    };
    
    return props[sport] || props['NBA'];
  }

  /**
   * Generate betting trends data
   */
  generateBettingTrends() {
    return {
      publicMoney: {
        spread: {
          away: 45 + Math.floor(Math.random() * 20),
          home: 55 + Math.floor(Math.random() * 20)
        },
        moneyline: {
          away: 40 + Math.floor(Math.random() * 25),
          home: 60 + Math.floor(Math.random() * 25)
        },
        total: {
          over: 48 + Math.floor(Math.random() * 15),
          under: 52 + Math.floor(Math.random() * 15)
        }
      },
      sharpMoney: {
        spread: {
          away: 60 + Math.floor(Math.random() * 15),
          home: 40 + Math.floor(Math.random() * 15)
        },
        moneyline: {
          away: 55 + Math.floor(Math.random() * 20),
          home: 45 + Math.floor(Math.random() * 20)
        },
        total: {
          over: 42 + Math.floor(Math.random() * 18),
          under: 58 + Math.floor(Math.random() * 18)
        }
      },
      tickets: {
        totalBets: 15000 + Math.floor(Math.random() * 35000),
        totalHandle: (2.5 + Math.random() * 4.5).toFixed(1) + 'M'
      },
      steamMoves: [
        {
          type: 'Spread',
          from: -3.5,
          to: -4.0,
          time: '2 hours ago',
          confidence: 'High'
        },
        {
          type: 'Total',
          from: 225.5,
          to: 224.5,
          time: '45 minutes ago',
          confidence: 'Medium'
        }
      ]
    };
  }

  /**
   * Render all odds data
   */
  renderOdds() {
    const gameId = `${this.currentGame.awayTeam}-${this.currentGame.homeTeam}`;
    const oddsData = this.oddsHistory.get(gameId);
    
    if (!oddsData) return;

    // Render spreads
    this.renderSpreads(oddsData.spreads);
    
    // Render moneylines
    this.renderMoneylines(oddsData.moneyline);
    
    // Render totals
    this.renderTotals(oddsData.totals);
    
    // Render props
    this.renderProps(oddsData.props);

    // Render trends
    if (oddsData.trends) {
      this.renderTrends(oddsData.trends);
    }

    // Render parlay
    this.renderParlay();

    // Update best odds
    this.updateBestOdds('spreads');
  }

  /**
   * Render spread odds
   */
  renderSpreads(spreads) {
    const grid = this.overlay.querySelector('#spreadsGrid');
    grid.innerHTML = `
      <div class="betting-odds-header-row">
        <div class="betting-header-cell">Sportsbook</div>
        <div class="betting-header-cell">${this.currentGame.awayTeam}</div>
        <div class="betting-header-cell">${this.currentGame.homeTeam}</div>
      </div>
      ${spreads.map(odd => this.renderSpreadRow(odd)).join('')}
    `;
  }

  /**
   * Render a single spread row
   */
  renderSpreadRow(odd) {
    const awayMovement = parseFloat(odd.awaySpread) - parseFloat(odd.previousAwaySpread);
    const homeMovement = parseFloat(odd.homeSpread) - parseFloat(odd.previousHomeSpread);
    
    return `
      <div class="betting-odds-row">
        <div class="betting-sportsbook-cell">
          <span class="betting-sportsbook-icon" style="background: ${odd.sportsbook.color}"></span>
          ${odd.sportsbook.name}
        </div>
        <div class="betting-odds-cell ${this.getMovementClass(awayMovement)}" 
             title="${awayMovement !== 0 ? `Moved ${Math.abs(awayMovement).toFixed(1)} points ${awayMovement > 0 ? 'up' : 'down'}` : ''}">
          <div class="betting-cell-content">
            <div class="betting-line">${odd.awaySpread > 0 ? '+' : ''}${odd.awaySpread}</div>
            <div class="betting-odds-value">${odd.awayOdds > 0 ? '+' : ''}${odd.awayOdds}</div>
            ${awayMovement !== 0 ? `<span class="betting-movement">${awayMovement > 0 ? '↑' : '↓'}</span>` : ''}
          </div>
          <button class="add-to-parlay-btn" onclick="event.stopPropagation(); window.bettingOddsTracker?.addToParlay({
            game: '${this.currentGame.awayTeam} @ ${this.currentGame.homeTeam}',
            type: 'Spread',
            selection: '${this.currentGame.awayTeam} ${odd.awaySpread}',
            odds: '${odd.awaySpread} (${odd.awayOdds})',
            americanOdds: ${odd.awayOdds},
            sportsbook: '${odd.sportsbook.name}'
          })" title="Add to Parlay">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="betting-odds-cell ${this.getMovementClass(homeMovement)}"
             title="${homeMovement !== 0 ? `Moved ${Math.abs(homeMovement).toFixed(1)} points ${homeMovement > 0 ? 'up' : 'down'}` : ''}">
          <div class="betting-cell-content">
            <div class="betting-line">${odd.homeSpread > 0 ? '+' : ''}${odd.homeSpread}</div>
            <div class="betting-odds-value">${odd.homeOdds > 0 ? '+' : ''}${odd.homeOdds}</div>
            ${homeMovement !== 0 ? `<span class="betting-movement">${homeMovement > 0 ? '↑' : '↓'}</span>` : ''}
          </div>
          <button class="add-to-parlay-btn" onclick="event.stopPropagation(); window.bettingOddsTracker?.addToParlay({
            game: '${this.currentGame.awayTeam} @ ${this.currentGame.homeTeam}',
            type: 'Spread',
            selection: '${this.currentGame.homeTeam} ${odd.homeSpread}',
            odds: '${odd.homeSpread} (${odd.homeOdds})',
            americanOdds: ${odd.homeOdds},
            sportsbook: '${odd.sportsbook.name}'
          })" title="Add to Parlay">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render moneyline odds
   */
  renderMoneylines(moneylines) {
    const grid = this.overlay.querySelector('#moneylineGrid');
    grid.innerHTML = `
      <div class="betting-odds-header-row">
        <div class="betting-header-cell">Sportsbook</div>
        <div class="betting-header-cell">${this.currentGame.awayTeam}</div>
        <div class="betting-header-cell">${this.currentGame.homeTeam}</div>
      </div>
      ${moneylines.map(odd => this.renderMoneylineRow(odd)).join('')}
    `;
  }

  /**
   * Render a single moneyline row
   */
  renderMoneylineRow(odd) {
    const awayMovement = odd.awayML - odd.previousAwayML;
    const homeMovement = odd.homeML - odd.previousHomeML;
    
    return `
      <div class="betting-odds-row">
        <div class="betting-sportsbook-cell">
          <span class="betting-sportsbook-icon" style="background: ${odd.sportsbook.color}"></span>
          ${odd.sportsbook.name}
        </div>
        <div class="betting-odds-cell ${this.getMovementClass(awayMovement)}">
          <div class="betting-odds-value">${odd.awayML > 0 ? '+' : ''}${odd.awayML}</div>
          ${awayMovement !== 0 ? `<span class="betting-movement">${awayMovement > 0 ? '↑' : '↓'}</span>` : ''}
        </div>
        <div class="betting-odds-cell ${this.getMovementClass(homeMovement)}">
          <div class="betting-odds-value">${odd.homeML > 0 ? '+' : ''}${odd.homeML}</div>
          ${homeMovement !== 0 ? `<span class="betting-movement">${homeMovement > 0 ? '↑' : '↓'}</span>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render totals odds
   */
  renderTotals(totals) {
    const grid = this.overlay.querySelector('#totalsGrid');
    grid.innerHTML = `
      <div class="betting-odds-header-row">
        <div class="betting-header-cell">Sportsbook</div>
        <div class="betting-header-cell">Over</div>
        <div class="betting-header-cell">Under</div>
      </div>
      ${totals.map(odd => this.renderTotalRow(odd)).join('')}
    `;
  }

  /**
   * Render a single total row
   */
  renderTotalRow(odd) {
    const totalMovement = odd.total - odd.previousTotal;
    
    return `
      <div class="betting-odds-row">
        <div class="betting-sportsbook-cell">
          <span class="betting-sportsbook-icon" style="background: ${odd.sportsbook.color}"></span>
          ${odd.sportsbook.name}
        </div>
        <div class="betting-odds-cell ${this.getMovementClass(totalMovement)}">
          <div class="betting-line">O ${odd.total.toFixed(1)}</div>
          <div class="betting-odds-value">${odd.overOdds > 0 ? '+' : ''}${odd.overOdds}</div>
          ${totalMovement !== 0 ? `<span class="betting-movement">${totalMovement > 0 ? '↑' : '↓'}</span>` : ''}
        </div>
        <div class="betting-odds-cell ${this.getMovementClass(-totalMovement)}">
          <div class="betting-line">U ${odd.total.toFixed(1)}</div>
          <div class="betting-odds-value">${odd.underOdds > 0 ? '+' : ''}${odd.underOdds}</div>
          ${totalMovement !== 0 ? `<span class="betting-movement">${-totalMovement > 0 ? '↑' : '↓'}</span>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render player props
   */
  renderProps(props) {
    const grid = this.overlay.querySelector('#propsGrid');
    grid.innerHTML = props.map(prop => `
      <div class="betting-prop-card">
        <div class="betting-prop-header">
          <div class="betting-prop-player">${prop.player}</div>
          <div class="betting-prop-team">${prop.team}</div>
        </div>
        <div class="betting-prop-type">${prop.prop}</div>
        <div class="betting-prop-odds">
          <div class="betting-prop-option">
            <div class="betting-prop-label">Over ${prop.line}</div>
            <div class="betting-prop-value">${prop.overOdds > 0 ? '+' : ''}${prop.overOdds}</div>
          </div>
          <div class="betting-prop-option">
            <div class="betting-prop-label">Under ${prop.line}</div>
            <div class="betting-prop-value">${prop.underOdds > 0 ? '+' : ''}${prop.underOdds}</div>
          </div>
        </div>
        ${prop.movement !== 0 ? `
          <div class="betting-prop-movement ${prop.movement > 0 ? 'up' : 'down'}">
            Line moved ${Math.abs(prop.movement)} ${prop.movement > 0 ? '↑' : '↓'}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  /**
   * Render parlay builder
   */
  renderParlay() {
    const container = this.overlay?.querySelector('#parlayContainer');
    if (!container) return;

    if (this.parlayLegs.length === 0) {
      container.innerHTML = `
        <div class="parlay-empty-state">
          <i class="fas fa-layer-group parlay-empty-icon"></i>
          <h3>Build Your Parlay</h3>
          <p>Click the <i class="fas fa-plus"></i> button on any odds to add them to your parlay.</p>
          <div class="parlay-tips">
            <h4>Parlay Tips:</h4>
            <ul>
              <li>Combine 2-10 bets from different games</li>
              <li>All legs must win for parlay to pay out</li>
              <li>Higher risk = Higher potential payout</li>
              <li>Cannot combine bets from the same game</li>
            </ul>
          </div>
        </div>
      `;
      return;
    }

    const defaultWager = 100;
    const calc = this.calculateParlayPayout(defaultWager);

    container.innerHTML = `
      <div class="parlay-builder">
        <div class="parlay-header">
          <h3><i class="fas fa-layer-group"></i> Your Parlay (${this.parlayLegs.length} Legs)</h3>
          <button class="parlay-clear-btn" onclick="window.bettingOddsTracker?.clearParlay()">
            <i class="fas fa-trash"></i> Clear All
          </button>
        </div>

        <div class="parlay-legs-list">
          ${this.parlayLegs.map((leg, index) => `
            <div class="parlay-leg-card">
              <div class="parlay-leg-number">${index + 1}</div>
              <div class="parlay-leg-content">
                <div class="parlay-leg-game">${leg.game}</div>
                <div class="parlay-leg-bet">
                  <span class="parlay-leg-type">${leg.type}:</span>
                  <span class="parlay-leg-selection">${leg.selection}</span>
                </div>
                <div class="parlay-leg-odds">
                  ${leg.americanOdds > 0 ? '+' : ''}${leg.americanOdds}
                  <span class="parlay-leg-sportsbook">${leg.sportsbook}</span>
                </div>
              </div>
              <button class="parlay-leg-remove" onclick="window.bettingOddsTracker?.removeFromParlay('${leg.id}')" title="Remove">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `).join('')}
        </div>

        <div class="parlay-calculator">
          <h4>Parlay Calculator</h4>
          <div class="parlay-calc-input">
            <label>Wager Amount:</label>
            <div class="parlay-wager-input">
              <span class="currency-symbol">$</span>
              <input type="number" id="parlayWager" value="${defaultWager}" min="1" max="10000" 
                     onchange="window.bettingOddsTracker?.updateParlayCalculation(this.value)">
            </div>
          </div>

          <div class="parlay-calc-results" id="parlayResults">
            <div class="parlay-calc-row">
              <span class="parlay-calc-label">Combined Odds:</span>
              <span class="parlay-calc-value odds-value">${calc.totalOdds > 0 ? '+' : ''}${calc.totalOdds}</span>
            </div>
            <div class="parlay-calc-row">
              <span class="parlay-calc-label">Decimal Odds:</span>
              <span class="parlay-calc-value">${calc.decimalOdds}</span>
            </div>
            <div class="parlay-calc-row highlight">
              <span class="parlay-calc-label">Total Payout:</span>
              <span class="parlay-calc-value payout-value">$${calc.payout}</span>
            </div>
            <div class="parlay-calc-row profit">
              <span class="parlay-calc-label">Profit:</span>
              <span class="parlay-calc-value profit-value">$${calc.profit}</span>
            </div>
          </div>

          <div class="parlay-risk-meter">
            <div class="risk-meter-header">
              <span>Risk Level:</span>
              <span class="risk-level ${this.getParlayRiskClass()}">${this.getParlayRiskLevel()}</span>
            </div>
            <div class="risk-meter-bar">
              <div class="risk-meter-fill ${this.getParlayRiskClass()}" style="width: ${this.parlayLegs.length * 10}%"></div>
            </div>
            <div class="risk-meter-info">
              Win probability decreases with each additional leg
            </div>
          </div>
        </div>

        <div class="parlay-actions">
          <button class="parlay-smart-btn" onclick="window.bettingOddsTracker?.generateSmartParlay()">
            <i class="fas fa-brain"></i> AI Smart Parlay
          </button>
          <button class="parlay-save-btn" onclick="window.bettingOddsTracker?.saveParlay()">
            <i class="fas fa-save"></i> Save Parlay
          </button>
          <button class="parlay-leaderboard-btn" onclick="window.paperLeaderboard?.open()">
            <i class="fas fa-trophy"></i> Leaderboard
          </button>
          <button class="parlay-share-btn" onclick="window.bettingOddsTracker?.shareParlay()">
            <i class="fas fa-share-alt"></i> Share
          </button>
        </div>

        <div class="parlay-disclaimer">
          <i class="fas fa-info-circle"></i> For entertainment and educational purposes only. This is not real money betting.
        </div>

        <div class="saved-parlays-section">
            <h4 class="saved-parlays-title">Your Paper Trades (Recent)</h4>
            <div class="saved-parlays-list">
                ${(JSON.parse(localStorage.getItem('betting_saved_parlays') || '[]')).slice(0, 5).map(p => `
                    <div class="saved-parlay-card ${p.status || 'pending'}">
                        <div class="saved-parlay-info">
                            <div class="saved-parlay-odds">+${p.totalOdds}</div>
                            <div class="saved-parlay-legs">${p.legs.length} Legs</div>
                        </div>
                        <div class="saved-parlay-status-box">
                            ${p.status === 'won' ? '<span class="status-won">WON</span>' : 
                              p.status === 'lost' ? '<span class="status-lost">LOST</span>' : 
                              `<button class="settle-btn" onclick="window.bettingOddsTracker?.settleParlay(${p.id})">Settle</button>`}
                        </div>
                    </div>
                `).join('')}
                ${(JSON.parse(localStorage.getItem('betting_saved_parlays') || '[]')).length === 0 ? '<p class="no-saved-parlays">No saved trades yet.</p>' : ''}
            </div>
        </div>
      </div>
    `;
  }

  /**
   * Update parlay calculation
   */
  updateParlayCalculation(wager) {
    const wagerAmount = parseFloat(wager) || 100;
    const calc = this.calculateParlayPayout(wagerAmount);
    
    const resultsDiv = this.overlay?.querySelector('#parlayResults');
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="parlay-calc-row">
          <span class="parlay-calc-label">Combined Odds:</span>
          <span class="parlay-calc-value odds-value">${calc.totalOdds > 0 ? '+' : ''}${calc.totalOdds}</span>
        </div>
        <div class="parlay-calc-row">
          <span class="parlay-calc-label">Decimal Odds:</span>
          <span class="parlay-calc-value">${calc.decimalOdds}</span>
        </div>
        <div class="parlay-calc-row highlight">
          <span class="parlay-calc-label">Total Payout:</span>
          <span class="parlay-calc-value payout-value">$${calc.payout}</span>
        </div>
        <div class="parlay-calc-row profit">
          <span class="parlay-calc-label">Profit:</span>
          <span class="parlay-calc-value profit-value">$${calc.profit}</span>
        </div>
      `;
    }
  }

  /**
   * Get parlay risk level
   */
  getParlayRiskLevel() {
    const legs = this.parlayLegs.length;
    if (legs <= 2) return 'Low';
    if (legs <= 4) return 'Medium';
    if (legs <= 6) return 'High';
    return 'Very High';
  }

  /**
   * Get parlay risk CSS class
   */
  getParlayRiskClass() {
    const legs = this.parlayLegs.length;
    if (legs <= 2) return 'risk-low';
    if (legs <= 4) return 'risk-medium';
    if (legs <= 6) return 'risk-high';
    return 'risk-very-high';
  }

  /**
   * Save parlay to user's saved parlays
   */
  saveParlay() {
    const wager = parseFloat(this.overlay?.querySelector('#parlayWager')?.value) || 100;
    const calc = this.calculateParlayPayout(wager);
    
    const parlay = {
      id: Date.now(),
      legs: [...this.parlayLegs],
      wager,
      ...calc,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    const savedParlays = JSON.parse(localStorage.getItem('betting_saved_parlays') || '[]');
    savedParlays.unshift(parlay);
    localStorage.setItem('betting_saved_parlays', JSON.stringify(savedParlays.slice(0, 20))); // Keep last 20

    if (typeof showToast === 'function') {
      showToast('✓ Parlay saved successfully!', 'success');
    }

    this.renderParlay(); // Refresh to show saved section
  }

  /**
   * Settle a saved parlay (Mock logic for demo)
   */
  settleParlay(parlayId) {
    const savedParlays = JSON.parse(localStorage.getItem('betting_saved_parlays') || '[]');
    const index = savedParlays.findIndex(p => p.id === parlayId);
    
    if (index !== -1 && savedParlays[index].status !== 'won' && savedParlays[index].status !== 'lost') {
        // Randomly settle as won (40% chance) or lost (60% chance)
        const isWin = Math.random() > 0.6;
        savedParlays[index].status = isWin ? 'won' : 'lost';
        localStorage.setItem('betting_saved_parlays', JSON.stringify(savedParlays));
        
        if (typeof showToast === 'function') {
            showToast(`Parlay settled: ${isWin ? 'WON! 🎉' : 'Lost 😞'}`, isWin ? 'success' : 'info');
        }
        
        // Log to activity feed if it's a win
        if (isWin && window.ActivityFeed) {
            window.ActivityFeed.logParlayWin(
                savedParlays[index].legs.length, 
                savedParlays[index].totalOdds, 
                Math.round(parseFloat(savedParlays[index].profit))
            );
        }

        this.renderParlay();
        
        // Update leaderboard if open
        if (window.paperLeaderboard?.container) {
            window.paperLeaderboard.open();
        }
    }
  }

  /**
   * Share parlay
   */
  shareParlay() {
    const calc = this.calculateParlayPayout(100);
    const shareText = `🎲 My ${this.parlayLegs.length}-Leg Parlay (+${calc.totalOdds}):\n\n${
      this.parlayLegs.map((leg, i) => `${i + 1}. ${leg.selection} (${leg.americanOdds > 0 ? '+' : ''}${leg.americanOdds})`).join('\n')
    }\n\n$100 → $${calc.payout} potential payout! #UltimateSportsAI`;

    if (window.socialShareManager) {
        window.socialShareManager.openShare({
            title: 'Share Your Parlay',
            text: shareText,
            type: 'slip',
            details: {
                legs: this.parlayLegs,
                payout: calc.payout,
                totalOdds: calc.totalOdds
            }
        });
    } else {
        // Fallback if manager not loaded
        if (navigator.share) {
            navigator.share({
                title: 'My Sports Parlay',
                text: shareText
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                if (typeof showToast === 'function') {
                    showToast('✓ Parlay copied to clipboard!', 'success');
                }
            });
        }
    }
  }

  /**
   * Render betting trends
   */
  renderTrends(trends) {
    const container = this.overlay.querySelector('#trendsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="trends-section">
        <h3 class="trends-section-title">📊 Public vs Sharp Money</h3>
        <p class="trends-description">Compare casual bettors (public) against professional bettors (sharp money)</p>
        
        <div class="trends-comparison-grid">
          <!-- Spread Betting -->
          <div class="trend-card">
            <div class="trend-card-header">
              <h4>Spread Betting</h4>
              <span class="trend-total-bets">${trends.tickets.totalBets.toLocaleString()} bets</span>
            </div>
            <div class="trend-comparison">
              <div class="trend-row">
                <span class="trend-label">Public Money</span>
                <div class="trend-bars">
                  <div class="trend-bar-container">
                    <div class="trend-bar public" style="width: ${trends.publicMoney.spread.away}%">
                      <span class="trend-bar-label">${this.currentGame.awayTeam}</span>
                      <span class="trend-bar-value">${trends.publicMoney.spread.away}%</span>
                    </div>
                  </div>
                  <div class="trend-bar-container">
                    <div class="trend-bar public" style="width: ${trends.publicMoney.spread.home}%">
                      <span class="trend-bar-label">${this.currentGame.homeTeam}</span>
                      <span class="trend-bar-value">${trends.publicMoney.spread.home}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="trend-row">
                <span class="trend-label">Sharp Money 🎯</span>
                <div class="trend-bars">
                  <div class="trend-bar-container">
                    <div class="trend-bar sharp ${trends.sharpMoney.spread.away > 60 ? 'hot' : ''}" style="width: ${trends.sharpMoney.spread.away}%">
                      <span class="trend-bar-label">${this.currentGame.awayTeam}</span>
                      <span class="trend-bar-value">${trends.sharpMoney.spread.away}%</span>
                    </div>
                  </div>
                  <div class="trend-bar-container">
                    <div class="trend-bar sharp ${trends.sharpMoney.spread.home > 60 ? 'hot' : ''}" style="width: ${trends.sharpMoney.spread.home}%">
                      <span class="trend-bar-label">${this.currentGame.homeTeam}</span>
                      <span class="trend-bar-value">${trends.sharpMoney.spread.home}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Moneyline Betting -->
          <div class="trend-card">
            <div class="trend-card-header">
              <h4>Moneyline Betting</h4>
              <span class="trend-total-handle">$${trends.tickets.totalHandle} handle</span>
            </div>
            <div class="trend-comparison">
              <div class="trend-row">
                <span class="trend-label">Public Money</span>
                <div class="trend-bars">
                  <div class="trend-bar-container">
                    <div class="trend-bar public" style="width: ${trends.publicMoney.moneyline.away}%">
                      <span class="trend-bar-label">${this.currentGame.awayTeam}</span>
                      <span class="trend-bar-value">${trends.publicMoney.moneyline.away}%</span>
                    </div>
                  </div>
                  <div class="trend-bar-container">
                    <div class="trend-bar public" style="width: ${trends.publicMoney.moneyline.home}%">
                      <span class="trend-bar-label">${this.currentGame.homeTeam}</span>
                      <span class="trend-bar-value">${trends.publicMoney.moneyline.home}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="trend-row">
                <span class="trend-label">Sharp Money 🎯</span>
                <div class="trend-bars">
                  <div class="trend-bar-container">
                    <div class="trend-bar sharp ${trends.sharpMoney.moneyline.away > 60 ? 'hot' : ''}" style="width: ${trends.sharpMoney.moneyline.away}%">
                      <span class="trend-bar-label">${this.currentGame.awayTeam}</span>
                      <span class="trend-bar-value">${trends.sharpMoney.moneyline.away}%</span>
                    </div>
                  </div>
                  <div class="trend-bar-container">
                    <div class="trend-bar sharp ${trends.sharpMoney.moneyline.home > 60 ? 'hot' : ''}" style="width: ${trends.sharpMoney.moneyline.home}%">
                      <span class="trend-bar-label">${this.currentGame.homeTeam}</span>
                      <span class="trend-bar-value">${trends.sharpMoney.moneyline.home}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Betting -->
          <div class="trend-card">
            <div class="trend-card-header">
              <h4>Over/Under Betting</h4>
            </div>
            <div class="trend-comparison">
              <div class="trend-row">
                <span class="trend-label">Public Money</span>
                <div class="trend-bars">
                  <div class="trend-bar-container">
                    <div class="trend-bar public" style="width: ${trends.publicMoney.total.over}%">
                      <span class="trend-bar-label">Over</span>
                      <span class="trend-bar-value">${trends.publicMoney.total.over}%</span>
                    </div>
                  </div>
                  <div class="trend-bar-container">
                    <div class="trend-bar public" style="width: ${trends.publicMoney.total.under}%">
                      <span class="trend-bar-label">Under</span>
                      <span class="trend-bar-value">${trends.publicMoney.total.under}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="trend-row">
                <span class="trend-label">Sharp Money 🎯</span>
                <div class="trend-bars">
                  <div class="trend-bar-container">
                    <div class="trend-bar sharp ${trends.sharpMoney.total.over > 60 ? 'hot' : ''}" style="width: ${trends.sharpMoney.total.over}%">
                      <span class="trend-bar-label">Over</span>
                      <span class="trend-bar-value">${trends.sharpMoney.total.over}%</span>
                    </div>
                  </div>
                  <div class="trend-bar-container">
                    <div class="trend-bar sharp ${trends.sharpMoney.total.under > 60 ? 'hot' : ''}" style="width: ${trends.sharpMoney.total.under}%">
                      <span class="trend-bar-label">Under</span>
                      <span class="trend-bar-value">${trends.sharpMoney.total.under}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="trends-section">
        <h3 class="trends-section-title">⚡ Steam Moves & Line Freezes</h3>
        <p class="trends-description">Significant line movements indicating sharp action</p>
        
        <div class="steam-moves-list">
          ${trends.steamMoves.map(move => `
            <div class="steam-move-card ${move.confidence.toLowerCase()}">
              <div class="steam-move-header">
                <span class="steam-move-type">${move.type}</span>
                <span class="steam-move-confidence ${move.confidence.toLowerCase()}">${move.confidence} Confidence</span>
              </div>
              <div class="steam-move-details">
                <div class="steam-move-change">
                  <span class="steam-from">${move.from}</span>
                  <i class="fas fa-arrow-right"></i>
                  <span class="steam-to">${move.to}</span>
                </div>
                <span class="steam-move-time">${move.time}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="trends-legend">
        <div class="legend-item">
          <span class="legend-icon public">📢</span>
          <span class="legend-text"><strong>Public Money:</strong> Bets from casual bettors (higher volume, lower accuracy)</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon sharp">🎯</span>
          <span class="legend-text"><strong>Sharp Money:</strong> Bets from professional bettors (lower volume, higher accuracy)</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon steam">⚡</span>
          <span class="legend-text"><strong>Steam Move:</strong> Rapid line movement across multiple books, often following sharp action</span>
        </div>
      </div>
    `;
  }

  /**
   * Get movement CSS class
   */
  getMovementClass(movement) {
    if (movement > 0) return 'movement-up';
    if (movement < 0) return 'movement-down';
    return '';
  }

  /**
   * Update best odds display
   */
  updateBestOdds(tabName) {
    const gameId = `${this.currentGame.awayTeam}-${this.currentGame.homeTeam}`;
    const oddsData = this.oddsHistory.get(gameId);
    
    if (!oddsData) return;

    let bestDisplay = '-';
    
    if (tabName === 'spreads') {
      const bestSpread = this.findBestSpread(oddsData.spreads);
      bestDisplay = `${bestSpread.sportsbook} ${bestSpread.team}: ${bestSpread.spread} (${bestSpread.odds})`;
    } else if (tabName === 'moneyline') {
      const bestML = this.findBestMoneyline(oddsData.moneyline);
      bestDisplay = `${bestML.sportsbook} ${bestML.team}: ${bestML.odds}`;
    } else if (tabName === 'totals') {
      const bestTotal = this.findBestTotal(oddsData.totals);
      bestDisplay = `${bestTotal.sportsbook} ${bestTotal.type} ${bestTotal.total}: ${bestTotal.odds}`;
    }

    const display = this.overlay.querySelector('#bestOddsDisplay');
    if (display) display.textContent = bestDisplay;
  }

  /**
   * Find best spread value
   */
  findBestSpread(spreads) {
    let best = { sportsbook: '-', team: '-', spread: '-', odds: '-' };
    let bestValue = -Infinity;

    for (const odd of spreads) {
      const awayValue = parseFloat(odd.awaySpread) - (110 + odd.awayOdds) / 1000;
      const homeValue = parseFloat(odd.homeSpread) - (110 + odd.homeOdds) / 1000;
      
      if (awayValue > bestValue) {
        bestValue = awayValue;
        best = {
          sportsbook: odd.sportsbook.name,
          team: this.currentGame.awayTeam,
          spread: odd.awaySpread > 0 ? `+${odd.awaySpread}` : odd.awaySpread,
          odds: odd.awayOdds > 0 ? `+${odd.awayOdds}` : odd.awayOdds
        };
      }
      
      if (homeValue > bestValue) {
        bestValue = homeValue;
        best = {
          sportsbook: odd.sportsbook.name,
          team: this.currentGame.homeTeam,
          spread: odd.homeSpread > 0 ? `+${odd.homeSpread}` : odd.homeSpread,
          odds: odd.homeOdds > 0 ? `+${odd.homeOdds}` : odd.homeOdds
        };
      }
    }

    return best;
  }

  /**
   * Find best moneyline value
   */
  findBestMoneyline(moneylines) {
    let best = { sportsbook: '-', team: '-', odds: '-' };
    let bestValue = -Infinity;

    for (const odd of moneylines) {
      if (odd.awayML > bestValue) {
        bestValue = odd.awayML;
        best = {
          sportsbook: odd.sportsbook.name,
          team: this.currentGame.awayTeam,
          odds: odd.awayML > 0 ? `+${odd.awayML}` : odd.awayML
        };
      }
      
      if (odd.homeML > bestValue) {
        bestValue = odd.homeML;
        best = {
          sportsbook: odd.sportsbook.name,
          team: this.currentGame.homeTeam,
          odds: odd.homeML > 0 ? `+${odd.homeML}` : odd.homeML
        };
      }
    }

    return best;
  }

  /**
   * Find best total value
   */
  findBestTotal(totals) {
    let best = { sportsbook: '-', type: '-', total: '-', odds: '-' };
    let bestValue = -Infinity;

    for (const odd of totals) {
      if (odd.overOdds > bestValue) {
        bestValue = odd.overOdds;
        best = {
          sportsbook: odd.sportsbook.name,
          type: 'Over',
          total: odd.total.toFixed(1),
          odds: odd.overOdds > 0 ? `+${odd.overOdds}` : odd.overOdds
        };
      }
      
      if (odd.underOdds > bestValue) {
        bestValue = odd.underOdds;
        best = {
          sportsbook: odd.sportsbook.name,
          type: 'Under',
          total: odd.total.toFixed(1),
          odds: odd.underOdds > 0 ? `+${odd.underOdds}` : odd.underOdds
        };
      }
    }

    return best;
  }

  /**
   * Start tracking odds updates
   */
  startTracking() {
    // Update odds every 10 seconds
    this.updateInterval = setInterval(() => {
      this.updateOdds();
    }, 10000);
  }

  /**
   * Update odds with simulated line movement
   */
  updateOdds() {
    const gameId = `${this.currentGame.awayTeam}-${this.currentGame.homeTeam}`;
    const oddsData = this.oddsHistory.get(gameId);
    
    if (!oddsData) return;

    // Update spreads
    oddsData.spreads = oddsData.spreads.map(odd => {
      const movement = (Math.random() - 0.5) * 0.5;
      const newAwaySpread = (parseFloat(odd.awaySpread) + movement).toFixed(1);
      
      if (Math.abs(movement) > this.alertThreshold) {
        this.addAlert('spread', odd.sportsbook.name, this.currentGame.awayTeam, movement);
      }
      
      return {
        ...odd,
        previousAwaySpread: odd.awaySpread,
        previousHomeSpread: odd.homeSpread,
        awaySpread: newAwaySpread,
        homeSpread: (-newAwaySpread).toFixed(1)
      };
    });

    // Update moneylines
    oddsData.moneyline = oddsData.moneyline.map(odd => {
      const awayMovement = Math.floor((Math.random() - 0.5) * 20);
      const homeMovement = -awayMovement;
      
      if (Math.abs(awayMovement) > 10) {
        this.addAlert('moneyline', odd.sportsbook.name, this.currentGame.awayTeam, awayMovement);
      }
      
      return {
        ...odd,
        previousAwayML: odd.awayML,
        previousHomeML: odd.homeML,
        awayML: odd.awayML + awayMovement,
        homeML: odd.homeML + homeMovement
      };
    });

    // Update totals
    oddsData.totals = oddsData.totals.map(odd => {
      const movement = (Math.random() - 0.5) * 0.5;
      
      if (Math.abs(movement) > this.alertThreshold) {
        this.addAlert('total', odd.sportsbook.name, 'Total', movement);
      }
      
      return {
        ...odd,
        previousTotal: odd.total,
        total: odd.total + movement
      };
    });

    // Re-render
    this.renderOdds();
  }

  /**
   * Add a line movement alert
   */
  addAlert(type, sportsbook, subject, movement) {
    const alert = {
      id: Date.now() + Math.random(),
      type,
      sportsbook,
      subject,
      movement,
      timestamp: Date.now()
    };

    this.activeAlerts.unshift(alert);
    if (this.activeAlerts.length > 5) {
      this.activeAlerts.pop();
    }

    this.renderAlerts();
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      this.dismissAlert(alert.id);
    }, 10000);
  }

  /**
   * Render active alerts
   */
  renderAlerts() {
    const container = this.overlay.querySelector('#bettingAlerts');
    if (!container) return;

    container.innerHTML = this.activeAlerts.map(alert => `
      <div class="betting-alert ${alert.movement > 0 ? 'alert-up' : 'alert-down'}">
        <div class="betting-alert-icon">${alert.movement > 0 ? '📈' : '📉'}</div>
        <div class="betting-alert-content">
          <div class="betting-alert-title">Line Movement Alert</div>
          <div class="betting-alert-message">
            ${alert.sportsbook} ${alert.subject} ${alert.type} moved ${Math.abs(alert.movement).toFixed(1)} ${alert.movement > 0 ? 'up' : 'down'}
          </div>
        </div>
        <button class="betting-alert-dismiss" onclick="window.bettingOddsTracker?.dismissAlert(${alert.id})">✕</button>
      </div>
    `).join('');
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId) {
    this.activeAlerts = this.activeAlerts.filter(a => a.id !== alertId);
    this.renderAlerts();
  }

  /**
   * Generate AI-powered smart parlay
   */
  async generateSmartParlay() {
    if (!window.smartParlayGenerator) {
      if (typeof showToast === 'function') {
        showToast('AI system loading...', 'info');
      }
      return;
    }

    // Show loading state
    if (typeof showToast === 'function') {
      showToast('🤖 AI analyzing all available games...', 'info');
    }

    try {
      // Get all available games from sports data service
      const allGames = await this.getAllAvailableGames();

      if (!allGames || allGames.length === 0) {
        if (typeof showToast === 'function') {
          showToast('No games available for analysis', 'error');
        }
        return;
      }

      // Open strategy selector modal
      this.showSmartParlayStrategyModal(allGames);

    } catch (error) {
      console.error('Error generating smart parlay:', error);
      if (typeof showToast === 'function') {
        showToast('Failed to generate smart parlay', 'error');
      }
    }
  }

  /**
   * Get all available games for smart parlay
   */
  async getAllAvailableGames() {
    if (!window.sportsDataService) return [];

    try {
      // Get live and upcoming games
      const liveGames = await window.sportsDataService.getAllLiveGames();
      const upcomingGames = await window.sportsDataService.getAllUpcomingGames();
      
      // Combine and return
      return [...liveGames, ...upcomingGames.slice(0, 20)]; // Limit to prevent overload
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  }

  /**
   * Show strategy selector modal
   */
  showSmartParlayStrategyModal(allGames) {
    const modal = document.createElement('div');
    modal.className = 'smart-parlay-modal-overlay';
    modal.innerHTML = `
      <div class="smart-parlay-modal">
        <div class="smart-parlay-modal-header">
          <h2><i class="fas fa-brain"></i> AI Smart Parlay Generator</h2>
          <button class="modal-close-btn" onclick="this.closest('.smart-parlay-modal-overlay').remove()">✕</button>
        </div>
        
        <div class="smart-parlay-modal-body">
          <p class="smart-parlay-intro">
            Our AI analyzes <strong>${allGames.length} games</strong> using historical ROI data, sharp money trends, and line value to build optimal parlays.
          </p>

          <div class="smart-parlay-options">
            <div class="option-group">
              <label>Number of Legs:</label>
              <div class="leg-selector">
                <button class="leg-option" data-legs="2">2 Legs</button>
                <button class="leg-option" data-legs="3">3 Legs</button>
                <button class="leg-option active" data-legs="4">4 Legs</button>
                <button class="leg-option" data-legs="5">5 Legs</button>
                <button class="leg-option" data-legs="6">6 Legs</button>
              </div>
            </div>

            <div class="option-group">
              <label>Strategy:</label>
              <div class="strategy-selector">
                <div class="strategy-card active" data-strategy="balanced">
                  <div class="strategy-icon">⚖️</div>
                  <div class="strategy-name">Balanced</div>
                  <div class="strategy-desc">Equal weighting across all factors</div>
                </div>
                <div class="strategy-card" data-strategy="sharp">
                  <div class="strategy-icon">🎯</div>
                  <div class="strategy-name">Sharp Money</div>
                  <div class="strategy-desc">Follow professional bettor patterns</div>
                </div>
                <div class="strategy-card" data-strategy="value">
                  <div class="strategy-icon">💎</div>
                  <div class="strategy-name">Value Hunter</div>
                  <div class="strategy-desc">Best odds and line value</div>
                </div>
                <div class="strategy-card" data-strategy="high-odds">
                  <div class="strategy-icon">🚀</div>
                  <div class="strategy-name">High Payout</div>
                  <div class="strategy-desc">Maximum payout potential</div>
                </div>
              </div>
            </div>
          </div>

          <div class="smart-parlay-actions">
            <button class="btn-generate-parlay" onclick="window.bettingOddsTracker?.executeSmartParlayGeneration(${JSON.stringify(allGames).replace(/"/g, '&quot;')})">
              <i class="fas fa-magic"></i> Generate Smart Parlay
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Attach event listeners
    modal.querySelectorAll('.leg-option').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.leg-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    modal.querySelectorAll('.strategy-card').forEach(card => {
      card.addEventListener('click', () => {
        modal.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });

    // Fade in
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });
  }

  /**
   * Execute smart parlay generation with selected options
   */
  async executeSmartParlayGeneration(allGames) {
    const modal = document.querySelector('.smart-parlay-modal-overlay');
    if (!modal) return;

    // Get selected options
    const selectedLegs = parseInt(modal.querySelector('.leg-option.active')?.dataset.legs || '4');
    const selectedStrategy = modal.querySelector('.strategy-card.active')?.dataset.strategy || 'balanced';

    // Close modal
    modal.remove();

    // Show loading
    if (typeof showToast === 'function') {
      showToast('🤖 AI is building your parlay...', 'info');
    }

    try {
      // Generate parlay
      const result = await window.smartParlayGenerator.generateSmartParlay(
        allGames,
        selectedLegs,
        selectedStrategy
      );

      if (!result.success) {
        if (typeof showToast === 'function') {
          showToast(result.message, 'warning');
        }
        return;
      }

      // Clear current parlay
      this.parlayLegs = [];

      // Load generated legs
      for (const leg of result.legs) {
        this.parlayLegs.push(leg);
      }

      this.updateParlayCount();
      this.renderParlay();

      // Show analysis results
      this.showSmartParlayAnalysis(result);

      // Success message
      if (typeof showToast === 'function') {
        showToast('✅ Smart Parlay generated successfully!', 'success');
      }

      // Play sound
      if (window.soundEffects) {
        window.soundEffects.playSound('achievement');
      }

    } catch (error) {
      console.error('Error executing smart parlay generation:', error);
      if (typeof showToast === 'function') {
        showToast('Failed to generate parlay. Please try again.', 'error');
      }
    }
  }

  /**
   * Show smart parlay analysis modal
   */
  showSmartParlayAnalysis(result) {
    const analysis = result.analysis;
    
    const modal = document.createElement('div');
    modal.className = 'smart-parlay-analysis-overlay';
    modal.innerHTML = `
      <div class="smart-parlay-analysis-modal">
        <div class="analysis-header">
          <h2>🤖 AI Parlay Analysis</h2>
          <button class="modal-close-btn" onclick="this.closest('.smart-parlay-analysis-overlay').remove()">✕</button>
        </div>

        <div class="analysis-body">
          <div class="analysis-recommendation ${this.getRecommendationClass(analysis.expectedValue)}">
            ${analysis.recommendation}
          </div>

          <div class="analysis-metrics-grid">
            <div class="metric-card">
              <div class="metric-label">AI Confidence</div>
              <div class="metric-value">${analysis.avgAIScore}/100</div>
              <div class="metric-bar">
                <div class="metric-bar-fill" style="width: ${analysis.avgAIScore}%; background: linear-gradient(90deg, #10b981, #3b82f6)"></div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Expected Value</div>
              <div class="metric-value ${parseFloat(analysis.expectedValue) > 0 ? 'positive' : 'negative'}">
                ${analysis.expectedValue}%
              </div>
              <div class="metric-subtext">
                ${parseFloat(analysis.expectedValue) > 0 ? 'Positive EV indicates long-term profitability' : 'Consider reducing legs'}
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Win Probability</div>
              <div class="metric-value">${analysis.expectedWinProbability}%</div>
              <div class="metric-subtext">Based on AI confidence scores</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Risk Rating</div>
              <div class="metric-value risk-${analysis.riskRating.toLowerCase().replace(' ', '-')}">${analysis.riskRating}</div>
              <div class="metric-subtext">${result.legs.length} legs @ +${analysis.combinedOdds}</div>
            </div>
          </div>

          <div class="analysis-breakdown">
            <h3>Leg-by-Leg Breakdown</h3>
            ${result.legs.map((leg, index) => `
              <div class="leg-analysis-card">
                <div class="leg-analysis-header">
                  <span class="leg-number">#${index + 1}</span>
                  <span class="leg-game">${leg.game}</span>
                  <span class="leg-ai-score score-${this.getScoreClass(leg.aiScore)}">${leg.aiScore}/100</span>
                </div>
                <div class="leg-analysis-bet">
                  <strong>${leg.type}:</strong> ${leg.selection}
                </div>
                <div class="leg-analysis-breakdown">
                  ${Object.entries(leg.scoreBreakdown).map(([key, value]) => `
                    <div class="breakdown-item">
                      <span class="breakdown-label">${this.formatBreakdownLabel(key)}:</span>
                      <span class="breakdown-value">${value} pts</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="analysis-actions">
            <button class="btn-accept-parlay" onclick="this.closest('.smart-parlay-analysis-overlay').remove()">
              <i class="fas fa-check"></i> Accept Parlay
            </button>
            <button class="btn-regenerate" onclick="window.bettingOddsTracker?.generateSmartParlay(); this.closest('.smart-parlay-analysis-overlay').remove();">
              <i class="fas fa-sync"></i> Regenerate
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Fade in
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });
  }

  /**
   * Get recommendation CSS class
   */
  getRecommendationClass(expectedValue) {
    const ev = parseFloat(expectedValue);
    if (ev > 15) return 'recommendation-strong';
    if (ev > 5) return 'recommendation-good';
    if (ev > 0) return 'recommendation-neutral';
    return 'recommendation-caution';
  }

  /**
   * Get score class for styling
   */
  getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Format breakdown label for display
   */
  formatBreakdownLabel(key) {
    const labels = {
      historicalPerformance: 'Historical',
      sportROI: 'Sport ROI',
      sharpAlignment: 'Sharp Money',
      lineValue: 'Line Value',
      gameHype: 'Hype',
      recency: 'Timing'
    };
    return labels[key] || key;
  }

  /**
   * Close the overlay
   */
  close() {
    if (!this.overlay) return;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.overlay.classList.remove('visible');
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = null;
      this.currentGame = null;
    }, 300);
  }
}

// Global instance
window.bettingOddsTracker = new BettingOddsTracker();
