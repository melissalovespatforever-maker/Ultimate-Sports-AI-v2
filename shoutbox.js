// ============================================
// GLOBAL SHOUTBOX SYSTEM
// Scrolling news ticker for big wins and community news
// ============================================

class ShoutboxManager {
    constructor() {
        this.container = null;
        this.messages = [
            "🏆 @KingBettor just won the Super Bowl Parlay! (+1200)",
            "🔥 Season 1: Origins is now LIVE! Level up for exclusive rewards.",
            "🤖 AI Coach 'The Professor' is on a 12-game win streak!",
            "💎 New Elite Avatars added to the Shop.",
            "⚡ Double SXP Weekend starts this Friday!",
            "📣 Welcome to the Ultimate Sports AI Lounge."
        ];
        this.currentIndex = 0;
    }

    init() {
        console.log('📣 Initializing Global Shoutbox...');
        
        // Add season info if available
        if (window.seasonManager) {
            const progress = window.seasonManager.getSeasonProgress();
            if (progress > 90) {
                this.messages.push("⏳ Season 1 is ending soon! Claim your rewards now.");
            }
        }

        this.createUI();
        this.startCycle();
        
        // Listen for global win events
        window.addEventListener('achievementUnlocked', (e) => {
            const { name, rarity, icon, xp } = e.detail;
            const username = window.globalState?.getUser()?.name || localStorage.getItem('unified_username') || 'A Player';
            
            if (rarity === 'legendary') {
                this.addMessage(`👑 LEGENDARY: ${username} unlocked '${name}'! ${icon} (+${xp} XP)`, true);
            } else if (rarity === 'rare') {
                this.addMessage(`💎 RARE: ${username} unlocked '${name}'! ${icon}`, true);
            } else {
                this.addMessage(`✨ Achievement: ${username} unlocked '${name}'!`);
            }
        });

        window.addEventListener('tournamentWin', (e) => {
            this.addMessage(`👑 Tournament Champion: ${e.detail.winner} won the ${e.detail.tournamentName}!`);
        });
    }

    createUI() {
        const header = document.querySelector('.app-bar');
        if (!header) return;

        const shoutbox = document.createElement('div');
        shoutbox.id = 'global-shoutbox';
        shoutbox.className = 'global-shoutbox';
        shoutbox.innerHTML = `
            <div class="shoutbox-label">LATEST NEWS</div>
            <div class="shoutbox-content">
                <div id="shoutbox-ticker" class="shoutbox-ticker">
                    ${this.messages[0]}
                </div>
            </div>
        `;

        header.after(shoutbox);
        this.container = document.getElementById('shoutbox-ticker');
    }

    addMessage(msg, priority = false) {
        if (priority) {
            this.messages.unshift(msg);
            this.updateDisplay(msg);
            // Reset cycle timer to give priority message full time
            this.resetCycle();
        } else {
            this.messages.push(msg);
        }
        
        if (this.messages.length > 30) this.messages.pop();
    }

    updateDisplay(msg) {
        if (!this.container) return;
        
        this.container.classList.add('fade-out');
        setTimeout(() => {
            this.container.textContent = msg;
            this.container.classList.remove('fade-out');
            this.container.classList.add('fade-in');
            setTimeout(() => this.container.classList.remove('fade-in'), 500);
        }, 500);
    }

    resetCycle() {
        if (this.cycleInterval) clearInterval(this.cycleInterval);
        this.startCycle();
    }

    startCycle() {
        this.cycleInterval = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.messages.length;
            this.updateDisplay(this.messages[this.currentIndex]);
        }, 6000);
    }
}

window.shoutboxManager = new ShoutboxManager();
document.addEventListener('DOMContentLoaded', () => window.shoutboxManager.init());
