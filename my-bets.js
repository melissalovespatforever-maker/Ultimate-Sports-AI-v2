// ============================================
// MY BETS - Bet Management System
// Save, track, and export AI coach picks
// ============================================

console.log('📋 Loading My Bets System');

class MyBetsManager {
    constructor() {
        this.storageKey = 'my_saved_bets';
        this.bets = this.loadBets();
        this.currentFilter = 'all';
        this.selectedBetId = null;
        this.init();
    }

    init() {
        console.log('📋 My Bets Manager initialized');
        console.log(`📊 Loaded ${this.bets.length} saved bets`);
        
        this.setupEventListeners();
        this.updateStats();
        this.renderBets();
        this.updateLastCheckTime();
        
        // Update last check time every minute
        setInterval(() => this.updateLastCheckTime(), 60000);
        
        // Load sample bets if empty (for demo)
        if (this.bets.length === 0) {
            this.loadSampleBets();
        }
    }

    updateLastCheckTime() {
        const lastCheckElem = document.getElementById('lastCheckTime');
        if (!lastCheckElem || !window.betResultTracker) return;
        
        const status = window.betResultTracker.getStatus();
        if (status.lastCheck) {
            const timeAgo = this.formatTime(status.lastCheck);
            lastCheckElem.textContent = `• Last checked: ${timeAgo}`;
        } else {
            lastCheckElem.textContent = '• Checking soon...';
        }
    }

    // ============================================
    // DATA MANAGEMENT
    // ============================================

