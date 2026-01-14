/**
 * ============================================
 * ULTIMATE MYSTERY BOX SYSTEM
 * High-fidelity pack opening experience
 * ============================================
 */

class MysteryBoxSystem {
    constructor() {
        this.rewardPools = {
            common: {
                coins: [
                    { amount: 250, weight: 50, label: '250 Coins', icon: '💰' },
                    { amount: 500, weight: 30, label: '500 Coins', icon: '💰' },
                    { amount: 1000, weight: 10, label: '1,000 Coins', icon: '💰' }
                ],
                items: [
                    { id: 'streak-shield', weight: 10, category: 'consumable', label: 'Streak Shield', icon: '🛡️' }
                ]
            },
            rare: {
                coins: [
                    { amount: 1000, weight: 40, label: '1,000 Coins', icon: '💰' },
                    { amount: 2500, weight: 20, label: '2,500 Coins', icon: '💰' },
                    { amount: 5000, weight: 5, label: '5,000 Coins', icon: '💰' }
                ],
                items: [
                    { id: 'coin-2x', weight: 15, category: 'booster', label: '2x Coin Booster', icon: '🚀' },
                    { id: 'xp-2x', weight: 15, category: 'booster', label: '2x XP Booster', icon: '⭐' },
                    { id: 'jordan-1', weight: 5, category: 'avatar', label: 'Jordan 1 Icon', icon: '👟' }
                ]
            },
            epic: {
                coins: [
                    { amount: 5000, weight: 30, label: '5,000 Coins', icon: '💰' },
                    { amount: 10000, weight: 15, label: '10,000 Coins', icon: '💰' }
                ],
                items: [
                    { id: 'coin-3x', weight: 20, category: 'booster', label: '3x Coin Booster', icon: '🤑' },
                    { id: 'mega-pack', weight: 15, category: 'booster', label: 'Mega Booster Pack', icon: '⚡' },
                    { id: 'king-chess', weight: 10, category: 'avatar', label: 'King Chess Piece', icon: '👑' },
                    { id: 'gotrich', weight: 10, category: 'avatar', label: 'Gotrich Baller', icon: '🏀' }
                ]
            },
            legendary: {
                coins: [
                    { amount: 25000, weight: 20, label: '25,000 Coins', icon: '💰' },
                    { amount: 50000, weight: 10, label: '50,000 Coins', icon: '💰' }
                ],
                items: [
                    { id: 'scrooge', weight: 20, category: 'avatar', label: 'High Roller', icon: '🎰' },
                    { id: 'guccii-duffel', weight: 15, category: 'avatar', label: 'Guccii Duffel', icon: '💼' },
                    { id: 'trophy-avatar', weight: 15, category: 'avatar', label: 'Golden Trophy', icon: '🏆' },
                    { id: 'crown-avatar', weight: 10, category: 'avatar', label: 'Royal Crown', icon: '👑' },
                    { id: 'golden-coin', weight: 10, category: 'permanent', label: 'Golden Diamond Coin', icon: '💰' }
                ]
            }
        };

        this.boxAssets = {
            common: 'https://rosebud.ai/assets/mystery-box-common.webp?fUcD',
            rare: 'https://rosebud.ai/assets/mystery-box-rare.webp?QVhr',
            epic: 'https://rosebud.ai/assets/mystery-box-epic.webp?wAaS',
            legendary: 'https://rosebud.ai/assets/mystery-box-legendary.webp?jP2E'
        };

        this.init();
    }

    init() {
        console.log('🎁 Mystery Box System initialized');
        this.createStyles();
    }

    /**
     * Trigger a mystery box reward based on tier
     */
    trigger(tier = 'common', context = 'Level Up!') {
        console.log(`🎁 Opening ${tier} Mystery Box! Context: ${context}`);
        
        const reward = this.pickReward(tier);
        this.showRevealModal(reward, tier, context);
    }

    pickReward(tier) {
        const pool = this.rewardPools[tier] || this.rewardPools.common;
        const fullPool = [
            ...pool.coins.map(r => ({ ...r, type: 'coins' })),
            ...pool.items.map(r => ({ ...r, type: 'item' }))
        ];

        const totalWeight = fullPool.reduce((sum, r) => sum + r.weight, 0);
        let random = Math.random() * totalWeight;

        for (const reward of fullPool) {
            if (random < reward.weight) return reward;
            random -= reward.weight;
        }

        return fullPool[0];
    }

