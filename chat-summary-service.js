/**
 * CHAT SUMMARY SERVICE
 * Uses NLP techniques to generate concise summaries of missed chat activity
 */

import { logger } from './logger.js';

class ChatSummaryService {
    constructor() {
        this.maxBuffer = 50; // Analyze last 50 messages
        this.minMessagesForSummary = 5;
        this.isTabActive = true;
        this.missedMessagesCount = 0;
        this.lastViewedTimestamp = Date.now();
        
        // Session-wide word frequency for word cloud
        this.globalWordFreq = {};
        this.stopWords = new Set(['the', 'and', 'was', 'for', 'with', 'this', 'that', 'they', 'from', 'have', 'been', 'were', 'will', 'your', 'just', 'what', 'some', 'there', 'about', 'would', 'their', 'like', 'this', 'that']);
        
        // Sports keywords for topic extraction
        this.topics = {
            'nfl': ['nfl', 'football', 'touchdown', 'qb', 'quarterback', 'superbowl', 'chiefs', 'eagles', 'cowboys'],
            'nba': ['nba', 'basketball', 'dunk', '3-pointer', 'lebron', 'curry', 'lakers', 'warriors', 'celtics'],
            'betting': ['bet', 'odds', 'parlay', 'win', 'lose', 'money', 'cash', 'locked', 'rigged', 'spread'],
            'lounge': ['admin', 'gift', 'mod', 'shoutout', 'trivia', 'game', 'battle']
        };

        // Hype Meter state
        this.hypeLevel = 0;
        this.hypeKeywords = new Set(['fire', 'hype', 'win', 'goat', 'clutch', 'money', 'cash', 'boom', 'locked', 'easy', 'huge', 'legend', 'omg', 'wow', 'lfg']);

        this.init();
    }

    init() {
        document.addEventListener('visibilitychange', () => {
            this.isTabActive = !document.hidden;
            if (this.isTabActive) {
                this.lastViewedTimestamp = Date.now();
            }
        });

        // Decay hype over time
        setInterval(() => {
            if (this.hypeLevel > 0) {
                this.hypeLevel = Math.max(0, this.hypeLevel - 0.5);
                this.updateHypeUI();
            }
        }, 1000);
        
        logger.info('ChatSummary', 'Service Initialized');
    }

    /**
     * Record a message for global trending stats and hype
     */
    recordMessage(text) {
        if (!text) return;
        const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
        
        let foundHype = false;
        words.forEach(word => {
            if (word.length < 4 || this.stopWords.has(word)) return;
            this.globalWordFreq[word] = (this.globalWordFreq[word] || 0) + 1;

            if (this.hypeKeywords.has(word)) {
                this.hypeLevel = Math.min(100, this.hypeLevel + 5);
                foundHype = true;
            }
        });
        
        if (foundHype) {
            this.updateHypeUI();
            if (this.hypeLevel >= 100) {
                this.triggerHypeEvent();
            }
        }
        
        this.updateWordCloudUI();
    }

    updateHypeUI() {
        const fill = document.getElementById('hype-fill');
        const text = document.getElementById('hype-percent');
        if (fill) fill.style.width = `${this.hypeLevel}%`;
        if (text) text.textContent = `${Math.floor(this.hypeLevel)}%`;

        const meter = document.getElementById('hype-meter');
        if (meter) {
            if (this.hypeLevel > 80) meter.classList.add('extreme');
            else if (this.hypeLevel > 50) meter.classList.add('high');
            else {
                meter.classList.remove('extreme');
                meter.classList.remove('high');
            }
        }
    }

    triggerHypeEvent() {
        logger.info('Hype', 'MAX HYPE REACHED! Triggering celebration.');
        this.hypeLevel = 0; // Reset
        this.updateHypeUI();

        // Access parent's confetti if available (via index.html's message listener)
        window.parent.postMessage({
            action: 'jackpot_celebration',
            game: 'The Lounge',
            payout: 'UNLIMITED HYPE'
        }, '*');

        // Optional: Local notification
        const loungeChat = window.sportsLoungeChat;
        if (loungeChat) {
            loungeChat.showSystemMessage('🔥 THE LOUNGE IS ON FIRE! HYPE OVERLOAD! 🔥');
        }
    }

