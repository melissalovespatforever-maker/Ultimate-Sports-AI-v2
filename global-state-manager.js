// ============================================
// GLOBAL STATE MANAGER
// Single source of truth for ALL user data
// ============================================

console.log('🌐 Loading Global State Manager');

class GlobalStateManager {
    constructor() {
        this.state = {
            user: null,
            balance: 10000,
            isAuthenticated: false,
            stats: {
                wins: 0,
                losses: 0,
                streak: 0,
                totalGames: 0,
                achievements: 0
            },
            footballSim: null // Ultimate Football Sim data
        };
        
        this.listeners = [];
        this.saveDebounceTimer = null;
        this.lastSaveTimestamp = 0;
        this.saveInProgress = false;
        this.init();
    }

    init() {
        // Migrate and load all data
        this.migrateOldData();
        this.loadFromStorage();
        this.setupEventListeners();
        
        // Export to window for global access (including from iframes)
        window.globalState = this;
        
        // Setup transaction queue listeners
        window.addEventListener('transactionQueueProcessed', (e) => this.handleQueueProcessed(e));
        
        // Sync with backend asynchronously after a short delay
        setTimeout(() => {
            this.syncWithBackend();
        }, 1000);

        // Start periodic check for expired boosters
        this.startBoosterTicker();
        
        console.log('✅ Global State Manager initialized');
        console.log('💰 Current Local Balance:', this.state.balance);
    }

    handleQueueProcessed(event) {
        console.log('💳 Transaction queue processed:', event.detail);
        // After queue processing, we might want to refresh from backend to get the "official" balance
        // but we'll wait 2 seconds to ensure the server has committed all changes
        if (event.detail.success > 0) {
            setTimeout(() => this.syncWithBackend(), 2000);
        }
        this.updateAllDisplays();
    }

    // Periodically check for expired boosters and update state
    startBoosterTicker() {
        if (this.boosterTicker) clearInterval(this.boosterTicker);
        
        this.boosterTicker = setInterval(() => {
            if (!this.state.inventory || !this.state.inventory.boosters || this.state.inventory.boosters.length === 0) return;
            
            const now = Date.now();
            const originalLength = this.state.inventory.boosters.length;
            
            // Filter out expired boosters
            this.state.inventory.boosters = this.state.inventory.boosters.filter(b => b.expiresAt > now);
            
            // If any were removed, save and notify
            if (this.state.inventory.boosters.length < originalLength) {
                this.saveToStorage();
                this.notifyListeners();
                this.updateAllDisplays();
                
                window.dispatchEvent(new CustomEvent('inventoryUpdated', {
                    detail: { inventory: this.state.inventory }
                }));
            }
        }, 30000); // Check every 30 seconds (reduced frequency)
    }

    // Migrate all old localStorage keys to unified system
    migrateOldData() {
        // Check if unified_balance already exists - if so, preserve it!
        const existingBalance = parseInt(localStorage.getItem('unified_balance'));
        
        if (existingBalance && !isNaN(existingBalance)) {
            // Already migrated, don't overwrite!
            console.log('✅ Using existing unified balance:', existingBalance);
            this.state.balance = existingBalance;
            
            // Still clean up any old keys that might exist
            const oldKeys = [
                'ultimateCoins',
                'sportsLoungeBalance', 
                'gameCoins', 
                'userBalance', 
                'balance'
            ];
            oldKeys.forEach(key => localStorage.removeItem(key));
            
            return; // Exit early - no migration needed
        }
        
        // First time migration - check old keys
        const balanceKeys = [
            'ultimateCoins',
            'sportsLoungeBalance', 
            'gameCoins', 
            'userBalance', 
            'balance'
        ];
        
        let highestBalance = 10000;
        balanceKeys.forEach(key => {
            const value = parseInt(localStorage.getItem(key));
            if (value && value > highestBalance) {
                highestBalance = value;
            }
        });

        // Set unified balance only on first migration
        this.state.balance = highestBalance;
        localStorage.setItem('unified_balance', highestBalance.toString());
        console.log('🔄 Migrated balance to unified system:', highestBalance);

        // Clean up old keys
        balanceKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        // Migrate username
        const usernameKeys = ['guestUsername', 'username', 'user_name'];
        let username = 'Guest User';
        for (const key of usernameKeys) {
            const value = localStorage.getItem(key);
            if (value && value !== 'Guest User') {
                username = value;
                break;
            }
        }
        localStorage.setItem('unified_username', username);

        // Migrate avatar
        const avatar = localStorage.getItem('guestAvatar') || 
                      localStorage.getItem('userAvatar') || 
                      '😊';
        localStorage.setItem('unified_avatar', avatar);
        
        // Migrate referral data if any (just ensures we don't lose it if we had a previous sys)
        const refCode = localStorage.getItem('user_referral_code');
        const referredBy = localStorage.getItem('user_referred_by');
        if (refCode) localStorage.setItem('unified_ref_code', refCode);
        if (referredBy) localStorage.setItem('unified_referred_by', referredBy);

        console.log('✅ Data migration complete');
    }

