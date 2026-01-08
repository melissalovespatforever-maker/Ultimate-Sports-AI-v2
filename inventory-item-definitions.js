/**
 * INVENTORY ITEM DEFINITIONS
 * Central registry for all purchasable items with metadata
 */

window.ITEM_CATALOG = {
    // ============================================
    // BOOSTERS
    // ============================================
    'coin-2x': {
        name: '2x Coin Booster',
        type: 'booster',
        icon: '💰',
        description: 'Double all coin earnings for 1 hour',
        price: 500,
        duration: 3600000,
        metadata: {
            multiplier: 2,
            stat: 'coins'
        }
    },
    'coin-3x': {
        name: '3x Coin Booster',
        type: 'booster',
        icon: '🤑',
        description: 'Triple all coin earnings for 1 hour',
        price: 1200,
        duration: 3600000,
        metadata: {
            multiplier: 3,
            stat: 'coins'
        }
    },
    'xp-2x': {
        name: '2x XP Booster',
        type: 'booster',
        icon: '📈',
        description: 'Double experience gains for 2 hours',
        price: 400,
        duration: 7200000,
        metadata: {
            multiplier: 2,
            stat: 'xp'
        }
    },
    'mega-pack': {
        name: 'Mega Booster Pack',
        type: 'booster',
        icon: '⚡',
        description: '2x coins AND 2x XP for 3 hours',
        price: 1500,
        duration: 10800000,
        metadata: {
            multiplier: 2,
            stat: 'both',
            coinMultiplier: 2,
            xpMultiplier: 2
        }
    },

    // ============================================
    // CONSUMABLES
    // ============================================
    'streak-shield': {
        name: 'Streak Shield',
        type: 'consumable',
        icon: '🛡️',
        description: 'Protect your win streak from one loss',
        price: 600,
        metadata: {
            uses: 1
        }
    },
    'mystery-box': {
        name: 'Mystery Box',
        type: 'consumable',
        icon: '🎁',
        description: 'Open for a random reward (500-2500 coins or boosters)',
        price: 1000,
        metadata: {
            minReward: 500,
            maxReward: 2500
        }
    },
    'coin-pack-1k': {
        name: '1,000 Coin Pack',
        type: 'consumable',
        icon: '💰',
        description: 'Instant 1,000 coins',
        price: 0, // Real money purchase
        metadata: {
            coins: 1000
        }
    },
    'coin-pack-5k': {
        name: '5,000 Coin Pack',
        type: 'consumable',
        icon: '💎',
        description: 'Instant 5,000 coins',
        price: 0, // Real money purchase
        metadata: {
            coins: 5000
        }
    },
    'coin-pack-10k': {
        name: '10,000 Coin Pack',
        type: 'consumable',
        icon: '💵',
        description: 'Instant 10,000 coins',
        price: 0, // Real money purchase
        metadata: {
            coins: 10000
        }
    },

    // ============================================
    // AVATARS
    // ============================================
    'king-chess': {
        name: 'King Chess Piece',
        type: 'avatar',
        icon: '👑',
        description: 'Show them who rules the lounge',
        price: 2500,
        metadata: {
            emoji: '👑',
            tier: 'epic'
        }
    },
    'jordan-1': {
        name: 'Jordan 1 Icon',
        type: 'avatar',
        icon: '👟',
        description: 'Classic kicks for the ultimate athlete',
        price: 1500,
        metadata: {
            emoji: '👟',
            tier: 'rare'
        }
    },
    'gotrich': {
        name: 'Gotrich Baller',
        type: 'avatar',
        icon: '🏀',
        description: 'The ultimate flex for basketball fans',
        price: 3000,
        metadata: {
            emoji: '🏀',
            tier: 'epic'
        }
    },
    'scrooge': {
        name: 'High Roller',
        type: 'avatar',
        icon: '🎰',
        description: 'Animated slots avatar for lucky players',
        price: 5000,
        metadata: {
            emoji: '🎰',
            tier: 'legendary',
            animated: true
        }
    },
    'guccii-duffel': {
        name: 'Guccii Duffel',
        type: 'avatar',
        icon: '💼',
        description: 'Exclusive cosmetic carry-all',
        price: 10000,
        metadata: {
            emoji: '💼',
            tier: 'legendary'
        }
    },
    'trophy-avatar': {
        name: 'Golden Trophy',
        type: 'avatar',
        icon: '🏆',
        description: 'Champion status avatar',
        price: 7500,
        metadata: {
            emoji: '🏆',
            tier: 'legendary'
        }
    },
    'crown-avatar': {
        name: 'Royal Crown',
        type: 'avatar',
        icon: '👑',
        description: 'Ultimate authority in the lounge',
        price: 15000,
        metadata: {
            emoji: '👑',
            tier: 'mythic'
        }
    },

    // ============================================
    // PERMANENT BONUSES
    // ============================================
    'blue-diamond-ring': {
        name: 'Blue Diamond Ring',
        type: 'permanent',
        icon: '💍',
        description: '+3% permanent XP boost on all activities',
        price: 25000,
        metadata: {
            bonus: 0.03,
            stat: 'xp'
        }
    },
    'golden-coin': {
        name: 'Golden Diamond Coin',
        type: 'permanent',
        icon: '💰',
        description: '+5% permanent coin bonus from all wins',
        price: 50000,
        metadata: {
            bonus: 0.05,
            stat: 'coins'
        }
    },
    'platinum-card': {
        name: 'Platinum Card',
        type: 'permanent',
        icon: '💳',
        description: '+2% permanent boost to ALL stats',
        price: 75000,
        metadata: {
            bonus: 0.02,
            stat: 'all'
        }
    },

    // ============================================
    // COSMETICS
    // ============================================
    'championship-ring': {
        name: 'Championship Ring',
        type: 'cosmetic',
        icon: '💍',
        description: 'Exclusive badge for tournament winners',
        price: 5000,
        metadata: {
            badge: 'championship-ring',
            display: 'profile'
        }
    },
    'vip-badge': {
        name: 'VIP Badge',
        type: 'cosmetic',
        icon: '⭐',
        description: 'Show your VIP status',
        price: 3000,
        metadata: {
            badge: 'vip',
            display: 'profile'
        }
    },
    'flame-effect': {
        name: 'Flame Avatar Border',
        type: 'cosmetic',
        icon: '🔥',
        description: 'Animated fire effect around your avatar',
        price: 8000,
        metadata: {
            effect: 'flame',
            animated: true
        }
    },
    'lightning-effect': {
        name: 'Lightning Avatar Border',
        type: 'cosmetic',
        icon: '⚡',
        description: 'Electric animation for your profile',
        price: 8000,
        metadata: {
            effect: 'lightning',
            animated: true
        }
    }
};

