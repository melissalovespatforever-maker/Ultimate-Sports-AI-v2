// ============================================
// CHAT MODERATION SYSTEM
// Real-time filtering, spam detection, and admin controls
// ============================================

import { logger } from './logger.js';
import { SentimentAnalyzer } from './sentiment-analyzer.js';

logger.info('Chat Moderation', 'Loading system');

class ChatModerationSystem {
    constructor() {
        this.analyzer = window.sentimentAnalyzer || new SentimentAnalyzer();
        
        // Profanity filter lists
        this.profanityList = new Set([
            // Common profanity (censored versions for code)
            'badword1', 'badword2', 'badword3', 'profanity',
            'offensive', 'slur', 'curse', 'vulgar',
            // Add more as needed - keeping generic for example
        ]);

        // Spam detection
        this.messageHistory = new Map(); // userId -> [{message, timestamp}]
        this.spamThresholds = {
            maxMessagesPerMinute: 10,
            maxDuplicatesPerMinute: 3,
            minMessageInterval: 1000, // 1 second
            maxMessageLength: 500,
            maxCapsPercentage: 0.7,
            maxEmojisPerMessage: 15,
            maxUrlsPerMessage: 2
        };

        // User moderation state
        this.mutedUsers = new Map(); // userId -> {until: timestamp, reason: string}
        this.bannedUsers = new Set();
        this.warnings = new Map(); // userId -> [{reason, timestamp}]
        
        // URL whitelist
        this.allowedDomains = new Set([
            'youtube.com', 'youtu.be', 'twitter.com', 'x.com',
            'twitch.tv', 'espn.com', 'nba.com', 'nfl.com'
        ]);

        // Regex patterns
        this.patterns = {
            url: /https?:\/\/[^\s]+/gi,
            email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
            phone: /(\+\d{1,3}[- ]?)?\d{10}/g,
            repeatedChars: /(.)\1{4,}/g,
            emoji: /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
        };

        // Auto-moderation settings
        this.autoModSettings = {
            enabled: true,
            filterProfanity: true,
            blockSpam: true,
            blockLinks: false, // Allow whitelisted
            blockCaps: true,
            blockRepeatedChars: true,
            blockToxic: true, // NEW: AI Toxicity blocking
            toxicityThreshold: 0.4,
            autoMuteOnWarnings: 3, // Auto-mute after 3 warnings
            muteDuration: 600000 // 10 minutes
        };

        // Sentiment stats for the session
        this.sessionStats = {
            messagesProcessed: 0,
            averageSentiment: 0,
            toxicityEvents: 0,
            hypeEvents: 0
        };

        // Admin permissions
        this.moderators = new Set();
        this.admins = new Set();

        this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
        this.loadSettings();
        this.startCleanupInterval();
        logger.info('Chat Moderation', 'System initialized');
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('chat_moderation_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                Object.assign(this.autoModSettings, settings);
            }

            const mutedUsers = localStorage.getItem('chat_muted_users');
            if (mutedUsers) {
                const parsed = JSON.parse(mutedUsers);
                this.mutedUsers = new Map(parsed);
            }

            const warnings = localStorage.getItem('chat_warnings');
            if (warnings) {
                const parsed = JSON.parse(warnings);
                this.warnings = new Map(parsed);
            }

            logger.debug('Chat Moderation', 'Settings loaded');
        } catch (error) {
            logger.error('Chat Moderation', `Failed to load settings: ${error.message}`);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('chat_moderation_settings', JSON.stringify(this.autoModSettings));
            localStorage.setItem('chat_muted_users', JSON.stringify([...this.mutedUsers]));
            localStorage.setItem('chat_warnings', JSON.stringify([...this.warnings]));
        } catch (error) {
            logger.error('Chat Moderation', `Failed to save settings: ${error.message}`);
        }
    }

    // ============================================
    // MESSAGE FILTERING
    // ============================================

    /**
     * Main message validation - returns filtered message or null if blocked
     */
    validateMessage(message, userId, username) {
        if (!this.autoModSettings.enabled) {
            return { allowed: true, message, warnings: [] };
        }

        const result = {
            allowed: true,
            message: message,
            filtered: false,
            warnings: [],
            violations: []
        };

        // Check if user is banned
        if (this.isBanned(userId)) {
            return { allowed: false, reason: 'User is banned', blocked: true };
        }

        // Check if user is muted
        if (this.isMuted(userId)) {
            const muteInfo = this.mutedUsers.get(userId);
            const remaining = Math.ceil((muteInfo.until - Date.now()) / 1000);
            return { 
                allowed: false, 
                reason: `You are muted for ${remaining} more seconds. Reason: ${muteInfo.reason}`,
                blocked: true 
            };
        }

        // Length check
        if (message.length > this.spamThresholds.maxMessageLength) {
            result.violations.push('Message too long');
            return { allowed: false, reason: 'Message exceeds maximum length', blocked: true };
        }

        // Empty message check
        if (!message.trim()) {
            return { allowed: false, reason: 'Empty message', blocked: true };
        }

        // Spam detection
        const spamCheck = this.checkSpam(userId, message);
        if (!spamCheck.allowed) {
            this.addWarning(userId, username, 'Spam detected');
            return spamCheck;
        }

        // AI Sentiment & Toxicity Analysis
        const sentiment = this.analyzer.analyze(message);
        result.sentiment = sentiment;

        // Update session stats
        this.updateSessionStats(sentiment);

        // AI Toxicity check
        if (this.autoModSettings.blockToxic && sentiment.isToxic) {
            result.violations.push('AI: High toxicity detected');
            this.addWarning(userId, username, `AI flagged toxic behavior (Sentiment: ${sentiment.label})`);
            return { 
                allowed: false, 
                reason: 'Your message was flagged as highly toxic by our AI moderation.',
                blocked: true,
                sentiment: sentiment 
            };
        }

        // Profanity filter
        if (this.autoModSettings.filterProfanity) {
            const profanityCheck = this.filterProfanity(message);
            if (profanityCheck.filtered) {
                result.message = profanityCheck.message;
                result.filtered = true;
                result.warnings.push('Profanity filtered');
            }
            if (profanityCheck.severe) {
                this.addWarning(userId, username, 'Severe profanity detected');
                result.warnings.push('Warning issued for severe language');
            }
        }

        // Link filtering
        if (this.autoModSettings.blockLinks) {
            const linkCheck = this.filterLinks(message);
            if (!linkCheck.allowed) {
                this.addWarning(userId, username, 'Unauthorized link posted');
                return linkCheck;
            }
            if (linkCheck.filtered) {
                result.message = linkCheck.message;
                result.filtered = true;
                result.warnings.push('Unauthorized links removed');
            }
        }

        // Caps filter
        if (this.autoModSettings.blockCaps) {
            const capsCheck = this.filterCaps(message);
            if (capsCheck.excessive) {
                result.warnings.push('Excessive caps detected');
                this.addWarning(userId, username, 'Excessive caps lock usage');
            }
        }

        // Repeated characters filter
        if (this.autoModSettings.blockRepeatedChars) {
            const repeatedCheck = this.filterRepeatedChars(message);
            if (repeatedCheck.filtered) {
                result.message = repeatedCheck.message;
                result.filtered = true;
                result.warnings.push('Repeated characters filtered');
            }
        }

        // Personal info filter (emails, phone numbers)
        const infoCheck = this.filterPersonalInfo(result.message);
        if (infoCheck.filtered) {
            result.message = infoCheck.message;
            result.filtered = true;
            result.warnings.push('Personal information removed');
        }

        // Add to message history for spam detection
        this.addToHistory(userId, message);

        return result;
    }

    // ============================================
    // PROFANITY FILTERING
    // ============================================

    filterProfanity(message) {
        let filtered = message;
        let hasProfanity = false;
        let severe = false;

        // Check for profanity
        for (const word of this.profanityList) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(filtered)) {
                hasProfanity = true;
                // Count occurrences for severity
                const matches = filtered.match(regex);
                if (matches && matches.length > 2) {
                    severe = true;
                }
                // Replace with asterisks
                filtered = filtered.replace(regex, match => '*'.repeat(match.length));
            }
        }

        // Check for leetspeak variants (basic)
        const leetspeakVariants = {
            '@': 'a', '3': 'e', '1': 'i', '0': 'o', '$': 's',
            '4': 'a', '5': 's', '7': 't', '8': 'b'
        };

        return {
            message: filtered,
            filtered: hasProfanity,
            severe: severe
        };
    }

    // ============================================
    // SPAM DETECTION
    // ============================================

    checkSpam(userId, message) {
        const now = Date.now();
        const history = this.messageHistory.get(userId) || [];

        // Check message rate
        const recentMessages = history.filter(m => now - m.timestamp < 60000);
        if (recentMessages.length >= this.spamThresholds.maxMessagesPerMinute) {
            return { 
                allowed: false, 
                reason: 'Too many messages. Please slow down.',
                blocked: true 
            };
        }

        // Check for duplicate messages
        const duplicates = recentMessages.filter(m => m.message === message);
        if (duplicates.length >= this.spamThresholds.maxDuplicatesPerMinute) {
            return { 
                allowed: false, 
                reason: 'Stop repeating the same message.',
                blocked: true 
            };
        }

        // Check minimum interval
        if (recentMessages.length > 0) {
            const lastMessage = recentMessages[recentMessages.length - 1];
            if (now - lastMessage.timestamp < this.spamThresholds.minMessageInterval) {
                return { 
                    allowed: false, 
                    reason: 'Please wait before sending another message.',
                    blocked: true 
                };
            }
        }

        // Check emoji spam
        const emojiMatches = message.match(this.patterns.emoji);
        if (emojiMatches && emojiMatches.length > this.spamThresholds.maxEmojisPerMessage) {
            return { 
                allowed: false, 
                reason: 'Too many emojis.',
                blocked: true 
            };
        }

        return { allowed: true };
    }

    addToHistory(userId, message) {
        const history = this.messageHistory.get(userId) || [];
        history.push({ message, timestamp: Date.now() });
        
        // Keep only last 50 messages
        if (history.length > 50) {
            history.shift();
        }
        
        this.messageHistory.set(userId, history);
    }

    // ============================================
    // LINK FILTERING
    // ============================================

    filterLinks(message) {
        const urls = message.match(this.patterns.url);
        
        if (!urls) {
            return { allowed: true, message };
        }

        if (urls.length > this.spamThresholds.maxUrlsPerMessage) {
            return { 
                allowed: false, 
                reason: 'Too many links in message.',
                blocked: true 
            };
        }

        let filtered = message;
        let hasUnauthorizedLinks = false;

        for (const url of urls) {
            const isAllowed = this.isUrlAllowed(url);
            if (!isAllowed) {
                hasUnauthorizedLinks = true;
                filtered = filtered.replace(url, '[link removed]');
            }
        }

        return {
            allowed: !hasUnauthorizedLinks || this.autoModSettings.blockLinks === false,
            message: filtered,
            filtered: hasUnauthorizedLinks
        };
    }

    isUrlAllowed(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');
            
            for (const allowedDomain of this.allowedDomains) {
                if (domain.includes(allowedDomain)) {
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    }

    // ============================================
    // CAPS FILTERING
    // ============================================

    filterCaps(message) {
        const letters = message.replace(/[^a-zA-Z]/g, '');
        if (letters.length < 10) {
            return { excessive: false };
        }

        const caps = message.replace(/[^A-Z]/g, '');
        const capsPercentage = caps.length / letters.length;

        return {
            excessive: capsPercentage > this.spamThresholds.maxCapsPercentage
        };
    }

    // ============================================
    // REPEATED CHARACTERS FILTERING
    // ============================================

    filterRepeatedChars(message) {
        const filtered = message.replace(this.patterns.repeatedChars, match => {
            return match.charAt(0).repeat(3); // Max 3 repeated chars
        });

        return {
            message: filtered,
            filtered: filtered !== message
        };
    }

    // ============================================
    // PERSONAL INFO FILTERING
    // ============================================

    filterPersonalInfo(message) {
        let filtered = message;
        let hasPersonalInfo = false;

        // Filter emails
        if (this.patterns.email.test(filtered)) {
            filtered = filtered.replace(this.patterns.email, '[email removed]');
            hasPersonalInfo = true;
        }

        // Filter phone numbers
        if (this.patterns.phone.test(filtered)) {
            filtered = filtered.replace(this.patterns.phone, '[phone removed]');
            hasPersonalInfo = true;
        }

        return {
            message: filtered,
            filtered: hasPersonalInfo
        };
    }

    // ============================================
    // USER MODERATION
    // ============================================

    muteUser(userId, username, durationMs, reason, moderatorId) {
        const until = Date.now() + durationMs;
        this.mutedUsers.set(userId, { until, reason, mutedBy: moderatorId, mutedAt: Date.now() });
        this.saveSettings();
        
        logger.info('Chat Moderation', `User ${username} muted for ${durationMs / 1000}s: ${reason}`);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('userMuted', {
            detail: { userId, username, until, reason }
        }));

        return true;
    }

    unmuteUser(userId, username) {
        this.mutedUsers.delete(userId);
        this.saveSettings();
        
        logger.info('Chat Moderation', `User ${username} unmuted`);
        
        window.dispatchEvent(new CustomEvent('userUnmuted', {
            detail: { userId, username }
        }));

        return true;
    }

    isMuted(userId) {
        if (!this.mutedUsers.has(userId)) {
            return false;
        }

        const muteInfo = this.mutedUsers.get(userId);
        if (Date.now() >= muteInfo.until) {
            this.mutedUsers.delete(userId);
            this.saveSettings();
            return false;
        }

        return true;
    }

    banUser(userId, username, reason, moderatorId) {
        this.bannedUsers.add(userId);
        this.saveSettings();
        
        logger.info('Chat Moderation', `User ${username} banned: ${reason}`);
        
        window.dispatchEvent(new CustomEvent('userBanned', {
            detail: { userId, username, reason }
        }));

        return true;
    }

    unbanUser(userId, username) {
        this.bannedUsers.delete(userId);
        this.saveSettings();
        
        logger.info('Chat Moderation', `User ${username} unbanned`);
        
        window.dispatchEvent(new CustomEvent('userUnbanned', {
            detail: { userId, username }
        }));

        return true;
    }

    isBanned(userId) {
        return this.bannedUsers.has(userId);
    }

    // ============================================
    // WARNING SYSTEM
    // ============================================

    addWarning(userId, username, reason) {
        const userWarnings = this.warnings.get(userId) || [];
        userWarnings.push({ reason, timestamp: Date.now() });
        this.warnings.set(userId, userWarnings);
        this.saveSettings();

        logger.warn('Chat Moderation', `Warning issued to ${username}: ${reason}`);

        // Auto-mute after threshold
        if (userWarnings.length >= this.autoModSettings.autoMuteOnWarnings) {
            this.muteUser(
                userId, 
                username, 
                this.autoModSettings.muteDuration, 
                `Auto-muted after ${userWarnings.length} warnings`,
                'system'
            );
        }

        window.dispatchEvent(new CustomEvent('userWarned', {
            detail: { userId, username, reason, warningCount: userWarnings.length }
        }));
    }

    getWarnings(userId) {
        return this.warnings.get(userId) || [];
    }

    clearWarnings(userId, username) {
        this.warnings.delete(userId);
        this.saveSettings();
        
        logger.info('Chat Moderation', `Warnings cleared for ${username}`);
    }

    // ============================================
    // ADMIN CONTROLS
    // ============================================

    addModerator(userId) {
        this.moderators.add(userId);
        logger.info('Chat Moderation', `User ${userId} added as moderator`);
    }

    removeModerator(userId) {
        this.moderators.delete(userId);
        logger.info('Chat Moderation', `User ${userId} removed as moderator`);
    }

    isModerator(userId) {
        return this.moderators.has(userId) || this.admins.has(userId);
    }

    addAdmin(userId) {
        this.admins.add(userId);
        logger.info('Chat Moderation', `User ${userId} added as admin`);
    }

    isAdmin(userId) {
        return this.admins.has(userId);
    }

    // ============================================
    // MESSAGE DELETION
    // ============================================

    deleteMessage(messageId, deletedBy) {
        logger.info('Chat Moderation', `Message ${messageId} deleted by ${deletedBy}`);
        
        window.dispatchEvent(new CustomEvent('messageDeleted', {
            detail: { messageId, deletedBy }
        }));

        return true;
    }

    // ============================================
    // SETTINGS MANAGEMENT
    // ============================================

    updateSettings(newSettings) {
        Object.assign(this.autoModSettings, newSettings);
        this.saveSettings();
        
        logger.info('Chat Moderation', 'Settings updated');
        
        window.dispatchEvent(new CustomEvent('moderationSettingsUpdated', {
            detail: this.autoModSettings
        }));
    }

    getSettings() {
        return { ...this.autoModSettings };
    }

    // ============================================
    // PROFANITY LIST MANAGEMENT
    // ============================================

    addProfanity(word) {
        this.profanityList.add(word.toLowerCase());
        logger.debug('Chat Moderation', `Added word to filter: ${word}`);
    }

    removeProfanity(word) {
        this.profanityList.delete(word.toLowerCase());
        logger.debug('Chat Moderation', `Removed word from filter: ${word}`);
    }

    // ============================================
    // WHITELIST MANAGEMENT
    // ============================================

    addAllowedDomain(domain) {
        this.allowedDomains.add(domain.toLowerCase());
        logger.debug('Chat Moderation', `Added allowed domain: ${domain}`);
    }

    removeAllowedDomain(domain) {
        this.allowedDomains.delete(domain.toLowerCase());
        logger.debug('Chat Moderation', `Removed allowed domain: ${domain}`);
    }

    // ============================================
    // CLEANUP
    // ============================================

    startCleanupInterval() {
        setInterval(() => {
            this.cleanupExpiredMutes();
            this.cleanupOldHistory();
        }, 60000); // Every minute
    }

    cleanupExpiredMutes() {
        const now = Date.now();
        for (const [userId, muteInfo] of this.mutedUsers.entries()) {
            if (now >= muteInfo.until) {
                this.mutedUsers.delete(userId);
            }
        }
    }

    cleanupOldHistory() {
        const cutoff = Date.now() - 3600000; // 1 hour
        
        for (const [userId, history] of this.messageHistory.entries()) {
            const filtered = history.filter(m => m.timestamp > cutoff);
            if (filtered.length === 0) {
                this.messageHistory.delete(userId);
            } else {
                this.messageHistory.set(userId, filtered);
            }
        }
    }

    // ============================================
    // STATISTICS
    // ============================================

    updateSessionStats(sentiment) {
        this.sessionStats.messagesProcessed++;
        
        // Rolling average for sentiment
        const n = this.sessionStats.messagesProcessed;
        this.sessionStats.averageSentiment = ((this.sessionStats.averageSentiment * (n - 1)) + sentiment.score) / n;
        
        if (sentiment.isToxic) this.sessionStats.toxicityEvents++;
        if (sentiment.isHyped) this.sessionStats.hypeEvents++;

        // Periodically dispatch mood update
        if (n % 5 === 0) {
            window.dispatchEvent(new CustomEvent('communityMoodUpdated', {
                detail: {
                    averageSentiment: this.sessionStats.averageSentiment,
                    mood: this.getMoodLabel(this.sessionStats.averageSentiment),
                    hypeLevel: this.sessionStats.hypeEvents
                }
            }));
        }
    }

    getMoodLabel(score) {
        if (score > 0.4) return '🔥 ON FIRE';
        if (score > 0.1) return '😊 POSITIVE';
        if (score > -0.1) return '😐 NEUTRAL';
        if (score > -0.4) return '😠 AGITATED';
        return '☢️ TOXIC';
    }

    getStats() {
        return {
            mutedUsers: this.mutedUsers.size,
            bannedUsers: this.bannedUsers.size,
            totalWarnings: [...this.warnings.values()].reduce((sum, w) => sum + w.length, 0),
            usersWithWarnings: this.warnings.size,
            moderators: this.moderators.size,
            admins: this.admins.size
        };
    }
}

// Create global instance
window.chatModeration = new ChatModerationSystem();

// Export for module usage
export { ChatModerationSystem };
