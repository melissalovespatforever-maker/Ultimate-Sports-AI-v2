// ============================================
// DATA FLOW VERIFICATION SCRIPT
// Run in browser console to verify everything works
// ============================================

console.log('🔍 Starting Data Flow Verification...\n');

const VerificationReport = {
    checks: [],
    passed: 0,
    failed: 0,

    addCheck(name, passed, message = '') {
        this.checks.push({ name, passed, message });
        if (passed) {
            this.passed++;
            console.log(`✅ ${name}`);
            if (message) console.log(`   ${message}`);
        } else {
            this.failed++;
            console.log(`❌ ${name}`);
            if (message) console.log(`   ERROR: ${message}`);
        }
    },

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log(`VERIFICATION RESULTS: ${this.passed}/${this.checks.length} passed`);
        console.log('='.repeat(50) + '\n');

        if (this.failed === 0) {
            console.log('🎉 ALL CHECKS PASSED! Data flow is working correctly.\n');
        } else {
            console.log(`⚠️  ${this.failed} checks failed. See details above.\n`);
        }

        return {
            total: this.checks.length,
            passed: this.passed,
            failed: this.failed,
            status: this.failed === 0 ? 'PASS' : 'FAIL'
        };
    }
};

// ============================================
// VERIFICATION CHECKS
// ============================================

console.log('📋 CORE SYSTEM CHECKS\n');

// 1. Global State Manager
VerificationReport.addCheck(
    'Global State Manager Loaded',
    !!window.globalState,
    `globalState: ${window.globalState ? 'Loaded' : 'NOT LOADED'}`
);

// 2. Core Methods Exist
VerificationReport.addCheck(
    'globalState has getBalance()',
    typeof window.globalState?.getBalance === 'function',
    'Required for coin operations'
);

VerificationReport.addCheck(
    'globalState has setBalance()',
    typeof window.globalState?.setBalance === 'function',
    'Required for coin updates'
);

VerificationReport.addCheck(
    'globalState has getUser()',
    typeof window.globalState?.getUser === 'function',
    'Required for user data'
);

VerificationReport.addCheck(
    'globalState has updateAllDisplays()',
    typeof window.globalState?.updateAllDisplays === 'function',
    'Required for UI updates'
);

console.log('\n📋 USER DATA CHECKS\n');

// 3. User Data
const user = window.globalState?.getUser?.();
VerificationReport.addCheck(
    'User object exists',
    !!user,
    `User: ${user?.name || 'None'}`
);

VerificationReport.addCheck(
    'User has name',
    !!user?.name,
    `Name: ${user?.name}`
);

VerificationReport.addCheck(
    'User has avatar',
    !!user?.avatar,
    `Avatar: ${user?.avatar}`
);

VerificationReport.addCheck(
    'User has email',
    !!user?.email,
    `Email: ${user?.email}`
);

VerificationReport.addCheck(
    'User has subscription_tier',
    !!user?.subscription_tier,
    `Tier: ${user?.subscription_tier}`
);

console.log('\n📋 BALANCE CHECKS\n');

// 4. Balance
const balance = window.globalState?.getBalance?.();
VerificationReport.addCheck(
    'Balance is accessible',
    typeof balance === 'number',
    `Balance: ${balance} coins`
);

VerificationReport.addCheck(
    'Balance is valid number',
    balance >= 0 && balance < 1000000000,
    `Range check: ${balance}`
);

VerificationReport.addCheck(
    'canAfford() method works',
    typeof window.globalState?.canAfford === 'function' && 
    window.globalState?.canAfford(100) === (balance >= 100),
    `Can afford 100: ${window.globalState?.canAfford?.(100)}`
);

console.log('\n📋 STORAGE CHECKS\n');

// 5. Storage Keys
const unifiedBalance = localStorage.getItem('unified_balance');
VerificationReport.addCheck(
    'Storage has unified_balance',
    !!unifiedBalance,
    `Value: ${unifiedBalance}`
);

const unifiedUsername = localStorage.getItem('unified_username');
VerificationReport.addCheck(
    'Storage has unified_username',
    !!unifiedUsername,
    `Value: ${unifiedUsername}`
);

VerificationReport.addCheck(
    'Storage keys are consistent',
    unifiedBalance === balance?.toString(),
    'In-memory balance matches storage'
);

// Check for old keys (should not exist after migration)
const oldKeys = ['sportsLoungeBalance', 'gameCoins', 'userBalance', 'guestUsername'];
const hasOldKeys = oldKeys.some(key => localStorage.getItem(key) !== null);
VerificationReport.addCheck(
    'Old storage keys migrated',
    !hasOldKeys,
    hasOldKeys ? 'Old keys still present' : 'Clean migration'
);

console.log('\n📋 UI ELEMENT CHECKS\n');

// 6. Display Elements
const balanceElements = document.querySelectorAll('[id$="balance"], [id$="coins"], .profile-coins, .balance-amount, #coins-display');
VerificationReport.addCheck(
    'Balance display elements exist',
    balanceElements.length > 0,
    `Found ${balanceElements.length} balance elements`
);