    showRevealModal(reward, tier, context) {
        const modalId = `mystery-box-modal-${Date.now()}`;
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = `mystery-box-overlay tier-${tier}`;
        
        const boxImage = this.boxAssets[tier];

        modal.innerHTML = `
            <div class="mystery-box-content">
                <div class="tier-label">${tier.toUpperCase()} BOX</div>
                <h2 class="context-title">${context}</h2>
                
                <div class="box-visual-container">
                    <div class="glow-aura"></div>
                    <img src="${boxImage}" class="main-box-image animated-box">
                    <div class="reveal-particles"></div>
                </div>

                <div class="reward-reveal-area" style="display: none;">
                    <div class="reward-card">
                        <div class="reward-card-glow"></div>
                        <div class="reward-icon-container">
                            ${this.getRewardIcon(reward)}
                        </div>
                        <div class="reward-info">
                            <div class="reward-tier-text">${reward.type === 'coins' ? 'CURRENCY' : (reward.category || 'ITEM').toUpperCase()}</div>
                            <div class="reward-name-text">${reward.label}</div>
                        </div>
                    </div>
                    <button class="claim-reward-btn">COLLECT REWARD</button>
                </div>

                <div class="interaction-hint">TAP BOX TO REVEAL</div>
            </div>
        `;

        document.body.appendChild(modal);

        const box = modal.querySelector('.main-box-image');
        const hint = modal.querySelector('.interaction-hint');
        const rewardArea = modal.querySelector('.reward-reveal-area');
        const claimBtn = modal.querySelector('.claim-reward-btn');

        box.onclick = () => {
            if (box.classList.contains('is-opening')) return;
            
            box.classList.add('is-opening');
            hint.style.opacity = '0';
            
            if (window.soundEffects) window.soundEffects.playSound('victory');

            // Sequential animation
            setTimeout(() => {
                modal.classList.add('phase-reveal');
                box.style.display = 'none';
                rewardArea.style.display = 'flex';
                
                if (window.confetti) {
                    const colors = this.getTierColors(tier);
                    window.confetti({
                        particleCount: 200,
                        spread: 100,
                        origin: { y: 0.6 },
                        colors: colors
                    });
                }
            }, 1200);
        };

        claimBtn.onclick = () => {
            this.grantReward(reward);
            this.closeModal(modalId);
        };
    }

    getTierColors(tier) {
        switch(tier) {
            case 'legendary': return ['#ffffff', '#fbbf24', '#f59e0b', '#fff7ed'];
            case 'epic': return ['#a855f7', '#d946ef', '#7c3aed', '#ffffff'];
            case 'rare': return ['#3b82f6', '#60a5fa', '#1d4ed8', '#ffffff'];
            default: return ['#10b981', '#ffffff', '#34d399', '#059669'];
        }
    }

    getRewardIcon(reward) {
        if (reward.type === 'coins') {
            return `<img src="https://rosebud.ai/assets/1000 ultimate coins.png?FRoU" class="reward-visual">`;
        }
        
        const catalogItem = window.ITEM_CATALOG?.[reward.id];
        if (catalogItem?.metadata?.imageUrl) {
            return `<img src="${catalogItem.metadata.imageUrl}" class="reward-visual">`;
        }
        
        return `<div class="reward-emoji-visual">${reward.icon || '🎁'}</div>`;
    }

    grantReward(reward) {
        const globalState = window.globalState || window.parent?.globalState;
        const inventorySystem = window.inventorySystem || window.parent?.inventorySystem;
        
        if (!globalState) {
            console.error('❌ Global State not found for reward grant');
            return;
        }

        if (reward.type === 'coins') {
            globalState.addCoins(reward.amount, 'Mystery Box Reward');
        } else {
            const catalogItem = window.ITEM_CATALOG?.[reward.id];
            
            if (inventorySystem) {
                inventorySystem.addItem({
                    item_id: reward.id,
                    item_name: reward.label,
                    item_type: reward.category,
                    quantity: 1,
                    metadata: {
                        imageUrl: catalogItem?.metadata?.imageUrl || null,
                        icon: reward.icon
                    }
                });
            } else {
                // Fallback to globalState if inventorySystem not available
                globalState.addItem?.({
                    item_id: reward.id,
                    item_name: reward.label,
                    item_type: reward.category,
                    quantity: 1,
                    metadata: {
                        imageUrl: catalogItem?.metadata?.imageUrl || null,
                        icon: reward.icon
                    }
                });
            }
            
            if (window.showToast) window.showToast(`🎁 Received: ${reward.label}!`, 'success');
            else if (window.parent?.showToast) window.parent.showToast(`🎁 Received: ${reward.label}!`, 'success');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            setTimeout(() => modal.remove(), 400);
        }
    }

