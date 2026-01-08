// ================================
// AI COACHES SYSTEM - ESPN INTEGRATED PROFESSIONAL VERSION
// Complete rebuild with real ESPN data, hiring system, ranks, and intelligence
// ================================

const AI_COACHES_CONFIG = {
    API_BASE: window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app',
    REFRESH_INTERVAL: 300000, // 5 minutes
};

// Coach ranks with visual indicators
const COACH_RANKS = {
    LEGEND: { name: 'Legend', icon: '👑', color: '#FFD700', minWinRate: 85 },
    MASTER: { name: 'Master', icon: '💎', color: '#00D9FF', minWinRate: 75 },
    EXPERT: { name: 'Expert', icon: '⭐', color: '#9B59B6', minWinRate: 65 },
    PRO: { name: 'Pro', icon: '🔥', color: '#E74C3C', minWinRate: 55 },
    RISING: { name: 'Rising Star', icon: '🌟', color: '#F39C12', minWinRate: 0 }
};

// Complete coach roster with base values
const AI_COACHES_ROSTER = [
    {
        id: 'the-analyst',
        name: 'The Analyst',
        avatar: 'https://rosebud.ai/assets/the-analyst-coach.png.webp?rRh9',
        specialty: 'MIXED',
        sports: ['NFL', 'NBA', 'MLB', 'NHL', 'SOCCER'],
        description: 'Data-driven predictions using advanced statistical models and machine learning',
        style: 'Statistical Analysis',
        baseHireCost: 10000,
        hirePeriods: [3, 7, 14, 30],
        requiresSubscription: null,
        aiModel: 'advanced-statistics'
    },
    {
        id: 'nfl-mastermind',
        name: 'NFL Mastermind',
        avatar: 'https://rosebud.ai/assets/NFL coach.webp?nRJK',
        specialty: 'NFL',
        sports: ['NFL'],
        description: 'Specialist in NFL predictions with deep understanding of team dynamics and matchups',
        style: 'Matchup Analysis',
        baseHireCost: 10000,
        hirePeriods: [3, 7, 14, 30],
        requiresSubscription: 'PRO',
        aiModel: 'nfl-specialist'
    },
    {
        id: 'nba-guru',
        name: 'NBA Guru',
        avatar: 'https://rosebud.ai/assets/Nba coach.webp?O8Jk',
        specialty: 'NBA',
        sports: ['NBA'],
        description: 'Basketball expert focusing on player performance, pace, and scoring trends',
        style: 'Player Performance',
        baseHireCost: 10000,
        hirePeriods: [3, 7, 14, 30],
        requiresSubscription: 'PRO',
        aiModel: 'nba-specialist'
    },
    {
        id: 'mlb-strategist',
        name: 'MLB Strategist',
        avatar: 'https://rosebud.ai/assets/MLB coach.webp?zfFQ',
        specialty: 'MLB',
        sports: ['MLB'],
        description: 'Baseball analytics expert specializing in pitcher vs batter matchups and weather factors',
        style: 'Situational Strategy',
        baseHireCost: 10000,
        hirePeriods: [3, 7, 14, 30],
        requiresSubscription: null,
        aiModel: 'mlb-specialist'
    },
    {
        id: 'soccer-tactician',
        name: 'Soccer Tactician',
        avatar: 'https://rosebud.ai/assets/Soccer coach.webp?TgRO',
        specialty: 'SOCCER',
        sports: ['SOCCER'],
        description: 'Global football expert covering major leagues with tactical formation analysis',
        style: 'Tactical Formation',
        baseHireCost: 10000,
        hirePeriods: [3, 7, 14, 30],
        requiresSubscription: null,
        aiModel: 'soccer-specialist'
    },
    {
        id: 'nhl-ice-breaker',
        name: 'NHL Ice Breaker',
        avatar: 'https://rosebud.ai/assets/NHL coach.webp?frve',
        specialty: 'NHL',
        sports: ['NHL'],
        description: 'Hockey specialist analyzing goalie performance, special teams, and momentum',
        style: 'Momentum Analysis',
        baseHireCost: 10000,
        hirePeriods: [3, 7, 14, 30],
        requiresSubscription: null,
        aiModel: 'nhl-specialist'
    },
    {
        id: 'college-football-coach',
        name: 'College Football Pro',
        avatar: 'https://rosebud.ai/assets/college-football-coach.webp?5oGW',
        specialty: 'NCAAF',
        sports: ['NCAAF'],
        description: 'College football expert with insider knowledge of team rankings and conference dynamics',
        style: 'Conference Expert',
        baseHireCost: 10000,
        hirePeriods: [3, 7, 14, 30],
        requiresSubscription: null,
        aiModel: 'ncaaf-specialist'
    },
    {
        id: 'college-basketball-coach',
        name: 'March Madness Master',
        avatar: 'https://rosebud.ai/assets/college-basketball-coach.webp?cDlx',
        specialty: 'NCAAB',
        sports: ['NCAAB'],
        description: 'College hoops specialist excelling in tournament brackets and upset predictions',
        style: 'Bracket Science',
        baseHireCost: 10000,
        hirePeriods: [3, 7, 14, 30],
        requiresSubscription: null,
        aiModel: 'ncaab-specialist'
    },
    {
        id: 'sharp-shooter',
        name: 'Sharp Shooter',
        avatar: 'https://rosebud.ai/assets/Assistant.png?mwmc',
        specialty: 'MIXED',
        sports: ['NFL', 'NBA', 'MLB'],
        description: 'Aggressive betting strategy focused on high-value odds and line movements',
        style: 'Sharp Action',
        baseHireCost: 15000,
        hirePeriods: [7, 14, 30],
        requiresSubscription: 'PRO',
        aiModel: 'sharp-betting'
    },
    {
        id: 'the-professor',
        name: 'The Professor',
        avatar: 'https://rosebud.ai/assets/Coach Hal.png?hUy7',
        specialty: 'MIXED',
        sports: ['NFL', 'NBA', 'MLB', 'NHL', 'SOCCER', 'NCAAF', 'NCAAB'],
        description: 'Legendary all-sports guru with decades of winning experience and AI-enhanced insights',
        style: 'Historical Patterns',
        baseHireCost: 25000,
        hirePeriods: [7, 14, 30],
        requiresSubscription: 'VIP',
        aiModel: 'master-ai'
    }
];

