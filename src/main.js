import kaboom from "kaboom";

// Initialize Kaboom
const k = kaboom({
  width: 960,
  height: 704,
  background: [30, 30, 50],
  scale: 1,
});

// Game constants
const TILE_SIZE = 64;
const GRID_WIDTH = 15;
const GRID_HEIGHT = 11;
const BOMB_TIMER = 2.5;
const EXPLOSION_DURATION = 0.6;

// Load sprites (PNGs with transparent backgrounds)
loadSprite("tungtung_front", "/sprites/tungtungfront.png");
loadSprite("tungtung_back", "/sprites/tungtungback.png");
loadSprite("meowl_front", "/sprites/meowlfront.png");
loadSprite("meowl_back", "/sprites/meowlback.png");
loadSprite("strawberry_front", "/sprites/strawberryfront.png");
loadSprite("strawberry_back", "/sprites/strawberryback.png");
loadSprite("cappucino_front", "/sprites/cappucinofront.png");
loadSprite("cappucino_back", "/sprites/cappucinoback.png");
loadSprite("brainbomb", "/sprites/brainbomb.png");
loadSprite("brainboom", "/sprites/brainbombexplode.png");
loadSprite("woodblock", "/sprites/woodblock.png");
loadSprite("diamondblock", "/sprites/diamondblock.png");
loadSprite("powerup_bomb", "/sprites/powerupbomb.png");
loadSprite("powerup_fire", "/sprites/powerupfire.png");
loadSprite("powerup_speed", "/sprites/powerupspeed.png");
loadSound("music", "/sprites/music.mp3");
loadSound("bomb1", "/sprites/bomb1.mp3");
loadSound("bomb2", "/sprites/bomb2.mp3");
loadSound("die", "/sprites/die.mp3");
loadSound("powerup", "/sprites/powerup.mp3");
loadSound("dead", "/sprites/dead.mp3");
loadSound("powerup_bomb", "/sprites/bombspoweredup.mp3");
loadSound("powerup_fire", "/sprites/flamespoweredup.mp3");
loadSound("powerup_speed", "/sprites/speedpowerup.mp3");
loadSound("selectmusic", "/sprites/characterselect.mp3");
loadSound("callout_0", "/sprites/callout_tungtung.mp3");
loadSound("callout_1", "/sprites/callout_meowl.mp3");
loadSound("callout_2", "/sprites/callout_strawberry.mp3");
loadSound("callout_3", "/sprites/callout_cappucino.mp3");

// Player configs
const PLAYERS = [
  {
    name: "Tung Tung",
    spriteFront: "tungtung_front",
    spriteBack: "tungtung_back",
    keys: { up: "w", down: "s", left: "a", right: "d", bomb: "space" }
  },
  {
    name: "Meowl",
    spriteFront: "meowl_front",
    spriteBack: "meowl_back",
    keys: { up: "up", down: "down", left: "left", right: "right", bomb: "enter" }
  },
  {
    name: "Strawberry",
    spriteFront: "strawberry_front",
    spriteBack: "strawberry_back",
    keys: { up: "i", down: "k", left: "j", right: "l", bomb: "o" }
  },
  {
    name: "Cappucino",
    spriteFront: "cappucino_front",
    spriteBack: "cappucino_back",
    keys: { up: "t", down: "g", left: "f", right: "h", bomb: "y" }
  },
];

// Start positions (corners)
const START_POSITIONS = [
  { x: 1, y: 1 },
  { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2 },
  { x: GRID_WIDTH - 2, y: 1 },
  { x: 1, y: GRID_HEIGHT - 2 },
];

// Game configuration (set by selection screens)
let gameConfig = {
  playerCount: 4,
  playerCharacters: [0, 1, 2, 3], // Which character index each player chose
};

