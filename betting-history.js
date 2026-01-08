/**
 * ============================================
 * BETTING HISTORY SYSTEM
 * Comprehensive bet tracking with live updates
 * ============================================
 */

console.log('📊 Loading Betting History System');

class BettingHistorySystem {
    constructor() {
        this.allBets = [];
        this.filteredBets = [];
        this.currentFilter = 'all';
        this.currentSort = 'date-desc';
        this.currentPage = 1;
        this.betsPerPage = 20;
        this.searchQuery = '';
        this.updateInterval = null;
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.loadAllBets();
        this.setupEventListeners();
        this.startLiveUpdates();
        console.log('✅ Betting History System Ready');
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterBets();
            });
        });

        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterBets();
            });
        }

        // Sort
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.sortBets();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.querySelector('i').style.animation = 'spin 0.5s linear';
                this.loadAllBets();
                setTimeout(() => {
                    refreshBtn.querySelector('i').style.animation = '';
                }, 500);
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                document.getElementById('export-modal').classList.add('active');
            });
        }

        // Clear bet slip (if on live betting page)
        const clearSlipBtn = document.getElementById('clear-bet-slip');
        if (clearSlipBtn) {
            clearSlipBtn.addEventListener('click', () => {
                if (window.liveBettingSystem) {
                    window.liveBettingSystem.clearBetSlip();
                }
            });
        }
    }

    loadAllBets() {
        const bets = [];

        // Load from localStorage (persistent betting history)
        try {
            const historyKey = 'betting_history';
            const storedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            bets.push(...storedHistory);
            console.log(`📚 Loaded ${storedHistory.length} bets from history`);
        } catch (error) {
            console.error('Error loading betting history:', error);
        }

        // Load live bets from liveBettingSystem (currently active)
        if (window.liveBettingSystem && window.liveBettingSystem.activeBets) {
            window.liveBettingSystem.activeBets.forEach((bet, id) => {
                // Check if not already in history
                if (!bets.find(b => b.id === id)) {
                    bets.push({
                        ...bet,
                        id,
                        type: 'live',
                        status: this.checkBetStatus(bet)
                    });
                }
            });
        }

        // Load transaction history (bets placed through AI coaches)
        if (window.globalState) {
            const transactions = window.globalState.getTransactionHistory() || [];
            transactions.forEach((tx, index) => {
                if (tx.type === 'bet_placed' || tx.type === 'live_bet' || tx.metadata?.type === 'live_bet') {
                    bets.push({
                        id: `tx-${index}`,
                        type: tx.type === 'live_bet' || tx.metadata?.type === 'live_bet' ? 'live' : 'standard',
                        status: 'pending',
                        stake: Math.abs(tx.amount),
                        odds: tx.metadata?.odds || 2.00,
                        match: tx.description || 'Unknown Match',
                        selection: tx.metadata?.selection || 'Unknown',
                        market: tx.metadata?.market || 'Unknown',
                        placedAt: tx.timestamp,
                        gameId: tx.metadata?.gameId,
                        sport: this.detectSport(tx.description),
                        ...tx.metadata
                    });
                }
            });
        }

        // Simulate some bet settlements for demo (in production, this comes from backend)
        this.simulateSettlements(bets);

        this.allBets = bets;
        this.filterBets();
        this.updateStatistics();
    }

    simulateSettlements(bets) {
        // Randomly settle some older bets for demonstration
        const now = Date.now();
        bets.forEach(bet => {
            const betAge = now - bet.placedAt;
            const hoursSincePlaced = betAge / (1000 * 60 * 60);
            
            // Settle bets older than 2 hours randomly
            if (hoursSincePlaced > 2 && bet.status === 'pending' && Math.random() > 0.5) {
                const won = Math.random() > 0.45; // 55% win rate for demo
                bet.status = won ? 'won' : 'lost';
                bet.settledAt = now - Math.random() * 1000 * 60 * 60; // Random time in last hour
                
                if (won) {
                    bet.payout = bet.stake * bet.odds;
                    bet.profit = bet.payout - bet.stake;
                } else {
                    bet.payout = 0;
                    bet.profit = -bet.stake;
                }
            }
        });
    }

    checkBetStatus(bet) {
        // Check if bet should be settled based on game status
        // This would integrate with real-time score updates in production
        if (bet.status === 'won' || bet.status === 'lost') {
            return bet.status;
        }

        // Check if game is live
        if (window.liveBettingSystem) {
            const liveGames = window.liveBettingSystem.liveGames || [];
            const game = liveGames.find(g => g.id === bet.gameId);
            
            if (game && game.status === 'STATUS_FINAL') {
                // Game finished - settle bet (simplified logic)
                return 'pending'; // Would check actual result in production
            }
        }

        return bet.status || 'pending';
    }

    detectSport(description) {
        const desc = description.toLowerCase();
        if (desc.includes('nfl') || desc.includes('football')) return 'football';
        if (desc.includes('nba') || desc.includes('basketball')) return 'basketball';
        if (desc.includes('mlb') || desc.includes('baseball')) return 'baseball';
        if (desc.includes('nhl') || desc.includes('hockey')) return 'hockey';
        if (desc.includes('soccer') || desc.includes('epl')) return 'soccer';
        return 'general';
    }

    filterBets() {
        let filtered = [...this.allBets];

        // Apply status filter
        if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'live') {
                filtered = filtered.filter(bet => bet.type === 'live' && bet.status === 'pending');
            } else {
                filtered = filtered.filter(bet => bet.status === this.currentFilter);
            }
        }

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(bet => {
                const searchStr = `${bet.match} ${bet.selection} ${bet.sport} ${bet.market}`.toLowerCase();
                return searchStr.includes(this.searchQuery);
            });
        }

        this.filteredBets = filtered;
        this.sortBets();
    }

    sortBets() {
        const sorted = [...this.filteredBets];

        switch(this.currentSort) {
            case 'date-desc':
                sorted.sort((a, b) => b.placedAt - a.placedAt);
                break;
            case 'date-asc':
                sorted.sort((a, b) => a.placedAt - b.placedAt);
                break;
            case 'stake-desc':
                sorted.sort((a, b) => b.stake - a.stake);
                break;
            case 'stake-asc':
                sorted.sort((a, b) => a.stake - b.stake);
                break;
            case 'payout-desc':
                sorted.sort((a, b) => (b.payout || 0) - (a.payout || 0));
                break;
            case 'payout-asc':
                sorted.sort((a, b) => (a.payout || 0) - (b.payout || 0));
                break;
        }

        this.filteredBets = sorted;
        this.renderBets();
    }

    renderBets() {
        const container = document.getElementById('bets-list');
        if (!container) return;

        if (this.filteredBets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No Bets Found</h3>
                    <p>Try adjusting your filters or placing your first bet!</p>
                </div>
            `;
            return;
        }

        // Pagination
        const startIndex = (this.currentPage - 1) * this.betsPerPage;
        const endIndex = startIndex + this.betsPerPage;
        const paginatedBets = this.filteredBets.slice(startIndex, endIndex);

        container.innerHTML = paginatedBets.map(bet => this.renderBetCard(bet)).join('');
        this.renderPagination();

        // Add click listeners
        container.querySelectorAll('.bet-item').forEach(item => {
            item.addEventListener('click', () => {
                const betId = item.dataset.betId;
                this.showBetDetails(betId);
            });
        });
    }

    renderBetCard(bet) {
        const isLive = bet.type === 'live' && bet.status === 'pending';
        const statusClass = isLive ? 'live' : bet.status;
        const timestamp = new Date(bet.placedAt).toLocaleString();
        const potentialPayout = (bet.stake * bet.odds).toFixed(0);
        const profit = bet.profit !== undefined ? bet.profit.toFixed(0) : (bet.stake * (bet.odds - 1)).toFixed(0);

        return `
            <div class="bet-item ${statusClass}" data-bet-id="${bet.id}">
                <div class="bet-item-header">
                    <div class="bet-info">
                        <div class="bet-type">
                            <span>${this.getSportEmoji(bet.sport)} ${bet.sport?.toUpperCase() || 'GENERAL'}</span>
                            ${isLive ? '<span class="live-badge">LIVE</span>' : ''}
                        </div>
                        <div class="bet-match">${bet.match || 'Unknown Match'}</div>
                        <div class="bet-selection">${bet.selection || bet.market || 'Unknown Selection'}</div>
                    </div>
                    <div class="bet-status-badge ${statusClass}">
                        ${this.getStatusIcon(statusClass)} ${statusClass.toUpperCase()}
                    </div>
                </div>

                <div class="bet-item-body">
                    <div class="bet-metric">
                        <div class="bet-metric-label">Stake</div>
                        <div class="bet-metric-value">${bet.stake.toLocaleString()} coins</div>
                    </div>
                    <div class="bet-metric">
                        <div class="bet-metric-label">Odds</div>
                        <div class="bet-metric-value">${this.formatOdds(bet.odds)}</div>
                    </div>
                    <div class="bet-metric">
                        <div class="bet-metric-label">${bet.status === 'pending' ? 'Potential' : 'Actual'} Payout</div>
                        <div class="bet-metric-value">${bet.payout !== undefined ? bet.payout.toLocaleString() : potentialPayout.toLocaleString()} coins</div>
                    </div>
                    <div class="bet-metric">
                        <div class="bet-metric-label">Profit/Loss</div>
                        <div class="bet-metric-value ${bet.profit > 0 ? 'positive' : bet.profit < 0 ? 'negative' : ''}">
                            ${bet.profit !== undefined ? (bet.profit > 0 ? '+' : '') + bet.profit.toLocaleString() : '+' + profit.toLocaleString()} coins
                        </div>
                    </div>
                </div>

                <div class="bet-item-footer">
                    <div class="bet-timestamp">
                        <i class="fas fa-clock"></i>
                        ${timestamp}
                    </div>
                    <div class="bet-actions">
                        <button class="btn-action" onclick="event.stopPropagation(); window.bettingHistory.shareBet('${bet.id}')">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderPagination() {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredBets.length / this.betsPerPage);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `
            <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.bettingHistory.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Show page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="${i === this.currentPage ? 'active' : ''}" onclick="window.bettingHistory.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span style="color: var(--text-muted);">...</span>';
            }
        }

        html += `
            <button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="window.bettingHistory.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        container.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderBets();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateStatistics() {
        const total = this.allBets.length;
        const pending = this.allBets.filter(b => b.status === 'pending').length;
        const won = this.allBets.filter(b => b.status === 'won').length;
        const lost = this.allBets.filter(b => b.status === 'lost').length;
        const live = this.allBets.filter(b => b.type === 'live' && b.status === 'pending').length;

        const settled = won + lost;
        const winRate = settled > 0 ? ((won / settled) * 100).toFixed(1) : 0;

        const totalStaked = this.allBets.reduce((sum, b) => sum + b.stake, 0);
        const totalReturns = this.allBets.filter(b => b.status === 'won').reduce((sum, b) => sum + (b.payout || 0), 0);
        const profit = totalReturns - this.allBets.filter(b => b.status === 'won' || b.status === 'lost').reduce((sum, b) => sum + b.stake, 0);
        const roi = totalStaked > 0 ? ((profit / totalStaked) * 100).toFixed(1) : 0;

        const pendingAmount = this.allBets.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.stake, 0);

        // Update UI
        document.getElementById('total-bets').textContent = total;
        document.getElementById('pending-bets').textContent = pending;
        document.getElementById('pending-amount').textContent = `${pendingAmount.toLocaleString()} coins at risk`;
        document.getElementById('won-bets').textContent = won;
        document.getElementById('win-rate').textContent = `${winRate}% Win Rate`;
        document.getElementById('lost-bets').textContent = lost;
        document.getElementById('profit-amount').textContent = `${profit > 0 ? '+' : ''}${profit.toLocaleString()}`;
        document.getElementById('roi').textContent = `${roi > 0 ? '+' : ''}${roi}% ROI`;
        document.getElementById('live-bets').textContent = live;

        // Update profit color
        const profitCard = document.querySelector('.stat-profit');
        if (profitCard) {
            profitCard.querySelector('.stat-icon').style.background = 
                profit > 0 ? 'rgba(16, 185, 129, 0.15)' : 
                profit < 0 ? 'rgba(239, 68, 68, 0.15)' : 
                'rgba(59, 130, 246, 0.15)';
            profitCard.querySelector('.stat-icon').style.color = 
                profit > 0 ? 'var(--success)' : 
                profit < 0 ? 'var(--danger)' : 
                'var(--info)';
        }
    }

    showBetDetails(betId) {
        const bet = this.allBets.find(b => b.id === betId);
        if (!bet) return;

        const modal = document.getElementById('bet-details-modal');
        const content = document.getElementById('bet-details-content');

        const isLive = bet.type === 'live' && bet.status === 'pending';
        const timestamp = new Date(bet.placedAt).toLocaleString();
        const settledTime = bet.settledAt ? new Date(bet.settledAt).toLocaleString() : 'N/A';

        content.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div>
                        <h3 style="margin: 0 0 8px; font-size: 20px;">${bet.match || 'Unknown Match'}</h3>
                        <p style="color: var(--text-muted); margin: 0; font-size: 14px;">
                            ${this.getSportEmoji(bet.sport)} ${bet.sport?.toUpperCase() || 'GENERAL'} • ${bet.market || 'Standard'}
                        </p>
                    </div>
                    <span class="bet-status-badge ${isLive ? 'live' : bet.status}">
                        ${this.getStatusIcon(isLive ? 'live' : bet.status)} ${(isLive ? 'LIVE' : bet.status).toUpperCase()}
                    </span>
                </div>
                <div style="padding: 16px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; border-left: 3px solid var(--primary);">
                    <strong style="color: var(--primary);">Selection:</strong> ${bet.selection || 'Unknown'}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
                <div style="background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 10px;">
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">STAKE</div>
                    <div style="font-size: 22px; font-weight: 700;">${bet.stake.toLocaleString()} coins</div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 10px;">
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">ODDS</div>
                    <div style="font-size: 22px; font-weight: 700;">${this.formatOdds(bet.odds)}</div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 10px;">
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">${bet.status === 'pending' ? 'POTENTIAL' : 'ACTUAL'} PAYOUT</div>
                    <div style="font-size: 22px; font-weight: 700;">${(bet.payout !== undefined ? bet.payout : bet.stake * bet.odds).toLocaleString()} coins</div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 10px;">
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">PROFIT/LOSS</div>
                    <div style="font-size: 22px; font-weight: 700; color: ${bet.profit > 0 ? 'var(--success)' : bet.profit < 0 ? 'var(--danger)' : 'var(--text-primary)'};">
                        ${bet.profit !== undefined ? (bet.profit > 0 ? '+' : '') + bet.profit.toLocaleString() : '+' + (bet.stake * (bet.odds - 1)).toFixed(0)} coins
                    </div>
                </div>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 10px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                    <div>
                        <strong style="color: var(--text-muted);">Bet ID:</strong><br>
                        <code style="color: var(--text-primary);">${bet.id}</code>
                    </div>
                    <div>
                        <strong style="color: var(--text-muted);">Bet Type:</strong><br>
                        ${isLive ? '🔴 Live In-Game' : '📋 Pre-Game'}
                    </div>
                    <div>
                        <strong style="color: var(--text-muted);">Placed At:</strong><br>
                        ${timestamp}
                    </div>
                    <div>
                        <strong style="color: var(--text-muted);">Settled At:</strong><br>
                        ${settledTime}
                    </div>
                </div>
            </div>

            ${isLive ? `
                <div style="background: linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%); padding: 16px; border-radius: 10px; border: 1px solid rgba(245, 87, 108, 0.3); margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <i class="fas fa-bolt" style="color: #f5576c;"></i>
                        <strong>Live Bet Tracking</strong>
                    </div>
                    <p style="margin: 0; font-size: 13px; color: var(--text-muted);">
                        This bet is being tracked in real-time. Settlement will occur automatically when the game concludes.
                    </p>
                </div>
            ` : ''}

            <div style="display: flex; gap: 12px;">
                <button class="btn-export" onclick="window.bettingHistory.shareBet('${bet.id}')" style="flex: 1;">
                    <i class="fas fa-share-alt"></i>
                    Share Bet
                </button>
                ${bet.status === 'pending' ? `
                    <button class="btn-refresh" onclick="window.bettingHistory.cancelBet('${bet.id}')" style="background: var(--danger);">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
    }

    shareBet(betId) {
        const bet = this.allBets.find(b => b.id === betId);
        if (!bet) return;

        const shareText = `🎯 ${bet.match}\n💰 Stake: ${bet.stake} coins @ ${this.formatOdds(bet.odds)}\n📊 Status: ${bet.status.toUpperCase()}\n\n#UltimateSportsAI #SportsBetting`;

        if (navigator.share) {
            navigator.share({
                title: 'My Bet - Ultimate Sports AI',
                text: shareText
            }).catch(() => {});
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Bet details copied to clipboard!');
            });
        }
    }

    cancelBet(betId) {
        if (!confirm('Are you sure you want to cancel this bet? Stake will be refunded.')) return;

        // In production, this would call the backend API
        const betIndex = this.allBets.findIndex(b => b.id === betId);
        if (betIndex !== -1) {
            const bet = this.allBets[betIndex];
            
            // Refund stake
            if (window.globalState) {
                window.globalState.addCoins(bet.stake, 'Bet Cancelled - Refund', { betId });
            }

            // Remove from active bets
            if (window.liveBettingSystem && window.liveBettingSystem.activeBets) {
                window.liveBettingSystem.activeBets.delete(betId);
            }

            // Remove from list
            this.allBets.splice(betIndex, 1);
            
            // Refresh display
            this.filterBets();
            this.updateStatistics();
            
            // Close modal
            document.getElementById('bet-details-modal').classList.remove('active');

            alert('Bet cancelled successfully! Stake refunded.');
        }
    }

    exportData(format) {
        const data = this.filteredBets;

        switch(format) {
            case 'csv':
                this.exportCSV(data);
                break;
            case 'json':
                this.exportJSON(data);
                break;
            case 'pdf':
                this.exportPDF(data);
                break;
        }

        document.getElementById('export-modal').classList.remove('active');
    }

    exportCSV(data) {
        const headers = ['Date', 'Match', 'Selection', 'Type', 'Sport', 'Stake', 'Odds', 'Payout', 'Profit', 'Status'];
        const rows = data.map(bet => [
            new Date(bet.placedAt).toISOString(),
            bet.match || 'Unknown',
            bet.selection || 'Unknown',
            bet.type,
            bet.sport || 'general',
            bet.stake,
            bet.odds,
            bet.payout || bet.stake * bet.odds,
            bet.profit || (bet.stake * (bet.odds - 1)),
            bet.status
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `betting-history-${Date.now()}.csv`;
        a.click();
    }

    exportJSON(data) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `betting-history-${Date.now()}.json`;
        a.click();
    }

    exportPDF(data) {
        // Simplified PDF export (in production, use a library like jsPDF)
        alert('PDF export coming soon! Use CSV export for now.');
    }

    startLiveUpdates() {
        // Update bets every 30 seconds
        this.updateInterval = setInterval(() => {
            this.loadAllBets();
        }, 30000);
    }

    stopLiveUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Helper methods
    getSportEmoji(sport) {
        const emojis = {
            football: '🏈',
            basketball: '🏀',
            baseball: '⚾',
            hockey: '🏒',
            soccer: '⚽',
            general: '🎯'
        };
        return emojis[sport] || emojis.general;
    }

    getStatusIcon(status) {
        const icons = {
            pending: '⏳',
            won: '✅',
            lost: '❌',
            live: '🔴'
        };
        return icons[status] || '📋';
    }

    formatOdds(odds) {
        // Convert decimal odds to American format
        if (odds >= 2.0) {
            return `+${Math.round((odds - 1) * 100)}`;
        } else {
            return `-${Math.round(100 / (odds - 1))}`;
        }
    }
}

// Initialize system
if (!window.bettingHistory) {
    window.bettingHistory = new BettingHistorySystem();
}