// ================================
// STATE MANAGEMENT
// ================================

class AICoachesState {
    constructor() {
        this.coaches = [];
        this.hiredCoaches = new Map();
        // REMOVED: this.userCoins - use globalState directly via getter
        // REMOVED: this.userTier - use globalState directly via getter
    }
    
    // LIVE ACCESSORS: Always fetch from GlobalStateManager (no caching)
    get userCoins() {
        return window.globalState ? window.globalState.getBalance() : 10000;
    }
    
    get userTier() {
        const user = window.globalState?.getUser();
        return user?.subscription_tier?.toUpperCase() || 'FREE';
    }

    async init() {
        await this.loadUserData();
        await this.loadHiredCoaches();
        await this.loadCoachesPerformance();
        
        // Subscribe to globalState changes to keep UI in sync
        if (window.globalState) {
            window.globalState.subscribe(() => {
                this.refreshBalanceDisplay();
            });
        }
    }

    async loadUserData() {
        // REMOVED: No longer caches balance locally
        // All balance queries now go through globalState getters above
        console.log('✅ AI Coaches synced with GlobalState (balance:', this.userCoins, ')');
    }
    
    refreshBalanceDisplay() {
        // This will be called when globalState balance changes
        // UI will auto-update via re-render in AICoachesManager
        console.log('💰 Balance updated in AI Coaches:', this.userCoins);
    }

    async loadHiredCoaches() {
        // In a real build, we'd fetch from API
        // For now, we simulate or use local storage for buildless demo
        const saved = localStorage.getItem('hired_coaches');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                data.forEach(hire => {
                    const expires = new Date(hire.expiresAt);
                    if (expires > new Date()) {
                        this.hiredCoaches.set(hire.coachId, {
                            expiresAt: expires,
                            hiredAt: new Date(hire.hiredAt),
                            period: hire.period
                        });
                    }
                });
            } catch (e) {
                console.error('Failed to load hired coaches', e);
            }
        }
    }

    async loadCoachesPerformance() {
        // Simulate real-time performance calculation since we don't have historical DB yet
        // In production, this would fetch from /api/ai-coaches/performance
        
        this.coaches = AI_COACHES_ROSTER.map(coach => {
            // Generate deterministic but dynamic-looking stats based on date
            // This ensures all users see the same "random" stats for the day
            const todaySeed = new Date().getDate();
            const coachSeed = coach.name.length;
            
            // Simulated Stats
            const baseWinRate = 55 + ((todaySeed * coachSeed) % 30); // 55-85%
            const winRate = Math.min(Math.max(baseWinRate, 40), 92); // Clamp
            const currentStreak = ((todaySeed + coachSeed) % 15) - 3; // -3 to +11
            const totalPicks = 100 + ((todaySeed * 5) % 500);
            
            // Calculate Stock Value (Market Value)
            const marketValue = this.calculateMarketValue(coach.baseHireCost, winRate, currentStreak);
            
            // Determine trend
            const trend = winRate > 60 ? 'up' : winRate < 50 ? 'down' : 'stable';

            return {
                ...coach,
                totalPicks: totalPicks,
                winRate: winRate,
                currentStreak: currentStreak,
                bestStreak: Math.max(currentStreak + 2, 8), // Sim
                hireCost: marketValue,
                marketTrend: trend,
                rank: this.calculateRank(winRate)
            };
        });
    }

    calculateMarketValue(baseCost, winRate, streak) {
        // Start with base cost (e.g., 10,000 coins)
        let adjustedCost = baseCost;
        
        // Win Rate Impact: Each 1% above/below 50% changes price by ±2%
        const winRateDeviation = winRate - 50;
        const winRateAdjustment = (winRateDeviation * 0.02); // ±2% per percentage point
        adjustedCost += baseCost * winRateAdjustment;
        
        // Streak Impact: Each win in streak adds +3%, each loss subtracts -3%
        const streakAdjustment = streak * 0.03;
        adjustedCost += baseCost * streakAdjustment;
        
        // Apply bounds: Price can range from 50% to 250% of base cost
        // This means a 10k coach can cost between 5k (terrible) and 25k (elite)
        const minCost = baseCost * 0.5;
        const maxCost = baseCost * 2.5;
        adjustedCost = Math.max(minCost, Math.min(maxCost, adjustedCost));
        
        // Round to nearest 100 for clean pricing
        return Math.round(adjustedCost / 100) * 100;
    }

    calculateRank(winRate) {
        if (winRate >= COACH_RANKS.LEGEND.minWinRate) return COACH_RANKS.LEGEND;
        if (winRate >= COACH_RANKS.MASTER.minWinRate) return COACH_RANKS.MASTER;
        if (winRate >= COACH_RANKS.EXPERT.minWinRate) return COACH_RANKS.EXPERT;
        if (winRate >= COACH_RANKS.PRO.minWinRate) return COACH_RANKS.PRO;
        return COACH_RANKS.RISING;
    }

    isCoachHired(coachId) {
        const hire = this.hiredCoaches.get(coachId);
        if (!hire) return false;
        return new Date() < hire.expiresAt;
    }

    getCoachHireInfo(coachId) {
        return this.hiredCoaches.get(coachId);
    }

    canHireCoach(coach) {
        // Check subscription requirement
        if (coach.requiresSubscription) {
            const tierOrder = { FREE: 0, PRO: 1, VIP: 2 };
            if (tierOrder[this.userTier] < tierOrder[coach.requiresSubscription]) {
                return { can: false, reason: `Requires ${coach.requiresSubscription} subscription` };
            }
        }

        // Check if already hired
        if (this.isCoachHired(coach.id)) {
            return { can: false, reason: 'Already hired' };
        }

        // Check coins
        if (this.userCoins < coach.hireCost) {
            return { can: false, reason: `Need ${coach.hireCost} coins (you have ${this.userCoins})` };
        }

        return { can: true };
    }
    
    hireCoach(coachId, days) {
        const coach = this.coaches.find(c => c.id === coachId);
        if (!coach) return false;
        
        // Check balance (getter always returns live balance from globalState)
        if (this.userCoins < coach.hireCost) {
            console.warn(`Cannot hire ${coach.name}: need ${coach.hireCost}, have ${this.userCoins}`);
            return false;
        }
        
        // Use GlobalStateManager to deduct coins (this will trigger transaction queue)
        if (window.globalState) {
            const result = window.globalState.deductCoins(coach.hireCost, `Hired ${coach.name} for ${days} days`, {
                type: 'coach_hire',
                coachId: coachId,
                coachName: coach.name,
                period: days,
                timestamp: Date.now()
            });
            
            if (result === false) {
                console.error('Failed to deduct coins via GlobalStateManager');
                return false;
            }
            
            // NO LONGER NEEDED: Balance sync happens automatically via getter
        } else {
            console.error('GlobalState not available - cannot process hire');
            return false;
        }
        
        // Add hire
        const expires = new Date();
        expires.setDate(expires.getDate() + days);
        
        const hireData = {
            coachId,
            period: days,
            hiredAt: new Date(),
            expiresAt: expires,
            cost: coach.hireCost
        };
        
        this.hiredCoaches.set(coachId, hireData);
        
        // Persist
        this.saveHires();
        
        console.log(`✅ Coach ${coach.name} hired for ${days} days at ${coach.hireCost} coins`);
        
        return true;
    }
    
    saveHires() {
        const hires = [];
        this.hiredCoaches.forEach((value, key) => {
            hires.push({ ...value, coachId: key });
        });
        localStorage.setItem('hired_coaches', JSON.stringify(hires));
    }
}

