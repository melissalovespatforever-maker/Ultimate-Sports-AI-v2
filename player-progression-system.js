/**
 * PLAYER PROGRESSION SYSTEM - ENHANCED
 * Complete NFL player card system with real legends, coaches, and proper duplicate prevention
 */

// ============================================
// EXPANDED PLAYER DATABASE - REAL NFL LEGENDS
// ============================================

const PLAYER_DATABASE = {
    // ========== QUARTERBACKS ==========
    
    // BRONZE QBs (70-75 OVR)
    qb_bronze_basic: {
        id: 'qb_bronze_basic',
        name: 'Draft Prospect',
        position: 'QB',
        tier: 'bronze',
        overall: 70,
        stats: { accuracy: 65, power: 75, speed: 70 }
    },
    qb_bronze_1: {
        id: 'qb_bronze_1',
        name: 'Marcus Mariota',
        position: 'QB',
        tier: 'bronze',
        overall: 72,
        stats: { accuracy: 70, power: 68, speed: 75 }
    },
    qb_bronze_2: {
        id: 'qb_bronze_2',
        name: 'Jameis Winston',
        position: 'QB',
        tier: 'bronze',
        overall: 73,
        stats: { accuracy: 72, power: 78, speed: 65 }
    },
    qb_bronze_3: {
        id: 'qb_bronze_3',
        name: 'Baker Mayfield',
        position: 'QB',
        tier: 'bronze',
        overall: 74,
        stats: { accuracy: 73, power: 70, speed: 68 }
    },
    qb_bronze_4: {
        id: 'qb_bronze_4',
        name: 'Sam Darnold',
        position: 'QB',
        tier: 'bronze',
        overall: 71,
        stats: { accuracy: 69, power: 72, speed: 67 }
    },

    // SILVER QBs (80-85 OVR)
    qb_silver_1: {
        id: 'qb_silver_1',
        name: 'Kirk Cousins',
        position: 'QB',
        tier: 'silver',
        overall: 82,
        stats: { accuracy: 82, power: 78, speed: 62 }
    },
    qb_silver_2: {
        id: 'qb_silver_2',
        name: 'Derek Carr',
        position: 'QB',
        tier: 'silver',
        overall: 83,
        stats: { accuracy: 84, power: 80, speed: 65 }
    },
    qb_silver_3: {
        id: 'qb_silver_3',
        name: 'Geno Smith',
        position: 'QB',
        tier: 'silver',
        overall: 81,
        stats: { accuracy: 80, power: 76, speed: 70 }
    },
    qb_silver_4: {
        id: 'qb_silver_4',
        name: 'Jared Goff',
        position: 'QB',
        tier: 'silver',
        overall: 84,
        stats: { accuracy: 85, power: 81, speed: 63 }
    },

    // GOLD QBs (90-96 OVR)
    qb_gold_1: {
        id: 'qb_gold_1',
        name: 'Patrick Mahomes',
        position: 'QB',
        tier: 'gold',
        overall: 96,
        stats: { accuracy: 96, power: 93, speed: 88 }
    },
    qb_gold_2: {
        id: 'qb_gold_2',
        name: 'Josh Allen',
        position: 'QB',
        tier: 'gold',
        overall: 95,
        stats: { accuracy: 91, power: 98, speed: 87 }
    },
    qb_gold_3: {
        id: 'qb_gold_3',
        name: 'Lamar Jackson',
        position: 'QB',
        tier: 'gold',
        overall: 94,
        stats: { accuracy: 88, power: 92, speed: 96 }
    },
    qb_gold_4: {
        id: 'qb_gold_4',
        name: 'Joe Burrow',
        position: 'QB',
        tier: 'gold',
        overall: 93,
        stats: { accuracy: 94, power: 89, speed: 82 }
    },
    qb_gold_5: {
        id: 'qb_gold_5',
        name: 'Jalen Hurts',
        position: 'QB',
        tier: 'gold',
        overall: 92,
        stats: { accuracy: 87, power: 91, speed: 93 }
    },

    // DIAMOND QBs (97-99 OVR) - Legends
    qb_diamond_1: {
        id: 'qb_diamond_1',
        name: 'Tom Brady',
        position: 'QB',
        tier: 'diamond',
        overall: 99,
        stats: { accuracy: 99, power: 92, speed: 65 }
    },
    qb_diamond_2: {
        id: 'qb_diamond_2',
        name: 'Peyton Manning',
        position: 'QB',
        tier: 'diamond',
        overall: 99,
        stats: { accuracy: 99, power: 95, speed: 60 }
    },
    qb_diamond_3: {
        id: 'qb_diamond_3',
        name: 'Dan Marino',
        position: 'QB',
        tier: 'diamond',
        overall: 98,
        stats: { accuracy: 98, power: 99, speed: 62 }
    },
    qb_diamond_4: {
        id: 'qb_diamond_4',
        name: 'Joe Montana',
        position: 'QB',
        tier: 'diamond',
        overall: 99,
        stats: { accuracy: 99, power: 88, speed: 70 }
    },

    // ========== RUNNING BACKS ==========
    
    // BRONZE RBs
    rb_bronze_basic: {
        id: 'rb_bronze_basic',
        name: 'Generic Runner',
        position: 'RB',
        tier: 'bronze',
        overall: 70,
        stats: { speed: 75, power: 70, agility: 70 }
    },
    rb_bronze_1: {
        id: 'rb_bronze_1',
        name: 'Ezekiel Elliott',
        position: 'RB',
        tier: 'bronze',
        overall: 73,
        stats: { speed: 76, power: 82, agility: 70 }
    },
    rb_bronze_2: {
        id: 'rb_bronze_2',
        name: 'Miles Sanders',
        position: 'RB',
        tier: 'bronze',
        overall: 72,
        stats: { speed: 78, power: 68, agility: 74 }
    },
    rb_bronze_3: {
        id: 'rb_bronze_3',
        name: 'Damien Harris',
        position: 'RB',
        tier: 'bronze',
        overall: 71,
        stats: { speed: 75, power: 76, agility: 68 }
    },
    rb_bronze_4: {
        id: 'rb_bronze_4',
        name: 'Rashaad Penny',
        position: 'RB',
        tier: 'bronze',
        overall: 70,
        stats: { speed: 80, power: 65, agility: 72 }
    },

    // SILVER RBs
    rb_silver_1: {
        id: 'rb_silver_1',
        name: 'Josh Jacobs',
        position: 'RB',
        tier: 'silver',
        overall: 84,
        stats: { speed: 84, power: 86, agility: 82 }
    },
    rb_silver_2: {
        id: 'rb_silver_2',
        name: 'Aaron Jones',
        position: 'RB',
        tier: 'silver',
        overall: 83,
        stats: { speed: 87, power: 78, agility: 85 }
    },
    rb_silver_3: {
        id: 'rb_silver_3',
        name: 'Najee Harris',
        position: 'RB',
        tier: 'silver',
        overall: 82,
        stats: { speed: 80, power: 88, agility: 79 }
    },
    rb_silver_4: {
        id: 'rb_silver_4',
        name: 'Alvin Kamara',
        position: 'RB',
        tier: 'silver',
        overall: 85,
        stats: { speed: 88, power: 79, agility: 90 }
    },

    // GOLD RBs
    rb_gold_1: {
        id: 'rb_gold_1',
        name: 'Christian McCaffrey',
        position: 'RB',
        tier: 'gold',
        overall: 96,
        stats: { speed: 95, power: 88, agility: 97 }
    },
    rb_gold_2: {
        id: 'rb_gold_2',
        name: 'Derrick Henry',
        position: 'RB',
        tier: 'gold',
        overall: 94,
        stats: { speed: 90, power: 99, agility: 85 }
    },
    rb_gold_3: {
        id: 'rb_gold_3',
        name: 'Nick Chubb',
        position: 'RB',
        tier: 'gold',
        overall: 93,
        stats: { speed: 92, power: 95, agility: 88 }
    },
    rb_gold_4: {
        id: 'rb_gold_4',
        name: 'Saquon Barkley',
        position: 'RB',
        tier: 'gold',
        overall: 92,
        stats: { speed: 96, power: 86, agility: 94 }
    },

    // DIAMOND RBs - Legends
    rb_diamond_1: {
        id: 'rb_diamond_1',
        name: 'Barry Sanders',
        position: 'RB',
        tier: 'diamond',
        overall: 99,
        stats: { speed: 98, power: 88, agility: 99 }
    },
    rb_diamond_2: {
        id: 'rb_diamond_2',
        name: 'Walter Payton',
        position: 'RB',
        tier: 'diamond',
        overall: 99,
        stats: { speed: 95, power: 95, agility: 96 }
    },
    rb_diamond_3: {
        id: 'rb_diamond_3',
        name: 'Jim Brown',
        position: 'RB',
        tier: 'diamond',
        overall: 99,
        stats: { speed: 92, power: 99, agility: 90 }
    },
    rb_diamond_4: {
        id: 'rb_diamond_4',
        name: 'Eric Dickerson',
        position: 'RB',
        tier: 'diamond',
        overall: 98,
        stats: { speed: 97, power: 94, agility: 93 }
    },

    // ========== WIDE RECEIVERS ==========
    
    // BRONZE WRs
    wr_bronze_basic: {
        id: 'wr_bronze_basic',
        name: 'Standard Receiver',
        position: 'WR',
        tier: 'bronze',
        overall: 70,
        stats: { speed: 78, catching: 70, route: 70 }
    },
    wr_bronze_1: {
        id: 'wr_bronze_1',
        name: 'Michael Gallup',
        position: 'WR',
        tier: 'bronze',
        overall: 72,
        stats: { speed: 82, catching: 70, route: 68 }
    },
    wr_bronze_2: {
        id: 'wr_bronze_2',
        name: 'Tyler Boyd',
        position: 'WR',
        tier: 'bronze',
        overall: 73,
        stats: { speed: 80, catching: 74, route: 72 }
    },
    wr_bronze_3: {
        id: 'wr_bronze_3',
        name: 'Jakobi Meyers',
        position: 'WR',
        tier: 'bronze',
        overall: 71,
        stats: { speed: 78, catching: 72, route: 70 }
    },
    wr_bronze_4: {
        id: 'wr_bronze_4',
        name: 'Chase Claypool',
        position: 'WR',
        tier: 'bronze',
        overall: 74,
        stats: { speed: 84, catching: 68, route: 69 }
    },

    // SILVER WRs
    wr_silver_1: {
        id: 'wr_silver_1',
        name: 'DeVonta Smith',
        position: 'WR',
        tier: 'silver',
        overall: 84,
        stats: { speed: 88, catching: 85, route: 86 }
    },
    wr_silver_2: {
        id: 'wr_silver_2',
        name: 'Chris Olave',
        position: 'WR',
        tier: 'silver',
        overall: 83,
        stats: { speed: 90, catching: 82, route: 84 }
    },
    wr_silver_3: {
        id: 'wr_silver_3',
        name: 'Tee Higgins',
        position: 'WR',
        tier: 'silver',
        overall: 85,
        stats: { speed: 85, catching: 88, route: 83 }
    },
    wr_silver_4: {
        id: 'wr_silver_4',
        name: 'DK Metcalf',
        position: 'WR',
        tier: 'silver',
        overall: 82,
        stats: { speed: 92, catching: 79, route: 76 }
    },

    // GOLD WRs
    wr_gold_1: {
        id: 'wr_gold_1',
        name: 'Tyreek Hill',
        position: 'WR',
        tier: 'gold',
        overall: 96,
        stats: { speed: 99, catching: 93, route: 95 }
    },
    wr_gold_2: {
        id: 'wr_gold_2',
        name: 'Justin Jefferson',
        position: 'WR',
        tier: 'gold',
        overall: 96,
        stats: { speed: 93, catching: 97, route: 96 }
    },
    wr_gold_3: {
        id: 'wr_gold_3',
        name: 'CeeDee Lamb',
        position: 'WR',
        tier: 'gold',
        overall: 94,
        stats: { speed: 91, catching: 95, route: 94 }
    },
    wr_gold_4: {
        id: 'wr_gold_4',
        name: 'Cooper Kupp',
        position: 'WR',
        tier: 'gold',
        overall: 93,
        stats: { speed: 88, catching: 96, route: 97 }
    },
    wr_gold_5: {
        id: 'wr_gold_5',
        name: 'Davante Adams',
        position: 'WR',
        tier: 'gold',
        overall: 95,
        stats: { speed: 90, catching: 97, route: 98 }
    },

    // DIAMOND WRs - Legends
    wr_diamond_1: {
        id: 'wr_diamond_1',
        name: 'Randy Moss',
        position: 'WR',
        tier: 'diamond',
        overall: 99,
        stats: { speed: 98, catching: 99, route: 96 }
    },
    wr_diamond_2: {
        id: 'wr_diamond_2',
        name: 'Jerry Rice',
        position: 'WR',
        tier: 'diamond',
        overall: 99,
        stats: { speed: 94, catching: 99, route: 99 }
    },
    wr_diamond_3: {
        id: 'wr_diamond_3',
        name: 'Terrell Owens',
        position: 'WR',
        tier: 'diamond',
        overall: 98,
        stats: { speed: 95, catching: 97, route: 94 }
    },
    wr_diamond_4: {
        id: 'wr_diamond_4',
        name: 'Calvin Johnson',
        position: 'WR',
        tier: 'diamond',
        overall: 99,
        stats: { speed: 96, catching: 98, route: 95 }
    },

    // ========== TIGHT ENDS ==========
    
    // BRONZE TEs
    te_bronze_1: {
        id: 'te_bronze_1',
        name: 'Tyler Conklin',
        position: 'TE',
        tier: 'bronze',
        overall: 72,
        stats: { speed: 72, catching: 74, blocking: 70 }
    },
    te_bronze_2: {
        id: 'te_bronze_2',
        name: 'Hunter Henry',
        position: 'TE',
        tier: 'bronze',
        overall: 73,
        stats: { speed: 70, catching: 76, blocking: 72 }
    },

    // SILVER TEs
    te_silver_1: {
        id: 'te_silver_1',
        name: 'Dallas Goedert',
        position: 'TE',
        tier: 'silver',
        overall: 84,
        stats: { speed: 78, catching: 86, blocking: 82 }
    },
    te_silver_2: {
        id: 'te_silver_2',
        name: 'Evan Engram',
        position: 'TE',
        tier: 'silver',
        overall: 82,
        stats: { speed: 82, catching: 83, blocking: 76 }
    },

    // GOLD TEs
    te_gold_1: {
        id: 'te_gold_1',
        name: 'Travis Kelce',
        position: 'TE',
        tier: 'gold',
        overall: 96,
        stats: { speed: 87, catching: 97, blocking: 88 }
    },
    te_gold_2: {
        id: 'te_gold_2',
        name: 'George Kittle',
        position: 'TE',
        tier: 'gold',
        overall: 94,
        stats: { speed: 85, catching: 93, blocking: 95 }
    },

    // DIAMOND TEs - Legends
    te_diamond_1: {
        id: 'te_diamond_1',
        name: 'Tony Gonzalez',
        position: 'TE',
        tier: 'diamond',
        overall: 99,
        stats: { speed: 84, catching: 98, blocking: 90 }
    },
    te_diamond_2: {
        id: 'te_diamond_2',
        name: 'Rob Gronkowski',
        position: 'TE',
        tier: 'diamond',
        overall: 99,
        stats: { speed: 82, catching: 96, blocking: 98 }
    },

    // ========== LINEBACKERS ==========
    
    // BRONZE LBs
    lb_bronze_basic: {
        id: 'lb_bronze_basic',
        name: 'Undrafted LB',
        position: 'LB',
        tier: 'bronze',
        overall: 70,
        stats: { tackling: 70, speed: 72, awareness: 65 }
    },
    lb_bronze_1: {
        id: 'lb_bronze_1',
        name: 'Bobby Okereke',
        position: 'LB',
        tier: 'bronze',
        overall: 72,
        stats: { tackling: 74, speed: 75, awareness: 70 }
    },
    lb_bronze_2: {
        id: 'lb_bronze_2',
        name: 'Jordan Hicks',
        position: 'LB',
        tier: 'bronze',
        overall: 73,
        stats: { tackling: 76, speed: 72, awareness: 72 }
    },
    lb_bronze_3: {
        id: 'lb_bronze_3',
        name: 'Kyzir White',
        position: 'LB',
        tier: 'bronze',
        overall: 71,
        stats: { tackling: 72, speed: 78, awareness: 68 }
    },

    // SILVER LBs
    lb_silver_1: {
        id: 'lb_silver_1',
        name: 'Roquan Smith',
        position: 'LB',
        tier: 'silver',
        overall: 85,
        stats: { tackling: 88, speed: 87, awareness: 84 }
    },
    lb_silver_2: {
        id: 'lb_silver_2',
        name: 'Bobby Wagner',
        position: 'LB',
        tier: 'silver',
        overall: 84,
        stats: { tackling: 90, speed: 82, awareness: 92 }
    },
    lb_silver_3: {
        id: 'lb_silver_3',
        name: 'Demario Davis',
        position: 'LB',
        tier: 'silver',
        overall: 83,
        stats: { tackling: 87, speed: 80, awareness: 88 }
    },

    // GOLD LBs
    lb_gold_1: {
        id: 'lb_gold_1',
        name: 'Fred Warner',
        position: 'LB',
        tier: 'gold',
        overall: 96,
        stats: { tackling: 96, speed: 91, awareness: 97 }
    },
    lb_gold_2: {
        id: 'lb_gold_2',
        name: 'Micah Parsons',
        position: 'LB',
        tier: 'gold',
        overall: 95,
        stats: { tackling: 94, speed: 94, awareness: 90 }
    },
    lb_gold_3: {
        id: 'lb_gold_3',
        name: 'TJ Watt',
        position: 'LB',
        tier: 'gold',
        overall: 94,
        stats: { tackling: 97, speed: 88, awareness: 93 }
    },

    // DIAMOND LBs - Legends
    lb_diamond_1: {
        id: 'lb_diamond_1',
        name: 'Ray Lewis',
        position: 'LB',
        tier: 'diamond',
        overall: 99,
        stats: { tackling: 99, speed: 92, awareness: 99 }
    },
    lb_diamond_2: {
        id: 'lb_diamond_2',
        name: 'Lawrence Taylor',
        position: 'LB',
        tier: 'diamond',
        overall: 99,
        stats: { tackling: 98, speed: 95, awareness: 96 }
    },
    lb_diamond_3: {
        id: 'lb_diamond_3',
        name: 'Dick Butkus',
        position: 'LB',
        tier: 'diamond',
        overall: 99,
        stats: { tackling: 99, speed: 88, awareness: 98 }
    },

    // ========== CORNERBACKS ==========
    
    // BRONZE CBs
    cb_bronze_1: {
        id: 'cb_bronze_1',
        name: 'Cameron Dantzler',
        position: 'CB',
        tier: 'bronze',
        overall: 71,
        stats: { coverage: 72, speed: 82, agility: 70 }
    },
    cb_bronze_2: {
        id: 'cb_bronze_2',
        name: 'Rock Ya-Sin',
        position: 'CB',
        tier: 'bronze',
        overall: 72,
        stats: { coverage: 73, speed: 84, agility: 72 }
    },
    cb_bronze_3: {
        id: 'cb_bronze_3',
        name: 'Eli Apple',
        position: 'CB',
        tier: 'bronze',
        overall: 70,
        stats: { coverage: 70, speed: 80, agility: 68 }
    },

    // SILVER CBs
    cb_silver_1: {
        id: 'cb_silver_1',
        name: 'Trevon Diggs',
        position: 'CB',
        tier: 'silver',
        overall: 84,
        stats: { coverage: 85, speed: 88, agility: 86 }
    },
    cb_silver_2: {
        id: 'cb_silver_2',
        name: 'Xavien Howard',
        position: 'CB',
        tier: 'silver',
        overall: 83,
        stats: { coverage: 88, speed: 85, agility: 84 }
    },
    cb_silver_3: {
        id: 'cb_silver_3',
        name: 'Marlon Humphrey',
        position: 'CB',
        tier: 'silver',
        overall: 85,
        stats: { coverage: 87, speed: 86, agility: 88 }
    },

    // GOLD CBs
    cb_gold_1: {
        id: 'cb_gold_1',
        name: 'Sauce Gardner',
        position: 'CB',
        tier: 'gold',
        overall: 95,
        stats: { coverage: 97, speed: 92, agility: 94 }
    },
    cb_gold_2: {
        id: 'cb_gold_2',
        name: 'Jalen Ramsey',
        position: 'CB',
        tier: 'gold',
        overall: 94,
        stats: { coverage: 96, speed: 93, agility: 95 }
    },
    cb_gold_3: {
        id: 'cb_gold_3',
        name: 'Patrick Surtain II',
        position: 'CB',
        tier: 'gold',
        overall: 93,
        stats: { coverage: 95, speed: 90, agility: 92 }
    },

    // DIAMOND CBs - Legends
    cb_diamond_1: {
        id: 'cb_diamond_1',
        name: 'Deion Sanders',
        position: 'CB',
        tier: 'diamond',
        overall: 99,
        stats: { coverage: 99, speed: 98, agility: 97 }
    },
    cb_diamond_2: {
        id: 'cb_diamond_2',
        name: 'Darrelle Revis',
        position: 'CB',
        tier: 'diamond',
        overall: 99,
        stats: { coverage: 99, speed: 94, agility: 96 }
    },
    cb_diamond_3: {
        id: 'cb_diamond_3',
        name: 'Rod Woodson',
        position: 'CB',
        tier: 'diamond',
        overall: 98,
        stats: { coverage: 97, speed: 96, agility: 95 }
    },

    // ========== SAFETIES ==========
    
    // BRONZE S
    s_bronze_1: {
        id: 's_bronze_1',
        name: 'Jayron Kearse',
        position: 'S',
        tier: 'bronze',
        overall: 72,
        stats: { coverage: 70, speed: 78, hitpower: 74 }
    },
    s_bronze_2: {
        id: 's_bronze_2',
        name: 'Talanoa Hufanga',
        position: 'S',
        tier: 'bronze',
        overall: 73,
        stats: { coverage: 72, speed: 76, hitpower: 78 }
    },

    // SILVER S
    s_silver_1: {
        id: 's_silver_1',
        name: 'Jessie Bates III',
        position: 'S',
        tier: 'silver',
        overall: 84,
        stats: { coverage: 86, speed: 84, hitpower: 80 }
    },
    s_silver_2: {
        id: 's_silver_2',
        name: 'Xavier McKinney',
        position: 'S',
        tier: 'silver',
        overall: 83,
        stats: { coverage: 84, speed: 82, hitpower: 85 }
    },

    // GOLD S
    s_gold_1: {
        id: 's_gold_1',
        name: 'Minkah Fitzpatrick',
        position: 'S',
        tier: 'gold',
        overall: 95,
        stats: { coverage: 95, speed: 91, hitpower: 92 }
    },
    s_gold_2: {
        id: 's_gold_2',
        name: 'Derwin James',
        position: 'S',
        tier: 'gold',
        overall: 94,
        stats: { coverage: 92, speed: 93, hitpower: 96 }
    },

    // DIAMOND S - Legends
    s_diamond_1: {
        id: 's_diamond_1',
        name: 'Ed Reed',
        position: 'S',
        tier: 'diamond',
        overall: 99,
        stats: { coverage: 99, speed: 93, hitpower: 90 }
    },
    s_diamond_2: {
        id: 's_diamond_2',
        name: 'Troy Polamalu',
        position: 'S',
        tier: 'diamond',
        overall: 99,
        stats: { coverage: 96, speed: 94, hitpower: 98 }
    },

    // ========== COACHES ==========
    
    // GOLD Coaches
    coach_gold_1: {
        id: 'coach_gold_1',
        name: 'Andy Reid',
        position: 'COACH',
        tier: 'gold',
        overall: 94,
        stats: { offense: 96, defense: 88, special: 92 }
    },
    coach_gold_2: {
        id: 'coach_gold_2',
        name: 'Bill Belichick',
        position: 'COACH',
        tier: 'gold',
        overall: 95,
        stats: { offense: 88, defense: 98, special: 94 }
    },

    // DIAMOND Coaches - Legends
    coach_diamond_1: {
        id: 'coach_diamond_1',
        name: 'Vince Lombardi',
        position: 'COACH',
        tier: 'diamond',
        overall: 99,
        stats: { offense: 97, defense: 98, special: 96 }
    },
    coach_diamond_2: {
        id: 'coach_diamond_2',
        name: 'Bill Walsh',
        position: 'COACH',
        tier: 'diamond',
        overall: 99,
        stats: { offense: 99, defense: 94, special: 95 }
    },
    coach_diamond_3: {
        id: 'coach_diamond_3',
        name: 'John Madden',
        position: 'COACH',
        tier: 'diamond',
        overall: 99,
        stats: { offense: 96, defense: 96, special: 98 }
    }
};

