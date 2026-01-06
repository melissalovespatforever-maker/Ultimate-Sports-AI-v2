// ============================================
// REFERRAL SYSTEM
// Share codes, track referrals, and earn rewards
// ============================================

console.log('🤝 Loading Referral System');

class ReferralSystem {
    constructor() {
        this.rewardAmount = 500; // Coins for both parties
        this.baseUrl = window.location.origin + window.location.pathname;
        this.init();
    }

    init() {
        // Wait for global state
        if (window.globalState) {
            this.setup();
        } else {
            window.addEventListener('DOMContentLoaded', () => this.setup());
        }
    }

    setup() {
        // Wait for global state to be fully ready
        if (!window.globalState) {
            console.warn('🤝 Referral System: globalState not found, retrying in 100ms...');
            setTimeout(() => this.setup(), 100);
            return;
        }

        // Subscribe to global state changes
        if (typeof window.globalState.subscribe === 'function') {
            window.globalState.subscribe((state) => this.handleStateChange(state));
        }

        // Check if user has a referral code, if not generate one
        const user = window.globalState.getUser();
        if (user && !user.referralCode) {
            this.generateReferralCode(user);
        }

        // Add UI trigger to profile
        this.setupProfileButton();
        
        // Check for referral param in URL
        this.checkUrlParams();

        console.log('✅ Referral System initialized');
    }

    handleStateChange(state) {
        // Check if user just logged in and has a pending referral
        if (state.isAuthenticated && sessionStorage.getItem('pending_referral')) {
            const code = sessionStorage.getItem('pending_referral');
            // Small delay to ensure UI is ready
            setTimeout(() => {
                this.redeemCode(code);
                sessionStorage.removeItem('pending_referral'); // Clear it so we don't try again
            }, 1000);
        }

        // Ensure user has a code if they are logged in
        if (state.user && !state.user.referralCode) {
            this.generateReferralCode(state.user);
        }

        // Re-inject button if profile was re-rendered (e.g. after login)
        this.setupProfileButton();
    }

    generateReferralCode(user) {
        // Generate a simple unique-ish code
        // Format: REF-[FIRST3_NAME]-[RANDOM4]
        const namePart = (user.name || 'USER').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const code = `REF-${namePart}-${randomPart}`;
        
        // Update user in global state
        const updatedUser = { ...user, referralCode: code };
        window.globalState.setUser(updatedUser);
        
        return code;
    }