// ================================
// AI PREDICTION ENGINE
// ================================

class AIPredictionEngine {
    constructor() {
        this.models = new Map();
        this.initModels();
    }

    initModels() {
        // Each coach has their own AI model with different strategies
        this.models.set('advanced-statistics', {
            factors: ['team_stats', 'recent_form', 'head_to_head', 'injuries'],
            weights: [0.35, 0.30, 0.20, 0.15]
        });

        this.models.set('nfl-specialist', {
            factors: ['matchup_advantage', 'weather', 'division_record', 'rest_days'],
            weights: [0.40, 0.25, 0.20, 0.15]
        });

        this.models.set('nba-specialist', {
            factors: ['pace', 'offensive_rating', 'defensive_rating', 'rest_advantage'],
            weights: [0.30, 0.30, 0.25, 0.15]
        });
        
        this.models.set('mlb-specialist', {
            factors: ['pitching_matchup', 'bullpen_era', 'batter_vs_pitcher', 'park_factors'],
            weights: [0.40, 0.25, 0.20, 0.15]
        });

        this.models.set('sharp-betting', {
            factors: ['line_movement', 'public_betting', 'sharp_money', 'value'],
            weights: [0.40, 0.20, 0.25, 0.15]
        });

        this.models.set('master-ai', {
            factors: ['all_factors', 'historical_patterns', 'situational_trends', 'expert_consensus'],
            weights: [0.30, 0.30, 0.25, 0.15]
        });
    }

    generatePrediction(coach, game) {
        const model = this.models.get(coach.aiModel) || this.models.get('advanced-statistics');
        
        // Calculate confidence based on various factors and coach stats
        // Higher win rate coaches give higher confidence predictions
        const baseConfidence = 50 + (coach.winRate - 50) + (Math.random() * 10); 
        const streakBonus = Math.min(coach.currentStreak * 2, 10);
        const confidence = Math.min(Math.round(baseConfidence + streakBonus), 98);

        // Determine pick logic based on team strength (simplified logic for demo)
        // In full backend, this would run actual ML inference
        // Here we use the Team Record and a "Coach Bias"
        
        let homeScore = 0;
        let awayScore = 0;
        
        // Simple heuristic: Record weighting
        // Parse record "10-5" -> win ratio
        const parseRecord = (rec) => {
            if (!rec || rec === '0-0') return 0.5;
            const [w, l] = rec.split('-').map(Number);
            return w / (w + l || 1);
        };
        
        const homeStrength = parseRecord(game.homeTeam.record);
        const awayStrength = parseRecord(game.awayTeam.record);
        
        // Coach bias: Some favor home teams, some favor underdogs (simulated by random noise)
        const noise = (Math.random() - 0.5) * 0.2; 
        
        const homeProb = homeStrength - awayStrength + 0.05 + noise; // +0.05 home field advantage
        
        const pick = homeProb > 0 ? 'home' : 'away';
        
        // Spread calculation
        const spread = Math.abs(Math.round(homeProb * 20) / 2); 

        return {
            game,
            pick: pick === 'home' ? game.homeTeam.name : game.awayTeam.name,
            pickTeam: pick === 'home' ? game.homeTeam : game.awayTeam,
            pickType: pick,
            confidence,
            spread,
            reasoning: this.generateReasoning(coach, game, model, confidence, pick),
            timestamp: new Date(),
            aiModel: coach.aiModel
        };
    }

