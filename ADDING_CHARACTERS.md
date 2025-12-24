# How to Add a New Character

This document outlines the steps to add a new character to Bodhi's Brainrots.

## 1. Prepare Assets

You need the following assets:
- **Sprite Sheet** (PNG): A 4x4 grid containing animations.
  - Rows: Walk Down, Walk Up, Walk Left, Walk Right.
  - Resolution: Recommended 256x256 per cell (1024x1024 sheet). 
  - If providing a static image or different format, you may need to process it (see `process_sprites.js` example).
  - **Note on Magenta**: If using a magenta background for transparency, use a processing script to remove it (Distance-based keying is recommended for JPEG artifacts).
- **Callout Sound** (MP3): Voice clip announcing the character's name.

Place files in `public/sprites/`.

## 2. Register Assets (`src/assets.js`)

Add `loadSprite` and `loadSound` calls. Ensure you define the 4x4 slicing and animations.

```javascript
// Example
loadSprite("newchar_front", "sprites/newchar_front.png"); // Single frame for menu
loadSprite("newchar_back", "sprites/newchar_back.png");   // Single frame for menu (back view)
loadSprite("newchar_anim", "sprites/newchar_sheet.png", {
    sliceX: 4, sliceY: 4,
    anims: {
        walk_down: { from: 0, to: 3, loop: true, speed: 8 },
        walk_up: { from: 4, to: 7, loop: true, speed: 8 },
        walk_left: { from: 8, to: 11, loop: true, speed: 8 },
        walk_right: { from: 12, to: 15, loop: true, speed: 8 },
        idle_down: { from: 0, to: 0 },
        idle_up: { from: 4, to: 4 },
        idle_left: { from: 8, to: 8 },  // Required!
        idle_right: { from: 12, to: 12 }, // Required!
        idle_side: { from: 8, to: 8 },
    }
});
loadSound("callout_5", "sprites/callout_newchar.mp3"); // Index must match constants.js
```

## 3. Configure Character (`src/constants.js`)

Add a new object to the `PLAYERS` array. The index in this array determines the character ID (0, 1, 2...).

```javascript
    {
        name: "New Char",
        spriteFront: "newchar_front",
        spriteBack: "newchar_back",
        spriteAnim: "newchar_anim",
        scale: 1, // Optional: Scale factor if sprite is small/large
        keys: { up: "up", ... } // Placeholder keys (not strictly used for online/AI)
    },
```

## 4. Verify

The game logic dynamically adapts to the `PLAYERS.length`, so the character should automatically appear in:
- Main Menu Roster
- Character Selection Screen
- Lobby
- AI Opponent Pool

**Important**: If adding a 5th+ player, ensure there are enough spawn points defined in `START_POSITIONS` (though center spawn logic exists).
