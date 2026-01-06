// ============================================
// AI COACH PICKS - REAL DATA ONLY
// NO MOCK DATA AT ALL
// Backend API required - shows message if unavailable
// ============================================

console.log('🎯 AI Coach Picks - Real Data Only');

const aiCoachPicks = {
    currentCoach: null,
    isOpen: false,
    realPicks: [],

    async open(coach) {
        if (!coach) {
            console.warn('⚠️ No coach provided');
            return;
        }

        console.log('📖 Opening picks for:', coach.name);
        this.currentCoach = coach;
        this.isOpen = true;

        // Show loading modal
        this.showLoadingModal();

        try {
            // Fetch REAL picks from backend
            const picks = await this.fetchRealPicks(coach);

            if (!picks || picks.length === 0) {
                // NO DATA - Show message
                this.showNoDataModal();
                return;
            }

            // Show real picks
            this.createModal(picks);

        } catch (error) {
            console.error('❌ Error fetching picks:', error);
            this.showErrorModal(error.message);
        }
    },

    async fetchRealPicks(coach) {
        try {
            const apiUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
            
            console.log('🔄 Fetching real picks from:', `${apiUrl}/api/ai-coaches/${coach.id}/picks`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${apiUrl}/api/ai-coaches/${coach.id}/picks`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 Picks received:', data);

            // Validate data
            let picks = [];
            if (data.success && Array.isArray(data.picks)) {
                picks = data.picks;
            } else if (Array.isArray(data.data)) {
                picks = data.data;
            } else if (Array.isArray(data)) {
                picks = data;
            }

            if (picks.length === 0) {
                console.warn('⚠️ No picks available for this coach');
                return null;
            }

            console.log('✅ Got', picks.length, 'real picks');
            return picks;

        } catch (error) {
            console.error('❌ Fetch picks error:', error.message);
            throw error;
        }
    },

    showLoadingModal() {
        const existing = document.getElementById('ai-coach-picks-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'ai-coach-picks-modal';
        modal.className = 'coach-picks-modal active';

        modal.innerHTML = `
            <div class="coach-picks-overlay" onclick="aiCoachPicks.close()"></div>
            <div class="coach-picks-container" style="display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: var(--text-primary);">
                    <div class="spinner" style="width: 48px; height: 48px; margin: 0 auto 20px;"></div>
                    <h3>Loading ${this.currentCoach.name}'s Picks...</h3>
                    <p style="color: var(--text-secondary);">Fetching real-time data from backend</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    showNoDataModal() {
        const existing = document.getElementById('ai-coach-picks-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'ai-coach-picks-modal';
        modal.className = 'coach-picks-modal active';

        modal.innerHTML = `
            <div class="coach-picks-overlay" onclick="aiCoachPicks.close()"></div>
            <div class="coach-picks-container" style="display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 40px; max-width: 400px;">
                    <i class="fas fa-inbox" style="font-size: 64px; color: var(--text-muted); margin-bottom: 16px; display: block;"></i>
                    <h3>${this.currentCoach.name}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        No real picks available at this time.
                    </p>
                    <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 20px;">
                        Picks are generated from real-time analysis. Check back later when data is available.
                    </p>
                    <button class="btn btn-secondary" onclick="aiCoachPicks.close()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    },

    showErrorModal(errorMessage) {
        const existing = document.getElementById('ai-coach-picks-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'ai-coach-picks-modal';
        modal.className = 'coach-picks-modal active';

        modal.innerHTML = `
            <div class="coach-picks-overlay" onclick="aiCoachPicks.close()"></div>
            <div class="coach-picks-container" style="display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 40px; max-width: 400px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 64px; color: #ef4444; margin-bottom: 16px; display: block;"></i>
                    <h3>${this.currentCoach.name}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        Failed to load picks from backend.
                    </p>
                    <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 20px; background: var(--bg-tertiary); padding: 12px; border-radius: 8px;">
                        <strong>Error:</strong><br>${errorMessage}
                    </p>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-secondary" onclick="aiCoachPicks.close()">Close</button>
                        <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    },

    createModal(picks) {
        const existing = document.getElementById('ai-coach-picks-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'ai-coach-picks-modal';
        modal.className = 'coach-picks-modal';

        modal.innerHTML = `
            <div class="coach-picks-overlay" onclick="aiCoachPicks.close()"></div>
            <div class="coach-picks-container">
                <!-- Header -->
                <div class="coach-picks-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <h3 style="margin: 0 0 4px; font-size: 18px;">${this.currentCoach.name}'s Real Picks</h3>
                            <p style="margin: 0; font-size: 12px; opacity: 0.9;">
                                ${this.currentCoach.sport || 'Sports'} • ${picks.length} Active Picks
                            </p>
                        </div>
                        <button class="picks-close-btn" onclick="aiCoachPicks.close()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- Picks List -->
                <div class="coach-picks-list" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
                    ${picks.map((pick, index) => this.renderPickCard(pick, index)).join('')}
                </div>

                <!-- Footer -->
                <div style="padding: 16px; border-top: 1px solid var(--border-color); text-align: center;">
                    <p style="color: var(--text-secondary); font-size: 12px; margin: 0;">
                        These are real picks based on live data analysis
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    },

    renderPickCard(pick, index) {
        // Extract pick data - handle various response formats
        const matchup = pick.matchup || pick.game || 'N/A';
        const betType = pick.type || pick.betType || 'Unknown';
        const team = pick.team || pick.pick || 'N/A';
        const odds = pick.odds || pick.odds || '-110';
        const confidence = pick.confidence || pick.confidence || 0;
        const reasoning = pick.reasoning || pick.analysis || 'AI analysis';
        const time = pick.time || pick.gameTime || 'TBD';

        return `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <h4 style="margin: 0 0 4px; font-size: 16px; font-weight: 600;">${team}</h4>
                        <p style="margin: 0 0 4px; color: var(--text-secondary); font-size: 12px;">
                            <i class="fas fa-clock"></i> ${time}
                        </p>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 12px;">
                            ${matchup}
                        </p>
                    </div>
                    <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                        ${betType}
                    </span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; font-size: 12px;">
                    <div>
                        <span style="color: var(--text-secondary);">ODDS</span>
                        <p style="margin: 4px 0 0; font-weight: 600; font-size: 14px;">
                            ${odds > 0 ? '+' : ''}${odds}
                        </p>
                    </div>
                    <div>
                        <span style="color: var(--text-secondary);">CONFIDENCE</span>
                        <p style="margin: 4px 0 0; font-weight: 600; font-size: 14px; color: #667eea;">
                            ${confidence}%
                        </p>
                    </div>
                </div>

                <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 12px; color: var(--text-secondary);">
                        <i class="fas fa-lightbulb"></i>
                        <strong>Analysis:</strong> ${reasoning}
                    </p>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary" style="flex: 1; font-size: 12px;">
                        <i class="fas fa-bookmark"></i> Save
                    </button>
                    <button class="btn btn-primary" style="flex: 1; font-size: 12px;">
                        <i class="fas fa-plus"></i> Add to Slip
                    </button>
                </div>
            </div>
        `;
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
    }
};

// Export globally
window.aiCoachPicks = aiCoachPicks;
