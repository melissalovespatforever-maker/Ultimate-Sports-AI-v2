/**
 * TROPHY NOTIFICATION SYSTEM
 * Handles the logic and display of the prestigious trophy unlock overlay.
 */

class TrophyNotificationSystem {
    constructor() {
        this.overlay = null;
        this.currentTrophy = null;
        this.queue = [];
        this.isShowing = false;
        
        // Trophy Image Mappings (Sync with TrophyCaseManager)
        this.trophyImages = {
            'tournament-win': 'https://rosebud.ai/assets/Ultimate sports ai trophy.png?REjH',
            'tournament-3wins': 'https://rosebud.ai/assets/Ultimate sports championship diamond ring.png?1Esq',
            'tournament-5wins': 'https://rosebud.ai/assets/Championship ring 1.png?shqb',
            'nfl-champ': 'https://rosebud.ai/assets/Soccer tournament.png?ok1w',
            'nba-champ': 'https://rosebud.ai/assets/Basketball trophy.png?28RZ',
            'mlb-champ': 'https://rosebud.ai/assets/Baseball trophy.png?ZPlR',
            'soccer-champ': 'https://rosebud.ai/assets/Soccer parlay trophy.png?ePTo',
            'rank-platinum': 'https://rosebud.ai/assets/Vip trophy.png?q8fV',
            'coins-100k': 'https://rosebud.ai/assets/Money bag trophy.png?ELGp',
            'rank-diamond': 'https://rosebud.ai/assets/World trophy.png?7n3n',
            'perfect-season': 'https://rosebud.ai/assets/Ultimate sports championship diamond ring.png?1Esq',
            'hall-of-fame': 'https://rosebud.ai/assets/Championship ring 1.png?shqb'
        };

        this.init();
    }

    init() {
        this.createOverlay();
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'trophy-notification-overlay';
        overlay.id = 'trophy-notification-overlay';
        
        overlay.innerHTML = `
            <div class="trophy-glow"></div>
            <div class="trophy-card">
                <div class="trophy-content">
                    <span class="trophy-unlocked-text">New Trophy Unlocked</span>
                    <div class="trophy-image-container">
                        <img id="trophy-notify-img" src="" alt="Trophy" class="trophy-image-large">
                    </div>
                    <h2 id="trophy-notify-name" class="trophy-name-large">Championship Ring</h2>
                    <p id="trophy-notify-desc" class="trophy-desc-large">You've reached the pinnacle of sports mastery.</p>
                    
                    <div class="trophy-rewards">
                        <div class="reward-pill xp-reward">
                            <span class="icon">✨</span>
                            <span id="trophy-notify-xp" class="value">+5000 XP</span>
                        </div>
                        <div class="reward-pill status-reward">
                            <span class="icon">🏆</span>
                            <span class="value">Showcased</span>
                        </div>
                    </div>
                    
                    <button class="trophy-close-btn" id="trophy-notify-close">Claim Your Prize</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.overlay = overlay;

        overlay.querySelector('#trophy-notify-close').addEventListener('click', () => {
            this.hide();
        });
    }

    /**
     * Shows a trophy notification.
     * @param {Object} achievement - The achievement object from AchievementsSystem
     */
    show(achievement) {
        if (this.isShowing) {
            this.queue.push(achievement);
            return;
        }

        this.currentTrophy = achievement;
        this.isShowing = true;

        const img = this.overlay.querySelector('#trophy-notify-img');
        const name = this.overlay.querySelector('#trophy-notify-name');
        const desc = this.overlay.querySelector('#trophy-notify-desc');
        const xp = this.overlay.querySelector('#trophy-notify-xp');

        // Set content
        img.src = this.trophyImages[achievement.id] || 'https://rosebud.ai/assets/Ultimate sports ai trophy.png?REjH';
        name.textContent = achievement.name;
        desc.textContent = achievement.description;
        xp.textContent = `+${achievement.xp} XP`;

        // Trigger visual effects
        this.overlay.classList.add('active');
        this.playCelebrationEffects();
        
        // Play sound if available
        if (window.soundEffects) {
            window.soundEffects.playSound('victory');
        }
    }

    hide() {
        this.overlay.classList.remove('active');
        this.isShowing = false;

        // Small delay to allow fade out before showing next in queue
        setTimeout(() => {
            if (this.queue.length > 0) {
                this.show(this.queue.shift());
            }
        }, 600);
    }

    playCelebrationEffects() {
        // Confetti
        if (window.confetti) {
            window.confetti.celebrate({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
            });
        }

        // Internal sparkles
        this.createSparkles();
    }

    createSparkles() {
        const card = this.overlay.querySelector('.trophy-card');
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                if (!this.isShowing) return;
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                const size = Math.random() * 8 + 4;
                sparkle.style.width = `${size}px`;
                sparkle.style.height = `${size}px`;
                sparkle.style.left = `${Math.random() * 100}%`;
                sparkle.style.top = `${Math.random() * 100}%`;
                card.appendChild(sparkle);
                setTimeout(() => sparkle.remove(), 1000);
            }, i * 150);
        }
    }
}

// Create global instance
window.trophyNotification = new TrophyNotificationSystem();
