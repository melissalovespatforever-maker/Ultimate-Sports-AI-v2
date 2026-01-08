/**
 * AI Recommendations Widget
 * Personalized pick suggestions based on user history and preferences
 */

class AIRecommendationsWidget {
    constructor() {
        this.recommendations = [];
        this.userPreferences = this.loadUserPreferences();
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        console.log('🤖 Initializing AI Recommendations Widget');
        this.loadUserData();
        this.generateRecommendations();
        this.render();
        
        // Update recommendations every 5 minutes
        setInterval(() => this.updateRecommendations(), 5 * 60 * 1000);
        
        this.initialized = true;
    }

    loadUserPreferences() {
        try {
            const stored = localStorage.getItem('ai_recommendations_preferences');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading preferences:', e);
        }

        // Default preferences
        return {
            favoriteSports: ['nfl', 'nba', 'mlb'],
            riskTolerance: 'medium', // low, medium, high
            betTypes: ['moneyline', 'spread', 'over_under'],
            minConfidence: 60,
            lastUpdated: Date.now()
        };
    }

    saveUserPreferences() {
        try {
            localStorage.setItem('ai_recommendations_preferences', JSON.stringify(this.userPreferences));
        } catch (e) {
            console.error('Error saving preferences:', e);
        }
    }

    loadUserData() {
        // Get user's betting history
        const userData = window.globalState?.getState() || {};
        const bettingHistory = this.getBettingHistory();
        
        // Analyze user patterns
        if (bettingHistory.length > 0) {
            this.analyzeUserPatterns(bettingHistory);
        }
    }

    getBettingHistory() {
        try {
            const history = localStorage.getItem('betting_history');
            return history ? JSON.parse(history) : [];
        } catch (e) {
            return [];
        }
    }

