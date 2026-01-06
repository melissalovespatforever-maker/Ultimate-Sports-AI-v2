/**
 * AI OPPONENT SYSTEM
 * Dynamic AI opponents with varying difficulty and personalities
 */

// ============================================
// AI OPPONENT DATABASE
// ============================================

const AI_OPPONENTS = {
    // ROOKIE DIFFICULTY (70-75 OVR)
    rookie_1: {
        id: 'rookie_1',
        name: 'The Underdog',
        difficulty: 'rookie',
        teamName: 'Rising Stars',
        personality: 'aggressive',
        overall: 72,
        stats: { offense: 70, defense: 74 },
        logo: 'https://rosebud.ai/assets/logo_rookie_1.png.webp?team1',
        playStyle: {
            runFrequency: 0.6,
            passFrequency: 0.3,
            deepFrequency: 0.1,
            aggression: 0.7
        },
        reward: 150,
        taunt: "Let's see what you got!",
        colors: { primary: '#4ade80', secondary: '#22c55e' }
    },
    rookie_2: {
        id: 'rookie_2',
        name: 'The Newcomer',
        difficulty: 'rookie',
        teamName: 'Fresh Squad',
        personality: 'balanced',
        overall: 73,
        stats: { offense: 72, defense: 74 },
        logo: 'https://rosebud.ai/assets/logo_rookie_2.png.webp?team2',
        playStyle: {
            runFrequency: 0.5,
            passFrequency: 0.4,
            deepFrequency: 0.1,
            aggression: 0.5
        },
        reward: 150,
        taunt: "Ready to learn the game!",
        colors: { primary: '#60a5fa', secondary: '#3b82f6' }
    },
    rookie_3: {
        id: 'rookie_3',
        name: 'The Learner',
        difficulty: 'rookie',
        teamName: 'Practice Squad',
        personality: 'defensive',
        overall: 71,
        stats: { offense: 68, defense: 74 },
        logo: 'https://rosebud.ai/assets/logo_rookie_3.png.webp?team3',
        playStyle: {
            runFrequency: 0.7,
            passFrequency: 0.2,
            deepFrequency: 0.1,
            aggression: 0.4
        },
        reward: 140,
        taunt: "Still learning the ropes...",
        colors: { primary: '#a78bfa', secondary: '#8b5cf6' }
    },

    // PRO DIFFICULTY (80-85 OVR)
    pro_1: {
        id: 'pro_1',
        name: 'The Veteran',
        difficulty: 'pro',
        teamName: 'Battle Hawks',
        personality: 'tactical',
        overall: 82,
        stats: { offense: 83, defense: 81 },
        logo: 'https://rosebud.ai/assets/logo_pro_1.png.webp?team4',
        playStyle: {
            runFrequency: 0.45,
            passFrequency: 0.45,
            deepFrequency: 0.1,
            aggression: 0.6
        },
        reward: 300,
        taunt: "Experience beats talent when talent doesn't work hard.",
        colors: { primary: '#ef4444', secondary: '#dc2626' }
    },
    pro_2: {
        id: 'pro_2',
        name: 'The Tactician',
        difficulty: 'pro',
        teamName: 'Strategic Force',
        personality: 'methodical',
        overall: 83,
        stats: { offense: 81, defense: 85 },
        logo: 'https://rosebud.ai/assets/logo_pro_2.png.webp?team5',
        playStyle: {
            runFrequency: 0.4,
            passFrequency: 0.5,
            deepFrequency: 0.1,
            aggression: 0.5
        },
        reward: 320,
        taunt: "Every play is calculated.",
        colors: { primary: '#f59e0b', secondary: '#d97706' }
    },
    pro_3: {
        id: 'pro_3',
        name: 'The Comeback Kid',
        difficulty: 'pro',
        teamName: 'Resilient Warriors',
        personality: 'clutch',
        overall: 84,
        stats: { offense: 85, defense: 83 },
        logo: 'https://rosebud.ai/assets/logo_pro_3.png.webp?team6',
        playStyle: {
            runFrequency: 0.3,
            passFrequency: 0.5,
            deepFrequency: 0.2,
            aggression: 0.7
        },
        reward: 340,
        taunt: "It's not over until the clock hits zero.",
        colors: { primary: '#14b8a6', secondary: '#0d9488' }
    },
    pro_4: {
        id: 'pro_4',
        name: 'The Grinder',
        difficulty: 'pro',
        teamName: 'Iron Defense',
        personality: 'defensive',
        overall: 81,
        stats: { offense: 78, defense: 84 },
        logo: 'https://rosebud.ai/assets/logo_pro_4.png.webp?team7',
        playStyle: {
            runFrequency: 0.6,
            passFrequency: 0.3,
            deepFrequency: 0.1,
            aggression: 0.4
        },
        reward: 290,
        taunt: "Defense wins championships!",
        colors: { primary: '#64748b', secondary: '#475569' }
    },

    // ALL-STAR DIFFICULTY (90-94 OVR)
    allstar_1: {
        id: 'allstar_1',
        name: 'The Champion',
        difficulty: 'allstar',
        teamName: 'Dynasty Kings',
        personality: 'dominant',
        overall: 92,
        stats: { offense: 93, defense: 91 },
        logo: 'https://rosebud.ai/assets/logo_allstar_1.png.webp?team8',
        playStyle: {
            runFrequency: 0.4,
            passFrequency: 0.45,
            deepFrequency: 0.15,
            aggression: 0.7
        },
        reward: 600,
        taunt: "Winning is a habit here.",
        colors: { primary: '#fbbf24', secondary: '#f59e0b' }
    },
    allstar_2: {
        id: 'allstar_2',
        name: 'The Playmaker',
        difficulty: 'allstar',
        teamName: 'Elite Squad',
        personality: 'explosive',
        overall: 91,
        stats: { offense: 94, defense: 88 },
        logo: 'https://rosebud.ai/assets/logo_allstar_2.png.webp?team9',
        playStyle: {
            runFrequency: 0.3,
            passFrequency: 0.5,
            deepFrequency: 0.2,
            aggression: 0.8
        },
        reward: 580,
        taunt: "Big plays, big wins!",
        colors: { primary: '#ec4899', secondary: '#db2777' }
    },
    allstar_3: {
        id: 'allstar_3',
        name: 'The Enforcer',
        difficulty: 'allstar',
        teamName: 'Defensive Titans',
        personality: 'shutdown',
        overall: 90,
        stats: { offense: 87, defense: 93 },
        logo: 'https://rosebud.ai/assets/logo_allstar_3.png.webp?team10',
        playStyle: {
            runFrequency: 0.5,
            passFrequency: 0.35,
            deepFrequency: 0.15,
            aggression: 0.6
        },
        reward: 560,
        taunt: "Try to score on this defense!",
        colors: { primary: '#0ea5e9', secondary: '#0284c7' }
    },
    allstar_4: {
        id: 'allstar_4',
        name: 'The Balanced Beast',
        difficulty: 'allstar',
        teamName: 'Complete Team',
        personality: 'versatile',
        overall: 93,
        stats: { offense: 92, defense: 94 },
        logo: 'https://rosebud.ai/assets/logo_allstar_4.png.webp?team11',
        playStyle: {
            runFrequency: 0.4,
            passFrequency: 0.4,
            deepFrequency: 0.2,
            aggression: 0.6
        },
        reward: 620,
        taunt: "No weaknesses in this squad.",
        colors: { primary: '#10b981', secondary: '#059669' }
    },

    // LEGEND DIFFICULTY (95-99 OVR)
    legend_1: {
        id: 'legend_1',
        name: 'The GOAT',
        difficulty: 'legend',
        teamName: 'Immortal Dynasty',
        personality: 'perfectionist',
        overall: 97,
        stats: { offense: 97, defense: 97 },
        logo: 'https://rosebud.ai/assets/logo_legend_1.png.webp?team12',
        playStyle: {
            runFrequency: 0.35,
            passFrequency: 0.45,
            deepFrequency: 0.2,
            aggression: 0.8
        },
        reward: 1200,
        taunt: "Greatness is not an accident.",
        colors: { primary: '#fbbf24', secondary: '#b45309' }
    },
    legend_2: {
        id: 'legend_2',
        name: 'The Unstoppable',
        difficulty: 'legend',
        teamName: 'Ultimate Force',
        personality: 'relentless',
        overall: 96,
        stats: { offense: 98, defense: 94 },
        logo: 'https://rosebud.ai/assets/logo_legend_2.png.webp?team13',
        playStyle: {
            runFrequency: 0.3,
            passFrequency: 0.5,
            deepFrequency: 0.2,
            aggression: 0.9
        },
        reward: 1100,
        taunt: "I don't lose. Ever.",
        colors: { primary: '#dc2626', secondary: '#991b1b' }
    },
    legend_3: {
        id: 'legend_3',
        name: 'The Perfect Machine',
        difficulty: 'legend',
        teamName: 'Flawless Execution',
        personality: 'surgical',
        overall: 98,
        stats: { offense: 96, defense: 99 },
        logo: 'https://rosebud.ai/assets/logo_legend_3.png.webp?team14',
        playStyle: {
            runFrequency: 0.4,
            passFrequency: 0.4,
            deepFrequency: 0.2,
            aggression: 0.7
        },
        reward: 1300,
        taunt: "Perfection is the only standard.",
        colors: { primary: '#a855f7', secondary: '#7c3aed' }
    },
    legend_4: {
        id: 'legend_4',
        name: 'The Final Boss',
        difficulty: 'legend',
        teamName: 'Hall of Fame',
        personality: 'legendary',
        overall: 99,
        stats: { offense: 99, defense: 99 },
        logo: 'https://rosebud.ai/assets/logo_legend_4.png.webp?team15',
        playStyle: {
            runFrequency: 0.35,
            passFrequency: 0.45,
            deepFrequency: 0.2,
            aggression: 0.85
        },
        reward: 1500,
        taunt: "You've reached the final level. Good luck.",
        colors: { primary: '#000000', secondary: '#fbbf24' }
    }
};

