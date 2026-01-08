/**
 * Live Match Commentary Overlay
 * AI-powered real-time match analysis and insights
 */

class LiveCommentaryOverlay {
    constructor() {
        this.overlay = null;
        this.currentGame = null;
        this.commentaryItems = [];
        this.updateInterval = null;
        this.activeTab = 'commentary';
        this.isOpen = false;
        this.aiEngine = new CommentaryAIEngine();
        this.init();
    }

    init() {
        this.createOverlay();
        this.attachEventListeners();
        console.log('🎙️ Live Commentary Overlay initialized');
    }

    createOverlay() {
        const overlayHTML = `
            <div class="commentary-overlay" id="commentary-overlay">
                <div class="commentary-container">
                    <!-- Header -->
                    <div class="commentary-header">
                        <button class="commentary-close" id="commentary-close">
                            <i class="fas fa-times"></i>
                        </button>
                        
                        <div class="commentary-game-info">
                            <div class="commentary-teams">
                                <div class="commentary-team">
                                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" class="commentary-team-logo" id="comm-away-logo">
                                    <div class="commentary-team-info">
                                        <div class="commentary-team-name" id="comm-away-name">Away Team</div>
                                        <div class="commentary-team-record" id="comm-away-record">0-0</div>
                                    </div>
                                </div>
                                <div class="commentary-vs">VS</div>
                                <div class="commentary-team">
                                    <div class="commentary-team-info" style="text-align: right;">
                                        <div class="commentary-team-name" id="comm-home-name">Home Team</div>
                                        <div class="commentary-team-record" id="comm-home-record">0-0</div>
                                    </div>
                                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" class="commentary-team-logo" id="comm-home-logo">
                                </div>
                            </div>

                            <div class="commentary-score">
                                <div class="commentary-score-value" id="comm-away-score">0</div>
                                <div class="commentary-score-separator">-</div>
                                <div class="commentary-score-value" id="comm-home-score">0</div>
                            </div>

                            <div class="commentary-status-bar">
                                <div class="commentary-live-indicator">
                                    <div class="commentary-live-dot"></div>
                                    <span id="comm-status">LIVE</span>
                                </div>
                                <div id="comm-venue">Stadium Name</div>
                            </div>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="commentary-content">
                        <!-- Sidebar -->
                        <div class="commentary-sidebar">
                            <div class="commentary-tabs">
                                <button class="commentary-tab active" data-tab="commentary">
                                    <i class="fas fa-microphone"></i>
                                    <span>AI Commentary</span>
                                </button>
                                <button class="commentary-tab" data-tab="stats">
                                    <i class="fas fa-chart-bar"></i>
                                    <span>Key Stats</span>
                                </button>
                                <button class="commentary-tab" data-tab="momentum">
                                    <i class="fas fa-chart-line"></i>
                                    <span>Momentum</span>
                                </button>
                                <button class="commentary-tab" data-tab="predictions">
                                    <i class="fas fa-crystal-ball"></i>
                                    <span>AI Predictions</span>
                                </button>
                            </div>
                        </div>

                        <!-- Main Panel -->
                        <div class="commentary-main">
                            <!-- Commentary Feed -->
                            <div class="commentary-panel active" data-panel="commentary">
                                <div class="commentary-feed" id="commentary-feed">
                                    <div class="commentary-loading">
                                        <div class="commentary-spinner"></div>
                                        <p>Analyzing match data...</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Stats Panel -->
                            <div class="commentary-panel" data-panel="stats">
                                <div class="stats-grid" id="stats-grid">
                                    <!-- Stats populated dynamically -->
                                </div>
                            </div>

                            <!-- Momentum Panel -->
                            <div class="commentary-panel" data-panel="momentum">
                                <div class="momentum-chart" id="momentum-chart">
                                    <!-- Momentum data populated dynamically -->
                                </div>
                            </div>

                            <!-- Predictions Panel -->
                            <div class="commentary-panel" data-panel="predictions">
                                <div class="predictions-container" id="predictions-container">
                                    <!-- Predictions populated dynamically -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        this.overlay = document.getElementById('commentary-overlay');
    }

    attachEventListeners() {
        // Close button
        document.getElementById('commentary-close')?.addEventListener('click', () => this.close());

        // Click outside to close
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Tab switching
        document.querySelectorAll('.commentary-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
    }

    switchTab(tabName) {
        this.activeTab = tabName;

        // Update active tab button
        document.querySelectorAll('.commentary-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update active panel
        document.querySelectorAll('.commentary-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });

        // Load panel data if needed
        if (tabName === 'stats' && this.currentGame) {
            this.renderStats();
        } else if (tabName === 'momentum' && this.currentGame) {
            this.renderMomentum();
        } else if (tabName === 'predictions' && this.currentGame) {
            this.renderPredictions();
        }
    }

    async open(game) {
        this.currentGame = game;
        this.isOpen = true;
        
        // Populate game info
        this.populateGameInfo();

        // Show overlay
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Start generating commentary
        await this.startCommentary();

        // Start live updates
        this.startLiveUpdates();
    }

    close() {
        this.isOpen = false;
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Stop updates
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Reset state
        this.commentaryItems = [];
        this.currentGame = null;

        // Reset to commentary tab
        setTimeout(() => {
            this.switchTab('commentary');
        }, 300);
    }

    populateGameInfo() {
        const game = this.currentGame;
        if (!game) return;

        const fallbackLogo = 'https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN';

        // Resolve logos
        const awayLogo = window.resolveSportsLogo ? 
                        window.resolveSportsLogo(game.awayTeam.id, game.sport, game.awayTeam.logo) : 
                        game.awayTeam.logo;
        const homeLogo = window.resolveSportsLogo ? 
                        window.resolveSportsLogo(game.homeTeam.id, game.sport, game.homeTeam.logo) : 
                        game.homeTeam.logo;

        // Away team
        document.getElementById('comm-away-logo').src = awayLogo;
        document.getElementById('comm-away-logo').onerror = function() { this.src = fallbackLogo; };
        document.getElementById('comm-away-name').textContent = game.awayTeam.name;
        document.getElementById('comm-away-record').textContent = game.awayTeam.record || 'N/A';
        document.getElementById('comm-away-score').textContent = game.awayTeam.score || '0';

        // Home team
        document.getElementById('comm-home-logo').src = homeLogo;
        document.getElementById('comm-home-logo').onerror = function() { this.src = fallbackLogo; };
        document.getElementById('comm-home-name').textContent = game.homeTeam.name;
        document.getElementById('comm-home-record').textContent = game.homeTeam.record || 'N/A';
        document.getElementById('comm-home-score').textContent = game.homeTeam.score || '0';

        // Status
        document.getElementById('comm-status').textContent = game.statusDisplay || 'LIVE';
        document.getElementById('comm-venue').textContent = game.venue || 'Unknown Venue';
    }

    async startCommentary() {
        const feed = document.getElementById('commentary-feed');
        feed.innerHTML = '';

        // Generate initial commentary
        const initialComments = await this.aiEngine.generateInitialCommentary(this.currentGame);
        
        for (const comment of initialComments) {
            this.addCommentaryItem(comment);
            await this.delay(500); // Stagger for effect
        }
    }

    addCommentaryItem(comment) {
        const feed = document.getElementById('commentary-feed');
        
        const item = document.createElement('div');
        item.className = 'commentary-item';
        item.innerHTML = `
            <div class="commentary-item-header">
                <div class="commentary-timestamp">${comment.timestamp}</div>
                <div class="commentary-ai-badge">
                    <i class="fas fa-brain"></i>
                    AI Insight
                </div>
            </div>
            <div class="commentary-text">${comment.text}</div>
            ${comment.insight ? `
                <div class="commentary-insight">
                    <i class="fas fa-lightbulb"></i>
                    <span>${comment.insight}</span>
                </div>
            ` : ''}
        `;

        feed.insertBefore(item, feed.firstChild);
        this.commentaryItems.unshift(comment);

        // Keep only last 20 items
        if (this.commentaryItems.length > 20) {
            this.commentaryItems.pop();
            const items = feed.querySelectorAll('.commentary-item');
            if (items.length > 20) {
                items[items.length - 1].remove();
            }
        }
    }

    startLiveUpdates() {
        // Generate new commentary every 15-30 seconds
        this.updateInterval = setInterval(() => {
            if (this.isOpen && this.currentGame) {
                const newComment = this.aiEngine.generateLiveUpdate(this.currentGame, this.commentaryItems);
                this.addCommentaryItem(newComment);

                // Play sound effect
                if (window.soundEffects) {
                    window.soundEffects.playSound('notification');
                }
            }
        }, Math.random() * 15000 + 15000); // 15-30 seconds
    }

    renderStats() {
        const grid = document.getElementById('stats-grid');
        const stats = this.aiEngine.generateKeyStats(this.currentGame);

        grid.innerHTML = stats.map(stat => `
            <div class="stat-card">
                <div class="stat-card-title">${stat.name}</div>
                <div class="stat-comparison">
                    <div class="stat-value">${stat.awayValue}</div>
                    <div class="stat-bar-container">
                        <div class="stat-bar away" style="width: ${stat.awayPercent}%;"></div>
                        <div class="stat-bar home" style="width: ${stat.homePercent}%;"></div>
                    </div>
                    <div class="stat-value">${stat.homeValue}</div>
                </div>
            </div>
        `).join('');
    }

    renderMomentum() {
        const container = document.getElementById('momentum-chart');
        const momentum = this.aiEngine.calculateMomentum(this.currentGame);

        container.innerHTML = `
            <div class="momentum-meter">
                <div class="momentum-meter-title">Current Game Momentum</div>
                <div class="momentum-bar">
                    <div class="momentum-fill" style="width: ${momentum.value}%;">
                        ${momentum.leader}
                    </div>
                </div>
            </div>

            <div class="momentum-timeline">
                ${momentum.events.map(event => `
                    <div class="momentum-event">
                        <div class="momentum-event-icon ${event.type}">
                            ${event.icon}
                        </div>
                        <div class="momentum-event-text">${event.text}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPredictions() {
        const container = document.getElementById('predictions-container');
        const predictions = this.aiEngine.generatePredictions(this.currentGame);

        container.innerHTML = predictions.map(pred => `
            <div class="prediction-card">
                <div class="prediction-header">
                    <div class="prediction-title">${pred.title}</div>
                    <div class="prediction-confidence">${pred.confidence}% confidence</div>
                </div>
                <div class="prediction-outcome">${pred.outcome}</div>
                <div class="prediction-reasoning">
                    ${pred.reasons.map(reason => `
                        <div class="prediction-reason">
                            <i class="fas fa-check"></i>
                            <span>${reason}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * AI Commentary Engine
 * Generates intelligent match commentary and insights
 */
class CommentaryAIEngine {
    constructor() {
        this.commentaryTemplates = this.initializeTemplates();
    }

    initializeTemplates() {
        return {
            opening: [
                "Welcome to an exciting matchup between {away} and {home}! The atmosphere is electric.",
                "We're underway at {venue}! Both teams are looking sharp in the early going.",
                "A crucial game for both {away} and {home} as they battle for positioning.",
                "The stage is set for what promises to be a thrilling contest!"
            ],
            momentum: [
                "{team} is building serious momentum with their recent performance.",
                "The tide is turning in favor of {team} - they're finding their rhythm.",
                "{team} has seized control of this game with dominant play.",
                "We're seeing a shift in momentum as {team} steps up the pressure."
            ],
            analysis: [
                "{team}'s defensive strategy is proving effective against {opponent}'s offense.",
                "The matchup between these two sides is living up to expectations.",
                "{team} is exploiting weaknesses in {opponent}'s defensive formation.",
                "Both teams are showing why they're among the best with this level of play."
            ],
            scoring: [
                "Score! {team} capitalizes on their opportunity! The crowd erupts!",
                "{team} finds the breakthrough they've been looking for!",
                "What a play by {team}! They've extended their lead!",
                "Clinical finish by {team} - that's quality execution!"
            ]
        };
    }

    generateInitialCommentary(game) {
        const comments = [];
        const now = new Date();

        // Opening comment
        comments.push({
            timestamp: this.formatTime(now),
            text: this.fillTemplate(this.getRandomTemplate('opening'), game),
            insight: `This ${game.sport} matchup features two teams with contrasting styles and records.`
        });

        // Matchup analysis
        comments.push({
            timestamp: this.formatTime(new Date(now.getTime() + 60000)),
            text: this.fillTemplate(this.getRandomTemplate('analysis'), game),
            insight: this.generateMatchupInsight(game)
        });

        // Current state
        if (game.isLive) {
            const scoreDiff = Math.abs(parseInt(game.homeTeam.score) - parseInt(game.awayTeam.score));
            if (scoreDiff < 3) {
                comments.push({
                    timestamp: this.formatTime(new Date(now.getTime() + 120000)),
                    text: "This is shaping up to be a nail-biter! Neither team is giving an inch.",
                    insight: "Games this close often come down to key moments in the final stretch."
                });
            } else {
                const leader = parseInt(game.homeTeam.score) > parseInt(game.awayTeam.score) ? 
                              game.homeTeam.name : game.awayTeam.name;
                comments.push({
                    timestamp: this.formatTime(new Date(now.getTime() + 120000)),
                    text: `${leader} has established a comfortable advantage, but there's still plenty of time.`,
                    insight: "Maintaining this lead will require consistent execution and smart play."
                });
            }
        }

        return comments;
    }

