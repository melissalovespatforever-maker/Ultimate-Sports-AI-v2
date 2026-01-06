/**
 * Global Search System
 * Provides instant search across teams, players, and live games
 */

class GlobalSearchManager {
    constructor() {
        this.searchInput = null;
        this.resultsDropdown = null;
        this.debounceTimer = null;
        this.currentResults = [];
        this.selectedIndex = -1;
        this.isOpen = false;
        
        // Search index (in a real app, this would come from API)
        this.searchIndex = {
            teams: [],
            players: [],
            games: []
        };
        
        this.init();
    }

    init() {
        this.createSearchUI();
        this.attachEventListeners();
        this.buildSearchIndex();
        console.log('🔍 Global Search initialized');
    }

    createSearchUI() {
        // Find or create the search container in the header
        const appBar = document.querySelector('.app-bar');
        if (!appBar) return;

        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.className = 'global-search-container';
        searchContainer.innerHTML = `
            <div class="search-input-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input 
                    type="text" 
                    class="global-search-input" 
                    placeholder="Search teams, players, games..."
                    aria-label="Global search"
                    autocomplete="off"
                >
                <button class="search-clear-btn" aria-label="Clear search">
                    <i class="fas fa-times"></i>
                </button>
                <i class="fas fa-spinner fa-spin search-loading"></i>
            </div>
            <div class="search-results-dropdown">
                <!-- Results populated dynamically -->
            </div>
        `;

        // Insert after the app title
        const appTitle = appBar.querySelector('.app-title');
        if (appTitle) {
            appTitle.parentNode.insertBefore(searchContainer, appTitle.nextSibling);
        }

        this.searchInput = searchContainer.querySelector('.global-search-input');
        this.resultsDropdown = searchContainer.querySelector('.search-results-dropdown');
        this.clearBtn = searchContainer.querySelector('.search-clear-btn');
        this.loadingIcon = searchContainer.querySelector('.search-loading');
    }