// ============================================
// PACK SYSTEM
// ============================================

const PACK_TYPES = {
    starter: {
        id: 'starter',
        name: 'Starter Pack',
        cost: 500,
        description: 'Contains 3 Bronze players',
        guaranteed: ['bronze', 'bronze', 'bronze'],
    },
    pro: {
        id: 'pro',
        name: 'Pro Pack',
        cost: 2000,
        description: '5 players with guaranteed Silver',
        guaranteed: ['silver'],
        slots: 5,
        probabilities: { bronze: 0.65, silver: 0.30, gold: 0.05 },
    },
    elite: {
        id: 'elite',
        name: 'Elite Pack',
        cost: 5000,
        description: '5 players with guaranteed Gold',
        guaranteed: ['gold'],
        slots: 5,
        probabilities: { bronze: 0.30, silver: 0.45, gold: 0.23, diamond: 0.02 },
    },
    legend: {
        id: 'legend',
        name: 'Legend Pack',
        cost: 15000,
        description: '3 Gold+ players, high Diamond chance',
        guaranteed: ['gold', 'gold'],
        slots: 3,
        probabilities: { gold: 0.70, diamond: 0.30 },
    }
};

// ============================================
// PLAYER PROGRESSION MANAGER - ENHANCED
// ============================================

class PlayerProgressionManager {
    constructor(store) {
        this.store = store;
        this.initializePlayerSystem();
    }

