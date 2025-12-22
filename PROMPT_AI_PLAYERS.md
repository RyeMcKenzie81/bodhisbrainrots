# Prompt: Implement 1-Player Mode with AI Opponents

## Context
Read CLAUDE.md first for full project context. This is a Bomberman-style game built with Kaboom.js.

## Feature Request
Add a 1-player mode where a human player can play against 1-3 AI-controlled opponents with selectable difficulty levels.

## Requirements

### 1. Mode Selection Screen (after player count)
Add a new scene or modify playerCount to allow:
- **Multiplayer Mode** (current behavior) - 2-4 human players
- **Single Player Mode** - 1 human vs 1-3 AI opponents

### 2. Difficulty Selection
When single player is selected, allow choosing:
- **Easy** - AI is slow, makes mistakes, doesn't chase player aggressively
- **Medium** - AI has decent pathfinding, places bombs tactically sometimes
- **Hard** - AI actively hunts player, good at trapping, avoids explosions well

### 3. AI Player Behavior

#### Core AI Loop (run each frame or every N frames)
```javascript
function updateAI(aiPlayer, difficulty) {
  // 1. Check immediate danger (am I in explosion path?)
  // 2. If in danger → pathfind to safety
  // 3. If safe → decide: hunt player, get powerup, or place bomb
  // 4. Execute movement toward target
  // 5. Decide whether to place bomb
}
```

#### Easy Mode AI
- Reaction time: slow (update every 500ms)
- Random movement 40% of time
- Only places bombs when adjacent to destructible block
- Doesn't actively chase human player
- Poor explosion avoidance (50% chance to react)

#### Medium Mode AI
- Reaction time: medium (update every 200ms)
- Basic pathfinding toward nearest target
- Places bombs to destroy blocks and trap opponents
- Avoids standing in explosion paths
- Will chase human if nearby

#### Hard Mode AI
- Reaction time: fast (update every 100ms)
- A* or BFS pathfinding
- Predicts explosion paths and avoids them
- Actively tries to trap human player
- Prioritizes powerups
- Places bombs to cut off escape routes

### 4. Implementation Suggestions

#### Grid-based Pathfinding Helper
```javascript
function getGridPos(entity) {
  return {
    x: Math.round((entity.pos.x - TILE_SIZE / 2) / TILE_SIZE),
    y: Math.round((entity.pos.y - TILE_SIZE / 2) / TILE_SIZE)
  };
}

function isWalkable(gridX, gridY) {
  // Check for walls, blocks, bombs
}

function getExplosionDangerZones() {
  // Return array of grid positions that will explode soon
}
```

#### AI Decision Making
```javascript
function aiDecide(ai, difficulty) {
  const dangerZones = getExplosionDangerZones();
  const myPos = getGridPos(ai);

  // Priority 1: Escape danger
  if (isInDanger(myPos, dangerZones)) {
    return { action: "flee", target: findSafeSpot(myPos) };
  }

  // Priority 2: Get powerup if nearby
  const nearbyPowerup = findNearestPowerup(myPos);
  if (nearbyPowerup && distance(myPos, nearbyPowerup) < 3) {
    return { action: "move", target: nearbyPowerup };
  }

  // Priority 3: Hunt or destroy blocks
  if (difficulty === "hard" || (difficulty === "medium" && Math.random() > 0.3)) {
    const humanPos = getGridPos(humanPlayer);
    return { action: "hunt", target: humanPos };
  }

  // Default: Wander and destroy blocks
  return { action: "wander", target: findNearestBlock(myPos) };
}
```

#### Spawn AI Players
Modify game scene initialization:
```javascript
// In game scene setup
for (let i = 0; i < gameConfig.playerCount; i++) {
  if (i === 0 || gameConfig.mode === "multiplayer") {
    spawnPlayer(i, gameConfig.playerCharacters[i]);
  } else {
    spawnAIPlayer(i, gameConfig.playerCharacters[i], gameConfig.difficulty);
  }
}
```

### 5. Game Config Changes
```javascript
gameConfig = {
  mode: "singleplayer" | "multiplayer",
  playerCount: 2-4,
  playerCharacters: [...],
  difficulty: "easy" | "medium" | "hard"  // only for singleplayer
}
```

### 6. UI Updates Needed
- Mode selection (Single Player / Multiplayer)
- Difficulty selection screen (for single player)
- In single player: human always uses P1 controls (WASD + Space)
- Character select: human picks first, then AI characters assigned (or random)

### 7. Testing Checklist
- [ ] AI doesn't walk into walls
- [ ] AI escapes from bomb explosions
- [ ] AI places bombs near destructible blocks
- [ ] Easy AI is beatable by a child
- [ ] Hard AI provides a challenge
- [ ] AI collects powerups
- [ ] AI can be killed by explosions
- [ ] Game ends correctly when human wins/loses

## Files to Modify
- `src/main.js` - All changes go here (single file architecture)

## Notes
- Keep AI simple at first, iterate on difficulty
- Use timers/intervals for AI updates to control difficulty
- AI players should use the same spawnPlayer mechanics but with programmatic movement instead of keyboard input