    loadBets() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading bets:', error);
            return [];
        }
    }

    saveBets() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.bets));
            console.log('💾 Bets saved successfully');
        } catch (error) {
            console.error('Error saving bets:', error);
        }
    }

    addBet(betData) {
        const bet = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            status: 'pending', // pending, won, lost
            ...betData
        };
        
        this.bets.unshift(bet); // Add to beginning
        this.saveBets();
        this.updateStats();
        this.renderBets();
        
        console.log('✅ Bet added:', bet);
        return bet;
    }

    updateBet(betId, updates) {
        const index = this.bets.findIndex(b => b.id === betId);
        if (index !== -1) {
            this.bets[index] = { ...this.bets[index], ...updates };
            this.saveBets();
            this.updateStats();
            this.renderBets();
            console.log('✅ Bet updated:', this.bets[index]);
        }
    }

    deleteBet(betId) {
        const index = this.bets.findIndex(b => b.id === betId);
        if (index !== -1) {
            const deleted = this.bets.splice(index, 1)[0];
            this.saveBets();
            this.updateStats();
            this.renderBets();
            console.log('🗑️ Bet deleted:', deleted);
        }
    }

    getBet(betId) {
        return this.bets.find(b => b.id === betId);
    }

    // ============================================
    // SAMPLE DATA (For Demo)
    // ============================================

    loadSampleBets() {
        const samples = [
            {
                sport: 'NBA',
                match: 'Lakers vs Warriors',
                pick: 'Lakers -3.5',
                odds: '-110',
                stake: '$50',
                potentialWin: '$95.45',
                coach: 'The Analyst',
                confidence: '87%',
                reasoning: 'Lakers have won 5 straight at home. Warriors missing key player.',
                gameTime: 'Today at 7:00 PM EST',
                status: 'pending'
            },
            {
                sport: 'NFL',
                match: 'Chiefs vs Bills',
                pick: 'Over 52.5',
                odds: '-105',
                stake: '$100',
                potentialWin: '$195.24',
                coach: 'Sharp Shooter',
                confidence: '92%',
                reasoning: 'Both offenses ranked top 3 in scoring. Weather conditions favorable.',
                gameTime: 'Tomorrow at 1:00 PM EST',
                status: 'pending'
            },
            {
                sport: 'MLB',
                match: 'Yankees vs Red Sox',
                pick: 'Yankees ML',
                odds: '-150',
                stake: '$75',
                potentialWin: '$125',
                coach: 'Data Dragon',
                confidence: '78%',
                reasoning: 'Yankees ace on the mound. Red Sox struggling against lefties.',
                gameTime: 'Yesterday at 7:05 PM EST',
                status: 'won'
            }
        ];

        samples.forEach(sample => this.addBet(sample));
        console.log('📦 Loaded 3 sample bets for demo');
    }

    // ============================================
    // UI RENDERING
    // ============================================

    updateStats() {
        const total = this.bets.length;
        const pending = this.bets.filter(b => b.status === 'pending').length;
        const won = this.bets.filter(b => b.status === 'won').length;
        const lost = this.bets.filter(b => b.status === 'lost').length;

        document.getElementById('totalBets').textContent = total;
        document.getElementById('pendingBets').textContent = pending;
        document.getElementById('wonBets').textContent = won;
        document.getElementById('lostBets').textContent = lost;
    }

    renderBets() {
        const container = document.getElementById('betsContainer');
        const emptyState = document.getElementById('emptyState');
        
        let filteredBets = this.filterBets(this.currentFilter);
        
        if (filteredBets.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        container.innerHTML = filteredBets.map(bet => `
            <div class="bet-card ${bet.status}" onclick="myBetsManager.openBetModal('${bet.id}')">
                <div class="bet-header">
                    <div class="bet-title">
                        <div class="bet-sport">
                            <i class="fas fa-basketball-ball"></i> ${bet.sport}
                        </div>
                        <div class="bet-match">${bet.match}</div>
                        <div class="bet-pick">
                            <i class="fas fa-check"></i> ${bet.pick}
                        </div>
                    </div>
                    <div class="bet-status ${bet.status}">
                        ${bet.status}
                    </div>
                </div>
                
                <div class="bet-details">
                    <div class="bet-detail-item">
                        <div class="bet-detail-label">Odds</div>
                        <div class="bet-detail-value">${bet.odds}</div>
                    </div>
                    <div class="bet-detail-item">
                        <div class="bet-detail-label">Stake</div>
                        <div class="bet-detail-value">${bet.stake}</div>
                    </div>
                    <div class="bet-detail-item">
                        <div class="bet-detail-label">Potential Win</div>
                        <div class="bet-detail-value">${bet.potentialWin}</div>
                    </div>
                    <div class="bet-detail-item">
                        <div class="bet-detail-label">Confidence</div>
                        <div class="bet-detail-value">${bet.confidence}</div>
                    </div>
                </div>
                
                <div class="bet-meta">
                    <div class="bet-coach">
                        <i class="fas fa-robot"></i>
                        ${bet.coach}
                    </div>
                    <div class="bet-time">
                        <i class="far fa-clock"></i>
                        ${this.formatTime(bet.timestamp)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterBets(filter) {
        let filtered = [...this.bets];
        
        switch (filter) {
            case 'pending':
                filtered = filtered.filter(b => b.status === 'pending');
                break;
            case 'won':
                filtered = filtered.filter(b => b.status === 'won');
                break;
            case 'lost':
                filtered = filtered.filter(b => b.status === 'lost');
                break;
            case 'today':
                const today = new Date().toDateString();
                filtered = filtered.filter(b => {
                    const betDate = new Date(b.timestamp).toDateString();
                    return betDate === today;
                });
                break;
            case 'all':
            default:
                // Return all
                break;
        }
        
        return filtered;
    }

    // ============================================
    // MODAL MANAGEMENT
    // ============================================

    openBetModal(betId) {
        const bet = this.getBet(betId);
        if (!bet) return;
        
        this.selectedBetId = betId;
        const modal = document.getElementById('betDetailModal');
        const body = document.getElementById('modalBody');
        
        body.innerHTML = `
            <div style="color: white;">
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">
                        ${bet.sport}
                    </div>
                    <h2 style="margin: 0 0 10px 0;">${bet.match}</h2>
                    <div style="font-size: 18px; color: #667eea; font-weight: 600;">
                        <i class="fas fa-check"></i> ${bet.pick}
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                        <div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 5px;">Odds</div>
                            <div style="font-size: 20px; font-weight: bold;">${bet.odds}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 5px;">Stake</div>
                            <div style="font-size: 20px; font-weight: bold;">${bet.stake}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 5px;">Potential Win</div>
                            <div style="font-size: 20px; font-weight: bold; color: #4facfe;">${bet.potentialWin}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 5px;">Confidence</div>
                            <div style="font-size: 20px; font-weight: bold; color: #00f2fe;">${bet.confidence}</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                    <div style="font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 10px;">
                        <i class="fas fa-robot"></i> ${bet.coach}'s Reasoning
                    </div>
                    <div style="line-height: 1.6;">${bet.reasoning}</div>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 5px;">Game Time</div>
                            <div style="font-size: 16px;">${bet.gameTime}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 5px;">Status</div>
                            <div class="bet-status ${bet.status}">${bet.status}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    closeBetModal() {
        const modal = document.getElementById('betDetailModal');
        modal.classList.remove('active');
        this.selectedBetId = null;
    }

    openExportModal() {
        const modal = document.getElementById('exportModal');
        modal.classList.add('active');
    }

    closeExportModal() {
        const modal = document.getElementById('exportModal');
        modal.classList.remove('active');
    }

    // ============================================
    // EXPORT FUNCTIONS
    // ============================================

    exportAsJSON() {
        const dataStr = JSON.stringify(this.bets, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        this.downloadFile(dataBlob, `my-bets-${Date.now()}.json`);
        this.closeExportModal();
    }

    exportAsCSV() {
        const headers = ['Sport', 'Match', 'Pick', 'Odds', 'Stake', 'Potential Win', 'Coach', 'Confidence', 'Status', 'Time'];
        const rows = this.bets.map(bet => [
            bet.sport,
            bet.match,
            bet.pick,
            bet.odds,
            bet.stake,
            bet.potentialWin,
            bet.coach,
            bet.confidence,
            bet.status,
            this.formatTime(bet.timestamp)
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadFile(dataBlob, `my-bets-${Date.now()}.csv`);
        this.closeExportModal();
    }

    exportAsText() {
        const text = this.bets.map(bet => `
═══════════════════════════════════════
${bet.sport.toUpperCase()} - ${bet.status.toUpperCase()}
═══════════════════════════════════════
Match: ${bet.match}
Pick: ${bet.pick}
Odds: ${bet.odds}
Stake: ${bet.stake}
Potential Win: ${bet.potentialWin}
Confidence: ${bet.confidence}

AI Coach: ${bet.coach}
Reasoning: ${bet.reasoning}

Game Time: ${bet.gameTime}
Added: ${this.formatTime(bet.timestamp)}
        `).join('\n\n');
        
        const dataBlob = new Blob([text], { type: 'text/plain' });
        this.downloadFile(dataBlob, `my-bets-${Date.now()}.txt`);
        this.closeExportModal();
    }

    copyToClipboard() {
        const text = this.bets.map(bet => 
            `${bet.sport}: ${bet.match} - ${bet.pick} (${bet.odds}) - ${bet.status}`
        ).join('\n');
        
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ Bets copied to clipboard!');
            this.closeExportModal();
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('❌ Failed to copy to clipboard');
        });
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('📥 Downloaded:', filename);
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    setupEventListeners() {
        // Check Results button
        const checkResultsBtn = document.getElementById('checkResultsBtn');
        if (checkResultsBtn) {
            checkResultsBtn.addEventListener('click', async () => {
                if (window.betResultTracker) {
                    // Show loading state
                    const originalHTML = checkResultsBtn.innerHTML;
                    checkResultsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                    checkResultsBtn.disabled = true;
                    
                    try {
                        await window.betResultTracker.checkNow();
                        
                        // Success feedback
                        checkResultsBtn.innerHTML = '<i class="fas fa-check"></i> Updated!';
                        setTimeout(() => {
                            checkResultsBtn.innerHTML = originalHTML;
                            checkResultsBtn.disabled = false;
                        }, 2000);
                        
                        alert('✅ Bet results updated from ESPN!\n\nCheck your bets to see the latest results.');
                    } catch (error) {
                        console.error('Error checking results:', error);
                        checkResultsBtn.innerHTML = originalHTML;
                        checkResultsBtn.disabled = false;
                        alert('❌ Failed to check results. Please try again.');
                    }
                } else {
                    alert('⚠️ Bet tracker not loaded yet. Please refresh the page.');
                }
            });
        }
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.openExportModal();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Apply filter
                this.currentFilter = e.target.dataset.filter;
                this.renderBets();
            });
        });

        // Modal buttons
        document.getElementById('deleteBetBtn').addEventListener('click', () => {
            if (this.selectedBetId && confirm('Are you sure you want to delete this bet?')) {
                this.deleteBet(this.selectedBetId);
                this.closeBetModal();
            }
        });

        document.getElementById('updateStatusBtn').addEventListener('click', () => {
            if (this.selectedBetId) {
                this.showUpdateStatusMenu();
            }
        });
    }

    showUpdateStatusMenu() {
        const bet = this.getBet(this.selectedBetId);
        if (!bet) return;

        const newStatus = prompt(
            `Update bet status:\n\n1. Pending\n2. Won\n3. Lost\n\nEnter 1, 2, or 3:`,
            bet.status === 'pending' ? '1' : bet.status === 'won' ? '2' : '3'
        );

        if (newStatus) {
            let status;
            switch (newStatus) {
                case '1': status = 'pending'; break;
                case '2': status = 'won'; break;
                case '3': status = 'lost'; break;
                default: return;
            }

            this.updateBet(this.selectedBetId, { status });
            this.closeBetModal();
        }
    }

    // ============================================
    // UTILITIES
    // ============================================

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return date.toLocaleDateString();
        } else if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

function closeBetModal() {
    myBetsManager.closeBetModal();
}

function closeExportModal() {
    myBetsManager.closeExportModal();
}

function exportAsJSON() {
    myBetsManager.exportAsJSON();
}

function exportAsCSV() {
    myBetsManager.exportAsCSV();
}

function exportAsText() {
    myBetsManager.exportAsText();
}

function copyToClipboard() {
    myBetsManager.copyToClipboard();
}

// ============================================
// PUBLIC API FOR ADDING BETS FROM OTHER PAGES
// ============================================

window.addBetToMyBets = function(betData) {
    if (!window.myBetsManager) {
        console.warn('My Bets Manager not initialized yet');
        return null;
    }
    return window.myBetsManager.addBet(betData);
};

// ============================================
// INITIALIZATION
// ============================================

let myBetsManager;

document.addEventListener('DOMContentLoaded', () => {
    myBetsManager = new MyBetsManager();
    window.myBetsManager = myBetsManager; // Make globally accessible
});

console.log('✅ My Bets system loaded');