    // Load state from localStorage
    loadFromStorage() {
        try {
            // Check authentication first
            const token = localStorage.getItem('auth_token');
            
            // Load balance regardless of authentication (allow guest mode)
            const username = localStorage.getItem('unified_username') || 'Guest User';
            const avatar = localStorage.getItem('unified_avatar') || '😊';
            const balance = parseInt(localStorage.getItem('unified_balance')) || 10000;
            
            if (!token) {
                // No authentication - guest mode with local data
                this.state.user = {
                    name: username,
                    avatar: avatar,
                    email: '',
                    subscription_tier: 'free'
                };
                this.state.balance = balance; // Keep local balance for guest mode
                this.state.isAuthenticated = false;
                console.log('⚠️ Guest mode - balance:', balance);
                return;
            }
            
            // Load user data for authenticated users
            this.state.user = {
                name: username,
                avatar: avatar,
                email: localStorage.getItem('user_email') || '',
                subscription_tier: localStorage.getItem('subscription_tier') || 'free',
                referralCode: localStorage.getItem('unified_ref_code') || null,
                referredBy: localStorage.getItem('unified_referred_by') || null
            };
            
            this.state.balance = balance;
            
            // Load stats
            this.state.stats = {
                wins: parseInt(localStorage.getItem('user_wins')) || 0,
                losses: parseInt(localStorage.getItem('user_losses')) || 0,
                streak: parseInt(localStorage.getItem('user_streak')) || 0,
                totalGames: parseInt(localStorage.getItem('user_total_games')) || 0,
                achievements: parseInt(localStorage.getItem('user_achievements')) || 0
            };

            // Load inventory and bonuses
            try {
                this.state.inventory = JSON.parse(localStorage.getItem('userInventory') || '{"boosters":[],"avatars":[],"cosmetics":[],"consumables":[],"purchaseHistory":[]}');
            } catch (e) {
                console.error('Error parsing userInventory, using default:', e);
                this.state.inventory = {"boosters":[],"avatars":[],"cosmetics":[],"consumables":[],"purchaseHistory":[]};
            }

            try {
                this.state.permanentBonuses = JSON.parse(localStorage.getItem('permanentBonuses') || '{"coins": 0, "xp": 0}');
            } catch (e) {
                console.error('Error parsing permanentBonuses, using default:', e);
                this.state.permanentBonuses = {"coins": 0, "xp": 0};
            }
            
            // Check authentication
            this.state.isAuthenticated = !!localStorage.getItem('auth_token');
        } catch (error) {
            console.error('Fatal error in loadFromStorage:', error);
            // Fallback to absolute defaults to prevent initialization crash
            this.state.user = { name: 'Guest User', avatar: '😊', email: '', subscription_tier: 'free' };
            this.state.balance = 10000;
            this.state.isAuthenticated = false;
        }
    }

    // Save state to localStorage with debouncing and verification
    saveToStorage() {
        // Clear any pending save
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }

