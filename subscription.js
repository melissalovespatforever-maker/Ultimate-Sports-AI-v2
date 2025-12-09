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
            // ⚠️ IMPORTANT: This requires backend payment processing!
            // Step 1: Create payment session with backend
            const response = await fetch(`${api.baseURL}/api/subscriptions/create-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    tier: tier,
                    amount: amount,
                    userId: appState.user?.id
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const data = await response.json();

            // Step 2: Redirect to payment processor (Stripe/PayPal)
            if (data.checkoutUrl) {
                // Store pending upgrade for verification after payment
                localStorage.setItem('pendingUpgrade', JSON.stringify({
                    tier: tier,
                    amount: amount,
                    timestamp: Date.now()
                }));

                showToast('Redirecting to secure checkout...', 'info');
                
                // Redirect to payment page
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('No checkout URL received');
            }

        } catch (error) {
            console.error('❌ Upgrade failed:', error);
            
            // Re-enable button
            button.disabled = false;
            button.innerHTML = originalText;
            
            // Show user-friendly error
            showToast('Unable to process upgrade. Please try again or contact support.', 'error');
            
            // Close modal after delay
            setTimeout(() => {
                const modal = button.closest('div').parentElement;
                if (modal) modal.remove();
            }, 2000);
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    async loadSubscriptionPage() {
        const container = document.getElementById('subscription-container');
        if (!container) return;

        console.log('📄 Loading subscription page');

        // Check for payment success callback
        await this.checkPaymentCallback();

        // Update button states
        this.updateTierUI();

        // Scroll to top
        window.scrollTo(0, 0);
    }

    async checkPaymentCallback() {
        // Check URL for payment success parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const status = urlParams.get('status');

        if (sessionId && status === 'success') {
            console.log('💳 Payment success detected, verifying...');
            showToast('Verifying your payment...', 'info');

            try {
                // Verify payment with backend
                const response = await fetch(`${api.baseURL}/api/subscriptions/verify-payment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        sessionId: sessionId,
                        userId: appState.user?.id
                    })
                });

                if (!response.ok) {
                    throw new Error('Payment verification failed');
                }

                const data = await response.json();

                // Update user tier from backend response
                if (data.subscription && data.subscription.tier) {
                    appState.user.subscription_tier = data.subscription.tier;
                    appState.user.subscription = data.subscription.tier;
                    appState.notify();

                    // Clear pending upgrade
                    localStorage.removeItem('pendingUpgrade');

                    showToast(`🎉 Successfully upgraded to ${data.subscription.tier.toUpperCase()}!`, 'success');

                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    throw new Error('Invalid subscription data received');
                }

            } catch (error) {
                console.error('❌ Payment verification failed:', error);
                showToast('Payment verification failed. Please contact support.', 'error');
            }
        } else if (status === 'cancel') {
            showToast('Payment cancelled', 'info');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // Method to handle webhook updates from backend
    async refreshSubscriptionStatus() {
        if (!appState.user?.id) return;

        try {
            const response = await fetch(`${api.baseURL}/api/users/${appState.user.id}/subscription`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.subscription_tier) {
                    appState.user.subscription_tier = data.subscription_tier;
                    appState.user.subscription = data.subscription_tier;
                    appState.notify();
                    this.updateTierUI();
                }
            }
        } catch (error) {
            console.error('Failed to refresh subscription:', error);
        }
    }
}

// Create global instance
const subscriptionManager = new SubscriptionManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = subscriptionManager;
}

console.log('✅ Subscription Module loaded');