// ============================================
// AI DIFFICULTY MANAGER
// ============================================

class AIOpponentSystem {
    constructor() {
        this.currentDifficulty = 'rookie';
        this.unlockedOpponents = this.loadUnlockedOpponents();
        this.defeatedOpponents = this.loadDefeatedOpponents();
    }

    loadUnlockedOpponents() {
        const saved = localStorage.getItem('unlockedAIOpponents');
        if (saved) {
            return JSON.parse(saved);
        }
        // Start with rookie opponents unlocked
        return ['rookie_1', 'rookie_2', 'rookie_3'];
    }

    loadDefeatedOpponents() {
        const saved = localStorage.getItem('defeatedAIOpponents');
        return saved ? JSON.parse(saved) : {};
    }

    saveProgress() {
        localStorage.setItem('unlockedAIOpponents', JSON.stringify(this.unlockedOpponents));
        localStorage.setItem('defeatedAIOpponents', JSON.stringify(this.defeatedOpponents));
    }

    getOpponentsByDifficulty(difficulty) {
        return Object.values(AI_OPPONENTS)
            .filter(opp => opp.difficulty === difficulty && this.unlockedOpponents.includes(opp.id));
    }

    getAllAvailableOpponents() {
        return Object.values(AI_OPPONENTS)
            .filter(opp => this.unlockedOpponents.includes(opp.id))
            .sort((a, b) => a.overall - b.overall);
    }

