/**
 * ============================================================================
 * ULTIMATE FOOTBALL SIM - PRODUCTION v49.0 🏆
 * ============================================================================
 * 
 * A complete NFL card collection and simulation game with:
 * - Pack opening system with 4 tiers (Bronze → Diamond)
 * - Player progression (Level 1-20+, Evolution & Ascension)
 * - Team building with chemistry bonuses
 * - AI opponent challenges with unlockable tiers
 * - Season mode with playoffs and Super Bowl
 * - Player trading with AI evaluation
 * - Comparison tools and roster management
 * 
 * ARCHITECTURE:
 * -------------
 * - Uses MinigameSync for unified coin management
 * - Integrates with Global State Manager for cross-app sync
 * - Local Store for game-specific data (teams, rosters, seasons)
 * - PlayerProgressionManager for card collection & leveling
 * - AIOpponentSystem for challenge ladder progression
 * 
 * UNIFIED SYSTEMS:
 * ----------------
 * - Balance: MinigameSync.getBalance() / recordWin() / deductCoins()
 * - Transactions: Automatic queue with offline support via TransactionQueueManager
 * - Achievements: window.achievementsSystem.addStat() for global progress tracking
 * 
 * STATE FLOW:
 * -----------
 * 1. User opens pack → MinigameSync.deductCoins()
 * 2. Cards unlocked → PlayerProgressionManager.unlockPlayer()
 * 3. Cards saved → Local store.state.playerCollection
 * 4. Balance updated → MinigameSync syncs to parent & backend
 * 5. UI refreshed → App.updateHeader() pulls from MinigameSync
 * 
 * ============================================================================
 */

// ============================================
// CONFIGURATION & ASSETS
// ============================================

const ASSETS = {
    legends: {
        // QUARTERBACKS
        brady: {
            id: 'brady',
            name: 'Tom Brady',
            type: 'QB',
            teams: ['Patriots', 'Buccaneers'],
            desc: 'The GOAT - 7x Champion',
            price: 8000,
            icon: '🏆',
            rarity: 'Legendary',
            bonus: { type: 'clutch', value: 1.5 }
        },
        montana: {
            id: 'montana',
            name: 'Joe Montana',
            type: 'QB',
            teams: ['49ers', 'Chiefs'],
            desc: 'Joe Cool - 4x Champion',
            price: 7500,
            icon: '❄️',
            rarity: 'Legendary',
            bonus: { type: 'accuracy', value: 1.4 }
        },
        manning: {
            id: 'manning',
            name: 'Peyton Manning',
            type: 'QB',
            teams: ['Colts', 'Broncos'],
            desc: 'The Sheriff - 5x MVP',
            price: 7000,
            icon: '🎯',
            rarity: 'Epic',
            bonus: { type: 'passing', value: 1.45 }
        },
        burrow: {
            id: 'burrow',
            name: 'Joe Burrow',
            type: 'QB',
            teams: ['Bengals'],
            desc: 'Precision Passer',
            price: 2500,
            icon: '🐅',
            rarity: 'Rare',
            bonus: { type: 'passing', value: 1.25 }
        },
        mahomes: {
            id: 'mahomes',
            name: 'Patrick Mahomes',
            type: 'QB',
            teams: ['Chiefs'],
            desc: 'Showtime - 3x Champion',
            price: 6500,
            icon: '⚡',
            rarity: 'Legendary',
            bonus: { type: 'passing', value: 1.48 }
        },
        
        // RUNNING BACKS
        sanders: {
            id: 'sanders',
            name: 'Barry Sanders',
            type: 'RB',
            teams: ['Lions'],
            desc: 'Most Elusive Ever',
            price: 7500,
            icon: '💨',
            rarity: 'Legendary',
            bonus: { type: 'rushing', value: 1.5 }
        },
        brown: {
            id: 'brown',
            name: 'Jim Brown',
            type: 'RB',
            teams: ['Browns'],
            desc: 'Legendary Power',
            price: 7000,
            icon: '💪',
            rarity: 'Epic',
            bonus: { type: 'power', value: 1.45 }
        },
        tomlinson: {
            id: 'tomlinson',
            name: 'LaDainian Tomlinson',
            type: 'RB',
            teams: ['Chargers'],
            desc: 'LT - Complete Back',
            price: 6000,
            icon: '⚡',
            rarity: 'Epic',
            bonus: { type: 'versatile', value: 1.35 }
        },
        
        // WIDE RECEIVERS
        rice: {
            id: 'rice',
            name: 'Jerry Rice',
            type: 'WR',
            teams: ['49ers', 'Raiders'],
            desc: 'Greatest Receiver Ever',
            price: 8500,
            icon: '🔥',
            rarity: 'Legendary',
            bonus: { type: 'receiving', value: 1.55 }
        },
        moss: {
            id: 'moss',
            name: 'Randy Moss',
            type: 'WR',
            teams: ['Vikings', 'Patriots'],
            desc: 'Deep Threat Master',
            price: 7000,
            icon: '🚀',
            rarity: 'Legendary',
            bonus: { type: 'deepPass', value: 1.4 }
        },
        owens: {
            id: 'owens',
            name: 'Terrell Owens',
            type: 'WR',
            teams: ['49ers', 'Eagles', 'Cowboys'],
            desc: 'TO - Playmaker',
            price: 6000,
            icon: '💥',
            rarity: 'Epic',
            bonus: { type: 'receiving', value: 1.35 }
        },
        
        // TIGHT ENDS
        gronk: {
            id: 'gronk',
            name: 'Rob Gronkowski',
            type: 'TE',
            teams: ['Patriots', 'Buccaneers'],
            desc: 'Gronk Spike Master',
            price: 6500,
            icon: '🦾',
            rarity: 'Epic',
            bonus: { type: 'redzone', value: 1.45 }
        },
        gonzalez: {
            id: 'gonzalez',
            name: 'Tony Gonzalez',
            type: 'TE',
            teams: ['Chiefs', 'Falcons'],
            desc: 'All-Time Great TE',
            price: 6000,
            icon: '🎯',
            rarity: 'Epic',
            bonus: { type: 'receiving', value: 1.38 }
        },
        
        // DEFENSIVE
        lewis: {
            id: 'lewis',
            name: 'Ray Lewis',
            type: 'LB',
            teams: ['Ravens'],
            desc: 'Legendary Leader',
            price: 7500,
            icon: '⚔️',
            rarity: 'Legendary',
            bonus: { type: 'defense', value: 1.5 }
        },
        taylor: {
            id: 'taylor',
            name: 'Lawrence Taylor',
            type: 'LB',
            teams: ['Giants'],
            desc: 'LT - Game Changer',
            price: 8000,
            icon: '💀',
            rarity: 'Legendary',
            bonus: { type: 'pass_rush', value: 1.55 }
        },
        sanders_deion: {
            id: 'sanders_deion',
            name: 'Deion Sanders',
            type: 'CB',
            teams: ['Cowboys', 'Falcons', '49ers'],
            desc: 'Prime Time Shutdown',
            price: 7000,
            icon: '🎩',
            rarity: 'Epic',
            bonus: { type: 'coverage', value: 1.48 }
        },
        reed: {
            id: 'reed',
            name: 'Ed Reed',
            type: 'S',
            teams: ['Ravens'],
            desc: 'Ball Hawk Supreme',
            price: 6500,
            icon: '🦅',
            rarity: 'Epic',
            bonus: { type: 'interceptions', value: 1.45 }
        },
        
        // COACHES
        madden: {
            id: 'madden',
            name: 'John Madden',
            type: 'COACH',
            teams: ['Raiders'],
            desc: 'Legendary Insight',
            price: 10000,
            icon: '🎙️',
            rarity: 'Legendary',
            bonus: { type: 'all', value: 1.2 }
        },
        lombardi: {
            id: 'lombardi',
            name: 'Vince Lombardi',
            type: 'COACH',
            teams: ['Packers'],
            desc: 'Championship DNA',
            price: 12000,
            icon: '🏆',
            rarity: 'Legendary',
            bonus: { type: 'all', value: 1.25 }
        },
        shanahan: {
            id: 'shanahan',
            name: 'Kyle Shanahan',
            type: 'COACH',
            teams: ['49ers'],
            desc: 'Offensive Genius',
            price: 6500,
            icon: '🧠',
            rarity: 'Epic',
            bonus: { type: 'offense', value: 1.35 }
        },
        parcells: {
            id: 'parcells',
            name: 'Bill Parcells',
            type: 'COACH',
            teams: ['Giants', 'Patriots'],
            desc: 'Big Game Coach',
            price: 8500,
            icon: '⚔️',
            rarity: 'Legendary',
            bonus: { type: 'defense', value: 1.3 }
        },
        dungy: {
            id: 'dungy',
            name: 'Tony Dungy',
            type: 'COACH',
            teams: ['Colts', 'Buccaneers'],
            desc: 'Defensive Mastermind',
            price: 7000,
            icon: '🛡️',
            rarity: 'Epic',
            bonus: { type: 'defense', value: 1.32 }
        },
        tomlin: {
            id: 'tomlin',
            name: 'Mike Tomlin',
            type: 'COACH',
            teams: ['Steelers'],
            desc: 'Consistent Winner',
            price: 5500,
            icon: '💪',
            rarity: 'Epic',
            bonus: { type: 'all', value: 1.18 }
        },
        carroll: {
            id: 'carroll',
            name: 'Pete Carroll',
            type: 'COACH',
            teams: ['Seahawks'],
            desc: 'Legion of Boom',
            price: 6000,
            icon: '🦅',
            rarity: 'Epic',
            bonus: { type: 'defense', value: 1.28 }
        },
        payton: {
            id: 'payton',
            name: 'Sean Payton',
            type: 'COACH',
            teams: ['Saints', 'Broncos'],
            desc: 'Offensive Innovator',
            price: 6800,
            icon: '🎯',
            rarity: 'Epic',
            bonus: { type: 'offense', value: 1.33 }
        },
        harbaugh: {
            id: 'harbaugh',
            name: 'John Harbaugh',
            type: 'COACH',
            teams: ['Ravens'],
            desc: 'Balanced Leader',
            price: 5800,
            icon: '🦅',
            rarity: 'Rare',
            bonus: { type: 'all', value: 1.2 }
        },
        // 2024 BREAKOUT STARS
        stroud: {
            id: 'stroud',
            name: 'C.J. Stroud',
            type: 'QB',
            teams: ['Texans'],
            desc: '2023 Rookie Sensation',
            price: 4500,
            icon: '🚀',
            rarity: 'Epic',
            bonus: { type: 'passing', value: 1.35 }
        },
        puka: {
            id: 'puka',
            name: 'Puka Nacua',
            type: 'WR',
            teams: ['Rams'],
            desc: 'Record-Breaking Rookie',
            price: 4000,
            icon: '🐑',
            rarity: 'Epic',
            bonus: { type: 'receiving', value: 1.32 }
        },
        gibbs: {
            id: 'gibbs',
            name: 'Jahmyr Gibbs',
            type: 'RB',
            teams: ['Lions'],
            desc: 'Dual-Threat Dynamite',
            price: 3800,
            icon: '🦁',
            rarity: 'Epic',
            bonus: { type: 'versatile', value: 1.3 }
        },
        sauce: {
            id: 'sauce',
            name: 'Sauce Gardner',
            type: 'CB',
            teams: ['Jets'],
            desc: 'Shutdown Cornerback',
            price: 5500,
            icon: '🥫',
            rarity: 'Legendary',
            bonus: { type: 'coverage', value: 1.5 }
        }
    },
    logos: [
        { 
            id: 'logo1', 
            name: 'Commanders', 
            url: 'https://rosebud.ai/assets/Logo 1.webp?hVRg',
            colors: { primary: '#773141', secondary: '#ffb612', accent: '#ffffff' }
        },
        { 
            id: 'logo2', 
            name: 'Steelers', 
            url: 'https://rosebud.ai/assets/Logo 2.webp?r3mO',
            colors: { primary: '#ffb612', secondary: '#101820', accent: '#ffffff' }
        },
        { 
            id: 'logo3', 
            name: 'Titans', 
            url: 'https://rosebud.ai/assets/Logo 3.webp?fsM0',
            colors: { primary: '#0c2340', secondary: '#4b92db', accent: '#c8102e' }
        },
        { 
            id: 'logo4', 
            name: 'Thunder', 
            url: 'https://rosebud.ai/assets/Logo 4.webp?gEVd',
            colors: { primary: '#0ea5e9', secondary: '#0284c7', accent: '#fbbf24' }
        },
        { 
            id: 'logo5', 
            name: 'Phoenix', 
            url: 'https://rosebud.ai/assets/Logo 5.webp?epcB',
            colors: { primary: '#dc2626', secondary: '#b91c1c', accent: '#f59e0b' }
        },
        { 
            id: 'logo6', 
            name: 'Steel', 
            url: 'https://rosebud.ai/assets/Logo 6.webp?bJJ1',
            colors: { primary: '#64748b', secondary: '#475569', accent: '#94a3b8' }
        },
        { 
            id: 'logo7', 
            name: 'Venom', 
            url: 'https://rosebud.ai/assets/Logo 7.webp?FIHH',
            colors: { primary: '#84cc16', secondary: '#65a30d', accent: '#a3e635' }
        },
        { 
            id: 'logo8', 
            name: 'Blaze', 
            url: 'https://rosebud.ai/assets/Logo 8.webp?yXXp',
            colors: { primary: '#f97316', secondary: '#ea580c', accent: '#fb923c' }
        },
        { 
            id: 'logo9', 
            name: 'Predators', 
            url: 'https://rosebud.ai/assets/Logo 9.webp?S5Rh',
            colors: { primary: '#f97316', secondary: '#c2410c', accent: '#fb923c' }
        },
        { 
            id: 'logo10', 
            name: 'Elite', 
            url: 'https://rosebud.ai/assets/Logo 10.webp?QLXx',
            colors: { primary: '#7c3aed', secondary: '#6d28d9', accent: '#fbbf24' }
        },
        { 
            id: 'logo11', 
            name: 'Storm', 
            url: 'https://rosebud.ai/assets/Logo 11.webp?ZVP8',
            colors: { primary: '#1e40af', secondary: '#1e3a8a', accent: '#60a5fa' }
        }
    ],
    packs: {
        starter: 'https://rosebud.ai/assets/Ultimate football sim pack(silver).png?s6ha',
        pro: 'https://rosebud.ai/assets/ultimate-football-sim-pack-gold.png.webp?pgsd',
        elite: 'https://rosebud.ai/assets/ultimate-football-sim-pack-elite.png.webp?ZNl7',
        legend: 'https://rosebud.ai/assets/ultimate-football-sim-pack-legend.png.webp?oFdd',
        revealBg: 'https://rosebud.ai/assets/Pack open image display.png?zFQN'
    },
    items: {
        ascensionStone: {
            id: 'ascension_stone',
            name: 'Ascension Stone',
            desc: 'Unlocks Level 20+ progression for any player. Permanent +10 OVR boost!',
            price: 50000,
            url: 'https://rosebud.ai/assets/Ultimate sports championship diamond ring.png?1Esq'
        }
    }
};

const DEFAULT_TEAMS = [
    { id: 1, name: 'Commanders', offense: 88, defense: 82, color: '#773141', logo: ASSETS.logos[0] },
    { id: 2, name: 'Steelers', offense: 85, defense: 80, color: '#ffb612', logo: ASSETS.logos[1] },
    { id: 3, name: 'Titans', offense: 87, defense: 84, color: '#0c2340', logo: ASSETS.logos[2] },
    { id: 4, name: 'Thunder', offense: 82, defense: 85, color: '#0ea5e9', logo: ASSETS.logos[3] },
];

// ============================================
// MINIGAME SYNC INITIALIZATION
// ============================================
let gameSync = null;
try {
    if (typeof MinigameSync !== 'undefined') {
        gameSync = MinigameSync.init('Football Sim');
        console.log('✅ MinigameSync initialized for Football Sim');
    }
} catch (e) {
    console.error('❌ MinigameSync initialization failed:', e);
}

// ============================================
// STATE STORE - Unified with Global State
// ============================================

class Store {
    constructor() {
        this.state = this.loadState();
        this.listeners = [];
    }

    loadState() {
        const saved = localStorage.getItem('ultimateSimState');
        let state = saved ? JSON.parse(saved) : this.getDefaultState();
        
        // Migrate old data
        if (!state.marketTrades) state.marketTrades = [];
        if (!state.userListings) state.userListings = [];
        if (!state.leagueSeason) state.leagueSeason = this.getDefaultSeason();
        if (state.userTeam && !state.userTeam.customLogos) state.userTeam.customLogos = [];
        
        return state;
    }

    getDefaultState() {
        return {
            xp: 0,
            level: 1,
            wins: 0,
            losses: 0,
            userTeam: {
                name: 'My Ultimate Team',
                logo: ASSETS.logos[0],
                primaryColor: '#ffd700',
                secondaryColor: '#000000',
                roster: [],
                stats: { offense: 75, defense: 75 },
                customLogos: []
            },
            inventory: [],
            matchHistory: [],
            leagueSeason: this.getDefaultSeason(),
            marketTrades: [],
            userListings: []
        };
    }

    getDefaultSeason() {
        return {
            active: false,
            week: 1,
            wins: 0,
            losses: 0,
            schedule: [],
            standings: []
        };
    }

