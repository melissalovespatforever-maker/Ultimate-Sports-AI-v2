/**
 * VIP Subscription Manager
 * Handles recurring monthly benefits, tier perks, and subscription status
 */

import { logger } from './logger.js';

class VIPSubscriptionManager {
    constructor() {
        this.subscriptionData = null;
        this.tierBenefits = {
            bronze_monthly: {
                name: 'Bronze VIP',
                icon: '🥉',
                monthlyCoins: 5000,
                xpMultiplier: 1.5,
                questRewardBonus: 0.25,
                tournamentDiscount: 0.10,
                prioritySupport: false,
                features: ['ad_free', 'basic_ai', 'bronze_badge']
            },
            bronze_annual: {
                name: 'Bronze VIP',
                icon: '🥉',
                monthlyCoins: 5000,
                bonusCoins: 10000,
                xpMultiplier: 1.5,
                questRewardBonus: 0.25,
                tournamentDiscount: 0.10,
                prioritySupport: false,
                features: ['ad_free', 'basic_ai', 'bronze_badge']
            },
            silver_monthly: {
                name: 'Silver VIP',
                icon: '🥈',
                monthlyCoins: 15000,
                xpMultiplier: 2.0,
                questRewardBonus: 0.50,
                tournamentDiscount: 0.25,
                prioritySupport: true,
                features: ['ad_free', 'advanced_ai', 'silver_badge', 'early_access']
            },
            silver_annual: {
                name: 'Silver VIP',
                icon: '🥈',
                monthlyCoins: 15000,
                bonusCoins: 30000,
                xpMultiplier: 2.0,
                questRewardBonus: 0.50,
                tournamentDiscount: 0.25,
                prioritySupport: true,
                features: ['ad_free', 'advanced_ai', 'silver_badge', 'early_access']
            },
            gold_monthly: {
                name: 'Gold VIP',
                icon: '🥇',
                monthlyCoins: 40000,
                xpMultiplier: 3.0,
                questRewardBonus: 1.00,
                tournamentDiscount: 0.50,
                prioritySupport: true,
                features: ['ad_free', 'premium_ai', 'gold_badge', 'vip_tournaments', 'chat_colors', 'monthly_coaching']
            },
            gold_annual: {
                name: 'Gold VIP',
                icon: '🥇',
                monthlyCoins: 40000,
                bonusCoins: 80000,
                xpMultiplier: 3.0,
                questRewardBonus: 1.00,
                tournamentDiscount: 0.50,
                prioritySupport: true,
                features: ['ad_free', 'premium_ai', 'gold_badge', 'vip_tournaments', 'chat_colors', 'monthly_coaching']
            }
        };
        
        this.init();
    }

    init() {
        this.loadSubscription();
        this.checkMonthlyRenewal();
        
        // Check monthly renewal daily
        setInterval(() => this.checkMonthlyRenewal(), 24 * 60 * 60 * 1000);
        
        logger.info('VIPSubscriptionManager', 'Initialized', this.subscriptionData);
    }

    loadSubscription() {
        try {
            const stored = localStorage.getItem('vip_subscription');
            if (stored) {
                this.subscriptionData = JSON.parse(stored);
                
                // Validate subscription is still active
                if (this.subscriptionData.active && this.isSubscriptionExpired()) {
                    logger.warn('VIPSubscriptionManager', 'Subscription expired, deactivating');
                    this.deactivateSubscription();
                }
            }
        } catch (error) {
            logger.error('VIPSubscriptionManager', 'Error loading subscription', error);
        }
    }

    saveSubscription() {
        try {
            localStorage.setItem('vip_subscription', JSON.stringify(this.subscriptionData));
        } catch (error) {
            logger.error('VIPSubscriptionManager', 'Error saving subscription', error);
        }
    }