    initializePlayerSystem() {
        if (!this.store.state.playerCollection) {
            this.store.state.playerCollection = {
                ownedPlayers: [],
                playerInstances: {},
                activeRoster: {
                    QB: null,
                    RB: null,
                    WR1: null,
                    WR2: null,
                    TE: null,
                    LB: null,
                    CB: null,
                    S: null,
                    COACH: null
                },
                packsOpened: 0,
                duplicates: 0,
                trainingXP: 100, // Starting training XP
                evolutionStones: 0
            };
            
            // Give starter pack on first load
            this.giveStarterPack();
            this.store.save();
        }
        
        // Ensure new fields exist for older states
        if (this.store.state.playerCollection) {
            if (this.store.state.playerCollection.trainingXP === undefined) {
                this.store.state.playerCollection.trainingXP = 0;
            }
            if (this.store.state.playerCollection.evolutionStones === undefined) {
                this.store.state.playerCollection.evolutionStones = 0;
            }
        }
    }

    giveStarterPack() {
        // Award 4 random bronze players from different positions
        const positions = ['QB', 'RB', 'WR', 'LB'];
        positions.forEach(pos => {
            const bronzePlayers = Object.values(PLAYER_DATABASE).filter(
                p => p.tier === 'bronze' && p.position === pos
            );
            if (bronzePlayers.length > 0) {
                const randomPlayer = bronzePlayers[Math.floor(Math.random() * bronzePlayers.length)];
                this.unlockPlayer(randomPlayer.id, true);
            }
        });
    }