    getOpponent(opponentId) {
        return AI_OPPONENTS[opponentId];
    }

    recordVictory(opponentId) {
        if (!this.defeatedOpponents[opponentId]) {
            this.defeatedOpponents[opponentId] = 0;
        }
        this.defeatedOpponents[opponentId]++;

        // Unlock next difficulty tier
        const opponent = AI_OPPONENTS[opponentId];
        if (opponent) {
            this.unlockNextTier(opponent.difficulty);
        }

        this.saveProgress();
    }

    unlockNextTier(currentDifficulty) {
        const difficultyOrder = ['rookie', 'pro', 'allstar', 'legend'];
        const currentIndex = difficultyOrder.indexOf(currentDifficulty);
        
        // Check if all opponents in current tier are defeated at least once
        const currentTierOpponents = Object.values(AI_OPPONENTS).filter(
            opp => opp.difficulty === currentDifficulty
        );
        
        const allDefeated = currentTierOpponents.every(
            opp => this.defeatedOpponents[opp.id] && this.defeatedOpponents[opp.id] > 0
        );

        if (allDefeated && currentIndex < difficultyOrder.length - 1) {
            const nextDifficulty = difficultyOrder[currentIndex + 1];
            const nextTierOpponents = Object.values(AI_OPPONENTS).filter(
                opp => opp.difficulty === nextDifficulty
            );
            
            // Unlock all opponents in next tier
            nextTierOpponents.forEach(opp => {
                if (!this.unlockedOpponents.includes(opp.id)) {
                    this.unlockedOpponents.push(opp.id);
                }
            });
            
            this.saveProgress();
            return nextDifficulty;
        }

        return null;
    }

    getProgress() {
        const totalOpponents = Object.keys(AI_OPPONENTS).length;
        const defeated = Object.keys(this.defeatedOpponents).length;
        const totalVictories = Object.values(this.defeatedOpponents).reduce((a, b) => a + b, 0);

        return {
            defeated,
            total: totalOpponents,
            unlocked: this.unlockedOpponents.length,
            totalVictories,
            percentage: Math.floor((defeated / totalOpponents) * 100)
        };
    }

    getOpponentRecord(opponentId) {
        return this.defeatedOpponents[opponentId] || 0;
    }

    // AI Decision Making
    makeAIDecision(opponent, gameState) {
        if (!opponent || !opponent.playStyle) {
            return 'run'; // Default
        }

        const { runFrequency, passFrequency, deepFrequency } = opponent.playStyle;
        const roll = Math.random();

        // Adjust based on game situation
        let adjustedRun = runFrequency;
        let adjustedPass = passFrequency;
        let adjustedDeep = deepFrequency;

        // If losing in 4th quarter, be more aggressive
        if (gameState.quarter === 4 && gameState.awayScore < gameState.homeScore) {
            adjustedPass += 0.1;
            adjustedDeep += 0.1;
            adjustedRun -= 0.2;
        }

        // If winning, run more to control clock
        if (gameState.quarter === 4 && gameState.awayScore > gameState.homeScore) {
            adjustedRun += 0.2;
            adjustedPass -= 0.1;
            adjustedDeep -= 0.1;
        }

        // Normalize
        const total = adjustedRun + adjustedPass + adjustedDeep;
        adjustedRun /= total;
        adjustedPass /= total;
        adjustedDeep /= total;

        // Make decision
        if (roll < adjustedRun) return 'run';
        if (roll < adjustedRun + adjustedPass) return 'pass';
        return 'long';
    }
}

// Export for global use
if (typeof window !== 'undefined') {
    window.AIOpponentSystem = AIOpponentSystem;
    window.AI_OPPONENTS = AI_OPPONENTS;
}
