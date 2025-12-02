// ============================================
// SUBSCRIPTION MODULE - SIMPLE PAYMENT FLOW
// Handle subscription upgrades and tiers
// ============================================

console.log('💳 Loading Subscription Module');

class SubscriptionManager {
    constructor() {
        this.currentTier = 'free';
        this.pendingUpgrade = null;
        this.init();
    }

    init() {
        this.setupSubscriptionButtons();
        this.updateSubscriptionDisplay();
        
        // Subscribe to auth state changes
        appState.subscribe(() => this.updateSubscriptionDisplay());
    }

    setupSubscriptionButtons() {
        // Pro subscription button
        document.getElementById('subscribe-pro-btn')?.addEventListener('click', () => {
            this.initiateUpgrade('pro', 49.99);
        });

        // VIP subscription button
        document.getElementById('subscribe-vip-btn')?.addEventListener('click', () => {
            this.initiateUpgrade('vip', 99.99);
        });
    }

    updateSubscriptionDisplay() {
        const user = appState.user;
        
        if (!user) {
            this.currentTier = 'free';
            return;
        }

        this.currentTier = user.subscription_tier || user.subscription || 'free';
        this.updateTierUI();
    }

    updateTierUI() {
        // Update button states based on current tier
        const proBtn = document.getElementById('subscribe-pro-btn');
        const vipBtn = document.getElementById('subscribe-vip-btn');

        if (proBtn) {
            if (this.currentTier === 'pro') {
                proBtn.textContent = 'Current Plan';
                proBtn.disabled = true;
                proBtn.style.opacity = '0.6';
            } else {
                proBtn.textContent = 'Upgrade to PRO';
                proBtn.disabled = false;
                proBtn.style.opacity = '1';
            }
        }

        if (vipBtn) {
            if (this.currentTier === 'vip') {
                vipBtn.textContent = 'Current Plan';
                vipBtn.disabled = true;
                vipBtn.style.opacity = '0.6';
            } else {
                vipBtn.textContent = 'Upgrade to VIP';
                vipBtn.disabled = false;
                vipBtn.style.opacity = '1';
            }
        }
    }

    async initiateUpgrade(tier, amount) {
        console.log(`💳 Initiating ${tier.toUpperCase()} upgrade: $${amount}`);

        // Check if user is logged in
        if (!appState.isAuthenticated) {
            showToast('Please sign in to upgrade', 'error');
            navigation.navigateTo('auth');
            return;
        }

        // Don't downgrade
        if (this.shouldPreventDowngrade(tier)) {
            showToast('You can only upgrade, not downgrade', 'error');
            return;
        }

        // Show confirmation dialog
        this.showUpgradeConfirmation(tier, amount);
    }

    shouldPreventDowngrade(newTier) {
        const tierHierarchy = { free: 0, pro: 1, vip: 2 };
        const currentLevel = tierHierarchy[this.currentTier] || 0;
        const newLevel = tierHierarchy[newTier] || 0;
        return newLevel < currentLevel;
    }

    showUpgradeConfirmation(tier, amount) {
        const tierName = tier.toUpperCase();
        const features = this.getTierFeatures(tier);

        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 16px;
        `;

        modal.innerHTML = `
            <div style="
                background: var(--bg-card);
                border-radius: 16px;
                padding: 32px;
                max-width: 500px;
                width: 100%;
                border: 1px solid var(--border-color);
            ">
                <h2 style="margin: 0 0 24px; text-align: center;">Upgrade to ${tierName}</h2>
                
                <div style="
                    background: var(--bg-tertiary);
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                ">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">
                            ${tier === 'pro' ? '👑' : '👑👑'}
                        </div>
                        <div style="font-size: 32px; font-weight: 700; color: var(--primary);">
                            $${amount}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 14px;">
                            per month
                        </div>
                    </div>

                    <div style="
                        border-top: 1px solid var(--border-color);
                        padding-top: 16px;
                    ">
                        <h3 style="margin: 0 0 12px; font-size: 14px;">Includes:</h3>
                        ${features.map(f => `
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                margin-bottom: 8px;
                                font-size: 14px;
                            ">
                                <span style="color: var(--success);">✓</span>
                                <span>${f}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button 
                        class="btn btn-secondary btn-block"
                        onclick="this.closest('div').parentElement.remove()"
                    >
                        Cancel
                    </button>
                    <button 
                        class="btn btn-primary btn-block"
                        id="confirm-upgrade-btn"
                        onclick="subscriptionManager.processUpgrade('${tier}', ${amount}, this)"
                    >
                        <i class="fas fa-check"></i> Confirm Upgrade
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    getTierFeatures(tier) {
        const features = {
            pro: [
                'Unlimited AI predictions',
                'Advanced analytics dashboard',
                'Real-time odds comparison',
                'Priority customer support',
                'Mobile app access'
            ],
            vip: [
                'Everything in PRO',
                'Exclusive AI models',
                '1-on-1 coaching sessions',
                'Early feature access',
                'VIP community access',
                'Custom alerts'
            ]
        };
        return features[tier] || [];
    }

    async processUpgrade(tier, amount, button) {
        console.log(`🔄 Processing ${tier} upgrade...`);

        // Disable button
        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            // For now, show a simple payment flow
            // In production, this would integrate with PayPal/Stripe
            
            showToast(`Upgrading to ${tier.toUpperCase()}...`, 'info');

            // Simulate API call (in production, call your backend)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock upgrade - in production, backend would handle this
            appState.user.subscription_tier = tier;
            appState.user.subscription = tier;
            appState.notify();

            showToast(`✅ Successfully upgraded to ${tier.toUpperCase()}!`, 'success');
            
            // Close modal
            button.closest('div').parentElement.remove();

            console.log(`✅ Upgraded to ${tier}`);

        } catch (error) {
            console.error('❌ Upgrade failed:', error);
            showToast(error.message || 'Upgrade failed. Please try again.', 'error');
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    async loadSubscriptionPage() {
        const container = document.getElementById('subscription-container');
        if (!container) return;

        console.log('📄 Loading subscription page');

        // Update button states
        this.updateTierUI();

        // Scroll to top
        window.scrollTo(0, 0);
    }
}

// Create global instance
const subscriptionManager = new SubscriptionManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = subscriptionManager;
}

console.log('✅ Subscription Module loaded');