    openPack(packType) {
        const pack = PACK_TYPES[packType];
        if (!pack) return null;

        // Deduct cost
        try {
            if (typeof MinigameSync === 'undefined' || 
                !MinigameSync.deductCoins(pack.cost, `Opened ${pack.name}`, { type: 'pack_purchase', packType })) {
                return { success: false, error: 'Insufficient funds' };
            }
        } catch (e) {
            return { success: false, error: 'Payment system error' };
        }

        // Generate cards
        const cards = [];
        const slots = pack.slots || pack.guaranteed.length;

        // Add guaranteed cards
        pack.guaranteed.forEach(tier => {
            const card = this.generateCard(tier);
            cards.push(card);
        });

        // Fill remaining slots with probability-based cards
        const remaining = slots - pack.guaranteed.length;
        for (let i = 0; i < remaining; i++) {
            const tier = this.rollTier(pack.probabilities);
            const card = this.generateCard(tier);
            cards.push(card);
        }

        // Process unlocks
        const results = cards.map(card => {
            const isDuplicate = this.store.state.playerCollection.ownedPlayers.includes(card.id);
            if (isDuplicate) {
                // Convert duplicate to coins (15% of pack value per card)
                const refund = Math.floor(pack.cost * 0.15);
                try {
                    if (typeof MinigameSync !== 'undefined') {
                        MinigameSync.addCoins(refund, `Duplicate player: ${card.name}`);
                    }
                } catch (e) {}
                this.store.state.playerCollection.duplicates++;
                return { ...card, isDuplicate: true, refund };
            } else {
                this.unlockPlayer(card.id);
                return { ...card, isDuplicate: false, isNew: true };
            }
        });

        this.store.state.playerCollection.packsOpened++;
        this.store.save();

        return {
            success: true,
            packType,
            cards: results
        };
    }