    save() {
        localStorage.setItem('ultimateSimState', JSON.stringify(this.state));
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    updateTeam(updates) {
        this.state.userTeam = { ...this.state.userTeam, ...updates };
        this.save();
    }

    buyItem(itemId) {
        if (this.state.inventory.includes(itemId)) return false;
        
        // Find item price
        let price = 0;
        let itemName = 'Unknown Item';
        for (let key in ASSETS.legends) {
            if (ASSETS.legends[key].id === itemId) {
                price = ASSETS.legends[key].price;
                itemName = ASSETS.legends[key].name;
            }
        }

        // Use MinigameSync for purchase
        if (MinigameSync.deductCoins(price, `Purchased ${itemName}`, { type: 'shop_purchase', itemId, itemName })) {
            this.state.inventory.push(itemId);
            this.state.userTeam.roster.push(itemId);
            this.recalcStats();
            this.save();
            return true;
        }
        return false;
    }

    recalcStats() {
        // Base stats
        let offense = 70;
        let defense = 70;
        
        // Count legends by team for chemistry
        const teamCounts = {};
        const ownedLegends = this.state.userTeam.roster.map(id => ASSETS.legends[id]).filter(l => !!l);
        
        // Apply base legend bonuses
        ownedLegends.forEach(legend => {
            if (legend.bonus.type === 'offense' || legend.bonus.type === 'all' || legend.bonus.type === 'passing' || legend.bonus.type === 'rushing' || legend.bonus.type === 'receiving') {
                offense += (legend.bonus.value - 1) * 20; // Convert multiplier to flat addition for base calc
            }
            if (legend.bonus.type === 'defense' || legend.bonus.type === 'all' || legend.bonus.type === 'coverage' || legend.bonus.type === 'pass_rush') {
                defense += (legend.bonus.value - 1) * 20;
            }
            
            // Track teams for chemistry
            if (legend.teams) {
                legend.teams.forEach(team => {
                    teamCounts[team] = (teamCounts[team] || 0) + 1;
                });
            }
        });
        
        // Calculate chemistry bonuses
        // Thresholds: 2 players = +2, 3 players = +5, 4+ players = +8
        this.state.userTeam.chemistry = [];
        Object.entries(teamCounts).forEach(([team, count]) => {
            if (count >= 2) {
                let bonus = 0;
                if (count >= 4) bonus = 8;
                else if (count >= 3) bonus = 5;
                else bonus = 2;
                
                offense += bonus;
                defense += bonus;
                
                this.state.userTeam.chemistry.push({ team, count, bonus });
            }
        });

        this.state.userTeam.stats.offense = Math.min(99, Math.round(offense));
        this.state.userTeam.stats.defense = Math.min(99, Math.round(defense));
    }

    recordMatch(result) {
        this.state.matchHistory.unshift(result);
        if (this.state.matchHistory.length > 20) this.state.matchHistory.pop();
        
        if (result.won) {
            this.state.wins++;
            this.state.xp += 100;
            
            // Update Achievement Stats (Games Won)
            this.updateAchievementStat('totalBetsWon', 1);
        } else {
            this.state.losses++;
            this.state.xp += 25;
        }

        // Level up logic
        const nextLevel = Math.floor(this.state.xp / 1000) + 1;
        if (nextLevel > this.state.level) {
            this.state.level = nextLevel;
            // Level up bonus?
        }
        
        this.save();
    }

    // Helper to update global achievement stats
    updateAchievementStat(stat, value) {
        try {
            if (window.parent && window.parent.achievementsSystem && typeof window.parent.achievementsSystem.addStat === 'function') {
                window.parent.achievementsSystem.addStat(stat, value);
            } else if (window.achievementsSystem && typeof window.achievementsSystem.addStat === 'function') {
                window.achievementsSystem.addStat(stat, value);
            }
        } catch (e) {
            console.warn('Could not update achievements:', e);
        }
    }
}

// ============================================
// GAME ENGINE (SIMULATION)
// ============================================

const WEATHER_TYPES = {
    clear: { name: 'Clear', icon: '☀️', modifiers: { fumble: 1, pass: 1, fg: 1, run: 1 } },
    rain: { name: 'Rain', icon: '🌧️', modifiers: { fumble: 1.5, pass: 0.9, fg: 0.85, run: 1 } },
    snow: { name: 'Snow', icon: '❄️', modifiers: { fumble: 2.5, pass: 0.75, fg: 0.6, run: 0.8 } }
};

class GameEngine {
    constructor(userTeam, opponentTeam, config) {
        this.home = userTeam;
        this.away = opponentTeam;
        this.config = config; // wager, difficulty
        
        // Random weather selection
        const weatherKeys = Object.keys(WEATHER_TYPES);
        const selectedWeather = WEATHER_TYPES[weatherKeys[Math.floor(Math.random() * weatherKeys.length)]];

        this.state = {
            quarter: 1,
            time: 15 * 60, // seconds
            homeScore: 0,
            awayScore: 0,
            possession: 'home',
            down: 1,
            yardsToGo: 10,
            ballOn: 20, // 1-99. >50 is opponent territory
            lastPlay: null,
            drive: [],
            isFinished: false,
            weather: selectedWeather,
            offenseFatigue: 0,
            defenseFatigue: 0
        };

        this.formationBonus = 'balanced';
        this.defensiveFocus = 'balanced';
        this.aiDefensiveFocus = 'balanced';
    }

    chooseAIDefense() {
        const s = this.state;
        const r = Math.random();
        
        // Logical AI defense
        if (s.down === 3 && s.yardsToGo > 7) return 'pass';
        if (s.down === 1) return r > 0.5 ? 'run' : 'balanced';
        
        const options = ['run', 'pass', 'balanced'];
        return options[Math.floor(r * options.length)];
    }

    chooseAIPlay() {
        const s = this.state;
        const down = s.down;
        const toGo = s.yardsToGo;
        const ballOn = s.ballOn;
        const scoreDiff = s.awayScore - s.homeScore;
        const isTrailing = scoreDiff < 0;
        const isLateGame = s.quarter === 4;

        // 4th Down Logic (Special Teams)
        if (down === 4) {
            if (ballOn > 65) return { type: 'fg' }; // Field goal range
            if (ballOn < 45) return { type: 'punt' }; // Deep in own territory
            // In between? Go for it if trailing late, otherwise punt
            if (isLateGame && isTrailing && toGo < 5) return { type: 'run' };
            return { type: 'punt' };
        }

        // Logic based on down and distance
        if (down === 3) {
            if (toGo > 6) return { type: 'long' };
            if (toGo > 3) return { type: 'pass' };
            return { type: 'run' }; // Short yardage
        }

        // 1st Down - Balanced
        if (down === 1) {
            return Math.random() > 0.6 ? { type: 'run' } : { type: 'pass' };
        }

        // Late game desperation
        if (isLateGame && isTrailing && scoreDiff < -7) {
            return Math.random() > 0.3 ? { type: 'long' } : { type: 'pass' };
        }

        // Random fallback
        const r = Math.random();
        if (r > 0.7) return { type: 'long' };
        if (r > 0.4) return { type: 'pass' };
        if (r > 0.2) return { type: 'run' };
        return { type: 'screen' };
    }

    // Advanced simulation logic with "X's and O's" play generation
    simulatePlay(playCall) {
        if (this.state.isFinished) return null;

        // If it's opponent's turn and no playcall provided, choose one
        if (this.state.possession === 'away' && !playCall) {
            playCall = this.chooseAIPlay();
            // AI also chooses its defense against user's future play
            this.aiDefensiveFocus = this.chooseAIDefense();
        } else if (!playCall) {
            playCall = { type: 'run' };
        }

        const offense = this.state.possession === 'home' ? this.home : this.away;
        const defense = this.state.possession === 'home' ? this.away : this.home;
        
        // --- Fatigue Tracking ---
        this.state.offenseFatigue = Math.min(100, this.state.offenseFatigue + (5 + Math.random() * 5));
        this.state.defenseFatigue = Math.min(100, this.state.defenseFatigue + (4 + Math.random() * 4));

        // Defensive focus logic
        const currentDefense = this.state.possession === 'home' ? this.aiDefensiveFocus : this.defensiveFocus;
        
        // Get active players for commentary
        const roster = offense.roster || (offense.stats ? store.state.playerCollection.activeRoster : {});
        const getPlayerName = (pos) => {
            const id = roster[pos];
            if (!id) return pos;
            const p = playerManager.getPlayer(id);
            return p ? p.name : pos;
        };

        const qbName = getPlayerName('QB');
        const rbName = getPlayerName('RB');
        const wrName = Math.random() > 0.5 ? getPlayerName('WR1') : getPlayerName('WR2');
        const teName = getPlayerName('TE');

        // Calculate success probability based on stats
        const offRating = offense.stats ? offense.stats.offense : (offense.offense || 80);
        const defRating = defense.stats ? defense.stats.defense : (defense.defense || 80);
        
        let advantage = (offRating - defRating) / 100; // -0.2 to 0.2 typically
        
        // --- Weather Modifiers ---
        const weatherMod = this.state.weather.modifiers;
        if (playCall.type === 'pass' || playCall.type === 'long') {
            advantage *= weatherMod.pass;
        } else if (playCall.type === 'run') {
            advantage *= weatherMod.run;
        }

        // --- Fatigue Penalties ---
        if (this.state.offenseFatigue > 50) {
            advantage -= (this.state.offenseFatigue - 50) / 500; // Up to -0.1 penalty
        }
        if (this.state.defenseFatigue > 50) {
            advantage += (this.state.defenseFatigue - 50) / 500; // Defense fatigue helps offense
        }

        // --- Formation Bonuses ---
        if (this.formationBonus === 'offensive') {
            advantage += 0.08; 
        } else if (this.formationBonus === 'defensive') {
            advantage += 0.03;
        }

        // --- Defensive Counter Logic ---
        let isCountered = false;
        if (currentDefense === 'run' && playCall.type === 'run') isCountered = true;
        if (currentDefense === 'pass' && (playCall.type === 'pass' || playCall.type === 'long')) isCountered = true;
        
        if (isCountered) {
            advantage -= 0.25; // Massive penalty for being predictable
        }
        
        // --- Offensive Position Bonuses ---
        if (playCall.type === 'pass' || playCall.type === 'long' || playCall.type === 'screen') {
            if (roster.QB === 'brady' || roster.QB === 'montana') advantage += 0.12;
            if (roster.QB === 'mahomes' || roster.QB === 'manning') advantage += 0.15;
            if (roster.TE === 'gronk' || roster.TE === 'gonzalez') advantage += 0.08;
            if (playCall.type === 'long' && (roster.WR1 === 'moss' || roster.WR2 === 'moss' || roster.WR1 === 'rice')) advantage += 0.15;
            if (playCall.type === 'screen' && roster.RB) advantage += 0.1; 
        }
        
        if (playCall.type === 'run') {
            if (roster.RB === 'sanders' || roster.RB === 'brown' || roster.RB === 'tomlinson') advantage += 0.15;
        }

        // --- Defensive Position Bonuses ---
        const opponentRoster = defense.roster || {};
        if (opponentRoster.LB === 'lewis' || opponentRoster.LB === 'taylor') advantage -= 0.1;
        if (opponentRoster.CB === 'sanders_deion' || opponentRoster.S === 'reed') advantage -= 0.1;
        
        let yardage = 0;
        let type = playCall.type;
        let result = 'gain'; 
        let description = "";
        
        const roll = Math.random() + advantage;

        // --- SPECIAL TEAMS HANDLING ---
        if (playCall.type === 'punt') {
            yardage = 35 + Math.random() * 20;
            description = `${offense.name} punts the ball away! A ${Math.floor(yardage)} yard kick.`;
            this.state.possession = this.state.possession === 'home' ? 'away' : 'home';
            this.state.ballOn = Math.min(99, 100 - (this.state.ballOn + yardage));
            this.state.down = 1;
            this.state.yardsToGo = 10;
            result = 'punt';
            // Possession change reduces fatigue
            this.state.offenseFatigue *= 0.5;
            this.state.defenseFatigue *= 0.5;
        } else if (playCall.type === 'fg') {
            const distance = 100 - this.state.ballOn + 17; // 17 yards for endzone + snap
            // Weather significantly affects FG accuracy
            const successProb = Math.max(0.1, (1 - (distance - 20) / 50) * weatherMod.fg);
            if (Math.random() < successProb) {
                if (this.state.possession === 'home') this.state.homeScore += 3;
                else this.state.awayScore += 3;
                description = `FIELD GOAL IS GOOD! A ${distance} yard kick by ${offense.name}!`;
                result = 'fg_good';
            } else {
                description = `THE KICK IS NO GOOD! ${offense.name} misses the ${distance} yard field goal.`;
                result = 'fg_miss';
            }
            this.state.possession = this.state.possession === 'home' ? 'away' : 'home';
            this.state.ballOn = 20;
            this.state.down = 1;
            this.state.yardsToGo = 10;
            // Possession change reduces fatigue
            this.state.offenseFatigue = 0;
            this.state.defenseFatigue *= 0.5;
        } else {
            // --- REGULAR PLAY HANDLING ---
            // Weather affects fumbles
            const fumbleThreshold = 0.03 * weatherMod.fumble;

            if (playCall.type === 'run') {
                if (roll > 0.95) { yardage = 40 + Math.random() * 40; result = 'big_gain'; }
                else if (roll > 0.6) { yardage = 4 + Math.random() * 8; }
                else if (roll > 0.4) { yardage = 1 + Math.random() * 3; }
                else if (roll > 0.1) { yardage = -2 + Math.random() * 3; }
                else if (Math.random() < fumbleThreshold) { yardage = 0; result = 'fumble'; }
                else { yardage = 0; result = 'loss'; }
            } else if (playCall.type === 'screen') {
                if (roll > 0.88) { yardage = 15 + Math.random() * 25; result = 'big_gain'; }
                else if (roll > 0.5) { yardage = 5 + Math.random() * 12; }
                else if (roll > 0.25) { yardage = 1 + Math.random() * 4; }
                else if (roll > 0.15) { yardage = -3; result = 'loss'; }
                else { yardage = 0; result = 'incomplete'; }
            } else {
                if (roll > 0.92) { yardage = 30 + Math.random() * 50; result = 'big_gain'; }
                else if (roll > 0.55) { yardage = 5 + Math.random() * 15; }
                else if (roll > 0.3) { yardage = 0; result = 'incomplete'; }
                else if (roll > 0.1) { yardage = -5; result = 'sack'; }
                else { yardage = 0; result = 'interception'; }
            }

            yardage = Math.floor(yardage);
            
            // Commentary
            if (playCall.type === 'run') {
                const phrases = [`${rbName} finds a gap!`, `${rbName} charges ahead!`, `${rbName} stiff-arms a defender!`];
                description = (isCountered ? "BLITZED! " : "") + phrases[Math.floor(Math.random() * phrases.length)];
            } else if (playCall.type === 'screen') {
                description = `${qbName} throws the screen to ${rbName}!`;
            } else {
                const phrases = [`${qbName} scans the field...`, `${qbName} fires a bullet!`, `${qbName} looks for ${wrName} deep!`];
                description = (isCountered ? "COVERED! " : "") + phrases[Math.floor(Math.random() * phrases.length)];
            }

            if (result === 'interception' || result === 'fumble') {
                this.state.possession = this.state.possession === 'home' ? 'away' : 'home';
                this.state.ballOn = 100 - this.state.ballOn;
                this.state.down = 1;
                this.state.yardsToGo = 10;
                description = `TURNOVER! ${result.toUpperCase()}! ${defense.name} takes over!`;
                // Turnovers reset fatigue slightly
                this.state.offenseFatigue *= 0.5;
                this.state.defenseFatigue *= 0.5;
            } else if (result === 'incomplete') {
                this.state.down++;
                description += ` Incomplete.`;
            } else if (result === 'sack') {
                this.state.down++;
                this.state.ballOn += yardage; 
                description = `SACKED! ${qbName} goes down for a ${Math.abs(yardage)} yard loss!`;
            } else {
                this.state.ballOn += yardage;
                this.state.yardsToGo -= yardage;
                
                if (this.state.ballOn >= 100) {
                    if (this.state.possession === 'home') this.state.homeScore += 7;
                    else this.state.awayScore += 7;
                    description = `TOUCHDOWN!!! ${qbName} finds ${playCall.type === 'run' ? rbName : wrName} in the endzone!`;
                    this.state.possession = this.state.possession === 'home' ? 'away' : 'home';
                    this.state.ballOn = 20;
                    this.state.down = 1;
                    this.state.yardsToGo = 10;
                    // Touchdown resets fatigue
                    this.state.offenseFatigue = 0;
                    this.state.defenseFatigue = 0;
                } else if (this.state.yardsToGo <= 0) {
                    this.state.down = 1;
                    this.state.yardsToGo = 10;
                    description += ` Gain of ${yardage} - 1ST DOWN!`;
                } else {
                    this.state.down++;
                    description += ` Gain of ${yardage} yards.`;
                }
            }

            if (this.state.down > 4) {
                this.state.possession = this.state.possession === 'home' ? 'away' : 'home';
                this.state.ballOn = 100 - this.state.ballOn;
                this.state.down = 1;
                this.state.yardsToGo = 10;
                description = `STUFFED! Turnover on downs. ${defense.name} ball!`;
                this.state.offenseFatigue *= 0.5;
                this.state.defenseFatigue *= 0.5;
            }
        }

        const visualData = this.generateVisualData(type, yardage, result);
        this.state.lastPlay = { description, yardage, type, visualData };
        this.state.drive.push(description);
        if (this.state.drive.length > 5) this.state.drive.shift();

        if (Math.random() < 0.2) this.state.quarter = Math.min(4, this.state.quarter + 1);
        if (this.state.quarter === 4 && Math.random() < 0.1) this.state.isFinished = true;

        return this.state;
    }


    generateVisualData(type, yards, result) {
        // Simple path generation for canvas
        // Start point is always center bottom for offense
        const path = [{x: 50, y: 80}];
        
        if (type === 'run') {
            // Zig zag run
            path.push({x: 50 + (Math.random()*20-10), y: 60});
            path.push({x: 50 + (Math.random()*40-20), y: 40});
            path.push({x: 50 + (Math.random()*10-5), y: 80 - (yards * 2)}); // Rough scale
        } else {
            // Arc for pass
            path.push({x: 30, y: 90}); // QB dropback
            path.push({x: 50 + (Math.random()*60-30), y: 80 - (yards * 2)}); // Catch point
        }

        return {
            path,
            color: result === 'interception' || result === 'fumble' ? '#ef4444' : '#fbbf24'
        };
    }
}

class SeasonLeagueManager {
    constructor(store) {
        this.store = store;
        this.teams = [
            { id: 101, name: 'Commanders', offense: 82, defense: 80, logo: ASSETS.logos[0] },
            { id: 102, name: 'Steelers', offense: 80, defense: 84, logo: ASSETS.logos[1] },
            { id: 103, name: 'Titans', offense: 78, defense: 78, logo: ASSETS.logos[2] },
            { id: 104, name: 'Thunder', offense: 85, defense: 82, logo: ASSETS.logos[3] },
            { id: 105, name: 'Phoenix', offense: 88, defense: 75, logo: ASSETS.logos[4] },
            { id: 106, name: 'Steel', offense: 75, defense: 88, logo: ASSETS.logos[5] },
            { id: 107, name: 'Venom', offense: 82, defense: 82, logo: ASSETS.logos[6] },
            { id: 108, name: 'Blaze', offense: 90, defense: 80, logo: ASSETS.logos[7] },
            { id: 109, name: 'Predators', offense: 84, defense: 84, logo: ASSETS.logos[8] },
            { id: 110, name: 'Elite', offense: 92, defense: 88, logo: ASSETS.logos[9] },
            { id: 111, name: 'Storm', offense: 86, defense: 86, logo: ASSETS.logos[10] },
            { id: 112, name: 'Bulls', offense: 80, defense: 80, logo: ASSETS.logos[0] },
        ];
    }