    generateLiveUpdate(game, previousComments) {
        const templates = [...this.commentaryTemplates.momentum, ...this.commentaryTemplates.analysis];
        const text = this.fillTemplate(templates[Math.floor(Math.random() * templates.length)], game);
        
        const insights = [
            "Advanced metrics show significant pressure building in the offensive zone.",
            "The defensive line is holding strong despite sustained attacks.",
            "Key substitutions are making an impact on both sides of the ball.",
            "This period has seen the highest intensity level of the match so far.",
            "Statistical analysis suggests momentum could shift at any moment.",
            "Both coaching staffs are making tactical adjustments in real-time."
        ];

        return {
            timestamp: this.formatTime(new Date()),
            text: text,
            insight: Math.random() > 0.5 ? insights[Math.floor(Math.random() * insights.length)] : null
        };
    }

    generateKeyStats(game) {
        // Generate realistic-looking stats based on score and sport
        const homeScore = parseInt(game.homeTeam.score) || 0;
        const awayScore = parseInt(game.awayTeam.score) || 0;
        const totalScore = homeScore + awayScore;

        const stats = [];

        if (game.sport === 'NBA' || game.sport === 'NCAAB') {
            stats.push(
                { name: 'Points', homeValue: homeScore, awayValue: awayScore, homePercent: this.calcPercent(homeScore, totalScore), awayPercent: this.calcPercent(awayScore, totalScore) },
                { name: 'Field Goal %', homeValue: this.randomStat(42, 58) + '%', awayValue: this.randomStat(42, 58) + '%', homePercent: 50, awayPercent: 50 },
                { name: 'Rebounds', homeValue: this.randomStat(35, 52), awayValue: this.randomStat(35, 52), homePercent: 50, awayPercent: 50 },
                { name: 'Assists', homeValue: this.randomStat(18, 28), awayValue: this.randomStat(18, 28), homePercent: 50, awayPercent: 50 }
            );
        } else if (game.sport === 'NFL' || game.sport === 'NCAAF') {
            stats.push(
                { name: 'Points', homeValue: homeScore, awayValue: awayScore, homePercent: this.calcPercent(homeScore, totalScore), awayPercent: this.calcPercent(awayScore, totalScore) },
                { name: 'Total Yards', homeValue: this.randomStat(280, 420), awayValue: this.randomStat(280, 420), homePercent: 50, awayPercent: 50 },
                { name: 'First Downs', homeValue: this.randomStat(15, 28), awayValue: this.randomStat(15, 28), homePercent: 50, awayPercent: 50 },
                { name: 'Time of Possession', homeValue: this.randomStat(25, 35) + ':00', awayValue: this.randomStat(25, 35) + ':00', homePercent: 50, awayPercent: 50 }
            );
        } else {
            stats.push(
                { name: 'Score', homeValue: homeScore, awayValue: awayScore, homePercent: this.calcPercent(homeScore, totalScore), awayPercent: this.calcPercent(awayScore, totalScore) },
                { name: 'Possession %', homeValue: this.randomStat(42, 58) + '%', awayValue: this.randomStat(42, 58) + '%', homePercent: 50, awayPercent: 50 },
                { name: 'Shots on Goal', homeValue: this.randomStat(4, 12), awayValue: this.randomStat(4, 12), homePercent: 50, awayPercent: 50 },
                { name: 'Fouls', homeValue: this.randomStat(8, 18), awayValue: this.randomStat(8, 18), homePercent: 50, awayPercent: 50 }
            );
        }

        return stats;
    }