    rollTier(probabilities) {
        const roll = Math.random();
        let cumulative = 0;

        for (const [tier, prob] of Object.entries(probabilities)) {
            cumulative += prob;
            if (roll <= cumulative) return tier;
        }

        return 'bronze';
    }

    generateCard(tier) {
        const eligiblePlayers = Object.values(PLAYER_DATABASE).filter(p => p.tier === tier);
        if (eligiblePlayers.length === 0) {
            return this.generateCard('bronze');
        }
        return eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
    }

    unlockPlayer(playerId, silent = false) {
        if (!this.store.state.playerCollection.ownedPlayers.includes(playerId)) {
            this.store.state.playerCollection.ownedPlayers.push(playerId);
            this.store.state.playerCollection.playerInstances[playerId] = {
                id: playerId,
                xp: 0,
                level: 1,
                gamesPlayed: 0,
                upgrades: []
            };

            if (!silent) {
                this.store.save();
            }
        }
    }

    getPlayer(playerId) {
        const baseData = PLAYER_DATABASE[playerId];
        const instanceData = this.store.state.playerCollection.playerInstances[playerId];
        
        if (!baseData) return null;

        // Calculate boosted stats from level
        const levelBoost = instanceData ? (instanceData.level - 1) * 2 : 0;
        
        return {
            ...baseData,
            instance: instanceData,
            boostedOverall: baseData.overall + levelBoost + (instanceData?.isAscended ? 10 : 0),
            boostedStats: this.calculateBoostedStats(baseData.stats, levelBoost + (instanceData?.isAscended ? 10 : 0)),
            isEvolved: (instanceData && instanceData.level >= 10),
            isAscended: (instanceData && instanceData.isAscended)
        };
    }

