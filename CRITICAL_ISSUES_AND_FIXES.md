# 🚨 CRITICAL ISSUES AUDIT & FIX PLAN

## Date: Current Session
## Status: **REQUIRES IMMEDIATE ATTENTION**

---

## 🔴 CRITICAL ISSUE #1: Balance Resets on Rosebud Platform

### Problem
- Balance resets to 10,000 after purchases/transactions
- localStorage changes don't persist between sessions on Rosebud
- Purchases deduct coins but reset immediately

### Root Cause
Rosebud platform may clear localStorage between sessions OR multiple localStorage write operations are conflicting.

### Solution Strategy
1. **Consolidate ALL balance writes** to go through a single debounced function
2. **Add persistence verification** after every write
3. **Implement emergency backup** to sessionStorage
4. **Add visual persistence indicator** to show when data is saved

### Files to Fix
- `/global-state-manager.js` - Add debounced save + verification
- `/shop-system.js` - Remove direct localStorage writes
- `/minigame-sync.js` - Ensure all updates go through global state

---

## 🔴 CRITICAL ISSUE #2: Inventory Only Shows Streak Shield

### Problem
- Only "streak-shield" items appear in inventory
- Other purchases (boosters, avatars) don't display
- Items are categorized incorrectly

### Root Cause
1. **Category Mismatch**: Items saved as `booster` but read as `boosters` (plural)
2. **Missing Item Data**: Shop doesn't provide complete metadata
3. **Inventory Filter Bug**: Display logic only shows consumables

### Solution
1. Fix pluralization inconsistency in `addItem()`
2. Add complete item metadata to shop purchases
3. Update inventory rendering to show ALL categories

### Files to Fix
- `/global-state-manager.js` - Fix `addItem()` pluralization
- `/shop-system.js` - Add complete metadata
- `/profile-inventory.js` - Fix rendering filters
- `/sports-lounge-inventory.js` - Update display logic

---

## 🔴 CRITICAL ISSUE #3: Avatar Display Not Working

### Problem
- Avatars don't display their actual images
- System shows emoji fallbacks instead of asset images
- No connection between purchased avatars and asset library

### Root Cause
1. **No Asset Integration**: Avatar system uses emojis, not actual image URLs
2. **Missing Avatar Metadata**: Shop doesn't save avatar image URLs
3. **Display Logic**: Profile uses `textContent` for emojis, needs `<img>` tags

### Solution
Create proper avatar-to-asset mapping and update display system

### Assets Available (from list_assets)
- Jordan 1 icon: `https://rosebud.ai/assets/Jordan 1 icon.png?xjeN`
- J's 4 avatar (pro): `https://rosebud.ai/assets/J's 4 avatar (pro).png?p1Kf`
- King chess (pro): `https://rosebud.ai/assets/King chess (pro).png?DAxj`
- Lucky charm avatar (pro): `https://rosebud.ai/assets/Lucky charm avatar (pro).png?ekNh`
- Ultimate sports crown (pro): `https://rosebud.ai/assets/Ultimate sports crown 👑 (pro).png?ktnj`
- Money tree avatar VIP: `https://rosebud.ai/assets/Money tree avatar VIP.png?EHQP`
- Scrooge (VIP): `https://rosebud.ai/assets/Scrooge (VIP).png?up5M`
- Game boys avatar (VIP): `https://rosebud.ai/assets/Game boys avatar (VIP).png?Yjjl`
- Gotrich (VIP): `https://rosebud.ai/assets/Gotrich off sports betting avatar (VIP).png?Idcs`
- Guccii duffel (VIP): `https://rosebud.ai/assets/Guccii duffel avatar (vip).png?7z2L`

### Files to Fix
- `/profile-inventory.js` - Add asset URL mapping
- `/shop-system.js` - Save avatar URLs with purchases
- `/global-state-manager.js` - Update avatar storage format
- `/index.html` - Update avatar display to use `<img>`

---

## 🔴 CRITICAL ISSUE #4: Shop Items Missing Asset Images

### Problem
- Shop displays placeholder emojis instead of actual item images
- No visual connection to the asset library
- Users can't see what they're buying

### Assets Available for Shop Items
**Boosters:**
- XP booster: `https://rosebud.ai/assets/XP booster coin.png?BrOk`
- Coin multiplier: `https://rosebud.ai/assets/Gold coin with ultimate sports logo in diamonds.png?BD5X`
- 1000 coins pack: `https://rosebud.ai/assets/1000 ultimate coins.png?FRoU`

**Cosmetics:**
- Championship ring: `https://rosebud.ai/assets/Championship ring 1.png?shqb`
- Blue diamond ring: `https://rosebud.ai/assets/Ultimate sports championship diamond ring.png?1Esq`

**Trophies (for display):**
- Multiple trophy assets available for achievement displays

### Files to Fix
- `/sports-lounge.html` - Update shop HTML with real asset URLs
- `/shop-system.js` - Add asset metadata to item definitions

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Balance Persistence (HIGHEST PRIORITY) ✅ **COMPLETED**
1. ✅ Create debounced save system in global-state-manager
2. ✅ Add save verification + retry logic
3. ✅ Implement backup to sessionStorage
4. ✅ Add visual "Saved" indicator in UI

### Phase 2: Inventory Fix ✅ **IN PROGRESS**
1. ✅ Fix category pluralization bug (singular→plural mapping)
2. ✅ Enhanced logging for debugging
3. ⏳ Update shop to save complete metadata (NEXT)
4. ⏳ Fix inventory rendering to show all items
5. ⏳ Test purchase → inventory → display flow

### Phase 3: Avatar System Overhaul
1. Create AVATAR_ASSETS mapping object
2. Update shop purchase flow to include URLs
3. Modify avatar display components to use `<img>`
4. Add fallback system for missing images

### Phase 4: Asset Integration
1. Replace all shop emoji placeholders with asset URLs
2. Update inventory displays with images
3. Add loading states for images
4. Implement lazy loading for performance

---

## 🧪 TESTING CHECKLIST

### Balance Persistence
- [ ] Purchase item → refresh page → balance persists
- [ ] Play minigame → win coins → refresh → balance persists
- [ ] Multiple rapid transactions → all save correctly
- [ ] Works in both guest and authenticated mode

### Inventory Display
- [ ] Purchase booster → appears in inventory
- [ ] Purchase avatar → appears in avatars section
- [ ] Purchase consumable → appears in consumables
- [ ] All items show with correct images
- [ ] Purchase history shows all transactions

### Avatar System
- [ ] Purchase avatar → see actual image in shop
- [ ] Equip avatar → image displays in header
- [ ] Avatar shows in profile page
- [ ] Avatar shows in drawer/sidebar
- [ ] Avatar persists after refresh

### Shop Assets
- [ ] All items display real images (not emojis)
- [ ] Images load properly
- [ ] Fallbacks work if image fails
- [ ] Mobile-responsive display

---

## 🎯 SUCCESS CRITERIA

1. ✅ Balance NEVER resets unexpectedly
2. ✅ ALL purchased items appear in inventory
3. ✅ Avatars display as actual images
4. ✅ Shop shows professional asset images
5. ✅ Everything persists across page refreshes
6. ✅ Works on Rosebud platform specifically

---

## 🔧 NEXT IMMEDIATE ACTION

**START WITH**: Fix balance persistence system (Phase 1)
- This is blocking all other features
- Without reliable balance, shop/inventory are unusable
- Most critical for user trust and data integrity
