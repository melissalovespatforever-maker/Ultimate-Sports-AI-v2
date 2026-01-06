// ============================================
// UPGRADE PROMPT MODULE
// Beautiful modal prompts for tier upgrades
// ============================================

console.log('✨ Loading Upgrade Prompt Module');

// Create upgrade modal HTML
function createUpgradeModal() {
    const modalHTML = `
        <div id="upgradeModal" class="upgrade-modal" style="display: none;">
            <div class="upgrade-modal-overlay" onclick="closeUpgradeModal()"></div>
            <div class="upgrade-modal-content">
                <button class="upgrade-modal-close" onclick="closeUpgradeModal()">×</button>
                
                <div class="upgrade-icon">🔒</div>
                <h2 class="upgrade-title" id="upgradeTitle">Upgrade Required</h2>
                <p class="upgrade-message" id="upgradeMessage">This feature requires a premium membership.</p>
                
                <div class="upgrade-tiers" id="upgradeTiers">
                    <!-- Tier options will be inserted here -->
                </div>
                
                <button class="upgrade-dismiss" onclick="closeUpgradeModal()">Maybe Later</button>
            </div>
        </div>
    `;

    // Add styles
    const styles = `
        <style>
            .upgrade-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .upgrade-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }

            .upgrade-modal-content {
                position: relative;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 40px 30px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: modalSlideIn 0.3s ease;
                text-align: center;
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .upgrade-modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                font-size: 28px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s ease;
                line-height: 1;
            }

            .upgrade-modal-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
            }

            .upgrade-icon {
                font-size: 64px;
                margin-bottom: 20px;
                animation: iconPulse 2s infinite;
            }

            @keyframes iconPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            .upgrade-title {
                font-size: 28px;
                color: white;
                margin-bottom: 15px;
                font-weight: 700;
            }

            .upgrade-message {
                font-size: 16px;
                color: rgba(255, 255, 255, 0.9);
                margin-bottom: 30px;
                line-height: 1.6;
            }

            .upgrade-tiers {
                display: flex;
                gap: 15px;
                margin-bottom: 25px;
            }

            .upgrade-tier {
                flex: 1;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 15px;
                padding: 25px 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 3px solid transparent;
            }

            .upgrade-tier:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                border-color: #ffd700;
            }

            .upgrade-tier.recommended {
                border-color: #ffd700;
                position: relative;
            }

            .upgrade-tier.recommended::before {
                content: '⭐ RECOMMENDED';
                position: absolute;
                top: -12px;
                left: 50%;
                transform: translateX(-50%);
                background: #ffd700;
                color: #333;
                font-size: 11px;
                font-weight: 700;
                padding: 4px 12px;
                border-radius: 10px;
            }

            .tier-name {
                font-size: 22px;
                font-weight: 700;
                color: #667eea;
                margin-bottom: 10px;
            }

            .tier-price {
                font-size: 32px;
                font-weight: 700;
                color: #333;
                margin-bottom: 5px;
            }

            .tier-price small {
                font-size: 14px;
                color: #666;
            }

            .tier-features {
                list-style: none;
                padding: 0;
                margin: 15px 0;
                text-align: left;
            }

            .tier-features li {
                font-size: 13px;
                color: #555;
                padding: 6px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .tier-features li::before {
                content: '✓';
                color: #10b981;
                font-weight: 700;
                font-size: 16px;
            }

            .tier-button {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .tier-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }

            .upgrade-dismiss {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 2px solid rgba(255, 255, 255, 0.3);
                padding: 12px 30px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .upgrade-dismiss:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            @media (max-width: 640px) {
                .upgrade-modal-content {
                    padding: 30px 20px;
                }

                .upgrade-tiers {
                    flex-direction: column;
                }

                .upgrade-tier {
                    padding: 20px;
                }
            }
        </style>
    `;

    // Inject into DOM
    document.body.insertAdjacentHTML('beforeend', styles + modalHTML);
}

