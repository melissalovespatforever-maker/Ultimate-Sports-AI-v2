/**
 * SocialShareManager - Handles sharing of betting slips, consensus stats, and game highlights.
 * Supports native sharing API and fallback to clipboard/modal.
 */
export class SocialShareManager {
    constructor() {
        this.shareModal = null;
        this.init();
    }

    init() {
        this.createShareModal();
    }

    createShareModal() {
        if (document.getElementById('social-share-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'social-share-modal';
        modal.className = 'share-modal-overlay';
        modal.innerHTML = `
            <div class="share-modal">
                <div class="share-header">
                    <h3><i class="fas fa-share-alt"></i> Share to Social</h3>
                    <button class="close-share-btn" onclick="window.socialShareManager.closeModal()">✕</button>
                </div>
                <div class="share-preview" id="share-preview-content">
                    <!-- Dynamic Content -->
                </div>
                <div class="share-options">
                    <button class="share-btn twitter" onclick="window.socialShareManager.shareTo('twitter')">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                    <button class="share-btn facebook" onclick="window.socialShareManager.shareTo('facebook')">
                        <i class="fab fa-facebook-f"></i> Facebook
                    </button>
                    <button class="share-btn whatsapp" onclick="window.socialShareManager.shareTo('whatsapp')">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button class="share-btn copy" onclick="window.socialShareManager.copyToClipboard()">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.shareModal = modal;
    }

    /**
     * Open share modal with specific content
     * @param {Object} data - { title, text, type: 'slip'|'consensus'|'game', details: {} }
     */
    openShare(data) {
        this.currentShareData = data;
        const previewEl = document.getElementById('share-preview-content');
        
        if (data.type === 'slip') {
            this.renderSlipPreview(previewEl, data.details);
        } else if (data.type === 'consensus') {
            this.renderConsensusPreview(previewEl, data.details);
        } else if (data.type === 'player') {
            this.renderPlayerPreview(previewEl, data.details);
        } else if (data.type === 'roster') {
            this.renderRosterPreview(previewEl, data.details);
        } else {
            previewEl.innerHTML = `<div class="generic-preview">${data.text}</div>`;
        }

        this.shareModal.classList.add('visible');
    }

    renderPlayerPreview(container, player) {
        container.innerHTML = `
            <div class="player-share-card tier-${player.tier} ${player.isEvolved ? 'evolved' : ''}">
                <div class="share-card-header">
                    <span class="share-tier">${player.tier.toUpperCase()}</span>
                    <span class="share-level">LVL ${player.level}</span>
                </div>
                <div class="share-card-body">
                    <div class="share-overall">${player.overall}</div>
                    <div class="share-name">${player.name}</div>
                    <div class="share-pos">${player.position}</div>
                </div>
                <div class="share-card-footer">
                    Ultimate Sports AI • Football Sim
                </div>
            </div>
        `;
    }

    renderRosterPreview(container, data) {
        const players = data.players || [];
        container.innerHTML = `
            <div class="roster-share-card">
                <div class="roster-share-header">
                    <div class="roster-team-info">
                        <img src="${data.logoUrl}" class="roster-logo">
                        <h3>${data.teamName}</h3>
                    </div>
                    <div class="roster-stats">
                        <span>OFF: ${data.offense}</span>
                        <span>DEF: ${data.defense}</span>
                    </div>
                </div>
                <div class="roster-grid-mini">
                    ${players.map(p => `
                        <div class="mini-player-pill tier-${p.tier}">
                            <span class="mini-pos">${p.position}</span>
                            <span class="mini-name">${p.name}</span>
                            <span class="mini-ovr">${p.overall}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="share-card-footer">
                    Ultimate Sports AI • Build Your Dynasty
                </div>
            </div>
        `;
    }

    closeModal() {
        this.shareModal.classList.remove('visible');
    }

    renderSlipPreview(container, slip) {
        container.innerHTML = `
            <div class="slip-share-card">
                <div class="slip-header">
                    <span class="slip-type">${slip.legs.length}-Leg Parlay</span>
                    <span class="slip-payout">Potential: $${slip.payout}</span>
                </div>
                <div class="slip-legs">
                    ${slip.legs.map(leg => `
                        <div class="slip-leg-row">
                            <span class="leg-match">${leg.game}</span>
                            <span class="leg-pick">${leg.selection} (${leg.americanOdds > 0 ? '+' : ''}${leg.americanOdds})</span>
                        </div>
                    `).join('')}
                </div>
                <div class="slip-footer">
                    <span class="platform-tag">Ultimate Sports AI</span>
                </div>
            </div>
        `;
    }

    renderConsensusPreview(container, data) {
        container.innerHTML = `
            <div class="consensus-share-card">
                <div class="consensus-header">
                    <h4>Public Consensus Alert 🚨</h4>
                </div>
                <div class="consensus-details">
                    <div class="consensus-match">${data.awayTeam} @ ${data.homeTeam}</div>
                    <div class="consensus-stat">
                        <span class="highlight">${data.dominantPercent}%</span> of public is on
                        <span class="team-name">${data.dominantTeam}</span>
                    </div>
                </div>
                <div class="consensus-footer">
                    <span>Bet against the public? 🤔</span>
                </div>
            </div>
        `;
    }

    shareTo(platform) {
        const text = encodeURIComponent(this.currentShareData.text);
        const url = encodeURIComponent(window.location.href);
        let shareUrl = '';

        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${text}%20${url}`;
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }

    copyToClipboard() {
        const text = `${this.currentShareData.text} \n${window.location.href}`;
        navigator.clipboard.writeText(text).then(() => {
            if (typeof showToast === 'function') {
                showToast('Copied to clipboard!', 'success');
            }
        });
    }
}

// Initialize
window.socialShareManager = new SocialShareManager();