        // Debounce rapid saves (wait 250ms for more changes)
        this.saveDebounceTimer = setTimeout(() => {
            this.performSave();
        }, 250);
    }

    // Actually perform the save operation with verification
    performSave() {
        if (this.saveInProgress) {
            console.warn('⚠️ Save already in progress, queuing...');
            // Don't queue infinitely - max 3 attempts
            if (!this._saveRetryCount) this._saveRetryCount = 0;
            if (this._saveRetryCount >= 3) {
                console.error('❌ Max save retries exceeded, aborting');
                this._saveRetryCount = 0;
                return;
            }
            this._saveRetryCount++;
            setTimeout(() => this.performSave(), 50);
            return;
        }

        this.saveInProgress = true;
        this._saveRetryCount = 0;

        try {
            // Primary storage: localStorage
            if (this.state.user) {
                localStorage.setItem('unified_username', this.state.user.name);
                localStorage.setItem('unified_avatar', this.state.user.avatar);
                localStorage.setItem('user_email', this.state.user.email);
                localStorage.setItem('subscription_tier', this.state.user.subscription_tier);
                
                if (this.state.user.referralCode) {
                    localStorage.setItem('unified_ref_code', this.state.user.referralCode);
                }
                if (this.state.user.referredBy) {
                    localStorage.setItem('unified_referred_by', this.state.user.referredBy);
                }
            }
            
            // CRITICAL: Save balance with timestamp
            localStorage.setItem('unified_balance', this.state.balance.toString());
            localStorage.setItem('balance_save_timestamp', Date.now().toString());
            
            // Save stats
            localStorage.setItem('user_wins', this.state.stats.wins.toString());
            localStorage.setItem('user_losses', this.state.stats.losses.toString());
            localStorage.setItem('user_streak', this.state.stats.streak.toString());
            localStorage.setItem('user_total_games', this.state.stats.totalGames.toString());
            localStorage.setItem('user_achievements', this.state.stats.achievements.toString());

            // Save inventory and bonuses
            localStorage.setItem('userInventory', JSON.stringify(this.state.inventory));
            localStorage.setItem('permanentBonuses', JSON.stringify(this.state.permanentBonuses));

            // Backup to sessionStorage (survives Rosebud reloads better)
            sessionStorage.setItem('backup_balance', this.state.balance.toString());
            sessionStorage.setItem('backup_inventory', JSON.stringify(this.state.inventory));
            sessionStorage.setItem('backup_timestamp', Date.now().toString());

            // Verify the save
            const verification = this.verifySave();
            if (verification.success) {
                this.lastSaveTimestamp = Date.now();
                this.showSaveIndicator();
            } else {
                this.retrySave();
            }

        } catch (error) {
            this.retrySave();
        } finally {
            this.saveInProgress = false;
        }
    }

    // Verify that data was actually saved
    verifySave() {
        const errors = [];
        
        try {
            const savedBalance = parseInt(localStorage.getItem('unified_balance'));
            if (savedBalance !== this.state.balance) {
                errors.push(`Balance mismatch: expected ${this.state.balance}, got ${savedBalance}`);
            }

            const savedInventory = localStorage.getItem('userInventory');
            if (!savedInventory) {
                errors.push('Inventory not saved');
            }

            return {
                success: errors.length === 0,
                errors: errors
            };
        } catch (e) {
            return {
                success: false,
                errors: [e.message]
            };
        }
    }

    // Retry save on failure
    retrySave() {
        setTimeout(() => {
            this.saveInProgress = false;
            this.performSave();
        }, 1000);
    }

    // Show visual indicator that data was saved
    showSaveIndicator() {
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.style.display = 'block';
            indicator.textContent = '✓ Saved';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 2000);
        }
    }

    // Set avatar
    setAvatar(avatar) {
        if (!this.state.user) return;
        this.state.user.avatar = avatar;
        localStorage.setItem('unified_avatar', avatar);
        localStorage.setItem('equippedAvatar', avatar); // Sync with profile-inventory
        this.saveToStorage();
        this.updateAllDisplays();
        this.notifyListeners();
    }

    // Add permanent bonus
    addPermanentBonus(type, amount) {
        if (!this.state.permanentBonuses) this.state.permanentBonuses = { coins: 0, xp: 0 };
        this.state.permanentBonuses[type] = (this.state.permanentBonuses[type] || 0) + amount;
        this.saveToStorage();
        console.log(`✨ Added permanent ${type} bonus: +${amount * 100}%`);
    }

    // Get total multiplier
    getMultiplier(type = 'coins') {
        try {
            // Delegate to InventorySystem if available
            if (window.inventorySystem && typeof window.inventorySystem.getMultiplier === 'function') {
                return window.inventorySystem.getMultiplier(type);
            }

            // Fallback calculation
            let multiplier = 1.0;
            
            // Add permanent bonuses
            if (this.state && this.state.permanentBonuses && this.state.permanentBonuses[type]) {
                multiplier += this.state.permanentBonuses[type];
            }

            // Add active boosters from inventory
            const now = Date.now();
            if (this.state && this.state.inventory && this.state.inventory.boosters) {
                this.state.inventory.boosters.forEach(booster => {
                    if (booster && booster.expiresAt > now && booster.id && (booster.id.includes(type) || booster.id.includes('mega'))) {
                        // Simple additive for boosters
                        const m = parseFloat(booster.multiplier) || 1.0;
                        multiplier += (m - 1);
                    }
                });
            }

            return multiplier;
        } catch (error) {
            console.error('Error in getMultiplier:', error);
            return 1.0;
        }
    }

    // Get user data
    getUser() {
        return this.state.user;
    }

    // Set user data
    setUser(user) {
        if (!user) {
            this.clearUser();
            return;
        }

        this.state.user = {
            name: user.name || user.username || 'User',
            avatar: user.avatar || '😊',
            email: user.email || '',
            subscription_tier: user.subscription_tier || 'free',
            id: user.id,
            ...user
        };
        this.state.isAuthenticated = !!user.id;
        
        // If user has a balance from backend, use it
        if (user.balance !== undefined) {
            this.state.balance = user.balance;
        }
        
        this.saveToStorage();
        this.notifyListeners();
        this.updateAllDisplays();
    }

    // Get balance
    getBalance() {
        return this.state.balance;
    }

    // Set balance
    setBalance(amount) {
        const newBalance = Math.max(0, Math.floor(amount));
        this.state.balance = newBalance;
        
        // Store timestamp of last balance update
        localStorage.setItem('balance_last_updated', Date.now().toString());
        
        this.saveToStorage();
        this.notifyListeners();
        this.updateAllDisplays();
        
        // Dispatch event for legacy systems
        window.dispatchEvent(new CustomEvent('balanceUpdated', { 
            detail: { balance: newBalance } 
        }));
        
        return newBalance;
    }

    // Add coins
    addCoins(amount, reason = 'Added', metadata = {}) {
        // Allow coins for both authenticated AND guest users (offline-first)
        if (!this.state.user) {
            console.error('❌ Cannot add coins - user state not initialized');
            return false;
        }
        
        const newBalance = this.setBalance(this.state.balance + amount);
        console.log(`💰 ${reason}: +${amount} coins (New balance: ${newBalance})`);
        this.showNotification(`+${amount} Ultimate Coins! 💰`, 'success');
        
        // Show optimistic update indicator in UI
        this.showSyncingIndicator();
        
        // Queue transaction for backend sync (only if authenticated)
        if (this.state.isAuthenticated) {
            this.queueTransaction('credit', amount, reason, metadata);
            this.triggerImmediateSync();
        }
        
        // Update achievements (Total Coins Earned)
        this.updateAchievementStats('totalCoinsEarned', amount);
        
        // Update Daily Quests (Coins Won)
        if (reason.toLowerCase().includes('win') || reason.toLowerCase().includes('reward')) {
            window.dispatchEvent(new CustomEvent('coinsWon', { detail: { amount } }));
        }
        
        return newBalance;
    }

    // Deduct coins
    deductCoins(amount, reason = 'Deducted', metadata = {}) {
        // Allow deductions for both authenticated AND guest users (offline-first)
        if (!this.state.user) {
            console.error('❌ Cannot deduct coins - user state not initialized');
            return false;
        }
        
        if (this.state.balance < amount) {
            this.showNotification(`Insufficient coins! Need ${amount}, have ${this.state.balance}`, 'error');
            return false;
        }
        
        const newBalance = this.setBalance(this.state.balance - amount);
        console.log(`💸 ${reason}: -${amount} coins (New balance: ${newBalance})`);
        
        // Show optimistic update indicator in UI
        this.showSyncingIndicator();
        
        // Queue transaction for backend sync (only if authenticated)
        if (this.state.isAuthenticated) {
            this.queueTransaction('debit', amount, reason, metadata);
            this.triggerImmediateSync();
        }
        
        // Update achievements (Total Bets Placed / Items Purchased depending on reason)
        if (reason.toLowerCase().includes('bet') || reason.toLowerCase().includes('wager')) {
            this.updateAchievementStats('totalBetsPlaced', 1);
            window.dispatchEvent(new CustomEvent('betPlaced', { detail: { amount, reason } }));
        } else if (reason.toLowerCase().includes('buy') || reason.toLowerCase().includes('purchase')) {
            this.updateAchievementStats('itemsPurchased', 1);
        }

        return newBalance;
    }

    // Show syncing indicator
    showSyncingIndicator() {
        const headerBalance = document.getElementById('header-user-balance');
        if (headerBalance && !headerBalance.classList.contains('syncing')) {
            headerBalance.classList.add('syncing');
            this.updateAllDisplays();
        }
    }

    // Queue a transaction for backend sync
    queueTransaction(type, amount, reason, metadata = {}, endpoint = '/api/transactions') {
        // Only queue if transaction queue manager is available
        if (window.transactionQueue && typeof window.transactionQueue.queueTransaction === 'function') {
            try {
                const txnId = window.transactionQueue.queueTransaction(type, amount, reason, metadata, endpoint);
                console.log(`📝 Transaction queued: ${txnId} to ${endpoint}`);
                return txnId;
            } catch (error) {
                console.error('❌ Failed to queue transaction:', error);
            }
        } else {
            console.warn('⚠️ Transaction queue not available, transaction will not sync to backend');
        }
        return null;
    }

    // Trigger immediate sync for authenticated users
    triggerImmediateSync() {
        const isAuthenticated = !!localStorage.getItem('auth_token');
        if (isAuthenticated && window.transactionQueue && typeof window.transactionQueue.processQueue === 'function') {
            // Debounce: only trigger if we haven't synced in the last 2 seconds
            const lastSync = parseInt(localStorage.getItem('last_immediate_sync') || '0');
            const timeSinceSync = Date.now() - lastSync;
            
            if (timeSinceSync > 2000) {
                localStorage.setItem('last_immediate_sync', Date.now().toString());
                setTimeout(() => {
                    if (window.transactionQueue && !window.transactionQueue.processing) {
                        window.transactionQueue.processQueue();
                    }
                }, 100);
            }
        }
    }

    // Helper to update achievements safely
    updateAchievementStats(stat, value) {
        try {
            // Check local
            if (window.achievementsSystem && typeof window.achievementsSystem.addStat === 'function') {
                window.achievementsSystem.addStat(stat, value);
            } 
            // Check parent (if in iframe)
            else if (window.parent && window.parent.achievementsSystem && typeof window.parent.achievementsSystem.addStat === 'function') {
                window.parent.achievementsSystem.addStat(stat, value);
            }
        } catch (e) {
            console.warn('Could not update achievements:', e);
        }
    }

    // Check if user can afford
    canAfford(amount) {
        return this.state.balance >= amount;
    }

    // Record a win
    recordWin(metadata = {}) {
        const stats = { ...this.state.stats };
        stats.wins++;
        stats.totalGames++;
        stats.streak++;
        
        console.log(`🏆 Win recorded! Streak: ${stats.streak}`);
        this.updateStats(stats);
        
        // Update achievements
        this.updateAchievementStats('gamesPlayed', 1);
        this.updateAchievementStats('wins', 1);
        this.updateAchievementStats('streak', stats.streak);

        // Update Daily Quests
        window.dispatchEvent(new CustomEvent('gameCompleted', { detail: { game: metadata.game || 'Game' } }));

        // Queue a 'win' transaction for stats tracking if we're not already processing a coin win
        // (If it was a coin win, addCoins already handled the backend sync)
        if (this.state.isAuthenticated && !metadata.skipBackendSync) {
            this.queueTransaction('win', 0, metadata.reason || 'Game Win', {
                game: metadata.game || 'Game', // Backend requires 'game' in metadata to update stats
                ...metadata,
                streak: stats.streak
            });
        }
        
        return stats;
    }

    // Record a loss with Streak Shield logic
    recordLoss(metadata = {}) {
        const stats = { ...this.state.stats };
        stats.losses++;
        stats.totalGames++;
        
        // Check for Streak Shield
        if (this.checkAndUseStreakShield()) {
            console.log('🛡️ Streak Shield protected your streak!');
            this.showNotification('🛡️ Streak Shield Activated! Streak Preserved.', 'info');
        } else {
            console.log('💔 Streak reset to 0');
            stats.streak = 0;
        }
        
        this.updateStats(stats);
        
        // Update achievements
        this.updateAchievementStats('gamesPlayed', 1);
        this.updateAchievementStats('losses', 1);

        // Update Daily Quests
        window.dispatchEvent(new CustomEvent('gameCompleted', { detail: { game: metadata.game || 'Game' } }));

        // Queue a 'loss' transaction for stats tracking
        if (this.state.isAuthenticated && !metadata.skipBackendSync) {
            this.queueTransaction('loss', 0, metadata.reason || 'Game Loss', {
                game: metadata.game || 'Game', // Backend requires 'game' in metadata to update stats
                ...metadata,
                streak: stats.streak
            });
        }
        
        return stats;
    }

    // Check and use a streak shield if available
    checkAndUseStreakShield() {
        // 1. Check for manually activated shield
        if (localStorage.getItem('streakShieldActive') === 'true') {
            localStorage.removeItem('streakShieldActive');
            return true;
        }

        // 2. Check InventorySystem for streak shields
        if (window.inventorySystem && window.inventorySystem.hasItem('streak-shield')) {
            const removed = window.inventorySystem.removeItem('streak-shield', 1);
            if (removed) {
                console.log('🛡️ Streak Shield consumed from inventory');
                return true;
            }
        }

        // 3. Fallback: Check legacy protections
        const protections = JSON.parse(localStorage.getItem('protections') || '{}');
        if (protections.streak && protections.streak > 0) {
            protections.streak--;
            localStorage.setItem('protections', JSON.stringify(protections));
            return true;
        }

        return false;
    }

    // Update stats
    updateStats(updates) {
        this.state.stats = { ...this.state.stats, ...updates };
        this.saveToStorage();
        this.notifyListeners();
    }

    // Update all displays across the entire app
    updateAllDisplays() {
        // Check if authenticated
        if (!this.state.isAuthenticated || !this.state.user) {
            console.log('⚠️ User not authenticated - showing minimal UI');
            this.updateUnauthenticatedUI();
            return;
        }
        
        const balance = this.state.balance;
        const username = this.state.user?.name || 'User';
        const avatar = this.state.user?.avatar || '😊';
        const tier = this.state.user?.subscription_tier || 'free';
        
        // Check if there are pending transactions
        const hasPendingTx = window.transactionQueue && 
                             window.transactionQueue.queue && 
                             window.transactionQueue.queue.length > 0;
        
        // Update ONLY the header balance display (single source of truth)
        const headerBalance = document.getElementById('header-user-balance');
        if (headerBalance) {
            const balanceSpan = headerBalance.querySelector('.balance-amount');
            if (balanceSpan) {
                balanceSpan.textContent = balance.toLocaleString();
            }
        }

        // Update username displays
        const usernameSelectors = [
            '#user-display-name',
            '#user-name',
            '.user-name',
            '.profile-name',
            '#drawer-user-name'
        ];

        usernameSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.textContent = username;
            });
        });

        // Update avatar displays
        const avatarSelectors = [
            '#drawer-user-avatar',
            '#user-avatar',
            '.user-avatar',
            '.profile-avatar'
        ];

        avatarSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.textContent = avatar;
                element.style.opacity = '1'; // Ensure full opacity for auth users
            });
        });

        // Update tier displays
        const tierSelectors = [
            '#user-tier-badge',
            '.user-tier',
            '.profile-tier'
        ];

        tierSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.textContent = tier.toUpperCase() + ' TIER';
            });
        });

        // Update header tier badges
        this.updateHeaderTierBadges(tier);

        // Update header balance with sync indicator
        if (headerBalance) {
            headerBalance.innerHTML = `<i class="fas fa-coins"></i> <span class="balance-amount">${balance.toLocaleString()}</span>`;
            
            // Add a subtle class if pending
            if (hasPendingTx) {
                headerBalance.classList.add('syncing');
            } else {
                headerBalance.classList.remove('syncing');
            }

            // Ensure click listener is only added once
            if (!headerBalance.onclick) {
                headerBalance.onclick = () => {
                    if (window.transactionHistoryModal) {
                        window.transactionHistoryModal.open();
                    } else if (window.appNavigation) {
                        window.appNavigation.navigateTo('profile');
                    }
                };
            }
        }

        // Update stats displays
        const stats = this.state.stats;
        const statElements = {
            'profile-wins': stats.wins,
            'profile-streak': stats.streak,
            'total-picks': stats.totalGames,
            'current-streak': stats.streak
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Notify iframes (like sports-lounge.html)
        this.notifyIframes();
    }

    // Update header tier badges based on subscription
    updateHeaderTierBadges(tier) {
        const container = document.getElementById('header-tier-container');
        if (!container) return;

        container.innerHTML = '';
        
        if (tier === 'pro') {
            container.innerHTML = `
                <div class="tier-badge-pill pro">
                    <i class="fas fa-crown"></i> PRO
                </div>
            `;
        } else if (tier === 'vip') {
            container.innerHTML = `
                <div class="tier-badge-pill vip">
                    <i class="fas fa-gem"></i> VIP
                </div>
            `;
        }
    }

    // Update UI for unauthenticated state
    updateUnauthenticatedUI() {
        // Update ONLY header balance to show locked state
        const headerBalance = document.getElementById('header-user-balance');
        if (headerBalance) {
            headerBalance.innerHTML = '<i class="fas fa-lock"></i> <span style="font-size: 12px; margin-left: 4px;">SIGN IN</span>';
            headerBalance.onclick = () => {
                if (window.appNavigation) {
                    window.appNavigation.navigateTo('auth');
                }
            };
        }

        // Update username displays
        const usernameSelectors = [
            '#user-display-name',
            '#user-name',
            '.user-name',
            '.profile-name',
            '#drawer-user-name'
        ];

        usernameSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.textContent = 'Sign In Required';
            });
        });

        // Update avatar displays to locked icon
        const avatarSelectors = [
            '#drawer-user-avatar',
            '#user-avatar',
            '.user-avatar',
            '.profile-avatar'
        ];

        avatarSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.textContent = '👤'; // Default generic avatar
                element.style.opacity = '0.5';
            });
        });
    }

    // Notify iframes of state changes
    notifyIframes() {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                iframe.contentWindow.postMessage({
                    type: 'stateUpdate',
                    user: this.state.user,
                    balance: this.state.balance,
                    stats: this.state.stats,
                    isAuthenticated: this.state.isAuthenticated
                }, '*');
            } catch (e) {
                // Ignore cross-origin errors
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for messages from iframes
        window.addEventListener('message', (event) => {
            if (event.data.type === 'updateBalance') {
                this.setBalance(event.data.balance);
            } else if (event.data.type === 'addCoins') {
                this.addCoins(event.data.amount, event.data.reason);
            } else if (event.data.type === 'deductCoins') {
                this.deductCoins(event.data.amount, event.data.reason);
            } else if (event.data.type === 'requestState') {
                this.notifyIframes();
            }
        });

        // Listen for storage changes (sync across tabs)
        window.addEventListener('storage', (event) => {
            if (event.key === 'unified_balance') {
                this.state.balance = parseInt(event.newValue) || 10000;
                this.updateAllDisplays();
            } else if (event.key === 'unified_username' || event.key === 'unified_avatar') {
                if (this.state.user) {
                    this.state.user.name = localStorage.getItem('unified_username') || this.state.user.name;
                    this.state.user.avatar = localStorage.getItem('unified_avatar') || this.state.user.avatar;
                    this.updateAllDisplays();
                }
            } else if (event.key === 'user_wins' || event.key === 'user_losses' || event.key === 'user_streak') {
                this.state.stats.wins = parseInt(localStorage.getItem('user_wins')) || 0;
                this.state.stats.losses = parseInt(localStorage.getItem('user_losses')) || 0;
                this.state.stats.streak = parseInt(localStorage.getItem('user_streak')) || 0;
                this.updateAllDisplays();
            } else if (event.key === 'userInventory') {
                try {
                    this.state.inventory = JSON.parse(event.newValue);
                    window.dispatchEvent(new CustomEvent('inventoryUpdated', {
                        detail: { inventory: this.state.inventory }
                    }));
                } catch (e) {
                    console.error('Error syncing inventory across tabs:', e);
                }
            }
        });
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.push(listener);
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (e) {
                console.error('Listener error:', e);
            }
        });
    }

    // Sync with backend
    async syncWithBackend() {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // Increased to 10s for stability

            const response = await fetch(`${window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app'}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeout);

            // Handle 500 errors gracefully
            if (response.status >= 500) {
                await response.text().catch(() => {});
                console.warn(`⚠️ Backend Server Error (${response.status}) on profile sync. Using local state.`);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    // Smart Balance Sync with Timestamp Protection:
                    // Prevent stale backend data from overwriting recent local transactions
                    
                    const localBalance = this.state.balance;
                    const backendBalance = data.user.balance || 0;
                    const lastLocalUpdate = parseInt(localStorage.getItem('balance_last_updated') || '0');
                    const timeSinceUpdate = Date.now() - lastLocalUpdate;
                    
                    // Check for pending PayPal purchases that need to be preserved
                    const pendingPurchases = JSON.parse(localStorage.getItem('pending_paypal_purchases') || '[]');
                    const hasPendingPurchases = pendingPurchases.length > 0;
                    
                    // Update user fields but treat balance carefully
                    const userUpdate = { ...data.user };
                    
                    // If local balance was updated in the last 60 seconds OR has pending purchases, trust it over backend
                    // This prevents race conditions where transactions are queued but backend hasn't processed yet
                    if ((timeSinceUpdate < 60000 || hasPendingPurchases) && localBalance !== backendBalance) {
                        console.log(`💰 Keeping local balance (${localBalance}) - recent update (${Math.floor(timeSinceUpdate / 1000)}s ago) or pending purchases`);
                        console.log(`   Backend balance: ${backendBalance} (will sync via transaction queue)`);
                        userUpdate.balance = localBalance;
                    } else if (backendBalance !== localBalance) {
                        // Backend balance is authoritative after cooldown period
                        console.log(`💰 Syncing balance from backend: ${backendBalance} (local was: ${localBalance})`);
                        // Update timestamp since we're accepting backend balance
                        localStorage.setItem('balance_last_updated', Date.now().toString());
                    } else {
                        // Balances match - all synced properly
                        console.log(`💰 Balance in sync: ${localBalance}`);
                    }

                    this.setUser(userUpdate);
                    console.log('✅ Synced with backend');
                    
                    // After successful sync, retry any pending PayPal purchases
                    this.retryPendingPurchases();
                }
            } else if (response.status === 401 || response.status === 403) {
                // Invalid token, clear it
                console.warn('⚠️ Invalid/expired token, clearing auth');
                localStorage.removeItem('auth_token');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('⚠️ Backend sync timeout');
            } else if (error.message && error.message.includes('500')) {
                console.warn('⚠️ Backend server error (500) during sync - using local data');
            } else {
                console.warn('⚠️ Could not sync with backend:', error.message);
            }
        }
    }
    
    /**
     * Retry pending PayPal purchases and VIP subscriptions
     * Called after successful backend sync on login
     */
    async retryPendingPurchases() {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        // Retry pending PayPal purchases
        const pendingPurchases = JSON.parse(localStorage.getItem('pending_paypal_purchases') || '[]');
        if (pendingPurchases.length > 0) {
            console.log(`🔄 Retrying ${pendingPurchases.length} pending PayPal purchases...`);
            
            for (const purchase of pendingPurchases) {
                await this.syncPayPalPurchaseToBackend(
                    purchase.coins,
                    purchase.bundleName,
                    purchase.transactionId
                );
            }
        }
        
        // Retry pending VIP subscriptions
        const pendingSubs = JSON.parse(localStorage.getItem('pending_vip_subscriptions') || '[]');
        if (pendingSubs.length > 0) {
            console.log(`🔄 Retrying ${pendingSubs.length} pending VIP subscriptions...`);
            
            for (const sub of pendingSubs) {
                await this.syncSubscriptionToBackend(
                    sub.subscriptionData,
                    sub.tier
                );
            }
        }
        
        // Retry failed syncs
        const failedSyncs = JSON.parse(localStorage.getItem('failed_paypal_syncs') || '[]');
        if (failedSyncs.length > 0) {
            console.log(`🔄 Retrying ${failedSyncs.length} failed PayPal syncs...`);
            
            for (const sync of failedSyncs) {
                if (sync.attempts < 5) { // Max 5 retry attempts
                    await this.syncPayPalPurchaseToBackend(
                        sync.coins,
                        sync.bundleName,
                        sync.transactionId
                    );
                }
            }
        }
    }
    
    /**
     * Sync PayPal purchase to backend
     */
    async syncPayPalPurchaseToBackend(coins, bundleName, transactionId) {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;
        
        const apiUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
        
        try {
            const response = await fetch(`${apiUrl}/api/payments/paypal-purchase`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'credit',
                    amount: coins,
                    reason: `PayPal Purchase: ${bundleName}`,
                    metadata: {
                        method: 'paypal',
                        paypalTransactionId: transactionId,
                        bundleName: bundleName,
                        verified: true,
                        timestamp: Date.now()
                    }
                }),
                credentials: 'include'
            });
            
            if (response.ok) {
                console.log(`✅ PayPal purchase synced: ${bundleName}`);
                
                // Remove from pending/failed lists
                this.removePendingPurchase(transactionId);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Failed to sync PayPal purchase:', error);
            return false;
        }
    }
    
    /**
     * Sync VIP subscription to backend
     */
    async syncSubscriptionToBackend(subscriptionData, tier) {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;
        
        const apiUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
        
        try {
            const response = await fetch(`${apiUrl}/api/subscriptions/activate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tier: subscriptionData.tier,
                    tierId: subscriptionData.tierId,
                    monthlyCoins: subscriptionData.monthlyCoins,
                    subscriptionId: subscriptionData.subscriptionId,
                    billingCycle: subscriptionData.billingCycle,
                    price: subscriptionData.price,
                    metadata: {
                        method: 'paypal',
                        paypalSubscriptionId: subscriptionData.subscriptionId,
                        verified: true,
                        timestamp: Date.now()
                    }
                }),
                credentials: 'include'
            });
            
            if (response.ok) {
                console.log(`✅ VIP subscription synced: ${subscriptionData.tier}`);
                
                // Remove from pending/failed lists
                this.removePendingSubscription(subscriptionData.subscriptionId);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Failed to sync VIP subscription:', error);
            return false;
        }
    }
    
    /**
     * Remove synced purchase from pending lists
     */
    removePendingPurchase(transactionId) {
        // Remove from pending purchases
        const pendingPurchases = JSON.parse(localStorage.getItem('pending_paypal_purchases') || '[]');
        const filtered = pendingPurchases.filter(p => p.transactionId !== transactionId);
        localStorage.setItem('pending_paypal_purchases', JSON.stringify(filtered));
        
        // Remove from failed syncs
        const failedSyncs = JSON.parse(localStorage.getItem('failed_paypal_syncs') || '[]');
        const filteredFailed = failedSyncs.filter(s => s.transactionId !== transactionId);
        localStorage.setItem('failed_paypal_syncs', JSON.stringify(filteredFailed));
    }
    
    /**
     * Remove synced subscription from pending lists
     */
    removePendingSubscription(subscriptionId) {
        // Remove from pending subscriptions
        const pendingSubs = JSON.parse(localStorage.getItem('pending_vip_subscriptions') || '[]');
        const filtered = pendingSubs.filter(s => s.subscriptionData.subscriptionId !== subscriptionId);
        localStorage.setItem('pending_vip_subscriptions', JSON.stringify(filtered));
        
        // Remove from failed syncs
        const failedSyncs = JSON.parse(localStorage.getItem('failed_subscription_syncs') || '[]');
        const filteredFailed = failedSyncs.filter(s => s.subscriptionData.subscriptionId !== subscriptionId);
        localStorage.setItem('failed_subscription_syncs', JSON.stringify(filteredFailed));
    }

    // Update backend balance
    async syncBalanceWithBackend() {
        // Backend balance sync is currently handled via specific transaction endpoints
        // (bets, purchases, etc.) rather than a direct balance update endpoint.
        // Disabling this generic sync to prevent 404s.
        return; 
        
        /* 
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app'}/api/users/balance`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ balance: this.state.balance }),
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeout);

            if (!response.ok && (response.status === 401 || response.status === 403)) {
                console.warn('⚠️ Invalid/expired token on balance sync');
                localStorage.removeItem('auth_token');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('⚠️ Backend balance sync timeout');
            } else {
                console.warn('⚠️ Could not update backend balance:', error.message);
            }
        }
        */
    }

    // Show notification
    showNotification(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Clear user (logout)
    clearUser() {
        // Complete logout - clear all user data
        this.state.user = null;
        this.state.balance = 0;
        this.state.isAuthenticated = false;
        this.state.stats = {
            wins: 0,
            losses: 0,
            streak: 0,
            totalGames: 0,
            achievements: 0
        };
        
        // Clear all authentication and user data from localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('unified_username');
        localStorage.removeItem('unified_avatar');
        localStorage.removeItem('unified_balance');
        localStorage.removeItem('user_email');
        localStorage.removeItem('subscription_tier');
        localStorage.removeItem('user_wins');
        localStorage.removeItem('user_losses');
        localStorage.removeItem('user_streak');
        localStorage.removeItem('user_total_games');
        localStorage.removeItem('user_achievements');
        
        this.saveToStorage();
        this.notifyListeners();
        this.updateAllDisplays();
        
        console.log('🔓 User logged out - authentication required');
    }

    // Get full state
    getState() {
        return { ...this.state };
    }

    // ============================================
    // INVENTORY MANAGEMENT
    // Single source of truth for user items
    // ============================================

    /**
     * Get full inventory
     */
    getInventory() {
        return this.state.inventory || this.getDefaultInventory();
    }

    /**
     * Get default inventory structure
     */
    getDefaultInventory() {
        return {
            boosters: [],
            avatars: [],
            cosmetics: [],
            consumables: [],
            protections: [],
            purchaseHistory: []
        };
    }

    /**
     * Add item to inventory
     */
    addItem(itemData) {
        if (!this.state.inventory) {
            this.state.inventory = this.getDefaultInventory();
        }

        const { item_id, item_name, item_type, quantity = 1, metadata = {}, expires_at = null } = itemData;
        
        // CRITICAL FIX: Ensure proper pluralization for ALL categories
        let category = item_type;
        
        // Map singular to plural correctly
        const categoryMap = {
            'booster': 'boosters',
            'avatar': 'avatars',
            'cosmetic': 'cosmetics',
            'consumable': 'consumables',
            'protection': 'protections'
        };
        
        // If it's singular, convert to plural
        if (categoryMap[item_type]) {
            category = categoryMap[item_type];
        } else if (!item_type.endsWith('s')) {
            // Fallback: just add 's'
            category = item_type + 's';
        }
        
        console.log(`📦 Adding item "${item_name}" to category: ${category} (original type: ${item_type})`);
        
        if (!this.state.inventory[category]) {
            console.warn(`⚠️ Category "${category}" doesn't exist, creating it...`);
            this.state.inventory[category] = [];
        }

        // Check if item already exists
        const existingIndex = this.state.inventory[category].findIndex(i => i.id === item_id);
        
        if (existingIndex !== -1) {
            // Update quantity for existing item
            this.state.inventory[category][existingIndex].quantity = 
                (this.state.inventory[category][existingIndex].quantity || 1) + quantity;
            console.log(`✅ Updated ${item_name} quantity to ${this.state.inventory[category][existingIndex].quantity}`);
        } else {
            // Add new item with COMPLETE metadata
            const newItem = {
                id: item_id,
                name: item_name,
                type: item_type, // Store original type
                category: category, // Store plural category for lookups
                quantity,
                metadata: {
                    ...metadata,
                    price: metadata.price || 0,
                    imageUrl: metadata.imageUrl || null
                },
                expiresAt: expires_at,
                purchasedAt: Date.now()
            };
            
            this.state.inventory[category].push(newItem);
            console.log(`✅ Added ${item_name} to inventory (${category})`);
            console.log('Full item data:', newItem);
        }

        // Add to purchase history
        if (!this.state.inventory.purchaseHistory) {
            this.state.inventory.purchaseHistory = [];
        }
        
        this.state.inventory.purchaseHistory.unshift({
            id: item_id,
            name: item_name,
            type: item_type,
            category: category,
            quantity,
            purchasedAt: Date.now(),
            metadata
        });

        // Keep only last 50 purchase history items
        if (this.state.inventory.purchaseHistory.length > 50) {
            this.state.inventory.purchaseHistory = this.state.inventory.purchaseHistory.slice(0, 50);
        }

        console.log('📊 Current inventory state:', {
            boosters: this.state.inventory.boosters?.length || 0,
            avatars: this.state.inventory.avatars?.length || 0,
            cosmetics: this.state.inventory.cosmetics?.length || 0,
            consumables: this.state.inventory.consumables?.length || 0,
            total: this.state.inventory.purchaseHistory?.length || 0
        });

        this.saveToStorage();
        this.notifyListeners();
        
        // Sync to backend if authenticated
        if (this.state.isAuthenticated) {
            this.syncInventoryItemToBackend(itemData);
        }

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('inventoryUpdated', {
            detail: { item: itemData, inventory: this.state.inventory }
        }));

        return true;
    }

    /**
     * Remove item from inventory
     */
    removeItem(item_id, item_type, quantity = 1) {
        if (!this.state.inventory) return false;

        const category = item_type.endsWith('s') ? item_type : item_type + 's';
        const items = this.state.inventory[category];
        
        if (!items) return false;
        
        const index = items.findIndex(i => i.id === item_id);
        if (index === -1) return false;
        
        const item = items[index];
        
        if (item.quantity > quantity) {
            item.quantity -= quantity;
        } else {
            items.splice(index, 1);
        }
        
        this.saveToStorage();
        this.notifyListeners();
        
        console.log(`✅ Removed ${quantity}x ${item.name} from inventory`);
        
        window.dispatchEvent(new CustomEvent('inventoryUpdated', {
            detail: { inventory: this.state.inventory }
        }));
        
        return true;
    }

    /**
     * Sync inventory item to backend
     */
    async syncInventoryItemToBackend(itemData) {
        if (!this.state.isAuthenticated) return;

        // Use transaction queue for robust syncing (including offline support)
        if (window.transactionQueue && typeof window.transactionQueue.queueTransaction === 'function') {
            window.transactionQueue.queueTransaction(
                'purchase', // type
                0, // amount (already deducted via deductCoins)
                `Inventory Add: ${itemData.item_name}`, // reason
                itemData, // metadata
                '/api/inventory/add' // specific endpoint
            );
            console.log(`📦 Inventory sync queued for ${itemData.item_name}`);
        } else {
            // Fallback to direct fetch if queue not available
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            try {
                fetch(`${window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app'}/api/inventory/add`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(itemData),
                    credentials: 'include'
                });
            } catch (e) {
                console.warn('Direct inventory sync failed:', e);
            }
        }
    }

    /**
     * Reconcile local guest inventory with backend after login
     */
    async reconcileInventory() {
        if (!this.state.isAuthenticated) return;
        
        console.log('🔄 Reconciling inventory...');
        const inventory = this.getInventory();
        const categories = ['boosters', 'avatars', 'cosmetics', 'consumables', 'protections'];
        
        let syncCount = 0;
        
        for (const category of categories) {
            if (inventory[category] && Array.isArray(inventory[category])) {
                for (const item of inventory[category]) {
                    // Sync each item to backend
                    // The backend should handle deduplication based on item_id
                    const itemData = {
                        item_id: item.id,
                        item_name: item.name,
                        item_type: item.type || category.replace(/s$/, ''), // remove trailing 's'
                        quantity: item.quantity || 1,
                        metadata: item.metadata || {},
                        expires_at: item.expiresAt || null
                    };
                    
                    this.syncInventoryItemToBackend(itemData);
                    syncCount++;
                }
            }
        }
        
        console.log(`✅ Inventory reconciliation: queued ${syncCount} items for sync`);
        
        // Trigger queue processing
        this.triggerImmediateSync();
    }

    /**
     * Reconcile local guest stats with backend after login
     */
    async reconcileStats() {
        if (!this.state.isAuthenticated) return;
        
        console.log('🔄 Reconciling stats...');
        const stats = this.state.stats;
        
        // Sync cumulative guest wins/losses/games
        if (stats.wins > 0 || stats.losses > 0) {
            this.queueTransaction('credit', 0, 'Guest Stats Sync', {
                game: 'Reconciliation',
                wins: stats.wins,
                losses: stats.losses,
                totalGames: stats.totalGames,
                streak: stats.streak
            }, '/api/users/sync-stats'); // We'll need this endpoint or a way for backend to handle bulk sync
        }
    }

    /**
     * Get items by type
     */
    getItemsByType(type) {
        const category = type.endsWith('s') ? type : type + 's';
        return this.state.inventory?.[category] || [];
    }

    /**
     * Check if user owns an item
     */
    hasItem(item_id) {
        if (!this.state.inventory) return false;
        
        const categories = ['boosters', 'avatars', 'cosmetics', 'consumables', 'protections'];
        
        for (const category of categories) {
            if (this.state.inventory[category]?.some(item => item.id === item_id)) {
                return true;
            }
        }
        
        return false;
    }

    // ============================================
    // STATS TRACKING
    // ============================================

    // Stats tracking is now handled by recordWin/recordLoss methods above
}

