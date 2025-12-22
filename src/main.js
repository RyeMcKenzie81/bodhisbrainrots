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
  mode: "multiplayer", // "singleplayer" or "multiplayer"
  playerCount: 4,
  playerCharacters: [0, 1, 2, 3], // Which character index each player chose
  difficulty: "medium", // "easy", "medium", "hard" (for singleplayer)
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

  onKeyPress("space", () => go("modeSelect"));
});

// Scene: Mode Selection (Single Player vs Multiplayer)
scene("modeSelect", () => {
  let selectedMode = 0; // 0 = Single Player, 1 = Multiplayer
  const modes = ["SINGLE PLAYER", "MULTIPLAYER"];
  const modeDescriptions = [
    "Battle 1-3 AI opponents",
    "2-4 players on one keyboard"
  ];

  add([
    rect(width(), height()),
    pos(0, 0),
    color(20, 20, 40),
    z(-2),
  ]);

  add([
    text("SELECT MODE", { size: 48 }),
    pos(width() / 2, 80),
    anchor("center"),
    color(255, 200, 100),
  ]);

  const modeButtons = [];
  const buttonY = 280;

  modes.forEach((mode, i) => {
    const x = width() / 2 - 150 + i * 300;

    const btn = add([
      rect(240, 120, { radius: 8 }),
      pos(x, buttonY),
      anchor("center"),
      color(i === selectedMode ? rgb(80, 80, 120) : rgb(40, 40, 60)),
      outline(4, i === selectedMode ? rgb(255, 200, 100) : rgb(60, 60, 80)),
      z(0),
      { modeIndex: i },
    ]);
    modeButtons.push(btn);

    add([
      text(mode, { size: 20 }),
      pos(x, buttonY - 15),
      anchor("center"),
      color(255, 255, 255),
      z(1),
    ]);

    add([
      text(modeDescriptions[i], { size: 12 }),
      pos(x, buttonY + 20),
      anchor("center"),
      color(150, 150, 150),
      z(1),
    ]);

    // Icon
    if (i === 0) {
      add([
        sprite(PLAYERS[0].spriteFront),
        pos(x - 50, buttonY + 50),
        anchor("center"),
        scale(0.06),
        z(1),
      ]);
      add([
        text("VS", { size: 14 }),
        pos(x, buttonY + 50),
        anchor("center"),
        color(255, 100, 100),
        z(1),
      ]);
      add([
        text("CPU", { size: 14 }),
        pos(x + 50, buttonY + 50),
        anchor("center"),
        color(100, 200, 255),
        z(1),
      ]);
    } else {
      for (let p = 0; p < 2; p++) {
        add([
          sprite(PLAYERS[p].spriteFront),
          pos(x - 30 + p * 60, buttonY + 50),
          anchor("center"),
          scale(0.05),
          z(1),
        ]);
      }
    }
  });

  function updateSelection() {
    modeButtons.forEach((btn, i) => {
      btn.color = i === selectedMode ? rgb(80, 80, 120) : rgb(40, 40, 60);
      btn.outline.color = i === selectedMode ? rgb(255, 200, 100) : rgb(60, 60, 80);
    });
  }

  onKeyPress("a", () => { selectedMode = 0; updateSelection(); });
  onKeyPress("left", () => { selectedMode = 0; updateSelection(); });
  onKeyPress("d", () => { selectedMode = 1; updateSelection(); });
  onKeyPress("right", () => { selectedMode = 1; updateSelection(); });

  onKeyPress("space", () => {
    if (selectedMode === 0) {
      gameConfig.mode = "singleplayer";
      go("difficultySelect");
    } else {
      gameConfig.mode = "multiplayer";
      go("playerCount");
    }
  });

  onKeyPress("enter", () => {
    if (selectedMode === 0) {
      gameConfig.mode = "singleplayer";
      go("difficultySelect");
    } else {
      gameConfig.mode = "multiplayer";
      go("playerCount");
    }
  });

  onKeyPress("escape", () => go("menu"));

  add([
    text("< A / D > SELECT     SPACE CONFIRM     ESC BACK", { size: 14 }),
    pos(width() / 2, 500),
    anchor("center"),
    color(120, 120, 120),
  ]);
});