    calculateBoostedStats(baseStats, levelBoost) {
        const boosted = {};
        for (const [key, value] of Object.entries(baseStats)) {
            boosted[key] = Math.min(120, value + levelBoost);
        }
        return boosted;
    }

    addPlayerXP(playerId, xp) {
        const instance = this.store.state.playerCollection.playerInstances[playerId];
        if (!instance) return;

        instance.xp += xp;
        instance.gamesPlayed++;

        // Level up logic: 500 XP per level
        const newLevel = Math.floor(instance.xp / 500) + 1;
        
        // Cap level at 20 unless ascended
        if (newLevel > 20 && !instance.isAscended) {
            instance.xp = 20 * 500; // Cap XP at Level 20 max
            instance.level = 20;
            return { leveledUp: false, capped: true };
        }

        if (newLevel > instance.level) {
            instance.level = newLevel;
            this.store.save();
            return { leveledUp: true, newLevel };
        }

        this.store.save();
        return { leveledUp: false };
    }

    ascendPlayer(playerId) {
        const instance = this.store.state.playerCollection.playerInstances[playerId];
        if (!instance) return { success: false, error: 'Player not found' };

        if (instance.level < 20) {
            return { success: false, error: 'Player must be Level 20 to Ascend' };
        }

        if (instance.isAscended) {
            return { success: false, error: 'Player is already Ascended' };
        }

        // Check for Ascension Stone in inventory
        const stones = this.store.state.playerCollection.evolutionStones || 0;
        if (stones < 1) {
            return { success: false, error: 'You need an Ascension Stone!' };
        }

        this.store.state.playerCollection.evolutionStones--;
        instance.isAscended = true;
        this.store.save();

        return { success: true };
    }

