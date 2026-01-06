/**
 * ============================================
 * MYSTERY BOX SYSTEM
 * Handles rewards and animations for level-ups
 * ============================================
 */

class MysteryBoxSystem {
    constructor() {
        this.rewardPool = {
            coins: [
                { amount: 500, weight: 40, label: '500 Coins', icon: '💰' },
                { amount: 1000, weight: 25, label: '1,000 Coins', icon: '💰' },
                { amount: 2500, weight: 10, label: '2,500 Coins', icon: '💰' },
                { amount: 5000, weight: 2, label: '5,000 Coins', icon: '💰' }
            ],
            items: [
                { id: 'streak-shield', weight: 15, category: 'consumable', label: 'Streak Shield', icon: '🛡️' },
                { id: 'coin-2x', weight: 5, category: 'booster', label: '2x Coin Booster', icon: '🚀' },
                { id: 'xp-2x', weight: 3, category: 'booster', label: '2x XP Booster', icon: '⭐' },
                { id: 'jordan-1', weight: 2, category: 'avatar', label: 'Jordan 1 Icon', icon: '👟' },
                { id: 'crown', weight: 1, category: 'avatar', label: 'Ultimate Crown', icon: '👑' },
                { id: 'mega-pack', weight: 1, category: 'booster', label: 'Mega Booster Pack', icon: '🎁' }
            ]
        };

        this.init();
    }

    init() {
        console.log('🎁 Mystery Box System initialized');
        this.createStyles();
    }

    /**
     * Trigger a mystery box reward
     */
    trigger(level) {
        console.log(`🎁 Triggering level ${level} Mystery Box!`);
        
        // Pick a reward
        const reward = this.pickReward();
        
        // Show the reveal modal
        this.showRevealModal(reward, level);
    }

    pickReward() {
        // Combine pools and pick based on weight
        const fullPool = [
            ...this.rewardPool.coins.map(r => ({ ...r, type: 'coins' })),
            ...this.rewardPool.items.map(r => ({ ...r, type: 'item' }))
        ];

        const totalWeight = fullPool.reduce((sum, r) => sum + r.weight, 0);
        let random = Math.random() * totalWeight;

        for (const reward of fullPool) {
            if (random < reward.weight) return reward;
            random -= reward.weight;
        }

        return fullPool[0]; // Fallback
    }

