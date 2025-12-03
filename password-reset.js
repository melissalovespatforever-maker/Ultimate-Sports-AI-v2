// ============================================
// PASSWORD RESET MODULE
// Complete flow with email verification
// ============================================

console.log('🔐 Loading Password Reset Module');

class PasswordResetManager {
    constructor() {
        this.currentStep = 'request'; // request, verify, reset
        this.resetToken = null;
        this.resetEmail = null;
        this.init();
    }

    init() {
        this.setupRequestForm();
        this.setupVerifyForm();
        this.setupResetForm();
        this.checkResetToken();
    }

    // ============================================
    // STEP 1: REQUEST PASSWORD RESET
    // ============================================

    setupRequestForm() {
        const form = document.getElementById('reset-request-form');
        if (!form) return;

        form.addEventListener('submit', (e) => this.handleRequestSubmit(e));
    }

    async handleRequestSubmit(e) {
        e.preventDefault();
        console.log('📧 Password reset request submitted');

        const email = document.getElementById('reset-email').value.trim();

        // Validate email
        if (!FormValidator.validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        try {
            this.setFormSubmitting(true, 'reset-request-form');
            showToast('Sending reset email...', 'info');

            const response = await api.request('/api/auth/password-reset/request', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            console.log('✅ Reset email sent successfully');
            this.resetEmail = email;
            
            // Show verification step
            this.showVerifyStep();
            showToast('Check your email for verification code', 'success');
        } catch (error) {
            console.error('❌ Reset request failed:', error);
            showToast(error.message || 'Failed to send reset email', 'error');
        } finally {
            this.setFormSubmitting(false, 'reset-request-form');
        }
    }

    // ============================================
    // STEP 2: VERIFY EMAIL CODE
    // ============================================

    setupVerifyForm() {
        const form = document.getElementById('reset-verify-form');
        if (!form) return;

        form.addEventListener('submit', (e) => this.handleVerifySubmit(e));

        // Handle paste events for code fields
        this.setupCodeInput();
    }

    setupCodeInput() {
        const codeInputs = document.querySelectorAll('.code-input');
        
        codeInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                // Only allow one digit
                if (e.target.value.length > 1) {
                    e.target.value = e.target.value[0];
                }
                
                // Auto-focus next input
                if (e.target.value && index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                // Handle backspace to focus previous input
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    codeInputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = (e.clipboardData || window.clipboardData).getData('text');
                const digits = pastedData.replace(/\D/g, '').split('');
                
                digits.forEach((digit, i) => {
                    if (index + i < codeInputs.length) {
                        codeInputs[index + i].value = digit;
                    }
                });
                
                // Focus last filled input
                const lastIndex = Math.min(index + digits.length - 1, codeInputs.length - 1);
                codeInputs[lastIndex].focus();
            });
        });
    }

    async handleVerifySubmit(e) {
        e.preventDefault();
        console.log('✓ Verifying reset code');

        // Get code from inputs
        const codeInputs = document.querySelectorAll('.code-input');
        const code = Array.from(codeInputs).map(input => input.value).join('');

        // Validate code
        if (code.length !== 6) {
            showToast('Please enter a 6-digit verification code', 'error');
            return;
        }

        try {
            this.setFormSubmitting(true, 'reset-verify-form');
            showToast('Verifying code...', 'info');

            const response = await api.request('/api/auth/password-reset/verify', {
                method: 'POST',
                body: JSON.stringify({
                    email: this.resetEmail,
                    code: code
                })
            });

            console.log('✅ Code verified successfully');
            this.resetToken = response.reset_token;
            
            // Show reset password step
            this.showResetStep();
            showToast('Code verified! Enter your new password', 'success');
        } catch (error) {
            console.error('❌ Verification failed:', error);
            showToast(error.message || 'Invalid or expired code', 'error');
        } finally {
            this.setFormSubmitting(false, 'reset-verify-form');
        }
    }

    // ============================================
    // STEP 3: RESET PASSWORD
    // ============================================

    setupResetForm() {
        const form = document.getElementById('reset-password-form');
        if (!form) return;

        form.addEventListener('submit', (e) => this.handleResetSubmit(e));

        // Real-time password strength feedback
        const passwordInput = document.getElementById('reset-new-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.updatePasswordStrength(passwordInput.value);
            });
        }
    }

    updatePasswordStrength(password) {
        const strengthBar = document.getElementById('reset-password-strength-bar');
        if (!strengthBar) return;

        const strength = FormValidator.getPasswordStrength(password);
        const percent = (strength + 1) / 6 * 100;
        const color = FormValidator.getPasswordStrengthColor(strength);
        const text = FormValidator.getPasswordStrengthText(strength);

        const fill = document.getElementById('reset-password-strength-fill');
        if (fill) {
            fill.style.width = percent + '%';
            fill.style.background = color;
            fill.title = 'Strength: ' + text;
        }
    }

    async handleResetSubmit(e) {
        e.preventDefault();
        console.log('🔑 Resetting password');

        const newPassword = document.getElementById('reset-new-password').value;
        const confirmPassword = document.getElementById('reset-confirm-password').value;

        // Validate passwords
        if (!FormValidator.validatePassword(newPassword)) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        try {
            this.setFormSubmitting(true, 'reset-password-form');
            showToast('Updating password...', 'info');

            await api.request('/api/auth/password-reset/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    reset_token: this.resetToken,
                    new_password: newPassword
                })
            });

            console.log('✅ Password reset successfully');
            showToast('Password reset successfully! You can now sign in', 'success');
            
            // Reset state and go back to login
            this.resetState();
            setTimeout(() => {
                this.showRequestStep();
                document.getElementById('password-reset-page').style.display = 'none';
                navigation.navigateTo('auth');
            }, 2000);
        } catch (error) {
            console.error('❌ Password reset failed:', error);
            showToast(error.message || 'Failed to reset password', 'error');
        } finally {
            this.setFormSubmitting(false, 'reset-password-form');
        }
    }

    // ============================================
    // UI STATE MANAGEMENT
    // ============================================

    showRequestStep() {
        console.log('📧 Showing request step');
        document.getElementById('reset-request-step').style.display = 'block';
        document.getElementById('reset-verify-step').style.display = 'none';
        document.getElementById('reset-password-step').style.display = 'none';
        this.currentStep = 'request';
    }

    showVerifyStep() {
        console.log('✓ Showing verify step');
        document.getElementById('reset-request-step').style.display = 'none';
        document.getElementById('reset-verify-step').style.display = 'block';
        document.getElementById('reset-password-step').style.display = 'none';
        this.currentStep = 'verify';
        
        // Focus first code input
        setTimeout(() => {
            document.querySelector('.code-input')?.focus();
        }, 100);
    }

    showResetStep() {
        console.log('🔑 Showing reset step');
        document.getElementById('reset-request-step').style.display = 'none';
        document.getElementById('reset-verify-step').style.display = 'none';
        document.getElementById('reset-password-step').style.display = 'block';
        this.currentStep = 'reset';
        
        // Focus password input
        setTimeout(() => {
            document.getElementById('reset-new-password')?.focus();
        }, 100);
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    setFormSubmitting(isSubmitting, formId) {
        const form = document.getElementById(formId);
        const button = form?.querySelector('button[type="submit"]');

        if (!button) return;

        if (isSubmitting) {
            button.disabled = true;
            const originalText = button.textContent;
            button.dataset.originalText = originalText;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            button.style.opacity = '0.6';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Continue';
            button.style.opacity = '1';
        }
    }

    resetState() {
        this.currentStep = 'request';
        this.resetToken = null;
        this.resetEmail = null;
        
        // Clear all form inputs
        document.getElementById('reset-email').value = '';
        document.querySelectorAll('.code-input').forEach(input => input.value = '');
        document.getElementById('reset-new-password').value = '';
        document.getElementById('reset-confirm-password').value = '';
    }

    // ============================================
    // CHECK FOR RESET TOKEN IN URL
    // ============================================

    checkResetToken() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('reset_token');
        const email = params.get('email');

        if (token && email) {
            console.log('🔑 Reset token found in URL');
            this.resetToken = token;
            this.resetEmail = email;
            
            // Navigate to reset page and show password step
            navigation.navigateTo('password-reset');
            setTimeout(() => {
                this.showResetStep();
                showToast('Enter your new password to complete reset', 'info');
            }, 100);
        }
    }

    // ============================================
    // PUBLIC API
    // ============================================

    openResetFlow() {
        console.log('🔓 Opening password reset flow');
        this.resetState();
        this.showRequestStep();
        navigation.navigateTo('password-reset');
    }

    goBackToLogin() {
        console.log('← Going back to login');
        this.resetState();
        navigation.navigateTo('auth');
    }
}

// Initialize when DOM is ready
let passwordResetManager;

function initPasswordReset() {
    if (!passwordResetManager) {
        passwordResetManager = new PasswordResetManager();
        console.log('✅ Password Reset Manager initialized');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordReset);
} else {
    initPasswordReset();
}

// Export for opening reset flow from login page
window.openPasswordReset = () => {
    if (passwordResetManager) {
        passwordResetManager.openResetFlow();
    }
};

window.goBackToLoginFromReset = () => {
    if (passwordResetManager) {
        passwordResetManager.goBackToLogin();
    }
};

console.log('✅ Password Reset Module loaded');