    attachEventListeners() {
        if (!this.searchInput) return;

        // Input events
        this.searchInput.addEventListener('input', (e) => this.handleInput(e));
        this.searchInput.addEventListener('focus', () => this.handleFocus());
        this.searchInput.addEventListener('blur', () => this.handleBlur());
        this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Clear button
        this.clearBtn.addEventListener('click', () => this.clearSearch());

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.global-search-container')) {
                this.closeDropdown();
            }
        });

        // Keyboard shortcut (Cmd/Ctrl + K)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput.focus();
            }

            // Escape to close
            if (e.key === 'Escape' && this.isOpen) {
                this.closeDropdown();
                this.searchInput.blur();
            }
        });
    }

    handleInput(e) {
        const query = e.target.value.trim();
        
        // Show/hide clear button
        if (query.length > 0) {
            this.clearBtn.classList.add('visible');
        } else {
            this.clearBtn.classList.remove('visible');
            this.closeDropdown();
            return;
        }

        // Debounce search
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    handleFocus() {
        if (this.searchInput.value.trim().length > 0) {
            this.openDropdown();
        }
    }

    handleBlur() {
        // Delay to allow click events on results
        setTimeout(() => {
            if (!this.resultsDropdown.matches(':hover')) {
                this.closeDropdown();
            }
        }, 200);
    }

    handleKeydown(e) {
        if (!this.isOpen) return;

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.navigateResults(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateResults(-1);
                break;
            case 'Enter':
                e.preventDefault();
                this.selectResult();
                break;
        }
    }

    async performSearch(query) {
        this.showLoading();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));

        const results = {
            teams: this.searchTeams(query),
            players: this.searchPlayers(query),
            games: this.searchGames(query)
        };

        this.currentResults = results;
        this.renderResults(results);
        this.hideLoading();
        this.openDropdown();
    }

    searchTeams(query) {
        const lowerQuery = query.toLowerCase();
        return this.searchIndex.teams.filter(team => 
            team.name.toLowerCase().includes(lowerQuery) ||
            team.abbreviation.toLowerCase().includes(lowerQuery) ||
            team.city.toLowerCase().includes(lowerQuery)
        ).slice(0, 5);
    }

    searchPlayers(query) {
        const lowerQuery = query.toLowerCase();
        return this.searchIndex.players.filter(player =>
            player.name.toLowerCase().includes(lowerQuery) ||
            player.team.toLowerCase().includes(lowerQuery)
        ).slice(0, 5);
    }

    searchGames(query) {
        const lowerQuery = query.toLowerCase();
        return this.searchIndex.games.filter(game =>
            game.homeTeam.toLowerCase().includes(lowerQuery) ||
            game.awayTeam.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);
    }

    renderResults(results) {
        const hasResults = results.teams.length > 0 || results.players.length > 0 || results.games.length > 0;
        
        if (!hasResults) {
            this.resultsDropdown.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <p>No results found. Try a different search term.</p>
                </div>
                <div class="search-shortcuts">
                    <button class="search-shortcut" onclick="window.globalSearch.searchInput.value='Lakers'; window.globalSearch.performSearch('Lakers')">Lakers</button>
                    <button class="search-shortcut" onclick="window.globalSearch.searchInput.value='NFL'; window.globalSearch.performSearch('NFL')">NFL</button>
                    <button class="search-shortcut" onclick="window.globalSearch.searchInput.value='Live'; window.globalSearch.performSearch('Live')">Live Games</button>
                </div>
            `;
            return;
        }

        const fallbackLogo = 'https://play.rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN';
        let html = '';

        // Teams Section
        if (results.teams.length > 0) {
            html += `
                <div class="search-results-section">
                    <div class="search-section-title"><i class="fas fa-shield-alt"></i> Teams</div>
                    ${results.teams.map(team => {
                        // Ensure logo is resolved using the robust global resolver
                        const displayLogo = window.resolveSportsLogo ? 
                                          window.resolveSportsLogo(team.id, team.sport, team.logo) : 
                                          team.logo;

                        return `
                            <div class="search-result-item" data-type="team" data-id="${team.id}">
                                <img src="${displayLogo}" onerror="this.onerror=null; this.src='${fallbackLogo}';" alt="${team.name}" class="result-logo">
                                <div class="result-info">
                                    <div class="result-name">${team.name}</div>
                                    <div class="result-meta">
                                        <span class="result-badge badge-team">${team.sport}</span>
                                        <span>${team.record || 'N/A'}</span>
                                    </div>
                                </div>
                                <i class="fas fa-arrow-right" style="color: var(--text-secondary);"></i>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // Players Section
        if (results.players.length > 0) {
            html += `
                <div class="search-results-section">
                    <div class="search-section-title"><i class="fas fa-user"></i> Players</div>
                    ${results.players.map(player => `
                        <div class="search-result-item" data-type="player" data-id="${player.id}">
                            <div class="result-logo" style="display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                ${player.number || '#'}
                            </div>
                            <div class="result-info">
                                <div class="result-name">${player.name}</div>
                                <div class="result-meta">
                                    <span class="result-badge badge-player">${player.position}</span>
                                    <span>${player.team}</span>
                                </div>
                            </div>
                            ${player.stats ? `<div class="result-stat">${player.stats}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Games Section
        if (results.games.length > 0) {
            html += `
                <div class="search-results-section">
                    <div class="search-section-title"><i class="fas fa-basketball-ball"></i> Games</div>
                    ${results.games.map(game => `
                        <div class="search-result-item" data-type="game" data-id="${game.id}">
                            <div class="result-info">
                                <div class="result-name">${game.awayTeam} @ ${game.homeTeam}</div>
                                <div class="result-meta">
                                    <span class="result-badge ${game.isLive ? 'badge-live' : 'badge-game'}">${game.status}</span>
                                    <span>${game.time}</span>
                                </div>
                            </div>
                            ${game.score ? `<div class="result-stat">${game.score}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Keyboard hint
        html += `
            <div class="search-keyboard-hint">
                Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select, <kbd>Esc</kbd> to close
            </div>
        `;

        this.resultsDropdown.innerHTML = html;

        // Attach click handlers to results
        this.resultsDropdown.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => this.handleResultClick(item));
        });
    }

    handleResultClick(item) {
        const type = item.dataset.type;
        const id = item.dataset.id;

        console.log(`Selected ${type}:`, id);

        // Handle different result types
        switch(type) {
            case 'team':
                this.navigateToTeam(id);
                break;
            case 'player':
                this.navigateToPlayer(id);
                break;
            case 'game':
                this.navigateToGame(id);
                break;
        }

        this.clearSearch();
        this.closeDropdown();
    }

    navigateToTeam(teamId) {
        // Navigate to live scores with team filter
        if (window.appNavigation) {
            window.appNavigation.navigateTo('live-scores');
        }
        if (window.showToast) {
            window.showToast('Viewing team details...', 'info');
        }
    }

    navigateToPlayer(playerId) {
        // Find player data
        const player = this.searchIndex.players.find(p => p.id === playerId);
        
        if (player && window.playerProfileModal) {
            // Enhance player data with mock details for demonstration
            const enhancedPlayer = {
                ...player,
                height: this.getMockHeight(player.position),
                weight: this.getMockWeight(player.position),
                age: Math.floor(Math.random() * 10) + 23,
                college: this.getMockCollege(),
                draft: this.getMockDraft(),
                experience: `${Math.floor(Math.random() * 12) + 1} years`
            };
            
            window.playerProfileModal.open(enhancedPlayer);
        } else if (window.showToast) {
            window.showToast('Player profile loading...', 'info');
        }
    }

    // Mock data helpers for player profiles
    getMockHeight(position) {
        const heights = {
            'QB': '6\'3"', 'RB': '5\'11"', 'WR': '6\'1"', 'TE': '6\'5"',
            'PG': '6\'3"', 'SG': '6\'5"', 'SF': '6\'8"', 'PF': '6\'10"', 'C': '7\'0"',
            'F': '6\'8"', 'G': '6\'4"',
            'OF': '6\'2"', 'IF': '6\'0"', 'P': '6\'4"', 'C': '6\'1"',
            'LW': '6\'1"', 'RW': '6\'2"', 'D': '6\'3"', 'G': '6\'2"'
        };
        return heights[position] || '6\'2"';
    }

    getMockWeight(position) {
        const weights = {
            'QB': '230 lbs', 'RB': '215 lbs', 'WR': '210 lbs', 'TE': '250 lbs',
            'PG': '190 lbs', 'SG': '205 lbs', 'SF': '225 lbs', 'PF': '240 lbs', 'C': '260 lbs',
            'F': '225 lbs', 'G': '195 lbs',
            'OF': '215 lbs', 'IF': '200 lbs', 'P': '210 lbs', 'C': '215 lbs',
            'LW': '200 lbs', 'RW': '205 lbs', 'D': '210 lbs', 'G': '185 lbs'
        };
        return weights[position] || '205 lbs';
    }

    getMockCollege() {
        const colleges = [
            'Duke University', 'Kentucky', 'Kansas', 'North Carolina',
            'UCLA', 'Michigan', 'Ohio State', 'Alabama', 'USC',
            'Stanford', 'Arizona State', 'Florida', 'Texas'
        ];
        return colleges[Math.floor(Math.random() * colleges.length)];
    }

    getMockDraft() {
        const year = 2024 - Math.floor(Math.random() * 10);
        const round = Math.floor(Math.random() * 3) + 1;
        const pick = Math.floor(Math.random() * 30) + 1;
        return `${year} (Rd ${round}, Pick ${pick})`;
    }

    navigateToGame(gameId) {
        if (window.appNavigation) {
            window.appNavigation.navigateTo('live-scores');
        }
        if (window.showToast) {
            window.showToast('Viewing game details...', 'info');
        }
    }

    navigateResults(direction) {
        const items = this.resultsDropdown.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        // Remove current active
        items.forEach(item => item.classList.remove('active'));

        // Update index
        this.selectedIndex += direction;
        if (this.selectedIndex < 0) this.selectedIndex = items.length - 1;
        if (this.selectedIndex >= items.length) this.selectedIndex = 0;

        // Add new active
        items[this.selectedIndex].classList.add('active');
        items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
    }

    selectResult() {
        const items = this.resultsDropdown.querySelectorAll('.search-result-item');
        if (this.selectedIndex >= 0 && this.selectedIndex < items.length) {
            items[this.selectedIndex].click();
        }
    }

    clearSearch() {
        this.searchInput.value = '';
        this.clearBtn.classList.remove('visible');
        this.closeDropdown();
    }

    openDropdown() {
        this.isOpen = true;
        this.resultsDropdown.classList.add('visible');
        this.selectedIndex = -1;
    }

    closeDropdown() {
        this.isOpen = false;
        this.resultsDropdown.classList.remove('visible');
        this.selectedIndex = -1;
    }

    showLoading() {
        this.loadingIcon.classList.add('visible');
    }

    hideLoading() {
        this.loadingIcon.classList.remove('visible');
    }

    async buildSearchIndex() {
        // Build search index from available data
        try {
            // Get teams from sports data service
            if (window.sportsDataService) {
                const allGames = await window.sportsDataService.getAllUpcomingGames();
                const allLiveGames = await window.sportsDataService.getAllLiveGames();
                
                // Extract unique teams
                const teamsMap = new Map();
                [...allGames, ...allLiveGames].forEach(game => {
                    if (!teamsMap.has(game.homeTeam.name)) {
                        teamsMap.set(game.homeTeam.name, {
                            id: game.homeTeam.shortName,
                            name: game.homeTeam.name,
                            abbreviation: game.homeTeam.shortName,
                            city: game.homeTeam.name.split(' ').slice(0, -1).join(' '),
                            logo: game.homeTeam.logo,
                            sport: game.sport,
                            record: game.homeTeam.record
                        });
                    }
                    if (!teamsMap.has(game.awayTeam.name)) {
                        teamsMap.set(game.awayTeam.name, {
                            id: game.awayTeam.shortName,
                            name: game.awayTeam.name,
                            abbreviation: game.awayTeam.shortName,
                            city: game.awayTeam.name.split(' ').slice(0, -1).join(' '),
                            logo: game.awayTeam.logo,
                            sport: game.sport,
                            record: game.awayTeam.record
                        });
                    }
                });

                this.searchIndex.teams = Array.from(teamsMap.values());

                // Index live games
                this.searchIndex.games = allLiveGames.map(game => ({
                    id: game.id,
                    homeTeam: game.homeTeam.name,
                    awayTeam: game.awayTeam.name,
                    status: game.isLive ? 'LIVE' : game.statusDisplay,
                    isLive: game.isLive,
                    time: game.statusDisplay,
                    score: game.isLive ? `${game.awayTeam.score} - ${game.homeTeam.score}` : null
                }));

                console.log(`📊 Search index built: ${this.searchIndex.teams.length} teams, ${this.searchIndex.games.length} games`);
            }

            // Mock player data (in real app, would come from API)
            this.searchIndex.players = [
                { id: '1', name: 'Patrick Mahomes', team: 'Kansas City Chiefs', position: 'QB', number: '15', stats: '4,500 YDS' },
                { id: '2', name: 'LeBron James', team: 'Los Angeles Lakers', position: 'F', number: '23', stats: '25.7 PPG' },
                { id: '3', name: 'Aaron Judge', team: 'New York Yankees', position: 'OF', number: '99', stats: '.311 AVG' },
                { id: '4', name: 'Connor McDavid', team: 'Edmonton Oilers', position: 'C', number: '97', stats: '1.5 PPG' }
            ];

        } catch (error) {
            console.error('Error building search index:', error);
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.globalSearch = new GlobalSearchManager();
});

// Reinitialize if DOM changes (for SPA navigation)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.globalSearch) {
            window.globalSearch = new GlobalSearchManager();
        }
    });
} else {
    if (!window.globalSearch) {
        window.globalSearch = new GlobalSearchManager();
    }
}
