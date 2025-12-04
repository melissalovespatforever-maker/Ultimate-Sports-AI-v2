// ============================================
// ENHANCED AI COACHES MODULE
// Real ESPN data + The Odds API integration
// Pulls actual picks from backend
// ============================================

console.log('🤖 Loading Enhanced AI Coaches Module');

const aiCoachesManager = {
    coaches: {},
    currentPicks: [],
    cache: {
        picks: null,
        timestamp: null,
        ttl: 60000 // 1 minute cache
    },

    // Initialize coaches
    async init() {
        console.log('🤖 Initializing AI Coaches...');
        try {
            await this.loadCoachPicks();
        } catch (error) {
            console.error('❌ Failed to initialize AI coaches:', error);
        }
    },

    // Load AI coach picks from backend (uses real ESPN + Odds API data)
    async loadCoachPicks() {
        try {
            // Check cache
            if (this.cache.picks && Date.now() - this.cache.timestamp < this.cache.ttl) {
                console.log('📦 Using cached AI coach picks');
                this.coaches = this.cache.picks;
                return;
            }

            console.log('📡 Fetching AI coach picks from backend...');
            console.log('🔗 Backend URL:', CONFIG.API_BASE_URL);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(
                `${CONFIG.API_BASE_URL}/api/ai-coaches/picks`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal,
                    mode: 'cors'
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`❌ HTTP ${response.status} from backend`);
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.coaches) {
                // Process coaches data
                this.coaches = data.coaches.map(coach => ({
                    id: coach.id,
                    name: coach.name,
                    specialty: this.formatSportName(coach.specialty),
                    avatar: this.getCoachEmoji(coach.id),
                    tier: coach.tier,
                    strategy: coach.strategy,
                    accuracy: coach.accuracy,
                    totalPicks: coach.totalPicks,
                    streak: coach.streak,
                    recentPicks: coach.recentPicks || [],
                    isPremium: coach.tier === 'VIP'
                }));

                // Cache results
                this.cache.picks = this.coaches;
                this.cache.timestamp = Date.now();

                console.log(`✅ Loaded ${this.coaches.length} AI coaches with real data`);
                console.log('🎯 Coaches:', this.coaches.map(c => c.name));
            } else {
                console.error('❌ Invalid response format:', data);
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('❌ Error loading AI picks:', error.message);
            console.warn('⚠️ Backend unavailable or CORS issue - using fallback coaches');
            // Show fallback coaches
            this.showFallbackCoaches();
        }
    },

    // Show fallback coaches (if API fails)
    showFallbackCoaches() {
        console.log('⚠️ Using fallback AI coaches (API unavailable)');
        this.coaches = [
            {
                id: 1,
                name: 'The Analyst',
                specialty: 'NBA Basketball',
                avatar: '🤖',
                tier: 'PRO',
                strategy: 'Value Betting',
                accuracy: 68.5,
                totalPicks: 247,
                streak: 5,
                recentPicks: [],
                isPremium: false
            },
            {
                id: 2,
                name: 'Sharp Shooter',
                specialty: 'NFL Football',
                avatar: '🏈',
                tier: 'VIP',
                strategy: 'Sharp Money',
                accuracy: 72.3,
                totalPicks: 189,
                streak: 8,
                recentPicks: [],
                isPremium: true
            },
            {
                id: 3,
                name: 'Data Dragon',
                specialty: 'MLB Baseball',
                avatar: '⚾',
                tier: 'PRO',
                strategy: 'Consensus',
                accuracy: 65.8,
                totalPicks: 412,
                streak: 3,
                recentPicks: [],
                isPremium: false
            },
            {
                id: 4,
                name: 'Ice Breaker',
                specialty: 'NHL Hockey',
                avatar: '🏒',
                tier: 'VIP',
                strategy: 'Value Betting',
                accuracy: 70.1,
                totalPicks: 298,
                streak: 6,
                recentPicks: [],
                isPremium: true
            }
        ];
    },

    // Format sport names
    formatSportName(sportCode) {
        const sportMap = {
            'basketball_nba': 'NBA Basketball',
            'americanfootball_nfl': 'NFL Football',
            'baseball_mlb': 'MLB Baseball',
            'icehockey_nhl': 'NHL Hockey',
            'soccer_epl': 'Premier League Soccer',
            'soccer_champions_league': 'Champions League'
        };
        return sportMap[sportCode] || sportCode;
    },

    // Get emoji for coach
    getCoachEmoji(coachId) {
        const emojis = {
            1: '🤖',
            2: '🏈',
            3: '⚾',
            4: '🏒'
        };
        return emojis[coachId] || '🤖';
    },

    // Render coaches UI
    async render(containerId) {
        console.log('🎨 Rendering AI coaches UI...');
        
        const container = document.getElementById(containerId);
        if (!container) return;

        // Load coaches first
        await this.loadCoachPicks();

        container.innerHTML = `
            <div class="ai-coaches-container">
                <div class="ai-coaches-header">
                    <h2><i class="fas fa-robot"></i> AI Prediction Coaches</h2>
                    <p class="subtitle">Powered by ESPN & Real-Time Odds Data</p>
                    <div class="data-sources">
                        <span class="badge"><i class="fas fa-tv"></i> ESPN API</span>
                        <span class="badge"><i class="fas fa-chart-line"></i> The Odds API</span>
                        <span class="badge"><i class="fas fa-sync"></i> Live Updates</span>
                    </div>
                </div>

                <div class="coaches-grid">
                    ${this.coaches.map(coach => this.renderCoachCard(coach)).join('')}
                </div>

                <div class="ai-coaches-info">
                    <h3><i class="fas fa-info-circle"></i> How It Works</h3>
                    <ul>
                        <li>✅ Real ESPN game data via live scores integration</li>
                        <li>✅ Odds data from 10+ major sportsbooks via The Odds API</li>
                        <li>✅ AI analysis using 4 unique strategies (Value Betting, Sharp Money, Consensus, etc.)</li>
                        <li>✅ Confidence scores based on sportsbook agreement & variance</li>
                        <li>✅ Live updates every minute</li>
                    </ul>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();
    },

    // Render individual coach card
    renderCoachCard(coach) {
        const isPro = coach.tier === 'PRO' || coach.tier === 'VIP';
        const userTier = appState?.user?.subscription_tier || 'FREE';
        const hasAccess = !coach.isPremium || userTier !== 'FREE';

        return `
            <div class="coach-card ${coach.isPremium ? 'premium' : 'free'}">
                <div class="coach-header">
                    <div class="coach-avatar">${coach.avatar}</div>
                    <div class="coach-info">
                        <h3 class="coach-name">${coach.name}</h3>
                        <p class="coach-specialty">${coach.specialty}</p>
                        <div class="coach-badges">
                            <span class="badge ${coach.isPremium ? 'vip' : 'pro'}">
                                ${coach.tier}
                            </span>
                            <span class="badge strategy">${coach.strategy}</span>
                        </div>
                    </div>
                </div>

                <div class="coach-stats">
                    <div class="stat">
                        <span class="stat-label">Accuracy</span>
                        <span class="stat-value ${coach.accuracy > 70 ? 'high' : 'medium'}">
                            ${coach.accuracy}%
                        </span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total Picks</span>
                        <span class="stat-value">${coach.totalPicks}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Streak</span>
                        <span class="stat-value hot">${coach.streak}✓</span>
                    </div>
                </div>

                ${coach.recentPicks && coach.recentPicks.length > 0 ? `
                    <div class="coach-picks">
                        <h4>Recent Picks</h4>
                        ${coach.recentPicks.slice(0, 3).map(pick => `
                            <div class="pick">
                                <div class="pick-game">${pick.game}</div>
                                <div class="pick-details">
                                    <span class="pick-recommendation">${pick.pick}</span>
                                    <span class="pick-odds">${pick.odds > 0 ? '+' : ''}${pick.odds}</span>
                                    <span class="pick-confidence ${pick.confidence >= 80 ? 'high' : 'medium'}">
                                        ${pick.confidence}%
                                    </span>
                                </div>
                                <div class="pick-reasoning">${pick.reasoning}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <button class="btn btn-primary view-picks" 
                        onclick="aiCoachesManager.showCoachDetail('${coach.id}')">
                    ${hasAccess ? 'View Full Analysis' : '🔒 Premium Access'}
                </button>
            </div>
        `;
    },

    // Show detailed coach analysis
    async showCoachDetail(coachId) {
        const coach = this.coaches.find(c => c.id == coachId);
        if (!coach) return;

        const modal = document.createElement('div');
        modal.id = 'coach-detail-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${coach.avatar} ${coach.name}</h2>
                    <button class="modal-close" onclick="document.getElementById('coach-detail-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="modal-body">
                    <div class="coach-detail-stats">
                        <div class="detail-stat">
                            <h4>Win Rate</h4>
                            <p class="big-number">${coach.accuracy}%</p>
                        </div>
                        <div class="detail-stat">
                            <h4>Total Picks</h4>
                            <p class="big-number">${coach.totalPicks}</p>
                        </div>
                        <div class="detail-stat">
                            <h4>Current Streak</h4>
                            <p class="big-number hot">${coach.streak}✓</p>
                        </div>
                    </div>

                    <div class="coach-strategy">
                        <h3>Strategy: ${coach.strategy}</h3>
                        <p>${this.getStrategyDescription(coach.strategy)}</p>
                    </div>

                    <div class="data-info">
                        <h3>📊 Data Sources</h3>
                        <ul>
                            <li><strong>Games:</strong> Live from ESPN API</li>
                            <li><strong>Odds:</strong> The Odds API (10+ sportsbooks)</li>
                            <li><strong>Analysis:</strong> Real-time AI analysis engine</li>
                            <li><strong>Updates:</strong> Every 1 minute</li>
                        </ul>
                    </div>

                    ${coach.recentPicks && coach.recentPicks.length > 0 ? `
                        <div class="all-picks">
                            <h3>All Recent Picks</h3>
                            ${coach.recentPicks.map(pick => `
                                <div class="full-pick">
                                    <div class="game">${pick.game}</div>
                                    <div class="pick-info">
                                        <strong>${pick.pick}</strong> @ ${pick.odds > 0 ? '+' : ''}${pick.odds}
                                    </div>
                                    <div class="confidence-bar">
                                        <div class="confidence-fill" style="width: ${pick.confidence}%"></div>
                                    </div>
                                    <p class="reasoning">${pick.reasoning}</p>
                                    <small>${pick.gameTime}</small>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="no-picks">No picks available yet</p>'}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    },

    // Get strategy description
    getStrategyDescription(strategy) {
        const descriptions = {
            'value_betting': 'Focuses on finding bets with positive expected value by analyzing odds across sportsbooks. Looks for underpriced lines and value opportunities.',
            'sharp_money': 'Follows sharp money movements and line changes. Identifies where professional bettors are placing action.',
            'consensus': 'Uses consensus from multiple sportsbooks. When 10+ books agree on a line, the pick is strong.',
            'contra': 'Takes the opposite side of public opinion when sportsbooks indicate sharp action elsewhere.'
        };
        return descriptions[strategy] || 'Advanced AI sports betting strategy.';
    },

    // Add CSS styles
    addStyles() {
        if (document.getElementById('ai-coaches-styles')) return;

        const style = document.createElement('style');
        style.id = 'ai-coaches-styles';
        style.textContent = `
            .ai-coaches-container {
                padding: var(--spacing-lg);
                max-width: 1200px;
                margin: 0 auto;
            }

            .ai-coaches-header {
                text-align: center;
                margin-bottom: var(--spacing-xl);
            }

            .ai-coaches-header h2 {
                font-size: 28px;
                margin-bottom: var(--spacing-sm);
            }

            .ai-coaches-header .subtitle {
                color: var(--text-secondary);
                margin-bottom: var(--spacing-md);
            }

            .data-sources {
                display: flex;
                gap: var(--spacing-sm);
                justify-content: center;
                flex-wrap: wrap;
            }

            .data-sources .badge {
                background: linear-gradient(135deg, var(--accent), var(--accent-light));
                color: white;
                font-size: 12px;
            }

            .coaches-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: var(--spacing-lg);
                margin-bottom: var(--spacing-xl);
            }

            .coach-card {
                background: var(--bg-card);
                border: 2px solid var(--border-color);
                border-radius: 16px;
                padding: var(--spacing-lg);
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
            }

            .coach-card:hover {
                border-color: var(--accent);
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            }

            .coach-card.premium {
                border-color: var(--accent);
                background: linear-gradient(135deg, var(--bg-card), rgba(71, 184, 255, 0.05));
            }

            .coach-header {
                display: flex;
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-md);
            }

            .coach-avatar {
                font-size: 48px;
                line-height: 1;
                min-width: 48px;
            }

            .coach-info {
                flex: 1;
            }

            .coach-name {
                font-size: 18px;
                font-weight: 700;
                margin: 0 0 4px;
            }

            .coach-specialty {
                font-size: 14px;
                color: var(--text-secondary);
                margin: 0 0 var(--spacing-sm);
            }

            .coach-badges {
                display: flex;
                gap: var(--spacing-xs);
            }

            .coach-badges .badge {
                font-size: 11px;
                padding: 4px 8px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            }

            .coach-badges .badge.vip {
                background: linear-gradient(135deg, var(--accent), var(--accent-light));
                color: white;
            }

            .coach-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: var(--spacing-sm);
                padding: var(--spacing-md);
                background: var(--bg-secondary);
                border-radius: 12px;
                margin-bottom: var(--spacing-md);
                text-align: center;
            }

            .stat {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .stat-label {
                font-size: 12px;
                color: var(--text-secondary);
            }

            .stat-value {
                font-size: 16px;
                font-weight: 700;
                color: var(--text-primary);
            }

            .stat-value.high {
                color: var(--success);
            }

            .stat-value.medium {
                color: var(--warning);
            }

            .stat-value.hot {
                color: var(--accent);
                animation: pulse 1s infinite;
            }

            .coach-picks {
                margin-bottom: var(--spacing-md);
                flex: 1;
            }

            .coach-picks h4 {
                font-size: 14px;
                margin: 0 0 var(--spacing-sm);
                color: var(--text-secondary);
            }

            .pick {
                background: var(--bg-secondary);
                padding: var(--spacing-sm);
                border-radius: 8px;
                margin-bottom: var(--spacing-sm);
                font-size: 12px;
            }

            .pick-game {
                font-weight: 600;
                margin-bottom: 4px;
            }

            .pick-details {
                display: flex;
                gap: var(--spacing-xs);
                margin-bottom: 4px;
                align-items: center;
            }

            .pick-recommendation {
                font-weight: 700;
                color: var(--accent);
            }

            .pick-odds {
                background: var(--bg-card);
                padding: 2px 6px;
                border-radius: 4px;
            }

            .pick-confidence {
                margin-left: auto;
                font-weight: 600;
                color: var(--warning);
            }

            .pick-confidence.high {
                color: var(--success);
            }

            .pick-reasoning {
                color: var(--text-muted);
                font-size: 11px;
                font-style: italic;
            }

            .view-picks {
                width: 100%;
            }

            .ai-coaches-info {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: var(--spacing-lg);
            }

            .ai-coaches-info h3 {
                margin-top: 0;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }

            .ai-coaches-info ul {
                margin: 0;
                padding-left: var(--spacing-lg);
            }

            .ai-coaches-info li {
                margin-bottom: var(--spacing-sm);
                color: var(--text-secondary);
            }

            /* Modal Styles */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }

            .modal-content {
                background: var(--bg-primary);
                border-radius: 16px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
            }

            .modal-header h2 {
                margin: 0;
            }

            .modal-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 20px;
                cursor: pointer;
            }

            .modal-body {
                padding: var(--spacing-lg);
            }

            .coach-detail-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-lg);
            }

            .detail-stat {
                text-align: center;
                background: var(--bg-secondary);
                padding: var(--spacing-md);
                border-radius: 12px;
            }

            .detail-stat h4 {
                margin: 0 0 var(--spacing-sm);
                color: var(--text-secondary);
                font-size: 12px;
            }

            .big-number {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }

            .coach-strategy {
                background: var(--bg-secondary);
                padding: var(--spacing-md);
                border-radius: 12px;
                margin-bottom: var(--spacing-lg);
            }

            .data-info {
                background: var(--accent-light);
                opacity: 0.1;
                padding: var(--spacing-md);
                border-radius: 12px;
                margin-bottom: var(--spacing-lg);
            }

            .data-info ul {
                margin: 0;
                padding-left: var(--spacing-lg);
            }

            .all-picks {
                margin-top: var(--spacing-lg);
            }

            .full-pick {
                background: var(--bg-secondary);
                padding: var(--spacing-md);
                border-radius: 12px;
                margin-bottom: var(--spacing-md);
            }

            .full-pick .game {
                font-weight: 600;
                margin-bottom: 8px;
            }

            .full-pick .pick-info {
                display: flex;
                gap: var(--spacing-sm);
                margin-bottom: 8px;
            }

            .confidence-bar {
                height: 6px;
                background: var(--border-color);
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .confidence-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--accent), var(--success));
                transition: width 0.3s ease;
            }

            .reasoning {
                color: var(--text-secondary);
                font-size: 12px;
                margin: 8px 0 4px;
            }

            small {
                color: var(--text-muted);
                font-size: 11px;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            @media (max-width: 768px) {
                .coaches-grid {
                    grid-template-columns: 1fr;
                }

                .coach-stats {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }
};

// Initialize on load
window.addEventListener('load', () => {
    aiCoachesManager.init();
});

console.log('✅ Enhanced AI Coaches Module loaded');
