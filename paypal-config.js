/**
 * PayPal Configuration for Ultimate Sports AI
 * Handle coin purchases through PayPal
 */

export const PAYPAL_CONFIG = {
    // Production PayPal Client ID
    CLIENT_ID: 'AY8wzPPT8jprCoc4NhICcYnBXBUFCGP0Fy0NL6eCz94UtfcSugDU8e991IPOwZtYYC1VxqyZ4-fD5MGOv',
    
    // Production environment
    ENVIRONMENT: 'production',
    
    CURRENCY: 'USD',
    
    // PayPal SDK options
    SDK_OPTIONS: {
        'client-id': 'AY8wzPPT8jprCoc4NhICcYnBXBUFCGP0Fy0NL6eCz94UtfcSugDU8e991IPOwZtYYC1VxqyZ4-fD5MGOv',
        'currency': 'USD',
        'intent': 'capture',
        'disable-funding': 'credit,card',
        'data-page-type': 'product-details'
    }
};

/**
 * Initialize PayPal buttons
 */
export function initializePayPal(bundleId, amount, onSuccess, onError) {
    if (typeof paypal === 'undefined') {
        console.error('PayPal SDK not loaded');
        return;
    }

    return paypal.Buttons({
        style: {
            layout: 'horizontal',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 45
        },
        
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    description: `Ultimate Coins Bundle - ${bundleId}`,
                    amount: {
                        currency_code: PAYPAL_CONFIG.CURRENCY,
                        value: amount.toFixed(2)
                    }
                }],
                application_context: {
                    shipping_preference: 'NO_SHIPPING' // Digital goods, no shipping needed
                }
            });
        },
        
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                console.log('PayPal payment completed:', details);
                
                // Call success callback
                if (onSuccess) {
                    onSuccess(details);
                }
                
                return details;
            });
        },
        
        onError: function(err) {
            console.error('PayPal payment error:', err);
            
            // Call error callback
            if (onError) {
                onError(err);
            }
        },
        
        onCancel: function(data) {
            console.log('PayPal payment cancelled by user');
            alert('Payment cancelled. No charges were made.');
        }
    });
}

/**
 * Credit coins to user account after successful payment
 * CRITICAL: Also syncs to backend immediately to prevent data loss
 */
export function creditCoinsAfterPurchase(coins, bundleName, transactionId) {
    try {
        const globalState = window.globalState || (window.parent && window.parent.globalState);
        
        if (globalState) {
            // Use addCoins method which handles both local AND backend sync
            const newBalance = globalState.addCoins(coins, `PayPal Purchase: ${bundleName}`, {
                method: 'paypal',
                transactionId: transactionId,
                bundleName: bundleName,
                verified: true,
                timestamp: Date.now()
            });
            
            console.log(`✅ Credited ${coins.toLocaleString()} coins via PayPal. New balance: ${newBalance.toLocaleString()}`);
            
            // CRITICAL: Force immediate backend sync for real money purchases
            syncPayPalPurchaseToBackend(coins, bundleName, transactionId);
            
            return true;
        } else {
            // Fallback to localStorage (guest mode)
            const currentBalance = parseInt(localStorage.getItem('unified_balance') || '0');
            const newBalance = currentBalance + coins;
            localStorage.setItem('unified_balance', newBalance.toString());
            localStorage.setItem('balance_last_updated', Date.now().toString());
            
            // Record transaction in localStorage
            const transactions = JSON.parse(localStorage.getItem('coin_transactions') || '[]');
            transactions.push({
                type: 'coin_purchase',
                amount: coins,
                description: `Purchased ${bundleName}`,
                timestamp: Date.now(),
                method: 'paypal',
                transactionId: transactionId,
                verified: true
            });
            localStorage.setItem('coin_transactions', JSON.stringify(transactions));
            
            // Store pending PayPal purchase for future sync when user logs in
            const pendingPurchases = JSON.parse(localStorage.getItem('pending_paypal_purchases') || '[]');
            pendingPurchases.push({
                coins,
                bundleName,
                transactionId,
                timestamp: Date.now()
            });
            localStorage.setItem('pending_paypal_purchases', JSON.stringify(pendingPurchases));
            
            console.log(`✅ Credited ${coins.toLocaleString()} coins (localStorage). New balance: ${newBalance.toLocaleString()}`);
            console.log(`📦 PayPal purchase stored for future sync when user logs in`);
            
            return true;
        }
    } catch (error) {
        console.error('❌ Error crediting coins:', error);
        return false;
    }
}

