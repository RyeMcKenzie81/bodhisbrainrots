# Bodhi's Brainrots - Claude Context File

## Project Overview
A Bomberman-style multiplayer game built with Kaboom.js featuring "Brainrot" meme characters. Created as a father-son project.

## Tech Stack
- **Framework**: Kaboom.js v3000 (via npm)
- **Build Tool**: Vite
- **Language**: JavaScript (ES modules)
- **Assets**: Custom sprites (JPEG→PNG with transparency), MP3 audio

## Project Structure
```
bodhisbrainrots/
├── package.json
├── index.html
├── src/
│   └── main.js          # All game code (single file)
├── public/
│   └── sprites/         # All assets (images + audio)
│       ├── *front.png, *back.png  # Character sprites
│       ├── brainbomb.png, brainbombexplode.png
│       ├── woodblock.png, diamondblock.png
│       ├── powerup*.png
│       ├── music.mp3, characterselect.mp3
│       ├── bomb1.mp3, bomb2.mp3, die.mp3, dead.mp3
│       ├── powerup.mp3, *poweredup.mp3
│       └── callout_*.mp3
```

## Game Scenes (in order)
1. **menu** - Title screen, press SPACE to start
2. **playerCount** - Select 2-4 players with A/D keys
3. **characterSelect** - SF2-style fighter selection (per player)
4. **game** - Main gameplay
5. **gameover** - Winner announcement

## Characters (index order matters!)
| Index | Name | Controls (as Player N) |
|-------|------|------------------------|
| 0 | Tung Tung Sahur | WASD + Space |
| 1 | Meowl | Arrows + Enter |
| 2 | Strawberry Elephant | IJKL + O |
| 3 | Cappucino Assassino | TFGH + Y |

## Key Game Constants (in main.js)
```javascript
TILE_SIZE = 64
GRID_WIDTH = 15
GRID_HEIGHT = 11
BOMB_TIMER = 2.5 seconds
EXPLOSION_DURATION = 0.6 seconds
```

## Current Features
- [x] 2-4 player local multiplayer
- [x] Character selection screen (SF2 style)
- [x] Player count selection
- [x] Custom character sprites with front/back views
- [x] Brain bomb with pulsing animation
- [x] Explosion effects with custom sprite
- [x] Destructible wood blocks / indestructible diamond blocks
- [x] Power-ups: +Bomb, +Fire range, +Speed (with sprites & animations)
- [x] Lane-locked movement (classic Bomberman style)
- [x] Bombs block movement (with escape grace period)
- [x] Background music (game + character select)
- [x] Sound effects (explosions, death, powerups, character callouts)
- [x] Player glow effect when collecting powerups
- [x] Dead players removed from map

## Key Implementation Details

### Player Spawning
Players spawn at corners based on `START_POSITIONS` array. The `spawnPlayer(playerIndex, characterIndex)` function separates:
- `playerIndex` → which corner/controls (0-3)
- `characterIndex` → which character appearance (from gameConfig.playerCharacters)

### Bomb Mechanics
- Bombs start passable (no body component)
- Once owner leaves the tile, `body({ isStatic: true })` is added
- Chain reactions supported (bombs trigger other bombs)

### Movement System
- Lane-locking: moving in one direction snaps perpendicular axis to grid center
- `SNAP_THRESHOLD = 8` pixels before hard snap
- Player hitbox scaled to 0.45 for easier navigation

### Game Configuration
```javascript
gameConfig = {
  playerCount: 2-4,
  playerCharacters: [charIndex, charIndex, ...] // in player order
}
```

## Running the Game
```bash
cd /Users/ryemckenzie/projects/bodhisbrainrots
npm install
npm run dev
# Open http://localhost:5173
```

## Asset Pipeline
New images from `/Users/ryemckenzie/Downloads/brainrots/`:
1. Copy to `public/sprites/`
2. Convert with ImageMagick: `magick input.jpeg -fuzz 10% -transparent white output.png`
3. Load in main.js: `loadSprite("name", "/sprites/output.png")`

## Next Feature: AI Players (1-Player Mode)
See PROMPT_AI_PLAYERS.md for implementation prompt.
