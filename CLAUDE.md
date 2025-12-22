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
2. **modeSelect** - Choose Single Player or Multiplayer
3. **difficultySelect** - (Single Player only) Choose difficulty + number of AI opponents
4. **playerCount** - (Multiplayer only) Select 2-4 players with A/D keys
5. **characterSelect** - SF2-style fighter selection (per player)
6. **game** - Main gameplay
7. **gameover** - Winner announcement

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
- [x] **1-Player mode with AI opponents (1-3 CPUs)**
- [x] **3 difficulty levels: Easy, Medium, Hard**
- [x] Character selection screen (SF2 style)
- [x] Player count selection
- [x] Custom character sprites with front/back views
- [x] Brain bomb with pulsing animation
- [x] Explosion effects with custom sprite
- [x] Destructible wood blocks / indestructible diamond blocks
- [x] Power-ups: +Bomb, +Fire range, +Speed (with sprites & animations)
- [x] **Kick powerup** - Lets you kick bombs across the arena!
- [x] **Skull curse powerup** - Random debuffs (slow, no bombs, short fuse, reversed controls)
- [x] Lane-locked movement (classic Bomberman style)
- [x] Bombs block movement (with escape grace period)
- [x] Background music (game + character select)
- [x] Sound effects (explosions, death, powerups, character callouts)
- [x] Player glow effect when collecting powerups
- [x] Dead players removed from map
- [x] **Countdown timer (3, 2, 1, GO!)** at game start
- [x] **2-minute match timer** with speedup music in final 30 seconds
- [x] **Screen shake** on explosions
- [x] **Player name tags** above characters (P1, P2, CPU, etc.)
- [x] **Stats HUD** showing each player's bomb/fire/speed stats

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
  mode: "singleplayer" | "multiplayer",
  playerCount: 2-4,
  playerCharacters: [charIndex, charIndex, ...], // in player order
  difficulty: "easy" | "medium" | "hard" // only for singleplayer
}
```

### AI System (Single Player Mode)
- **Easy**: 400ms reaction time, 30% random movement, 90% flee chance, 25% bomb chance
- **Medium**: 200ms reaction time, 15% random movement, 95% flee chance, 40% bomb chance
- **Hard**: 100ms reaction time, 5% random movement, 99% flee chance, 60% bomb chance

AI Decision Priority:
1. **Escape danger** - Flee from bomb explosion paths (forced for 2s after placing bomb)
2. **Get powerups** - Collect nearby powerups (within 4 tiles)
3. **Hunt player** - Chase human player (Medium/Hard only)
4. **Destroy blocks** - Place bombs near destructible blocks
5. **Wander** - Random safe movement

Key AI functions in main.js:
- `spawnAIPlayer(playerIndex, characterIndex, difficulty)` - Creates AI player
- `makeAIDecision(ai)` - Returns action/target/direction
- `findPath(startX, startY, targetX, targetY)` - BFS pathfinding
- `getExplosionDangerZones()` - Returns all tiles that will explode
- `canEscapeAfterBomb(ai, gridX, gridY)` - Checks escape route before bombing

### Match Timer System
- 2-minute matches (120 seconds)
- Timer display at top center of screen
- At 30 seconds: Timer turns orange, music starts speeding up
- At 10 seconds: Timer turns red and enlarges
- Music speed: 1.0x at 30s → 1.5x at 0s (gradual increase)
- Time's up: Game ends, most surviving players = draw

### Powerup System
| Powerup | Spawn Weight | Effect |
|---------|--------------|--------|
| Bomb (+1) | 30% | Increase max bombs |
| Fire (+1) | 30% | Increase explosion range |
| Speed (+40) | 25% | Increase movement speed |
| **Kick** | 10% | Can kick bombs by walking into them |
| **Skull** | 5% | Random curse (slow, -bomb, -fire, reversed controls) |

Kick bombs slide until hitting a wall, block, or another bomb.
Skull curses last 3 seconds with purple flashing effect.

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

## Completed: AI Players (1-Player Mode)
The AI opponent system has been implemented. See PROMPT_AI_PLAYERS.md for the original spec.

## Planned Future Features
- [ ] **Walking animations** - Needs animated sprite sheets for each character
- [ ] **Player registration** - Name input, localStorage or backend storage
- [ ] **Networked multiplayer** - Play on different devices (requires backend + WebSockets)
- [ ] **More maps** - Different arena layouts
- [ ] **Character abilities** - Unique skills per character
- [ ] **Sudden death** - Shrinking arena when time runs low
