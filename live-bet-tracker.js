// ============================================
// LIVE BET TRACKER
// Real-time bet monitoring with auto-grading
// ============================================

console.log('🎯 Loading Live Bet Tracker');

class LiveBetTracker {
    constructor(apiBaseUrl = '/api') {
        this.apiBaseUrl = apiBaseUrl;
        this.bets = [];
        this.stats = null;
        this.refreshInterval = 30000; // 30 seconds
        this.scoreCheckInterval = null;
        this.isTracking = false;
        this.scoresCache = new Map();
        
        this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    async init() {
        console.log('🎯 Initializing Live Bet Tracker');
        
        try {
            // Load user's bets
            await this.loadBets();
            
            // Start tracking pending bets
            this.startTracking();
            
            // Update stats display every 5 seconds
            setInterval(() => this.updateStatsDisplay(), 5000);
            
            console.log(`✅ Live Bet Tracker ready (${this.bets.length} bets)`);
        } catch (error) {
            console.error('❌ Failed to initialize tracker:', error);
        }
    }

    // ============================================
    // BET MANAGEMENT
    // ============================================

    /**
     * Load all user bets from backend
     */
    async loadBets(filter = 'all') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/bets?status=${filter}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to load bets');

            const data = await response.json();
            this.bets = data.bets || [];
            this.stats = data.stats || {};

            console.log(`📊 Loaded ${this.bets.length} bets, stats:`, this.stats);
            this.renderBets();
            
            return this.bets;
        } catch (error) {
            console.error('❌ Error loading bets:', error);
            return [];
        }
    }

    /**
     * Create a new bet
     */
    async createBet(betData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/bets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(betData)
            });

            if (!response.ok) throw new Error('Failed to create bet');

            const data = await response.json();
            this.bets.unshift(data.bet);
            
            console.log('✅ Bet created:', data.bet);
            this.showNotification('✅ Bet tracked!', `${betData.pick} on ${betData.match}`);
            this.renderBets();
            
            return data.bet;
        } catch (error) {
            console.error('❌ Error creating bet:', error);
            this.showNotification('❌ Error', 'Failed to create bet');
            return null;
        }
    }

    /**
     * Delete a bet
     */
    async deleteBet(betId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/bets/${betId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete bet');

            this.bets = this.bets.filter(b => b.id !== betId);
            console.log('🗑️ Bet deleted:', betId);
            this.renderBets();
            
            return true;
        } catch (error) {
            console.error('❌ Error deleting bet:', error);
            return false;
        }
    }

    // ============================================
    // LIVE TRACKING & GRADING
    // ============================================

    /**
     * Start tracking pending bets with live score monitoring
     */
    startTracking() {
        if (this.isTracking) return;
        
        this.isTracking = true;
        console.log('🎯 Starting live bet tracking');
        
        // Check for updates every 30 seconds
        this.scoreCheckInterval = setInterval(() => this.checkPendingBets(), this.refreshInterval);
        
        // Initial check
        this.checkPendingBets();
    }

    /**
     * Stop tracking
     */
    stopTracking() {
        if (this.scoreCheckInterval) {
            clearInterval(this.scoreCheckInterval);
            this.scoreCheckInterval = null;
        }
        this.isTracking = false;
        console.log('⏹️ Stopped live bet tracking');
    }

    /**
     * Check all pending bets for completion
     */
    async checkPendingBets() {
        const pendingBets = this.bets.filter(b => b.status === 'pending');
        
        if (pendingBets.length === 0) {
            console.log('✅ No pending bets to check');
            return;
        }

        console.log(`🔍 Checking ${pendingBets.length} pending bets for completion...`);

        for (const bet of pendingBets) {
            try {
                await this.checkBetCompletion(bet);
            } catch (error) {
                console.error(`Error checking bet ${bet.id}:`, error);
            }
        }
    }

    /**
     * Check if a specific bet's game is complete
     */
    async checkBetCompletion(bet) {
        try {
            // Fetch live scores for the sport
            const response = await fetch(`/api/scores/${bet.sport.toLowerCase()}`);
            if (!response.ok) return;

            const data = await response.json();
            if (!data.events) return;

            // Find matching game
            const matchedEvent = this.findMatchingEvent(bet, data.events);
            if (!matchedEvent) {
                console.log(`⏳ Game not found yet: ${bet.match}`);
                return;
            }

            // Check if game is complete
            if (matchedEvent.status === 'completed' || matchedEvent.status === 'final') {
                console.log(`🎯 Game complete: ${bet.match}`);
                await this.gradeBet(bet, matchedEvent);
            } else {
                console.log(`⏳ Game in progress: ${bet.match} (${matchedEvent.status})`);
                this.updateBetProgress(bet, matchedEvent);
            }
        } catch (error) {
            console.error(`Error checking bet completion for ${bet.id}:`, error);
        }
    }

    /**
     * Find matching event from scores
     */
    findMatchingEvent(bet, events) {
        const [team1, team2] = bet.match.split(' vs ').map(t => t.trim().toUpperCase());

        return events.find(event => {
            const comp1 = event.name.toUpperCase();
            const teams = [
                event.competitors?.[0]?.name?.toUpperCase() || '',
                event.competitors?.[1]?.name?.toUpperCase() || ''
            ];

            return comp1.includes(team1) && comp1.includes(team2) ||
                   (teams[0].includes(team1) && teams[1].includes(team2));
        });
    }

    /**
     * Grade a bet based on final scores
     */
    async gradeBet(bet, event) {
        try {
            const scores = this.extractScores(event);
            
            const response = await fetch(`${this.apiBaseUrl}/bets/${bet.id}/grade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(scores)
            });

            if (!response.ok) throw new Error('Failed to grade bet');

            const data = await response.json();
            
            // Update local bet
            const betIndex = this.bets.findIndex(b => b.id === bet.id);
            if (betIndex !== -1) {
                this.bets[betIndex] = data.bet;
            }

            // Show notification
            const isWin = data.gradeResult.status === 'won';
            const icon = isWin ? '🎉' : '😞';
            const title = isWin ? '✅ BET WON!' : '❌ BET LOST';
            
            this.showNotification(
                `${title}`,
                `${bet.pick} on ${bet.match}\n${scores.finalTeam1Score} - ${scores.finalTeam2Score}`
            );

            console.log(`${icon} Bet graded as ${data.gradeResult.status}`);
            this.renderBets();

            return data;
        } catch (error) {
            console.error('Error grading bet:', error);
            return null;
        }
    }

    /**
     * Extract scores from ESPN event data
     */
    extractScores(event) {
        let team1Score = 0;
        let team2Score = 0;

        if (event.competitions && event.competitions[0]) {
            const comp = event.competitions[0];
            if (comp.competitors) {
                team1Score = parseInt(comp.competitors[0]?.score) || 0;
                team2Score = parseInt(comp.competitors[1]?.score) || 0;
            }
        }

        return {
            finalTeam1Score: team1Score,
            finalTeam2Score: team2Score
        };
    }

    /**
     * Update bet with live progress
     */
    updateBetProgress(bet, event) {
        const scores = this.extractScores(event);
        
        const betIndex = this.bets.findIndex(b => b.id === bet.id);
        if (betIndex !== -1) {
            // Store live scores in UI
            if (!this.bets[betIndex].liveScores) {
                this.bets[betIndex].liveScores = {};
            }
            this.bets[betIndex].liveScores = scores;
        }
    }

    // ============================================
    // UI RENDERING
    // ============================================

    /**
     * Render bets in container
     */
    renderBets() {
        const container = document.getElementById('liveBetsContainer');
        if (!container) return;

        if (this.bets.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
                    <p style="font-size: 24px; margin-bottom: 10px;">📋 No bets tracked yet</p>
                    <p>Start tracking bets to see them here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.bets.map(bet => this.renderBetCard(bet)).join('');
    }

    /**
     * Render individual bet card
     */
    renderBetCard(bet) {
        const statusClass = bet.status;
        const statusIcon = this.getStatusIcon(bet.status);
        const liveScores = bet.liveScores || {};

        return `
            <div class="live-bet-card ${statusClass}" data-bet-id="${bet.id}">
                <div class="bet-card-header">
                    <div class="bet-card-status ${statusClass}">
                        ${statusIcon} ${bet.status.toUpperCase()}
                    </div>
                    ${this.canDeleteBet(bet) ? `
                        <button class="bet-delete-btn" onclick="window.liveBetTracker?.deleteBet(${bet.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>

                <div class="bet-card-main">
                    <div class="bet-card-sport">${bet.sport}</div>
                    <div class="bet-card-match">${bet.match}</div>
                    <div class="bet-card-pick">
                        <i class="fas fa-bullseye"></i> ${bet.pick}
                    </div>
                </div>

                <div class="bet-card-details">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Stake</span>
                            <span class="detail-value">${bet.stake}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Odds</span>
                            <span class="detail-value">${bet.odds}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Confidence</span>
                            <span class="detail-value">${bet.confidence}</span>
                        </div>
                        ${bet.potentialWin ? `
                            <div class="detail-item">
                                <span class="detail-label">Potential Win</span>
                                <span class="detail-value">${bet.potential_win || bet.potentialWin}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${liveScores.finalTeam1Score !== undefined ? `
                    <div class="bet-card-scores">
                        <div class="score">
                            <span class="score-value">${liveScores.finalTeam1Score}</span>
                            <span class="score-total">Total: ${liveScores.finalTeam1Score + liveScores.finalTeam2Score}</span>
                        </div>
                        <div class="score-vs">vs</div>
                        <div class="score">
                            <span class="score-value">${liveScores.finalTeam2Score}</span>
                        </div>
                    </div>
                ` : ''}

                ${bet.coach ? `
                    <div class="bet-card-coach">
                        <i class="fas fa-robot"></i> ${bet.coach}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Update stats display
     */
    updateStatsDisplay() {
        const statsContainer = document.getElementById('betStatsContainer');
        if (!statsContainer || !this.stats) return;

        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${this.stats.total || 0}</div>
                    <div class="stat-label">Total Bets</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.stats.won || 0}</div>
                    <div class="stat-label">Won</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.stats.lost || 0}</div>
                    <div class="stat-label">Lost</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.stats.pending || 0}</div>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.stats.winRate || 0}%</div>
                    <div class="stat-label">Win Rate</div>
                </div>
                ${this.stats.profit !== undefined ? `
                    <div class="stat-item ${this.stats.profit >= 0 ? 'profit' : 'loss'}">
                        <div class="stat-value">${this.stats.profit >= 0 ? '+' : ''}$${Math.abs(this.stats.profit).toFixed(2)}</div>
                        <div class="stat-label">Profit</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ============================================
    // UTILITIES
    // ============================================

    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const icons = {
            'pending': '⏳',
            'won': '✅',
            'lost': '❌',
            'void': '🚫'
        };
        return icons[status] || '❓';
    }

    /**
     * Check if bet can be deleted
     */
    canDeleteBet(bet) {
        return bet.status === 'pending';
    }

    /**
     * Get auth token
     */
    getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
    }

    /**
     * Show notification
     */
    showNotification(title, message) {
        // Try to use existing notification system
        if (window.showNotification) {
            window.showNotification(title, message);
            return;
        }

        // Fallback: console + simple alert
        console.log(`${title}: ${message}`);
        
        // Show toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        toast.innerHTML = `<strong>${title}</strong><br><small>${message}</small>`;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
}

// Initialize global instance
window.liveBetTracker = new LiveBetTracker();

console.log('✅ Live Bet Tracker ready');