    generateReasoning(coach, game, model, confidence, pick) {
        const reasons = [];
        const winningTeam = pick === 'home' ? game.homeTeam.name : game.awayTeam.name;

        // Add model-specific reasoning
        if (model.factors.includes('team_stats')) {
            reasons.push(`${winningTeam} has superior offensive efficiency metrics.`);
        }
        if (model.factors.includes('recent_form')) {
            reasons.push(`Trend analysis shows ${winningTeam} peaking at the right time.`);
        }
        if (model.factors.includes('matchup_advantage')) {
            reasons.push(`Key matchup advantage exploit identified in simulation.`);
        }
        if (model.factors.includes('pitching_matchup')) {
            reasons.push(`Starting pitcher advantage is significant.`);
        }
        if (model.factors.includes('line_movement')) {
            reasons.push(`Sharp money flow detected on this side.`);
        }

        // Add confidence-based reasoning
        if (confidence > 80) {
            reasons.push(`High confidence algorithm lock.`);
        } else if (confidence > 70) {
            reasons.push(`Value play based on current line.`);
        }

        return reasons.slice(0, 3); // Top 3 reasons
    }
}

// ================================
// UI RENDERER
// ================================

class AICoachesUI {
    constructor(state, sportsService, predictionEngine) {
        this.state = state;
        this.sportsService = sportsService;
        this.predictionEngine = predictionEngine;
        this.container = null;
        this.battleSelection = [];
        this.isBattleMode = false;
    }

    async render(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="ai-coaches-pro-container">
                ${this.renderHeader()}
                ${this.renderFilters()}
                <div id="coaches-grid" class="coaches-grid-pro">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;

        await this.loadAndRenderCoaches();
    }

    renderHeader() {
        return `
            <div class="coaches-header-pro">
                <div class="header-content">
                    <h2>🤖 AI Coaches Marketplace</h2>
                    <p>Live Market • Dynamic Pricing based on Performance</p>
                </div>
                <div class="user-stats-header">
                    <!-- Balance display removed - using unified header balance only -->
                    <div class="tier-badge tier-${this.state.userTier.toLowerCase()}">
                        ${this.state.userTier}
                    </div>
                </div>
            </div>
        `;
    }

    renderFilters() {
        return `
            <div class="coaches-filters">
                <button class="filter-btn active" data-filter="all">All Coaches</button>
                <button class="filter-btn" data-filter="hired">My Coaches</button>
                <button class="filter-btn" data-filter="nfl">NFL</button>
                <button class="filter-btn" data-filter="nba">NBA</button>
                <button class="filter-btn" data-filter="mlb">MLB</button>
                <button class="filter-btn" data-filter="mixed">Mixed</button>
                <button class="filter-btn filter-battle" data-filter="battle" style="border: 1px solid #eab308; color: #eab308;">
                    <i class="fas fa-fist-raised"></i> Coach Battle
                </button>
            </div>
        `;
    }

    renderLoadingState() {
        return `
            <div class="loading-coaches">
                <div class="spinner-large"></div>
                <p>Analyzing coach performance and live market data...</p>
            </div>
        `;
    }

    async loadAndRenderCoaches() {
        const grid = document.getElementById('coaches-grid');
        if (!grid) return;

        // Render all coaches
        grid.innerHTML = this.state.coaches.map(coach => this.renderCoachCard(coach)).join('');

        // Attach event listeners
        this.attachEventListeners();
    }

    renderCoachCard(coach) {
        const isHired = this.state.isCoachHired(coach.id);
        const hireInfo = this.state.getCoachHireInfo(coach.id);
        const canHire = this.state.canHireCoach(coach);
        const rank = coach.rank || COACH_RANKS.RISING;
        
        // Market Trend Icon
        let trendIcon = '';
        if (coach.marketTrend === 'up') trendIcon = '<span style="color:#10b981"><i class="fas fa-arrow-up"></i></span>';
        else if (coach.marketTrend === 'down') trendIcon = '<span style="color:#ef4444"><i class="fas fa-arrow-down"></i></span>';
        else trendIcon = '<span style="color:#94a3b8"><i class="fas fa-minus"></i></span>';

        return `
            <div class="coach-card-pro ${isHired ? 'hired' : ''}" data-coach-id="${coach.id}" data-specialty="${coach.specialty.toLowerCase()}">
                ${isHired ? '<div class="hired-badge">✓ HIRED</div>' : ''}
                ${coach.requiresSubscription ? `<div class="subscription-badge">${coach.requiresSubscription}</div>` : ''}
                
                <div class="coach-avatar-container">
                    <img src="${coach.avatar}" alt="${coach.name}" class="coach-avatar-pro">
                    <div class="rank-badge" style="background: ${rank.color};">
                        <span class="rank-icon">${rank.icon}</span>
                        <span class="rank-name">${rank.name}</span>
                    </div>
                </div>

                <div class="coach-info-pro">
                    <h3>${coach.name}</h3>
                    <div class="specialty-tags">
                        ${coach.sports.map(sport => `<span class="sport-tag">${sport}</span>`).join('')}
                    </div>
                    <p class="coach-description">${coach.description}</p>
                    
                    <div class="coach-stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Win Rate</span>
                            <span class="stat-value ${coach.winRate >= 70 ? 'stat-good' : coach.winRate >= 55 ? 'stat-ok' : 'stat-neutral'}">
                                ${coach.winRate.toFixed(1)}%
                            </span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Total Picks</span>
                            <span class="stat-value">${coach.totalPicks}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Streak</span>
                            <span class="stat-value ${coach.currentStreak > 0 ? 'stat-good' : 'stat-neutral'}">
                                ${coach.currentStreak > 0 ? '+' : ''}${coach.currentStreak}
                            </span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Value</span>
                            <span class="stat-value" style="display:flex; align-items:center; gap:4px;">
                                ${trendIcon} ${coach.hireCost}
                            </span>
                        </div>
                    </div>

                    <div class="coach-style">
                        <i class="fas fa-brain"></i> ${coach.style}
                    </div>
                </div>

                <div class="coach-actions">
                    ${this.renderCoachActions(coach, isHired, hireInfo, canHire)}
                </div>
            </div>
        `;
    }