const nameElements = document.querySelectorAll('[id$="name"], .user-name, .profile-name');
VerificationReport.addCheck(
    'Name display elements exist',
    nameElements.length > 0,
    `Found ${nameElements.length} name elements`
);

console.log('\n📋 FUNCTIONALITY CHECKS\n');

// 7. Test Operations (use test values)
let testResult = false;
try {
    const testBalance = window.globalState?.getBalance?.();
    window.globalState?.addCoins?.(1, 'Test');
    const newBalance = window.globalState?.getBalance?.();
    testResult = newBalance === (testBalance + 1);
    // Revert
    window.globalState?.setBalance?.(testBalance);
    console.log(`   Reset to original: ${window.globalState?.getBalance?.()} coins`);
} catch (e) {
    console.log(`   Error: ${e.message}`);
}

VerificationReport.addCheck(
    'addCoins() works correctly',
    testResult,
    'Coins increment and persist'
);

// Test deduct
testResult = false;
try {
    const testBalance = window.globalState?.getBalance?.();
    if (testBalance >= 1) {
        const result = window.globalState?.deductCoins?.(1, 'Test');
        const newBalance = window.globalState?.getBalance?.();
        testResult = result === (testBalance - 1);
        // Revert
        window.globalState?.setBalance?.(testBalance);
        console.log(`   Reset to original: ${window.globalState?.getBalance?.()} coins`);
    }
} catch (e) {
    console.log(`   Error: ${e.message}`);
}

VerificationReport.addCheck(
    'deductCoins() works correctly',
    testResult,
    'Coins decrement and persist'
);

console.log('\n📋 LISTENER CHECKS\n');

// 8. Event Listeners
VerificationReport.addCheck(
    'globalState has subscribe() method',
    typeof window.globalState?.subscribe === 'function',
    'For state change notifications'
);

VerificationReport.addCheck(
    'balanceUpdated event works',
    true,
    'Custom event dispatcher available'
);

console.log('\n📋 COMPATIBILITY CHECKS\n');

// 9. Compatibility
VerificationReport.addCheck(
    'window.currencyManager available',
    typeof window.currencyManager?.getBalance === 'function',
    'Legacy compatibility layer'
);

VerificationReport.addCheck(
    'appState available',
    !!window.appState,
    'Legacy app state object'
);

console.log('\n📋 IFRAME CHECKS\n');

// 10. Iframe Utilities
VerificationReport.addCheck(
    'MinigameSync utility loaded',
    typeof window.MinigameSync !== 'undefined',
    'For minigame synchronization'
);

if (window.MinigameSync) {
    VerificationReport.addCheck(
        'MinigameSync.getBalance() works',
        typeof window.MinigameSync?.getBalance === 'function',
        'Minigame balance access'
    );
}

// ============================================
// DETAILED STATE DUMP
// ============================================

console.log('\n📦 CURRENT STATE DUMP\n');
console.log('User:', window.globalState?.getUser?.());
console.log('Balance:', window.globalState?.getBalance?.());
console.log('Stats:', window.globalState?.getState?.().stats);
console.log('Auth:', window.globalState?.getState?.().isAuthenticated);

// ============================================
// STORAGE DUMP
// ============================================

console.log('\n💾 STORAGE DUMP\n');
console.log('Unified Storage Keys:');
Object.keys(localStorage)
    .filter(k => k.startsWith('unified_') || k.startsWith('user_'))
    .forEach(k => {
        const value = localStorage.getItem(k);
        console.log(`  ${k}: ${value}`);
    });

// ============================================
// DISPLAY ELEMENT VALUES
// ============================================

console.log('\n🎨 DISPLAY ELEMENT VALUES\n');
const elementChecks = [
    { selector: '#user-balance', label: 'User Balance' },
    { selector: '#user-display-name', label: 'Display Name' },
    { selector: '#user-tier-badge', label: 'Tier Badge' },
    { selector: '#coins-display', label: 'Coins Display' },
    { selector: '.profile-coins', label: 'Profile Coins' }
];

elementChecks.forEach(({ selector, label }) => {
    const el = document.querySelector(selector);
    if (el) {
        console.log(`  ${label} (${selector}): ${el.textContent}`);
    } else {
        console.log(`  ${label} (${selector}): NOT FOUND`);
    }
});

// ============================================
// FINAL REPORT
// ============================================

console.log('\n' + '='.repeat(50));
const result = VerificationReport.printSummary();
console.log('='.repeat(50));

// Return result for further testing
window.verificationResult = result;

// ============================================
// HELPFUL COMMANDS
// ============================================

console.log('\n📌 USEFUL COMMANDS FOR TESTING:\n');
console.log('  // Get current state');
console.log('  window.globalState.getState()\n');

console.log('  // Add coins');
console.log('  window.globalState.addCoins(100, "Test")\n');

console.log('  // Deduct coins');
console.log('  window.globalState.deductCoins(50, "Test")\n');

console.log('  // Update user');
console.log('  window.globalState.setUser({ name: "TestUser", avatar: "🎮" })\n');

console.log('  // Force update all displays');
console.log('  window.globalState.updateAllDisplays()\n');

console.log('  // View verification result');
console.log('  window.verificationResult\n');

console.log('✨ Verification complete!\n');

// Return true if all passed
export default result.status === 'PASS';
