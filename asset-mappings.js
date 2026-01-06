/**
 * ASSET MAPPINGS
 * Central registry connecting item IDs to Rosebud assets
 * This ensures all systems (shop, inventory, profile) use consistent imagery
 */

const ASSET_MAPPINGS = {
    // ====== AVATARS ======
    avatars: {
        'jordan-1': {
            name: 'Jordan 1 Icon',
            imageUrl: 'https://rosebud.ai/assets/Jordan 1 icon.png?xjeN',
            tier: 'PRO',
            price: 1000,
            description: 'Classic sneaker icon for true ballers'
        },
        'js-4': {
            name: "J's 4 Avatar",
            imageUrl: 'https://rosebud.ai/assets/J\'s 4 avatar (pro).png?p1Kf',
            tier: 'PRO',
            price: 1200,
            description: 'Legendary kicks avatar'
        },
        'king-chess': {
            name: 'King Chess Piece',
            imageUrl: 'https://rosebud.ai/assets/King chess (pro).png?DAxj',
            tier: 'PRO',
            price: 1500,
            description: 'Strategic mastermind avatar'
        },
        'lucky-charm': {
            name: 'Lucky Charm Avatar',
            imageUrl: 'https://rosebud.ai/assets/Lucky charm avatar (pro).png?ekNh',
            tier: 'PRO',
            price: 1300,
            description: 'Bring luck to every bet'
        },
        'lucky-leprechaun': {
            name: 'Lucky Leprechaun',
            imageUrl: 'https://rosebud.ai/assets/Lucky leprechaun avatar.png?puEb',
            tier: 'PRO',
            price: 1400,
            description: 'Irish luck on your side'
        },
        'crown': {
            name: 'Ultimate Crown',
            imageUrl: 'https://rosebud.ai/assets/Ultimate sports crown 👑 (pro).png?ktnj',
            tier: 'PRO',
            price: 2000,
            description: 'For champions only'
        },
        'money-tree': {
            name: 'Money Tree Avatar',
            imageUrl: 'https://rosebud.ai/assets/Money tree avatar VIP.png?EHQP',
            tier: 'VIP',
            price: 5000,
            description: 'VIP exclusive - Watch your wealth grow'
        },
        'scrooge': {
            name: 'Scrooge McDuck',
            imageUrl: 'https://rosebud.ai/assets/Scrooge (VIP).png?up5M',
            tier: 'VIP',
            price: 6000,
            description: 'VIP exclusive - Ultimate wealth avatar'
        },
        'game-boys': {
            name: 'Game Boys Stack',
            imageUrl: 'https://rosebud.ai/assets/Game boys avatar (VIP).png?Yjjl',
            tier: 'VIP',
            price: 5500,
            description: 'VIP exclusive - Retro gaming vibes'
        },
        'gotrich': {
            name: 'Gotrich Baller',
            imageUrl: 'https://rosebud.ai/assets/Gotrich off sports betting avatar (VIP).png?Idcs',
            tier: 'VIP',
            price: 7000,
            description: 'VIP exclusive - Big money moves'
        },
        'guccii-duffel': {
            name: 'Guccii Duffel',
            imageUrl: 'https://rosebud.ai/assets/Guccii duffel avatar (vip).png?7z2L',
            tier: 'VIP',
            price: 8000,
            description: 'VIP exclusive - Luxury lifestyle'
        }
    },

    // ====== BOOSTERS ======
    boosters: {
        'coin-2x': {
            name: '2X Coin Booster',
            imageUrl: 'https://rosebud.ai/assets/Gold coin with ultimate sports logo in diamonds.png?BD5X',
            price: 500,
            duration: 3600000, // 1 hour
            description: 'Double your coin earnings for 1 hour'
        },
        'coin-3x': {
            name: '3X Coin Booster',
            imageUrl: 'https://rosebud.ai/assets/https:/rosebud.ai/assets/Gold coin with ultimate sports logo in diamonds.png?BD5X flip it around.png?PTQH',
            price: 1000,
            duration: 3600000,
            description: 'Triple your coin earnings for 1 hour'
        },
        'xp-2x': {
            name: '2X XP Booster',
            imageUrl: 'https://rosebud.ai/assets/XP booster coin.png?BrOk',
            price: 400,
            duration: 7200000, // 2 hours
            description: 'Double your XP gains for 2 hours'
        },
        'xp-booster-coin': {
            name: 'XP Booster Coin',
            imageUrl: 'https://rosebud.ai/assets/XP booster coin.png?BrOk',
            price: 300,
            duration: 3600000,
            description: 'Boost your XP earnings'
        },
        'mega-pack': {
            name: 'Mega Booster Pack',
            imageUrl: 'https://rosebud.ai/assets/Opening gold and diamond pack image display.png?k2SX',
            price: 2000,
            duration: 10800000, // 3 hours
            description: '2X Coins + 2X XP for 3 hours!'
        }
    },

    // ====== CONSUMABLES ======
    consumables: {
        'streak-shield': {
            name: 'Streak Shield',
            imageUrl: 'https://rosebud.ai/assets/King chess (pro).png?DAxj', // Using chess king as shield
            price: 150,
            description: 'Protect your streak from one loss'
        },
        '1000-coins': {
            name: '1,000 Coin Pack',
            imageUrl: 'https://rosebud.ai/assets/1000 ultimate coins.png?FRoU',
            price: 800,
            description: 'Instant 1,000 coin boost'
        }
    },

    // ====== COSMETICS ======
    cosmetics: {
        'championship-ring': {
            name: 'Championship Ring',
            imageUrl: 'https://rosebud.ai/assets/Championship ring 1.png?shqb',
            price: 3000,
            description: 'Display your championship status'
        },
        'blue-diamond-ring': {
            name: 'Blue Diamond Ring',
            imageUrl: 'https://rosebud.ai/assets/Ultimate sports championship diamond ring.png?1Esq',
            price: 5000,
            description: 'Rare VIP cosmetic + 3% permanent XP bonus'
        },
        'golden-coin': {
            name: 'Golden Coin Badge',
            imageUrl: 'https://rosebud.ai/assets/Gold coin with ultimate sports logo in diamonds.png?BD5X',
            price: 2500,
            description: 'Permanent 5% coin bonus badge'
        }
    },

    // ====== TROPHIES (for achievements display) ======
    trophies: {
        'ultimate-trophy': {
            name: 'Ultimate Sports Trophy',
            imageUrl: 'https://rosebud.ai/assets/Ultimate sports ai trophy.png?REjH'
        },
        'nfl-trophy': {
            name: 'NFL Championship Trophy',
            imageUrl: 'https://rosebud.ai/assets/trophy nfl.png?1vJn'
        },
        'basketball-trophy': {
            name: 'Basketball Championship',
            imageUrl: 'https://rosebud.ai/assets/Basketball trophy.png?28RZ'
        },
        'baseball-trophy': {
            name: 'Baseball Championship',
            imageUrl: 'https://rosebud.ai/assets/Baseball trophy.png?ZPlR'
        },
        'soccer-trophy': {
            name: 'Soccer Championship',
            imageUrl: 'https://rosebud.ai/assets/Soccer championship.png?BVmz'
        },
        'vip-trophy': {
            name: 'VIP Elite Trophy',
            imageUrl: 'https://rosebud.ai/assets/Vip trophy.png?q8fV'
        },
        'world-trophy': {
            name: 'World Champion Trophy',
            imageUrl: 'https://rosebud.ai/assets/World trophy.png?7n3n'
        },
        'parlay-king': {
            name: 'Parlay King Trophy',
            imageUrl: 'https://rosebud.ai/assets/Ultimate sports trophy parlay king achievement icon.png?3cyb'
        },
        'money-bag': {
            name: 'Money Bag Trophy',
            imageUrl: 'https://rosebud.ai/assets/Money bag trophy.png?ELGp'
        }
    },

    // ====== COACHES (AI Coach avatars) ======
    coaches: {
        'nfl-coach': {
            name: 'NFL Coach',
            imageUrl: 'https://rosebud.ai/assets/NFL coach.webp?nRJK'
        },
        'nba-coach': {
            name: 'NBA Coach',
            imageUrl: 'https://rosebud.ai/assets/Nba coach.webp?O8Jk'
        },
        'mlb-coach': {
            name: 'MLB Coach',
            imageUrl: 'https://rosebud.ai/assets/MLB coach.webp?zfFQ'
        },
        'nhl-coach': {
            name: 'NHL Coach',
            imageUrl: 'https://rosebud.ai/assets/NHL coach.webp?frve'
        },
        'soccer-coach': {
            name: 'Soccer Coach',
            imageUrl: 'https://rosebud.ai/assets/Soccer coach.webp?TgRO'
        },
        'assistant-coach': {
            name: 'AI Assistant Coach',
            imageUrl: 'https://rosebud.ai/assets/Assistant.png?mwmc'
        },
        'coach-hal': {
            name: 'Coach Hal',
            imageUrl: 'https://rosebud.ai/assets/Coach Hal.png?hUy7'
        }
    }
};

// Helper function to get item data by ID
function getAssetData(itemId, category = null) {
    // If category is specified, look there first
    if (category && ASSET_MAPPINGS[category] && ASSET_MAPPINGS[category][itemId]) {
        return ASSET_MAPPINGS[category][itemId];
    }

    // Otherwise search all categories
    for (const cat in ASSET_MAPPINGS) {
        if (ASSET_MAPPINGS[cat][itemId]) {
            return {
                ...ASSET_MAPPINGS[cat][itemId],
                category: cat
            };
        }
    }

    // Not found
    return null;
}

// Helper to get all items in a category
function getAssetsByCategory(category) {
    return ASSET_MAPPINGS[category] || {};
}

// Export for global use
window.ASSET_MAPPINGS = ASSET_MAPPINGS;
window.getAssetData = getAssetData;
window.getAssetsByCategory = getAssetsByCategory;

console.log('✅ Asset mappings loaded:', Object.keys(ASSET_MAPPINGS));
