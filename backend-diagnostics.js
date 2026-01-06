// ============================================
// BACKEND DIAGNOSTICS TOOL
// Tests all backend endpoints and API connections
// ============================================

console.log('🔍 Starting Backend Diagnostics...\n');

const API_BASE_URL = 'https://ultimate-sports-ai-backend-production.up.railway.app';

async function testEndpoint(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        
        const startTime = Date.now();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const elapsed = Date.now() - startTime;
        
        const data = await response.json();
        
        return {
            success: response.ok,
            status: response.status,
            elapsed: `${elapsed}ms`,
            data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function runDiagnostics() {
    const results = {};
    
    // 1. Test Health
    console.log('1️⃣ Testing Backend Health...');
    results.health = await testEndpoint('/api/health');
    console.log(results.health.success ? '✅ PASS' : '❌ FAIL', results.health);
    console.log('');
    
    // 2. Test AI Coaches Endpoint
    console.log('2️⃣ Testing AI Coaches /api/ai-coaches/picks...');
    results.aiCoaches = await testEndpoint('/api/ai-coaches/picks');
    console.log(results.aiCoaches.success ? '✅ PASS' : '❌ FAIL', 
        results.aiCoaches.success ? 
        `Found ${results.aiCoaches.data?.coaches?.length || 0} coaches with picks` : 
        results.aiCoaches.error || 'Failed'
    );
    console.log('');
    
    // 3. Test AI Chat Endpoint
    console.log('3️⃣ Testing AI Chat /api/ai-chat/message...');
    results.aiChat = await testEndpoint('/api/ai-chat/message', 'POST', {
        coachName: 'The Analyst',
        message: 'What are your top picks today?',
        userId: 'test-user'
    });
    console.log(results.aiChat.success ? '✅ PASS' : '❌ FAIL', 
        results.aiChat.success ? 
        `Response: "${results.aiChat.data?.response?.substring(0, 80)}..."` : 
        results.aiChat.error || 'Failed'
    );
    console.log('');
    
    // 4. Test Live Scores
    console.log('4️⃣ Testing Live Scores /api/scores/live...');
    results.liveScores = await testEndpoint('/api/scores/live');
    console.log(results.liveScores.success ? '✅ PASS' : '❌ FAIL',
        results.liveScores.success ?
        `Found ${results.liveScores.data?.games?.length || 0} live games` :
        results.liveScores.error || 'Failed'
    );
    console.log('');
    
    // 5. Test Odds API
    console.log('5️⃣ Testing Odds API /api/odds/live...');
    results.odds = await testEndpoint('/api/odds/live');
    console.log(results.odds.success ? '✅ PASS' : '❌ FAIL',
        results.odds.success ?
        `Found ${results.odds.data?.games?.length || 0} games with odds` :
        results.odds.error || 'Failed'
    );
    console.log('');
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNOSTICS SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const tests = Object.keys(results);
    const passed = tests.filter(key => results[key].success).length;
    const total = tests.length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    console.log('');
    
    // Recommendations
    if (!results.health?.success) {
        console.log('⚠️  CRITICAL: Backend is not responding!');
        console.log('   → Check Railway deployment status');
        console.log('   → Verify API_BASE_URL is correct');
    }
    
    if (!results.aiCoaches?.success) {
        console.log('⚠️  AI Coaches not returning picks');
        console.log('   → Check if THE_ODDS_API_KEY is set in Railway env vars');
        console.log('   → Verify ESPN API is accessible');
    }
    
    if (!results.aiChat?.success) {
        console.log('⚠️  AI Chat not working');
        console.log('   → Check if OPENAI_API_KEY is set in Railway env vars');
        console.log('   → Chat will fall back to preset responses without it');
    }
    
    if (!results.liveScores?.success) {
        console.log('⚠️  Live Scores not loading');
        console.log('   → Check ESPN API access');
    }
    
    if (!results.odds?.success) {
        console.log('⚠️  Odds API not working');
        console.log('   → Check if THE_ODDS_API_KEY is set');
        console.log('   → Free tier has limits (500 requests/month)');
    }
    
    console.log('');
    console.log('To fix AI functionality:');
    console.log('1. Go to Railway dashboard');
    console.log('2. Select your backend project');
    console.log('3. Go to "Variables" tab');
    console.log('4. Add these environment variables:');
    console.log('   - OPENAI_API_KEY=your_openai_key_here');
    console.log('   - THE_ODDS_API_KEY=your_odds_api_key_here');
    console.log('');
    console.log('Get API keys from:');
    console.log('• OpenAI: https://platform.openai.com/api-keys');
    console.log('• The Odds API: https://the-odds-api.com/');
}

// Run diagnostics
if (typeof window !== 'undefined') {
    // Browser environment
    window.runBackendDiagnostics = runDiagnostics;
    console.log('✨ Diagnostics tool loaded!');
    console.log('Run: await runBackendDiagnostics()');
} else {
    // Node environment
    runDiagnostics().catch(console.error);
}
