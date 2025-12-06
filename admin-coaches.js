// ============================================
// Admin Dashboard - Coach Picks Manager
// Features:
// - Create & manage AI coach picks
// - Track pick results (win/loss/push)
// - View coach statistics
// - Analyze performance metrics
// - Export data
// ============================================

const API_BASE = 'https://ultimate-sports-ai-backend-production.up.railway.app';

// State Management
const state = {
    coaches: [],
    picks: [],
    stats: [],
    currentPickForResult: null,
    token: localStorage.getItem('adminToken') || null
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeEventListeners();
    loadDashboard();
});

// ============ AUTHENTICATION ============
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        // In production, redirect to admin login page
        console.log('⚠️ No admin token found. Using demo mode.');
        showNotification('Using demo mode - not authenticated', 'warning');
    }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/';
});

// ============ EVENT LISTENERS ============
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchSection(e.target.dataset.section);
        });
    });

    // Header buttons
    document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Form submission
    document.getElementById('pickForm').addEventListener('submit', createPick);

    // Modal
    const modal = document.getElementById('resultModal');
    const modalClose = document.querySelectorAll('.modal-close');
    
    modalClose.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    document.getElementById('saveResultBtn').addEventListener('click', recordPickResult);

    // Filter
    document.getElementById('filterBtn').addEventListener('click', applyFilters);
}

// ============ SECTION SWITCHING ============
function switchSection(sectionName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    // Load section data
    if (sectionName === 'coaches') loadCoaches();
    else if (sectionName === 'picks') loadPicks();
    else if (sectionName === 'stats') loadStats();
    else if (sectionName === 'history') loadHistory();
}

// ============ DASHBOARD ============
async function loadDashboard() {
    try {
        // Load coaches
        const coachesRes = await fetch(`${API_BASE}/api/ai-coaches`);
        const coachesData = await coachesRes.json();
        state.coaches = coachesData.coaches || [];

        // Update stats
        document.getElementById('totalCoaches').textContent = state.coaches.length;
        
        const totalPicks = state.coaches.reduce((sum, c) => sum + (c.total_picks || 0), 0);
        document.getElementById('totalPicks').textContent = totalPicks;

        const avgAccuracy = state.coaches.length > 0
            ? (state.coaches.reduce((sum, c) => sum + (c.accuracy || 0), 0) / state.coaches.length).toFixed(1)
            : '--';
        document.getElementById('avgAccuracy').textContent = avgAccuracy + '%';

        const activePicks = state.coaches.reduce((sum, c) => sum + (c.pending_picks || 0), 0);
        document.getElementById('activePicks').textContent = activePicks;

        // Top coaches
        renderTopCoaches();

        // Recent picks (mock for now)
        renderRecentPicks();

        // Populate coach select
        populateCoachSelect();

        showNotification('Dashboard loaded ✨', 'success');
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Failed to load dashboard', 'error');
    }
}

function renderTopCoaches() {
    const sorted = [...state.coaches].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0)).slice(0, 5);
    
    const html = sorted.map(coach => `
        <div class="coach-item">
            <div>
                <div class="coach-name">${coach.avatar} ${coach.name}</div>
                <div style="font-size: 0.75rem; color: #9ca3af;">${coach.specialty}</div>
            </div>
            <div class="coach-accuracy">${coach.accuracy || 0}%</div>
        </div>
    `).join('');

    document.getElementById('topCoaches').innerHTML = html || '<div class="loading">No coaches yet</div>';
}

function renderRecentPicks() {
    // Mock recent picks for demo
    const mockPicks = [
        { coach: 'The Analyst', team: 'Lakers -5.5', confidence: 87, odds: -115 },
        { coach: 'Sharp Shooter', team: 'Chiefs ML', confidence: 92, odds: -180 },
        { coach: 'Data Dragon', team: 'Yankees -1.5', confidence: 78, odds: -110 }
    ];

    const html = mockPicks.map(pick => `
        <div class="pick-item">
            <div class="pick-info">
                <div class="pick-team">${pick.team}</div>
                <div style="font-size: 0.75rem; color: #9ca3af;">${pick.coach}</div>
            </div>
            <div style="display: flex; gap: 1rem; align-items: center;">
                <span class="pick-confidence">${pick.confidence}%</span>
                <span style="color: #9ca3af;">${pick.odds}</span>
            </div>
        </div>
    `).join('');

    document.getElementById('recentPicks').innerHTML = html;
}