/**
 * Sync PayPal purchase to backend immediately
 * CRITICAL: Prevents data loss on logout/login
 */
async function syncPayPalPurchaseToBackend(coins, bundleName, transactionId) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        console.warn('⚠️ No auth token - PayPal purchase will sync on next login');
        return;
    }
    
    const apiUrl = window.CONFIG?.API_BASE_URL || 'https://ultimate-sports-ai-backend-production.up.railway.app';
    
    try {
        console.log(`🔄 Syncing PayPal purchase to backend...`, {
            coins,
            bundleName,
            transactionId
        });
        
        const response = await fetch(`${apiUrl}/api/payments/paypal-purchase`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'credit',
                amount: coins,
                reason: `PayPal Purchase: ${bundleName}`,
                metadata: {
                    method: 'paypal',
                    paypalTransactionId: transactionId,
                    bundleName: bundleName,
                    verified: true,
                    timestamp: Date.now()
                }
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ PayPal purchase synced to backend successfully:', data);
            
            // Remove from pending purchases if it was there
            const pendingPurchases = JSON.parse(localStorage.getItem('pending_paypal_purchases') || '[]');
            const filtered = pendingPurchases.filter(p => p.transactionId !== transactionId);
            localStorage.setItem('pending_paypal_purchases', JSON.stringify(filtered));
            
            return true;
        } else {
            console.error(`❌ Backend sync failed (${response.status}):`, await response.text());
            
            // Store for retry later
            const failedSyncs = JSON.parse(localStorage.getItem('failed_paypal_syncs') || '[]');
            failedSyncs.push({
                coins,
                bundleName,
                transactionId,
                timestamp: Date.now(),
                attempts: 1
            });
            localStorage.setItem('failed_paypal_syncs', JSON.stringify(failedSyncs));
            
            return false;
        }
    } catch (error) {
        console.error('❌ Network error syncing PayPal purchase:', error);
        
        // Store for retry later
        const failedSyncs = JSON.parse(localStorage.getItem('failed_paypal_syncs') || '[]');
        failedSyncs.push({
            coins,
            bundleName,
            transactionId,
            timestamp: Date.now(),
            attempts: 1
        });
        localStorage.setItem('failed_paypal_syncs', JSON.stringify(failedSyncs));
        
        return false;
    }
}

/**
 * Show success message with confetti
 */
export function showPurchaseSuccess(coins, bundleName) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 48px 64px;
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        text-align: center;
        animation: slideIn 0.5s ease;
    `;
    
    message.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
        <h2 style="font-size: 2rem; margin-bottom: 8px;">Purchase Complete!</h2>
        <p style="font-size: 1.5rem; font-weight: 700; margin-bottom: 16px;">${coins.toLocaleString()} Coins Added</p>
        <p style="font-size: 1rem; opacity: 0.9;">Your ${bundleName} has been credited to your account.</p>
    `;
    
    document.body.appendChild(message);
    
    // Confetti celebration
    if (window.confetti) {
        window.confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.5 },
            colors: ['#fbbf24', '#10b981', '#6366f1', '#ec4899']
        });
    }
    
    // Update balance display
    if (window.globalState) {
        window.globalState.updateAllDisplays();
    }
    
    // Remove message after 4 seconds
    setTimeout(() => {
        message.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => message.remove(), 500);
    }, 4000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translate(-50%, -60%);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translate(-50%, -50%);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -40%);
        }
    }
`;
document.head.appendChild(style);