/**
 * Helper function to get item data
 */
window.getItemData = function(itemId) {
    return window.ITEM_CATALOG[itemId] || null;
};

/**
 * Helper function to get all items by type
 */
window.getItemsByType = function(type) {
    return Object.entries(window.ITEM_CATALOG)
        .filter(([id, data]) => data.type === type)
        .map(([id, data]) => ({ id, ...data }));
};

/**
 * Helper function to get all items by price range
 */
window.getItemsByPriceRange = function(minPrice, maxPrice) {
    return Object.entries(window.ITEM_CATALOG)
        .filter(([id, data]) => data.price >= minPrice && data.price <= maxPrice)
        .map(([id, data]) => ({ id, ...data }));
};

/**
 * Helper function to format item for shop display
 */
window.formatItemForShop = function(itemId) {
    const item = window.ITEM_CATALOG[itemId];
    if (!item) return null;

    return {
        id: itemId,
        name: item.name,
        type: item.type,
        icon: item.icon,
        description: item.description,
        price: item.price,
        badge: item.metadata?.tier || null,
        animated: item.metadata?.animated || false
    };
};

/**
 * Helper function to validate item purchase
 */
window.canPurchaseItem = function(itemId, userBalance) {
    const item = window.ITEM_CATALOG[itemId];
    if (!item) return { valid: false, reason: 'Item not found' };

    if (item.price === 0) {
        return { valid: false, reason: 'Real money purchase only' };
    }

    if (userBalance < item.price) {
        return { valid: false, reason: 'Insufficient coins' };
    }

    return { valid: true };
};

console.log('✅ Item Catalog loaded:', Object.keys(window.ITEM_CATALOG).length, 'items');
