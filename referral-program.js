// ============================================
// REFERRAL PROGRAM FRONTEND
// Complete referral system with rewards tracking
// ============================================

import { API_URL } from './config.js';

class ReferralProgram {
    constructor() {
        this.referralCode = null;
        this.stats = null;
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        await this.loadReferralCode();
        await this.loadStats();
        await this.loadReferrals();
        await this.loadLeaderboard();
        this.setupEventListeners();
    }

    async loadReferralCode() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/referrals/my-code`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.referralCode = data.code;
                document.getElementById('referralCode').textContent = data.code;
            }
        } catch (error) {
            console.error('Error loading referral code:', error);
            this.showNotification('Failed to load referral code', 'error');
        }
    }

    async loadStats() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/referrals/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.stats = data.stats;
                this.displayStats();
                this.updateMilestones();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    displayStats() {
        if (!this.stats) return;

        document.getElementById('totalReferrals').textContent = this.stats.total || 0;
        document.getElementById('completedReferrals').textContent = this.stats.completed || 0;
        document.getElementById('totalCoins').textContent = 
            (this.stats.totalCoins || 0).toLocaleString();
        document.getElementById('totalXP').textContent = 
            (this.stats.totalXP || 0).toLocaleString();
    }

    updateMilestones() {
        const completed = this.stats?.completed || 0;
        const milestones = document.querySelectorAll('.milestone-item');
        
        milestones.forEach(milestone => {
            const count = parseInt(milestone.dataset.count);
            if (completed >= count) {
                milestone.classList.add('achieved');
                milestone.style.borderColor = 'var(--referral-success)';
            }
        });
    }

    async loadReferrals(status = 'all') {
        try {
            const token = localStorage.getItem('token');
            const url = status === 'all' 
                ? `${API_URL}/referrals/my-referrals`
                : `${API_URL}/referrals/my-referrals?status=${status}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.displayReferrals(data.referrals);
            }
        } catch (error) {
            console.error('Error loading referrals:', error);
        }
    }

    displayReferrals(referrals) {
        const container = document.getElementById('referralsList');
        const emptyState = document.getElementById('emptyState');

        if (!referrals || referrals.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = referrals.map(ref => this.createReferralItem(ref)).join('');
    }

    createReferralItem(referral) {
        const statusClass = referral.status.toLowerCase();
        const statusText = referral.status.charAt(0).toUpperCase() + referral.status.slice(1);
        const date = new Date(referral.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `
            <div class="referral-item">
                <div class="referral-avatar">${referral.avatar || '👤'}</div>
                <div class="referral-info">
                    <div class="referral-username">${referral.username}</div>
                    <div class="referral-date">Joined ${date}</div>
                </div>
                <div class="referral-status ${statusClass}">${statusText}</div>
                <div class="referral-rewards">
                    ${referral.coins_earned > 0 ? `
                        <div class="reward-amount">+${referral.coins_earned} 🪙</div>
                        ${referral.xp_earned > 0 ? `<div style="font-size: 0.9rem; color: var(--text-secondary);">+${referral.xp_earned} XP</div>` : ''}
                    ` : '<div style="color: var(--text-secondary);">Pending</div>'}
                </div>
            </div>
        `;
    }

    async loadLeaderboard() {
        try {
            const response = await fetch(`${API_URL}/referrals/leaderboard?limit=10`);
            const data = await response.json();

            if (data.success) {
                this.displayLeaderboard(data.leaderboard);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    displayLeaderboard(leaderboard) {
        const container = document.getElementById('leaderboardList');
        
        if (!leaderboard || leaderboard.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No data yet</p>';
            return;
        }

        container.innerHTML = leaderboard.map((user, index) => {
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'gold';
            else if (rank === 2) rankClass = 'silver';
            else if (rank === 3) rankClass = 'bronze';

            return `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">#${rank}</div>
                    <div class="leaderboard-avatar">${user.avatar || '👤'}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-username">${user.username}</div>
                        <div class="leaderboard-stats">
                            Level ${user.level} • ${parseInt(user.total_coins_earned || 0).toLocaleString()} coins earned
                        </div>
                    </div>
                    <div class="leaderboard-count">${user.successful_referrals} referrals</div>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Copy code button
        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            this.copyReferralCode();
        });

        document.getElementById('copyCodeBtnEmpty')?.addEventListener('click', () => {
            this.copyReferralCode();
        });

        // Refresh code button
        document.getElementById('refreshCodeBtn').addEventListener('click', async () => {
            await this.generateNewCode();
        });

        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                this.shareReferral(platform);
            });
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const status = e.currentTarget.dataset.status;
                this.filterReferrals(status);
            });
        });
    }

    async copyReferralCode() {
        if (!this.referralCode) {
            this.showNotification('Referral code not loaded yet', 'error');
            return;
        }

        const referralLink = `${window.location.origin}?ref=${this.referralCode}`;

        try {
            await navigator.clipboard.writeText(referralLink);
            this.showNotification('Referral link copied! 🎉', 'success');
            this.animateCopyButton();
        } catch (error) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = referralLink;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification('Referral link copied! 🎉', 'success');
        }
    }

    animateCopyButton() {
        const btn = document.getElementById('copyCodeBtn');
        const originalText = btn.querySelector('.copy-text').textContent;
        btn.querySelector('.copy-text').textContent = 'Copied!';
        btn.style.background = 'var(--referral-success)';
        
        setTimeout(() => {
            btn.querySelector('.copy-text').textContent = originalText;
            btn.style.background = 'var(--referral-primary)';
        }, 2000);
    }

    async generateNewCode() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/referrals/generate-code`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                this.referralCode = data.code;
                document.getElementById('referralCode').textContent = data.code;
                this.showNotification('New referral code generated! 🎉', 'success');
            }
        } catch (error) {
            console.error('Error generating new code:', error);
            this.showNotification('Failed to generate new code', 'error');
        }
    }

    shareReferral(platform) {
        if (!this.referralCode) return;

        const referralLink = `${window.location.origin}?ref=${this.referralCode}`;
        const text = `Join me on Ultimate Sports AI and get 300 bonus coins + 7-day PRO trial! Use my referral code: ${this.referralCode}`;

        let url;
        switch (platform) {
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent('Join Ultimate Sports AI!')}&body=${encodeURIComponent(text + '\n\n' + referralLink)}`;
                break;
        }

        if (url) {
            window.open(url, '_blank', 'width=600,height=400');
        }
    }

    filterReferrals(status) {
        this.currentFilter = status;

        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.status === status) {
                tab.classList.add('active');
            }
        });

        // Load referrals with filter
        this.loadReferrals(status === 'all' ? null : status);
    }

    showNotification(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 15px 25px;
            background: ${type === 'success' ? 'var(--referral-success)' : type === 'error' ? '#ef4444' : 'var(--referral-primary)'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideInUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ReferralProgram());
} else {
    new ReferralProgram();
}

// Check for referral code in URL on signup page
function checkReferralCodeInURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
        // Store in localStorage for signup form
        localStorage.setItem('pendingReferralCode', refCode);
        console.log('Referral code detected:', refCode);
    }
}

checkReferralCodeInURL();
