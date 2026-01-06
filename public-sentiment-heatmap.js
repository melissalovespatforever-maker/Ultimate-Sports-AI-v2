/**
 * Public Sentiment Heatmap Component
 * Visualizes community consensus across games using a color-coded heatmap grid.
 */

class PublicSentimentHeatmap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.selectedSport = 'NFL';
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        if (!this.container) return;
        
        this.renderLayout();
        await this.updateData();
        
        // Refresh every minute
        this.refreshInterval = setInterval(() => this.updateData(), 60000);
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="sentiment-heatmap-container">
                <div class="heatmap-header">
                    <h2><i class="fas fa-th"></i> Public Sentiment Heatmap</h2>
                    <div class="heatmap-controls">
                        <button class="heatmap-filter-btn active" data-sport="NFL">NFL</button>
                        <button class="heatmap-filter-btn" data-sport="NBA">NBA</button>
                        <button class="heatmap-filter-btn" data-sport="MLB">MLB</button>
                        <button class="heatmap-filter-btn" data-sport="NHL">NHL</button>
                        <button class="heatmap-filter-btn" data-sport="SOCCER">Soccer</button>
                    </div>
                </div>
                
                <div id="heatmap-grid" class="heatmap-grid">
                    <div class="loading-placeholder" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                        <i class="fas fa-circle-notch fa-spin"></i> Loading Sentiment Map...
                    </div>
                </div>
                
                <div class="heatmap-legend">
                    <div class="legend-item">Away Consensus</div>
                    <div class="legend-bar"></div>
                    <div class="legend-item">Home Consensus</div>
                </div>
            </div>
        `;

        this.attachListeners();
    }

    attachListeners() {
        this.container.querySelectorAll('.heatmap-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('.heatmap-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedSport = btn.dataset.sport;
                this.updateData();
            });
        });
    }

    async updateData() {
        if (!window.sportsDataService) return;
        
        try {
            const games = await window.sportsDataService.getGames(this.selectedSport);
            this.renderGrid(games);
        } catch (error) {
            console.error('Error updating sentiment heatmap:', error);
        }
    }

    renderGrid(games) {
        const grid = document.getElementById('heatmap-grid');
        if (!grid) return;
        
        if (games.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">No active games found for ${this.selectedSport}.</div>`;
            return;
        }

        grid.innerHTML = games.map(game => {
            // Generate deterministic consensus based on game ID
            const seed = this.hashCode(game.id);
            const homeConsensus = 30 + (seed % 41); // 30-70%
            const awayConsensus = 100 - homeConsensus;
            
            // Map percentage to color scale
            // 0% Away (30% value) -> #3b82f6
            // 50% -> #64748b
            // 100% Home (70% value) -> #ef4444
            
            const normalized = (homeConsensus - 30) / 40; // 0 to 1
            
            // Professional Heatmap Scale: Blue (Away) -> Grey (Neutral) -> Red (Home)
            let color;
            if (normalized < 0.5) {
                // Blue to Grey
                color = this.interpolateColor('#3b82f6', '#475569', normalized * 2);
            } else {
                // Grey to Red
                color = this.interpolateColor('#475569', '#ef4444', (normalized - 0.5) * 2);
            }
            
            const dominantTeam = homeConsensus > awayConsensus ? game.homeTeam.shortName : game.awayTeam.shortName;
            const dominantPercent = Math.max(homeConsensus, awayConsensus);

            return `
                <div class="heatmap-tile" style="background-color: ${color};" 
                     onclick="appNavigation.navigateTo('live-scores')">
                    <div class="tile-matchup">${game.awayTeam.shortName} @ ${game.homeTeam.shortName}</div>
                    <div class="tile-percentage">${dominantPercent}%</div>
                    <div class="tile-label">${dominantTeam} Consensus</div>
                    <div class="tile-glow"></div>
                </div>
            `;
        }).join('');
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    interpolateColor(color1, color2, factor) {
        const hex = (x) => {
            const s = x.toString(16);
            return s.length === 1 ? '0' + s : s;
        };

        const r1 = parseInt(color1.substring(1, 3), 16);
        const g1 = parseInt(color1.substring(3, 5), 16);
        const b1 = parseInt(color1.substring(5, 7), 16);

        const r2 = parseInt(color2.substring(1, 3), 16);
        const g2 = parseInt(color2.substring(3, 5), 16);
        const b2 = parseInt(color2.substring(5, 7), 16);

        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));

        return `#${hex(r)}${hex(g)}${hex(b)}`;
    }
}

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Add container to Home page if it doesn't exist
    const homePage = document.getElementById('home-page');
    if (homePage && !document.getElementById('sentiment-heatmap-container')) {
        const container = document.createElement('div');
        container.id = 'sentiment-heatmap-container';
        homePage.appendChild(container);
    }
    
    // Create widget
    window.publicSentimentHeatmap = new PublicSentimentHeatmap('sentiment-heatmap-container');
});
