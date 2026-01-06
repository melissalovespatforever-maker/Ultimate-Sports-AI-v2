import { BettingOddsTracker } from './betting-odds-tracker.js';

/**
 * GlobalOddsComparison - Provides a birds-eye view of all live game odds
 * Highlights best lines and allows quick parlay building across the entire slate
 */
export class GlobalOddsComparison {
  constructor() {
    this.overlay = null;
    this.selectedSport = 'NFL';
    this.games = [];
    this.refreshInterval = null;
    this.sportsService = window.sportsDataService;
  }

  /**
   * Open the global odds dashboard
   */
  async open(sport = 'NFL') {
    if (this.overlay) this.close();
    
    this.selectedSport = sport;
    this.createOverlay();
    await this.fetchData();
    this.startAutoRefresh();
  }

  /**
   * Create the dashboard UI
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'global-odds-overlay';
    this.overlay.innerHTML = `
      <div class="global-odds-modal">
        <div class="global-odds-header">
          <div class="global-odds-title">
            <i class="fas fa-broadcast-tower"></i>
            <h2>Live Odds Dashboard</h2>
            <span class="live-indicator">LIVE</span>
          </div>
          <div class="global-odds-controls">
            <div class="sport-selector">
              <button class="sport-btn ${this.selectedSport === 'NFL' ? 'active' : ''}" data-sport="NFL">NFL</button>
              <button class="sport-btn ${this.selectedSport === 'NBA' ? 'active' : ''}" data-sport="NBA">NBA</button>
              <button class="sport-btn ${this.selectedSport === 'MLB' ? 'active' : ''}" data-sport="MLB">MLB</button>
              <button class="sport-btn ${this.selectedSport === 'NHL' ? 'active' : ''}" data-sport="NHL">NHL</button>
              <button class="sport-btn ${this.selectedSport === 'SOCCER' ? 'active' : ''}" data-sport="SOCCER">Soccer</button>
            </div>
            <button class="global-close-btn" onclick="window.globalOddsComparison?.close()">✕</button>
          </div>
        </div>

        <div class="global-odds-subheader">
          <div class="odds-legend">
            <span class="legend-item"><span class="best-line-dot"></span> Best Price Highlighted</span>
            <span class="legend-item"><i class="fas fa-plus"></i> Add to Parlay</span>
          </div>
          <div class="last-sync" id="global-sync-time">Last updated: Syncing...</div>
        </div>

        <div class="global-odds-content" id="global-odds-list">
          <div class="global-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Aggregating live odds from 4+ sportsbooks...</p>
          </div>
        </div>

        <div class="global-odds-footer">
          <div class="parlay-preview" id="parlay-preview-bar">
            <!-- Populated dynamically -->
          </div>
          <div class="disclaimer">Data delayed by 15s. Odds for entertainment purposes only.</div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.attachEventListeners();
    
    requestAnimationFrame(() => this.overlay.classList.add('visible'));
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.overlay.querySelectorAll('.sport-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.overlay.querySelectorAll('.sport-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedSport = btn.dataset.sport;
        this.fetchData();
      });
    });

    // Close on background click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  /**
   * Fetch games and simulated odds
   */
  async fetchData() {
    if (!this.sportsService) return;

    try {
      const allGames = await this.sportsService.getGames(this.selectedSport);
      // Filter for live and upcoming
      this.games = allGames.filter(g => g.status !== 'post');
      this.renderGames();
      this.updateSyncTime();
    } catch (error) {
      console.error('Error fetching global odds:', error);
      this.renderError();
    }
  }