    renderCoachActions(coach, isHired, hireInfo, canHire) {
        if (isHired) {
            const daysLeft = Math.ceil((hireInfo.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
            return `
                <div class="hired-info">
                    <div class="expires-info">
                        <i class="fas fa-clock"></i> ${daysLeft} days remaining
                    </div>
                    <button class="btn-view-picks" data-coach-id="${coach.id}">
                        <i class="fas fa-chart-line"></i> View Upcoming Picks
                    </button>
                </div>
            `;
        }

        if (!canHire.can) {
            return `
                <div class="cannot-hire">
                    <p class="hire-error"><i class="fas fa-lock"></i> ${canHire.reason}</p>
                    ${coach.requiresSubscription && this.state.userTier === 'FREE' ? 
                        `<button class="btn-upgrade" onclick="window.appNavigation.navigateTo('subscription')">
                            <i class="fas fa-crown"></i> Upgrade Now
                        </button>` : 
                        `<button class="btn-disabled" disabled>Cannot Hire</button>`
                    }
                </div>
            `;
        }

        return `
            <div class="hire-options">
                <div class="hire-cost">
                    <img src="https://rosebud.ai/assets/Gold coin with ultimate sports logo in diamonds.png?BD5X" class="coin-icon-small">
                    <span>${coach.hireCost}</span>
                </div>
                <div class="hire-periods">
                    ${coach.hirePeriods.map(days => `
                        <button class="btn-hire-period" data-coach-id="${coach.id}" data-days="${days}">
                            ${days}d
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleFilter(btn));
        });

        // Hire buttons
        document.querySelectorAll('.btn-hire-period').forEach(btn => {
            btn.addEventListener('click', () => this.handleHire(btn));
        });