    updateWordCloudUI() {
        const container = document.getElementById('word-cloud-container');
        if (!container) return;

        // Get top 15 words
        const topWords = Object.entries(this.globalWordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);

        if (topWords.length === 0) {
            container.innerHTML = '<div class="cloud-empty">Waiting for trending topics...</div>';
            return;
        }

        const maxFreq = topWords[0][1];
        
        container.innerHTML = topWords.map(([word, freq]) => {
            // Scale font size between 12px and 24px
            const size = 12 + (freq / maxFreq) * 12;
            const opacity = 0.5 + (freq / maxFreq) * 0.5;
            return `<span class="cloud-word" style="font-size: ${size}px; opacity: ${opacity};">${word}</span>`;
        }).join(' ');
    }

    /**
     * Generate a summary from a collection of messages
     * @param {Array} messages 
     * @returns {object|null}
     */
    summarize(messages) {
        if (!messages || messages.length < this.minMessagesForSummary) return null;

        // Filter messages since last viewed if needed, or just take the last N
        const relevantMessages = messages.slice(-this.maxBuffer);
        
        const stats = {
            totalMessages: relevantMessages.length,
            users: new Set(),
            sentimentSum: 0,
            topicCounts: {},
            topWords: {},
            hypeLevel: 0
        };

        relevantMessages.forEach(msg => {
            if (msg.isSystem) return;
            
            stats.users.add(msg.username);
            
            // Extract sentiment if available (from global sentimentAnalyzer)
            if (window.sentimentAnalyzer) {
                const analysis = window.sentimentAnalyzer.analyze(msg.message);
                stats.sentimentSum += analysis.score;
                if (analysis.isHyped) stats.hypeLevel++;
            }

            // Simple topic/keyword extraction
            const words = msg.message.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length < 4) return; // Skip short words
                
                // Track word frequency
                stats.topWords[word] = (stats.topWords[word] || 0) + 1;

                // Track predefined topics
                for (const [topic, keywords] of Object.entries(this.topics)) {
                    if (keywords.includes(word)) {
                        stats.topicCounts[topic] = (stats.topicCounts[topic] || 0) + 1;
                    }
                }
            });
        });

        const avgSentiment = stats.sentimentSum / stats.totalMessages;
        const mainTopic = Object.entries(stats.topicCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'general talk';
            
        return {
            topic: mainTopic,
            userCount: stats.users.size,
            messageCount: stats.totalMessages,
            sentiment: this.getSentimentLabel(avgSentiment),
            hypeFactor: stats.hypeLevel > 3 ? 'High 🔥' : 'Chill ❄️',
            summaryText: this.constructSummary(stats, avgSentiment, mainTopic)
        };
    }

    getSentimentLabel(score) {
        if (score > 0.3) return 'Very Positive';
        if (score > 0.1) return 'Positive';
        if (score < -0.3) return 'Heated';
        if (score < -0.1) return 'Negative';
        return 'Neutral';
    }

    constructSummary(stats, avgSentiment, mainTopic) {
        const topUser = Array.from(stats.users)[0] || 'the community';
        let vibe = 'The chat is currently quite relaxed.';
        
        if (avgSentiment > 0.2) vibe = 'The lounge is buzzing with excitement!';
        if (avgSentiment < -0.2) vibe = 'Things are getting a bit intense in the chat.';
        
        const topicFocus = mainTopic !== 'general talk' 
            ? `Everyone seems to be discussing **${mainTopic.toUpperCase()}** right now.` 
            : 'Conversations are covering various sports topics.';

        const userActivity = `${stats.users.size} active legends are hanging out.`;
        
        return `${vibe} ${topicFocus} ${userActivity}`;
    }

    /**
     * Visual UI Component for Catch Up
     */
    renderSummaryUI(summary, container) {
        if (!summary || !container) return;

        const summaryEl = document.createElement('div');
        summaryEl.className = 'chat-summary-card';
        summaryEl.innerHTML = `
            <div class="summary-header">
                <span class="summary-badge">AI CATCH-UP</span>
                <button class="summary-close" onclick="this.closest('.chat-summary-card').remove()">×</button>
            </div>
            <div class="summary-body">
                <p>${summary.summaryText}</p>
                <div class="summary-meta">
                    <span title="Main Topic">🏷️ ${summary.topic}</span>
                    <span title="Community Mood">🎭 ${summary.sentiment}</span>
                    <span title="Hype Factor">🔥 ${summary.hypeFactor}</span>
                </div>
            </div>
            <div class="summary-footer">
                <small>Summarized ${summary.messageCount} messages</small>
            </div>
        `;

        // Insert at the top of messages but below categories
        container.prepend(summaryEl);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            summaryEl.style.opacity = '0';
            setTimeout(() => summaryEl.remove(), 500);
        }, 15000);
    }
}

export const chatSummaryService = new ChatSummaryService();
window.chatSummaryService = chatSummaryService;
