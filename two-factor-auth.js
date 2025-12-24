// ============================================
// TWO-FACTOR AUTHENTICATION MODULE
// Frontend implementation for 2FA
// ============================================

class TwoFactorManager {
    constructor() {
        this.setupModal = null;
        this.verifyModal = null;
        this.backupCodesModal = null;
        this.init();
    }

    init() {
        this.createModals();
        this.attachEventListeners();
    }

    createModals() {
        // 2FA Setup Modal
        this.setupModal = this.createModal('2fa-setup-modal', `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-shield-alt"></i> Set Up Two-Factor Authentication</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" id="2fa-setup-body">
                    <div id="2fa-step-1" class="2fa-step">
                        <p style="margin-bottom: 24px;">Enhance your account security with 2FA. You'll need an authenticator app like:</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                            <div style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; text-align: center;">
                                <i class="fab fa-google" style="font-size: 32px; color: #4285F4; margin-bottom: 8px;"></i>
                                <p style="font-size: 14px; margin: 0;">Google Authenticator</p>
                            </div>
                            <div style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; text-align: center;">
                                <i class="fas fa-mobile-alt" style="font-size: 32px; color: #EC1C24; margin-bottom: 8px;"></i>
                                <p style="font-size: 14px; margin: 0;">Authy</p>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block" id="2fa-start-setup">
                            <i class="fas fa-arrow-right"></i> Start Setup
                        </button>
                    </div>

                    <div id="2fa-step-2" class="2fa-step" style="display: none;">
                        <div id="2fa-qr-container" style="text-align: center; margin-bottom: 24px;">
                            <p style="margin-bottom: 16px; font-weight: 600;">Scan this QR code with your authenticator app:</p>
                            <img id="2fa-qr-code" style="max-width: 100%; height: auto; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: white;">
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">Or enter this code manually:</p>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="text" id="2fa-manual-key" readonly style="flex: 1; font-family: monospace; background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px;">
                                <button class="btn btn-secondary" id="2fa-copy-key">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Enter the 6-digit code from your app:</label>
                            <input type="text" id="2fa-verify-code" class="code-input-large" maxlength="6" pattern="[0-9]{6}" placeholder="000000" inputmode="numeric">
                        </div>

                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-secondary" id="2fa-back-step">
                                <i class="fas fa-arrow-left"></i> Back
                            </button>
                            <button class="btn btn-primary" style="flex: 1;" id="2fa-verify-setup">
                                <i class="fas fa-check"></i> Verify & Enable
                            </button>
                        </div>
                    </div>

                    <div id="2fa-step-3" class="2fa-step" style="display: none;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <div style="font-size: 64px; color: var(--success); margin-bottom: 16px;">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h3 style="margin: 0 0 8px;">2FA Enabled Successfully!</h3>
                            <p style="color: var(--text-secondary); margin: 0;">Your account is now more secure.</p>
                        </div>

                        <div style="background: var(--warning); color: #000; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                            <h4 style="margin: 0 0 12px;"><i class="fas fa-exclamation-triangle"></i> Save Your Backup Codes</h4>
                            <p style="font-size: 14px; margin: 0 0 12px;">Store these codes securely. Each can only be used once:</p>
                            <div id="2fa-backup-codes-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-family: monospace; font-size: 14px; font-weight: 600;">
                            </div>
                        </div>

                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-secondary" id="2fa-download-codes">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button class="btn btn-primary" style="flex: 1;" id="2fa-finish">
                                <i class="fas fa-check"></i> Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // 2FA Verification Modal (during login)
        this.verifyModal = this.createModal('2fa-verify-modal', `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2><i class="fas fa-shield-alt"></i> Two-Factor Authentication</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 24px;">Enter the 6-digit code from your authenticator app:</p>
                    
                    <div class="form-group">
                        <input type="text" id="2fa-login-code" class="code-input-large" maxlength="6" pattern="[0-9]{6}" placeholder="000000" inputmode="numeric" autofocus>
                    </div>

                    <button class="btn btn-primary btn-block" id="2fa-verify-login">
                        <i class="fas fa-sign-in-alt"></i> Verify & Login
                    </button>

                    <div style="text-align: center; margin-top: 16px;">
                        <button class="btn-link" id="2fa-use-backup">
                            Use backup code instead
                        </button>
                    </div>

                    <div id="2fa-backup-input" style="display: none; margin-top: 16px;">
                        <div class="form-group">
                            <label>Backup Code:</label>
                            <input type="text" id="2fa-backup-code" maxlength="8" placeholder="XXXXXXXX" style="text-transform: uppercase;">
                        </div>
                        <button class="btn btn-primary btn-block" id="2fa-verify-backup">
                            Verify Backup Code
                        </button>
                    </div>
                </div>
            </div>
        `);

        // Disable 2FA Modal
        const disableModal = this.createModal('2fa-disable-modal', `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2><i class="fas fa-shield-alt"></i> Disable 2FA</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="background: var(--warning); color: #000; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                        <p style="margin: 0; font-weight: 600;"><i class="fas fa-exclamation-triangle"></i> This will reduce your account security</p>
                    </div>

                    <div class="form-group">
                        <label>Password:</label>
                        <input type="password" id="2fa-disable-password" placeholder="Your password">
                    </div>

                    <div class="form-group">
                        <label>2FA Code:</label>
                        <input type="text" id="2fa-disable-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000" inputmode="numeric">
                    </div>

                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-secondary" style="flex: 1;" onclick="document.getElementById('2fa-disable-modal').style.display='none'">
                            Cancel
                        </button>
                        <button class="btn btn-danger" style="flex: 1;" id="2fa-confirm-disable">
                            Disable 2FA
                        </button>
                    </div>
                </div>
            </div>
        `);
    }

    createModal(id, content) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = content;
        document.body.appendChild(modal);

        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeModal(id);
        }

        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeModal(id);
            }
        };

        return modal;
    }

    attachEventListeners() {
        // Setup flow
        document.getElementById('2fa-start-setup')?.addEventListener('click', () => this.startSetup());
        document.getElementById('2fa-back-step')?.addEventListener('click', () => this.showStep(1));
        document.getElementById('2fa-verify-setup')?.addEventListener('click', () => this.verifySetup());
        document.getElementById('2fa-copy-key')?.addEventListener('click', () => this.copyManualKey());
        document.getElementById('2fa-download-codes')?.addEventListener('click', () => this.downloadBackupCodes());
        document.getElementById('2fa-finish')?.addEventListener('click', () => this.closeModal('2fa-setup-modal'));

        // Login verification
        document.getElementById('2fa-verify-login')?.addEventListener('click', () => this.verifyLogin());
        document.getElementById('2fa-use-backup')?.addEventListener('click', () => this.showBackupInput());
        document.getElementById('2fa-verify-backup')?.addEventListener('click', () => this.verifyBackupCode());

        // Disable 2FA
        document.getElementById('2fa-confirm-disable')?.addEventListener('click', () => this.disable2FA());

        // Enter key support
        document.getElementById('2fa-verify-code')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifySetup();
        });
        document.getElementById('2fa-login-code')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyLogin();
        });
    }

    showStep(step) {
        document.querySelectorAll('.2fa-step').forEach(el => el.style.display = 'none');
        document.getElementById(`2fa-step-${step}`).style.display = 'block';
    }

    async startSetup() {
        try {
            const response = await api.post('/2fa/setup');
            
            if (response.qrCode) {
                document.getElementById('2fa-qr-code').src = response.qrCode;
                document.getElementById('2fa-manual-key').value = response.manualEntryKey;
                this.showStep(2);
            }
        } catch (error) {
            this.showToast('Failed to start 2FA setup', 'error');
            console.error('2FA setup error:', error);
        }
    }

    async verifySetup() {
        const code = document.getElementById('2fa-verify-code').value;
        
        if (code.length !== 6) {
            this.showToast('Please enter a 6-digit code', 'error');
            return;
        }

        try {
            const response = await api.post('/2fa/verify-setup', { token: code });
            
            if (response.backupCodes) {
                this.displayBackupCodes(response.backupCodes);
                this.currentBackupCodes = response.backupCodes;
                this.showStep(3);
                this.showToast('2FA enabled successfully!', 'success');
            }
        } catch (error) {
            this.showToast(error.message || 'Invalid code. Please try again.', 'error');
        }
    }

    displayBackupCodes(codes) {
        const container = document.getElementById('2fa-backup-codes-list');
        container.innerHTML = codes.map(code => `<div style="padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px;">${code}</div>`).join('');
    }

    copyManualKey() {
        const input = document.getElementById('2fa-manual-key');
        input.select();
        document.execCommand('copy');
        this.showToast('Key copied to clipboard!', 'success');
    }

    downloadBackupCodes() {
        if (!this.currentBackupCodes) return;
        
        const text = `Ultimate Sports AI - 2FA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\nIMPORTANT: Keep these codes safe and secure.\nEach code can only be used once.\n\n${this.currentBackupCodes.join('\n')}\n\nDo not share these codes with anyone.`;
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ultimate-sports-ai-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Backup codes downloaded', 'success');
    }

    async verifyLogin() {
        const code = document.getElementById('2fa-login-code').value;
        const { userId } = this.pendingLogin || {};

        if (!userId) {
            this.showToast('Session expired. Please login again.', 'error');
            this.closeModal('2fa-verify-modal');
            return;
        }

        if (code.length !== 6) {
            this.showToast('Please enter a 6-digit code', 'error');
            return;
        }

        try {
            // Validate 2FA code
            const validateResponse = await api.post('/2fa/validate', {
                userId,
                token: code,
                isBackupCode: false
            });

            if (validateResponse.verified) {
                // Complete login
                const loginResponse = await api.post('/auth/login-2fa', { userId });
                
                if (loginResponse.accessToken) {
                    localStorage.setItem('auth_token', loginResponse.accessToken);
                    appState.setUser(loginResponse.user);
                    this.closeModal('2fa-verify-modal');
                    this.showToast('Login successful!', 'success');
                    navigation.navigateTo('home');
                }
            }
        } catch (error) {
            this.showToast(error.message || 'Invalid code', 'error');
        }
    }

    showBackupInput() {
        document.getElementById('2fa-backup-input').style.display = 'block';
        document.getElementById('2fa-use-backup').style.display = 'none';
    }

    async verifyBackupCode() {
        const code = document.getElementById('2fa-backup-code').value.toUpperCase();
        const { userId } = this.pendingLogin || {};

        if (!userId || code.length !== 8) {
            this.showToast('Invalid backup code', 'error');
            return;
        }

        try {
            const validateResponse = await api.post('/2fa/validate', {
                userId,
                token: code,
                isBackupCode: true
            });

            if (validateResponse.verified) {
                const loginResponse = await api.post('/auth/login-2fa', { userId });
                
                if (loginResponse.accessToken) {
                    localStorage.setItem('auth_token', loginResponse.accessToken);
                    appState.setUser(loginResponse.user);
                    this.closeModal('2fa-verify-modal');
                    this.showToast('Login successful! Note: Backup code has been used.', 'success');
                    navigation.navigateTo('home');
                }
            }
        } catch (error) {
            this.showToast(error.message || 'Invalid backup code', 'error');
        }
    }

    async disable2FA() {
        const password = document.getElementById('2fa-disable-password').value;
        const token = document.getElementById('2fa-disable-code').value;

        if (!password || token.length !== 6) {
            this.showToast('Please provide password and 2FA code', 'error');
            return;
        }

        try {
            await api.post('/2fa/disable', { password, token });
            this.closeModal('2fa-disable-modal');
            this.showToast('2FA has been disabled', 'success');
            
            // Refresh 2FA status
            if (window.location.pathname.includes('settings')) {
                location.reload();
            }
        } catch (error) {
            this.showToast(error.message || 'Failed to disable 2FA', 'error');
        }
    }

    async checkStatus() {
        try {
            const response = await api.get('/2fa/status');
            return response;
        } catch (error) {
            console.error('Failed to check 2FA status:', error);
            return { enabled: false, backupCodesRemaining: 0 };
        }
    }

    openSetupModal() {
        this.showStep(1);
        this.setupModal.style.display = 'flex';
    }

    openVerifyModal(pendingLogin) {
        this.pendingLogin = pendingLogin;
        document.getElementById('2fa-login-code').value = '';
        document.getElementById('2fa-backup-input').style.display = 'none';
        document.getElementById('2fa-use-backup').style.display = 'block';
        this.verifyModal.style.display = 'flex';
    }

    openDisableModal() {
        document.getElementById('2fa-disable-password').value = '';
        document.getElementById('2fa-disable-code').value = '';
        document.getElementById('2fa-disable-modal').style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showToast(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize global instance
const twoFactorManager = new TwoFactorManager();

// Export for use in other modules
window.twoFactorManager = twoFactorManager;