    analyzeUserPatterns(history) {
        // Analyze favorite sports
        const sportCounts = {};
        history.forEach(bet => {
            const sport = bet.sport || 'unknown';
            sportCounts[sport] = (sportCounts[sport] || 0) + 1;
        });

        // Update preferences based on history
        const topSports = Object.entries(sportCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([sport]) => sport);

        if (topSports.length > 0) {
            this.userPreferences.favoriteSports = topSports;
        }

        // Analyze win rate by bet type
        const betTypeStats = {};
        history.forEach(bet => {
            const type = bet.betType || 'moneyline';
            if (!betTypeStats[type]) {
                betTypeStats[type] = { wins: 0, total: 0 };
            }
            betTypeStats[type].total++;
            if (bet.result === 'win') {
                betTypeStats[type].wins++;
            }
        });

        // Prefer bet types with higher win rates
        const successfulBetTypes = Object.entries(betTypeStats)
            .filter(([_, stats]) => stats.total > 3) // At least 3 bets
            .sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))
            .slice(0, 3)
            .map(([type]) => type);

        if (successfulBetTypes.length > 0) {
            this.userPreferences.betTypes = successfulBetTypes;
        }

        this.saveUserPreferences();
    }

    generateRecommendations() {
        const recommendations = [];
        const now = Date.now();

        // Get AI coach suggestions
        const aiCoachPicks = this.getAICoachPicks();
        
        // Get trending picks
        const trendingPicks = this.getTrendingPicks();
        
        // Get value bets
        const valueBets = this.getValueBets();

        // Combine and score recommendations
        const allPicks = [...aiCoachPicks, ...trendingPicks, ...valueBets];
        
        // Score each pick based on user preferences
        allPicks.forEach(pick => {
            pick.personalizedScore = this.calculatePersonalizedScore(pick);
        });

        // Sort by personalized score and take top 6
        this.recommendations = allPicks
            .sort((a, b) => b.personalizedScore - a.personalizedScore)
            .slice(0, 6);

        console.log('Generated', this.recommendations.length, 'personalized recommendations');
    }

    getAICoachPicks() {
        // Get picks from AI coaches
        const picks = [];
        
        // Sample AI coach picks (in production, fetch from API or coaches system)
        const samplePicks = [
            {
                id: 'ai_pick_1',
                sport: 'nfl',
                game: 'Chiefs vs Bills',
                team: 'Kansas City Chiefs',
                betType: 'moneyline',
                odds: -150,
                confidence: 85,
                coach: 'Analytics AI',
                reasoning: 'Strong historical performance in playoff games',
                icon: '🏈',
                color: '#e74c3c'
            },
            {
                id: 'ai_pick_2',
                sport: 'nba',
                game: 'Lakers vs Warriors',
                team: 'Los Angeles Lakers',
                betType: 'spread',
                odds: -5.5,
                confidence: 72,
                coach: 'Stats Master',
                reasoning: 'Home court advantage + recent winning streak',
                icon: '🏀',
                color: '#f39c12'
            },
            {
                id: 'ai_pick_3',
                sport: 'mlb',
                game: 'Yankees vs Red Sox',
                team: 'Over 8.5',
                betType: 'over_under',
                odds: -110,
                confidence: 68,
                coach: 'Sharp AI',
                reasoning: 'Both teams averaging high runs in last 5 games',
                icon: '⚾',
                color: '#3498db'
            }
        ];

        return samplePicks;
    }

    getTrendingPicks() {
        // Get picks that are trending in the community
        const picks = [];

        const trendingSample = [
            {
                id: 'trending_1',
                sport: 'nba',
                game: 'Celtics vs Heat',
                team: 'Boston Celtics',
                betType: 'moneyline',
                odds: -200,
                confidence: 78,
                trending: true,
                trendingCount: 342,
                reasoning: 'Community hot pick - 85% backing Celtics',
                icon: '🏀',
                color: '#2ecc71'
            },
            {
                id: 'trending_2',
                sport: 'nfl',
                game: '49ers vs Rams',
                team: 'Under 45.5',
                betType: 'over_under',
                odds: -105,
                confidence: 70,
                trending: true,
                trendingCount: 289,
                reasoning: 'Sharp money on the under',
                icon: '🏈',
                color: '#9b59b6'
            }
        ];

        return trendingSample;
    }

    getValueBets() {
        // Get bets with good value based on odds movement
        const picks = [];

        const valueSample = [
            {
                id: 'value_1',
                sport: 'nba',
                game: 'Nuggets vs Suns',
                team: 'Denver Nuggets',
                betType: 'spread',
                odds: -3.5,
                confidence: 75,
                value: 'high',
                reasoning: 'Line moved 2 points in our favor',
                icon: '🏀',
                color: '#e67e22'
            }
        ];

        return valueSample;
    }

    calculatePersonalizedScore(pick) {
        let score = pick.confidence || 50;

        // Boost if it matches favorite sports
        if (this.userPreferences.favoriteSports.includes(pick.sport)) {
            score += 15;
        }

        // Boost if it matches preferred bet types
        if (this.userPreferences.betTypes.includes(pick.betType)) {
            score += 10;
        }

        // Boost trending picks slightly
        if (pick.trending) {
            score += 5;
        }

        // Boost value bets
        if (pick.value === 'high') {
            score += 8;
        }

        // Apply risk tolerance
        if (this.userPreferences.riskTolerance === 'low') {
            // Prefer higher confidence picks
            if (pick.confidence > 75) score += 10;
        } else if (this.userPreferences.riskTolerance === 'high') {
            // Prefer higher odds (more risk)
            if (Math.abs(pick.odds) < 150) score += 10;
        }

        return Math.min(score, 100); // Cap at 100
    }

    updateRecommendations() {
        console.log('🔄 Updating AI recommendations...');
        this.loadUserData();
        this.generateRecommendations();
        this.render();
    }

    render() {
        const container = document.getElementById('ai-recommendations-container');
        if (!container) {
            console.warn('AI recommendations container not found');
            return;
        }

        if (this.recommendations.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = `
            <div class="ai-recommendations-widget">
                <div class="widget-header">
                    <div class="header-left">
                        <h2>
                            <i class="fas fa-sparkles" style="color: #e040fb; margin-right: 8px;"></i>
                            AI Picks For You
                        </h2>
                        <p class="widget-subtitle">Personalized recommendations based on your preferences</p>
                    </div>
                    <button class="refresh-btn" onclick="window.aiRecommendations.updateRecommendations()">
                        <i class="fas fa-sync-alt"></i>
                        <span>Refresh</span>
                    </button>
                </div>

                <div class="recommendations-grid">
                    ${this.recommendations.map(pick => this.renderRecommendation(pick)).join('')}
                </div>

                <div class="widget-footer">
                    <button class="view-all-btn" onclick="window.appNavigation?.navigateTo('ai-coaches')">
                        View All AI Coaches
                        <i class="fas fa-arrow-right" style="margin-left: 6px;"></i>
                    </button>
                </div>
            </div>
        `;

        // Add animation
        requestAnimationFrame(() => {
            container.querySelectorAll('.recommendation-card').forEach((card, index) => {
                setTimeout(() => {
                    card.style.animation = 'slideInUp 0.4s ease forwards';
                }, index * 50);
            });
        });
    }

    renderRecommendation(pick) {
        const confidenceColor = this.getConfidenceColor(pick.confidence);
        const matchScore = Math.round(pick.personalizedScore);

        return `
            <div class="recommendation-card" style="border-left: 4px solid ${pick.color}">
                <div class="card-header-row">
                    <div class="sport-badge" style="background: ${pick.color}20; color: ${pick.color}">
                        ${pick.icon} ${pick.sport.toUpperCase()}
                    </div>
                    <div class="match-score" style="background: linear-gradient(135deg, #e040fb 0%, #7c3aed 100%)">
                        ${matchScore}% Match
                    </div>
                </div>

                <div class="game-info">
                    <h3>${pick.game}</h3>
                    <div class="pick-details">
                        <span class="pick-team">${pick.team}</span>
                        <span class="pick-odds">${pick.odds > 0 ? '+' : ''}${pick.odds}</span>
                    </div>
                    <div class="bet-type-badge">${this.formatBetType(pick.betType)}</div>
                </div>

                <div class="confidence-bar-container">
                    <div class="confidence-label">
                        <span>Confidence</span>
                        <span class="confidence-value" style="color: ${confidenceColor}">${pick.confidence}%</span>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${pick.confidence}%; background: ${confidenceColor}"></div>
                    </div>
                </div>

                ${pick.coach ? `
                    <div class="coach-attribution">
                        <i class="fas fa-robot"></i>
                        ${pick.coach}
                    </div>
                ` : ''}

                ${pick.trending ? `
                    <div class="trending-badge">
                        <i class="fas fa-fire"></i>
                        ${pick.trendingCount} users picked this
                    </div>
                ` : ''}

                <div class="reasoning">
                    <i class="fas fa-lightbulb"></i>
                    ${pick.reasoning}
                </div>

                <button class="action-btn" onclick="window.aiRecommendations.viewPick('${pick.id}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="ai-recommendations-widget">
                <div class="widget-header">
                    <h2>
                        <i class="fas fa-sparkles" style="color: #e040fb;"></i>
                        AI Picks For You
                    </h2>
                </div>
                <div class="empty-state">
                    <i class="fas fa-robot" style="font-size: 48px; color: rgba(255,255,255,0.2); margin-bottom: 16px;"></i>
                    <h3>No Recommendations Yet</h3>
                    <p>Start making picks to get personalized AI recommendations!</p>
                    <button class="btn-primary" onclick="window.appNavigation?.navigateTo('ai-coaches')">
                        Browse AI Coaches
                    </button>
                </div>
            </div>
        `;
    }

    formatBetType(type) {
        const typeMap = {
            'moneyline': 'Moneyline',
            'spread': 'Spread',
            'over_under': 'Over/Under',
            'prop': 'Prop Bet'
        };
        return typeMap[type] || type;
    }

    getConfidenceColor(confidence) {
        if (confidence >= 80) return '#10b981'; // Green
        if (confidence >= 70) return '#3b82f6'; // Blue
        if (confidence >= 60) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    }

    viewPick(pickId) {
        const pick = this.recommendations.find(p => p.id === pickId);
        if (!pick) return;

        // Navigate to AI coaches page or show modal with pick details
        if (window.appNavigation) {
            window.appNavigation.navigateTo('ai-coaches');
            
            // Show notification
            if (window.globalState && typeof window.globalState.showNotification === 'function') {
                window.globalState.showNotification(
                    `Opening ${pick.coach || 'AI Coach'} recommendation`,
                    'info'
                );
            }
        }
    }

    // Update user preferences (can be called from settings)
    updatePreferences(newPreferences) {
        this.userPreferences = { ...this.userPreferences, ...newPreferences };
        this.saveUserPreferences();
        this.updateRecommendations();
    }
}

// Initialize widget
if (typeof window !== 'undefined') {
    window.aiRecommendations = new AIRecommendationsWidget();
    
    // Auto-init when on home page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('ai-recommendations-container')) {
                window.aiRecommendations.init();
            }
        });
    } else {
        if (document.getElementById('ai-recommendations-container')) {
            window.aiRecommendations.init();
        }
    }
}

console.log('✅ AI Recommendations Widget loaded');