    startSeason() {
        const schedule = [];
        const standings = this.teams.map(t => ({ id: t.id, name: t.name, wins: 0, losses: 0, logo: t.logo }));
        
        // Add User Team to standings
        standings.push({ id: 'user', name: this.store.state.userTeam.name, wins: 0, losses: 0, logo: this.store.state.userTeam.logo });

        // Generate 17 weeks of matchups for the user
        for (let i = 1; i <= 17; i++) {
            const opponent = this.teams[Math.floor(Math.random() * this.teams.length)];
            schedule.push({ week: i, opponentId: opponent.id, played: false, result: null });
        }

        this.store.state.leagueSeason = {
            active: true,
            week: 1,
            wins: 0,
            losses: 0,
            schedule,
            standings
        };
        this.store.save();
    }

    advanceWeek(won, score) {
        const season = this.store.state.leagueSeason;
        if (!season.active) return;

        // If in playoffs, handle differently
        if (season.playoffs && season.playoffs.active) {
            this.advancePlayoffWeek(won, score);
            return;
        }

        // Record User Result
        const currentMatch = season.schedule.find(m => m.week === season.week);
        if (currentMatch) {
            currentMatch.played = true;
            currentMatch.result = { won, score };
        }

        if (won) season.wins++;
        else season.losses++;

        // Update User in Standings
        const userEntry = season.standings.find(s => s.id === 'user');
        if (userEntry) {
            userEntry.wins = season.wins;
            userEntry.losses = season.losses;
            userEntry.name = this.store.state.userTeam.name; // Keep name fresh
            userEntry.logo = this.store.state.userTeam.logo;
        }

        // Simulate other team results for this week
        season.standings.forEach(team => {
            if (team.id !== 'user') {
                if (Math.random() > 0.5) team.wins++;
                else team.losses++;
            }
        });

        // Sort Standings
        season.standings.sort((a, b) => b.wins - a.wins || a.losses - b.losses);

        season.week++;
        
        if (season.week > 17) {
            this.startPlayoffs();
        }

        this.store.save();
    }

    startPlayoffs() {
        const season = this.store.state.leagueSeason;
        // Top 4 teams make playoffs
        const qualifiers = season.standings.slice(0, 4);
        
        season.playoffs = {
            active: true,
            round: 1, // 1: Semifinals, 2: Super Bowl
            teams: qualifiers,
            bracket: [
                { id: 'semi1', team1: qualifiers[0], team2: qualifiers[3], winner: null, played: false },
                { id: 'semi2', team1: qualifiers[1], team2: qualifiers[2], winner: null, played: false }
            ],
            userEliminated: !qualifiers.find(q => q.id === 'user')
        };

        if (season.playoffs.userEliminated) {
            alert("Season Over! You didn't make the playoffs. Better luck next year!");
            this.endSeason();
        } else {
            alert("CONGRATULATIONS! You've made the Playoffs! The road to the Super Bowl begins now.");
        }
        
        this.store.save();
    }

    advancePlayoffWeek(won, score) {
        const season = this.store.state.leagueSeason;
        const playoffs = season.playoffs;

        // Find user matchup
        const userMatch = playoffs.bracket.find(m => !m.played && (m.team1.id === 'user' || m.team2.id === 'user'));
        
        if (userMatch) {
            userMatch.played = true;
            userMatch.winner = won ? userMatch.team1.id === 'user' ? userMatch.team1 : userMatch.team2 : userMatch.team1.id === 'user' ? userMatch.team2 : userMatch.team1;
            userMatch.result = { score };
            
            if (!won) {
                alert("Heartbreak! You've been eliminated from the playoffs.");
                this.endSeason();
                return;
            }
        }

        // Simulate other playoff games in this round
        playoffs.bracket.forEach(m => {
            if (!m.played) {
                m.played = true;
                // Simple higher seed advantage (slight)
                const team1Rating = m.team1.offense || 80;
                const team2Rating = m.team2.offense || 80;
                const roll = Math.random() + (team1Rating - team2Rating) / 100;
                m.winner = roll > 0.5 ? m.team1 : m.team2;
            }
        });

        if (playoffs.round === 1) {
            // Setup Super Bowl
            playoffs.round = 2;
            playoffs.bracket = [
                { id: 'superbowl', team1: playoffs.bracket[0].winner, team2: playoffs.bracket[1].winner, winner: null, played: false }
            ];
            alert("VICTORY! You're headed to the SUPER BOWL!");
        } else {
            // Super Bowl Finished
            const winner = playoffs.bracket[0].winner;
            if (winner.id === 'user') {
                this.endSeason(true); // Won Super Bowl
            } else {
                this.endSeason(false); // Lost Super Bowl
            }
        }
        
        this.store.save();
    }