    setActiveRoster(position, playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return false;

        // PREVENT DUPLICATE ASSIGNMENTS
        const currentRoster = this.store.state.playerCollection.activeRoster;
        
        // Check if player is already assigned to another position
        for (const [pos, assignedId] of Object.entries(currentRoster)) {
            if (assignedId === playerId && pos !== position) {
                // Player already assigned to different position
                alert(`${player.name} is already assigned to ${pos}. Remove them first to reassign.`);
                return false;
            }
        }

        // Validate position match (flexible for WR and flex positions)
        if (position === 'WR1' || position === 'WR2') {
            if (player.position !== 'WR') {
                alert('Only Wide Receivers can be assigned to WR slots.');
                return false;
            }
        } else if (position === 'TE') {
            if (player.position !== 'TE') {
                alert('Only Tight Ends can be assigned to TE slot.');
                return false;
            }
        } else if (position === 'S') {
            if (player.position !== 'S') {
                alert('Only Safeties can be assigned to S slot.');
                return false;
            }
        } else if (position === 'COACH') {
            if (player.position !== 'COACH') {
                alert('Only Coaches can be assigned to COACH slot.');
                return false;
            }
        } else {
            // Standard position validation
            if (player.position !== position) {
                alert(`${player.name} is a ${player.position}, not a ${position}.`);
                return false;
            }
        }

        this.store.state.playerCollection.activeRoster[position] = playerId;
        this.recalculateTeamStats();
        this.store.save();
        return true;
    }

    removeFromRoster(position) {
        this.store.state.playerCollection.activeRoster[position] = null;
        this.recalculateTeamStats();
        this.store.save();
    }