    setupProfileButton() {
        // Look for profile inventory section or similar to inject button
        // We will inject a card into the achievements/inventory area or a specific button
        
        // For now, we'll expose a global method to open the UI
        window.openReferralUI = () => this.openUI();
        
        // We'll also try to inject a button into the profile actions if it exists
        const profileActions = document.querySelector('#profile-view .btn-block')?.parentElement;
        if (profileActions && !document.getElementById('referral-btn')) {
            const btn = document.createElement('button');
            btn.id = 'referral-btn';
            btn.className = 'btn btn-primary btn-block'; // Use primary style to stand out
            btn.style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
            btn.style.border = 'none';
            btn.style.color = '#000';
            btn.style.fontWeight = 'bold';
            btn.innerHTML = '<i class="fas fa-gift"></i> Invite Friends (+500 Coins)';
            btn.onclick = () => this.openUI();
            
            // Insert as first action
            profileActions.insertBefore(btn, profileActions.firstChild);
        }
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode) {
            // Store it temporarily if user not logged in
            sessionStorage.setItem('pending_referral', refCode);
            
            // If user logged in, prompt to redeem
            if (window.globalState.state.isAuthenticated) {
                this.redeemCode(refCode);
            }
        }
    }

    openUI() {
        const user = window.globalState.getUser();
        if (!user) {
            window.appNavigation.navigateTo('auth');
            return;
        }

        // Ensure code exists
        if (!user.referralCode) {
            this.generateReferralCode(user);
        }

        const modal = document.createElement('div');
        modal.className = 'referral-modal-overlay';
        modal.innerHTML = `
            <div class="referral-modal animate-pop-in">
                <button class="referral-close-btn"><i class="fas fa-times"></i></button>
                
                <div class="referral-header">
                    <div class="referral-icon-bg">
                        <i class="fas fa-gift"></i>
                    </div>
                    <h2>Invite Friends</h2>
                    <p>Earn <span class="highlight-gold">500 Coins</span> for every friend who joins!</p>
                </div>

                <div class="referral-card">
                    <div class="referral-code-label">YOUR INVITE CODE</div>
                    <div class="referral-code-display">
                        <span id="my-ref-code">${user.referralCode}</span>
                        <button class="copy-btn" id="copy-ref-btn"><i class="fas fa-copy"></i></button>
                    </div>
                    <p class="referral-hint">Share this code with friends</p>
                </div>

                <div class="referral-share-actions">
                    <button class="share-btn twitter" onclick="window.referralSystem.shareTwitter()">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button class="share-btn whatsapp" onclick="window.referralSystem.shareWhatsapp()">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="share-btn email" onclick="window.referralSystem.shareEmail()">
                        <i class="fas fa-envelope"></i>
                    </button>
                </div>

                <div class="referral-divider">
                    <span>OR REDEEM CODE</span>
                </div>

                <div class="referral-input-group">
                    <input type="text" id="referral-input" placeholder="Enter friend's code" ${user.referredBy ? 'disabled' : ''} value="${user.referredBy || ''}">
                    <button id="redeem-btn" class="btn btn-primary" ${user.referredBy ? 'disabled' : ''}>
                        ${user.referredBy ? 'Redeemed' : 'Claim'}
                    </button>
                </div>
                ${user.referredBy ? '<p class="redeemed-msg"><i class="fas fa-check-circle"></i> You have already redeemed a code</p>' : ''}
            </div>
        `;

        document.body.appendChild(modal);

        // Event Listeners
        modal.querySelector('.referral-close-btn').onclick = () => modal.remove();
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        const copyBtn = modal.querySelector('#copy-ref-btn');
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(user.referralCode);
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i>', 2000);
            window.globalState.showNotification('Code copied to clipboard!', 'success');
        };

        const redeemBtn = modal.querySelector('#redeem-btn');
        if (redeemBtn && !redeemBtn.disabled) {
            redeemBtn.onclick = () => {
                const input = modal.querySelector('#referral-input');
                this.redeemCode(input.value.trim());
                modal.remove(); // Close and let the redeem function handle UI feedback (toast/modal)
            };
        }
    }

    async redeemCode(code) {
        if (!code) return;

        const user = window.globalState.getUser();
        
        // Validation
        if (user.referralCode === code) {
            window.globalState.showNotification("You can't use your own code!", 'error');
            return;
        }

        if (user.referredBy) {
            window.globalState.showNotification("You have already redeemed a referral code.", 'error');
            return;
        }

        // Simulate Backend Validation
        // In a real app, this would be an API call: POST /api/referrals/redeem
        console.log(`Checking code: ${code}...`);
        
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network

        // Accept any code that starts with REF- and isn't self
        const isValidFormat = code.startsWith('REF-') && code.length > 8;
        
        if (isValidFormat) {
            // Success!
            window.globalState.addCoins(this.rewardAmount, 'Referral Bonus');
            
            // Update user state
            const updatedUser = { ...user, referredBy: code };
            window.globalState.setUser(updatedUser);
            
            // Show Success UI
            this.showSuccessModal(this.rewardAmount);
            
            // Try to sync with backend if available
            // fetch('/api/referrals/redeem', ...) 
        } else {
            window.globalState.showNotification("Invalid referral code.", 'error');
        }
    }

    showSuccessModal(amount) {
        const modal = document.createElement('div');
        modal.className = 'referral-modal-overlay';
        modal.innerHTML = `
            <div class="referral-modal animate-pop-in success-modal">
                <div class="success-icon">
                    <i class="fas fa-check"></i>
                </div>
                <h2>Referral Redeemed!</h2>
                <div class="reward-display">
                    <span class="plus">+</span>
                    <span class="amount">${amount}</span>
                    <span class="currency">COINS</span>
                </div>
                <p>Rewards have been added to your balance.</p>
                <button class="btn btn-primary btn-block" onclick="this.closest('.referral-modal-overlay').remove()">Awesome!</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Play sound if available
        if (window.soundEffects) {
            window.soundEffects.play('win');
        }
        
        // Confetti
        if (window.confetti) {
            window.confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    shareTwitter() {
        const user = window.globalState.getUser();
        const text = `Join me on Ultimate Sports AI and get ${this.rewardAmount} free coins! Use my code: ${user.referralCode}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.baseUrl)}`;
        window.open(url, '_blank');
    }

    shareWhatsapp() {
        const user = window.globalState.getUser();
        const text = `Join me on Ultimate Sports AI and get ${this.rewardAmount} free coins! Use my code: ${user.referralCode} ${this.baseUrl}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    shareEmail() {
        const user = window.globalState.getUser();
        const subject = "Join Ultimate Sports AI!";
        const body = `Hey! I'm using Ultimate Sports AI to track games and win prizes. \n\nUse my code ${user.referralCode} to get ${this.rewardAmount} FREE coins when you sign up!\n\nJoin here: ${this.baseUrl}`;
        const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = url;
    }
}

// Initialize
window.referralSystem = new ReferralSystem();