function populateCoachSelect() {
    const select = document.getElementById('coachSelect');
    const filterSelect = document.getElementById('filterCoach');
    
    const html = state.coaches.map(coach => `
        <option value="${coach.id}">${coach.avatar} ${coach.name} (${coach.specialty})</option>
    `).join('');

    select.innerHTML = '<option value="">Choose a coach...</option>' + html;
    filterSelect.innerHTML = '<option value="">All Coaches</option>' + html;
}

// ============ COACHES SECTION ============
async function loadCoaches() {
    try {
        const sorted = [...state.coaches].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
        
        const html = sorted.map(coach => `
            <div class="coach-card">
                <div class="coach-avatar">${coach.avatar}</div>
                <div class="coach-header">
                    <div class="coach-name-header">${coach.name}</div>
                    <div class="coach-specialty">${coach.specialty}</div>
                    <div>
                        <span class="coach-badge ${coach.tier === 'VIP' ? 'vip' : ''}">
                            ${coach.tier}
                        </span>
                        <span class="coach-badge" style="margin-left: 0.5rem;">
                            ${coach.strategy}
                        </span>
                    </div>
                </div>
                <div class="coach-stats-mini">
                    <div class="coach-stat-mini">
                        <div class="coach-stat-mini-label">Accuracy</div>
                        <div class="coach-stat-mini-value">${coach.accuracy || 0}%</div>
                    </div>
                    <div class="coach-stat-mini">
                        <div class="coach-stat-mini-label">Picks</div>
                        <div class="coach-stat-mini-value">${coach.total_picks || 0}</div>
                    </div>
                    <div class="coach-stat-mini">
                        <div class="coach-stat-mini-label">Win Streak</div>
                        <div class="coach-stat-mini-value">${coach.win_streak || 0}</div>
                    </div>
                    <div class="coach-stat-mini">
                        <div class="coach-stat-mini-label">ROI</div>
                        <div class="coach-stat-mini-value">${coach.roi || 0}%</div>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('coachGrid').innerHTML = html;
    } catch (error) {
        console.error('Error loading coaches:', error);
        showNotification('Failed to load coaches', 'error');
    }
}

// ============ PICKS MANAGEMENT ============
async function createPick(e) {
    e.preventDefault();

    const pick = {
        coach_id: parseInt(document.getElementById('coachSelect').value),
        sport: document.getElementById('sportInput').value,
        home_team: document.getElementById('homeTeamInput').value,
        away_team: document.getElementById('awayTeamInput').value,
        pick_team: document.getElementById('pickTeamInput').value,
        pick_type: document.getElementById('pickTypeSelect').value,
        odds: parseInt(document.getElementById('oddsInput').value),
        confidence: parseInt(document.getElementById('confidenceInput').value),
        game_time: new Date(document.getElementById('gameTimeInput').value).toISOString(),
        reasoning: document.getElementById('reasoningInput').value
    };

    try {
        const res = await fetch(`${API_BASE}/api/admin/picks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify(pick)
        });

        if (res.ok) {
            showNotification('✅ Pick created successfully!', 'success');
            document.getElementById('pickForm').reset();
            await loadPicks();
        } else {
            throw new Error('Failed to create pick');
        }
    } catch (error) {
        console.error('Error creating pick:', error);
        showNotification('Failed to create pick', 'error');
    }
}

