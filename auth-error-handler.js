// ============================================
// AUTH ERROR HANDLER
// Proper error handling for authentication
// ============================================

console.log('🔐 Loading Auth Error Handler');

// Global error handler for auth issues
window.authErrorHandler = {
    handleApiError(error, context = '') {
        console.error(`❌ Auth API Error [${context}]:`, error);
        
        // Parse error message
        let message = 'An error occurred. Please try again.';
        let errorType = 'error';

        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 400) {
                message = data.message || 'Invalid request. Please check your input.';
            } else if (status === 401) {
                message = 'Invalid email or password.';
            } else if (status === 403) {
                message = 'Access denied. Your account may be locked.';
            } else if (status === 404) {
                message = 'Email not found. Please sign up.';
            } else if (status === 409) {
                message = 'Email already registered.';
            } else if (status === 500) {
                message = 'Server error. Please try again in a moment.';
            } else {
                message = data.message || `Error ${status}: ${error.message}`;
            }
        } else if (error.message) {
            if (error.message.includes('Network')) {
                message = 'Network error. Check your connection.';
            } else if (error.message.includes('timeout')) {
                message = 'Request timeout. Server may be slow.';
            } else {
                message = error.message;
            }
        }

        return { message, errorType };
    },

    handleLoginError(error) {
        const { message } = this.handleApiError(error, 'LOGIN');
        
        // Show user-friendly error
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert(message);
        }

        // Log detailed error for debugging
        console.log('📋 Full error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        return false;
    },

    handleSignupError(error) {
        const { message } = this.handleApiError(error, 'SIGNUP');
        
        // Show user-friendly error
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert(message);
        }

        // Log detailed error for debugging
        console.log('📋 Full error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        return false;
    },

    // Check if user should retry
    shouldRetry(error) {
        if (!error.response) return true; // Network error, retry

        const status = error.response.status;
        
        // Don't retry client errors (400, 401, 403, 404, 409)
        if (status >= 400 && status < 500) return false;

        // Retry server errors (500, 502, 503, 504)
        if (status >= 500) return true;

        return false;
    },

    // Retry with exponential backoff
    async retryOperation(operation, maxRetries = 3, delayMs = 1000) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (!this.shouldRetry(error) || attempt === maxRetries - 1) {
                    throw error;
                }

                // Exponential backoff: 1s, 2s, 4s
                const delay = delayMs * Math.pow(2, attempt);
                console.warn(`⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
};

// Enhance fetch to catch 500 errors
const originalFetch = window.fetch;
window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch(error => {
        // Only log unexpected errors (not network/CORS which are expected in dev)
        const isExpectedError = error.message.includes('Failed to fetch') || 
                               error.message.includes('NetworkError') ||
                               error.message.includes('CORS') ||
                               error.name === 'AbortError';
        
        if (!isExpectedError) {
            console.error('🚨 Fetch Error:', error);
        }
        throw error;
    }).then(response => {
        // Log 500 errors
        if (response.status === 500) {
            const url = args[0];
            console.error(`🚨 500 Error from ${url}:`, {
                status: response.status,
                statusText: response.statusText,
                url: url
            });
        }
        return response;
    });
};

console.log('✅ Auth Error Handler loaded');