// Create global instance
window.globalState = new GlobalStateManager();

// Make compatible with existing currencyManager references
window.currencyManager = {
    getBalance: () => window.globalState.getBalance(),
    setBalance: (amount) => window.globalState.setBalance(amount),
    addCoins: (amount, reason) => window.globalState.addCoins(amount, reason),
    deductCoins: (amount, reason) => window.globalState.deductCoins(amount, reason),
    canAfford: (amount) => window.globalState.canAfford(amount),
    updateAllDisplays: () => window.globalState.updateAllDisplays(),
    recordWin: () => window.globalState.recordWin(),
    recordLoss: () => window.globalState.recordLoss(),
    getMultiplier: (type) => window.globalState.getMultiplier(type)
};

// CRITICAL: Alias appState to globalState for legacy compatibility
// This ensures profile.js, settings-frontend.js, and auth.js all look at the same object
window.appState = {
    // Proxy getter to always fetch latest user from state
    get user() { return window.globalState.getUser(); },
    set user(val) { window.globalState.setUser(val); },
    
    // Methods expected by legacy code
    setUser: (val) => window.globalState.setUser(val),
    clearUser: () => window.globalState.clearUser(),
    subscribe: (cb) => window.globalState.subscribe(cb),
    notify: () => window.globalState.notifyListeners(),
    
    // Properties
    get isAuthenticated() { return window.globalState.getState().isAuthenticated; },
    getMultiplier: (type) => window.globalState.getMultiplier(type)
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalStateManager;
}

console.log('✅ Global State Manager ready');