// Scene: Main Menu
scene("menu", () => {
  add([
    text("BODHI'S BRAINROTS", { size: 48 }),
    pos(width() / 2, 80),
    anchor("center"),
    color(255, 100, 150),
  ]);

  add([
    text("Exploding Brain Mayhem!", { size: 20 }),
    pos(width() / 2, 130),
    anchor("center"),
    color(200, 200, 200),
  ]);

  // Character display
  const charY = 280;
  PLAYERS.forEach((p, i) => {
    const xPos = width() / 2 - 225 + i * 150;
    add([
      sprite(p.spriteFront),
      pos(xPos, charY),
      anchor("center"),
      scale(0.12),
    ]);
    add([
      text(p.name, { size: 14 }),
      pos(xPos, charY + 70),
      anchor("center"),
      color(255, 255, 255),
    ]);
  });

  // Brain bomb display
  add([
    sprite("brainbomb"),
    pos(width() / 2, 450),
    anchor("center"),
    scale(0.1),
  ]);

  add([
    text("Press SPACE to Start!", { size: 24 }),
    pos(width() / 2, 530),
    anchor("center"),
    color(255, 255, 255),
  ]);

  onKeyPress("space", () => go("playerCount"));
});

// Scene: Player Count Selection
scene("playerCount", () => {
  let selectedCount = 2;

  add([
    text("HOW MANY PLAYERS?", { size: 42 }),
    pos(width() / 2, 80),
    anchor("center"),
    color(255, 200, 100),
  ]);

  const countDisplay = add([
    text(selectedCount.toString(), { size: 120 }),
    pos(width() / 2, 250),
    anchor("center"),
    color(255, 255, 255),
  ]);

  add([
    text("< A / D >", { size: 24 }),
    pos(width() / 2, 350),
    anchor("center"),
    color(150, 150, 150),
  ]);

  add([
    text("Press SPACE to continue", { size: 20 }),
    pos(width() / 2, 450),
    anchor("center"),
    color(200, 200, 200),
  ]);

  // Player icons preview
  const playerIcons = [];
  function updatePlayerIcons() {
    playerIcons.forEach(icon => destroy(icon));
    playerIcons.length = 0;

    const startX = width() / 2 - (selectedCount - 1) * 60;
    for (let i = 0; i < selectedCount; i++) {
      const icon = add([
        sprite(PLAYERS[i].spriteFront),
        pos(startX + i * 120, 550),
        anchor("center"),
        scale(0.1),
      ]);
      playerIcons.push(icon);

      const label = add([
        text(`P${i + 1}`, { size: 16 }),
        pos(startX + i * 120, 610),
        anchor("center"),
        color(255, 255, 255),
      ]);
      playerIcons.push(label);
    }
  }
  updatePlayerIcons();

  onKeyPress("a", () => {
    selectedCount = Math.max(2, selectedCount - 1);
    countDisplay.text = selectedCount.toString();
    updatePlayerIcons();
  });

  onKeyPress("left", () => {
    selectedCount = Math.max(2, selectedCount - 1);
    countDisplay.text = selectedCount.toString();
    updatePlayerIcons();
  });

  onKeyPress("d", () => {
    selectedCount = Math.min(4, selectedCount + 1);
    countDisplay.text = selectedCount.toString();
    updatePlayerIcons();
  });

  onKeyPress("right", () => {
    selectedCount = Math.min(4, selectedCount + 1);
    countDisplay.text = selectedCount.toString();
    updatePlayerIcons();
  });

  onKeyPress("space", () => {
    gameConfig.playerCount = selectedCount;
    gameConfig.playerCharacters = [];
    go("characterSelect", { currentPlayer: 0 });
  });

  onKeyPress("escape", () => go("menu"));
});

// Global select music handle
let selectMusicHandle = null;