// Scene: Difficulty Selection (for single player)
scene("difficultySelect", () => {
  let selectedDifficulty = 1; // 0 = Easy, 1 = Medium, 2 = Hard
  let selectedOpponents = 3; // 1-3 AI opponents
  const difficulties = ["EASY", "MEDIUM", "HARD"];
  const diffDescriptions = [
    "Slow reactions, random movement",
    "Tactical bombs, avoids danger",
    "Hunts you down, sets traps"
  ];
  const diffColors = [
    rgb(100, 200, 100), // Green for easy
    rgb(255, 200, 100), // Yellow for medium
    rgb(255, 100, 100), // Red for hard
  ];

  add([
    rect(width(), height()),
    pos(0, 0),
    color(20, 20, 40),
    z(-2),
  ]);

  add([
    text("SELECT DIFFICULTY", { size: 42 }),
    pos(width() / 2, 60),
    anchor("center"),
    color(255, 200, 100),
  ]);

  // Difficulty buttons
  const diffButtons = [];
  const buttonY = 180;
  const buttonWidth = 200;
  const spacing = 220;
  const startX = width() / 2 - spacing;

  difficulties.forEach((diff, i) => {
    const x = startX + i * spacing;

    const btn = add([
      rect(buttonWidth, 100, { radius: 8 }),
      pos(x, buttonY),
      anchor("center"),
      color(i === selectedDifficulty ? rgb(60, 60, 90) : rgb(40, 40, 60)),
      outline(4, i === selectedDifficulty ? diffColors[i] : rgb(60, 60, 80)),
      z(0),
    ]);
    diffButtons.push(btn);

    add([
      text(diff, { size: 24 }),
      pos(x, buttonY - 15),
      anchor("center"),
      color(diffColors[i]),
      z(1),
    ]);

    add([
      text(diffDescriptions[i], { size: 10 }),
      pos(x, buttonY + 20),
      anchor("center"),
      color(150, 150, 150),
      z(1),
    ]);
  });

  // Opponent count selection
  add([
    text("NUMBER OF OPPONENTS", { size: 28 }),
    pos(width() / 2, 300),
    anchor("center"),
    color(255, 200, 100),
  ]);

  const countDisplay = add([
    text(selectedOpponents.toString(), { size: 80 }),
    pos(width() / 2, 380),
    anchor("center"),
    color(255, 255, 255),
  ]);

  add([
    text("< W / S >", { size: 18 }),
    pos(width() / 2, 440),
    anchor("center"),
    color(150, 150, 150),
  ]);

  // Preview of opponents
  const opponentPreview = [];
  function updateOpponentPreview() {
    opponentPreview.forEach(o => destroy(o));
    opponentPreview.length = 0;

    const previewStartX = width() / 2 - (selectedOpponents - 1) * 50;
    for (let i = 0; i < selectedOpponents; i++) {
      const cpuSprite = add([
        sprite(PLAYERS[(i + 1) % 4].spriteFront),
        pos(previewStartX + i * 100, 520),
        anchor("center"),
        scale(0.08),
      ]);
      opponentPreview.push(cpuSprite);

      const label = add([
        text("CPU", { size: 12 }),
        pos(previewStartX + i * 100, 570),
        anchor("center"),
        color(100, 200, 255),
      ]);
      opponentPreview.push(label);
    }
  }
  updateOpponentPreview();

  function updateDiffSelection() {
    diffButtons.forEach((btn, i) => {
      btn.color = i === selectedDifficulty ? rgb(60, 60, 90) : rgb(40, 40, 60);
      btn.outline.color = i === selectedDifficulty ? diffColors[i] : rgb(60, 60, 80);
    });
  }

  onKeyPress("a", () => { selectedDifficulty = Math.max(0, selectedDifficulty - 1); updateDiffSelection(); });
  onKeyPress("left", () => { selectedDifficulty = Math.max(0, selectedDifficulty - 1); updateDiffSelection(); });
  onKeyPress("d", () => { selectedDifficulty = Math.min(2, selectedDifficulty + 1); updateDiffSelection(); });
  onKeyPress("right", () => { selectedDifficulty = Math.min(2, selectedDifficulty + 1); updateDiffSelection(); });

  onKeyPress("w", () => {
    selectedOpponents = Math.min(3, selectedOpponents + 1);
    countDisplay.text = selectedOpponents.toString();
    updateOpponentPreview();
  });
  onKeyPress("up", () => {
    selectedOpponents = Math.min(3, selectedOpponents + 1);
    countDisplay.text = selectedOpponents.toString();
    updateOpponentPreview();
  });
  onKeyPress("s", () => {
    selectedOpponents = Math.max(1, selectedOpponents - 1);
    countDisplay.text = selectedOpponents.toString();
    updateOpponentPreview();
  });
  onKeyPress("down", () => {
    selectedOpponents = Math.max(1, selectedOpponents - 1);
    countDisplay.text = selectedOpponents.toString();
    updateOpponentPreview();
  });

  onKeyPress("space", () => confirmDifficulty());
  onKeyPress("enter", () => confirmDifficulty());

  function confirmDifficulty() {
    gameConfig.difficulty = ["easy", "medium", "hard"][selectedDifficulty];
    gameConfig.playerCount = selectedOpponents + 1; // Human + AI opponents
    gameConfig.playerCharacters = [];
    go("characterSelect", { currentPlayer: 0 });
  }

  onKeyPress("escape", () => go("modeSelect"));

  add([
    text("< A / D > DIFFICULTY     < W / S > OPPONENTS     SPACE CONFIRM", { size: 12 }),
    pos(width() / 2, 650),
    anchor("center"),
    color(120, 120, 120),
  ]);
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
      // In single player mode, human only picks once, then AI gets random characters
      if (gameConfig.mode === "singleplayer" && currentPlayer === 0) {
        // Assign random characters to AI players
        const availableChars = [0, 1, 2, 3].filter(c => !gameConfig.playerCharacters.includes(c));
        for (let i = 1; i < gameConfig.playerCount; i++) {
          const randomIndex = Math.floor(Math.random() * availableChars.length);
          gameConfig.playerCharacters.push(availableChars.splice(randomIndex, 1)[0]);
        }
        // Stop select music before starting game
        if (selectMusicHandle) {
          selectMusicHandle.stop();
          selectMusicHandle = null;
        }
        go("game");
      } else if (currentPlayer + 1 < gameConfig.playerCount) {
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
    // Go back to appropriate screen based on mode
    if (gameConfig.mode === "singleplayer") {
      go("difficultySelect");
    } else {
      go("playerCount");
    }
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
    gameStarted: false,      // Whether countdown is done
    matchTime: 120,          // 2 minutes in seconds
    matchEnded: false,
  };

  // Match timer display (top center)
  const timerDisplay = add([
    text("2:00", { size: 32 }),
    pos(width() / 2, 30),
    anchor("center"),
    color(255, 255, 255),
    z(100),
    fixed(),
  ]);

  // Update match timer every frame
  let lastSecond = gameState.matchTime;
  onUpdate(() => {
    if (!gameState.gameStarted || gameState.matchEnded) return;

    gameState.matchTime -= dt();

    const currentSecond = Math.ceil(gameState.matchTime);
    if (currentSecond !== lastSecond) {
      lastSecond = currentSecond;

      // Update timer display
      const mins = Math.floor(Math.max(0, gameState.matchTime) / 60);
      const secs = Math.floor(Math.max(0, gameState.matchTime) % 60);
      timerDisplay.text = `${mins}:${secs.toString().padStart(2, '0')}`;

      // Change color based on time remaining
      if (gameState.matchTime <= 10) {
        timerDisplay.color = rgb(255, 50, 50);
        timerDisplay.scale = vec2(1.2);
      } else if (gameState.matchTime <= 30) {
        timerDisplay.color = rgb(255, 150, 50);
      }

      // Speed up music as time runs out (starting at 30 seconds)
      if (gameState.matchTime <= 30 && gameState.matchTime > 0) {
        // Speed from 1.0 at 30s to 1.5 at 0s
        const speedMultiplier = 1 + (30 - gameState.matchTime) / 60;
        bgMusic.speed = speedMultiplier;
      }
    }

    // Time's up!
    if (gameState.matchTime <= 0 && !gameState.matchEnded) {
      gameState.matchEnded = true;
      endMatchByTime();
    }
  });

  // End match when time runs out
  function endMatchByTime() {
    // Find player(s) with most stats or just pick survivors
    const alivePlayers = gameState.players.filter(p => p.alive);
    if (alivePlayers.length === 0) {
      go("gameover", "Nobody");
    } else if (alivePlayers.length === 1) {
      go("gameover", alivePlayers[0].name);
    } else {
      // Tie - could pick by stats, for now just say "Draw"
      go("gameover", "DRAW - Time's Up!");
    }
  }

  // Screen shake function
  function shakeScreen(intensity = 5) {
    shake(intensity);
  }

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

  // ============ AI HELPER FUNCTIONS ============

  // Get grid position from pixel position
  function getGridPos(entity) {
    return {
      x: Math.round((entity.pos.x - TILE_SIZE / 2) / TILE_SIZE),
      y: Math.round((entity.pos.y - TILE_SIZE / 2) / TILE_SIZE)
    };
  }

  // Get pixel center from grid position
  function getPixelPos(gridX, gridY) {
    return {
      x: gridX * TILE_SIZE + TILE_SIZE / 2,
      y: gridY * TILE_SIZE + TILE_SIZE / 2
    };
  }

  // Check if a grid cell is walkable (no walls, blocks, or solid bombs)
  function isWalkable(gridX, gridY) {
    // Check bounds
    if (gridX < 1 || gridX >= GRID_WIDTH - 1 || gridY < 1 || gridY >= GRID_HEIGHT - 1) {
      return false;
    }

    // Check walls
    for (const wall of get("wall")) {
      const wallPos = getGridPos(wall);
      if (wallPos.x === gridX && wallPos.y === gridY) return false;
    }

    // Check blocks
    for (const block of get("block")) {
      const blockPos = getGridPos(block);
      if (blockPos.x === gridX && blockPos.y === gridY) return false;
    }

    // Check solid bombs
    for (const bomb of get("bomb")) {
      if (bomb.solid) {
        const bombPos = getGridPos(bomb);
        if (bombPos.x === gridX && bombPos.y === gridY) return false;
      }
    }

    return true;
  }

  // Get all grid positions that will explode soon (danger zones)
  function getExplosionDangerZones() {
    const dangerZones = [];

    for (const bomb of get("bomb")) {
      const bombPos = getGridPos(bomb);
      dangerZones.push({ x: bombPos.x, y: bombPos.y });

      // Add explosion paths
      const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ];

      for (const dir of directions) {
        for (let i = 1; i <= bomb.range; i++) {
          const ex = bombPos.x + dir.dx * i;
          const ey = bombPos.y + dir.dy * i;

          // Check for walls (explosion stops)
          let blocked = false;
          for (const wall of get("wall")) {
            const wallPos = getGridPos(wall);
            if (wallPos.x === ex && wallPos.y === ey) {
              blocked = true;
              break;
            }
          }
          if (blocked) break;

          dangerZones.push({ x: ex, y: ey });

          // Check for blocks (explosion stops after hitting)
          for (const block of get("block")) {
            const blockPos = getGridPos(block);
            if (blockPos.x === ex && blockPos.y === ey) {
              blocked = true;
              break;
            }
          }
          if (blocked) break;
        }
      }
    }

    return dangerZones;
  }

  // Check if position is in danger
  function isInDanger(gridX, gridY, dangerZones) {
    return dangerZones.some(d => d.x === gridX && d.y === gridY);
  }

  // Simple BFS to find path to target
  function findPath(startX, startY, targetX, targetY, avoidDanger = true) {
    const dangerZones = avoidDanger ? getExplosionDangerZones() : [];
    const queue = [{ x: startX, y: startY, path: [] }];
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    const directions = [
      { dx: 0, dy: -1, dir: "up" },
      { dx: 0, dy: 1, dir: "down" },
      { dx: -1, dy: 0, dir: "left" },
      { dx: 1, dy: 0, dir: "right" },
    ];

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.x === targetX && current.y === targetY) {
        return current.path;
      }

      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;
        const key = `${newX},${newY}`;

        if (!visited.has(key) && isWalkable(newX, newY)) {
          // Optionally avoid danger zones
          if (avoidDanger && isInDanger(newX, newY, dangerZones)) {
            continue;
          }

          visited.add(key);
          queue.push({
            x: newX,
            y: newY,
            path: [...current.path, { x: newX, y: newY, dir: dir.dir }]
          });
        }
      }
    }

    return null; // No path found
  }

  // Find nearest safe spot from current position
  function findSafeSpot(startX, startY) {
    const dangerZones = getExplosionDangerZones();

    // If not in danger, return current position
    if (!isInDanger(startX, startY, dangerZones)) {
      return { x: startX, y: startY };
    }

    // BFS to find nearest safe spot
    const queue = [{ x: startX, y: startY, dist: 0 }];
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift();

      // Check if this spot is safe
      if (!isInDanger(current.x, current.y, dangerZones) && isWalkable(current.x, current.y)) {
        return { x: current.x, y: current.y };
      }

      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;
        const key = `${newX},${newY}`;

        if (!visited.has(key) && (isWalkable(newX, newY) || (newX === startX && newY === startY))) {
          visited.add(key);
          queue.push({ x: newX, y: newY, dist: current.dist + 1 });
        }
      }
    }

    return null; // No safe spot found
  }

  // Find nearest destructible block
  function findNearestBlock(startX, startY) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const block of get("block")) {
      const blockPos = getGridPos(block);
      const dist = Math.abs(blockPos.x - startX) + Math.abs(blockPos.y - startY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = blockPos;
      }
    }

    return nearest;
  }

  // Find nearest powerup
  function findNearestPowerup(startX, startY) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const pu of get("powerup")) {
      const puPos = getGridPos(pu);
      const dist = Math.abs(puPos.x - startX) + Math.abs(puPos.y - startY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = puPos;
      }
    }

    return nearest;
  }

  // Check if AI can escape after placing a bomb - returns escape info
  function canEscapeAfterBomb(ai, gridX, gridY) {
    // Simulate bomb placement and check if there's a safe escape route
    const dangerZones = getExplosionDangerZones();

    // Add the hypothetical bomb's explosion path
    const directions = [
      { dx: 1, dy: 0, dir: "right" },
      { dx: -1, dy: 0, dir: "left" },
      { dx: 0, dy: 1, dir: "down" },
      { dx: 0, dy: -1, dir: "up" },
    ];

    // Add bomb center to danger
    dangerZones.push({ x: gridX, y: gridY });

    // Add all explosion paths
    for (const dir of directions) {
      for (let i = 1; i <= ai.fireRange; i++) {
        const ex = gridX + dir.dx * i;
        const ey = gridY + dir.dy * i;

        let blocked = false;
        for (const wall of get("wall")) {
          const wallPos = getGridPos(wall);
          if (wallPos.x === ex && wallPos.y === ey) {
            blocked = true;
            break;
          }
        }
        if (blocked) break;

        dangerZones.push({ x: ex, y: ey });

        for (const block of get("block")) {
          const blockPos = getGridPos(block);
          if (blockPos.x === ex && blockPos.y === ey) {
            blocked = true;
            break;
          }
        }
        if (blocked) break;
      }
    }

    // BFS to find escape route - need to find a safe spot within reasonable distance
    // AI needs to be able to escape within bomb timer (about 4-5 tiles at normal speed)
    const maxEscapeDistance = 5;
    const queue = [{ x: gridX, y: gridY, dist: 0, firstStep: null }];
    const visited = new Set();
    visited.add(`${gridX},${gridY}`);

    while (queue.length > 0) {
      const current = queue.shift();

      // Check if this spot is safe (not in any danger zone)
      if (!isInDanger(current.x, current.y, dangerZones)) {
        // Found safe spot! Make sure it's reachable in time
        if (current.dist <= maxEscapeDistance) {
          return { canEscape: true, firstStep: current.firstStep, distance: current.dist };
        }
      }

      // Don't search too far
      if (current.dist >= maxEscapeDistance) continue;

      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;
        const key = `${newX},${newY}`;

        if (!visited.has(key) && isWalkable(newX, newY)) {
          visited.add(key);
          queue.push({
            x: newX,
            y: newY,
            dist: current.dist + 1,
            firstStep: current.firstStep || dir.dir // Remember the first step taken
          });
        }
      }
    }

    return { canEscape: false, firstStep: null, distance: Infinity };
  }

  // Check if adjacent to a destructible block
  function isAdjacentToBlock(gridX, gridY) {
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    for (const dir of directions) {
      const checkX = gridX + dir.dx;
      const checkY = gridY + dir.dy;

      for (const block of get("block")) {
        const blockPos = getGridPos(block);
        if (blockPos.x === checkX && blockPos.y === checkY) {
          return true;
        }
      }
    }

    return false;
  }

  // Get the human player (player index 0 in singleplayer)
  function getHumanPlayer() {
    return gameState.players.find(p => p.playerIndex === 0 && p.alive);
  }

  // ============ SPAWN AI PLAYER ============

  function spawnAIPlayer(playerIndex, characterIndex, difficulty) {
    const character = PLAYERS[characterIndex];
    const startPos = START_POSITIONS[playerIndex];

    // AI timing based on difficulty
    const aiConfig = {
      easy: { updateInterval: 400, randomChance: 0.3, fleeChance: 0.9, bombChance: 0.25 },
      medium: { updateInterval: 200, randomChance: 0.15, fleeChance: 0.95, bombChance: 0.4 },
      hard: { updateInterval: 100, randomChance: 0.05, fleeChance: 0.99, bombChance: 0.6 },
    }[difficulty];

    const ai = add([
      sprite(character.spriteFront),
      pos(startPos.x * TILE_SIZE + TILE_SIZE / 2, startPos.y * TILE_SIZE + TILE_SIZE / 2),
      anchor("center"),
      scale(0.08),
      area({ scale: 0.45 }),
      body(),
      z(10),
      "player",
      "ai",
      {
        playerIndex,
        characterIndex,
        speed: 180, // Slightly slower than human
        bombCount: 1,
        bombsPlaced: 0,
        fireRange: 2,
        alive: true,
        name: character.name + " (CPU)",
        spriteFront: character.spriteFront,
        spriteBack: character.spriteBack,
        facing: "down",
        isAI: true,
        difficulty,
        aiConfig,
        currentTarget: null,
        currentAction: "idle",
        lastUpdateTime: 0,
        moveDirection: null,
        mustEscapeUntil: 0, // Timestamp until which AI must prioritize escaping
      },
    ]);

    // Name tag above AI player
    const aiNameTag = add([
      text(`CPU${playerIndex}`, { size: 12 }),
      pos(ai.pos.x, ai.pos.y - 40),
      anchor("center"),
      color(100, 200, 255), // Cyan for CPU
      z(11),
      "nametag",
      { owner: ai },
    ]);

    // Update name tag position to follow AI
    aiNameTag.onUpdate(() => {
      if (ai.exists() && ai.alive) {
        aiNameTag.pos.x = ai.pos.x;
        aiNameTag.pos.y = ai.pos.y - 40;
      } else {
        destroy(aiNameTag);
      }
    });

    // AI decision-making loop
    ai.onUpdate(() => {
      if (!ai.alive || !gameState.gameStarted) return;

      const now = time() * 1000;
      if (now - ai.lastUpdateTime < ai.aiConfig.updateInterval) {
        // Continue current movement
        if (ai.moveDirection) {
          executeMove(ai, ai.moveDirection);
        }
        return;
      }
      ai.lastUpdateTime = now;

      // Make AI decision
      const decision = makeAIDecision(ai);
      ai.currentAction = decision.action;
      ai.currentTarget = decision.target;
      ai.moveDirection = decision.direction;

      // Execute decision
      if (decision.action === "bomb" && ai.bombsPlaced < ai.bombCount) {
        placeBomb(ai);
      }
    });

    gameState.players.push(ai);
    return ai;
  }

  // Execute movement in a direction
  function executeMove(ai, direction) {
    const speed = ai.speed;

    switch (direction) {
      case "up":
        ai.move(0, -speed);
        snapAIToLane(ai, "x");
        if (ai.facing !== "up") {
          ai.use(sprite(ai.spriteBack));
          ai.facing = "up";
        }
        break;
      case "down":
        ai.move(0, speed);
        snapAIToLane(ai, "x");
        if (ai.facing !== "down") {
          ai.use(sprite(ai.spriteFront));
          ai.facing = "down";
        }
        break;
      case "left":
        ai.move(-speed, 0);
        snapAIToLane(ai, "y");
        ai.flipX = true;
        break;
      case "right":
        ai.move(speed, 0);
        snapAIToLane(ai, "y");
        ai.flipX = false;
        break;
    }
  }

  // Snap AI to lane (same logic as human player)
  function snapAIToLane(ai, axis) {
    const SNAP_THRESHOLD = 8;
    const gridX = Math.round((ai.pos.x - TILE_SIZE / 2) / TILE_SIZE);
    const gridY = Math.round((ai.pos.y - TILE_SIZE / 2) / TILE_SIZE);
    const centerX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = gridY * TILE_SIZE + TILE_SIZE / 2;

    if (axis === "x") {
      const diff = centerX - ai.pos.x;
      if (Math.abs(diff) > SNAP_THRESHOLD) {
        ai.move(Math.sign(diff) * ai.speed * 0.8, 0);
      } else {
        ai.pos.x = centerX;
      }
    } else {
      const diff = centerY - ai.pos.y;
      if (Math.abs(diff) > SNAP_THRESHOLD) {
        ai.move(0, Math.sign(diff) * ai.speed * 0.8);
      } else {
        ai.pos.y = centerY;
      }
    }
  }

  // AI decision-making
  function makeAIDecision(ai) {
    const myPos = getGridPos(ai);
    const dangerZones = getExplosionDangerZones();
    const inDanger = isInDanger(myPos.x, myPos.y, dangerZones);
    const now = time() * 1000;
    const mustEscape = now < ai.mustEscapeUntil;

    // Priority 0: Must escape after placing bomb (forced for ~2 seconds)
    if (mustEscape || inDanger) {
      // Always try to flee when in must-escape mode or in danger
      if (Math.random() < ai.aiConfig.fleeChance || mustEscape) {
        const safeSpot = findSafeSpot(myPos.x, myPos.y);
        if (safeSpot && (safeSpot.x !== myPos.x || safeSpot.y !== myPos.y)) {
          const path = findPath(myPos.x, myPos.y, safeSpot.x, safeSpot.y, false);
          if (path && path.length > 0) {
            return { action: "flee", target: safeSpot, direction: path[0].dir };
          }
        }
        // Panic move - pick a random direction away from danger
        const directions = ["up", "down", "left", "right"];
        const dirVectors = { up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 } };
        // Sort by safety - prefer directions that lead away from danger
        const sortedDirs = directions
          .filter(dir => {
            const v = dirVectors[dir];
            return isWalkable(myPos.x + v.dx, myPos.y + v.dy);
          })
          .sort((a, b) => {
            const va = dirVectors[a];
            const vb = dirVectors[b];
            const aSafe = !isInDanger(myPos.x + va.dx, myPos.y + va.dy, dangerZones) ? 1 : 0;
            const bSafe = !isInDanger(myPos.x + vb.dx, myPos.y + vb.dy, dangerZones) ? 1 : 0;
            return bSafe - aSafe;
          });

        if (sortedDirs.length > 0) {
          return { action: "flee", target: null, direction: sortedDirs[0] };
        }
      }
    }

    // If still in must-escape mode, don't do anything else
    if (mustEscape) {
      return { action: "idle", target: null, direction: null };
    }

    // Random movement chance (for easy mode unpredictability)
    if (Math.random() < ai.aiConfig.randomChance) {
      const directions = ["up", "down", "left", "right"];
      const dirVectors = { up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 } };
      const validDirs = directions.filter(dir => {
        const v = dirVectors[dir];
        return isWalkable(myPos.x + v.dx, myPos.y + v.dy) && !isInDanger(myPos.x + v.dx, myPos.y + v.dy, dangerZones);
      });
      if (validDirs.length > 0) {
        return { action: "wander", target: null, direction: validDirs[Math.floor(Math.random() * validDirs.length)] };
      }
    }

    // Priority 2: Get powerup if nearby
    const nearbyPowerup = findNearestPowerup(myPos.x, myPos.y);
    if (nearbyPowerup) {
      const dist = Math.abs(nearbyPowerup.x - myPos.x) + Math.abs(nearbyPowerup.y - myPos.y);
      if (dist <= 4) {
        const path = findPath(myPos.x, myPos.y, nearbyPowerup.x, nearbyPowerup.y);
        if (path && path.length > 0) {
          return { action: "getPowerup", target: nearbyPowerup, direction: path[0].dir };
        }
      }
    }

    // Priority 3: Hunt human player (harder difficulties)
    if (ai.difficulty === "hard" || (ai.difficulty === "medium" && Math.random() > 0.4)) {
      const human = getHumanPlayer();
      if (human) {
        const humanPos = getGridPos(human);
        const dist = Math.abs(humanPos.x - myPos.x) + Math.abs(humanPos.y - myPos.y);

        // If adjacent to human, consider bombing
        if (dist <= 2 && ai.bombsPlaced < ai.bombCount && Math.random() < ai.aiConfig.bombChance) {
          const escapeResult = canEscapeAfterBomb(ai, myPos.x, myPos.y);
          if (escapeResult.canEscape) {
            ai.mustEscapeUntil = now + 2000; // Must escape for 2 seconds after bombing
            ai.escapeDirection = escapeResult.firstStep;
            return { action: "bomb", target: humanPos, direction: null };
          }
        }

        // Move toward human
        const path = findPath(myPos.x, myPos.y, humanPos.x, humanPos.y);
        if (path && path.length > 0) {
          return { action: "hunt", target: humanPos, direction: path[0].dir };
        }
      }
    }

    // Priority 4: Destroy blocks
    if (isAdjacentToBlock(myPos.x, myPos.y)) {
      if (ai.bombsPlaced < ai.bombCount && Math.random() < ai.aiConfig.bombChance) {
        const escapeResult = canEscapeAfterBomb(ai, myPos.x, myPos.y);
        if (escapeResult.canEscape) {
          ai.mustEscapeUntil = now + 2000; // Must escape for 2 seconds after bombing
          ai.escapeDirection = escapeResult.firstStep;
          return { action: "bomb", target: myPos, direction: null };
        }
      }
    }

    // Find nearest block and move toward it
    const nearestBlock = findNearestBlock(myPos.x, myPos.y);
    if (nearestBlock) {
      // Find a walkable tile adjacent to the block
      const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ];

      for (const dir of directions) {
        const targetX = nearestBlock.x + dir.dx;
        const targetY = nearestBlock.y + dir.dy;
        if (isWalkable(targetX, targetY)) {
          const path = findPath(myPos.x, myPos.y, targetX, targetY);
          if (path && path.length > 0) {
            return { action: "seekBlock", target: { x: targetX, y: targetY }, direction: path[0].dir };
          }
        }
      }
    }

    // Default: Wander (avoid danger zones)
    const directions = ["up", "down", "left", "right"];
    const dirVectors = { up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 } };
    const validDirs = directions.filter(dir => {
      const v = dirVectors[dir];
      return isWalkable(myPos.x + v.dx, myPos.y + v.dy) && !isInDanger(myPos.x + v.dx, myPos.y + v.dy, dangerZones);
    });

    if (validDirs.length > 0) {
      return { action: "wander", target: null, direction: validDirs[Math.floor(Math.random() * validDirs.length)] };
    }

    return { action: "idle", target: null, direction: null };
  }

  // Player colors for name tags
  const playerColors = [
    rgb(255, 200, 50),   // P1 - Yellow
    rgb(100, 150, 255),  // P2 - Blue
    rgb(255, 100, 150),  // P3 - Pink
    rgb(100, 255, 150),  // P4 - Green
  ];

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
        canKick: false,  // For kick powerup
        cursed: false,   // For skull curse
        curseType: null,
      },
    ]);

    // Name tag above player
    const nameTag = add([
      text(`P${playerIndex + 1}`, { size: 12 }),
      pos(player.pos.x, player.pos.y - 40),
      anchor("center"),
      color(playerColors[playerIndex]),
      z(11),
      "nametag",
      { owner: player },
    ]);

    // Update name tag position to follow player
    nameTag.onUpdate(() => {
      if (player.exists() && player.alive) {
        nameTag.pos.x = player.pos.x;
        nameTag.pos.y = player.pos.y - 40;
      } else {
        destroy(nameTag);
      }
    });

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
      if (player.alive && gameState.gameStarted) {
        player.move(0, -player.speed);
        snapToLane("x"); // Lock to vertical lane
        if (player.facing !== "up") {
          player.use(sprite(player.spriteBack));
          player.facing = "up";
        }
      }
    });
    onKeyDown(keys.down, () => {
      if (player.alive && gameState.gameStarted) {
        player.move(0, player.speed);
        snapToLane("x"); // Lock to vertical lane
        if (player.facing !== "down") {
          player.use(sprite(player.spriteFront));
          player.facing = "down";
        }
      }
    });
    onKeyDown(keys.left, () => {
      if (player.alive && gameState.gameStarted) {
        player.move(-player.speed, 0);
        snapToLane("y"); // Lock to horizontal lane
        player.flipX = true;
      }
    });
    onKeyDown(keys.right, () => {
      if (player.alive && gameState.gameStarted) {
        player.move(player.speed, 0);
        snapToLane("y"); // Lock to horizontal lane
        player.flipX = false;
      }
    });

    // Bomb placement
    onKeyPress(keys.bomb, () => {
      if (player.alive && gameState.gameStarted && player.bombsPlaced < player.bombCount) {
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
        isKicked: false,
        kickDirection: null,
        kickSpeed: 300,
      },
    ]);

    // Pulsing animation + check if owner has left to make bomb solid + handle kicks
    bomb.onUpdate(() => {
      const pulse = 1 + Math.sin(time() * 8) * 0.15;
      bomb.scale = vec2(bomb.baseScale * pulse);

      // Handle kicked bomb movement
      if (bomb.isKicked && bomb.kickDirection) {
        const dir = bomb.kickDirection;
        const moveAmount = bomb.kickSpeed * dt();

        // Calculate new position
        const newX = bomb.pos.x + dir.dx * moveAmount;
        const newY = bomb.pos.y + dir.dy * moveAmount;

        // Check if we'd hit something
        const targetGridX = Math.round((newX - TILE_SIZE / 2) / TILE_SIZE);
        const targetGridY = Math.round((newY - TILE_SIZE / 2) / TILE_SIZE);

        let blocked = false;

        // Check walls
        for (const wall of get("wall")) {
          const wallPos = getGridPos(wall);
          if (wallPos.x === targetGridX && wallPos.y === targetGridY) {
            blocked = true;
            break;
          }
        }

        // Check blocks
        if (!blocked) {
          for (const block of get("block")) {
            const blockPos = getGridPos(block);
            if (blockPos.x === targetGridX && blockPos.y === targetGridY) {
              blocked = true;
              break;
            }
          }
        }

        // Check other bombs
        if (!blocked) {
          for (const otherBomb of get("bomb")) {
            if (otherBomb !== bomb) {
              const otherPos = getGridPos(otherBomb);
              if (otherPos.x === targetGridX && otherPos.y === targetGridY) {
                blocked = true;
                break;
              }
            }
          }
        }

        if (blocked) {
          // Stop at grid-aligned position
          bomb.isKicked = false;
          bomb.kickDirection = null;
          bomb.gridX = Math.round((bomb.pos.x - TILE_SIZE / 2) / TILE_SIZE);
          bomb.gridY = Math.round((bomb.pos.y - TILE_SIZE / 2) / TILE_SIZE);
          bomb.pos.x = bomb.gridX * TILE_SIZE + TILE_SIZE / 2;
          bomb.pos.y = bomb.gridY * TILE_SIZE + TILE_SIZE / 2;
        } else {
          // Keep moving
          bomb.pos.x = newX;
          bomb.pos.y = newY;
          bomb.gridX = targetGridX;
          bomb.gridY = targetGridY;
        }
      }

      // If bomb isn't solid yet, check if owner has escaped
      if (!bomb.solid && !bomb.isKicked) {
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

  // Handle player kicking bombs
  onCollide("player", "bomb", (player, bomb) => {
    // Only kick if player can kick and bomb is solid
    if (player.canKick && bomb.solid && !bomb.isKicked) {
      // Determine kick direction based on player's facing direction
      const kickDirs = {
        up: { dx: 0, dy: -1 },
        down: { dx: 0, dy: 1 },
        left: { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 },
      };

      // Use player's current movement direction or facing
      let kickDir = kickDirs[player.facing] || kickDirs.down;

      // Check if there's space to kick
      const targetX = bomb.gridX + kickDir.dx;
      const targetY = bomb.gridY + kickDir.dy;

      let canKick = true;

      // Check walls
      for (const wall of get("wall")) {
        const wallPos = getGridPos(wall);
        if (wallPos.x === targetX && wallPos.y === targetY) {
          canKick = false;
          break;
        }
      }

      // Check blocks
      if (canKick) {
        for (const block of get("block")) {
          const blockPos = getGridPos(block);
          if (blockPos.x === targetX && blockPos.y === targetY) {
            canKick = false;
            break;
          }
        }
      }

      if (canKick) {
        // Remove body so bomb can move
        bomb.unuse("body");
        bomb.isKicked = true;
        bomb.kickDirection = kickDir;
        bomb.solid = false;
      }
    }
  });

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
    // Play random explosion sound and shake screen (only for center of explosion)
    if (playSound) {
      play(Math.random() > 0.5 ? "bomb1" : "bomb2", { volume: 0.6 });
      shakeScreen(8); // Screen shake on explosion!
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
    // Weighted powerup types - kick and skull are rarer
    const types = [
      { type: "bomb", sprite: "powerup_bomb", weight: 30 },
      { type: "fire", sprite: "powerup_fire", weight: 30 },
      { type: "speed", sprite: "powerup_speed", weight: 25 },
      { type: "kick", sprite: null, weight: 10 },   // No sprite - use text
      { type: "skull", sprite: null, weight: 5 },   // No sprite - use text (curse!)
    ];

    // Weighted random selection
    const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    let powerupType = types[0];
    for (const t of types) {
      random -= t.weight;
      if (random <= 0) {
        powerupType = t;
        break;
      }
    }

    const baseScale = (TILE_SIZE * 0.63) / 500;
    const baseX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const baseY = gridY * TILE_SIZE + TILE_SIZE / 2;

    // Create powerup - use sprite if available, otherwise use text/rect
    let pu;
    if (powerupType.sprite) {
      pu = add([
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
          jiggleOffset: Math.random() * Math.PI * 2,
        },
      ]);
    } else {
      // Text-based powerup for kick and skull
      const puColors = {
        kick: rgb(100, 200, 255),   // Cyan for kick
        skull: rgb(150, 50, 200),   // Purple for skull (danger!)
      };
      const puLabels = {
        kick: "KICK",
        skull: "SKULL",
      };

      pu = add([
        rect(50, 24, { radius: 4 }),
        pos(baseX, baseY),
        anchor("center"),
        color(puColors[powerupType.type]),
        area({ scale: 0.9 }),
        opacity(1),
        z(2),
        "powerup",
        {
          powerupType: powerupType.type,
          baseScale: 1,
          baseX,
          baseY,
          jiggleOffset: Math.random() * Math.PI * 2,
        },
      ]);

      // Add label on top
      const label = add([
        text(puLabels[powerupType.type], { size: 10 }),
        pos(baseX, baseY),
        anchor("center"),
        color(0, 0, 0),
        z(3),
        { parentPowerup: pu },
      ]);

      // Label follows powerup
      label.onUpdate(() => {
        if (pu.exists()) {
          label.pos = pu.pos;
        } else {
          destroy(label);
        }
      });
    }

    // Jiggle and pulse animation
    pu.onUpdate(() => {
      const t = time() * 3 + pu.jiggleOffset;

      // Jiggle side to side
      pu.pos.x = pu.baseX + Math.sin(t * 2) * 2;
      pu.pos.y = pu.baseY + Math.sin(t * 3) * 1.5;

      // Pulse scale (glow effect) - only for sprite powerups
      if (pu.baseScale !== 1) {
        const pulse = 1 + Math.sin(t * 2.5) * 0.12;
        pu.scale = vec2(pu.baseScale * pulse);
      }

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

    const isSkull = powerup.powerupType === "skull";

    // Play sound (different for skull)
    if (isSkull) {
      play("die", { volume: 0.5 }); // Ominous sound for skull
    } else {
      play("powerup", { volume: 0.6 });
    }

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
      case "kick":
        player.canKick = true;
        // Visual feedback - could add a sound here
        break;
      case "skull":
        // Random curse effect!
        applyCurse(player);
        break;
    }
    destroy(powerup);

    // Pulse and glow effect for 2 seconds (skip for skull - different effect)
    if (!isSkull) {
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
    }
  });

  // Apply a random curse from the skull powerup
  function applyCurse(player) {
    const curses = [
      { type: "slow", name: "SLOW!", apply: () => { player.speed = Math.max(100, player.speed - 80); } },
      { type: "nobomb", name: "NO BOMBS!", apply: () => { player.bombCount = Math.max(1, player.bombCount - 1); } },
      { type: "shortfuse", name: "SHORT FUSE!", apply: () => { player.fireRange = Math.max(1, player.fireRange - 1); } },
      { type: "reverse", name: "REVERSED!", apply: () => { player.cursed = true; player.curseType = "reverse"; } },
    ];

    const curse = curses[Math.floor(Math.random() * curses.length)];
    curse.apply();

    // Show curse text above player
    const curseText = add([
      text(curse.name, { size: 14 }),
      pos(player.pos.x, player.pos.y - 60),
      anchor("center"),
      color(255, 50, 255),
      z(100),
      lifespan(2, { fade: 1 }),
    ]);

    // Make player flash purple
    const baseScale = 0.08;
    const curseDuration = 3;
    const startTime = time();

    if (player.glowCancel) player.glowCancel();

    const curseUpdate = player.onUpdate(() => {
      const elapsed = time() - startTime;

      // Update floating text position
      if (curseText.exists()) {
        curseText.pos.x = player.pos.x;
        curseText.pos.y = player.pos.y - 60 - elapsed * 10;
      }

      if (elapsed > curseDuration) {
        player.scale = vec2(baseScale);
        player.opacity = 1;
        // Clear reverse curse after duration
        if (player.curseType === "reverse") {
          player.cursed = false;
          player.curseType = null;
        }
        curseUpdate.cancel();
        player.glowCancel = null;
        return;
      }

      // Purple flash effect
      const flash = Math.sin(elapsed * 15) > 0 ? 1 : 0.5;
      player.opacity = flash;
    });

    player.glowCancel = () => curseUpdate.cancel();
  }

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
    // In singleplayer, player 0 is human, others are AI
    if (gameConfig.mode === "singleplayer" && i > 0) {
      spawnAIPlayer(i, characterIndex, gameConfig.difficulty);
    } else {
      spawnPlayer(i, characterIndex);
    }
  }

  // ESC to return to menu
  onKeyPress("escape", () => go("menu"));

  // ============ PLAYER STATS HUD ============
  const statsHUD = [];
  const hudY = GRID_HEIGHT * TILE_SIZE + 8;

  function createStatsHUD() {
    // Clear old HUD
    statsHUD.forEach(h => destroy(h));
    statsHUD.length = 0;

    const playerCount = gameState.players.length;
    const hudWidth = width() / playerCount;

    gameState.players.forEach((player, i) => {
      const hudX = hudWidth * i + 10;

      // Player name/label
      const label = add([
        text(`P${player.playerIndex + 1}${player.isAI ? ' CPU' : ''}`, { size: 11 }),
        pos(hudX, hudY),
        color(playerColors[player.playerIndex] || rgb(255, 255, 255)),
        z(20),
        fixed(),
        { playerId: player.playerIndex },
      ]);
      statsHUD.push(label);

      // Stats icons and values (bomb, fire, speed)
      const statsText = add([
        text("", { size: 10 }),
        pos(hudX + 60, hudY),
        color(200, 200, 200),
        z(20),
        fixed(),
        { playerId: player.playerIndex, isStats: true },
      ]);
      statsHUD.push(statsText);
    });
  }

  // Update stats HUD every frame
  onUpdate(() => {
    statsHUD.forEach(hud => {
      if (hud.isStats) {
        const player = gameState.players.find(p => p.playerIndex === hud.playerId);
        if (player && player.alive) {
          hud.text = `B:${player.bombCount} F:${player.fireRange} S:${Math.floor(player.speed / 40)}`;
        } else if (player && !player.alive) {
          hud.text = "DEAD";
          hud.color = rgb(100, 100, 100);
        }
      }
    });
  });

  // Basic HUD info
  add([
    text("ESC = Menu", { size: 10 }),
    pos(width() - 70, hudY),
    color(80, 80, 80),
    z(20),
    fixed(),
  ]);

  // ============ COUNTDOWN SEQUENCE ============
  function startCountdown() {
    const countdownTexts = ["3", "2", "1", "GO!"];
    let countIndex = 0;

    // Hide the timer during countdown
    timerDisplay.text = "";

    function showCountdown() {
      if (countIndex >= countdownTexts.length) {
        // Countdown complete - start the game!
        gameState.gameStarted = true;
        timerDisplay.text = "2:00";
        createStatsHUD();
        return;
      }

      const countText = add([
        text(countdownTexts[countIndex], { size: 120 }),
        pos(width() / 2, height() / 2 - 50),
        anchor("center"),
        color(countIndex === 3 ? rgb(100, 255, 100) : rgb(255, 255, 255)),
        z(200),
        opacity(1),
        scale(1),
      ]);

      // Animate: scale up and fade out
      countText.onUpdate(() => {
        countText.scale = countText.scale.add(vec2(dt() * 2));
        countText.opacity -= dt() * 2;
      });

      // Play a sound for each count (reuse existing sounds)
      if (countIndex < 3) {
        // Could add countdown sounds here
      }

      wait(0.8, () => {
        destroy(countText);
        countIndex++;
        showCountdown();
      });
    }

    showCountdown();
  }

  // Start the countdown after a brief delay
  wait(0.3, () => {
    startCountdown();
  });
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
