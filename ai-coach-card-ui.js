// ============================================
// AI COACH CARD UI COMPONENT
// Individual coach display card with stats
// ============================================

const aiCoachCardUI = {
    // Render individual coach card
    renderCoachCard(coach) {
        return `
            <div class="coach-card" data-coach-id="${coach.id}">
                <div class="coach-card-header">
                    <div class="coach-avatar">${coach.avatar}</div>
                    <div class="coach-info">
                        <h3 class="coach-name">${coach.name}</h3>
                        <p class="coach-specialty">${coach.specialty}</p>
                    </div>
                    ${coach.isPremium ? '<span class="coach-tier-badge">VIP</span>' : '<span class="coach-tier-badge free">PRO</span>'}
                </div>

                <div class="coach-stats">
                    <div class="coach-stat">
                        <span class="stat-label">Accuracy</span>
                        <span class="stat-value">${coach.accuracy ? coach.accuracy.toFixed(1) : '0'}%</span>
                    </div>
                    <div class="coach-stat">
                        <span class="stat-label">Picks</span>
                        <span class="stat-value">${coach.totalPicks || 0}</span>
                    </div>
                    <div class="coach-stat">
                        <span class="stat-label">Streak</span>
                        <span class="stat-value">${coach.streak || 0}</span>
                    </div>
                </div>

                <div class="coach-picks-preview">
                    ${coach.recentPicks && coach.recentPicks.length > 0 
                        ? `<div class="picks-list">
                            ${coach.recentPicks.slice(0, 2).map(pick => `
                                <div class="pick-item">
                                    <div class="pick-info">
                                        <span class="pick-game">${pick.game}</span>
                                        <span class="pick-selection">${pick.pick}</span>
                                    </div>
                                    <div class="pick-confidence" style="width: ${pick.confidence}%"></div>
                                </div>
                            `).join('')}
                        </div>`
                        : '<p class="no-picks">No picks available</p>'
                    }
                </div>

                <button class="btn btn-primary btn-sm view-picks-btn" data-coach-id="${coach.id}">
                    <i class="fas fa-arrow-right"></i> View Analysis
                </button>
            </div>
        `;
    },

    // Render coach detail modal
    renderCoachDetail(coach) {
        return `
            <div class="modal-overlay" id="coach-detail-modal">
                <div class="modal-content coach-detail-modal">
                    <button class="modal-close-btn" id="close-modal">
                        <i class="fas fa-times"></i>
                    </button>

                    <div class="coach-detail-header">
                        <div class="coach-avatar-large">${coach.avatar}</div>
                        <h2>${coach.name}</h2>
                        <p class="coach-strategy">${coach.strategy.replace(/_/g, ' ').toUpperCase()}</p>
                    </div>

                    <div class="coach-detail-stats">
                        <div class="detail-stat">
                            <i class="fas fa-bullseye"></i>
                            <div>
                                <span class="label">Accuracy</span>
                                <span class="value">${coach.accuracy ? coach.accuracy.toFixed(1) : '0'}%</span>
                            </div>
                        </div>
                        <div class="detail-stat">
                            <i class="fas fa-check-circle"></i>
                            <div>
                                <span class="label">Total Picks</span>
                                <span class="value">${coach.totalPicks || 0}</span>
                            </div>
                        </div>
                        <div class="detail-stat">
                            <i class="fas fa-fire"></i>
                            <div>
                                <span class="label">Current Streak</span>
                                <span class="value">${coach.streak || 0}</span>
                            </div>
                        </div>
                    </div>

                    ${coach.recentPicks && coach.recentPicks.length > 0 
                        ? `<div class="coach-picks-detail">
                            <h3>Latest Picks</h3>
                            <div class="picks-grid">
                                ${coach.recentPicks.map(pick => `
                                    <div class="pick-card">
                                        <div class="pick-header">
                                            <span class="pick-game">${pick.game}</span>
                                            <span class="confidence-badge" style="background: ${pick.confidence > 75 ? '#10b981' : pick.confidence > 60 ? '#f59e0b' : '#ef4444'}">
                                                ${pick.confidence}%
                                            </span>
                                        </div>
                                        <div class="pick-body">
                                            <p class="pick-selection"><strong>${pick.pick}</strong></p>
                                            <p class="pick-odds">Odds: ${pick.odds}</p>
                                            <p class="pick-reasoning">${pick.reasoning}</p>
                                        </div>
                                        <div class="pick-time">${pick.gameTime || 'TBD'}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>`
                        : '<p class="empty-state">No picks currently available for this coach</p>'
                    }

                    <button class="btn btn-secondary btn-block" id="close-detail-btn">Close</button>
                </div>
            </div>
        `;
    },

    // Show loading state
    renderLoading() {
        return `
            <div class="coach-card loading">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text short"></div>
            </div>
        `;
    },

    // Show empty state
    renderEmpty() {
        return `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
                <h3>No AI Coaches Available</h3>
                <p>Coaches are being initialized. Please try again in a moment.</p>
            </div>
        `;
    },

    // Show error state
    renderError(error) {
        return `
            <div class="error-state">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <h3>Failed to Load Coaches</h3>
                <p>${error || 'Please check your connection and try again'}</p>
                <button class="btn btn-secondary" onclick="aiCoachesManager.render('ai-coaches-container')">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
};

console.log('✅ AI Coach Card UI loaded');
window.aiCoachCardUI = aiCoachCardUI;
