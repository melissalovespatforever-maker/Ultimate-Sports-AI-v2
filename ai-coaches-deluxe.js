// ============================================
// AI COACHES SYSTEM - REAL DATA ONLY
// NO MOCK DATA - Backend API Required
// Shows message if data unavailable
// ============================================

console.log('🔥 AI Coaches Real Data System loading...');

const aiCoachesDeluxe = {
    coaches: [],
    cachedStats: null,
    cacheTimestamp: null,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    apiUrl: null,

    init() {
        this.apiUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
        console.log('✅ AI Coaches initialized');
        console.log('📡 Backend URL:', this.apiUrl);
        
        this.setupCoachCards();
    },

    setupCoachCards() {
        const container = document.getElementById('ai-coaches-container');
        if (!container) {
            console.warn('⚠️ No ai-coaches-container found');
            return;
        }

        console.log('📋 Setting up coach cards...');
        this.loadCoaches();
    },

    async loadCoaches() {
        const container = document.getElementById('ai-coaches-container');
        if (!container) return;

        try {
            // Show loading state
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div class="spinner" style="width: 48px; height: 48px; margin: 0 auto 20px;"></div>
                    <p>Loading AI Coaches...</p>
                </div>
            `;

            // Fetch from backend
            const coaches = await this.fetchCoaches();

            if (!coaches || coaches.length === 0) {
                // NO DATA - Show message, not mock data
                container.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; margin: 20px;">
                        <i class="fas fa-database" style="font-size: 64px; color: var(--text-muted); margin-bottom: 16px; display: block;"></i>
                        <h3 style="margin: 0 0 12px;">No Real Data Available</h3>
                        <p style="color: var(--text-secondary); margin: 0 0 20px;">
                            AI Coach picks require backend connection. Ensure Railway backend is running.
                        </p>
                        <button class="btn btn-secondary" onclick="location.reload()">
                            <i class="fas fa-sync-alt"></i> Retry
                        </button>
                    </div>
                `;
                console.warn('⚠️ No coaches available - showing message instead of mock data');
                return;
            }

            // RENDER REAL DATA
            this.renderCoaches(coaches);

        } catch (error) {
            console.error('❌ Error loading coaches:', error);
            
            // Show error message - NO mock data
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; margin: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #ef4444; margin-bottom: 16px; display: block;"></i>
                    <h3 style="margin: 0 0 12px;">Failed to Load AI Coaches</h3>
                    <p style="color: var(--text-secondary); margin: 0 0 10px;">
                        ${error.message || 'Backend connection failed'}
                    </p>
                    <p style="color: var(--text-secondary); font-size: 12px; margin: 0 0 20px;">
                        Check that Railway backend is running at:<br>
                        <code style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; display: inline-block;">
                            ${this.apiUrl}
                        </code>
                    </p>
                    <button class="btn btn-secondary" onclick="location.reload()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    async fetchCoaches() {
        try {
            console.log('🔄 Fetching coaches from:', `${this.apiUrl}/api/ai-coaches`);

            // Check cache first
            if (this.cachedStats && this.cacheTimestamp && (Date.now() - this.cacheTimestamp < this.CACHE_DURATION)) {
                console.log('✅ Using cached coaches data');
                return this.cachedStats;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`${this.apiUrl}/api/ai-coaches`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeoutId);

            console.log('📊 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📦 Received coaches:', data);

            // Validate data structure
            let coaches = [];
            if (data.success && Array.isArray(data.coaches)) {
                coaches = data.coaches;
            } else if (Array.isArray(data.data)) {
                coaches = data.data;
            } else if (Array.isArray(data)) {
                coaches = data;
            } else {
                throw new Error('Invalid response format - no coaches array found');
            }

            if (coaches.length === 0) {
                console.warn('⚠️ Backend returned empty coaches array');
                return null;
            }

            // Cache the results
            this.cachedStats = coaches;
            this.cacheTimestamp = Date.now();

            console.log('✅ Successfully fetched', coaches.length, 'coaches');
            return coaches;

        } catch (error) {
            console.error('❌ Fetch error:', error.message);
            throw error; // Re-throw to caller
        }
    },

    renderCoaches(coaches) {
        const container = document.getElementById('ai-coaches-container');
        if (!container) return;

        console.log('🎨 Rendering', coaches.length, 'real coaches');

        container.innerHTML = coaches.map((coach, index) => {
            return `
                <div class="coach-card" data-coach-id="${coach.id || index}">
                    <div class="coach-header">
                        <img src="${coach.avatar || 'https://via.placeholder.com/64'}" alt="${coach.name}" class="coach-avatar">
                        <div class="coach-info">
                            <h3>${coach.name || 'Unknown Coach'}</h3>
                            <p class="coach-sport">${coach.sport || 'Mixed'}</p>
                        </div>
                    </div>

                    <div class="coach-stats">
                        <div class="stat">
                            <span class="stat-label">Win Rate</span>
                            <span class="stat-value">${coach.accuracy || coach.winRate || '—'}%</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Streak</span>
                            <span class="stat-value">${coach.streak || '—'}</span>
                        </div>
                    </div>

                    <div class="coach-description">
                        <p>${coach.description || coach.catchphrase || 'AI-powered sports prediction coach'}</p>
                    </div>

                    <button class="btn btn-primary btn-block" onclick="aiCoachPicks.open(${JSON.stringify(coach).replace(/"/g, '&quot;')})">
                        <i class="fas fa-chart-line"></i> View Real Picks
                    </button>
                </div>
            `;
        }).join('');

        // Store coaches for later use
        this.coaches = coaches;

        console.log('✅ Rendered', coaches.length, 'coaches');
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        aiCoachesDeluxe.init();
    });
} else {
    aiCoachesDeluxe.init();
}

// Also trigger on page navigation
document.addEventListener('page-ai-coaches-loaded', () => {
    console.log('📄 AI Coaches page loaded');
    aiCoachesDeluxe.loadCoaches();
});

// Export globally
window.aiCoachesDeluxe = aiCoachesDeluxe;