// Scene: Character Select (Street Fighter 2 style)
scene("characterSelect", ({ currentPlayer }) => {
  // Play select music (only start on first player)
  if (currentPlayer === 0) {
    if (selectMusicHandle) selectMusicHandle.stop();
    selectMusicHandle = play("selectmusic", { loop: true, volume: 0.5 });
  }

  let selectedChar = 0;
  const takenCharacters = gameConfig.playerCharacters;

  // Find first available character
  while (takenCharacters.includes(selectedChar) && selectedChar < 4) {
    selectedChar++;
  }

  const playerColors = [
    rgb(255, 200, 50),   // P1 - Yellow
    rgb(100, 150, 255),  // P2 - Blue
    rgb(255, 100, 150),  // P3 - Pink
    rgb(100, 255, 150),  // P4 - Green
  ];

  // Dark background with grid pattern (SF2 style)
  add([
    rect(width(), height()),
    pos(0, 0),
    color(20, 20, 40),
    z(-2),
  ]);

  // Decorative grid lines
  for (let i = 0; i < 20; i++) {
    add([
      rect(width(), 1),
      pos(0, i * 40),
      color(40, 40, 70),
      opacity(0.5),
      z(-1),
    ]);
    add([
      rect(1, height()),
      pos(i * 60, 0),
      color(40, 40, 70),
      opacity(0.5),
      z(-1),
    ]);
  }

  // Title banner
  add([
    rect(500, 50, { radius: 4 }),
    pos(width() / 2, 40),
    anchor("center"),
    color(150, 30, 30),
    outline(3, rgb(255, 200, 50)),
  ]);

  add([
    text("SELECT YOUR FIGHTER", { size: 28 }),
    pos(width() / 2, 40),
    anchor("center"),
    color(255, 255, 100),
  ]);

  // Player indicator banner
  add([
    rect(200, 36, { radius: 4 }),
    pos(width() / 2, 90),
    anchor("center"),
    color(playerColors[currentPlayer]),
  ]);

  add([
    text(`PLAYER ${currentPlayer + 1}`, { size: 22 }),
    pos(width() / 2, 90),
    anchor("center"),
    color(0, 0, 0),
  ]);

  // Character roster - horizontal row (SF2 style)
  const charSprites = [];
  const charBoxes = [];
  const rosterY = 280;
  const boxSize = 140;
  const spacing = 160;
  const rosterStartX = width() / 2 - (spacing * 1.5);

  PLAYERS.forEach((p, i) => {
    const x = rosterStartX + i * spacing;
    const isTaken = takenCharacters.includes(i);
    const takenByPlayer = takenCharacters.indexOf(i);

    // Character box with metallic border
    const box = add([
      rect(boxSize, boxSize, { radius: 4 }),
      pos(x, rosterY),
      anchor("center"),
      color(isTaken ? rgb(30, 30, 40) : rgb(50, 50, 70)),
      outline(4, isTaken ? playerColors[takenByPlayer] : rgb(80, 80, 100)),
      z(0),
      { charIndex: i },
    ]);
    charBoxes.push(box);

    // Character sprite
    const charSprite = add([
      sprite(p.spriteFront),
      pos(x, rosterY - 10),
      anchor("center"),
      scale(0.1),
      opacity(isTaken ? 0.4 : 1),
      z(1),
    ]);
    charSprites.push(charSprite);

    // Character name plate
    add([
      rect(boxSize - 10, 22, { radius: 2 }),
      pos(x, rosterY + 55),
      anchor("center"),
      color(isTaken ? rgb(40, 40, 50) : rgb(20, 20, 30)),
      z(1),
    ]);

    add([
      text(p.name, { size: 11 }),
      pos(x, rosterY + 55),
      anchor("center"),
      color(isTaken ? rgb(100, 100, 100) : rgb(255, 255, 255)),
      z(2),
    ]);

    // Player marker for taken characters
    if (isTaken) {
      add([
        rect(30, 18, { radius: 2 }),
        pos(x + boxSize/2 - 20, rosterY - boxSize/2 + 15),
        anchor("center"),
        color(playerColors[takenByPlayer]),
        z(3),
      ]);
      add([
        text(`P${takenByPlayer + 1}`, { size: 10 }),
        pos(x + boxSize/2 - 20, rosterY - boxSize/2 + 15),
        anchor("center"),
        color(0, 0, 0),
        z(4),
      ]);
    }
  });

  // Animated selection cursor
  const cursor = add([
    rect(boxSize + 10, boxSize + 10, { radius: 6 }),
    pos(rosterStartX + selectedChar * spacing, rosterY),
    anchor("center"),
    color(0, 0, 0),
    opacity(0),
    outline(5, playerColors[currentPlayer]),
    z(5),
  ]);

  // Cursor glow animation
  cursor.onUpdate(() => {
    const pulse = 3 + Math.sin(time() * 6) * 2;
    cursor.outline.width = pulse;
  });

  function updateSelection() {
    cursor.pos.x = rosterStartX + selectedChar * spacing;
    previewSprite.use(sprite(PLAYERS[selectedChar].spriteFront));
    previewName.text = PLAYERS[selectedChar].name;
  }

  // Large character preview area (SF2 style big portrait)
  add([
    rect(280, 260, { radius: 8 }),
    pos(width() / 2, 520),
    anchor("center"),
    color(30, 30, 50),
    outline(4, rgb(100, 100, 130)),
  ]);

  // VS style divider
  add([
    text("VS", { size: 40 }),
    pos(width() / 2, 400),
    anchor("center"),
    color(255, 50, 50),
    opacity(0.3),
  ]);

  const previewSprite = add([
    sprite(PLAYERS[selectedChar].spriteFront),
    pos(width() / 2, 500),
    anchor("center"),
    scale(0.22),
  ]);

  // Preview name plate
  add([
    rect(200, 30, { radius: 4 }),
    pos(width() / 2, 620),
    anchor("center"),
    color(playerColors[currentPlayer]),
  ]);

  const previewName = add([
    text(PLAYERS[selectedChar].name, { size: 18 }),
    pos(width() / 2, 620),
    anchor("center"),
    color(0, 0, 0),
  ]);

  // Previously selected characters shown on sides
  if (takenCharacters.length > 0) {
    add([
      text("SELECTED:", { size: 12 }),
      pos(50, 450),
      anchor("left"),
      color(150, 150, 150),
    ]);

    takenCharacters.forEach((charIdx, i) => {
      add([
        sprite(PLAYERS[charIdx].spriteFront),
        pos(50 + i * 70, 520),
        anchor("center"),
        scale(0.08),
      ]);
      add([
        rect(24, 14, { radius: 2 }),
        pos(50 + i * 70, 560),
        anchor("center"),
        color(playerColors[i]),
      ]);
      add([
        text(`P${i + 1}`, { size: 9 }),
        pos(50 + i * 70, 560),
        anchor("center"),
        color(0, 0, 0),
      ]);
    });
  }

  function moveSelection(dir) {
    let newChar = selectedChar;

    if (dir === "left") newChar = selectedChar - 1;
    if (dir === "right") newChar = selectedChar + 1;

    // Wrap around
    if (newChar < 0) newChar = 3;
    if (newChar > 3) newChar = 0;

    // Skip taken characters
    let attempts = 0;
    while (takenCharacters.includes(newChar) && attempts < 4) {
      newChar = dir === "left" ? newChar - 1 : newChar + 1;
      if (newChar < 0) newChar = 3;
      if (newChar > 3) newChar = 0;
      attempts++;
    }

    if (!takenCharacters.includes(newChar)) {
      selectedChar = newChar;
      updateSelection();
    }
  }

  // Controls
  const controls = PLAYERS[currentPlayer].keys;

  onKeyPress(controls.left, () => moveSelection("left"));
  onKeyPress(controls.right, () => moveSelection("right"));
  onKeyPress(controls.up, () => moveSelection("left"));
  onKeyPress(controls.down, () => moveSelection("right"));

  // Also allow WASD/arrows for convenience
  if (currentPlayer !== 0) {
    onKeyPress("a", () => moveSelection("left"));
    onKeyPress("d", () => moveSelection("right"));
    onKeyPress("w", () => moveSelection("left"));
    onKeyPress("s", () => moveSelection("right"));
  }
  if (currentPlayer !== 1) {
    onKeyPress("left", () => moveSelection("left"));
    onKeyPress("right", () => moveSelection("right"));
    onKeyPress("up", () => moveSelection("left"));
    onKeyPress("down", () => moveSelection("right"));
  }

  // Confirm selection
  onKeyPress(controls.bomb, () => confirmSelection());
  onKeyPress("space", () => confirmSelection());
  onKeyPress("enter", () => confirmSelection());

  function confirmSelection() {
    if (takenCharacters.includes(selectedChar)) return;

    // Play character callout sound
    play(`callout_${selectedChar}`, { volume: 0.9 });

    gameConfig.playerCharacters.push(selectedChar);

    // Flash effect on selection
    add([
      rect(width(), height()),
      pos(0, 0),
      color(255, 255, 255),
      opacity(0.5),
      z(100),
      lifespan(0.2, { fade: 0.2 }),
    ]);

    wait(0.5, () => {
      if (currentPlayer + 1 < gameConfig.playerCount) {
        go("characterSelect", { currentPlayer: currentPlayer + 1 });
      } else {
        // Stop select music before starting game
        if (selectMusicHandle) {
          selectMusicHandle.stop();
          selectMusicHandle = null;
        }
        go("game");
      }
    });
  }

  onKeyPress("escape", () => {
    if (selectMusicHandle) {
      selectMusicHandle.stop();
      selectMusicHandle = null;
    }
    go("playerCount");
  });

  // Bottom instruction
  add([
    text("← → SELECT     SPACE/BOMB CONFIRM     ESC BACK", { size: 12 }),
    pos(width() / 2, 680),
    anchor("center"),
    color(120, 120, 120),
  ]);
});