        // View picks buttons
        document.querySelectorAll('.btn-view-picks').forEach(btn => {
            btn.addEventListener('click', () => this.handleViewPicks(btn));
        });
    }

    handleFilter(btn) {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        
        if (filter === 'battle') {
            this.enterBattleMode();
            return;
        } else {
            this.exitBattleMode();
        }

        const cards = document.querySelectorAll('.coach-card-pro');

        cards.forEach(card => {
            const specialty = card.dataset.specialty;
            const isHired = card.classList.contains('hired');
            const coachId = card.dataset.coachId;
            const coach = this.state.coaches.find(c => c.id === coachId);
            const rank = coach?.rank?.name?.toLowerCase() || '';

            let show = false;

            if (filter === 'all') {
                show = true;
            } else if (filter === 'hired') {
                show = isHired;
            } else if (filter === 'legend') {
                show = rank === 'legend';
            } else {
                show = specialty.includes(filter);
            }

            card.style.display = show ? 'block' : 'none';
        });
    }
    
    // Battle Mode Methods
    enterBattleMode() {
        this.isBattleMode = true;
        this.battleSelection = [];
        
        const grid = document.getElementById('coaches-grid');
        grid.innerHTML = `
            <div class="coach-battle-container">
                <div class="battle-header">
                    <h3>⚔️ AI Model Battle Arena</h3>
                    <p>Select any two coaches to compare their stats head-to-head</p>
                </div>

                <div class="battle-selection-area">
                    <div class="battle-slot empty" id="battle-slot-1" data-slot="0">
                        <span class="placeholder-text">Select Coach 1</span>
                    </div>
                    <div class="battle-vs">VS</div>
                    <div class="battle-slot empty" id="battle-slot-2" data-slot="1">
                        <span class="placeholder-text">Select Coach 2</span>
                    </div>
                </div>

                <div id="battle-results-area"></div>
                
                <div class="battle-controls" style="margin-bottom: 20px;">
                    <p style="color: #64748b; font-size: 14px;">👇 Tap a coach below to select them for battle</p>
                </div>
            </div>
            
            <div class="coaches-grid-battle" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                ${this.state.coaches.map(coach => this.renderCoachCard(coach)).join('')}
            </div>
        `;

        grid.querySelectorAll('.coach-card-pro').forEach(card => {
            card.classList.add('battle-mode');
            card.onclick = (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                this.handleBattleSelection(card.dataset.coachId);
            };
        });
        
        // Disable standard buttons in battle mode to prevent confusion
        grid.querySelectorAll('button').forEach(b => b.style.pointerEvents = 'none');
    }

    exitBattleMode() {
        if (!this.isBattleMode) return;
        this.isBattleMode = false;
        this.battleSelection = [];
        this.loadAndRenderCoaches();
    }
    
    handleBattleSelection(coachId) {
        const coach = this.state.coaches.find(c => c.id === coachId);
        if (!coach) return;

        const existingIndex = this.battleSelection.findIndex(c => c.id === coachId);
        if (existingIndex !== -1) {
            this.battleSelection.splice(existingIndex, 1);
        } else {
            if (this.battleSelection.length < 2) {
                this.battleSelection.push(coach);
            } else {
                this.battleSelection[1] = coach;
            }
        }
        this.updateBattleUI();
    }

    updateBattleUI() {
        [0, 1].forEach(index => {
            const slot = document.getElementById(`battle-slot-${index + 1}`);
            const coach = this.battleSelection[index];
            
            if (coach) {
                slot.className = 'battle-slot active';
                slot.innerHTML = `
                    <button class="remove-btn" onclick="aiCoachesSystem.ui.handleBattleSelection('${coach.id}')" style="pointer-events: auto;">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="${coach.avatar}" alt="${coach.name}">
                    <span>${coach.name}</span>
                `;
            } else {
                slot.className = 'battle-slot empty';
                slot.innerHTML = `<span class="placeholder-text">Select Coach ${index + 1}</span>`;
            }
        });

        document.querySelectorAll('.coach-card-pro').forEach(card => {
            const id = card.dataset.coachId;
            if (this.battleSelection.find(c => c.id === id)) {
                card.classList.add('battle-selected');
            } else {
                card.classList.remove('battle-selected');
            }
        });

        const resultsArea = document.getElementById('battle-results-area');
        if (this.battleSelection.length === 2) {
            resultsArea.innerHTML = this.renderBattleArena(this.battleSelection[0], this.battleSelection[1]);
        } else {
            resultsArea.innerHTML = '';
        }
    }

    renderBattleArena(c1, c2) {
        const stats = [
            { label: 'Win Rate', v1: c1.winRate, v2: c2.winRate, suffix: '%' },
            { label: 'Total Picks', v1: c1.totalPicks, v2: c2.totalPicks, suffix: '' },
            { label: 'Current Streak', v1: c1.currentStreak, v2: c2.currentStreak, suffix: '' },
            { label: 'Hire Cost (Value)', v1: c1.hireCost, v2: c2.hireCost, suffix: ' 🟡', inverse: true }
        ];

        let c1Score = 0;
        let c2Score = 0;

        const rows = stats.map(stat => {
            let w1 = false, w2 = false;
            if (stat.v1 !== stat.v2) {
                if (stat.inverse) {
                    w1 = stat.v1 < stat.v2;
                    w2 = stat.v2 < stat.v1;
                } else {
                    w1 = stat.v1 > stat.v2;
                    w2 = stat.v2 > stat.v1;
                }
            }
            if (w1) c1Score++;
            if (w2) c2Score++;

            return `
                <div class="stat-row">
                    <div class="stat-val left ${w1 ? 'winner' : w2 ? 'loser' : ''}">
                        ${stat.v1.toFixed(stat.label === 'Win Rate' ? 1 : 0)}${stat.suffix}
                        ${w1 ? '<i class="fas fa-check-circle" style="font-size:12px; margin-left:5px;"></i>' : ''}
                    </div>
                    <div class="stat-label-center">${stat.label}</div>
                    <div class="stat-val right ${w2 ? 'winner' : w1 ? 'loser' : ''}">
                        ${stat.v2.toFixed(stat.label === 'Win Rate' ? 1 : 0)}${stat.suffix}
                        ${w2 ? '<i class="fas fa-check-circle" style="font-size:12px; margin-left:5px;"></i>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        let verdict = '';
        if (c1Score > c2Score) {
            verdict = `
                <div class="battle-verdict">
                    <div class="verdict-title">Better Choice</div>
                    <div class="verdict-winner"><i class="fas fa-trophy"></i> ${c1.name}</div>
                    <p style="color:#94a3b8; font-size:13px; margin-top:5px;">Outperforms in ${c1Score} out of ${stats.length} categories</p>
                </div>
            `;
        } else if (c2Score > c1Score) {
            verdict = `
                <div class="battle-verdict">
                    <div class="verdict-title">Better Choice</div>
                    <div class="verdict-winner"><i class="fas fa-trophy"></i> ${c2.name}</div>
                    <p style="color:#94a3b8; font-size:13px; margin-top:5px;">Outperforms in ${c2Score} out of ${stats.length} categories</p>
                </div>
            `;
        } else {
            verdict = `
                <div class="battle-verdict">
                    <div class="verdict-title">Result</div>
                    <div class="verdict-winner">It's a Tie!</div>
                </div>
            `;
        }

        return `<div class="battle-arena">${rows}${verdict}</div>`;
    }
    
    // Battle Mode Methods
    enterBattleMode() {
        this.isBattleMode = true;
        this.battleSelection = [];
        
        const grid = document.getElementById('coaches-grid');
        grid.innerHTML = `
            <div class="coach-battle-container">
                <div class="battle-header">
                    <h3>⚔️ AI Model Battle Arena</h3>
                    <p>Select any two coaches to compare their stats head-to-head</p>
                </div>

                <div class="battle-selection-area">
                    <div class="battle-slot empty" id="battle-slot-1" data-slot="0">
                        <span class="placeholder-text">Select Coach 1</span>
                    </div>
                    <div class="battle-vs">VS</div>
                    <div class="battle-slot empty" id="battle-slot-2" data-slot="1">
                        <span class="placeholder-text">Select Coach 2</span>
                    </div>
                </div>

                <div id="battle-results-area"></div>
                
                <div class="battle-controls" style="margin-bottom: 20px;">
                    <p style="color: #64748b; font-size: 14px;">👇 Tap a coach below to select them for battle</p>
                </div>
            </div>
            
            <div class="coaches-grid-battle" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                ${this.state.coaches.map(coach => this.renderCoachCard(coach)).join('')}
            </div>
        `;

        grid.querySelectorAll('.coach-card-pro').forEach(card => {
            card.classList.add('battle-mode');
            card.onclick = (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                this.handleBattleSelection(card.dataset.coachId);
            };
        });
        
        // Disable standard buttons in battle mode to prevent confusion
        grid.querySelectorAll('button').forEach(b => b.style.pointerEvents = 'none');
    }

    exitBattleMode() {
        if (!this.isBattleMode) return;
        this.isBattleMode = false;
        this.battleSelection = [];
        this.loadAndRenderCoaches();
    }
    
    handleBattleSelection(coachId) {
        const coach = this.state.coaches.find(c => c.id === coachId);
        if (!coach) return;

        const existingIndex = this.battleSelection.findIndex(c => c.id === coachId);
        if (existingIndex !== -1) {
            this.battleSelection.splice(existingIndex, 1);
        } else {
            if (this.battleSelection.length < 2) {
                this.battleSelection.push(coach);
            } else {
                this.battleSelection[1] = coach;
            }
        }
        this.updateBattleUI();
    }

    updateBattleUI() {
        [0, 1].forEach(index => {
            const slot = document.getElementById(`battle-slot-${index + 1}`);
            const coach = this.battleSelection[index];
            
            if (coach) {
                slot.className = 'battle-slot active';
                slot.innerHTML = `
                    <button class="remove-btn" onclick="aiCoachesSystem.ui.handleBattleSelection('${coach.id}')" style="pointer-events: auto;">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="${coach.avatar}" alt="${coach.name}">
                    <span>${coach.name}</span>
                `;
            } else {
                slot.className = 'battle-slot empty';
                slot.innerHTML = `<span class="placeholder-text">Select Coach ${index + 1}</span>`;
            }
        });

        document.querySelectorAll('.coach-card-pro').forEach(card => {
            const id = card.dataset.coachId;
            if (this.battleSelection.find(c => c.id === id)) {
                card.classList.add('battle-selected');
            } else {
                card.classList.remove('battle-selected');
            }
        });

        const resultsArea = document.getElementById('battle-results-area');
        if (this.battleSelection.length === 2) {
            resultsArea.innerHTML = this.renderBattleArena(this.battleSelection[0], this.battleSelection[1]);
        } else {
            resultsArea.innerHTML = '';
        }
    }

    renderBattleArena(c1, c2) {
        const stats = [
            { label: 'Win Rate', v1: c1.winRate, v2: c2.winRate, suffix: '%' },
            { label: 'Total Picks', v1: c1.totalPicks, v2: c2.totalPicks, suffix: '' },
            { label: 'Current Streak', v1: c1.currentStreak, v2: c2.currentStreak, suffix: '' },
            { label: 'Hire Cost (Value)', v1: c1.hireCost, v2: c2.hireCost, suffix: ' 🟡', inverse: true }
        ];

        let c1Score = 0;
        let c2Score = 0;

        const rows = stats.map(stat => {
            let w1 = false, w2 = false;
            if (stat.v1 !== stat.v2) {
                if (stat.inverse) {
                    w1 = stat.v1 < stat.v2;
                    w2 = stat.v2 < stat.v1;
                } else {
                    w1 = stat.v1 > stat.v2;
                    w2 = stat.v2 > stat.v1;
                }
            }
            if (w1) c1Score++;
            if (w2) c2Score++;

            return `
                <div class="stat-row">
                    <div class="stat-val left ${w1 ? 'winner' : w2 ? 'loser' : ''}">
                        ${stat.v1.toFixed(stat.label === 'Win Rate' ? 1 : 0)}${stat.suffix}
                        ${w1 ? '<i class="fas fa-check-circle" style="font-size:12px; margin-left:5px;"></i>' : ''}
                    </div>
                    <div class="stat-label-center">${stat.label}</div>
                    <div class="stat-val right ${w2 ? 'winner' : w1 ? 'loser' : ''}">
                        ${stat.v2.toFixed(stat.label === 'Win Rate' ? 1 : 0)}${stat.suffix}
                        ${w2 ? '<i class="fas fa-check-circle" style="font-size:12px; margin-left:5px;"></i>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        let verdict = '';
        if (c1Score > c2Score) {
            verdict = `
                <div class="battle-verdict">
                    <div class="verdict-title">Better Choice</div>
                    <div class="verdict-winner"><i class="fas fa-trophy"></i> ${c1.name}</div>
                    <p style="color:#94a3b8; font-size:13px; margin-top:5px;">Outperforms in ${c1Score} out of ${stats.length} categories</p>
                </div>
            `;
        } else if (c2Score > c1Score) {
            verdict = `
                <div class="battle-verdict">
                    <div class="verdict-title">Better Choice</div>
                    <div class="verdict-winner"><i class="fas fa-trophy"></i> ${c2.name}</div>
                    <p style="color:#94a3b8; font-size:13px; margin-top:5px;">Outperforms in ${c2Score} out of ${stats.length} categories</p>
                </div>
            `;
        } else {
            verdict = `
                <div class="battle-verdict">
                    <div class="verdict-title">Result</div>
                    <div class="verdict-winner">It's a Tie!</div>
                </div>
            `;
        }

        return `<div class="battle-arena">${rows}${verdict}</div>`;
    }

    async handleHire(btn) {
        const coachId = btn.dataset.coachId;
        const days = parseInt(btn.dataset.days);
        const coach = this.state.coaches.find(c => c.id === coachId);

        if (!coach) return;

        const confirmed = confirm(
            `Hire ${coach.name} for ${days} days?\n\n` +
            `Current Market Cost: ${coach.hireCost} Coins\n` +
            `Your balance: ${this.state.userCoins} coins`
        );

        if (!confirmed) return;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Use state method to hire (simulation for buildless)
        // In real app, call API
        const success = this.state.hireCoach(coachId, days);
        
        if (success) {
            this.showToast(`${coach.name} hired! Contract active.`, 'success');
            // Balance display removed - using header balance only
            await this.loadAndRenderCoaches();
        } else {
            this.showToast('Not enough coins to hire this coach', 'error');
            btn.disabled = false;
            btn.innerHTML = `${days}d`;
        }
    }

    async handleViewPicks(btn) {
        const coachId = btn.dataset.coachId;
        const coach = this.state.coaches.find(c => c.id === coachId);

        if (!coach) return;
        this.showPicksModal(coach);
    }

    async showPicksModal(coach) {
        const modal = document.createElement('div');
        modal.className = 'coach-picks-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content-pro">
                <div class="modal-header">
                    <h2>${coach.name}'s Upcoming Picks</h2>
                    <button class="modal-close" onclick="this.closest('.coach-picks-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="loading-picks">
                        <div class="spinner"></div>
                        <p>Analyzing future ESPN schedule...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        await this.loadCoachPicks(coach, modal);
    }

    async loadCoachPicks(coach, modal) {
        try {
            // Get Upcoming Games from Shared Service
            const upcomingGames = await this.sportsService.getAllUpcomingGames();
            
            // Filter by sport specialty
            const relevantGames = upcomingGames.filter(game => {
                if (coach.specialty === 'MIXED') return true;
                return coach.sports.some(s => s === game.sport.toUpperCase());
            });

            if (relevantGames.length === 0) {
                modal.querySelector('.modal-body').innerHTML = `
                    <div class="no-picks">
                        <i class="fas fa-calendar-times"></i>
                        <p>No upcoming games found for ${coach.specialty}</p>
                        <small>Data from ESPN Schedule</small>
                    </div>
                `;
                return;
            }

            // Generate predictions for top 10 upcoming games
            const predictions = relevantGames
                .slice(0, 10)
                .map(game => this.predictionEngine.generatePrediction(coach, game));

            modal.querySelector('.modal-body').innerHTML = predictions.map(pred => this.renderPrediction(pred)).join('');

        } catch (error) {
            console.error('Error loading picks:', error);
            modal.querySelector('.modal-body').innerHTML = `
                <div class="error-picks">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to analyze schedule</p>
                </div>
            `;
        }
    }

    renderPrediction(pred) {
        const confidenceColor = pred.confidence >= 80 ? '#10b981' : pred.confidence >= 70 ? '#f59e0b' : '#6b7280';

        return `
            <div class="prediction-card">
                <div class="prediction-header">
                    <div class="game-matchup">
                        <div class="team">${pred.game.awayTeam.name}</div>
                        <div class="vs">@</div>
                        <div class="team">${pred.game.homeTeam.name}</div>
                    </div>
                    <div class="game-time">
                        ${this.formatGameTime(pred.game.date)}
                    </div>
                </div>

                <div class="prediction-pick">
                    <div class="pick-label">AI Prediction</div>
                    <div class="pick-team ${pred.pickType}">${pred.pick}</div>
                    <div class="pick-spread">Spread: ${pred.spread > 0 ? '+' : ''}${pred.spread}</div>
                </div>

                <div class="confidence-bar">
                    <div class="confidence-label">Confidence</div>
                    <div class="confidence-track">
                        <div class="confidence-fill" style="width: ${pred.confidence}%; background: ${confidenceColor};"></div>
                    </div>
                    <div class="confidence-value" style="color: ${confidenceColor};">${pred.confidence}%</div>
                </div>

                <div class="prediction-reasoning">
                    <div class="reasoning-title">Analysis:</div>
                    <ul>
                        ${pred.reasoning.map(reason => `<li>${reason}</li>`).join('')}
                    </ul>
                </div>

                <div class="prediction-footer">
                    <span class="ai-model-badge">${pred.aiModel}</span>
                    <span class="prediction-time">Updated: Just now</span>
                </div>
            </div>
        `;
    }

    formatGameTime(date) {
        const now = new Date();
        const gameDate = new Date(date);
        const diffDays = Math.floor((gameDate - now) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today ${gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return `Tomorrow ${gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else {
            return gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute:'2-digit' });
        }
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }
}

// ================================
// INITIALIZATION
// ================================

let aiCoachesSystem = null;

async function initAICoaches() {
    try {
        const state = new AICoachesState();
        await state.init();

        // Use global shared service
        const sportsService = window.sportsDataService;
        if (!sportsService) throw new Error('Sports Data Service not loaded');

        const predictionEngine = new AIPredictionEngine();
        const ui = new AICoachesUI(state, sportsService, predictionEngine);

        await ui.render('ai-coaches-container');

        aiCoachesSystem = { state, sportsService, predictionEngine, ui };

        console.log('✅ AI Coaches System initialized with Unified Sports Data');

    } catch (error) {
        console.error('❌ AI Coaches initialization error:', error);
        const container = document.getElementById('ai-coaches-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h3>System Error</h3>
                    <p>Failed to initialize AI models. Please refresh.</p>
                </div>
            `;
        }
    }
}

// Auto-initialize logic
document.addEventListener('DOMContentLoaded', () => {
    // Only init if we are on the page
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'ai-coaches-page' && mutation.target.classList.contains('active')) {
                if (!aiCoachesSystem) initAICoaches();
            }
        });
    });

    const page = document.getElementById('ai-coaches-page');
    if (page) {
        observer.observe(page, { attributes: true, attributeFilter: ['class'] });
        if (page.classList.contains('active')) initAICoaches();
    }
    
    // Custom event listener
    window.addEventListener('aiCoachesPageLoad', () => {
         if (!aiCoachesSystem) initAICoaches();
    });
});

window.aiCoachesSystem = {
    init: initAICoaches,
    getState: () => aiCoachesSystem?.state
};