    activateSubscription(tierData, subscriptionId, billingCycle = 'monthly') {
        const now = Date.now();
        const daysToAdd = billingCycle === 'annual' ? 365 : 30;
        
        this.subscriptionData = {
            tier: tierData.name,
            tierId: tierData.id,
            subscriptionId: subscriptionId,
            monthlyCoins: tierData.monthlyCoins,
            bonusCoins: tierData.bonusCoins || 0,
            billingCycle: billingCycle,
            startDate: now,
            nextBillingDate: now + (daysToAdd * 24 * 60 * 60 * 1000),
            lastCoinCredit: now,
            active: true
        };

        this.saveSubscription();
        
        // Credit upfront bonus for annual
        if (tierData.bonusCoins) {
            this.creditCoins(tierData.bonusCoins, 'Annual subscription bonus');
        }

        // Credit first month's coins
        this.creditMonthlyCoins();

        logger.info('VIPSubscriptionManager', 'Subscription activated', this.subscriptionData);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('vipSubscriptionActivated', {
            detail: this.subscriptionData
        }));

        return true;
    }

    deactivateSubscription() {
        if (this.subscriptionData) {
            this.subscriptionData.active = false;
            this.subscriptionData.endDate = Date.now();
            this.saveSubscription();
            
            logger.info('VIPSubscriptionManager', 'Subscription deactivated');
            
            window.dispatchEvent(new CustomEvent('vipSubscriptionDeactivated', {
                detail: this.subscriptionData
            }));
        }
    }

    checkMonthlyRenewal() {
        if (!this.subscriptionData || !this.subscriptionData.active) return;

        const now = Date.now();
        const lastCredit = this.subscriptionData.lastCoinCredit;
        const daysSinceLastCredit = (now - lastCredit) / (24 * 60 * 60 * 1000);

        // Credit coins if 30+ days have passed
        if (daysSinceLastCredit >= 30) {
            logger.info('VIPSubscriptionManager', 'Monthly renewal - crediting coins');
            this.creditMonthlyCoins();
            
            // Update next billing date
            this.subscriptionData.nextBillingDate = now + (30 * 24 * 60 * 60 * 1000);
            this.saveSubscription();
        }
    }

    creditMonthlyCoins() {
        if (!this.subscriptionData || !this.subscriptionData.active) return;

        const coins = this.subscriptionData.monthlyCoins;
        
        // Log transaction for history
        import('./transaction-manager.js').then(module => {
            module.transactionManager.logTransaction({
                type: 'SUBSCRIPTION_RENEWAL',
                amount: 0, // It's a bonus credit, price was paid via subscription
                item: `Monthly VIP Bonus (${coins.toLocaleString()} Coins)`,
                metadata: { tier: this.subscriptionData.tier, tierId: this.subscriptionData.tierId }
            });
        });

        const credited = this.creditCoins(coins, 'VIP monthly bonus');

        if (credited) {
            this.subscriptionData.lastCoinCredit = Date.now();
            this.saveSubscription();
            
            // Show notification
            if (window.globalState && typeof window.globalState.showNotification === 'function') {
                window.globalState.showNotification(
                    `💎 VIP Monthly Bonus: ${coins.toLocaleString()} coins credited!`,
                    'success'
                );
            }

            // Confetti celebration
            if (window.confetti) {
                window.confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#fbbf24', '#10b981', '#6366f1']
                });
            }
        }
    }

    creditCoins(amount, description) {
        try {
            const globalState = window.globalState;
            
            if (globalState) {
                const currentBalance = globalState.getBalance();
                globalState.setBalance(currentBalance + amount);
                
                globalState.addTransaction({
                    type: 'vip_bonus',
                    amount: amount,
                    description: description,
                    timestamp: Date.now(),
                    verified: true
                });
                
                logger.info('VIPSubscriptionManager', `Credited ${amount} coins: ${description}`);
                return true;
            } else {
                // Fallback to localStorage
                const currentBalance = parseInt(localStorage.getItem('unified_balance') || '0');
                localStorage.setItem('unified_balance', (currentBalance + amount).toString());
                return true;
            }
        } catch (error) {
            logger.error('VIPSubscriptionManager', 'Error crediting coins', error);
            return false;
        }
    }

    isSubscriptionExpired() {
        if (!this.subscriptionData) return true;
        return Date.now() > this.subscriptionData.nextBillingDate;
    }

    isActive() {
        return this.subscriptionData && this.subscriptionData.active && !this.isSubscriptionExpired();
    }

    getCurrentTier() {
        if (!this.isActive()) return null;
        return this.tierBenefits[this.subscriptionData.tierId];
    }

    getTierBadge() {
        const tier = this.getCurrentTier();
        if (!tier) return null;
        
        return {
            icon: tier.icon,
            name: tier.name,
            color: this.getTierColor(this.subscriptionData.tierId)
        };
    }

    getTierColor(tierId) {
        if (tierId.startsWith('bronze')) return '#cd7f32';
        if (tierId.startsWith('silver')) return '#c0c0c0';
        if (tierId.startsWith('gold')) return '#ffd700';
        return '#ffffff';
    }

    applyXPMultiplier(baseXP) {
        const tier = this.getCurrentTier();
        if (!tier) return baseXP;
        return Math.floor(baseXP * tier.xpMultiplier);
    }

    applyQuestRewardBonus(baseReward) {
        const tier = this.getCurrentTier();
        if (!tier) return baseReward;
        return Math.floor(baseReward * (1 + tier.questRewardBonus));
    }

    applyTournamentDiscount(entryFee) {
        const tier = this.getCurrentTier();
        if (!tier) return entryFee;
        return Math.floor(entryFee * (1 - tier.tournamentDiscount));
    }

    hasFeature(featureName) {
        const tier = this.getCurrentTier();
        if (!tier) return false;
        return tier.features.includes(featureName);
    }

    hasPrioritySupport() {
        const tier = this.getCurrentTier();
        return tier ? tier.prioritySupport : false;
    }

    getSubscriptionStatus() {
        if (!this.subscriptionData) {
            return {
                active: false,
                tier: 'Free',
                icon: '👤',
                message: 'No active subscription'
            };
        }

        if (!this.isActive()) {
            return {
                active: false,
                tier: this.subscriptionData.tier,
                icon: '⏸️',
                message: 'Subscription expired'
            };
        }

        const tier = this.getCurrentTier();
        const daysUntilRenewal = Math.ceil(
            (this.subscriptionData.nextBillingDate - Date.now()) / (24 * 60 * 60 * 1000)
        );

        return {
            active: true,
            tier: tier.name,
            icon: tier.icon,
            monthlyCoins: tier.monthlyCoins,
            nextBillingDate: this.subscriptionData.nextBillingDate,
            daysUntilRenewal: daysUntilRenewal,
            billingCycle: this.subscriptionData.billingCycle,
            message: `Next renewal in ${daysUntilRenewal} days`
        };
    }

    renderVIPBadge(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const status = this.getSubscriptionStatus();
        
        if (!status.active) {
            container.innerHTML = '';
            return;
        }

        const color = this.getTierColor(this.subscriptionData.tierId);
        
        container.innerHTML = `
            <div class="vip-badge" style="
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: linear-gradient(135deg, ${color}20 0%, ${color}40 100%);
                border: 2px solid ${color};
                border-radius: 20px;
                padding: 6px 12px;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${color};
                box-shadow: 0 2px 8px ${color}40;
            ">
                <span style="font-size: 1.2rem;">${status.icon}</span>
                <span>${status.tier}</span>
            </div>
        `;
    }

    // Manual subscription renewal (for testing or admin)
    manualRenewal() {
        if (!this.subscriptionData || !this.subscriptionData.active) {
            logger.warn('VIPSubscriptionManager', 'Cannot renew - no active subscription');
            return false;
        }

        this.creditMonthlyCoins();
        return true;
    }
}

// Initialize and export
const vipSubscriptionManager = new VIPSubscriptionManager();
window.vipSubscriptionManager = vipSubscriptionManager;

export { vipSubscriptionManager, VIPSubscriptionManager };
