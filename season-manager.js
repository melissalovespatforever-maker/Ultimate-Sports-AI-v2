// ============================================
// SEASON MANAGER
// Handles long-term progression, season resets, and archives
// ============================================

class SeasonManager {
    constructor() {
        this.currentSeason = 1;
        this.seasonName = "Origins";
        this.endDate = new Date('2025-03-01'); // Season ends March 1st
        this.isResetting = false;
    }

    init() {
        console.log(`🌟 Season ${this.currentSeason}: ${this.seasonName} Manager Initialized`);
        this.checkSeasonStatus();
    }

    checkSeasonStatus() {
        const now = new Date();
        const timeLeft = this.endDate - now;
        
        if (timeLeft <= 0) {
            console.warn("🏁 Season 1 has ended! Triggering archive sequence...");
            this.archiveCurrentSeason();
        } else {
            const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
            console.log(`📅 ${daysLeft} days remaining in Season ${this.currentSeason}`);
        }
    }

    archiveCurrentSeason() {
        if (this.isResetting) return;
        this.isResetting = true;

        const globalState = window.globalState;
        const user = globalState?.getUser();
        
        if (!user) return;

        // Archive stats
        const archive = JSON.parse(localStorage.getItem('season_archives') || '[]');
        const currentStats = {
            season: this.currentSeason,
            name: this.seasonName,
            level: user.season_level || 1,
            xp: user.season_xp || 0,
            date: new Date().toISOString()
        };

        archive.push(currentStats);
        localStorage.setItem('season_archives', JSON.stringify(archive));

        // Prep for Season 2
        this.transitionToNewSeason();
    }

    transitionToNewSeason() {
        console.log("🚀 Transitioning to Season 2: Evolution...");
        
        const globalState = window.globalState;
        const user = globalState?.getUser();

        if (user) {
            // Reset season-specific progress
            user.season_level = 1;
            user.season_xp = 0;
            user.current_season = 2;
            
            // Give legacy badge
            if (!user.badges) user.badges = [];
            if (!user.badges.includes('Season 1 Veteran')) {
                user.badges.push('Season 1 Veteran');
            }

            globalState.setUser(user);
        }

        this.currentSeason = 2;
        this.seasonName = "Evolution";
        this.endDate = new Date('2025-06-01');
        this.isResetting = false;

        window.dispatchEvent(new CustomEvent('seasonReset', { 
            detail: { newSeason: 2, name: "Evolution" } 
        }));
    }

    getSeasonProgress() {
        const now = new Date();
        const start = new Date('2024-12-01');
        const total = this.endDate - start;
        const elapsed = now - start;
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    }
}

window.seasonManager = new SeasonManager();
document.addEventListener('DOMContentLoaded', () => window.seasonManager.init());