    calculateMomentum(game) {
        const homeScore = parseInt(game.homeTeam.score) || 0;
        const awayScore = parseInt(game.awayTeam.score) || 0;
        
        // Calculate momentum based on score differential
        const diff = homeScore - awayScore;
        const totalScore = homeScore + awayScore || 1;
        let momentumValue = 50 + (diff / totalScore) * 50;
        momentumValue = Math.max(20, Math.min(80, momentumValue));

        const leader = momentumValue > 50 ? game.homeTeam.name : game.awayTeam.name;

        // Generate momentum events
        const events = [
            { type: 'positive', icon: '📈', text: `${leader} controlling the tempo effectively` },
            { type: 'positive', icon: '🎯', text: 'Strong execution on both offense and defense' },
            { type: momentumValue > 50 ? 'positive' : 'negative', icon: '⚡', text: 'Key play shifting momentum' }
        ];

        return {
            value: momentumValue,
            leader: leader,
            events: events
        };
    }

    generatePredictions(game) {
        const predictions = [];
        const homeScore = parseInt(game.homeTeam.score) || 0;
        const awayScore = parseInt(game.awayTeam.score) || 0;
        const leader = homeScore > awayScore ? game.homeTeam.name : game.awayTeam.name;

        // Final score prediction
        predictions.push({
            title: 'Final Score Prediction',
            confidence: this.randomStat(68, 85),
            outcome: `${leader} to win by ${Math.abs(homeScore - awayScore) + Math.floor(Math.random() * 5)} points`,
            reasons: [
                'Current scoring trends favor continued dominance',
                'Defensive metrics suggest sustainable advantage',
                'Historical performance in similar situations'
            ]
        });

        // Next scoring play
        predictions.push({
            title: 'Next Scoring Play',
            confidence: this.randomStat(72, 88),
            outcome: `${leader} likely to score next`,
            reasons: [
                'Offensive pressure building significantly',
                'Time of possession favoring this outcome',
                'Pattern analysis from recent plays'
            ]
        });

        return predictions;
    }

    // Helper methods
    getRandomTemplate(category) {
        const templates = this.commentaryTemplates[category];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    fillTemplate(template, game) {
        return template
            .replace('{away}', game.awayTeam.name)
            .replace('{home}', game.homeTeam.name)
            .replace('{venue}', game.venue)
            .replace('{team}', Math.random() > 0.5 ? game.homeTeam.name : game.awayTeam.name)
            .replace('{opponent}', Math.random() > 0.5 ? game.awayTeam.name : game.homeTeam.name);
    }

    generateMatchupInsight(game) {
        const insights = [
            `${game.homeTeam.name}'s home advantage could prove decisive in this matchup.`,
            `The contrast in playing styles makes this a fascinating tactical battle.`,
            `Both teams enter with strong records, setting up a competitive clash.`,
            `Key player matchups will determine the outcome of this contest.`
        ];
        return insights[Math.floor(Math.random() * insights.length)];
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    }

    randomStat(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    calcPercent(value, total) {
        if (total === 0) return 50;
        return Math.round((value / total) * 100);
    }
}

// Initialize global instance
document.addEventListener('DOMContentLoaded', () => {
    window.liveCommentaryOverlay = new LiveCommentaryOverlay();
    console.log('✅ Live Commentary Overlay ready');
});
