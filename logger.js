// ============================================
// PRODUCTION LOGGER UTILITY
// ============================================
// Centralized logging with environment-aware verbosity

const isDevelopment = typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    : (process.env.NODE_ENV === 'development');

const logger = {
    // Production-safe logging with context
    info: (context, message) => {
        if (isDevelopment) {
            console.log(`ℹ️ [${context}] ${message}`);
        }
    },
    
    warn: (context, message) => {
        console.warn(`⚠️ [${context}] ${message}`);
    },
    
    error: (context, message) => {
        console.error(`❌ [${context}] ${message}`);
    },
    
    success: (context, message) => {
        if (isDevelopment) {
            console.log(`✅ [${context}] ${message}`);
        }
    },
    
    debug: (context, message) => {
        if (isDevelopment) {
            console.debug(`🔍 [${context}] ${message}`);
        }
    }
};

// Export for both browser and Node.js
if (typeof window !== 'undefined') {
    window.logger = logger;
}

export { logger };
