// ==========================================
// TUTORIAL WALKTHROUGH SYSTEM
// ==========================================

class TutorialSystem {
    constructor() {
        this.steps = [
            {
                id: 'welcome',
                target: null, // Center screen
                title: 'Welcome to the Team!',
                content: 'Ready to dominate? This quick tour will show you how to use our AI-powered tools to make smarter picks.',
                icon: 'fa-flag-checkered',
                position: 'center'
            },
            {
                id: 'ai-coaches',
                target: '[data-page="ai-coaches"].quick-action-card',
                fallbackTarget: '[data-page="ai-coaches"].menu-item',
                title: 'AI Coaches',
                content: 'Your secret weapon. Get expert match predictions and win probability analysis from our advanced AI models.',
                icon: 'fa-robot',
                position: 'bottom'
            },
            {
                id: 'live-scores',
                target: '[data-page="live-scores"].quick-action-card',
                fallbackTarget: '[data-page="live-scores"].menu-item',
                title: 'Live Action',
                content: 'Track games in real-time with live scores. Don\'t miss a single play or score update.',
                icon: 'fa-bolt',
                position: 'bottom'
            },
            {
                id: 'analytics',
                target: '[data-page="analytics"].quick-action-card',
                fallbackTarget: '[data-page="analytics"].menu-item',
                title: 'Performance Stats',
                content: 'Analyze your betting history and track your win rate. Knowledge is power!',
                icon: 'fa-chart-line',
                position: 'top'
            },
            {
                id: 'profile',
                target: '.profile-btn',
                title: 'Your Profile',
                content: 'Manage your account, view your achievements, and invite friends to earn coins!',
                icon: 'fa-user-circle',
                position: 'bottom-left'
            }
        ];
        
        this.currentStepIndex = 0;
        this.isActive = false;
        
        // Bind methods
        this.next = this.next.bind(this);
        this.skip = this.skip.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    init() {
        // Create UI elements if they don't exist
        if (!document.getElementById('tutorial-spotlight')) {
            this.createUI();
        }
        
        // Listen for resize to adjust spotlight
        window.addEventListener('resize', this.handleResize);
        
        console.log('🎓 Tutorial System Initialized');
    }

    createUI() {
        // Spotlight
        const spotlight = document.createElement('div');
        spotlight.id = 'tutorial-spotlight';
        document.body.appendChild(spotlight);

        // Click Blocker
        const blocker = document.createElement('div');
        blocker.id = 'tutorial-click-blocker';
        document.body.appendChild(blocker);

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'tutorial-tooltip';
        document.body.appendChild(tooltip);
    }

    start() {
        if (localStorage.getItem('tutorial_completed') === 'true') {
            console.log('🎓 Tutorial already completed');
            return;
        }

        console.log('🎓 Starting Tutorial');
        this.isActive = true;
        this.currentStepIndex = 0;
        
        document.getElementById('tutorial-click-blocker').classList.add('active');
        
        // Ensure we are on home page
        if (window.appNavigation && window.appNavigation.navigateTo) {
            window.appNavigation.navigateTo('home');
        }
        
        // Small delay to allow page transition
        setTimeout(() => this.showStep(0), 500);
    }

    showStep(index) {
        if (index >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[index];
        const spotlight = document.getElementById('tutorial-spotlight');
        const tooltip = document.getElementById('tutorial-tooltip');

        // Find Target
        let targetEl = null;
        if (step.target) {
            targetEl = document.querySelector(step.target);
            // Try fallback
            if (!targetEl && step.fallbackTarget) {
                targetEl = document.querySelector(step.fallbackTarget);
            }
        }

        // Render Tooltip Content
        tooltip.innerHTML = `
            <div class="tutorial-mascot">🏆</div>
            <h3><i class="fas ${step.icon}"></i> ${step.title}</h3>
            <p>${step.content}</p>
            
            <div class="tutorial-progress">
                ${this.steps.map((_, i) => `
                    <div class="tutorial-dot ${i === index ? 'active' : ''}"></div>
                `).join('')}
            </div>
            
            <div class="tutorial-actions">
                <button class="tutorial-btn tutorial-btn-skip" id="tut-skip">Skip</button>
                <button class="tutorial-btn tutorial-btn-next" id="tut-next">
                    ${index === this.steps.length - 1 ? 'Finish' : 'Next'} <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;

        // Bind Buttons
        document.getElementById('tut-next').onclick = this.next;
        document.getElementById('tut-skip').onclick = this.skip;

        // Position Spotlight & Tooltip
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            const padding = 8;
            
            // Move spotlight
            spotlight.style.display = 'block';
            spotlight.style.top = (rect.top - padding) + 'px';
            spotlight.style.left = (rect.left - padding) + 'px';
            spotlight.style.width = (rect.width + (padding * 2)) + 'px';
            spotlight.style.height = (rect.height + (padding * 2)) + 'px';
            
            // Position Tooltip
            this.positionTooltip(tooltip, rect, step.position);
        } else {
            // Center Screen (Welcome Step)
            spotlight.style.display = 'none'; // Hide spotlight hole
            
            // Center tooltip
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            tooltip.style.opacity = '1';
        }

        // Show Tooltip
        tooltip.classList.add('visible');
    }

    positionTooltip(tooltip, targetRect, position) {
        const tooltipRect = tooltip.getBoundingClientRect();
        const gap = 20;
        let top, left;

        // Default: Bottom
        top = targetRect.bottom + gap;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // Adjust based on position preference
        if (position === 'top') {
            top = targetRect.top - tooltipRect.height - gap;
        } else if (position === 'left') {
            left = targetRect.left - tooltipRect.width - gap;
            top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        } else if (position === 'right') {
            left = targetRect.right + gap;
            top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        } else if (position === 'bottom-left') {
            top = targetRect.bottom + gap;
            left = targetRect.left - tooltipRect.width + targetRect.width; // Align right edges
        }

        // Boundary checks (keep on screen)
        const padding = 10;
        if (left < padding) left = padding;
        if (left + tooltipRect.width > window.innerWidth - padding) left = window.innerWidth - tooltipRect.width - padding;
        if (top < padding) top = padding;
        if (top + tooltipRect.height > window.innerHeight - padding) top = window.innerHeight - tooltipRect.height - padding;

        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
        tooltip.style.transform = 'none'; // Remove centering transform
    }

    next() {
        this.currentStepIndex++;
        this.showStep(this.currentStepIndex);
    }

    skip() {
        this.complete();
    }

    complete() {
        this.isActive = false;
        
        // Hide Spotlight
        const spotlight = document.getElementById('tutorial-spotlight');
        if (spotlight) spotlight.style.display = 'none';
        
        // Disable Blocker
        const blocker = document.getElementById('tutorial-click-blocker');
        if (blocker) blocker.classList.remove('active');
        
        // Hide Tooltip
        const tooltip = document.getElementById('tutorial-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
            // Force hide after transition
            setTimeout(() => {
                if (tooltip && !this.isActive) {
                    tooltip.style.display = 'none';
                }
            }, 300);
        }
        
        localStorage.setItem('tutorial_completed', 'true');
        
        if (window.showToast) {
            window.showToast('You\'re all set! Enjoy the game! 🚀', 'success');
        }
        
        // Only run confetti if available
        if (window.confetti && typeof window.confetti === 'function') {
            try {
                window.confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            } catch (e) {
                console.warn('Confetti error:', e);
            }
        }
    }

    handleResize() {
        if (this.isActive) {
            this.showStep(this.currentStepIndex);
        }
    }
    
    // Debug method to force start
    resetAndStart() {
        localStorage.removeItem('tutorial_completed');
        this.start();
    }
}

// Initialize
window.tutorialSystem = new TutorialSystem();
document.addEventListener('DOMContentLoaded', () => {
    window.tutorialSystem.init();
});