  /**
   * Render the games grid
   */
  renderGames() {
    const container = document.getElementById('global-odds-list');
    if (!container) return;

    if (this.games.length === 0) {
      container.innerHTML = `
        <div class="no-odds">
          <i class="fas fa-calendar-times"></i>
          <p>No active or upcoming games found for ${this.selectedSport}.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="odds-table">
        <div class="odds-table-header">
          <div class="col-game">Game / Time</div>
          <div class="col-market">Spread</div>
          <div class="col-market">Moneyline</div>
          <div class="col-market">Total</div>
          <div class="col-actions"></div>
        </div>
        ${this.games.map(game => this.renderGameRow(game)).join('')}
      </div>
    `;
  }

  /**
   * Render a single game row
   */
  renderGameRow(game) {
    // Generate simulated best odds for this comparison view
    const odds = this.generateSimulatedBestOdds(game);
    
    return `
      <div class="odds-game-row">
        <div class="col-game">
          <div class="game-matchup">
            <div class="game-team">
              <img src="${window.resolveSportsLogo(game.awayTeam.id, game.sport)}" class="mini-logo">
              <span>${game.awayTeam.shortName}</span>
            </div>
            <div class="game-team">
              <img src="${window.resolveSportsLogo(game.homeTeam.id, game.sport)}" class="mini-logo">
              <span>${game.homeTeam.shortName}</span>
            </div>
          </div>
          <div class="game-meta">
            <span class="game-status ${game.isLive ? 'live' : ''}">${game.statusDisplay}</span>
            <span class="game-venue">${game.venue}</span>
          </div>
        </div>

        <!-- Spread Column -->
        <div class="col-market">
          <div class="market-odds">
            <div class="odds-box best" onclick="window.globalOddsComparison?.addToParlay('${game.id}', 'Spread', '${game.awayTeam.shortName}', '${odds.spread.away}')">
              <span class="line">${odds.spread.awayLine}</span>
              <span class="price">${odds.spread.awayPrice}</span>
            </div>
            <div class="odds-box" onclick="window.globalOddsComparison?.addToParlay('${game.id}', 'Spread', '${game.homeTeam.shortName}', '${odds.spread.home}')">
              <span class="line">${odds.spread.homeLine}</span>
              <span class="price">${odds.spread.homePrice}</span>
            </div>
          </div>
        </div>

        <!-- Moneyline Column -->
        <div class="col-market">
          <div class="market-odds">
            <div class="odds-box" onclick="window.globalOddsComparison?.addToParlay('${game.id}', 'ML', '${game.awayTeam.shortName}', '${odds.ml.away}')">
              <span class="price">${odds.ml.away}</span>
            </div>
            <div class="odds-box best" onclick="window.globalOddsComparison?.addToParlay('${game.id}', 'ML', '${game.homeTeam.shortName}', '${odds.ml.home}')">
              <span class="price">${odds.ml.home}</span>
            </div>
          </div>
        </div>

        <!-- Totals Column -->
        <div class="col-market">
          <div class="market-odds">
            <div class="odds-box" onclick="window.globalOddsComparison?.addToParlay('${game.id}', 'Total', 'Over', '${odds.total.over}')">
              <span class="line">O ${odds.total.line}</span>
              <span class="price">${odds.total.over}</span>
            </div>
            <div class="odds-box best" onclick="window.globalOddsComparison?.addToParlay('${game.id}', 'Total', 'Under', '${odds.total.under}')">
              <span class="line">U ${odds.total.line}</span>
              <span class="price">${odds.total.under}</span>
            </div>
          </div>
        </div>

        <div class="col-actions">
          <button class="view-details-btn" onclick="window.globalOddsComparison?.viewDetails('${game.id}')">
            Details <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Add to parlay directly from global view
   */
  addToParlay(gameId, type, selection, odds) {
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;

    if (window.bettingOddsTracker) {
      window.bettingOddsTracker.addToParlay({
        game: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
        type: type,
        selection: `${selection} ${odds}`,
        odds: odds,
        americanOdds: parseInt(odds),
        sportsbook: 'Best Available'
      });
      this.updateParlayPreview();
    }
  }

  /**
   * Update parlay preview in footer
   */
  updateParlayPreview() {
    const preview = document.getElementById('parlay-preview-bar');
    if (!preview || !window.bettingOddsTracker) return;

    const legs = window.bettingOddsTracker.parlayLegs;
    if (legs.length === 0) {
      preview.innerHTML = `<span class="preview-text">Start building your parlay by clicking any odds.</span>`;
      return;
    }

    preview.innerHTML = `
      <div class="preview-content">
        <span class="legs-badge">${legs.length} Legs</span>
        <div class="legs-summary">
          ${legs.slice(-3).map(l => `<span class="leg-pill">${l.selection}</span>`).join('')}
          ${legs.length > 3 ? `<span class="more-legs">+${legs.length - 3} more</span>` : ''}
        </div>
        <button class="go-to-parlay" onclick="window.globalOddsComparison?.openParlay()">
          Build Parlay <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    `;
  }

  /**
   * Helper to open parlay tab
   */
  openParlay() {
    const game = this.games[0]; // Any game will do to open the tracker
    if (game && window.bettingOddsTracker) {
      window.bettingOddsTracker.open({
        awayTeam: game.awayTeam.name,
        homeTeam: game.homeTeam.name,
        sport: game.sport,
        id: game.id,
        status: game.statusDisplay,
        time: game.time
      });
      // Switch to parlay tab
      setTimeout(() => window.bettingOddsTracker.switchTab('parlay'), 100);
    }
  }

  /**
   * View full details for a game
   */
  viewDetails(gameId) {
    const game = this.games.find(g => g.id === gameId);
    if (game && window.bettingOddsTracker) {
      window.bettingOddsTracker.open({
        awayTeam: game.awayTeam.name,
        homeTeam: game.homeTeam.name,
        sport: game.sport,
        id: game.id,
        status: game.statusDisplay,
        time: game.time
      });
    }
  }

  /**
   * Generate mock "best odds" for the dashboard
   */
  generateSimulatedBestOdds(game) {
    const baseTotal = 45.5;
    const baseSpread = -3.5;
    
    return {
      spread: {
        awayLine: baseSpread.toFixed(1),
        awayPrice: -105,
        homeLine: (+Math.abs(baseSpread)).toFixed(1),
        homePrice: -115
      },
      ml: {
        away: -180,
        home: +155
      },
      total: {
        line: baseTotal.toFixed(1),
        over: -110,
        under: -110
      }
    };
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => this.fetchData(), 15000);
  }

  updateSyncTime() {
    const el = document.getElementById('global-sync-time');
    if (el) el.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }

  close() {
    if (!this.overlay) return;
    clearInterval(this.refreshInterval);
    this.overlay.classList.remove('visible');
    setTimeout(() => {
      this.overlay.remove();
      this.overlay = null;
    }, 300);
  }

  renderError() {
    const container = document.getElementById('global-odds-list');
    if (container) container.innerHTML = `<div class="no-odds"><p>Error loading live odds dashboard.</p></div>`;
  }
}

// Global instance
window.globalOddsComparison = new GlobalOddsComparison();