    endSeason(wonSuperBowl = false) {
        const season = this.store.state.leagueSeason;
        const userRank = season.standings.findIndex(s => s.id === 'user') + 1;
        
        let reward = 0;
        let message = `Season Complete! Final Rank: ${userRank}\nRecord: ${season.wins}-${season.losses}`;
        
        if (wonSuperBowl) {
            reward = 10000;
            message += "\n\n🏆 WORLD CHAMPIONS! You've won the Super Bowl! +10,000 Coins";
            this.store.updateAchievementStat('totalBetsWon', 5); // Bonus progress
        } else if (season.playoffs && season.playoffs.active) {
            reward = 2500;
            message += "\n\n⭐ Great Playoff Run! +2500 Coins";
        } else if (userRank <= 4) {
            reward = 1000;
            message += "\n\nYou almost made the cut! +1000 Coins";
        } else {
            reward = 500;
            message += "\n\nKeep grinding! +500 Coins Participation Reward";
        }

        if (reward > 0) {
            MinigameSync.recordWin(reward, { type: 'season_reward', wonSuperBowl });
        }

        alert(message);
        season.active = false;
        season.playoffs = null;
        this.store.save();
    }
}

// ============================================
// UI MANAGER
// ============================================

const store = new Store();
let currentGame = null;
let playerManager = null;
let aiSystem = null;
let seasonLeague = null;
let currentPlayerSelectPosition = null;
let currentCompareSlot = null;
let compareSlot1 = null;
let compareSlot2 = null;
let tradeUserOffer = null;
let tradeAIOffer = null;
let tradeFeedback = null;

// Helper for toasts (checks parent window)
function showToast(message, type = 'info') {
    if (window.parent && window.parent.showToast) {
        window.parent.showToast(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

const App = {
    init() {
        // Initialize MinigameSync
        try {
            if (typeof MinigameSync !== 'undefined' && typeof MinigameSync.init === 'function') {
                MinigameSync.init('TecmoSim');
            }
        } catch (e) { console.warn('MinigameSync init failed'); }
        
        // Initialize Player Progression System
        try {
            if (typeof PlayerProgressionManager !== 'undefined') {
                playerManager = new PlayerProgressionManager(store);
            }
        } catch (e) { console.error('PlayerProgressionManager init failed', e); }
        
        // Initialize AI Opponent System
        try {
            if (typeof AIOpponentSystem !== 'undefined') {
                aiSystem = new AIOpponentSystem();
            }
        } catch (e) { console.error('AIOpponentSystem init failed', e); }

        // Initialize Season League Manager
        seasonLeague = new SeasonLeagueManager(store);
        
        this.bindEvents();
        this.render();
        store.subscribe(() => this.updateHeader());
        
        // Market Initialization
        if (!store.state.marketTrades || store.state.marketTrades.length === 0) {
            this.generateMarketTrades();
        }

        // Listen for external balance updates
        window.addEventListener('balanceUpdated', (e) => {
            if (store) {
                store.state.coins = e.detail.balance;
                this.updateHeader();
            }
        });

        this.updateHeader();
        this.navigateTo('home');
        
        // Initialize Trade Block if empty
        if (!store.state.tradeBlock || store.state.tradeBlock.length === 0) {
            this.generateTradeBlock();
        }

        // Check for live sports capability
        this.checkLiveSports();
    },

    // --- MARKET LOGIC ---
    generateMarketTrades() {
        // Try to fetch real global trades from parent environment
        if (window.parent && window.parent.legendTradeMarket) {
            try {
                const globalTrades = window.parent.legendTradeMarket.getTrades();
                if (globalTrades && globalTrades.length > 0) {
                    store.state.marketTrades = globalTrades;
                    store.save();
                    return;
                }
            } catch (e) {
                console.warn('Failed to fetch global trades:', e);
            }
        }

        const traders = ['BigPlay88', 'GridironKing', 'TouchdownTom', 'BlitzMaster', 'SafetyFirst', 'EndzoneEnigma'];
        const legendKeys = Object.keys(ASSETS.legends);
        
        const trades = [];
        for (let i = 0; i < 6; i++) {
            const offerKey = legendKeys[Math.floor(Math.random() * legendKeys.length)];
            const requestKey = legendKeys[Math.floor(Math.random() * legendKeys.length)];
            
            if (offerKey === requestKey) continue;

            trades.push({
                id: 'mkt_' + Math.random().toString(36).substr(2, 9),
                trader: traders[i % traders.length],
                offer: ASSETS.legends[offerKey],
                request: ASSETS.legends[requestKey],
                timestamp: Date.now() - Math.random() * 3600000,
                status: 'active'
            });
        }
        store.state.marketTrades = trades;
        store.save();
    },

    switchMarketTab(tab, btn) {
        document.querySelectorAll('#view-market .view-section').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('#view-market .nav-btn').forEach(el => el.classList.remove('active'));
        
        document.getElementById(`market-${tab}`).classList.add('active');
        btn.classList.add('active');
        
        if (tab === 'browse') this.renderMarketBrowse();
        if (tab === 'my-listings') this.renderMarketMyListings();
        if (tab === 'propose') this.renderMarketPropose();
    },

    renderMarketBrowse() {
        const grid = document.getElementById('market-trades-grid');
        const userLegends = store.state.userTeam.roster;
        
        grid.innerHTML = store.state.marketTrades.map(trade => `
            <div class="trade-card">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted);">
                    <span>${trade.trader}</span>
                    <span>${this.formatMarketTime(trade.timestamp)}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-around; padding: 10px 0;">
                    <div class="legend-mini-card">
                        <div style="font-size: 1.5rem;">${trade.offer.icon}</div>
                        <div style="font-size: 0.7rem; font-weight: 800;">${trade.offer.name}</div>
                    </div>
                    <i class="fas fa-exchange-alt" style="color: var(--primary);"></i>
                    <div class="legend-mini-card">
                        <div style="font-size: 1.5rem;">${trade.request.icon}</div>
                        <div style="font-size: 0.7rem; font-weight: 800;">${trade.request.name}</div>
                    </div>
                </div>
                <button class="btn-buy ${userLegends.includes(trade.request.id) ? '' : 'disabled'}" 
                        onclick="App.acceptMarketTrade('${trade.id}')"
                        ${userLegends.includes(trade.request.id) ? '' : 'disabled'}>
                    ${userLegends.includes(trade.request.id) ? 'Accept Trade' : 'Missing Card'}
                </button>
            </div>
        `).join('');
    },

    renderMarketMyListings() {
        const grid = document.getElementById('market-user-listings-grid');
        grid.innerHTML = store.state.userListings.length > 0 ? store.state.userListings.map(listing => `
            <div class="trade-card">
                <div style="display: flex; align-items: center; justify-content: space-around; padding: 10px 0;">
                    <div class="legend-mini-card">
                        <div style="font-size: 1.5rem;">${listing.offer.icon}</div>
                        <div style="font-size: 0.7rem; font-weight: 800;">${listing.offer.name}</div>
                    </div>
                    <i class="fas fa-exchange-alt" style="color: var(--primary);"></i>
                    <div class="legend-mini-card">
                        <div style="font-size: 1.5rem;">${listing.request.icon}</div>
                        <div style="font-size: 0.7rem; font-weight: 800;">${listing.request.name}</div>
                    </div>
                </div>
                <button class="btn-buy" style="background: var(--danger); color: white;" onclick="App.cancelMarketListing('${listing.id}')">Cancel</button>
            </div>
        `).join('') : '<div class="empty-state">No active listings.</div>';
    },

    renderMarketPropose() {
        const offerSelect = document.getElementById('trade-offer-select');
        const requestSelect = document.getElementById('trade-request-select');
        
        const userLegends = store.state.userTeam.roster.map(id => ASSETS.legends[id]).filter(Boolean);
        
        offerSelect.innerHTML = userLegends.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
        requestSelect.innerHTML = Object.values(ASSETS.legends).map(l => `<option value="${l.id}">${l.name}</option>`).join('');
    },

    handleMarketPropose() {
        const offerId = document.getElementById('trade-offer-select').value;
        const requestId = document.getElementById('trade-request-select').value;
        
        if (!offerId || !requestId) return;
        if (offerId === requestId) {
            alert("You can't trade a card for itself!");
            return;
        }

        const offer = ASSETS.legends[offerId];
        const request = ASSETS.legends[requestId];

        store.state.userListings.push({
            id: 'user_' + Date.now(),
            offer,
            request,
            timestamp: Date.now()
        });
        
        store.save();
        this.switchMarketTab('my-listings', document.querySelector('[onclick*="my-listings"]'));
        showToast('Trade listing created!', 'success');
    },

    acceptMarketTrade(tradeId) {
        const trade = store.state.marketTrades.find(t => t.id === tradeId);
        if (!trade) return;

        const roster = store.state.userTeam.roster;
        
        // Check if we have the card they want
        if (!roster.includes(trade.request.id)) {
            showToast("You don't have the required card!", 'error');
            return;
        }

        // 1. Try Global Execution first if available
        if (window.parent && window.parent.legendTradeMarket) {
            const result = window.parent.legendTradeMarket.acceptTrade(tradeId);
            if (!result.success) {
                showToast(result.message || 'Trade Failed', 'error');
                // Refresh to remove stale trade
                this.generateMarketTrades();
                this.renderMarketBrowse();
                return;
            }
        }

        // 2. Local Inventory Swap
        const index = roster.indexOf(trade.request.id);
        if (index > -1) {
            roster.splice(index, 1);
            roster.push(trade.offer.id);
            
            // Remove from local list
            store.state.marketTrades = store.state.marketTrades.filter(t => t.id !== tradeId);
            store.save();
            
            this.renderMarketBrowse();
            showToast(`Trade successful! Received ${trade.offer.name}`, 'success');
            if (window.playSfx) window.playSfx('win');
        }
    },

    cancelMarketListing(id) {
        store.state.userListings = store.state.userListings.filter(l => l.id !== id);
        store.save();
        this.renderMarketMyListings();
    },

    formatMarketTime(ts) {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return mins + 'm ago';
        return Math.floor(mins / 60) + 'h ago';
    },

    // --- PACK OPENING REFINED ---
    openPack(packType) {
        const pack = PACK_TYPES[packType];
        if (!pack) return;

        // Check balance via MinigameSync
        const currentBalance = MinigameSync.getBalance();
        if (currentBalance < pack.cost) {
            showToast('Not enough coins!', 'error');
            return;
        }

        const modal = document.getElementById('pack-opening-modal');
        const packImg = document.getElementById('pack-opening-img');
        const revealContainer = document.getElementById('pack-reveal-container');
        const continueBtn = document.getElementById('pack-continue-btn');
        const visualContainer = document.getElementById('pack-visual-container');
        const burst = document.getElementById('reveal-burst');
        const bg = document.getElementById('pack-open-bg');
        const statusText = document.getElementById('pack-status-text');

        // Set pack image
        const packImageMap = {
            'starter': ASSETS.packs.starter,
            'pro': ASSETS.packs.pro,
            'elite': ASSETS.packs.elite,
            'legend': ASSETS.packs.legend
        };
        
        packImg.src = packImageMap[packType] || ASSETS.packs.starter;
        bg.style.backgroundImage = `url(${ASSETS.packs.revealBg})`;
        
        // Reset UI
        modal.classList.add('active');
        visualContainer.style.display = 'block';
        revealContainer.style.display = 'none';
        continueBtn.style.display = 'none';
        packImg.className = 'shaking';
        burst.classList.remove('active');
        statusText.textContent = "SHAKING...";

        // Play haptic-style sound if available
        if (window.playSfx) window.playSfx('click');

        // Stage 1: Shaking Intensity Increase
        setTimeout(() => {
            statusText.textContent = "READY TO BURST...";
            packImg.style.filter = 'drop-shadow(0 0 50px rgba(255,215,0,0.8)) brightness(1.5)';
            if (window.playSfx) window.playSfx('click');
        }, 1000);

        // Stage 2: The Big Opening
        setTimeout(() => {
            statusText.textContent = "BOOM!";
            packImg.className = 'opening';
            burst.classList.add('active');
            
            // Execute opening logic (deducts coins and generates cards)
            const result = playerManager.openPack(packType);
            this.updateHeader();

            if (!result.success) {
                showToast(result.error || 'Opening failed', 'error');
                this.closePackModal();
                return;
            }

            // Confetti for excitement
            if (window.confetti) {
                window.confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#ffd700', '#ffffff', '#fbbf24']
                });
            }

            // Stage 3: Reveal the cards
            setTimeout(() => {
                visualContainer.style.display = 'none';
                revealContainer.style.display = 'flex';
                continueBtn.style.display = 'block';
                this.showPackCards(result.cards);
            }, 800);
        }, 2000);
    },

    showPackCards(cards) {
        const container = document.getElementById('pack-reveal-container');
        container.innerHTML = '';
        
        cards.forEach((card, index) => {
            // Create 3D reveal wrapper
            const wrapper = document.createElement('div');
            wrapper.className = `card-reveal-wrapper rarity-${card.tier}`;
            
            // Inner structure for flip
            wrapper.innerHTML = `
                <div class="card-face card-back"></div>
                <div class="card-face card-front">
                    ${this.renderPlayerCard(card)}
                </div>
            `;

            // Duplicate badge if needed
            if (card.isDuplicate) {
                const badge = document.createElement('div');
                badge.style.cssText = 'position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; z-index: 20; border: 1px solid white;';
                badge.textContent = `DUPE +${card.refund} 🪙`;
                wrapper.querySelector('.card-front').appendChild(badge);
            }

            // New card badge
            if (card.isNew) {
                const badge = document.createElement('div');
                badge.style.cssText = 'position: absolute; top: 10px; right: 10px; background: var(--success); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; z-index: 20; border: 1px solid white;';
                badge.textContent = `NEW!`;
                wrapper.querySelector('.card-front').appendChild(badge);
            }

            container.appendChild(wrapper);

            // Manual flip on click
            wrapper.addEventListener('click', () => {
                if (!wrapper.classList.contains('flipped')) {
                    wrapper.classList.add('flipped');
                    
                    // Pull intensity effects
                    if (card.tier === 'diamond') {
                        if (window.confetti) {
                            window.confetti({
                                particleCount: 100,
                                spread: 100,
                                origin: { y: 0.7 },
                                colors: ['#b9f2ff', '#ffffff', '#60a5fa']
                            });
                        }
                        if (window.playSfx) window.playSfx('win');
                    } else if (card.tier === 'gold') {
                        if (window.playSfx) window.playSfx('win');
                    } else {
                        if (window.playSfx) window.playSfx('click');
                    }
                }
            });

            // Timed entrance
            setTimeout(() => {
                wrapper.classList.add('show');
                
                // Auto-flip low tier cards for convenience, leave high tiers for user interaction
                if (card.tier === 'bronze' || card.tier === 'silver') {
                    setTimeout(() => wrapper.classList.add('flipped'), 400);
                }
            }, index * 300);
        });
    },

    closePackModal() {
        const modal = document.getElementById('pack-opening-modal');
        modal.classList.remove('active');
        
        // Refresh views that might be affected
        this.renderPacksView();
        if (document.getElementById('view-collection').classList.contains('active')) {
            this.renderCollectionView();
        }
        if (document.getElementById('view-history').classList.contains('active')) {
            this.renderHistoryView();
        }
    },

    renderPacksView() {
        const container = document.getElementById('packs-container');
        if (!container) return;
        
        const balance = store.state.coins;
        const packImages = {
            'starter': ASSETS.packs.starter,
            'pro': ASSETS.packs.pro,
            'elite': ASSETS.packs.elite,
            'legend': ASSETS.packs.legend
        };

        container.innerHTML = Object.values(PACK_TYPES).map(pack => `
            <div class="shop-item">
                <div class="shop-img-container" style="background: none; height: 300px; padding: 10px;">
                    <img src="${packImages[pack.id]}" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <div class="shop-details">
                    <div class="shop-title">${pack.name}</div>
                    <div class="shop-desc">${pack.description}</div>
                    <button class="btn-buy" onclick="App.openPack('${pack.id}')" ${balance < pack.cost ? 'disabled' : ''}>
                        ${balance >= pack.cost ? `Open ${pack.cost.toLocaleString()} 🪙` : `Need ${pack.cost.toLocaleString()} 🪙`}
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderCollectionView(tier = 'all') {
        if (!playerManager) return;
        const allPlayers = playerManager.getAllOwnedPlayers();
        const players = tier === 'all' ? allPlayers : allPlayers.filter(p => p.tier === tier);
        const stats = playerManager.getCollectionStats();

        if (document.getElementById('collection-percentage')) document.getElementById('collection-percentage').textContent = `${stats.percentage}%`;
        if (document.getElementById('collection-count')) document.getElementById('collection-count').textContent = stats.owned;

        const grid = document.getElementById('collection-grid');
        grid.innerHTML = players.length > 0 ? players.map(player => this.renderPlayerCard(player)).join('') : '<div class="empty-state">No players found in this category.</div>';
    },

    filterCollection(tier) {
        this.renderCollectionView(tier);
    },

    navigateTo(viewId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
        
        const target = document.getElementById(`view-${viewId}`);
        if (target) target.classList.add('active');
        
        const nav = document.querySelector(`[data-nav="${viewId}"]`);
        if (nav) nav.classList.add('active');

        if (viewId === 'team') this.renderTeamView();
        if (viewId === 'shop') this.renderShopView();
        if (viewId === 'home') this.renderHomeView();
        if (viewId === 'packs') this.renderPacksView();
        if (viewId === 'history') this.renderHistoryView();
        if (viewId === 'collection') this.renderCollectionView();
        if (viewId === 'market') this.switchMarketTab('browse', document.querySelector('[onclick*="browse"]'));
        if (viewId === 'multiplayer') this.renderAIOpponents();
        if (viewId === 'season') this.renderSeasonView();
        if (viewId === 'compare') this.renderCompareView();
        if (viewId === 'trade') this.renderTradeView();
    },

    // --- TRADE CENTER LOGIC ---

    generateTradeBlock() {
        if (typeof PLAYER_DATABASE === 'undefined') return;
        
        const trades = [];
        const tiers = ['silver', 'gold', 'gold', 'diamond']; // Bias towards better players
        const allPlayers = Object.values(PLAYER_DATABASE);

        for (let i = 0; i < 6; i++) {
            // Pick a tier
            const targetTier = tiers[Math.floor(Math.random() * tiers.length)];
            const eligible = allPlayers.filter(p => p.tier === targetTier);
            
            if (eligible.length > 0) {
                const base = eligible[Math.floor(Math.random() * eligible.length)];
                // Generate random level 1-10
                const level = Math.floor(Math.random() * 8) + 1;
                
                trades.push({
                    id: 'trade_' + Math.random().toString(36).substr(2, 9),
                    playerId: base.id,
                    level: level,
                    xp: (level - 1) * 500,
                    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                });
            }
        }
        
        store.state.tradeBlock = trades;
        store.save();
    },

    refreshTradeBlock() {
        this.generateTradeBlock();
        this.renderTradeView();
        showToast('Trade block refreshed with new talent!', 'success');
    },

    renderTradeView() {
        const grid = document.getElementById('trade-block-grid');
        const feedback = document.getElementById('trade-feedback');
        
        if (!grid) return;

        // Render AI Offers
        if (!store.state.tradeBlock) this.generateTradeBlock();
        
        grid.innerHTML = store.state.tradeBlock.map(trade => {
            const base = PLAYER_DATABASE[trade.playerId];
            if (!base) return '';
            
            const boostedOvr = base.overall + ((trade.level - 1) * 2);
            const isSelected = tradeAIOffer && tradeAIOffer.id === trade.id;

            return `
                <div class="shop-item ${isSelected ? 'selected' : ''}" 
                     style="${isSelected ? 'border-color: var(--primary); transform: scale(1.02);' : ''} cursor: pointer;"
                     onclick="App.selectTradeBlockItem('${trade.id}')">
                    <div class="shop-img-container" style="height: 150px; background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6)); position: relative;">
                        <div class="player-tier-badge ${'tier-' + base.tier}">${base.tier.toUpperCase()}</div>
                        <div style="font-size: 3rem; color: var(--primary); font-weight: 900; font-family: 'Chakra Petch';">${boostedOvr}</div>
                        <div style="position: absolute; bottom: 10px; font-weight: 700;">${base.position}</div>
                        <div class="player-level-badge" style="top: auto; bottom: 10px; left: 10px;">LVL ${trade.level}</div>
                    </div>
                    <div class="shop-details" style="padding: 1rem;">
                        <div class="shop-title" style="font-size: 1rem;">${base.name}</div>
                        <div class="shop-desc" style="margin: 0.5rem 0; font-size: 0.8rem;">
                            AI GM Proposal
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Render User Slot
        const userSlot = document.getElementById('trade-slot-user');
        if (tradeUserOffer) {
            const p = playerManager.getPlayer(tradeUserOffer);
            userSlot.innerHTML = `
                <div onclick="App.openTradeSelect('user')" style="cursor: pointer;">
                    ${this.renderPlayerCard(p)}
                    <button class="btn-buy" style="margin-top: 10px; background: var(--bg-card); border: 1px solid var(--border);">Change Offer</button>
                </div>
            `;
        } else {
            userSlot.innerHTML = `
                <div style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-muted); text-align: center;">YOU OFFER</div>
                <div class="comparison-slot-button" onclick="App.openTradeSelect('user')">
                    <i class="fas fa-plus-circle" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <div style="color: var(--text-muted);">Select Your Player</div>
                </div>
            `;
        }

        // Render AI Slot
        const aiSlot = document.getElementById('trade-slot-ai');
        if (tradeAIOffer) {
            const base = PLAYER_DATABASE[tradeAIOffer.playerId];
            // Mock a player object for rendering
            const mockPlayer = {
                ...base,
                instance: { level: tradeAIOffer.level },
                boostedOverall: base.overall + ((tradeAIOffer.level - 1) * 2),
                boostedStats: playerManager.calculateBoostedStats(base.stats, (tradeAIOffer.level - 1) * 2)
            };

            aiSlot.innerHTML = `
                <div style="cursor: default;">
                    ${this.renderPlayerCard(mockPlayer)}
                    <div style="text-align: center; margin-top: 10px; color: var(--primary); font-weight: 700;">TARGET SELECTED</div>
                </div>
            `;
        } else {
             aiSlot.innerHTML = `
                <div style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-muted); text-align: center;">YOU RECEIVE</div>
                <div class="comparison-slot-button" style="border-style: solid; border-color: rgba(255,255,255,0.1); cursor: default;">
                    <i class="fas fa-question-circle" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <div style="color: var(--text-muted);">Select from Trade Block</div>
                </div>
            `;
        }

        // Enable/Disable Button
        const btn = document.getElementById('btn-evaluate-trade');
        if (tradeUserOffer && tradeAIOffer) {
            btn.disabled = false;
            btn.style.opacity = 1;
            // Clear feedback if just selecting
            if (!tradeFeedback) feedback.textContent = "Ready to evaluate...";
        } else {
            btn.disabled = true;
            btn.style.opacity = 0.5;
            feedback.textContent = "Select players to evaluate";
        }

        if (tradeFeedback) {
            feedback.innerHTML = tradeFeedback;
        }
    },

    selectTradeBlockItem(tradeId) {
        const trade = store.state.tradeBlock.find(t => t.id === tradeId);
        if (trade) {
            tradeAIOffer = trade;
            tradeFeedback = null;
            this.renderTradeView();
            // Scroll to top to see comparison
            document.querySelector('.comparison-container').scrollIntoView({ behavior: 'smooth' });
        }
    },

    openTradeSelect(side) {
        if (side === 'user') {
            // Re-use comparison selector logic but set context
            currentCompareSlot = 'trade_user'; 
            
            const modal = document.getElementById('player-select-modal');
            const grid = document.getElementById('player-select-grid');
            const title = document.getElementById('select-modal-title');
            
            title.textContent = `Select Player to Trade Away`;
            modal.classList.add('active');
            
            // Show all owned players NOT in active roster
            const allPlayers = playerManager.getAllOwnedPlayers();
            const activeRosterIds = Object.values(store.state.playerCollection.activeRoster).filter(Boolean);
            
            // Filter out active roster players to prevent trading starters
            const tradablePlayers = allPlayers.filter(p => !activeRosterIds.includes(p.id));
            
            if (tradablePlayers.length === 0) {
                grid.innerHTML = '<div class="empty-state">No tradable players available. Active roster players cannot be traded.</div>';
                return;
            }

            grid.innerHTML = tradablePlayers.map(player => `
                <div class="player-card tier-${player.tier}" onclick="App.selectTradePlayer('${player.id}')">
                    <div class="player-card-header">
                        <div class="player-level-badge">LVL ${player.instance.level}</div>
                        <div class="player-overall">${player.boostedOverall}</div>
                        <div class="player-position">${player.position}</div>
                        <div class="player-name">${player.name}</div>
                    </div>
                </div>
            `).join('');
        }
    },

    selectTradePlayer(playerId) {
        tradeUserOffer = playerId;
        this.closePlayerSelectModal();
        tradeFeedback = null;
        this.renderTradeView();
    },

    evaluateTrade() {
        if (!tradeUserOffer || !tradeAIOffer) return;

        const btn = document.getElementById('btn-evaluate-trade');
        const feedback = document.getElementById('trade-feedback');
        
        // 1. Calculating State
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        feedback.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">AI GM is analyzing your offer...</span>';
        
        // Play sound if available
        if (window.playSfx) window.playSfx('click');

        setTimeout(() => {
            const userP = playerManager.getPlayer(tradeUserOffer);
            const aiBase = PLAYER_DATABASE[tradeAIOffer.playerId];
            const aiLevel = tradeAIOffer.level;
            
            // Calculate Values
            const userValue = this.calculateTradeValue(userP);
            const aiValue = this.calculateTradeValue({ ...aiBase, instance: { level: aiLevel } });

            // AI Margin (AI wants to win the trade slightly, e.g. 5% profit)
            const aiMargin = 1.05;
            const requiredValue = aiValue * aiMargin;
            const ratio = userValue / requiredValue;

            let message = "";
            let color = "";
            let success = false;

            if (ratio >= 1.0) {
                message = `<i class="fas fa-check-circle"></i> DEAL ACCEPTED! Trade Executed.`;
                color = "var(--success)";
                success = true;
            } else if (ratio > 0.9) {
                message = `<i class="fas fa-exclamation-circle"></i> So close! Add a slightly better player.`;
                color = "#fbbf24";
            } else if (ratio > 0.7) {
                message = `<i class="fas fa-times-circle"></i> Not enough value. I need more.`;
                color = "var(--danger)";
            } else {
                message = `<i class="fas fa-angry"></i> That's an insult! Get serious.`;
                color = "var(--danger)";
            }

            tradeFeedback = `<span style="color: ${color}; font-weight: 800; font-size: 1.1rem; animation: fadeIn 0.5s ease;">${message}</span>`;
            this.renderTradeView();
            
            // Restore button text (but keep disabled if success pending)
            btn.innerHTML = 'EVALUATE';

            if (success) {
                if (window.playSfx) window.playSfx('win');
                // Additional delay before execution so user sees "ACCEPTED"
                setTimeout(() => {
                    this.executeTrade();
                    // Re-enable button after trade is done (though UI will likely reset)
                    btn.disabled = false; 
                }, 1500);
            } else {
                 if (window.playSfx) window.playSfx('error');
                 btn.disabled = false;
            }
        }, 1500); // 1.5s delay for dramatic effect
    },

    calculateTradeValue(player) {
        // Value Formula: (TierBase * TierMult) + (OVR^2) + (Level * 100)
        const tierMults = { bronze: 1, silver: 3, gold: 8, diamond: 20 };
        const tierBase = { bronze: 500, silver: 1500, gold: 5000, diamond: 15000 };
        
        const tier = player.tier || 'bronze';
        const ovr = player.boostedOverall || player.overall; // Handle mock objects
        const level = player.instance ? player.instance.level : 1;

        const val = (tierBase[tier]) + (Math.pow(ovr, 2.5)) + (level * 200);
        return Math.floor(val);
    },

    executeTrade() {
        if (!tradeUserOffer || !tradeAIOffer) return;
        
        // 1. Remove User Player (Manual manipulation of store to avoid XP gain from burn)
        store.state.playerCollection.ownedPlayers = store.state.playerCollection.ownedPlayers.filter(id => id !== tradeUserOffer);
        delete store.state.playerCollection.playerInstances[tradeUserOffer];

        // 2. Add AI Player
        playerManager.unlockPlayer(tradeAIOffer.playerId, true);
        
        // 3. Update AI Player Instance to match Trade Offer
        const newInstance = store.state.playerCollection.playerInstances[tradeAIOffer.playerId];
        if (newInstance) {
            newInstance.level = tradeAIOffer.level;
            newInstance.xp = tradeAIOffer.xp;
        }

        // 4. Remove from Trade Block
        store.state.tradeBlock = store.state.tradeBlock.filter(t => t.id !== tradeAIOffer.id);

        store.save();

        // 5. Success UI
        showToast(`Trade Complete! Acquired ${PLAYER_DATABASE[tradeAIOffer.playerId].name}`, 'success');
        if (window.playSfx) window.playSfx('win');

        // Reset
        tradeUserOffer = null;
        tradeAIOffer = null;
        tradeFeedback = null;
        
        this.renderTradeView();
        this.updateHeader();
    },

    updateHeader() {
        const s = store.state;
        
        // Level Display
        const levelEl = document.getElementById('header-level');
        if (levelEl) levelEl.textContent = s.level || 1;
        
        // Balance Display (from MinigameSync)
        const balance = MinigameSync.getBalance();
        document.querySelectorAll('.header-balance').forEach(el => {
            el.textContent = balance.toLocaleString();
        });

        // Training XP Display
        const txpEl = document.getElementById('header-txp');
        if (txpEl && s.playerCollection) {
            txpEl.textContent = (s.playerCollection.trainingXP || 0).toLocaleString();
        }

        // Ascension Stones Display
        const stonesBadge = document.getElementById('ascension-stones-badge');
        const stonesCount = document.getElementById('header-stones');
        if (stonesBadge && stonesCount) {
            const stones = s.playerCollection?.evolutionStones || 0;
            if (stones > 0) {
                stonesBadge.style.display = 'flex';
                stonesCount.textContent = stones;
            } else {
                stonesBadge.style.display = 'none';
            }
        }
    },

    // --- COMPARISON TOOL ---

    compareWithBench(playerId, positionKey) {
        compareSlot1 = playerId;
        compareSlot2 = null; // Clear second slot
        
        // Find position to filter (e.g., 'WR1' -> 'WR')
        const posToFilter = positionKey.replace(/[0-9]/g, '');
        
        // Navigate to compare view
        this.navigateTo('compare');
        
        // Automatically open selection for slot 2 filtered by position
        this.openCompareSelect(2, posToFilter);
    },

    openCompareSelect(slot, filterPos = null) {
        currentCompareSlot = slot;
        currentPlayerSelectPosition = null; // Ensure we're not selecting for roster
        
        const modal = document.getElementById('player-select-modal');
        const grid = document.getElementById('player-select-grid');
        const title = document.getElementById('select-modal-title');
        
        title.textContent = `Select ${filterPos || 'Player'} ${slot} for Comparison`;
        modal.classList.add('active');
        
        // Show filtered or all owned players
        let players = playerManager.getAllOwnedPlayers();
        if (filterPos) {
            players = players.filter(p => p.position === filterPos);
        }
        
        if (players.length === 0) {
            grid.innerHTML = `<div class="empty-state">No ${filterPos || ''} players found. Open packs to build your collection!</div>`;
            return;
        }

        grid.innerHTML = players.map(player => `
            <div class="player-card tier-${player.tier}" onclick="App.selectComparePlayer('${player.id}')">
                <div class="player-card-header">
                    <div class="player-level-badge">LVL ${player.instance.level}</div>
                    <div class="player-overall">${player.boostedOverall}</div>
                    <div class="player-position">${player.position}</div>
                    <div class="player-name">${player.name}</div>
                </div>
            </div>
        `).join('');
    },

    selectComparePlayer(playerId) {
        if (currentCompareSlot === 1) compareSlot1 = playerId;
        else compareSlot2 = playerId;
        
        this.closePlayerSelectModal();
        this.renderCompareView();
    },

    renderCompareView() {
        const slot1 = document.getElementById('comp-slot-1');
        const slot2 = document.getElementById('comp-slot-2');
        const results = document.getElementById('comparison-results');
        const tableBody = document.getElementById('comp-table-body');

        // Render Slot 1
        if (compareSlot1) {
            const p1 = playerManager.getPlayer(compareSlot1);
            slot1.innerHTML = `
                <div onclick="App.openCompareSelect(1)" style="cursor: pointer;">
                    ${this.renderPlayerCard(p1)}
                    <button class="btn-buy" style="margin-top: 10px;">Change</button>
                </div>
            `;
        } else {
            slot1.innerHTML = `
                <div class="comparison-slot-button" onclick="App.openCompareSelect(1)">
                    <i class="fas fa-plus-circle" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <div style="color: var(--text-muted);">Select Player 1</div>
                </div>
            `;
        }

        // Render Slot 2
        if (compareSlot2) {
            const p2 = playerManager.getPlayer(compareSlot2);
            slot2.innerHTML = `
                <div onclick="App.openCompareSelect(2)" style="cursor: pointer;">
                    ${this.renderPlayerCard(p2)}
                    <button class="btn-buy" style="margin-top: 10px;">Change</button>
                </div>
            `;
        } else {
            slot2.innerHTML = `
                <div class="comparison-slot-button" onclick="App.openCompareSelect(2)">
                    <i class="fas fa-plus-circle" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <div style="color: var(--text-muted);">Select Player 2</div>
                </div>
            `;
        }

        // Render Comparison Table
        if (compareSlot1 && compareSlot2) {
            const p1 = playerManager.getPlayer(compareSlot1);
            const p2 = playerManager.getPlayer(compareSlot2);
            
            results.style.display = 'block';
            
            // Attributes to compare
            const attributes = [
                { key: 'boostedOverall', label: 'OVERALL RATING' },
                { key: 'speed', label: 'Speed' },
                { key: 'power', label: 'Power' },
                { key: 'skill', label: 'Skill' },
                { key: 'iq', label: 'Football IQ' }
            ];

            // Add tier and level comparison
            let html = `
                <div class="comp-row">
                    <div class="comp-val ${this.getCompClass(p1.tier, p2.tier, true)}">${p1.tier.toUpperCase()}</div>
                    <div class="comp-label">TIER</div>
                    <div class="comp-val ${this.getCompClass(p2.tier, p1.tier, true)}">${p2.tier.toUpperCase()}</div>
                </div>
                <div class="comp-row">
                    <div class="comp-val ${this.getCompClass(p1.instance.level, p2.instance.level)}">LVL ${p1.instance.level}</div>
                    <div class="comp-label">LEVEL</div>
                    <div class="comp-val ${this.getCompClass(p2.instance.level, p1.instance.level)}">LVL ${p2.instance.level}</div>
                </div>
            `;

            // Add stats
            attributes.forEach(attr => {
                const v1 = attr.key === 'boostedOverall' ? p1.boostedOverall : (p1.boostedStats[attr.key] || 0);
                const v2 = attr.key === 'boostedOverall' ? p2.boostedOverall : (p2.boostedStats[attr.key] || 0);
                
                html += `
                    <div class="comp-row">
                        <div class="comp-val ${this.getCompClass(v1, v2)}">${v1}</div>
                        <div class="comp-label">${attr.label}</div>
                        <div class="comp-val ${this.getCompClass(v2, v1)}">${v2}</div>
                    </div>
                `;
            });

            // Special Bonus comparison
            html += `
                <div class="comp-row">
                    <div class="comp-val" style="font-size: 0.9rem;">${p1.bonus ? `${p1.bonus.type} ${(p1.bonus.value*100-100).toFixed(0)}%` : '-'}</div>
                    <div class="comp-label">BONUS</div>
                    <div class="comp-val" style="font-size: 0.9rem;">${p2.bonus ? `${p2.bonus.type} ${(p2.bonus.value*100-100).toFixed(0)}%` : '-'}</div>
                </div>
            `;

            // Action Buttons (Swap/Assign)
            const activeRoster = store.state.playerCollection.activeRoster;
            const isP1Starter = Object.values(activeRoster).includes(p1.id);
            const isP2Starter = Object.values(activeRoster).includes(p2.id);

            html += `
                <div class="comp-actions" style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                    ${(!isP1Starter && p1.position === p2.position) ? `
                        <button class="btn-buy" onclick="App.swapComparePlayers('${p1.id}', '${p2.id}')">
                            <i class="fas fa-exchange-alt"></i> Set ${p1.name} as Starter
                        </button>
                    ` : ''}
                    ${(!isP2Starter && p1.position === p2.position) ? `
                        <button class="btn-buy" onclick="App.swapComparePlayers('${p2.id}', '${p1.id}')">
                            <i class="fas fa-exchange-alt"></i> Set ${p2.name} as Starter
                        </button>
                    ` : ''}
                </div>
            `;

            tableBody.innerHTML = html;
        } else {
            results.style.display = 'none';
        }
    },

    swapComparePlayers(newStarterId, replacedPlayerId) {
        const activeRoster = store.state.playerCollection.activeRoster;
        let positionKey = null;

        // Find which position the replaced player occupies
        for (const [key, id] of Object.entries(activeRoster)) {
            if (id === replacedPlayerId) {
                positionKey = key;
                break;
            }
        }

        if (positionKey) {
            activeRoster[positionKey] = newStarterId;
            store.recalcStats();
            store.save();
            this.renderTeamView();
            this.updateHeader();
            
            // Show feedback
            const newStarter = playerManager.getPlayer(newStarterId);
            showToast(`${newStarter.name} is now starting at ${positionKey}!`, 'success');
            
            // Refresh comparison
            this.renderCompareView();
        } else {
            // If replaced player wasn't a starter, just assign new starter to its primary position
            const newStarter = playerManager.getPlayer(newStarterId);
            const pos = newStarter.position;
            // Handle WR1/WR2
            const targetKey = pos === 'WR' ? 'WR1' : pos;
            
            activeRoster[targetKey] = newStarterId;
            store.recalcStats();
            store.save();
            this.renderTeamView();
            this.updateHeader();
            showToast(`${newStarter.name} is now starting!`, 'success');
            this.renderCompareView();
        }
    },

    getCompClass(v1, v2, isString = false) {
        if (isString) {
            const tiers = { 'bronze': 1, 'silver': 2, 'gold': 3, 'diamond': 4 };
            const s1 = tiers[v1] || 0;
            const s2 = tiers[v2] || 0;
            if (s1 > s2) return 'better';
            if (s1 < s2) return 'worse';
            return '';
        }
        
        if (v1 > v2) return 'better';
        if (v1 < v2) return 'worse';
        return '';
    },

    // --- VIEW RENDERERS ---

    renderSeasonView() {
        const season = store.state.leagueSeason;
        
        // Highlight Season nav if active
        const seasonNav = document.querySelector('[data-nav="season"]');
        if (seasonNav) {
            if (season.active) {
                seasonNav.style.color = 'var(--primary)';
                seasonNav.innerHTML = `<i class="fas fa-calendar-check"></i> <span>${season.playoffs ? 'Playoffs' : 'Season Active'}</span>`;
            } else {
                seasonNav.style.color = '';
                seasonNav.innerHTML = '<i class="fas fa-calendar-alt"></i> <span>Season</span>';
            }
        }

        const startView = document.getElementById('season-start-view');
        const activeView = document.getElementById('season-active-view');
        const playoffView = document.getElementById('season-playoff-view');

        if (!season.active) {
            startView.style.display = 'block';
            activeView.style.display = 'none';
            if (playoffView) playoffView.style.display = 'none';
            return;
        }

        if (season.playoffs && season.playoffs.active) {
            startView.style.display = 'none';
            activeView.style.display = 'none';
            this.renderPlayoffBracket();
            return;
        }

        startView.style.display = 'none';
        activeView.style.display = 'block';
        if (playoffView) playoffView.style.display = 'none';

        // Update Progress
        const weekDisplay = document.getElementById('season-week-display');
        const progressBar = document.getElementById('season-progress-bar');
        const recordDisplay = document.getElementById('season-record-display');
        const rankDisplay = document.getElementById('season-rank-display');

        weekDisplay.textContent = `Week ${season.week} / 17`;
        progressBar.style.width = `${(season.week / 17) * 100}%`;
        recordDisplay.textContent = `${season.wins} - ${season.losses}`;
        
        const rank = season.standings.findIndex(s => s.id === 'user') + 1;
        rankDisplay.textContent = this.getOrdinal(rank);
        
        // Update points for/against
        const userTeamStandings = season.standings.find(s => s.id === 'user');
        const pointsFor = document.getElementById('season-points-for');
        const pointsAgainst = document.getElementById('season-points-against');
        if (pointsFor && userTeamStandings) {
            pointsFor.textContent = userTeamStandings.pointsFor || 0;
        }
        if (pointsAgainst && userTeamStandings) {
            pointsAgainst.textContent = userTeamStandings.pointsAgainst || 0;
        }

        // Next Opponent
        const currentMatch = season.schedule.find(m => m.week === season.week);
        const container = document.getElementById('next-game-container');
        if (currentMatch) {
            const opponent = seasonLeague.teams.find(t => t.id === currentMatch.opponentId);
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem;">
                    <img src="${opponent.logo.url}" style="width: 80px; height: 80px; object-fit: contain;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: 800;">vs ${opponent.name}</div>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">OFF: ${opponent.offense} | DEF: ${opponent.defense}</div>
                    </div>
                    <button class="btn-buy" onclick="App.playSeasonGame()">PLAY WEEK ${season.week}</button>
                </div>
            `;
        } else {
            container.innerHTML = '<div class="empty-state">Season Complete!</div>';
        }

        // Standings
        const standingsList = document.getElementById('league-standings-list');
        standingsList.innerHTML = season.standings.map((team, i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); background: ${team.id === 'user' ? 'rgba(255,215,0,0.1)' : 'transparent'};">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="width: 25px; font-weight: 800; color: var(--text-muted);">${i + 1}</span>
                    <img src="${team.logo.url || team.logo}" style="width: 30px; height: 30px; object-fit: contain; border-radius: 50%;">
                    <span style="font-weight: ${team.id === 'user' ? '800' : '500'}">${team.name}</span>
                </div>
                <div style="font-weight: 800;">${team.wins} - ${team.losses}</div>
            </div>
        `).join('');
    },

    renderPlayoffBracket() {
        const season = store.state.leagueSeason;
        const playoffs = season.playoffs;
        const playoffView = document.getElementById('season-playoff-view');
        if (!playoffView) return;

        playoffView.style.display = 'block';
        
        const bracketTitle = document.getElementById('playoff-round-title');
        bracketTitle.textContent = playoffs.round === 1 ? 'SEMIFINALS' : 'SUPER BOWL';

        const bracketList = document.getElementById('playoff-bracket-list');
        bracketList.innerHTML = playoffs.bracket.map(match => {
            const isUserMatch = match.team1.id === 'user' || match.team2.id === 'user';
            const canPlay = isUserMatch && !match.played;

            return `
                <div class="playoff-match-card ${isUserMatch ? 'user-match' : ''}" style="opacity: ${match.played ? 0.7 : 1}">
                    <div style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 1rem;">
                        <div class="playoff-team">
                            <img src="${match.team1.logo.url || match.team1.logo}">
                            <div class="playoff-team-name">${match.team1.name}</div>
                        </div>
                        <div class="playoff-vs">VS</div>
                        <div class="playoff-team">
                            <img src="${match.team2.logo.url || match.team2.logo}">
                            <div class="playoff-team-name">${match.team2.name}</div>
                        </div>
                    </div>
                    ${match.played ? `
                        <div class="playoff-winner-badge">
                            <i class="fas fa-check-circle"></i> WINNER: ${match.winner.name}
                        </div>
                    ` : canPlay ? `
                        <button class="btn-buy" style="width: 100%" onclick="App.playSeasonGame()">
                            <i class="fas fa-play"></i> PLAY GAME
                        </button>
                    ` : `
                        <div style="text-align: center; color: var(--text-muted); font-style: italic; margin-top: 10px;">
                            <i class="fas fa-clock"></i> Awaiting result...
                        </div>
                    `}
                </div>
            `;
        }).join('');
    },

    getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    },

    startSeason() {
        seasonLeague.startSeason();
        this.renderSeasonView();
    },

    playSeasonGame() {
        const season = store.state.leagueSeason;
        const userTeam = store.state.userTeam;
        let opponent = null;

        if (season.playoffs && season.playoffs.active) {
            const userMatch = season.playoffs.bracket.find(m => !m.played && (m.team1.id === 'user' || m.team2.id === 'user'));
            if (userMatch) {
                opponent = userMatch.team1.id === 'user' ? userMatch.team2 : userMatch.team1;
            }
        } else {
            const currentMatch = season.schedule.find(m => m.week === season.week);
            if (currentMatch) {
                opponent = seasonLeague.teams.find(t => t.id === currentMatch.opponentId);
            }
        }

        if (!opponent) return;
        
        this.navigateTo('game');
        document.getElementById('game-home-name').textContent = userTeam.name;
        document.getElementById('game-away-name').textContent = opponent.name;
        document.getElementById('game-home-score').textContent = '0';
        document.getElementById('game-away-score').textContent = '0';

        currentGame = new GameEngine(userTeam, opponent, { isSeason: true });
        this.updateGameUI();
    },

    renderHomeView() {
        const s = store.state;
        const historyContainer = document.getElementById('recent-matches');
        
        if (!historyContainer) return;
        
        if (!s.matchHistory || s.matchHistory.length === 0) {
            historyContainer.innerHTML = '<div class="empty-state">No matches played yet. Start your legacy!</div>';
        } else {
            historyContainer.innerHTML = s.matchHistory.map(m => `
                <div class="match-card ${m.won ? 'win' : 'loss'}">
                    <div class="match-result">${m.won ? 'VICTORY' : 'DEFEAT'}</div>
                    <div class="match-score">${m.score}</div>
                    <div class="match-opponent">vs ${m.opponent}</div>
                    <div class="match-rewards">+${m.xp} XP</div>
                </div>
            `).join('');
        }

        // Stats
        if (document.getElementById('stat-record')) document.getElementById('stat-record').textContent = `${s.wins || 0} - ${s.losses || 0}`;
        if (s.userTeam && s.userTeam.stats) {
            if (document.getElementById('stat-offense')) document.getElementById('stat-offense').textContent = s.userTeam.stats.offense || 70;
            if (document.getElementById('stat-defense')) document.getElementById('stat-defense').textContent = s.userTeam.stats.defense || 70;
        }

        // Chemistry Bonuses
        const chemistryContainer = document.getElementById('chemistry-bonuses');
        if (chemistryContainer) {
            if (s.userTeam.chemistry && s.userTeam.chemistry.length > 0) {
                chemistryContainer.innerHTML = s.userTeam.chemistry.map(chem => `
                    <div class="stat-badge" style="border-color: var(--success); background: rgba(16, 185, 129, 0.1);">
                        <i class="fas fa-flask"></i> ${chem.team}: +${chem.bonus} All (${chem.count} Players)
                    </div>
                `).join('');
            } else {
                chemistryContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">No chemistry bonuses active. Collect 2+ legends from the same team!</p>';
            }
        }
    },

    renderTeamView() {
        const s = store.state;
        const rosterContainer = document.getElementById('team-roster');
        
        if (!rosterContainer) return;
        
        if (document.getElementById('team-name-input')) {
            document.getElementById('team-name-input').value = (s.userTeam && s.userTeam.name) ? s.userTeam.name : 'My Team';
        }

        if (document.getElementById('team-primary-color')) {
            document.getElementById('team-primary-color').value = s.userTeam.primaryColor || '#ffd700';
        }

        if (document.getElementById('team-secondary-color')) {
            document.getElementById('team-secondary-color').value = s.userTeam.secondaryColor || '#000000';
        }

        // Render active roster with position slots
        if (!s.playerCollection || !s.playerCollection.activeRoster) {
            rosterContainer.innerHTML = '<div class="empty-state">Initializing roster system...</div>';
            return;
        }

        const activeRoster = s.playerCollection.activeRoster;
        const positions = [
            { key: 'QB', name: 'Quarterback', icon: 'fa-user-tie' },
            { key: 'RB', name: 'Running Back', icon: 'fa-running' },
            { key: 'WR1', name: 'Wide Receiver 1', icon: 'fa-hands' },
            { key: 'WR2', name: 'Wide Receiver 2', icon: 'fa-hands' },
            { key: 'TE', name: 'Tight End', icon: 'fa-user-ninja' },
            { key: 'LB', name: 'Linebacker', icon: 'fa-shield-alt' },
            { key: 'CB', name: 'Cornerback', icon: 'fa-user-shield' },
            { key: 'S', name: 'Safety', icon: 'fa-user-lock' },
            { key: 'COACH', name: 'Head Coach', icon: 'fa-chalkboard-teacher' }
        ];

        rosterContainer.innerHTML = positions.map(pos => {
            const playerId = activeRoster[pos.key];
            const player = playerId ? playerManager.getPlayer(playerId) : null;

            if (player) {
                return `
                    <div class="position-slot filled" onclick="App.openPlayerSelect('${pos.key}')">
                        <div style="position: absolute; top: 8px; left: 8px; font-size: 0.8rem; color: var(--text-muted); z-index: 5;">
                            ${pos.name}
                        </div>
                        <button class="compare-btn" title="Compare with bench" onclick="event.stopPropagation(); App.compareWithBench('${player.id}', '${pos.key}')">
                            <i class="fas fa-balance-scale"></i>
                        </button>
                        ${this.renderPlayerCard(player, true)}
                    </div>
                `;
            } else {
                return `
                    <div class="position-slot" onclick="App.openPlayerSelect('${pos.key}')">
                        <i class="fas ${pos.icon}" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--text-muted);">${pos.name}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Click to assign player</p>
                    </div>
                `;
            }
        }).join('');

        // Logo selection - Combined default and custom logos
        const logoGrid = document.getElementById('logo-grid');
        if (logoGrid) {
            const allLogos = [...ASSETS.logos, ...(s.userTeam.customLogos || [])];
            logoGrid.innerHTML = allLogos.map(logo => `
                <div class="logo-option ${(s.userTeam && s.userTeam.logo && s.userTeam.logo.id === logo.id) ? 'selected' : ''}" 
                     onclick='App.selectLogo(${JSON.stringify(logo)})'>
                    <img src="${logo.url}" alt="${logo.name}" class="logo-image">
                </div>
            `).join('');
        }
    },

    optimizeLineup() {
        if (!playerManager) return;
        const allPlayers = playerManager.getAllOwnedPlayers();
        const newRoster = { ...store.state.playerCollection.activeRoster };
        const usedIds = new Set();

        // Helper to find best for a specific position (returns array)
        const findBestByPos = (pos, count = 1) => {
            return allPlayers
                .filter(p => p.position === pos && !usedIds.has(p.id))
                .sort((a, b) => b.boostedOverall - a.boostedOverall)
                .slice(0, count);
        };

        // Standard positions
        ['QB', 'RB', 'TE', 'LB', 'CB', 'S', 'COACH'].forEach(posKey => {
            const best = findBestByPos(posKey)[0];
            if (best) {
                newRoster[posKey] = best.id;
                usedIds.add(best.id);
            }
        });

        // Special handling for WRs
        const bestWRs = findBestByPos('WR', 2);
        if (bestWRs[0]) {
            newRoster.WR1 = bestWRs[0].id;
            usedIds.add(bestWRs[0].id);
        }
        if (bestWRs[1]) {
            newRoster.WR2 = bestWRs[1].id;
            usedIds.add(bestWRs[1].id);
        }

        // Save and refresh
        store.state.playerCollection.activeRoster = newRoster;
        store.recalcStats();
        store.save();
        this.renderTeamView();
        this.updateHeader(); // Update team OVR in header if needed
        
        if (window.playSfx) window.playSfx('win');
        showToast('Roster optimized for maximum OVR!', 'success');
    },

    addCustomLogo() {
        const urlInput = document.getElementById('custom-logo-url');
        const url = urlInput.value.trim();
        if (!url) return;

        // Basic validation
        if (!url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) && !url.startsWith('data:image')) {
            showToast('Please enter a valid image URL', 'error');
            return;
        }

        const newLogo = {
            id: 'custom_' + Date.now(),
            name: 'Custom Logo',
            url: url,
            colors: { primary: '#ffffff', secondary: '#000000', accent: '#cccccc' }
        };

        if (!store.state.userTeam.customLogos) store.state.userTeam.customLogos = [];
        store.state.userTeam.customLogos.push(newLogo);
        store.save();
        
        urlInput.value = '';
        this.renderTeamView();
        showToast('Custom logo added!', 'success');
    },

    selectLogo(logoObj) {
        store.updateTeam({ logo: logoObj });
        this.renderTeamView();
    },

    renderShopView() {
        const s = store.state;
        const shopGrid = document.getElementById('shop-grid');
        if (!shopGrid) return;
        
        const balance = MinigameSync.getBalance();
        
        // Premium Items Section
        let html = this.renderPremiumItems(balance);
        
        // Legends Section (grouped by position)
        html += this.renderLegendsShop(balance);
        
        shopGrid.innerHTML = html;
    },

    renderPremiumItems(balance) {
        const stone = ASSETS.items.ascensionStone;
        const canAffordStone = balance >= stone.price;
        const ownedStones = store.state.playerCollection?.evolutionStones || 0;

        return `
            <div class="shop-category">
                <h3>💎 Premium Items</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
                    Unlock ultimate power for your players
                </p>
            </div>
            <div class="shop-item" style="border: 2px solid var(--primary); box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);">
                <div class="shop-img-container" style="background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(185,242,255,0.1)); padding: 20px;">
                    <img src="${stone.url}" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 15px var(--primary));">
                </div>
                <div class="shop-details">
                    <div class="shop-type" style="color: var(--primary);">⚡ ASCENSION ITEM</div>
                    <div class="shop-title">${stone.name}</div>
                    <div class="shop-desc">${stone.desc}</div>
                    <div class="shop-bonus" style="color: var(--primary); background: rgba(255,215,0,0.1); padding: 0.5rem; border-radius: 8px; margin: 1rem 0;">
                        <i class="fas fa-gem"></i> Owned: ${ownedStones}
                    </div>
                    <button class="btn-buy ${!canAffordStone ? 'disabled' : ''}" 
                            onclick="App.buyAscensionStone()" 
                            ${!canAffordStone ? 'disabled' : ''}
                            style="background: linear-gradient(to right, var(--primary), #fbbf24); font-weight: 800;">
                        ${canAffordStone ? `🛒 Buy ${stone.price.toLocaleString()} 🪙` : `❌ Need ${stone.price.toLocaleString()} 🪙`}
                    </button>
                </div>
            </div>
        `;
    },

    renderLegendsShop(balance) {
        const typeNames = {
            'QB': 'Quarterbacks',
            'RB': 'Running Backs',
            'WR': 'Wide Receivers',
            'TE': 'Tight Ends',
            'LB': 'Linebackers',
            'CB': 'Cornerbacks',
            'S': 'Safeties',
            'COACH': 'Head Coaches'
        };

        // Group legends by position
        const groupedLegends = {};
        Object.keys(typeNames).forEach(type => groupedLegends[type] = []);
        
        Object.values(ASSETS.legends).forEach(legend => {
            if (groupedLegends[legend.type]) {
                groupedLegends[legend.type].push(legend);
            }
        });

        let html = '';
        Object.entries(groupedLegends).forEach(([type, legends]) => {
            if (legends.length === 0) return;
            
            html += `<div class="shop-category"><h3>${typeNames[type]}</h3></div>`;
            
            legends.forEach(legend => {
                const isOwned = store.state.inventory.includes(legend.id);
                const canAfford = balance >= legend.price;
                
                html += `
                    <div class="shop-item ${isOwned ? 'owned' : ''}">
                        <div class="shop-img-container">
                            <div class="legend-icon">${legend.icon}</div>
                        </div>
                        <div class="shop-details">
                            <div class="shop-type">${type}</div>
                            <div class="shop-title">${legend.name}</div>
                            <div class="shop-desc">${legend.desc}</div>
                            <div class="shop-bonus">Bonus: ${legend.bonus.type} ${(legend.bonus.value * 100 - 100).toFixed(0)}%</div>
                            ${isOwned ? 
                                '<button class="btn-buy owned" disabled>OWNED ✓</button>' :
                                `<button class="btn-buy ${!canAfford ? 'disabled' : ''}" 
                                         onclick="App.buyLegend('${legend.id}')" 
                                         ${!canAfford ? 'disabled' : ''}>
                                    ${canAfford ? `Buy ${legend.price.toLocaleString()} 🪙` : `Need ${legend.price.toLocaleString()} 🪙`}
                                </button>`
                            }
                        </div>
                    </div>
                `;
            });
        });
        
        return html;
    },

    buyAscensionStone() {
        const stone = ASSETS.items.ascensionStone;
        
        try {
            if (typeof MinigameSync === 'undefined' || !MinigameSync.deductCoins) {
                showToast('Payment system not available', 'error');
                return;
            }

            if (MinigameSync.deductCoins(stone.price, `Purchased ${stone.name}`, { type: 'item_purchase', itemId: stone.id })) {
                if (!store.state.playerCollection.evolutionStones) {
                    store.state.playerCollection.evolutionStones = 0;
                }
                store.state.playerCollection.evolutionStones++;
                store.save();
                
                showToast(`✨ Acquired ${stone.name}! You now have ${store.state.playerCollection.evolutionStones} stone(s).`, 'success');
                if (window.playSfx) window.playSfx('win');
                
                this.renderShopView();
                this.updateHeader();
            } else {
                showToast('Insufficient coins!', 'error');
            }
        } catch (e) {
            console.error('Purchase error:', e);
            showToast('Purchase failed. Please try again.', 'error');
        }
    },

    buyLegend(legendId) {
        if (store.buyItem(legendId)) {
            if (window.showNotification) {
                showNotification(`✅ ${ASSETS.legends[legendId].name} acquired!`, 'success');
            } else {
                alert(`✅ ${ASSETS.legends[legendId].name} acquired!`);
            }
            this.renderShopView();
            this.updateHeader();
        } else {
            if (window.showNotification) {
                showNotification('❌ Not enough coins!', 'error');
            } else {
                alert('❌ Not enough coins!');
            }
        }
    },

    // --- PLAYER PROGRESSION METHODS ---

    renderPlayerCard(player, compact = false) {
        if (!player) return '';
        
        const level = player.instance ? player.instance.level : 1;
        const xp = player.instance ? player.instance.xp : 0;
        const xpProgress = (xp % 500) / 500 * 100;
        const evolvedClass = player.isEvolved ? 'evolved' : '';
        const ascendedClass = player.isAscended ? 'ascended' : '';
        
        // Check if starter
        const activeRoster = store.state.playerCollection?.activeRoster || {};
        const isStarter = Object.values(activeRoster).includes(player.id);
        const starterBadge = isStarter ? '<div class="starter-badge">STARTER</div>' : '';

        if (compact) {
            return `
                <div class="player-card tier-${player.tier} ${evolvedClass} ${ascendedClass}" style="max-width: 250px; margin: 0 auto;">
                    <div class="player-card-header">
                        ${starterBadge}
                        ${player.isAscended ? '<div class="evolution-badge" style="background: linear-gradient(to right, #b9f2ff, #60a5fa);"><i class="fas fa-crown"></i> ASCENDED</div>' : player.isEvolved ? '<div class="evolution-badge"><i class="fas fa-bolt"></i> EVOLVED</div>' : ''}
                        <div class="player-level-badge">LVL ${level}</div>
                        <div class="player-tier-badge tier-${player.tier}">${player.tier.toUpperCase()}</div>
                        <div class="player-overall" style="font-size: 3rem;">${player.boostedOverall}</div>
                        <div class="player-position" style="font-size: 0.8rem;">${player.position}</div>
                        <div class="player-name" style="font-size: 1rem;">${player.name}</div>
                    </div>
                </div>
            `;
        }

        const stats = Object.entries(player.boostedStats);
        
        return `
            <div class="player-card tier-${player.tier} ${evolvedClass} ${ascendedClass}">
                <div class="player-card-header">
                    ${starterBadge}
                    ${player.isAscended ? '<div class="evolution-badge" style="background: linear-gradient(to right, #b9f2ff, #60a5fa);"><i class="fas fa-crown"></i> ASCENDED</div>' : player.isEvolved ? '<div class="evolution-badge"><i class="fas fa-bolt"></i> EVOLVED</div>' : ''}
                    <div class="player-level-badge">LVL ${level}</div>
                    <div class="player-tier-badge tier-${player.tier}">${player.tier.toUpperCase()}</div>
                    <div class="player-overall">${player.boostedOverall}</div>
                    <div class="player-position">${player.position}</div>
                    <div class="player-name">${player.name}</div>
                </div>
                <div class="player-stats">
                    ${stats.map(([key, val]) => `
                        <div class="stat-bar">
                            <span class="stat-label-text">${key}</span>
                            <span class="stat-value">${val}</span>
                        </div>
                    `).join('')}
                    <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                            <span>Level ${level}${level >= 20 && !player.isAscended ? ' (MAX)' : ''}</span>
                            <span>${level >= 20 && !player.isAscended ? 'Capped' : `${xp % 500} / 500 XP`}</span>
                        </div>
                        <div style="background: rgba(0,0,0,0.3); height: 6px; border-radius: 3px; overflow: hidden;">
                            <div style="background: ${player.isAscended ? '#b9f2ff' : 'var(--primary)'}; height: 100%; width: ${level >= 20 && !player.isAscended ? '100' : xpProgress}%;"></div>
                        </div>
                    </div>
                    ${level >= 20 && !player.isAscended ? `
                        <div style="margin-top: 8px; padding: 6px; background: rgba(255,215,0,0.1); border: 1px solid var(--primary); border-radius: 6px; text-align: center;">
                            <div style="font-size: 0.7rem; font-weight: 800; color: var(--primary); margin-bottom: 4px;">
                                <i class="fas fa-crown"></i> READY TO ASCEND!
                            </div>
                            <div style="font-size: 0.65rem; color: var(--text-muted);">Open Training to unlock</div>
                        </div>
                    ` : ''}
                    <div style="display: flex; gap: 5px; margin-top: 10px;">
                        <button class="btn-buy" style="font-size: 0.7rem; padding: 4px;" onclick="event.stopPropagation(); App.openTrainingModal('${player.id}')">
                            <i class="fas fa-dumbbell"></i> ${level >= 20 && !player.isAscended ? 'Ascend' : 'Train'}
                        </button>
                        <button class="btn-buy" style="font-size: 0.7rem; padding: 4px; background: var(--primary); color: #000;" onclick="event.stopPropagation(); App.sharePlayer('${player.id}')">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                        <button class="btn-buy" style="font-size: 0.7rem; padding: 4px; background: var(--danger); color: white;" onclick="event.stopPropagation(); App.burnPlayer('${player.id}')">
                            <i class="fas fa-fire"></i> Retire
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    openTrainingModal(playerId) {
        const player = playerManager.getPlayer(playerId);
        if (!player) return;

        const modal = document.getElementById('training-modal');
        const content = document.getElementById('training-modal-content');
        const trainingXP = store.state.playerCollection.trainingXP || 0;
        const stones = store.state.playerCollection.evolutionStones || 0;

        content.innerHTML = `
            <div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap; justify-content: center;">
                <div style="width: 250px;">
                    ${this.renderPlayerCard(player, true)}
                </div>
                <div style="flex: 1; min-width: 300px;">
                    <h3 style="color: var(--primary); margin-bottom: 1rem;">Training Facility</h3>
                    
                    ${player.isAscended ? `
                        <div class="stat-badge" style="background: rgba(185, 242, 255, 0.1); border-color: #b9f2ff; margin-bottom: 1rem;">
                            <i class="fas fa-crown"></i> ASCENDED WARRIOR (LVL 20+ UNLOCKED)
                        </div>
                    ` : ''}

                    <p style="margin-bottom: 1.5rem; color: var(--text-muted);">Spend Training XP to increase player attributes. Each level increases all stats by +2.</p>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 2rem;">
                        <div class="stat-badge">
                            <img src="https://rosebud.ai/assets/XP booster coin.png?BrOk" style="width: 20px;">
                            <span>${trainingXP.toLocaleString()} TXP</span>
                        </div>
                        <div class="stat-badge">
                            <img src="https://rosebud.ai/assets/Ultimate sports championship diamond ring.png?1Esq" style="width: 20px;">
                            <span>${stones} Stones</span>
                        </div>
                    </div>

                    <div style="display: grid; gap: 1rem;">
                        <button class="btn-buy" onclick="App.trainPlayer('${player.id}', 100)" ${trainingXP < 100 ? 'disabled' : ''}>
                            Light Session (+100 XP) - 100 TXP
                        </button>
                        <button class="btn-buy" onclick="App.trainPlayer('${player.id}', 500)" ${trainingXP < 500 ? 'disabled' : ''}>
                            Intense Drill (+500 XP) - 500 TXP
                        </button>
                        <button class="btn-buy" onclick="App.trainPlayer('${player.id}', 2500)" ${trainingXP < 2500 ? 'disabled' : ''}>
                            Elite Camp (+2500 XP) - 2500 TXP
                        </button>

                        ${player.instance.level >= 20 && !player.isAscended ? `
                            <div style="margin-top: 1rem; padding: 1rem; border: 2px solid var(--primary); border-radius: 12px; background: rgba(255,215,0,0.05);">
                                <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Level Cap Reached!</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">Use an Ascension Stone to unlock Level 20+ and gain a permanent +10 OVR boost.</p>
                                <button class="btn-buy" style="background: linear-gradient(to right, #fbbf24, #ef4444); color: white;" 
                                        onclick="App.ascendPlayer('${player.id}')" ${stones < 1 ? 'disabled' : ''}>
                                    ASCEND PLAYER
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    closeTrainingModal() {
        document.getElementById('training-modal').classList.remove('active');
    },

    trainPlayer(playerId, xpAmount) {
        const result = playerManager.trainPlayer(playerId, xpAmount);
        if (result.success) {
            if (result.leveledUp) {
                showToast(`Level Up! New Level: ${result.newLevel}`, 'success');
                if (window.playSfx) window.playSfx('win');
            } else if (result.capped) {
                showToast('Level 20 Cap Reached! Use an Ascension Stone to continue.', 'info');
            } else {
                showToast(`Training complete!`, 'success');
                if (window.playSfx) window.playSfx('click');
            }
            this.updateHeader();
            this.openTrainingModal(playerId); // Refresh modal
            this.renderCollectionView(); // Refresh background view
        } else {
            showToast(result.error, 'error');
        }
    },

    ascendPlayer(playerId) {
        const result = playerManager.ascendPlayer(playerId);
        if (result.success) {
            showToast('ASCENSION COMPLETE! Your player has transcended their limits! +10 OVR Boost!', 'success');
            if (window.playSfx) window.playSfx('win');
            this.updateHeader();
            this.openTrainingModal(playerId); // Refresh modal
            this.renderCollectionView(); // Refresh background view
            this.renderTeamView(); // Refresh team stats if viewing
            
            // Update achievement stats
            store.updateAchievementStat('totalBetsWon', 1); // Track as milestone
        } else {
            showToast(result.error, 'error');
        }
    },

    sharePlayer(playerId) {
        const player = playerManager.getPlayer(playerId);
        if (!player) {
            showToast('Player not found', 'error');
            return;
        }

        const shareManager = window.socialShareManager;
        if (!shareManager) {
            showToast('Share feature not available', 'error');
            console.error('SocialShareManager not initialized');
            return;
        }

        const statusText = player.isAscended ? 'ASCENDED' : player.isEvolved ? 'EVOLVED' : player.tier.toUpperCase();
        
        shareManager.openShare({
            type: 'player',
            text: `Check out my ${statusText} ${player.name} in Ultimate Sports AI! OVR: ${player.boostedOverall} | Level: ${player.instance ? player.instance.level : 1}`,
            details: {
                name: player.name,
                overall: player.boostedOverall,
                tier: player.tier,
                level: player.instance ? player.instance.level : 1,
                position: player.position,
                isEvolved: player.isEvolved,
                isAscended: player.isAscended
            }
        });
    },

    shareRoster() {
        const s = store.state;
        
        if (!s.playerCollection || !s.playerCollection.activeRoster) {
            showToast('No roster to share', 'error');
            return;
        }

        const activeRoster = s.playerCollection.activeRoster;
        const players = Object.entries(activeRoster)
            .map(([pos, id]) => {
                if (!id) return null;
                const p = playerManager.getPlayer(id);
                return p ? { name: p.name, position: pos, overall: p.boostedOverall, tier: p.tier } : null;
            })
            .filter(Boolean);

        if (players.length === 0) {
            showToast('Roster is empty. Add players first!', 'error');
            return;
        }

        const shareManager = window.socialShareManager;
        if (!shareManager) {
            showToast('Share feature not available', 'error');
            console.error('SocialShareManager not initialized');
            return;
        }

        const logoUrl = s.userTeam.logo ? (s.userTeam.logo.url || s.userTeam.logo) : ASSETS.logos[0].url;

        shareManager.openShare({
            type: 'roster',
            text: `My team "${s.userTeam.name}" is dominating in Ultimate Sports AI! 🏆 OFF: ${s.userTeam.stats.offense} | DEF: ${s.userTeam.stats.defense}`,
            details: {
                teamName: s.userTeam.name || 'My Ultimate Team',
                logoUrl: logoUrl,
                offense: s.userTeam.stats.offense || 75,
                defense: s.userTeam.stats.defense || 75,
                players: players
            }
        });
    },

    burnPlayer(playerId) {
        const player = playerManager.getPlayer(playerId);
        if (!player) return;

        if (confirm(`Are you sure you want to retire ${player.name}? This card will be destroyed and converted into Training XP.`)) {
            const result = playerManager.burnPlayer(playerId);
            if (result.success) {
                showToast(`Retired ${player.name}. Gained ${result.xpGained} TXP!`, 'success');
                if (window.playSfx) window.playSfx('click');
                this.updateHeader();
                this.renderCollectionView();
                this.renderTeamView(); // In case they were looking at team
            } else {
                showToast(result.error, 'error');
            }
        }
    },

    getPackProbabilityDisplay(pack) {
        const tierColors = {
            bronze: '#cd7f32',
            silver: '#c0c0c0',
            gold: '#ffd700',
            diamond: '#b9f2ff'
        };

        const tierIcons = {
            bronze: '🥉',
            silver: '🥈',
            gold: '🥇',
            diamond: '💎'
        };

        // Build guarantee display
        let guaranteeHTML = '';
        if (pack.guaranteed && pack.guaranteed.length > 0) {
            const guarantees = pack.guaranteed.map(tier => 
                `<span style="color: ${tierColors[tier]}; font-weight: bold;">${tierIcons[tier]} ${tier.toUpperCase()}</span>`
            ).join(', ');
            guaranteeHTML = `
                <div style="margin: 0.75rem 0; padding: 0.5rem; background: rgba(76, 175, 80, 0.15); border-radius: 6px; border-left: 3px solid var(--success);">
                    <strong style="color: var(--success);"><i class="fas fa-check-circle"></i> Guaranteed:</strong> ${guarantees}
                </div>
            `;
        }

        // Calculate total cards info
        const totalCards = pack.slots || (pack.guaranteed ? pack.guaranteed.length : 3);
        const cardsHTML = `
            <div style="text-align: center; margin: 0.5rem 0; padding: 0.5rem; background: rgba(59, 130, 246, 0.1); border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.3);">
                <i class="fas fa-layer-group" style="color: var(--primary);"></i> <strong style="color: var(--primary);">${totalCards}</strong> card${totalCards > 1 ? 's' : ''} per pack
            </div>
        `;

        // Build probability bars
        let probabilityHTML = '';
        if (pack.probabilities) {
            const probEntries = Object.entries(pack.probabilities);
            
            // Calculate expected value info
            const expectedDiamond = pack.probabilities.diamond ? (pack.probabilities.diamond * 100).toFixed(1) : 0;
            const expectedGold = pack.probabilities.gold ? (pack.probabilities.gold * 100).toFixed(1) : 0;
            
            let oddsInfo = '';
            if (expectedDiamond > 0) {
                const diamondIn = Math.ceil(100 / parseFloat(expectedDiamond));
                oddsInfo = `<div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; font-style: italic;">
                    💎 ~1 Diamond every ${diamondIn} packs
                </div>`;
            }

            probabilityHTML = `
                <div style="margin: 0.75rem 0; padding: 0.5rem; background: rgba(255,255,255,0.03); border-radius: 6px;">
                    <div style="font-size: 0.85rem; margin-bottom: 0.5rem; color: #ffffff; font-weight: 600;">
                        <i class="fas fa-chart-pie"></i> Drop Rates (per card):
                    </div>
                    ${oddsInfo}
                    ${probEntries.map(([tier, prob]) => {
                        const percentage = (prob * 100).toFixed(1);
                        return `
                            <div style="margin: 0.5rem 0;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                    <span style="font-size: 0.85rem; color: ${tierColors[tier]}; font-weight: 500;">
                                        ${tierIcons[tier]} ${tier.charAt(0).toUpperCase() + tier.slice(1)}
                                    </span>
                                    <span style="font-size: 0.9rem; font-weight: bold; color: ${tierColors[tier]}; text-shadow: 0 0 10px ${tierColors[tier]}40;">
                                        ${percentage}%
                                    </span>
                                </div>
                                <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.4); border-radius: 4px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);">
                                    <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, ${tierColors[tier]}, ${tierColors[tier]}cc); transition: width 0.3s ease; box-shadow: 0 0 8px ${tierColors[tier]}60;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // Add odds transparency note
        const transparencyNote = `
            <div style="margin-top: 0.5rem; padding: 0.4rem; background: rgba(255,255,255,0.02); border-radius: 4px; font-size: 0.7rem; color: var(--text-muted); text-align: center;">
                <i class="fas fa-info-circle"></i> Fair play guaranteed - All odds disclosed
            </div>
        `;

        return guaranteeHTML + cardsHTML + probabilityHTML + transparencyNote;
    },

    renderPacksView() {
        const container = document.getElementById('packs-container');
        if (!container || typeof PACK_TYPES === 'undefined') {
            if (container) container.innerHTML = '<div class="empty-state">Pack data not found.</div>';
            return;
        }

        const balance = MinigameSync.getBalance();
        const packImages = {
            'starter': ASSETS.packs.starter,
            'pro': ASSETS.packs.pro,
            'elite': ASSETS.packs.elite,
            'legend': ASSETS.packs.legend
        };

        container.innerHTML = Object.values(PACK_TYPES).map(pack => `
            <div class="shop-item">
                <div class="shop-img-container" style="background: none; height: 300px; padding: 10px;">
                    <img src="${packImages[pack.id]}" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <div class="shop-details">
                    <div class="shop-title">${pack.name}</div>
                    <div class="shop-desc">${pack.description}</div>
                    ${this.getPackProbabilityDisplay(pack)}
                    <button class="btn-buy" onclick="App.openPack('${pack.id}')" ${balance < pack.cost ? 'disabled' : ''}>
                        ${balance >= pack.cost ? `Open ${pack.cost.toLocaleString()} 🪙` : `Need ${pack.cost.toLocaleString()} 🪙`}
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderHistoryView() {
        if (!playerManager) return;
        const stats = playerManager.getPackStats();
        const history = store.state.playerCollection.packHistory || [];

        // Render Stats Dashboard
        const statsContainer = document.getElementById('history-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${stats.totalPacks}</div>
                    <div class="stat-label">Packs Opened</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalSpent.toLocaleString()} 🪙</div>
                    <div class="stat-label">Total Spent</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.tierCounts.diamond}</div>
                    <div class="stat-label">Diamonds Found</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="font-size: 1.2rem;">${stats.bestPull ? `${stats.bestPull.name} (${stats.bestPull.overall})` : 'N/A'}</div>
                    <div class="stat-label">Best Pull Ever</div>
                </div>
            `;
        }

        // Render History List
        const listContainer = document.getElementById('history-list');
        if (listContainer) {
            if (history.length === 0) {
                listContainer.innerHTML = '<div class="empty-state">No pack opening history yet. Open some packs in the store!</div>';
                return;
            }

            listContainer.innerHTML = history.map(entry => {
                const date = new Date(entry.timestamp).toLocaleString();
                const cardSummary = entry.cards.map(card => {
                    const color = card.tier === 'diamond' ? '#b9f2ff' : 
                                 card.tier === 'gold' ? '#ffd700' : 
                                 card.tier === 'silver' ? '#c0c0c0' : '#cd7f32';
                    return `<span style="color: ${color}; font-weight: bold;">${card.name} (${card.overall})</span>`;
                }).join(', ');

                return `
                    <div class="history-item" style="background: var(--bg-card); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
                            <span><i class="fas fa-box"></i> ${entry.packName}</span>
                            <span>${date}</span>
                        </div>
                        <div style="line-height: 1.5;">
                            ${cardSummary}
                        </div>
                        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--success);">
                            <i class="fas fa-coins"></i> Spent: ${entry.cost.toLocaleString()} 🪙
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    renderCollectionView(tier = null, btn = null) {
        if (!playerManager) return;
        
        // Handle persistent tier selection
        if (tier) this.currentCollectionTier = tier;
        const currentTier = this.currentCollectionTier || 'all';
        
        if (btn) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        const posFilter = document.getElementById('collection-pos-filter');
        const currentPos = posFilter ? posFilter.value : 'all';
        
        const sortFilter = document.getElementById('collection-sort');
        const currentSort = sortFilter ? sortFilter.value : 'overall-desc';

        const players = playerManager.getAllOwnedPlayers();
        
        const filtered = players.filter(p => {
            const tierMatch = currentTier === 'all' || p.tier === currentTier;
            const posMatch = currentPos === 'all' || p.position === currentPos;
            return tierMatch && posMatch;
        });

        // Sort the filtered players
        filtered.sort((a, b) => {
            const [sortBy, direction] = currentSort.split('-');
            let comparison = 0;
            
            if (sortBy === 'overall') {
                comparison = (a.boostedOverall || a.overall) - (b.boostedOverall || b.overall);
            } else if (sortBy === 'level') {
                const aLevel = a.instance ? a.instance.level : 1;
                const bLevel = b.instance ? b.instance.level : 1;
                comparison = aLevel - bLevel;
            } else if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            }
            
            return direction === 'desc' ? -comparison : comparison;
        });

        const stats = playerManager.getCollectionStats();

        if (document.getElementById('collection-percentage')) document.getElementById('collection-percentage').textContent = `${stats.percentage}%`;
        if (document.getElementById('collection-count')) document.getElementById('collection-count').textContent = stats.owned;
        if (document.getElementById('packs-opened')) document.getElementById('packs-opened').textContent = stats.packsOpened;

        const grid = document.getElementById('collection-grid');
        if (!grid) return;
        
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state">No players match these filters.</div>';
            return;
        }

        grid.innerHTML = filtered.map(player => this.renderPlayerCard(player)).join('');
    },

    filterCollection(tier, btn) {
        this.renderCollectionView(tier, btn);
    },

    renderAIOpponents() {
        if (!aiSystem) return;

        const container = document.getElementById('ai-opponents-grid');
        if (!container) return;

        const availableOpponents = aiSystem.getAllAvailableOpponents();
        const progress = aiSystem.getProgress();

        if (availableOpponents.length === 0) {
            container.innerHTML = '<div class="empty-state">No AI opponents available yet.</div>';
            return;
        }

        container.innerHTML = availableOpponents.map(opp => {
            const record = aiSystem.getOpponentRecord(opp.id);
            const difficultyColors = {
                rookie: '#4ade80',
                pro: '#f59e0b',
                allstar: '#a855f7',
                legend: '#ef4444'
            };

            return `
                <div class="shop-item" style="border-color: ${difficultyColors[opp.difficulty]};">
                    <div class="shop-img-container" style="background: linear-gradient(135deg, ${opp.colors.primary}, ${opp.colors.secondary});">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: white;">
                            <i class="fas fa-robot" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                            <div style="font-size: 2rem; font-weight: 900;">${opp.overall}</div>
                        </div>
                    </div>
                    <div class="shop-details">
                        <div class="shop-type" style="color: ${difficultyColors[opp.difficulty]};">${opp.difficulty.toUpperCase()}</div>
                        <div class="shop-title">${opp.name}</div>
                        <div style="font-size: 0.85rem; margin: 0.5rem 0;">${opp.teamName}</div>
                        <div class="shop-desc" style="font-style: italic;">"${opp.taunt}"</div>
                        <div style="display: flex; justify-content: space-between; margin: 1rem 0; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 4px;">
                            <span>OFF: ${opp.stats.offense}</span>
                            <span>DEF: ${opp.stats.defense}</span>
                        </div>
                        <div style="margin-bottom: 1rem; font-size: 0.9rem;">
                            <i class="fas fa-trophy" style="color: var(--primary);"></i> 
                            Wins: ${record} | 
                            <i class="fas fa-coins" style="color: var(--primary);"></i> 
                            ${opp.reward} reward
                        </div>
                        <button class="btn-buy" onclick="App.challengeAI('${opp.id}')">
                            <i class="fas fa-fist-raised"></i> Challenge
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Show progress
        const progressHtml = `
            <div class="card" style="grid-column: 1 / -1; text-align: center;">
                <h3><i class="fas fa-chart-line"></i> AI Challenge Progress</h3>
                <div style="margin-top: 1rem; display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap;">
                    <div class="stat-badge">
                        <i class="fas fa-trophy"></i>
                        <span>${progress.defeated} / ${progress.total}</span> Defeated
                    </div>
                    <div class="stat-badge">
                        <i class="fas fa-unlock"></i>
                        <span>${progress.unlocked}</span> Unlocked
                    </div>
                    <div class="stat-badge">
                        <i class="fas fa-star"></i>
                        <span>${progress.totalVictories}</span> Total Wins
                    </div>
                    <div class="stat-badge">
                        <i class="fas fa-percentage"></i>
                        <span>${progress.percentage}%</span> Complete
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = progressHtml + container.innerHTML;
    },

    challengeAI(opponentId) {
        if (!aiSystem) return;

        const opponent = aiSystem.getOpponent(opponentId);
        if (!opponent) {
            alert('Opponent not found!');
            return;
        }

        // Convert AI opponent to game format
        const aiTeam = {
            id: opponent.id,
            name: opponent.teamName,
            logo: opponent.logo,
            color: opponent.colors.primary,
            stats: {
                offense: opponent.stats.offense,
                defense: opponent.stats.defense
            },
            roster: [],
            isAI: true,
            aiData: opponent
        };

        const userTeam = store.state.userTeam;

        // Start game
        this.navigateTo('game');
        document.getElementById('matchmaking-screen').style.display = 'none';
        document.getElementById('multiplayer-lobby').style.display = 'none';

        document.getElementById('game-home-name').textContent = userTeam.name;
        document.getElementById('game-away-name').textContent = aiTeam.name;
        document.getElementById('game-home-score').textContent = '0';
        document.getElementById('game-away-score').textContent = '0';

        currentGame = new GameEngine(userTeam, aiTeam, { wager: 0, isAI: true });
        this.updateGameUI();
    },

    openPack(packType) {
        const result = playerManager.openPack(packType);
        
        if (!result.success) {
            alert(result.error || 'Failed to open pack');
            return;
        }

        this.updateHeader();
        this.showPackOpeningAnimation(result);
    },

    showPackOpeningAnimation(result) {
        const modal = document.getElementById('pack-opening-modal');
        const container = document.getElementById('pack-reveal-container');
        const title = document.getElementById('pack-title');

        title.textContent = `${PACK_TYPES[result.packType].name} - Opened!`;
        
        // Clear previous
        container.innerHTML = '';

        // Animate cards appearing
        result.cards.forEach((card, index) => {
            setTimeout(() => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card-flip';
                cardDiv.innerHTML = this.renderPlayerCard(card);
                
                if (card.isDuplicate) {
                    const badge = document.createElement('div');
                    badge.style.cssText = 'position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;';
                    badge.textContent = `DUPLICATE +${card.refund} COINS`;
                    cardDiv.querySelector('.player-card').appendChild(badge);
                } else if (card.isNew) {
                    const badge = document.createElement('div');
                    badge.style.cssText = 'position: absolute; top: 10px; left: 10px; background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;';
                    badge.textContent = 'NEW!';
                    cardDiv.querySelector('.player-card').appendChild(badge);
                }

                container.appendChild(cardDiv);

                // Play sound
                if (window.playSfx) {
                    if (card.tier === 'diamond' || card.tier === 'gold') {
                        window.playSfx('win');
                    } else {
                        window.playSfx('click');
                    }
                }
            }, index * 400);
        });

        modal.classList.add('active');
    },

    closePackModal() {
        const modal = document.getElementById('pack-opening-modal');
        modal.classList.remove('active');
        this.renderPacksView(); // Refresh pack view
        this.renderCollectionView(); // Refresh collection
    },

    openPlayerSelect(position) {
        currentPlayerSelectPosition = position;
        const modal = document.getElementById('player-select-modal');
        const grid = document.getElementById('player-select-grid');
        const title = document.getElementById('select-modal-title');

        // Get position name
        const posNames = {
            QB: 'Quarterback',
            RB: 'Running Back',
            WR1: 'Wide Receiver 1',
            WR2: 'Wide Receiver 2',
            TE: 'Tight End',
            LB: 'Linebacker',
            CB: 'Cornerback',
            S: 'Safety',
            COACH: 'Head Coach'
        };
        title.textContent = `Select ${posNames[position]}`;

        // Get eligible players
        let eligiblePos = position;
        if (position === 'WR1' || position === 'WR2') eligiblePos = 'WR';
        
        const players = playerManager.getOwnedPlayersByPosition(eligiblePos);

        // Add "Remove Player" option if there's currently a player assigned
        const currentPlayer = store.state.playerCollection.activeRoster[position];
        let removeOption = '';
        if (currentPlayer) {
            removeOption = `
                <div class="card" style="padding: 2rem; text-align: center; border: 2px dashed var(--danger); cursor: pointer;" 
                     onclick="App.removePlayerFromRoster('${position}')">
                    <i class="fas fa-times-circle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--danger);">Remove Player</h3>
                    <p style="color: var(--text-muted);">Clear this position slot</p>
                </div>
            `;
        }

        if (players.length === 0 && !currentPlayer) {
            grid.innerHTML = '<div class="empty-state">No players available for this position. Open packs to unlock players!</div>';
        } else {
            grid.innerHTML = removeOption + players.map(player => {
                // Check if player is already assigned to THIS position
                const isAssigned = currentPlayer === player.id;
                const assignedClass = isAssigned ? 'style="opacity: 0.6; border: 3px solid var(--success);"' : '';
                
                return `
                    <div onclick="App.assignPlayer('${player.id}')" ${assignedClass}>
                        ${this.renderPlayerCard(player)}
                        ${isAssigned ? '<div style="position: absolute; top: 10px; right: 10px; background: var(--success); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">ACTIVE</div>' : ''}
                    </div>
                `;
            }).join('');
        }

        modal.classList.add('active');
    },

    closePlayerSelectModal() {
        document.getElementById('player-select-modal').classList.remove('active');
        currentPlayerSelectPosition = null;
    },

    assignPlayer(playerId) {
        if (!currentPlayerSelectPosition) return;

        const success = playerManager.setActiveRoster(currentPlayerSelectPosition, playerId);
        if (success) {
            this.closePlayerSelectModal();
            this.renderTeamView();
            this.updateHeader();
            if (window.playSfx) window.playSfx('click');
        }
        // Alert is handled inside setActiveRoster if it fails
    },

    removePlayerFromRoster(position) {
        if (!position) return;
        
        const confirmed = confirm('Remove this player from your active roster?');
        if (confirmed) {
            playerManager.removeFromRoster(position);
            this.closePlayerSelectModal();
            this.renderTeamView();
            this.updateHeader();
            if (window.playSfx) window.playSfx('click');
        }
    },

    // --- GAMEPLAY SYSTEM ---

    initMultiplayer(mode) {
        // Simulation of matchmaking
        const lobby = document.getElementById('multiplayer-lobby');
        const searching = document.getElementById('matchmaking-screen');
        
        const wagerInput = document.getElementById('wager-amount');
        const wager = mode === 'wager' ? parseInt(wagerInput.value) : 0;

        if (mode === 'wager') {
            if (!wager || isNaN(wager) || wager <= 0) {
                alert('Please enter a valid wager amount.');
                return;
            }
            
            if (!MinigameSync.canAfford(wager)) {
                alert(`Insufficient funds! You need ${wager} coins.`);
                return;
            }

            // Deduct wager immediately
            if (!MinigameSync.recordBet(wager)) {
                alert('Transaction failed. Please try again.');
                return;
            }
        }

        lobby.style.display = 'none';
        searching.style.display = 'flex';
        
        // Update header to show new balance
        this.updateHeader();

        setTimeout(() => {
            // Match found!
            const opponent = DEFAULT_TEAMS[Math.floor(Math.random() * DEFAULT_TEAMS.length)];
            this.startGame(opponent, wager);
        }, 2000);
    },

    startGame(opponent, wager) {
        this.navigateTo('game');
        document.getElementById('matchmaking-screen').style.display = 'none';
        document.getElementById('multiplayer-lobby').style.display = 'block'; // Reset for next time

        const userTeam = store.state.userTeam;
        
        // Setup headers
        document.getElementById('game-home-name').textContent = userTeam.name;
        document.getElementById('game-away-name').textContent = opponent.name;
        document.getElementById('game-home-score').textContent = '0';
        document.getElementById('game-away-score').textContent = '0';

        currentGame = new GameEngine(userTeam, opponent, { wager });
        this.updateGameUI();
    },

    callPlay(type) {
        if (!currentGame || currentGame.state.isFinished) return;
        
        // Apply formation modifier if set
        if (currentGame.formation) {
            currentGame.formationBonus = currentGame.formation;
        }
        
        const result = currentGame.simulatePlay({ type });
        this.renderPlayVisuals(result.lastPlay);
        this.updateGameUI();
        
        // Update coach advice
        this.updateCoachAdvice();
        
        if (result.isFinished) {
            this.endGame();
        }
    },

    setFormation(formation) {
        if (!currentGame) return;
        
        currentGame.formation = formation;
        
        const adviceElement = document.getElementById('coach-advice');
        if (adviceElement) {
            let advice = '';
            switch(formation) {
                case 'balanced':
                    advice = '⚖️ Balanced formation set';
                    break;
                case 'offensive':
                    advice = '⚡ Going aggressive! Higher risk, higher reward';
                    break;
                case 'defensive':
                    advice = '🛡️ Playing it safe. Reduced turnovers';
                    break;
            }
            adviceElement.textContent = advice;
            adviceElement.style.color = 'var(--success)';
            
            setTimeout(() => {
                adviceElement.textContent = '';
            }, 3000);
        }
        
        if (window.playSfx) window.playSfx('click');
    },

    updateCoachAdvice() {
        if (!currentGame) return;
        
        const adviceElement = document.getElementById('coach-advice');
        if (!adviceElement) return;
        
        const state = currentGame.state;
        const roster = store.state.playerCollection?.activeRoster || {};
        const coachId = roster.COACH;
        
        // Get coach from ASSETS
        const coach = coachId ? ASSETS.legends[coachId] : null;
        
        if (!coach) return;
        
        // Generate situational advice
        let advice = '';
        const down = state.down;
        const yardsToGo = state.yardsToGo;
        const scoreDiff = state.homeScore - state.awayScore;
        
        if (down === 3 && yardsToGo > 7) {
            advice = `${coach.icon} ${coach.name}: "Consider a pass play here"`;
        } else if (down === 1 && yardsToGo <= 10) {
            advice = `${coach.icon} ${coach.name}: "Establish the run!"`;
        } else if (scoreDiff < 0 && state.quarter >= 3) {
            advice = `${coach.icon} ${coach.name}: "We need points! Take chances"`;
        } else if (scoreDiff > 7 && state.quarter === 4) {
            advice = `${coach.icon} ${coach.name}: "Run clock, protect the lead"`;
        }
        
        if (advice && Math.random() > 0.5) { // 50% chance to show advice
            adviceElement.textContent = advice;
            adviceElement.style.color = 'var(--primary)';
        }
    },

    setDefensiveFocus(focus) {
        if (!currentGame) return;
        
        currentGame.defensiveFocus = focus;
        
        // Update UI buttons
        document.querySelectorAll('.defense-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.getElementById(`def-${focus}`);
        if (activeBtn) activeBtn.classList.add('active');
        
        const adviceElement = document.getElementById('coach-advice');
        if (adviceElement) {
            let advice = '';
            switch(focus) {
                case 'balanced':
                    advice = '⚖️ Defensive focus: Balanced';
                    break;
                case 'run':
                    advice = '🏃 Defensive focus: Stop the Run';
                    break;
                case 'pass':
                    advice = '🏈 Defensive focus: Stop the Pass';
                    break;
            }
            adviceElement.textContent = advice;
            adviceElement.style.color = 'var(--primary)';
            
            setTimeout(() => {
                adviceElement.textContent = '';
            }, 3000);
        }
        
        if (window.playSfx) window.playSfx('click');
    },

    updateGameUI() {
        if (!currentGame) return;
        const s = currentGame.state;
        
        document.getElementById('game-home-score').textContent = s.homeScore;
        document.getElementById('game-away-score').textContent = s.awayScore;
        document.getElementById('game-quarter').textContent = `Q${s.quarter}`;
        document.getElementById('game-down').textContent = `${this.getOrdinal(s.down)} & ${s.yardsToGo}`;
        
        // --- Weather Display ---
        let weatherDisplay = document.getElementById('game-weather');
        if (!weatherDisplay) {
            weatherDisplay = document.createElement('div');
            weatherDisplay.id = 'game-weather';
            weatherDisplay.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); padding: 5px 10px; border-radius: 4px; font-size: 0.9rem; border: 1px solid var(--border); display: flex; align-items: center; gap: 5px; z-index: 20;';
            const fieldDisplay = document.querySelector('.field-display');
            if (fieldDisplay) fieldDisplay.appendChild(weatherDisplay);
        }
        weatherDisplay.innerHTML = `<span>${s.weather.icon}</span> <span>${s.weather.name}</span>`;

        // --- Fatigue Display ---
        let fatigueDisplay = document.getElementById('game-fatigue');
        if (!fatigueDisplay) {
            fatigueDisplay = document.createElement('div');
            fatigueDisplay.id = 'game-fatigue';
            fatigueDisplay.style.cssText = 'position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); padding: 5px 10px; border-radius: 4px; font-size: 0.7rem; border: 1px solid var(--border); z-index: 20; min-width: 120px;';
            const fieldDisplay = document.querySelector('.field-display');
            if (fieldDisplay) fieldDisplay.appendChild(fatigueDisplay);
        }
        
        const offColor = s.offenseFatigue > 80 ? 'var(--danger)' : s.offenseFatigue > 50 ? '#f59e0b' : 'var(--success)';
        const defColor = s.defenseFatigue > 80 ? 'var(--danger)' : s.defenseFatigue > 50 ? '#f59e0b' : 'var(--success)';
        
        fatigueDisplay.innerHTML = `
            <div style="margin-bottom: 4px;">OFF FATIGUE: <span style="color:${offColor}">${Math.round(s.offenseFatigue)}%</span></div>
            <div style="background:rgba(0,0,0,0.5); height:4px; border-radius:2px; margin-bottom:6px;">
                <div style="background:${offColor}; width:${s.offenseFatigue}%; height:100%; border-radius:2px;"></div>
            </div>
            <div style="margin-bottom: 4px;">DEF FATIGUE: <span style="color:${defColor}">${Math.round(s.defenseFatigue)}%</span></div>
            <div style="background:rgba(0,0,0,0.5); height:4px; border-radius:2px;">
                <div style="background:${defColor}; width:${s.defenseFatigue}%; height:100%; border-radius:2px;"></div>
            </div>
        `;

        // Show last play
        const descEl = document.getElementById('game-desc');
        descEl.textContent = s.lastPlay ? s.lastPlay.description : 'Ready for kickoff';
        
        // Update Drive Log (if exists)
        let logContainer = document.getElementById('game-drive-log');
        if (!logContainer) {
            logContainer = document.createElement('div');
            logContainer.id = 'game-drive-log';
            logContainer.style.cssText = 'background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 0.85rem; max-height: 120px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);';
            const fieldDisplay = document.querySelector('.field-display');
            if (fieldDisplay) fieldDisplay.appendChild(logContainer);
        }
        
        if (s.drive && s.drive.length > 0) {
            logContainer.innerHTML = s.drive.map((p, i) => `
                <div style="opacity: ${i === s.drive.length - 1 ? 1 : 0.6}; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 2px;">
                    <i class="fas fa-play" style="font-size: 0.7rem; color: var(--primary); margin-right: 8px;"></i>${p}
                </div>
            `).reverse().join('');
        }

        // Ball position visual
        const marker = document.getElementById('field-ball-marker');
        marker.style.top = `${100 - s.ballOn}%`;
        
        // Special Teams buttons visibility
        const puntBtn = document.getElementById('punt-btn');
        const fgBtn = document.getElementById('fg-btn');
        if (puntBtn) puntBtn.style.display = s.down === 4 ? 'block' : 'none';
        if (fgBtn) fgBtn.style.display = (s.down === 4 && s.ballOn > 55) ? 'block' : 'none';

        // Apply team colors to marker
        const offense = s.possession === 'home' ? currentGame.home : currentGame.away;
        marker.style.background = offense.color || '#8b4513';
        marker.style.boxShadow = `0 0 10px ${offense.color || '#fff'}`;
    },

    getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    },

    renderPlayVisuals(play) {
        const canvas = document.getElementById('field-canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear previous
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Field Markings
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        
        // Yard lines
        for (let i = 1; i < 10; i++) {
            const y = (canvas.height / 10) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
            
            // Numbers (simple)
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText((50 - Math.abs(50 - i * 10)).toString(), 40, y + 8);
                ctx.fillText((50 - Math.abs(50 - i * 10)).toString(), canvas.width - 40, y + 8);
            }
        }

        if (!play) return;

        // Draw X's and O's path
        ctx.beginPath();
        ctx.strokeStyle = play.visualData.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.setLineDash([5, 5]);

        const path = play.visualData.path;
        ctx.moveTo(path[0].x * (canvas.width/100), path[0].y * (canvas.height/100));
        
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * (canvas.width/100), path[i].y * (canvas.height/100));
        }
        
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Draw endpoint X or O
        const end = path[path.length - 1];
        ctx.fillStyle = play.visualData.color;
        ctx.beginPath();
        ctx.arc(end.x * (canvas.width/100), end.y * (canvas.height/100), 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.shadowColor = play.visualData.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Play Sound
        if (window.playSfx) {
            if (play.description.includes('TOUCHDOWN')) window.playSfx('win');
            else if (play.description.includes('TURNOVER')) window.playSfx('lose');
            else window.playSfx('click');
        }
    },

    endGame() {
        const s = currentGame.state;
        const won = s.homeScore > s.awayScore;
        const wager = currentGame.config.wager || 0;
        const isAI = currentGame.config.isAI || false;
        const isSeason = currentGame.config.isSeason || false;
        let winnings = 0;
        let unlockedTier = null;
        
        if (won) {
            // Calculate winnings
            if (isAI && currentGame.away.aiData) {
                // AI opponent reward
                winnings = currentGame.away.aiData.reward;
                aiSystem.recordVictory(currentGame.away.id);
                unlockedTier = aiSystem.unlockNextTier(currentGame.away.aiData.difficulty);
            } else if (isSeason) {
                winnings = 250; // Season game win reward
                seasonLeague.advanceWeek(true, `${s.homeScore}-${s.awayScore}`);
            } else if (wager > 0) {
                winnings = wager * 2; // Double money
            } else {
                winnings = 100; // Standard reward for practice win
            }
            
            // Record win transaction
            try {
                if (typeof MinigameSync !== 'undefined') {
                    MinigameSync.recordWin(winnings, {
                        score: `${s.homeScore}-${s.awayScore}`,
                        opponent: currentGame.away.name,
                        wager: wager,
                        isAI: isAI,
                        isSeason: isSeason
                    });
                }
            } catch (e) {}
        } else {
            if (isSeason) {
                seasonLeague.advanceWeek(false, `${s.homeScore}-${s.awayScore}`);
            }
            // If lost and there was a wager, record the loss for stats
            if (wager > 0) {
                try {
                    if (typeof MinigameSync !== 'undefined') {
                        MinigameSync.recordLoss(wager, {
                            score: `${s.homeScore}-${s.awayScore}`,
                            opponent: currentGame.away.name
                        });
                    }
                } catch (e) {}
            }
        }

        // Award XP to players
        const levelUps = playerManager ? playerManager.awardGameXP() : [];
        
        // Award global Training XP
        const baseTXP = won ? 150 : 50;
        const difficultyBonus = (isAI && currentGame.away.aiData) ? 
            { rookie: 0, pro: 100, allstar: 250, legend: 1000 }[currentGame.away.aiData.difficulty] : 0;
        const totalTXP = baseTXP + difficultyBonus;
        
        if (store.state.playerCollection) {
            store.state.playerCollection.trainingXP = (store.state.playerCollection.trainingXP || 0) + totalTXP;
            store.save();
        }

        store.recordMatch({
            won,
            score: `${s.homeScore} - ${s.awayScore}`,
            opponent: currentGame.away.name,
            xp: won ? 100 : 25
        });

        setTimeout(() => {
            let message = `GAME OVER\n${won ? '🏆 VICTORY!' : '💔 DEFEAT'}\nScore: ${s.homeScore}-${s.awayScore}`;
            if (winnings) message += `\n\n💰 Won ${winnings} Coins!`;
            message += `\n🧪 Gained ${totalTXP} Training XP!`;
            if (unlockedTier) message += `\n\n🔓 Unlocked ${unlockedTier.toUpperCase()} Tier AI Opponents!`;
            if (levelUps && levelUps.length > 0) {
                message += '\n\n⭐ Player Level Up!';
                levelUps.forEach(lu => {
                    message += `\n${lu.player} → Level ${lu.level}`;
                });
            }
            
            alert(message);
            this.navigateTo('home');
            this.updateHeader(); // Ensure UI is fresh
            this.renderAIOpponents(); // Refresh AI opponents if unlocked new tier
        }, 1000);
    },

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const nav = btn.getAttribute('data-nav');
                if (nav) this.navigateTo(nav);
            });
        });

        const saveTeamBtn = document.getElementById('save-team-btn');
        if (saveTeamBtn) {
            saveTeamBtn.addEventListener('click', () => this.handleSaveTeam());
        }
    },

    handleSaveTeam() {
        const name = document.getElementById('team-name-input').value;
        const primaryColor = document.getElementById('team-primary-color').value;
        const secondaryColor = document.getElementById('team-secondary-color').value;

        store.updateTeam({
            name,
            primaryColor,
            secondaryColor
        });

        showToast('Team settings saved!', 'success');
        if (window.playSfx) window.playSfx('click');
        this.renderHomeView(); // Update home with new team name
    },

    render() {
        // Initial render logic if needed
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Setup Canvas
    const canvas = document.getElementById('field-canvas');
    if (canvas) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }
    
    window.addEventListener('resize', () => {
        if (canvas) {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        }
    });

    window.App = App; // Expose to window for inline onclick handlers
    App.init();
});