// Show upgrade modal
function showUpgradeModal(requiredTier, message) {
    // Create modal if it doesn't exist
    if (!document.getElementById('upgradeModal')) {
        createUpgradeModal();
    }

    const modal = document.getElementById('upgradeModal');
    const title = document.getElementById('upgradeTitle');
    const messageEl = document.getElementById('upgradeMessage');
    const tiersContainer = document.getElementById('upgradeTiers');

    // Set message
    title.textContent = 'Upgrade Required';
    messageEl.textContent = message || 'This feature requires a premium membership.';

    // Build tier options
    const tiers = {
        pro: {
            name: 'PRO',
            price: '$49.99',
            period: 'per month',
            features: [
                '50 games per day',
                'All 5 mini-games',
                '8 AI Coaches',
                'AI Predictions',
                'Leaderboards',
                '500 coin max bet'
            ]
        },
        vip: {
            name: 'VIP',
            price: '$99.99',
            period: 'per month',
            features: [
                'Unlimited games',
                'Exclusive content',
                'All AI Coaches',
                'Priority support',
                'Ad-free experience',
                '2,000 coin max bet'
            ]
        }
    };

    // Determine which tiers to show
    let tiersToShow = [];
    if (requiredTier === 'pro') {
        tiersToShow = ['pro', 'vip'];
    } else if (requiredTier === 'vip') {
        tiersToShow = ['vip'];
    } else {
        tiersToShow = ['pro', 'vip'];
    }

    // Render tiers
    tiersContainer.innerHTML = tiersToShow.map(tierKey => {
        const tier = tiers[tierKey];
        const isRecommended = tierKey === requiredTier || (requiredTier === 'pro' && tierKey === 'pro');
        
        return `
            <div class="upgrade-tier ${isRecommended ? 'recommended' : ''}" onclick="handleTierSelection('${tierKey}')">
                <div class="tier-name">${tier.name}</div>
                <div class="tier-price">
                    ${tier.price}
                    <small>/${tier.period.split(' ')[1]}</small>
                </div>
                <ul class="tier-features">
                    ${tier.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
                <button class="tier-button" onclick="event.stopPropagation(); handleTierSelection('${tierKey}')">
                    Upgrade to ${tier.name}
                </button>
            </div>
        `;
    }).join('');

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close upgrade modal
function closeUpgradeModal() {
    const modal = document.getElementById('upgradeModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Handle tier selection
function handleTierSelection(tier) {
    console.log(`User selected ${tier.toUpperCase()} upgrade`);
    
    // Check if user is logged in
    if (typeof appState !== 'undefined' && !appState.isAuthenticated) {
        closeUpgradeModal();
        alert('Please sign in to upgrade your membership.');
        if (window.appNavigation) {
            window.appNavigation.navigateTo('auth');
        }
        return;
    }

    // Redirect to subscription page or initiate payment
    closeUpgradeModal();
    
    if (typeof subscriptionManager !== 'undefined') {
        subscriptionManager.initiateUpgrade(tier, tier === 'pro' ? 49.99 : 99.99);
    } else {
        // Fallback: redirect to subscription page
        window.location.href = `index.html#subscription?tier=${tier}`;
    }
}

// Keyboard shortcut to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeUpgradeModal();
    }
});

// Alias function for backward compatibility
function showUpgradePrompt(feature, customMessage) {
    // Determine required tier based on feature
    let requiredTier = 'pro';
    let message = customMessage || 'This feature requires a premium membership.';
    
    // Map features to tiers
    const vipFeatures = ['analytics', 'meeting-room', 'advanced-ai'];
    if (vipFeatures.includes(feature)) {
        requiredTier = 'vip';
    }
    
    // Show the upgrade modal
    showUpgradeModal(requiredTier, message);
}

console.log('✅ Upgrade Prompt Module Loaded');

// Export functions
if (typeof window !== 'undefined') {
    window.showUpgradeModal = showUpgradeModal;
    window.showUpgradePrompt = showUpgradePrompt; // Backward compatibility
    window.closeUpgradeModal = closeUpgradeModal;
    window.handleTierSelection = handleTierSelection;
}