    createStyles() {
        if (document.getElementById('ultimate-mystery-box-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ultimate-mystery-box-styles';
        style.textContent = `
            .mystery-box-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: radial-gradient(circle at center, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 1) 100%);
                z-index: 200000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.4s ease;
                backdrop-filter: blur(8px);
                font-family: 'Outfit', sans-serif;
            }

            .mystery-box-content {
                width: 100%;
                max-width: 500px;
                text-align: center;
                padding: 30px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .tier-label {
                background: var(--tier-color, #10b981);
                color: #fff;
                padding: 6px 20px;
                border-radius: 40px;
                font-weight: 800;
                font-size: 13px;
                letter-spacing: 2px;
                margin-bottom: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }

            .context-title {
                color: #fff;
                font-size: 36px;
                font-weight: 900;
                margin: 0 0 40px;
                text-transform: uppercase;
                letter-spacing: -1px;
            }

            .box-visual-container {
                position: relative;
                width: 280px;
                height: 280px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 40px;
            }

            .main-box-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
                z-index: 2;
                cursor: pointer;
                filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6));
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .main-box-image:hover { transform: scale(1.08); }

            .glow-aura {
                position: absolute;
                width: 150%;
                height: 150%;
                background: radial-gradient(circle at center, var(--tier-glow, rgba(16, 185, 129, 0.3)) 0%, transparent 70%);
                border-radius: 50%;
                animation: auraPulse 3s infinite ease-in-out;
            }

            .animated-box {
                animation: boxFloat 4s infinite ease-in-out;
            }

            .is-opening {
                animation: boxOpeningSeq 1.2s forwards;
            }

            .reward-reveal-area {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 30px;
            }

            .reward-card {
                position: relative;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 32px;
                padding: 40px;
                width: 100%;
                overflow: hidden;
                animation: rewardCardPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 20px 50px rgba(0,0,0,0.4);
            }

            .reward-card-glow {
                position: absolute;
                top: -50%; left: -50%;
                width: 200%; height: 200%;
                background: conic-gradient(from 0deg, transparent, var(--tier-glow, rgba(16, 185, 129, 0.1)), transparent);
                animation: rotateGlow 10s linear infinite;
            }

            .reward-visual {
                width: 140px;
                height: 140px;
                object-fit: contain;
                margin-bottom: 24px;
                position: relative;
                z-index: 2;
                filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
            }

            .reward-emoji-visual {
                font-size: 100px;
                margin-bottom: 24px;
                position: relative;
                z-index: 2;
            }

            .reward-info {
                position: relative;
                z-index: 2;
            }

            .reward-tier-text {
                font-size: 13px;
                color: var(--tier-color, #10b981);
                font-weight: 800;
                letter-spacing: 3px;
                margin-bottom: 10px;
            }

            .reward-name-text {
                font-size: 32px;
                color: #fff;
                font-weight: 900;
                line-height: 1.1;
            }

            .claim-reward-btn {
                background: linear-gradient(135deg, var(--tier-color, #10b981), var(--tier-dark, #059669));
                color: #fff;
                border: none;
                padding: 18px 60px;
                border-radius: 20px;
                font-weight: 900;
                font-size: 18px;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                transition: all 0.2s;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .claim-reward-btn:hover {
                transform: translateY(-4px) scale(1.02);
                box-shadow: 0 15px 40px rgba(0,0,0,0.5);
            }

            .interaction-hint {
                color: var(--tier-color, #10b981);
                font-weight: 800;
                letter-spacing: 2px;
                margin-top: 20px;
                animation: hintPulse 1.5s infinite;
                transition: opacity 0.3s;
            }

            /* Tier Specifics */
            .tier-rare { --tier-color: #3b82f6; --tier-dark: #1d4ed8; --tier-glow: rgba(59, 130, 246, 0.4); }
            .tier-epic { --tier-color: #a855f7; --tier-dark: #7e22ce; --tier-glow: rgba(168, 85, 247, 0.4); }
            .tier-legendary { --tier-color: #fbbf24; --tier-dark: #b45309; --tier-glow: rgba(251, 191, 36, 0.5); }

            /* Animations */
            @keyframes boxFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-15px); }
            }

            @keyframes auraPulse {
                0%, 100% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.1); opacity: 0.5; }
            }

            @keyframes boxOpeningSeq {
                0% { transform: scale(1); }
                20% { transform: scale(1.1) rotate(-5deg); }
                40% { transform: scale(1.1) rotate(5deg); }
                60% { transform: scale(1.2) rotate(-10deg); filter: brightness(2); }
                80% { transform: scale(1.4); opacity: 0.8; }
                100% { transform: scale(2.5); opacity: 0; }
            }

            @keyframes rewardCardPop {
                0% { transform: scale(0.6) translateY(50px); opacity: 0; }
                100% { transform: scale(1) translateY(0); opacity: 1; }
            }

            @keyframes rotateGlow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes hintPulse {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Global instance
window.mysteryBoxSystem = new MysteryBoxSystem();