    showRevealModal(reward, level) {
        const modalId = `mystery-box-modal-${Date.now()}`;
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'mystery-box-overlay';
        
        modal.innerHTML = `
            <div class="mystery-box-content">
                <div class="level-badge">LEVEL ${level} REACHED!</div>
                <h2 class="box-title">Mystery Reward Unlocked!</h2>
                
                <div class="box-container">
                    <img src="https://rosebud.ai/assets/Opening gold and diamond pack image display.png?k2SX" class="box-image animated-box">
                    <div class="reveal-burst"></div>
                </div>

                <div class="reward-display" style="display: none;">
                    <div class="reward-icon-container">
                        ${this.getRewardIcon(reward)}
                    </div>
                    <div class="reward-info">
                        <div class="reward-label">YOU RECEIVED</div>
                        <div class="reward-name">${reward.label}</div>
                    </div>
                    <button class="claim-btn">CLAIM REWARD</button>
                </div>

                <div class="tap-hint">TAP THE BOX TO OPEN</div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add interaction
        const box = modal.querySelector('.box-image');
        const tapHint = modal.querySelector('.tap-hint');
        const rewardDisplay = modal.querySelector('.reward-display');
        const claimBtn = modal.querySelector('.claim-btn');

        box.onclick = () => {
            if (box.classList.contains('opening')) return;
            
            box.classList.add('opening');
            tapHint.style.display = 'none';
            
            // Play sound if available
            if (window.soundEffects) window.soundEffects.playSound('victory');
            
            // Animation sequence
            setTimeout(() => {
                box.style.display = 'none';
                modal.querySelector('.reveal-burst').classList.add('active');
                rewardDisplay.style.display = 'block';
                rewardDisplay.classList.add('animate-reveal');
                
                // Fire confetti
                if (window.confetti) {
                    window.confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            }, 1000);
        };

        claimBtn.onclick = () => {
            this.grantReward(reward);
            this.closeModal(modalId);
        };
    }

    getRewardIcon(reward) {
        if (reward.type === 'coins') {
            return `<img src="https://rosebud.ai/assets/1000 ultimate coins.png?FRoU" class="reward-img">`;
        }
        
        // Try to get from asset mapping
        const assetData = window.getAssetData ? window.getAssetData(reward.id) : null;
        if (assetData && assetData.imageUrl) {
            return `<img src="${assetData.imageUrl}" class="reward-img">`;
        }
        
        return `<div class="reward-emoji">${reward.icon}</div>`;
    }

    grantReward(reward) {
        const globalState = window.globalState || window.parent?.globalState;
        if (!globalState) return;

        if (reward.type === 'coins') {
            globalState.addCoins(reward.amount, 'Level Up Reward');
        } else if (reward.type === 'item') {
            const assetData = window.getAssetData ? window.getAssetData(reward.id) : null;
            globalState.addItem({
                item_id: reward.id,
                item_name: reward.label,
                item_type: reward.category,
                quantity: 1,
                metadata: {
                    imageUrl: assetData?.imageUrl || null,
                    label: reward.label
                }
            });
            
            if (window.showToast) window.showToast(`🎁 Added ${reward.label} to inventory!`, 'success');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        }
    }

    createStyles() {
        if (document.getElementById('mystery-box-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'mystery-box-styles';
        style.textContent = `
            .mystery-box-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.9);
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.3s ease;
                font-family: 'Outfit', sans-serif;
            }

            .mystery-box-content {
                text-align: center;
                width: 100%;
                max-width: 500px;
                padding: 20px;
            }

            .level-badge {
                background: linear-gradient(90deg, #f59e0b, #fbbf24);
                color: #000;
                display: inline-block;
                padding: 8px 24px;
                border-radius: 30px;
                font-weight: 800;
                font-size: 14px;
                margin-bottom: 16px;
                box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
            }

            .box-title {
                font-size: 32px;
                font-weight: 900;
                color: #fff;
                margin: 0 0 40px;
                text-shadow: 0 5px 15px rgba(0,0,0,0.5);
            }

            .box-container {
                position: relative;
                height: 250px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 40px;
            }

            .box-image {
                width: 200px;
                height: 200px;
                object-fit: contain;
                cursor: pointer;
                filter: drop-shadow(0 10px 30px rgba(0,0,0,0.5));
                transition: transform 0.2s;
            }

            .box-image:hover { transform: scale(1.05); }

            .animated-box {
                animation: boxShake 3s infinite ease-in-out;
            }

            .opening {
                animation: boxOpen 1s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .reveal-burst {
                position: absolute;
                width: 10px; height: 10px;
                background: #fff;
                border-radius: 50%;
                opacity: 0;
                pointer-events: none;
            }

            .reveal-burst.active {
                animation: burstExpand 1s forwards;
            }

            .reward-display {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 24px;
                padding: 30px;
                margin-top: -20px;
            }

            .animate-reveal {
                animation: rewardPop 0.6s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .reward-img {
                width: 120px;
                height: 120px;
                object-fit: contain;
                margin-bottom: 20px;
                filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
            }

            .reward-emoji {
                font-size: 80px;
                margin-bottom: 20px;
            }

            .reward-label {
                font-size: 12px;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 8px;
            }

            .reward-name {
                font-size: 28px;
                font-weight: 800;
                color: #fff;
                margin-bottom: 24px;
            }

            .claim-btn {
                background: linear-gradient(135deg, #10b981, #059669);
                color: #fff;
                border: none;
                padding: 16px 48px;
                border-radius: 16px;
                font-weight: 800;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
                transition: all 0.2s;
            }

            .claim-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4);
            }

            .tap-hint {
                color: #f59e0b;
                font-weight: 700;
                letter-spacing: 1px;
                animation: pulseText 1.5s infinite;
            }

            @keyframes boxShake {
                0%, 100% { transform: rotate(0) scale(1); }
                10%, 20% { transform: rotate(-5deg) scale(1.05); }
                30%, 50%, 70% { transform: rotate(5deg) scale(1.05); }
                40%, 60% { transform: rotate(-5deg) scale(1.05); }
                80% { transform: rotate(0) scale(1); }
            }

            @keyframes boxOpen {
                0% { transform: scale(1); }
                50% { transform: scale(1.5) rotate(10deg); opacity: 0.5; }
                100% { transform: scale(3); opacity: 0; }
            }

            @keyframes burstExpand {
                0% { width: 10px; height: 10px; opacity: 1; }
                100% { width: 500px; height: 500px; opacity: 0; }
            }

            @keyframes rewardPop {
                0% { transform: scale(0.5); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }

            @keyframes pulseText {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Global instance
window.mysteryBoxSystem = new MysteryBoxSystem();