// Scene: Game
scene("game", () => {
  // Play background music
  const bgMusic = play("music", { loop: true, volume: 0.45 });

  // Stop music when leaving scene
  onSceneLeave(() => {
    bgMusic.stop();
  });

  // Track game state
  const gameState = {
    players: [],
    bombs: [],
  };

  // Create the grid
  function createLevel() {
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        // Floor tile
        add([
          rect(TILE_SIZE - 2, TILE_SIZE - 2, { radius: 2 }),
          pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
          anchor("center"),
          color(40, 40, 60),
          z(-1),
        ]);

        // Walls on edges and grid pattern
        if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
          add([
            rect(TILE_SIZE - 2, TILE_SIZE - 2, { radius: 4 }),
            pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
            anchor("center"),
            color(80, 80, 100),
            area(),
            body({ isStatic: true }),
            "wall",
          ]);
        }
        // Indestructible pillars (every other tile) - diamond blocks
        else if (x % 2 === 0 && y % 2 === 0) {
          add([
            sprite("diamondblock"),
            pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
            anchor("center"),
            scale((TILE_SIZE * 0.85) / 400),  // 85% of tile, accounting for image padding
            area({ scale: 0.5 }),
            body({ isStatic: true }),
            "wall",
          ]);
        }
        // Destructible blocks (random, but not in corners where players spawn) - wood blocks
        else if (!isSpawnZone(x, y) && Math.random() > 0.35) {
          add([
            sprite("woodblock"),
            pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
            anchor("center"),
            scale((TILE_SIZE * 0.85) / 400),  // 85% of tile, accounting for image padding
            area({ scale: 0.5 }),
            body({ isStatic: true }),
            "block",
            { hasPowerup: Math.random() > 0.5 },
          ]);
        }
      }
    }
  }

  // Check if position is in a spawn zone
  function isSpawnZone(x, y) {
    for (const sp of START_POSITIONS) {
      if (Math.abs(x - sp.x) <= 1 && Math.abs(y - sp.y) <= 1) {
        return true;
      }
    }
    return false;
  }

  // Spawn a player
  function spawnPlayer(playerIndex, characterIndex) {
    const character = PLAYERS[characterIndex];  // Character appearance
    const controls = PLAYERS[playerIndex];       // Controls for this player slot
    const startPos = START_POSITIONS[playerIndex];

    const player = add([
      sprite(character.spriteFront),
      pos(startPos.x * TILE_SIZE + TILE_SIZE / 2, startPos.y * TILE_SIZE + TILE_SIZE / 2),
      anchor("center"),
      scale(0.08),
      area({ scale: 0.45 }),
      body(),
      z(10),
      "player",
      {
        playerIndex,
        characterIndex,
        speed: 200,
        bombCount: 1,
        bombsPlaced: 0,
        fireRange: 2,
        alive: true,
        name: character.name,
        spriteFront: character.spriteFront,
        spriteBack: character.spriteBack,
        facing: "down",
      },
    ]);

    // Movement controls with lane locking (classic Bomberman style)
    const keys = controls.keys;
    const SNAP_THRESHOLD = 8; // How close to center before we snap

    // Helper: get the grid-aligned center position
    function getGridCenter() {
      const gridX = Math.round((player.pos.x - TILE_SIZE / 2) / TILE_SIZE);
      const gridY = Math.round((player.pos.y - TILE_SIZE / 2) / TILE_SIZE);
      return {
        x: gridX * TILE_SIZE + TILE_SIZE / 2,
        y: gridY * TILE_SIZE + TILE_SIZE / 2,
      };
    }

    // Snap to lane when moving - locks you to grid lines
    function snapToLane(axis) {
      const center = getGridCenter();
      if (axis === "x") {
        // Snap X position to grid center (for vertical movement)
        const diff = center.x - player.pos.x;
        if (Math.abs(diff) > SNAP_THRESHOLD) {
          player.move(Math.sign(diff) * player.speed * 0.8, 0);
        } else {
          player.pos.x = center.x;
        }
      } else {
        // Snap Y position to grid center (for horizontal movement)
        const diff = center.y - player.pos.y;
        if (Math.abs(diff) > SNAP_THRESHOLD) {
          player.move(0, Math.sign(diff) * player.speed * 0.8);
        } else {
          player.pos.y = center.y;
        }
      }
    }

    onKeyDown(keys.up, () => {
      if (player.alive) {
        player.move(0, -player.speed);
        snapToLane("x"); // Lock to vertical lane
        if (player.facing !== "up") {
          player.use(sprite(player.spriteBack));
          player.facing = "up";
        }
      }
    });
    onKeyDown(keys.down, () => {
      if (player.alive) {
        player.move(0, player.speed);
        snapToLane("x"); // Lock to vertical lane
        if (player.facing !== "down") {
          player.use(sprite(player.spriteFront));
          player.facing = "down";
        }
      }
    });
    onKeyDown(keys.left, () => {
      if (player.alive) {
        player.move(-player.speed, 0);
        snapToLane("y"); // Lock to horizontal lane
        player.flipX = true;
      }
    });
    onKeyDown(keys.right, () => {
      if (player.alive) {
        player.move(player.speed, 0);
        snapToLane("y"); // Lock to horizontal lane
        player.flipX = false;
      }
    });

    // Bomb placement
    onKeyPress(keys.bomb, () => {
      if (player.alive && player.bombsPlaced < player.bombCount) {
        placeBomb(player);
      }
    });

    gameState.players.push(player);
    return player;
  }

  // Place a bomb
  function placeBomb(player) {
    const gridX = Math.round((player.pos.x - TILE_SIZE / 2) / TILE_SIZE);
    const gridY = Math.round((player.pos.y - TILE_SIZE / 2) / TILE_SIZE);

    // Check if there's already a bomb here
    for (const bomb of get("bomb")) {
      const bombGridX = Math.round((bomb.pos.x - TILE_SIZE / 2) / TILE_SIZE);
      const bombGridY = Math.round((bomb.pos.y - TILE_SIZE / 2) / TILE_SIZE);
      if (bombGridX === gridX && bombGridY === gridY) return;
    }

    player.bombsPlaced++;

    // Create the brain bomb! (starts without physics body - gets added after players escape)
    const bomb = add([
      sprite("brainbomb"),
      pos(gridX * TILE_SIZE + TILE_SIZE / 2, gridY * TILE_SIZE + TILE_SIZE / 2),
      anchor("center"),
      scale(0.05),
      area({ scale: 0.7 }),
      z(5),
      "bomb",
      "فpassable",  // Tag to mark bomb as currently passable
      {
        owner: player,
        range: player.fireRange,
        gridX,
        gridY,
        baseScale: 0.05,
        solid: false, // Track if bomb has become solid yet
      },
    ]);

    // Pulsing animation + check if owner has left to make bomb solid
    bomb.onUpdate(() => {
      const pulse = 1 + Math.sin(time() * 8) * 0.15;
      bomb.scale = vec2(bomb.baseScale * pulse);

      // If bomb isn't solid yet, check if owner has escaped
      if (!bomb.solid) {
        const ownerGridX = Math.round((bomb.owner.pos.x - TILE_SIZE / 2) / TILE_SIZE);
        const ownerGridY = Math.round((bomb.owner.pos.y - TILE_SIZE / 2) / TILE_SIZE);

        // Owner has left the bomb tile - make it solid
        if (ownerGridX !== bomb.gridX || ownerGridY !== bomb.gridY) {
          bomb.solid = true;
          bomb.use(body({ isStatic: true }));
          bomb.unuse("فpassable");
        }
      }
    });

    // Explode after timer
    wait(BOMB_TIMER, () => {
      explodeBomb(bomb);
    });
  }

  // Explode a bomb
  function explodeBomb(bomb) {
    if (!bomb.exists()) return;

    const { gridX, gridY, range, owner } = bomb;
    owner.bombsPlaced--;
    destroy(bomb);

    // Create explosions in cross pattern
    createExplosion(gridX, gridY); // Center

    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    for (const dir of directions) {
      for (let i = 1; i <= range; i++) {
        const ex = gridX + dir.dx * i;
        const ey = gridY + dir.dy * i;

        // Check for walls
        let hitWall = false;
        for (const wall of get("wall")) {
          const wallGX = Math.round((wall.pos.x - TILE_SIZE / 2) / TILE_SIZE);
          const wallGY = Math.round((wall.pos.y - TILE_SIZE / 2) / TILE_SIZE);
          if (wallGX === ex && wallGY === ey) {
            hitWall = true;
            break;
          }
        }
        if (hitWall) break;

        // Check for blocks (destructible)
        let hitBlock = false;
        for (const block of get("block")) {
          const blockGX = Math.round((block.pos.x - TILE_SIZE / 2) / TILE_SIZE);
          const blockGY = Math.round((block.pos.y - TILE_SIZE / 2) / TILE_SIZE);
          if (blockGX === ex && blockGY === ey) {
            hitBlock = true;
            destroyBlock(block);
            break;
          }
        }

        createExplosion(ex, ey, false);
        if (hitBlock) break;
      }
    }
  }

  // Create explosion effect at grid position
  function createExplosion(gridX, gridY, playSound = true) {
    // Play random explosion sound (only for center of explosion)
    if (playSound) {
      play(Math.random() > 0.5 ? "bomb1" : "bomb2", { volume: 0.6 });
    }

    const exp = add([
      sprite("brainboom"),
      pos(gridX * TILE_SIZE + TILE_SIZE / 2, gridY * TILE_SIZE + TILE_SIZE / 2),
      anchor("center"),
      scale(0.07),
      area({ scale: 0.5 }),
      opacity(1),
      z(15),
      "explosion",
      { gridX, gridY },
    ]);

    // Check for chain reaction with other bombs
    for (const bomb of get("bomb")) {
      if (bomb.gridX === gridX && bomb.gridY === gridY) {
        wait(0.1, () => explodeBomb(bomb));
      }
    }

    // Animate and fade
    exp.onUpdate(() => {
      exp.opacity -= dt() * 1.5;
    });

    // Destroy
    wait(EXPLOSION_DURATION, () => {
      destroy(exp);
    });
  }

  // Destroy a block and maybe spawn powerup
  function destroyBlock(block) {
    const gx = Math.round((block.pos.x - TILE_SIZE / 2) / TILE_SIZE);
    const gy = Math.round((block.pos.y - TILE_SIZE / 2) / TILE_SIZE);

    if (block.hasPowerup) {
      spawnPowerup(gx, gy);
    }
    destroy(block);
  }

  // Spawn a powerup
  function spawnPowerup(gridX, gridY) {
    const types = [
      { type: "bomb", sprite: "powerup_bomb" },
      { type: "fire", sprite: "powerup_fire" },
      { type: "speed", sprite: "powerup_speed" },
    ];
    const powerupType = types[Math.floor(Math.random() * types.length)];
    const baseScale = (TILE_SIZE * 0.63) / 500;  // 15% smaller
    const baseX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const baseY = gridY * TILE_SIZE + TILE_SIZE / 2;

    const pu = add([
      sprite(powerupType.sprite),
      pos(baseX, baseY),
      anchor("center"),
      scale(baseScale),
      area({ scale: 0.7 }),
      opacity(1),
      z(2),
      "powerup",
      {
        powerupType: powerupType.type,
        baseScale,
        baseX,
        baseY,
        jiggleOffset: Math.random() * Math.PI * 2,  // Random start phase
      },
    ]);

    // Jiggle and pulse animation
    pu.onUpdate(() => {
      const t = time() * 3 + pu.jiggleOffset;

      // Jiggle side to side
      pu.pos.x = pu.baseX + Math.sin(t * 2) * 2;
      pu.pos.y = pu.baseY + Math.sin(t * 3) * 1.5;

      // Pulse scale (glow effect)
      const pulse = 1 + Math.sin(t * 2.5) * 0.12;
      pu.scale = vec2(pu.baseScale * pulse);

      // Subtle opacity pulse for glow
      pu.opacity = 0.85 + Math.sin(t * 2.5) * 0.15;
    });
  }

  
  // Player collision with explosions
  onCollide("player", "explosion", (player) => {
    if (player.alive) {
      player.alive = false;
      play("die", { volume: 0.7 });
      play("dead", { volume: 0.7 });
      destroy(player);
      checkWinCondition();
    }
  });

  // Player collision with powerups
  onCollide("player", "powerup", (player, powerup) => {
    if (!player.alive) return;

    play("powerup", { volume: 0.6 });
    switch (powerup.powerupType) {
      case "bomb":
        player.bombCount++;
        play("powerup_bomb", { volume: 0.85 });
        break;
      case "fire":
        player.fireRange++;
        play("powerup_fire", { volume: 0.85 });
        break;
      case "speed":
        player.speed += 40;
        play("powerup_speed", { volume: 0.85 });
        break;
    }
    destroy(powerup);

    // Pulse and glow effect for 2 seconds
    const baseScale = 0.08;
    const glowDuration = 2;
    const startTime = time();

    // Cancel any existing glow effect
    if (player.glowCancel) player.glowCancel();

    const glowUpdate = player.onUpdate(() => {
      const elapsed = time() - startTime;
      if (elapsed > glowDuration) {
        // Reset to normal
        player.scale = vec2(baseScale);
        player.opacity = 1;
        glowUpdate.cancel();
        player.glowCancel = null;
        return;
      }

      // Pulse scale
      const pulse = 1 + Math.sin(elapsed * 12) * 0.15;
      player.scale = vec2(baseScale * pulse);

      // Glow opacity
      player.opacity = 0.7 + Math.sin(elapsed * 12) * 0.3;
    });

    player.glowCancel = () => glowUpdate.cancel();
  });

  // Check for winner
  function checkWinCondition() {
    const alivePlayers = gameState.players.filter((p) => p.alive);
    if (alivePlayers.length <= 1) {
      wait(1, () => {
        go("gameover", alivePlayers[0]?.name || "Nobody");
      });
    }
  }

  // Create level and spawn players based on selection
  createLevel();
  for (let i = 0; i < gameConfig.playerCount; i++) {
    const characterIndex = gameConfig.playerCharacters[i];
    spawnPlayer(i, characterIndex);
  }

  // ESC to return to menu
  onKeyPress("escape", () => go("menu"));

  // HUD
  add([
    text("ESC = Menu", { size: 14 }),
    pos(10, GRID_HEIGHT * TILE_SIZE + 5),
    color(100, 100, 100),
    z(20),
  ]);
});

// Scene: Game Over
scene("gameover", (winnerName) => {
  add([
    text("BRAIN EXPLOSION!", { size: 48 }),
    pos(width() / 2, 150),
    anchor("center"),
    color(255, 100, 100),
  ]);

  add([
    sprite("brainboom"),
    pos(width() / 2, 300),
    anchor("center"),
    scale(0.25),
  ]);

  add([
    text(`${winnerName} Wins!`, { size: 36 }),
    pos(width() / 2, 450),
    anchor("center"),
    color(255, 255, 100),
  ]);

  add([
    text("Press SPACE to Play Again", { size: 24 }),
    pos(width() / 2, 550),
    anchor("center"),
    color(255, 255, 255),
  ]);

  onKeyPress("space", () => go("game"));
  onKeyPress("escape", () => go("menu"));
});

// Start at menu
go("menu");
