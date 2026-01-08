// ============================================
// CHAT MODERATION PANEL UI
// Admin interface for moderation controls
// ============================================

import { logger } from './logger.js';

logger.info('Moderation Panel', 'Loading UI');

class ChatModerationPanel {
    constructor() {
        this.isOpen = false;
        this.currentTab = 'settings';
        this.moderation = window.chatModeration;
        this.init();
    }

    init() {
        this.createPanelHTML();
        this.attachEventListeners();
        logger.info('Moderation Panel', 'UI initialized');
    }

    createPanelHTML() {
        const panel = document.createElement('div');
        panel.id = 'moderation-panel';
        panel.className = 'moderation-panel';
        panel.innerHTML = `
            <div class="moderation-panel-overlay"></div>
            <div class="moderation-panel-content">
                <div class="moderation-header">
                    <h2>🛡️ Chat Moderation</h2>
                    <button class="close-btn" id="close-moderation-panel">✕</button>
                </div>

                <div class="moderation-tabs">
                    <button class="mod-tab active" data-tab="settings">⚙️ Settings</button>
                    <button class="mod-tab" data-tab="users">👥 Users</button>
                    <button class="mod-tab" data-tab="filters">🔍 Filters</button>
                    <button class="mod-tab" data-tab="stats">📊 Stats</button>
                </div>

                <div class="moderation-body">
                    <!-- Settings Tab -->
                    <div class="mod-tab-content active" data-tab="settings">
                        <div class="mod-section">
                            <h3>Auto-Moderation</h3>
                            <div class="mod-toggle">
                                <label>
                                    <input type="checkbox" id="mod-enabled" checked>
                                    <span>Enable Auto-Moderation</span>
                                </label>
                            </div>
                            <div class="mod-toggle">
                                <label>
                                    <input type="checkbox" id="mod-profanity" checked>
                                    <span>Filter Profanity</span>
                                </label>
                            </div>
                            <div class="mod-toggle">
                                <label>
                                    <input type="checkbox" id="mod-spam" checked>
                                    <span>Block Spam</span>
                                </label>
                            </div>
                            <div class="mod-toggle">
                                <label>
                                    <input type="checkbox" id="mod-links">
                                    <span>Block Unauthorized Links</span>
                                </label>
                            </div>
                            <div class="mod-toggle">
                                <label>
                                    <input type="checkbox" id="mod-caps" checked>
                                    <span>Detect Excessive Caps</span>
                                </label>
                            </div>
                            <div class="mod-toggle">
                                <label>
                                    <input type="checkbox" id="mod-repeated" checked>
                                    <span>Filter Repeated Characters</span>
                                </label>
                            </div>
                            <div class="mod-toggle">
                                <label>
                                    <input type="checkbox" id="mod-toxic" checked>
                                    <span>AI Toxicity Protection</span>
                                </label>
                            </div>
                        </div>

                        <div class="mod-section">
                            <h3>Thresholds</h3>
                            <div class="mod-input-group">
                                <label>Max Messages Per Minute:</label>
                                <input type="number" id="mod-msg-rate" value="10" min="1" max="50">
                            </div>
                            <div class="mod-input-group">
                                <label>Auto-Mute After Warnings:</label>
                                <input type="number" id="mod-auto-mute" value="3" min="1" max="10">
                            </div>
                            <div class="mod-input-group">
                                <label>Mute Duration (minutes):</label>
                                <input type="number" id="mod-mute-duration" value="10" min="1" max="1440">
                            </div>
                        </div>

                        <button class="mod-btn mod-btn-primary" id="save-mod-settings">💾 Save Settings</button>
                    </div>

                    <!-- Users Tab -->
                    <div class="mod-tab-content" data-tab="users">
                        <div class="mod-section">
                            <h3>Muted Users</h3>
                            <div id="muted-users-list" class="user-list">
                                <p class="empty-state">No muted users</p>
                            </div>
                        </div>

                        <div class="mod-section">
                            <h3>Banned Users</h3>
                            <div id="banned-users-list" class="user-list">
                                <p class="empty-state">No banned users</p>
                            </div>
                        </div>

                        <div class="mod-section">
                            <h3>Warnings</h3>
                            <div id="warnings-list" class="user-list">
                                <p class="empty-state">No warnings issued</p>
                            </div>
                        </div>

                        <div class="mod-section">
                            <h3>Quick Actions</h3>
                            <div class="quick-actions">
                                <input type="text" id="quick-user-id" placeholder="User ID">
                                <input type="text" id="quick-username" placeholder="Username">
                                <select id="quick-action">
                                    <option value="mute-5">Mute 5 min</option>
                                    <option value="mute-30">Mute 30 min</option>
                                    <option value="mute-60">Mute 1 hour</option>
                                    <option value="ban">Ban User</option>
                                    <option value="warn">Issue Warning</option>
                                    <option value="clear">Clear Warnings</option>
                                </select>
                                <button class="mod-btn mod-btn-danger" id="execute-quick-action">Execute</button>
                            </div>
                        </div>
                    </div>

                    <!-- Filters Tab -->
                    <div class="mod-tab-content" data-tab="filters">
                        <div class="mod-section">
                            <h3>Profanity List</h3>
                            <p class="mod-description">Manage filtered words (case-insensitive)</p>
                            <div class="filter-manager">
                                <input type="text" id="add-profanity-input" placeholder="Add word to filter">
                                <button class="mod-btn mod-btn-sm" id="add-profanity-btn">➕ Add</button>
                            </div>
                            <div id="profanity-list" class="filter-list">
                                <!-- Dynamically populated -->
                            </div>
                        </div>

                        <div class="mod-section">
                            <h3>Allowed Domains</h3>
                            <p class="mod-description">Whitelist domains for link sharing</p>
                            <div class="filter-manager">
                                <input type="text" id="add-domain-input" placeholder="example.com">
                                <button class="mod-btn mod-btn-sm" id="add-domain-btn">➕ Add</button>
                            </div>
                            <div id="domain-list" class="filter-list">
                                <!-- Dynamically populated -->
                            </div>
                        </div>
                    </div>

                    <!-- Stats Tab -->
                    <div class="mod-tab-content" data-tab="stats">
                        <div class="mod-section">
                            <h3>Moderation Statistics</h3>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-value" id="stat-muted">0</div>
                                    <div class="stat-label">Muted Users</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="stat-banned">0</div>
                                    <div class="stat-label">Banned Users</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="stat-warnings">0</div>
                                    <div class="stat-label">Total Warnings</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="stat-users-warned">0</div>
                                    <div class="stat-label">Users with Warnings</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="stat-moderators">0</div>
                                    <div class="stat-label">Moderators</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="stat-admins">0</div>
                                    <div class="stat-label">Admins</div>
                                </div>
                                <div class="stat-card ai-stat">
                                    <div class="stat-value" id="stat-mood">NEUTRAL</div>
                                    <div class="stat-label">Community Mood (AI)</div>
                                </div>
                                <div class="stat-card ai-stat">
                                    <div class="stat-value" id="stat-hype">0</div>
                                    <div class="stat-label">Hype Events (AI)</div>
                                </div>
                            </div>
                        </div>

                        <button class="mod-btn mod-btn-secondary" id="refresh-stats">🔄 Refresh Stats</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
    }

    attachEventListeners() {
        // Close button
        document.getElementById('close-moderation-panel').addEventListener('click', () => {
            this.close();
        });

        // Tab switching
        document.querySelectorAll('.mod-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Settings
        document.getElementById('save-mod-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Quick actions
        document.getElementById('execute-quick-action').addEventListener('click', () => {
            this.executeQuickAction();
        });

        // Filter management
        document.getElementById('add-profanity-btn').addEventListener('click', () => {
            this.addProfanityWord();
        });

        document.getElementById('add-domain-btn').addEventListener('click', () => {
            this.addAllowedDomain();
        });

        // Stats refresh
        document.getElementById('refresh-stats').addEventListener('click', () => {
            this.updateStats();
        });

        // Close on overlay click
        document.querySelector('.moderation-panel-overlay').addEventListener('click', () => {
            this.close();
        });
    }

    // ============================================
    // PANEL CONTROLS
    // ============================================

    open() {
        this.isOpen = true;
        document.getElementById('moderation-panel').classList.add('active');
        this.loadCurrentSettings();
        this.updateUserLists();
        this.updateStats();
        logger.debug('Moderation Panel', 'Opened');
    }

    close() {
        this.isOpen = false;
        document.getElementById('moderation-panel').classList.remove('active');
        logger.debug('Moderation Panel', 'Closed');
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.mod-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.mod-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });

        this.currentTab = tabName;

        // Load data for specific tabs
        if (tabName === 'users') {
            this.updateUserLists();
        } else if (tabName === 'filters') {
            this.updateFilterLists();
        } else if (tabName === 'stats') {
            this.updateStats();
        }
    }

    // ============================================
    // SETTINGS
    // ============================================

    loadCurrentSettings() {
        const settings = this.moderation.getSettings();
        
        document.getElementById('mod-enabled').checked = settings.enabled;
        document.getElementById('mod-profanity').checked = settings.filterProfanity;
        document.getElementById('mod-spam').checked = settings.blockSpam;
        document.getElementById('mod-links').checked = settings.blockLinks;
        document.getElementById('mod-caps').checked = settings.blockCaps;
        document.getElementById('mod-repeated').checked = settings.blockRepeatedChars;
        document.getElementById('mod-toxic').checked = settings.blockToxic;
        
        document.getElementById('mod-msg-rate').value = this.moderation.spamThresholds.maxMessagesPerMinute;
        document.getElementById('mod-auto-mute').value = settings.autoMuteOnWarnings;
        document.getElementById('mod-mute-duration').value = settings.muteDuration / 60000;
    }

    saveSettings() {
        const newSettings = {
            enabled: document.getElementById('mod-enabled').checked,
            filterProfanity: document.getElementById('mod-profanity').checked,
            blockSpam: document.getElementById('mod-spam').checked,
            blockLinks: document.getElementById('mod-links').checked,
            blockCaps: document.getElementById('mod-caps').checked,
            blockRepeatedChars: document.getElementById('mod-repeated').checked,
            blockToxic: document.getElementById('mod-toxic').checked,
            autoMuteOnWarnings: parseInt(document.getElementById('mod-auto-mute').value),
            muteDuration: parseInt(document.getElementById('mod-mute-duration').value) * 60000
        };

        this.moderation.spamThresholds.maxMessagesPerMinute = parseInt(document.getElementById('mod-msg-rate').value);
        this.moderation.updateSettings(newSettings);

        this.showToast('✅ Settings saved successfully', 'success');
        logger.info('Moderation Panel', 'Settings saved');
    }

    // ============================================
    // USER LISTS
    // ============================================

    updateUserLists() {
        this.updateMutedUsers();
        this.updateBannedUsers();
        this.updateWarnings();
    }

    updateMutedUsers() {
        const container = document.getElementById('muted-users-list');
        const mutedUsers = [...this.moderation.mutedUsers.entries()];

        if (mutedUsers.length === 0) {
            container.innerHTML = '<p class="empty-state">No muted users</p>';
            return;
        }

        container.innerHTML = mutedUsers.map(([userId, info]) => {
            const remaining = Math.ceil((info.until - Date.now()) / 1000 / 60);
            return `
                <div class="user-item">
                    <div class="user-info">
                        <strong>User ${userId}</strong>
                        <span class="user-reason">${info.reason}</span>
                        <span class="user-time">${remaining} minutes remaining</span>
                    </div>
                    <button class="mod-btn mod-btn-sm" onclick="window.moderationPanel.unmuteUser('${userId}')">Unmute</button>
                </div>
            `;
        }).join('');
    }

    updateBannedUsers() {
        const container = document.getElementById('banned-users-list');
        const bannedUsers = [...this.moderation.bannedUsers];

        if (bannedUsers.length === 0) {
            container.innerHTML = '<p class="empty-state">No banned users</p>';
            return;
        }

        container.innerHTML = bannedUsers.map(userId => `
            <div class="user-item">
                <div class="user-info">
                    <strong>User ${userId}</strong>
                </div>
                <button class="mod-btn mod-btn-sm" onclick="window.moderationPanel.unbanUser('${userId}')">Unban</button>
            </div>
        `).join('');
    }

    updateWarnings() {
        const container = document.getElementById('warnings-list');
        const warnings = [...this.moderation.warnings.entries()];

        if (warnings.length === 0) {
            container.innerHTML = '<p class="empty-state">No warnings issued</p>';
            return;
        }

        container.innerHTML = warnings.map(([userId, userWarnings]) => `
            <div class="user-item">
                <div class="user-info">
                    <strong>User ${userId}</strong>
                    <span class="user-warnings">${userWarnings.length} warning(s)</span>
                    ${userWarnings.slice(-3).map(w => `
                        <span class="user-reason">${w.reason}</span>
                    `).join('')}
                </div>
                <button class="mod-btn mod-btn-sm" onclick="window.moderationPanel.clearUserWarnings('${userId}')">Clear</button>
            </div>
        `).join('');
    }

    // ============================================
    // QUICK ACTIONS
    // ============================================

    executeQuickAction() {
        const userId = document.getElementById('quick-user-id').value.trim();
        const username = document.getElementById('quick-username').value.trim();
        const action = document.getElementById('quick-action').value;

        if (!userId || !username) {
            this.showToast('❌ Please enter User ID and Username', 'error');
            return;
        }

        const currentUserId = localStorage.getItem('unified_user_id') || 'admin';

        switch (action) {
            case 'mute-5':
                this.moderation.muteUser(userId, username, 5 * 60000, 'Manual mute', currentUserId);
                this.showToast(`✅ ${username} muted for 5 minutes`, 'success');
                break;
            case 'mute-30':
                this.moderation.muteUser(userId, username, 30 * 60000, 'Manual mute', currentUserId);
                this.showToast(`✅ ${username} muted for 30 minutes`, 'success');
                break;
            case 'mute-60':
                this.moderation.muteUser(userId, username, 60 * 60000, 'Manual mute', currentUserId);
                this.showToast(`✅ ${username} muted for 1 hour`, 'success');
                break;
            case 'ban':
                this.moderation.banUser(userId, username, 'Manual ban', currentUserId);
                this.showToast(`✅ ${username} banned`, 'success');
                break;
            case 'warn':
                this.moderation.addWarning(userId, username, 'Manual warning');
                this.showToast(`✅ Warning issued to ${username}`, 'success');
                break;
            case 'clear':
                this.moderation.clearWarnings(userId, username);
                this.showToast(`✅ Warnings cleared for ${username}`, 'success');
                break;
        }

        // Clear inputs
        document.getElementById('quick-user-id').value = '';
        document.getElementById('quick-username').value = '';

        // Refresh lists
        this.updateUserLists();
    }

    // Public methods for unmute/unban
    unmuteUser(userId) {
        this.moderation.unmuteUser(userId, `User ${userId}`);
        this.showToast('✅ User unmuted', 'success');
        this.updateUserLists();
    }

    unbanUser(userId) {
        this.moderation.unbanUser(userId, `User ${userId}`);
        this.showToast('✅ User unbanned', 'success');
        this.updateUserLists();
    }

    clearUserWarnings(userId) {
        this.moderation.clearWarnings(userId, `User ${userId}`);
        this.showToast('✅ Warnings cleared', 'success');
        this.updateUserLists();
    }

    // ============================================
    // FILTER MANAGEMENT
    // ============================================

    updateFilterLists() {
        this.updateProfanityList();
        this.updateDomainList();
    }

    updateProfanityList() {
        const container = document.getElementById('profanity-list');
        const words = [...this.moderation.profanityList];

        if (words.length === 0) {
            container.innerHTML = '<p class="empty-state">No filtered words</p>';
            return;
        }

        container.innerHTML = words.map(word => `
            <div class="filter-item">
                <span>${word}</span>
                <button class="filter-remove" onclick="window.moderationPanel.removeProfanityWord('${word}')">✕</button>
            </div>
        `).join('');
    }

    updateDomainList() {
        const container = document.getElementById('domain-list');
        const domains = [...this.moderation.allowedDomains];

        container.innerHTML = domains.map(domain => `
            <div class="filter-item">
                <span>${domain}</span>
                <button class="filter-remove" onclick="window.moderationPanel.removeDomain('${domain}')">✕</button>
            </div>
        `).join('');
    }

    addProfanityWord() {
        const input = document.getElementById('add-profanity-input');
        const word = input.value.trim().toLowerCase();

        if (!word) return;

        this.moderation.addProfanity(word);
        input.value = '';
        this.updateProfanityList();
        this.showToast(`✅ Added "${word}" to filter`, 'success');
    }

    removeProfanityWord(word) {
        this.moderation.removeProfanity(word);
        this.updateProfanityList();
        this.showToast(`✅ Removed "${word}" from filter`, 'success');
    }

    addAllowedDomain() {
        const input = document.getElementById('add-domain-input');
        const domain = input.value.trim().toLowerCase();

        if (!domain) return;

        this.moderation.addAllowedDomain(domain);
        input.value = '';
        this.updateDomainList();
        this.showToast(`✅ Added ${domain} to whitelist`, 'success');
    }

    removeDomain(domain) {
        this.moderation.removeAllowedDomain(domain);
        this.updateDomainList();
        this.showToast(`✅ Removed ${domain} from whitelist`, 'success');
    }

    // ============================================
    // STATS
    // ============================================

    updateStats() {
        const stats = this.moderation.getStats();
        const sessionStats = this.moderation.sessionStats;
        
        document.getElementById('stat-muted').textContent = stats.mutedUsers;
        document.getElementById('stat-banned').textContent = stats.bannedUsers;
        document.getElementById('stat-warnings').textContent = stats.totalWarnings;
        document.getElementById('stat-users-warned').textContent = stats.usersWithWarnings;
        document.getElementById('stat-moderators').textContent = stats.moderators;
        document.getElementById('stat-admins').textContent = stats.admins;

        // AI specific stats
        const moodEl = document.getElementById('stat-mood');
        const mood = this.moderation.getMoodLabel(sessionStats.averageSentiment);
        moodEl.textContent = mood;
        moodEl.style.color = mood.includes('🔥') || mood.includes('😊') ? '#4CAF50' : mood.includes('😐') ? '#FFD700' : '#e74c3c';
        
        document.getElementById('stat-hype').textContent = sessionStats.hypeEvents;
    }

    // ============================================
    // UI HELPERS
    // ============================================

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize panel
window.moderationPanel = new ChatModerationPanel();

// Export for module usage
export { ChatModerationPanel };
