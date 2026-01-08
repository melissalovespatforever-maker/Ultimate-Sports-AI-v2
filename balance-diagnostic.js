/**
 * ============================================
 * BALANCE DIAGNOSTIC UTILITY
 * Run this in console to diagnose balance sync issues
 * ============================================
 * 
 * Usage: balanceDiagnostic.run()
 */

const balanceDiagnostic = {
    run() {
        console.log('🔍 ===== BALANCE DIAGNOSTIC START =====');
        console.log('');
        
        // 1. Check GlobalStateManager
        this.checkGlobalState();
        
        // 2. Check Storage
        this.checkStorage();
        
        // 3. Check Transaction Queue
        this.checkQueue();
        
        // 4. Check Circuit Breakers
        this.checkCircuitBreakers();
        
        // 5. Check Authentication
        this.checkAuth();
        
        // 6. Recommendations
        this.getRecommendations();
        
        console.log('');
        console.log('🔍 ===== DIAGNOSTIC COMPLETE =====');
    },
    
    checkGlobalState() {
        console.log('📊 1. GlobalStateManager Status');
        console.log('   ----------------------------');
        
        if (!window.globalState) {
            console.error('   ❌ GlobalStateManager not initialized!');
            console.log('   → This is a CRITICAL ERROR');
            return;
        }
        
        console.log('   ✅ GlobalStateManager: LOADED');
        console.log(`   💰 Current Balance: ${window.globalState.getBalance()}`);
        console.log(`   👤 User: ${window.globalState.state.user?.name || 'Not Set'}`);
        console.log(`   🔐 Authenticated: ${window.globalState.state.isAuthenticated ? 'Yes' : 'No (Guest Mode)'}`);
        
        if (window.globalState.state.inventory) {
            const boosters = window.globalState.state.inventory.boosters || [];
            const activeBoosters = boosters.filter(b => b.expiresAt > Date.now());
            console.log(`   🚀 Active Boosters: ${activeBoosters.length}`);
            if (activeBoosters.length > 0) {
                activeBoosters.forEach(b => {
                    const remaining = Math.round((b.expiresAt - Date.now()) / 1000 / 60);
                    console.log(`      - ${b.type}: ${b.multiplier}x (${remaining}m remaining)`);
                });
            }
        }
        
        console.log('');
    },
    
    checkStorage() {
        console.log('💾 2. Storage Status');
        console.log('   -----------------');
        
        const unifiedBalance = localStorage.getItem('unified_balance');
        const balanceTimestamp = localStorage.getItem('balance_save_timestamp');
        const lastUpdated = localStorage.getItem('balance_last_updated');
        
        console.log(`   📦 localStorage 'unified_balance': ${unifiedBalance}`);
        console.log(`   ⏱️ Last Save: ${balanceTimestamp ? new Date(parseInt(balanceTimestamp)).toLocaleString() : 'Never'}`);
        console.log(`   🔄 Last Update: ${lastUpdated ? new Date(parseInt(lastUpdated)).toLocaleString() : 'Never'}`);
        
        // Check for old keys
        const oldKeys = ['ultimateCoins', 'sportsLoungeBalance', 'gameCoins', 'userBalance'];
        const foundOld = oldKeys.filter(k => localStorage.getItem(k) !== null);
        if (foundOld.length > 0) {
            console.warn(`   ⚠️ Found old balance keys: ${foundOld.join(', ')}`);
            console.log('   → These should have been migrated. Run: globalState.migrateOldData()');
        } else {
            console.log('   ✅ No old balance keys found');
        }
        
        // Check sessionStorage backup
        const backupBalance = sessionStorage.getItem('backup_balance');
        const backupTimestamp = sessionStorage.getItem('backup_timestamp');
        if (backupBalance) {
            console.log(`   💼 Session Backup: ${backupBalance} (${backupTimestamp ? new Date(parseInt(backupTimestamp)).toLocaleString() : 'Unknown time'})`);
        }
        
        console.log('');
    },
    
    checkQueue() {
        console.log('📦 3. Transaction Queue Status');
        console.log('   ---------------------------');
        
        if (!window.transactionQueueManager) {
            console.error('   ❌ TransactionQueueManager not loaded!');
            return;
        }
        
        const queue = window.transactionQueueManager.queue || [];
        console.log(`   📊 Queue Size: ${queue.length} transactions`);
        
        if (queue.length > 0) {
            console.log('   📝 Pending Transactions:');
            queue.forEach((tx, i) => {
                const age = Math.round((Date.now() - tx.createdAt) / 1000 / 60);
                console.log(`      ${i + 1}. [${tx.status}] ${tx.type} ${tx.amount} - ${tx.reason}`);
                console.log(`         Age: ${age}m, Attempts: ${tx.attempts}`);
                if (tx.lastError) {
                    console.log(`         Last Error: ${tx.lastError}`);
                }
            });
            
            console.warn('   ⚠️ Transactions in queue - may indicate sync issues');
            console.log('   → To force process: transactionQueueManager.processQueue()');
        } else {
            console.log('   ✅ Queue is empty - all transactions synced');
        }
        
        console.log('');
    },
    
    checkCircuitBreakers() {
        console.log('🔌 4. Circuit Breaker Status');
        console.log('   -------------------------');
        
        if (!window.transactionQueueManager) {
            console.error('   ❌ TransactionQueueManager not loaded!');
            return;
        }
        
        const breakers = window.transactionQueueManager.circuitBreakers;
        if (breakers.size === 0) {
            console.log('   ✅ No circuit breakers active');
        } else {
            console.warn(`   ⚠️ ${breakers.size} circuit breaker(s) active:`);
            breakers.forEach((data, endpoint) => {
                const age = Math.round((Date.now() - data.lastFailure) / 1000);
                console.log(`      - ${endpoint}`);
                console.log(`        Failures: ${data.failureCount}, Last: ${age}s ago`);
                
                if (age > 15) {
                    console.log('        → Should be cleared now, try: transactionQueueManager.processQueue()');
                }
            });
        }
        
        console.log('');
    },
    
    checkAuth() {
        console.log('🔐 5. Authentication Status');
        console.log('   ------------------------');
        
        const token = localStorage.getItem('auth_token');
        const email = localStorage.getItem('user_email');
        const username = localStorage.getItem('unified_username');
        
        if (token) {
            console.log('   ✅ Auth Token: PRESENT');
            console.log(`   📧 Email: ${email || 'Not Set'}`);
            console.log(`   👤 Username: ${username || 'Not Set'}`);
            console.log('   💡 Transactions will sync to backend');
        } else {
            console.log('   ⚠️ Auth Token: MISSING (Guest Mode)');
            console.log(`   👤 Guest Username: ${username || 'Guest User'}`);
            console.log('   💡 Balance stored locally only, no backend sync');
        }
        
        console.log('');
    },
    
    getRecommendations() {
        console.log('💡 6. Recommendations');
        console.log('   ------------------');
        
        const issues = [];
        const fixes = [];
        
        // Check for issues
        if (!window.globalState) {
            issues.push('GlobalStateManager not loaded');
            fixes.push('Refresh the page');
        }
        
        if (window.transactionQueueManager && window.transactionQueueManager.queue.length > 5) {
            issues.push('Large transaction queue');
            fixes.push('Run: transactionQueueManager.processQueue()');
        }
        
        if (window.transactionQueueManager && window.transactionQueueManager.circuitBreakers.size > 0) {
            issues.push('Circuit breakers active');
            fixes.push('Wait 15 seconds or run: transactionQueueManager.circuitBreakers.clear()');
        }
        
        const unifiedBalance = parseInt(localStorage.getItem('unified_balance') || '0');
        const globalBalance = window.globalState ? window.globalState.getBalance() : 0;
        if (Math.abs(unifiedBalance - globalBalance) > 0) {
            issues.push('Balance mismatch between storage and state');
            fixes.push('Run: globalState.setBalance(globalState.getBalance())');
        }
        
        if (issues.length === 0) {
            console.log('   ✅ No issues detected! System is healthy.');
        } else {
            console.warn('   ⚠️ Issues Detected:');
            issues.forEach((issue, i) => {
                console.log(`      ${i + 1}. ${issue}`);
            });
            console.log('');
            console.log('   🔧 Recommended Fixes:');
            fixes.forEach((fix, i) => {
                console.log(`      ${i + 1}. ${fix}`);
            });
        }
        
        console.log('');
        console.log('   📞 Still having issues?');
        console.log('      - Check browser console for errors');
        console.log('      - Try: localStorage.clear() and refresh');
        console.log('      - Contact support with diagnostic results');
    },
    
    // Quick fix utilities
    forceSync() {
        console.log('🔄 Forcing sync...');
        if (window.transactionQueueManager) {
            window.transactionQueueManager.processQueue();
        }
        if (window.globalState) {
            window.globalState.syncWithBackend();
        }
        console.log('✅ Sync triggered');
    },
    
    resetCircuitBreakers() {
        console.log('🔌 Resetting circuit breakers...');
        if (window.transactionQueueManager) {
            window.transactionQueueManager.circuitBreakers.clear();
            console.log('✅ All circuit breakers cleared');
        }
    },
    
    fixBalance() {
        console.log('💰 Fixing balance sync...');
        if (window.globalState) {
            const currentBalance = window.globalState.getBalance();
            window.globalState.setBalance(currentBalance);
            console.log(`✅ Balance reset to ${currentBalance}`);
        }
    },
    
    emergencyReset() {
        const confirm = window.confirm('⚠️ This will clear ALL local data and reset balance to 10,000. Continue?');
        if (!confirm) return;
        
        console.log('🚨 Performing emergency reset...');
        
        // Clear all balance-related keys
        const keysToKeep = ['auth_token', 'user_email'];
        Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        // Reset to default
        localStorage.setItem('unified_balance', '10000');
        localStorage.setItem('unified_username', 'Guest User');
        
        console.log('✅ Reset complete. Please refresh the page.');
        
        setTimeout(() => window.location.reload(), 2000);
    }
};

// Export to window for console access
window.balanceDiagnostic = balanceDiagnostic;

console.log('🔍 Balance Diagnostic Loaded');
console.log('💡 Run: balanceDiagnostic.run()');