    recalculateTeamStats() {
        const roster = this.store.state.playerCollection.activeRoster;
        let totalOffense = 0;
        let totalDefense = 0;
        let offenseCount = 0;
        let defenseCount = 0;

        // Offense positions: QB, RB, WR1, WR2, TE
        ['QB', 'RB', 'WR1', 'WR2', 'TE'].forEach(pos => {
            if (roster[pos]) {
                const player = this.getPlayer(roster[pos]);
                if (player) {
                    totalOffense += player.boostedOverall;
                    offenseCount++;
                }
            }
        });

        // Defense positions: LB, CB, S
        ['LB', 'CB', 'S'].forEach(pos => {
            if (roster[pos]) {
                const player = this.getPlayer(roster[pos]);
                if (player) {
                    totalDefense += player.boostedOverall;
                    defenseCount++;
                }
            }
        });

        // Coach bonus
        if (roster['COACH']) {
            const coach = this.getPlayer(roster['COACH']);
            if (coach && coach.stats) {
                totalOffense += coach.stats.offense || 0;
                totalDefense += coach.stats.defense || 0;
            }
        }

        // Calculate averages (default to 70 if no players)
        const offense = offenseCount > 0 ? Math.floor(totalOffense / 5) : 70;
        const defense = defenseCount > 0 ? Math.floor(totalDefense / 3) : 70;

        // Apply legacy bonuses (old shop system)
        let legacyOffenseBonus = 0;
        let legacyDefenseBonus = 0;
        
        if (this.store.state.inventory) {
            if (this.store.state.inventory.includes('burrow')) legacyOffenseBonus += 5;
            if (this.store.state.inventory.includes('moss')) legacyOffenseBonus += 5;
            if (this.store.state.inventory.includes('madden')) {
                legacyOffenseBonus += 5;
                legacyDefenseBonus += 5;
            }
        }

        this.store.state.userTeam.stats.offense = Math.min(99, offense + legacyOffenseBonus);
        this.store.state.userTeam.stats.defense = Math.min(99, defense + legacyDefenseBonus);
    }

    getOwnedPlayersByPosition(position) {
        return this.store.state.playerCollection.ownedPlayers
            .map(id => this.getPlayer(id))
            .filter(p => p && p.position === position)
            .sort((a, b) => b.boostedOverall - a.boostedOverall);
    }

    getAllOwnedPlayers() {
        return this.store.state.playerCollection.ownedPlayers
            .map(id => this.getPlayer(id))
            .filter(p => p)
            .sort((a, b) => {
                const tierOrder = { diamond: 4, gold: 3, silver: 2, bronze: 1 };
                if (tierOrder[a.tier] !== tierOrder[b.tier]) {
                    return tierOrder[b.tier] - tierOrder[a.tier];
                }
                return b.boostedOverall - a.boostedOverall;
            });
    }

    getCollectionStats() {
        const total = Object.keys(PLAYER_DATABASE).length;
        const owned = this.store.state.playerCollection.ownedPlayers.length;
        const byTier = {
            bronze: 0,
            silver: 0,
            gold: 0,
            diamond: 0
        };

        this.store.state.playerCollection.ownedPlayers.forEach(id => {
            const player = PLAYER_DATABASE[id];
            if (player) byTier[player.tier]++;
        });

        return {
            total,
            owned,
            percentage: Math.floor((owned / total) * 100),
            byTier,
            packsOpened: this.store.state.playerCollection.packsOpened,
            duplicates: this.store.state.playerCollection.duplicates
        };
    }

    awardGameXP() {
        const roster = this.store.state.playerCollection.activeRoster;
        const levelUps = [];

        Object.values(roster).forEach(playerId => {
            if (playerId) {
                const result = this.addPlayerXP(playerId, 50);
                if (result && result.leveledUp) {
                    const player = this.getPlayer(playerId);
                    if (player) {
                        levelUps.push({ player: player.name, level: result.newLevel });
                    }
                }
            }
        });

        // Note: Training XP is now awarded in minigame-tecmo-sim.js endGame() with difficulty scaling
        // This prevents duplicate TXP awards

        return levelUps;
    }

    burnPlayer(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, error: 'Player not found' };

        // Cannot burn players on active roster
        const roster = this.store.state.playerCollection.activeRoster;
        const isOnRoster = Object.values(roster).includes(playerId);
        if (isOnRoster) {
            return { success: false, error: 'Cannot retire a player on the active roster' };
        }

        // Calculate XP value based on tier and level
        const tierValues = { bronze: 100, silver: 250, gold: 1000, diamond: 5000 };
        const baseXP = tierValues[player.tier] || 50;
        const levelBonus = (player.instance.level - 1) * 50;
        const totalXPValue = baseXP + levelBonus;

        // Remove player
        this.store.state.playerCollection.ownedPlayers = this.store.state.playerCollection.ownedPlayers.filter(id => id !== playerId);
        delete this.store.state.playerCollection.playerInstances[playerId];
        
        // Add to global training XP
        this.store.state.playerCollection.trainingXP += totalXPValue;
        this.store.save();

        return { success: true, xpGained: totalXPValue };
    }

    trainPlayer(playerId, costXP) {
        const instance = this.store.state.playerCollection.playerInstances[playerId];
        if (!instance) return { success: false, error: 'Player not found' };

        if (this.store.state.playerCollection.trainingXP < costXP) {
            return { success: false, error: 'Insufficient Training XP' };
        }

        this.store.state.playerCollection.trainingXP -= costXP;
        const result = this.addPlayerXP(playerId, costXP);
        this.store.save();

        return { success: true, leveledUp: result.leveledUp, newLevel: instance.level };
    }
}

// Export for global use
if (typeof window !== 'undefined') {
    window.PlayerProgressionManager = PlayerProgressionManager;
    window.PLAYER_DATABASE = PLAYER_DATABASE;
    window.PACK_TYPES = PACK_TYPES;
}
