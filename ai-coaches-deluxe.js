// ============================================
// AI COACHES DELUXE SYSTEM
// Premium ID Card UI with Full Personalities
// Pro/VIP Tier System + Chat Feature
// ============================================

console.log('🔥 AI Coaches Deluxe System loading...');

const aiCoachesDeluxe = {
    cachedStats: null,
    cacheTimestamp: null,
    CACHE_DURATION: 60000, // 1 minute

    // Fetch real coach stats from backend
    async fetchCoachStats() {
        try {
            // Check cache
            if (this.cachedStats && this.cacheTimestamp && (Date.now() - this.cacheTimestamp < this.CACHE_DURATION)) {
                console.log('✅ Using cached coach stats');
                return this.cachedStats;
            }

            console.log('🔄 Fetching coach stats from backend...');
            
            const apiUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
            const response = await fetch(`${apiUrl}/api/ai-coaches/picks`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.coaches) {
                    this.cachedStats = data.coaches;
                    this.cacheTimestamp = Date.now();
                    console.log('✅ Fetched stats for', data.coaches.length, 'coaches');
                    return data.coaches;
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch coach stats:', error.message);
        }
        return null;
    },

    // Update coach stats with backend data
    async updateCoachesWithRealStats() {
        const backendStats = await this.fetchCoachStats();
        
        if (backendStats) {
            this.coaches.forEach(coach => {
                const backendCoach = backendStats.find(bc => bc.id === coach.id);
                if (backendCoach) {
                    coach.accuracy = backendCoach.accuracy || coach.accuracy;
                    coach.totalPicks = backendCoach.totalPicks || coach.totalPicks;
                    coach.streak = backendCoach.streak || coach.streak;
                    console.log(`✅ Updated ${coach.name} with real stats: ${coach.accuracy}% accuracy`);
                }
            });
        }
    },

    // Comprehensive coach data with personalities
    coaches: [
        {
            id: 1,
            name: 'The Analyst',
            sport: 'NBA Basketball',
            avatar: 'https://play.rosebud.ai/assets/Nba coach.webp?O8Jk',
            rank: '#1',
            tier: 'PRO',
            accuracy: 74.2,
            totalPicks: 547,
            streak: 12,
            monthlyROI: '+24.8%',
            personality: 'Genius data scientist who sees patterns others miss',
            specialty: 'Deep statistical analysis & efficiency ratings',
            strengths: ['Player Props', 'Spread Analysis', 'Team Dynamics'],
            background: '🧠 PhD in Data Science | 10+ years analytics',
            catchphrase: 'The numbers never lie.',
            color: '#6366f1',
            isPremium: false,
            hasChat: false
        },
        {
            id: 2,
            name: 'Sharp Shooter',
            sport: 'NFL Football',
            avatar: 'https://play.rosebud.ai/assets/NFL coach.webp?nRJK',
            rank: '#2',
            tier: 'VIP',
            accuracy: 71.8,
            totalPicks: 423,
            streak: 8,
            monthlyROI: '+31.2%',
            personality: 'Street-smart veteran who reads games like a book',
            specialty: 'Live game adjustments & contrarian plays',
            strengths: ['Line Movement', 'Vegas Trends', 'Live Betting'],
            background: '💰 Professional Analyst | Former Vegas Insider',
            catchphrase: 'Follow the sharp money.',
            color: '#ef4444',
            isPremium: true,
            hasChat: true
        },
        {
            id: 3,
            name: 'Data Dragon',
            sport: 'MLB Baseball',
            avatar: 'https://play.rosebud.ai/assets/MLB coach.webp?zfFQ',
            rank: '#3',
            tier: 'PRO',
            accuracy: 69.4,
            totalPicks: 612,
            streak: 5,
            monthlyROI: '+18.6%',
            personality: 'Algorithm master who finds golden opportunities',
            specialty: 'Consensus models & predictive algorithms',
            strengths: ['Season Trends', 'Weather Impact', 'Home/Away'],
            background: '🐉 Machine Learning Expert | Advanced Models',
            catchphrase: 'The data is speaking.',
            color: '#f97316',
            isPremium: false,
            hasChat: false
        },
        {
            id: 4,
            name: 'Ice Breaker',
            sport: 'NHL Hockey',
            avatar: 'https://play.rosebud.ai/assets/NHL coach.webp?frve',
            rank: '#4',
            tier: 'VIP',
            accuracy: 72.6,
            totalPicks: 389,
            streak: 15,
            monthlyROI: '+28.4%',
            personality: 'Cool and calculated, never gets rattled',
            specialty: 'Tournament dynamics & momentum plays',
            strengths: ['Playoff Forecasting', 'Momentum', 'Underdogs'],
            background: '❄️ Hockey Analytics Pioneer | Playoff Expert',
            catchphrase: 'Stay cool and trust the process.',
            color: '#0ea5e9',
            isPremium: true,
            hasChat: true
        },
        {
            id: 5,
            name: 'El Futbolista',
            sport: 'International Soccer',
            avatar: 'https://play.rosebud.ai/assets/Soccer coach.webp?TgRO',
            rank: '#5',
            tier: 'VIP',
            accuracy: 70.3,
            totalPicks: 478,
            streak: 9,
            monthlyROI: '+22.1%',
            personality: 'Passionate philosopher who sees soccer as art',
            specialty: 'Global soccer markets & tactical analysis',
            strengths: ['European Leagues', 'Tournaments', 'Tactics'],
            background: '⚽ International Analyst | 15+ Countries',
            catchphrase: 'Football is poetry in motion.',
            color: '#10b981',
            isPremium: true,
            hasChat: true
        },
        {
            id: 6,
            name: 'The Gridiron Guru',
            sport: 'College Football',
            avatar: 'https://play.rosebud.ai/assets/college-football-coach.webp?5oGW',
            rank: '#6',
            tier: 'PRO',
            accuracy: 68.9,
            totalPicks: 534,
            streak: 7,
            monthlyROI: '+19.3%',
            personality: 'College football historian with deep rivalry knowledge',
            specialty: 'Conference dynamics & recruiting impact',
            strengths: ['Rivalry Games', 'Bowl Season', 'Conference Play'],
            background: '🏈 College Football Expert | 20+ years coverage',
            catchphrase: 'Tradition never graduates.',
            color: '#8b5cf6',
            isPremium: false,
            hasChat: false
        },
        {
            id: 7,
            name: 'Ace of Aces',
            sport: 'Tennis',
            avatar: 'https://play.rosebud.ai/assets/tennis-coach.webp?NY3b',
            rank: '#7',
            tier: 'PRO',
            accuracy: 73.1,
            totalPicks: 445,
            streak: 11,
            monthlyROI: '+26.7%',
            personality: 'Elegant strategist who reads court positioning',
            specialty: 'Surface analysis & head-to-head matchups',
            strengths: ['Grand Slams', 'Surface Trends', 'Stamina'],
            background: '🎾 Former Pro Player | ATP/WTA Specialist',
            catchphrase: 'Every match is a chess game.',
            color: '#14b8a6',
            isPremium: false,
            hasChat: false
        },
        {
            id: 8,
            name: 'The Brawl Boss',
            sport: 'MMA & Boxing',
            avatar: 'https://play.rosebud.ai/assets/mma-coach.webp?3ZBw',
            rank: '#8',
            tier: 'VIP',
            accuracy: 75.3,
            totalPicks: 367,
            streak: 13,
            monthlyROI: '+32.8%',
            personality: 'Combat sports guru who studies fighting styles',
            specialty: 'Fight breakdowns & reach/weight advantages',
            strengths: ['UFC/Bellator', 'Boxing', 'Style Matchups'],
            background: '🥊 Former Fighter | Combat Sports Analyst',
            catchphrase: 'Respect all, fear none.',
            color: '#dc2626',
            isPremium: true,
            hasChat: true
        },
        {
            id: 9,
            name: 'The Green Master',
            sport: 'Golf',
            avatar: 'https://play.rosebud.ai/assets/golf-coach.webp.webp.webp?cM4M',
            rank: '#9',
            tier: 'PRO',
            accuracy: 67.8,
            totalPicks: 401,
            streak: 6,
            monthlyROI: '+17.2%',
            personality: 'Patient strategist who understands course layout',
            specialty: 'Course history & weather conditions',
            strengths: ['Majors', 'Course Fit', 'Wind Analysis'],
            background: '⛳ PGA Tour Analyst | 15+ years experience',
            catchphrase: 'Patience is the ultimate power.',
            color: '#16a34a',
            isPremium: false,
            hasChat: false
        },
        {
            id: 10,
            name: 'March Madness',
            sport: 'College Basketball',
            avatar: 'https://play.rosebud.ai/assets/college-basketball-coach.webp?cDlx',
            rank: '#10',
            tier: 'PRO',
            accuracy: 70.5,
            totalPicks: 589,
            streak: 9,
            monthlyROI: '+21.4%',
            personality: 'Tournament expert who loves cinderella stories',
            specialty: 'Bracket building & upset identification',
            strengths: ['March Madness', 'Upsets', 'Seeding'],
            background: '🏀 NCAA Expert | Tournament Specialist',
            catchphrase: 'Madness is a method.',
            color: '#f59e0b',
            isPremium: false,
            hasChat: false
        },
        {
            id: 11,
            name: 'Pixel Prophet',
            sport: 'Esports',
            avatar: 'https://play.rosebud.ai/assets/esports-coach.webp.webp?F8xR',
            rank: '#11',
            tier: 'VIP',
            accuracy: 76.2,
            totalPicks: 512,
            streak: 14,
            monthlyROI: '+29.6%',
            personality: 'Next-gen analyst who lives and breathes gaming',
            specialty: 'Meta shifts & team chemistry analysis',
            strengths: ['LoL/Dota2', 'CS:GO', 'Meta Reads'],
            background: '🎮 Pro Gamer Turned Analyst | Esports Pioneer',
            catchphrase: 'GG is just the beginning.',
            color: '#a855f7',
            isPremium: true,
            hasChat: true
        }
    ],

    async init() {
        console.log('✨ Initializing Deluxe AI Coaches System');
        
        // Fetch real stats from backend
        await this.updateCoachesWithRealStats();
        
        // Render coaches with updated stats
        this.render('ai-coaches-container');
    },

    renderCoachCard(coach) {
        const tierColor = coach.tier === 'VIP' ? '#fbbf24' : '#6366f1';
        const tierGlow = coach.tier === 'VIP' ? '0 0 20px rgba(251, 191, 36, 0.5)' : '0 0 20px rgba(99, 102, 241, 0.3)';
        const chatBtn = coach.hasChat ? `
            <button class="coach-chat-btn" onclick="aiCoachesDeluxe.openChat(${coach.id})">
                <i class="fas fa-comments"></i> Chat with ${coach.name}
            </button>
        ` : `
            <button class="coach-chat-btn locked" disabled title="Upgrade to VIP">
                <i class="fas fa-lock"></i> Chat Locked
            </button>
        `;

        return `
            <div class="coach-card-deluxe" style="--coach-color: ${coach.color};">
                <div class="coach-header-deluxe">
                    <div class="coach-rank-badge">${coach.rank}</div>
                    <div class="coach-tier-badge" style="background: ${tierColor}; box-shadow: ${tierGlow};">
                        ${coach.tier}
                    </div>
                </div>

                <div class="coach-avatar-container">
                    <img src="${coach.avatar}" alt="${coach.name}" class="coach-avatar-deluxe">
                    <div class="coach-avatar-glow" style="background: ${coach.color};"></div>
                </div>

                <div class="coach-info-deluxe">
                    <h2 class="coach-name">${coach.name}</h2>
                    <p class="coach-sport">${coach.sport}</p>
                    <p class="coach-personality">"${coach.personality}"</p>
                    <p class="coach-specialty">✨ ${coach.specialty}</p>
                </div>

                <div class="coach-stats-grid">
                    <div class="stat">
                        <span class="stat-label">Win Rate</span>
                        <span class="stat-value" style="color: ${coach.color};">${coach.accuracy.toFixed(1)}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Picks</span>
                        <span class="stat-value">${coach.totalPicks}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Streak</span>
                        <span class="stat-value">🔥 ${coach.streak}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Monthly ROI</span>
                        <span class="stat-value" style="color: #10b981;">${coach.monthlyROI}</span>
                    </div>
                </div>

                <div class="coach-strengths">
                    <strong>Specializes in:</strong>
                    <div class="strength-tags">
                        ${coach.strengths.map(s => `<span class="strength-tag">${s}</span>`).join('')}
                    </div>
                </div>

                <div class="coach-background">
                    <p>${coach.background}</p>
                </div>

                <div class="coach-catchphrase">
                    <em>"${coach.catchphrase}"</em>
                </div>

                <div class="coach-actions">
                    <button class="coach-action-btn" onclick="aiCoachesDeluxe.viewPicks(${coach.id})">
                        <i class="fas fa-eye"></i> View Picks
                    </button>
                    ${chatBtn}
                </div>
            </div>
        `;
    },

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="coaches-header-deluxe">
                <h1>🤖 Elite AI Prediction Coaches</h1>
                <p>Powered by Advanced Machine Learning & Data Intelligence</p>
                <div class="tier-legend">
                    <span><span class="legend-badge">PRO</span> Pro Tier - Unlimited Picks</span>
                    <span><span class="legend-badge vip">VIP</span> VIP Tier - Chat + Exclusive Access</span>
                </div>
            </div>
            <div class="coaches-grid-deluxe">
                ${this.coaches.map(coach => this.renderCoachCard(coach)).join('')}
            </div>
        `;
    },

    viewPicks(coachId) {
        const coach = this.coaches.find(c => c.id === coachId);
        if (!coach) return;

        console.log('📊 Opening picks for ' + coach.name);
        
        // Open picks modal with coach
        if (window.aiCoachPicks && typeof window.aiCoachPicks.open === 'function') {
            window.aiCoachPicks.open(coach);
        } else {
            console.error('❌ Picks module not loaded');
            alert('Picks system is loading... Please try again in a moment.');
        }
    },

    openChat(coachId) {
        const coach = this.coaches.find(c => c.id === coachId);
        if (!coach) return;

        if (!coach.hasChat) {
            alert('💎 This feature requires VIP membership!\n\nUpgrade to chat with ' + coach.name);
            return;
        }

        console.log('💬 Opening chat with ' + coach.name);
        
        // Open chat modal with coach
        if (window.aiCoachChat && typeof window.aiCoachChat.open === 'function') {
            window.aiCoachChat.open(coach);
        } else {
            console.error('❌ Chat module not loaded');
            alert('Chat system is loading... Please try again in a moment.');
        }
    }
};

// Expose to global window for accessibility
window.aiCoachesDeluxe = aiCoachesDeluxe;

// Auto-initialize when page navigation happens
window.addEventListener('aiCoachesPageLoad', () => {
    console.log('🎯 AI Coaches page loaded, initializing...');
    aiCoachesDeluxe.init();
});

// Also initialize on DOMContentLoaded as fallback
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delayed init to ensure navigation is ready
        setTimeout(() => {
            if (aiCoachesDeluxe) aiCoachesDeluxe.init();
        }, 100);
    });
} else {
    setTimeout(() => {
        if (aiCoachesDeluxe) aiCoachesDeluxe.init();
    }, 100);
}

console.log('✅ AI Coaches Deluxe System loaded');