async function loadPicks() {
    try {
        // Mock picks for demo
        const picks = [
            {
                id: 1,
                coach_id: 1,
                coach_name: 'The Analyst',
                sport: 'NBA',
                home_team: 'Lakers',
                away_team: 'Celtics',
                pick_team: 'Lakers',
                pick_type: 'spread',
                odds: -110,
                confidence: 87,
                status: 'pending'
            }
        ];

        const html = picks.map(pick => `
            <tr>
                <td>${pick.coach_name}</td>
                <td>${pick.sport}</td>
                <td>${pick.away_team} @ ${pick.home_team}</td>
                <td>${pick.pick_team}</td>
                <td>${pick.odds}</td>
                <td>${pick.confidence}%</td>
                <td><span class="status-badge status-pending">Pending</span></td>
                <td>
                    <button class="btn-secondary" onclick="openResultModal(${pick.id})" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">Record Result</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('activePicsTable').innerHTML = html;
    } catch (error) {
        console.error('Error loading picks:', error);
        showNotification('Failed to load picks', 'error');
    }
}

function openResultModal(pickId) {
    state.currentPickForResult = pickId;
    document.getElementById('resultModal').classList.add('active');
}

async function recordPickResult() {
    const result = document.getElementById('resultSelect').value;
    if (!result || !state.currentPickForResult) {
        showNotification('Please select a result', 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/admin/picks/${state.currentPickForResult}/result`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ result })
        });

        if (res.ok) {
            showNotification('✅ Result recorded!', 'success');
            document.getElementById('resultModal').classList.remove('active');
            document.getElementById('resultSelect').value = '';
            await loadPicks();
        }
    } catch (error) {
        console.error('Error recording result:', error);
        showNotification('Failed to record result', 'error');
    }
}

// ============ STATISTICS ============
async function loadStats() {
    try {
        const html = state.coaches.map((coach, idx) => `
            <tr>
                <td>${coach.avatar} ${coach.name}</td>
                <td>${coach.specialty}</td>
                <td>${coach.total_picks || 0}</td>
                <td>${Math.round((coach.accuracy || 0) * (coach.total_picks || 1) / 100)}</td>
                <td>${Math.round((coach.total_picks || 0) - (coach.accuracy || 0) * (coach.total_picks || 1) / 100)}</td>
                <td>${coach.accuracy || 0}%</td>
                <td>${coach.win_streak || 0}</td>
                <td>${coach.roi || 0}%</td>
            </tr>
        `).join('');

        document.getElementById('statsTableBody').innerHTML = html;
    } catch (error) {
        console.error('Error loading stats:', error);
        showNotification('Failed to load statistics', 'error');
    }
}

// ============ HISTORY ============
async function loadHistory() {
    try {
        // Mock history for demo
        const history = [
            {
                date: new Date().toISOString().split('T')[0],
                coach: 'The Analyst',
                sport: 'NBA',
                matchup: 'Lakers @ Celtics',
                pick: 'Lakers -5.5',
                odds: -110,
                confidence: 87,
                result: 'win',
                reasoning: 'Strong home court advantage'
            }
        ];

        const html = history.map(item => `
            <tr>
                <td>${item.date}</td>
                <td>${item.coach}</td>
                <td>${item.sport}</td>
                <td>${item.matchup}</td>
                <td>${item.pick}</td>
                <td>${item.odds}</td>
                <td>${item.confidence}%</td>
                <td><span class="status-badge status-${item.result}">${item.result.toUpperCase()}</span></td>
                <td title="${item.reasoning}">${item.reasoning.substring(0, 30)}...</td>
                <td>
                    <button class="btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="editPick()">Edit</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('historyTableBody').innerHTML = html;
    } catch (error) {
        console.error('Error loading history:', error);
        showNotification('Failed to load history', 'error');
    }
}

function applyFilters() {
    const coachFilter = document.getElementById('filterCoach').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const dateFilter = document.getElementById('filterDate').value;

    console.log('Filtering by:', { coachFilter, statusFilter, dateFilter });
    showNotification('Filters applied!', 'success');
}

// ============ DATA EXPORT ============
function exportData() {
    const exportData = {
        timestamp: new Date().toISOString(),
        coaches: state.coaches,
        picks: state.picks,
        stats: state.stats
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `coach-data-${new Date().getTime()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showNotification('📥 Data exported successfully!', 'success');
}

// ============ NOTIFICATIONS ============
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Helper function for edit (placeholder)
function editPick() {
    showNotification('Edit functionality coming soon!', 'warning');
}
