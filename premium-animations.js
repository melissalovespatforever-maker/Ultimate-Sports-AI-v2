/* ============================================
   PREMIUM UI ANIMATIONS & INTERACTIONS
   Delightful micro-animations that beat competitors
   ============================================ */

// Initialize premium animations
function initPremiumAnimations() {
    // Scroll-based app bar shadow
    initScrollEnhancements();
    
    // Card hover tilt effects (3D)
    init3DCardEffects();
    
    // Smooth scrolling for navigation
    initSmoothScrolling();
    
    // Number counter animations
    initNumberCounters();
    
    // Progress bar animations
    initProgressBars();
    
    // Parallax effects
    initParallaxEffects();
    
    // Confetti celebrations
    initCelebrations();
}

// ============================================
// SCROLL ENHANCEMENTS
// ============================================

function initScrollEnhancements() {
    const appBar = document.querySelector('.app-bar');
    if (!appBar) return;
    
    let lastScroll = 0;
    const threshold = 50;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add shadow when scrolled
        if (currentScroll > threshold) {
            appBar.classList.add('scrolled');
        } else {
            appBar.classList.remove('scrolled');
        }
        
        // Hide/show on scroll direction (optional - uncomment to enable)
        /*
        if (currentScroll > lastScroll && currentScroll > threshold) {
            appBar.style.transform = 'translateY(-100%)';
        } else {
            appBar.style.transform = 'translateY(0)';
        }
        */
        
        lastScroll = currentScroll;
    }, { passive: true });
}

// ============================================
// 3D CARD TILT EFFECTS
// ============================================

function init3DCardEffects() {
    const cards = document.querySelectorAll('.glass-card, .coach-card, .tournament-card-enhanced, .match-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return; // Disable on mobile
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ============================================
// SMOOTH SCROLLING
// ============================================

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// NUMBER COUNTER ANIMATIONS
// ============================================

function initNumberCounters() {
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                animateNumber(entry.target);
                entry.target.dataset.animated = 'true';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.stat-number, .stat-value, .team-score, .tournament-prize').forEach(el => {
        observer.observe(el);
    });
}

function animateNumber(element) {
    const text = element.textContent;
    const number = parseFloat(text.replace(/[^0-9.-]/g, ''));
    
    if (isNaN(number)) return;
    
    const prefix = text.match(/^[^0-9]*/)?.[0] || '';
    const suffix = text.match(/[^0-9]*$/)?.[0] || '';
    const duration = 1500;
    const steps = 60;
    const increment = number / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    element.textContent = prefix + '0' + suffix;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= number) {
            element.textContent = prefix + Math.round(number) + suffix;
            clearInterval(timer);
        } else {
            element.textContent = prefix + Math.round(current) + suffix;
        }
    }, stepDuration);
}

// ============================================
// PROGRESS BAR ANIMATIONS
// ============================================

function initProgressBars() {
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const fill = entry.target.querySelector('.progress-fill');
                if (fill) {
                    const width = fill.dataset.width || fill.style.width;
                    fill.style.width = '0%';
                    setTimeout(() => {
                        fill.style.width = width;
                    }, 100);
                }
                entry.target.dataset.animated = 'true';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.progress-bar').forEach(bar => {
        observer.observe(bar);
    });
}

// ============================================
// PARALLAX EFFECTS
// ============================================

function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.hero-section, .stat-icon-circle, .coach-avatar');
    
    window.addEventListener('scroll', () => {
        if (window.innerWidth < 768) return; // Disable on mobile
        
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach((el, index) => {
            const speed = 0.1 + (index * 0.05);
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    }, { passive: true });
}

// ============================================
// CELEBRATION EFFECTS
// ============================================

function initCelebrations() {
    // Listen for achievement unlocks, tournament wins, etc.
    document.addEventListener('celebration', (e) => {
        const type = e.detail?.type || 'default';
        triggerCelebration(type);
    });
}

function triggerCelebration(type = 'default') {
    // Create confetti effect
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#22c55e'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        createConfetti(colors[Math.floor(Math.random() * colors.length)]);
    }
    
    // Play sound effect (if available)
    if (window.playSound) {
        window.playSound('celebration');
    }
}

function createConfetti(color) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = color;
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.opacity = '1';
    confetti.style.zIndex = '9999';
    confetti.style.borderRadius = '50%';
    confetti.style.pointerEvents = 'none';
    
    document.body.appendChild(confetti);
    
    const animation = confetti.animate([
        {
            transform: `translateY(0) rotate(0deg)`,
            opacity: 1
        },
        {
            transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 360}deg)`,
            opacity: 0
        }
    ], {
        duration: 2000 + Math.random() * 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    
    animation.onfinish = () => {
        confetti.remove();
    };
}

// ============================================
// RIPPLE EFFECT ON BUTTONS
// ============================================

function addRippleEffect(button, e) {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = '0';
    ripple.style.height = '0';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.5)';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.pointerEvents = 'none';
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    ripple.animate([
        { width: '0', height: '0', opacity: 1 },
        { width: '300px', height: '300px', opacity: 0 }
    ], {
        duration: 600,
        easing: 'ease-out'
    }).onfinish = () => ripple.remove();
}

// Add ripple to all buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('button, .btn-primary, .btn-secondary, .btn-accent').forEach(button => {
        button.addEventListener('click', (e) => {
            addRippleEffect(button, e);
        });
    });
});

// ============================================
// TOAST NOTIFICATIONS WITH ANIMATION
// ============================================

function showPremiumToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `premium-toast premium-toast-${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ⓘ'
    };
    
    toast.innerHTML = `
        <div class="premium-toast-icon">${icons[type]}</div>
        <div class="premium-toast-message">${message}</div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: rgba(30, 41, 59, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 400px;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Animate out
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ============================================
// SKELETON LOADING STATES
// ============================================

function createSkeleton(type = 'card') {
    const templates = {
        card: `
            <div class="glass-card skeleton-card">
                <div class="skeleton" style="width: 100%; height: 200px; margin-bottom: 16px;"></div>
                <div class="skeleton" style="width: 80%; height: 24px; margin-bottom: 12px;"></div>
                <div class="skeleton" style="width: 60%; height: 16px;"></div>
            </div>
        `,
        list: `
            <div class="skeleton-item" style="margin-bottom: 12px;">
                <div class="skeleton" style="width: 48px; height: 48px; border-radius: 50%; margin-right: 12px;"></div>
                <div style="flex: 1;">
                    <div class="skeleton" style="width: 70%; height: 20px; margin-bottom: 8px;"></div>
                    <div class="skeleton" style="width: 50%; height: 16px;"></div>
                </div>
            </div>
        `
    };
    
    const container = document.createElement('div');
    container.innerHTML = templates[type] || templates.card;
    return container.firstElementChild;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

window.premiumUI = {
    init: initPremiumAnimations,
    toast: showPremiumToast,
    celebrate: triggerCelebration,
    skeleton: createSkeleton
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPremiumAnimations);
} else {
    initPremiumAnimations();
}
