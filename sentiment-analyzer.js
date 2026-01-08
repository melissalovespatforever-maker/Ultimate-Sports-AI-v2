// ============================================
// AI SENTIMENT ANALYZER
// Real-time NLP-based sentiment & toxicity analysis
// ============================================

import { logger } from './logger.js';

class SentimentAnalyzer {
    constructor() {
        // Sentiment Lexicon (Sports Focused)
        this.lexicon = {
            // Positive / Hype words
            'win': 2, 'winning': 3, 'goat': 4, 'amazing': 3, 'incredible': 3, 
            'hype': 2, 'fire': 2, 'huge': 2, 'clutch': 3, 'legend': 3,
            'green': 2, 'cash': 3, 'money': 2, 'boom': 3, 'easy': 1,
            'love': 2, 'great': 2, 'awesome': 3, 'best': 2, 'solid': 1,
            'profit': 2, 'gains': 2, 'lock': 2, 'secure': 1, 'nice': 1,
            
            // Negative / Frustrated words
            'lose': -2, 'losing': -3, 'trash': -4, 'garbage': -4, 'awful': -3,
            'rigged': -4, 'scam': -5, 'terrible': -3, 'worst': -3, 'horrible': -3,
            'rip': -2, 'cooked': -2, 'washed': -3, 'choke': -3, 'fail': -2,
            'bust': -3, 'bad': -1, 'broken': -2, 'pain': -2, 'sad': -1,
            
            // Toxic / Aggressive words (Moderation focus)
            'idiot': -4, 'stupid': -3, 'dumb': -3, 'hate': -3, 'kill': -5,
            'die': -5, 'pathetic': -4, 'useless': -4, 'shut': -3, 'retard': -5,
            'fck': -5, 'shit': -4, 'bitch': -5, 'stfu': -5, 'toxic': -4
        };

        // Intensifiers
        this.intensifiers = {
            'very': 1.5, 'really': 1.5, 'extremely': 2, 'insanely': 2,
            'totally': 1.5, 'completely': 1.5, 'so': 1.2, 'fucking': 2
        };

        // Negators
        this.negators = ['not', 'never', 'no', "don't", "can't", "won't", 'hardly', 'barely'];

        logger.info('Sentiment Analysis', 'AI Engine Initialized');
    }

    /**
     * Analyze text and return detailed sentiment/toxicity report
     * @param {string} text 
     * @returns {object}
     */
    analyze(text) {
        if (!text) return this.getDefaultResult();

        const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
        let score = 0;
        let toxicHits = 0;
        let positiveHits = 0;
        let negativeHits = 0;
        let multiplier = 1;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];

            // Handle intensifiers for next word
            if (this.intensifiers[word]) {
                multiplier = this.intensifiers[word];
                continue;
            }

            // Handle negators
            if (this.negators.includes(word)) {
                multiplier = -1;
                continue;
            }

            // Calculate word score
            if (this.lexicon[word]) {
                const wordScore = this.lexicon[word] * multiplier;
                score += wordScore;

                if (wordScore > 0) positiveHits++;
                else if (wordScore < -3) toxicHits++;
                else negativeHits++;

                // Reset multiplier after applying to a word
                multiplier = 1;
            }
        }

        // Normalize score between -1 and 1
        const normalizedScore = Math.max(-1, Math.min(1, score / (words.length || 1)));
        
        // Determine label
        let label = 'neutral';
        if (normalizedScore > 0.1) label = 'positive';
        if (normalizedScore > 0.5) label = 'hyped';
        if (normalizedScore < -0.1) label = 'negative';
        if (normalizedScore < -0.4) label = 'toxic';

        return {
            score: normalizedScore,
            label: label,
            toxicity: toxicHits / (words.length || 1),
            isToxic: toxicHits > 0 || normalizedScore < -0.5,
            isHyped: positiveHits > 2 && normalizedScore > 0.4,
            stats: {
                positive: positiveHits,
                negative: negativeHits,
                toxic: toxicHits
            },
            timestamp: Date.now()
        };
    }

    getDefaultResult() {
        return {
            score: 0,
            label: 'neutral',
            toxicity: 0,
            isToxic: false,
            isHyped: false,
            stats: { positive: 0, negative: 0, toxic: 0 },
            timestamp: Date.now()
        };
    }
}

// Global instance
window.sentimentAnalyzer = new SentimentAnalyzer();

export { SentimentAnalyzer };
