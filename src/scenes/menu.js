import { PLAYERS } from "../constants.js";
import { gameConfig } from "../state.js";
import { setupMenuTouch } from "../utils/touchUtils.js";

export function initMenuScenes() {
    // Scene: Main Menu
    scene("menu", () => {
        add([
            text("BoDawg's Brainrots", { size: 48 }),
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
            const totalWidth = (PLAYERS.length - 1) * 150;
            const startX = width() / 2 - totalWidth / 2;
            const xPos = startX + i * 150;
            const s = add([
                sprite(p.spriteFront),
                pos(xPos, charY),
                anchor("center"),
                scale(1),
            ]);
            // Auto-scale Title Lineup
            if (s.width) {
                const fitSize = 100;
                s.scale = vec2(Math.min(fitSize / s.width, fitSize / s.height));
            }
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
            text("Tap or Press SPACE to Start!", { size: 24 }),
            pos(width() / 2, 530),
            anchor("center"),
            color(255, 255, 255),
        ]);

        onKeyPress("space", () => go("modeSelect"));
        onClick(() => go("modeSelect"));
    });

    // Scene: Mode Selection
    scene("modeSelect", () => {
        let selectedMode = 0; // 0 = Single, 1 = Local MP, 2 = Online
        const modes = ["SINGLE PLAYER", "LOCAL CO-OP", "ONLINE"];
        const modeDescriptions = [
            "Battle 1-3 AI opponents",
            "2-4 players on one device",
            "Join/Create room on server"
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
            const spacing = 280;
            const x = width() / 2 - spacing + i * spacing;
            // Original incorrect: const x = width() / 2 - 150 + i * 300;

            const btn = add([
                rect(240, 120, { radius: 8 }),
                pos(x, buttonY),
                anchor("center"),
                color(i === selectedMode ? rgb(80, 80, 120) : rgb(40, 40, 60)),
                outline(4, i === selectedMode ? rgb(255, 200, 100) : rgb(60, 60, 80)),
                area(), // Make clickable
                z(0),
                "modeBtn", // Tag for click handling
                { modeIndex: i },
            ]);
            modeButtons.push(btn);

            // ... (rest of the content inside forEach)

            // Click handling for mode buttons
            btn.onClick(() => {
                selectedMode = i;
                updateSelection();
                confirmMode();
            });

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
                const s = add([
                    sprite(PLAYERS[0].spriteFront),
                    pos(x - 50, buttonY + 110),
                    anchor("center"),
                    scale(1),
                    z(1),
                ]);
                if (s.width) {
                    const fitSize = 50;
                    s.scale = vec2(Math.min(fitSize / s.width, fitSize / s.height));
                }
                add([
                    text("VS", { size: 14 }),
                    pos(x, buttonY + 115),
                    anchor("center"),
                    color(255, 100, 100),
                    z(1),
                ]);
                add([
                    text("CPU", { size: 14 }),
                    pos(x + 50, buttonY + 115),
                    anchor("center"),
                    color(100, 200, 255),
                    z(1),
                ]);
            } else {
                for (let p = 0; p < 2; p++) {
                    const s = add([
                        sprite(PLAYERS[p].spriteFront),
                        pos(x - 30 + p * 60, buttonY + 110),
                        anchor("center"),
                        scale(1),
                        z(1),
                    ]);
                    if (s.width) {
                        const fitSize = 50;
                        s.scale = vec2(Math.min(fitSize / s.width, fitSize / s.height));
                    }
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
        onKeyPress("d", () => { selectedMode = Math.min(2, selectedMode + 1); updateSelection(); });
        onKeyPress("right", () => { selectedMode = Math.min(2, selectedMode + 1); updateSelection(); });
        onKeyPress("a", () => { selectedMode = Math.max(0, selectedMode - 1); updateSelection(); });
        onKeyPress("left", () => { selectedMode = Math.max(0, selectedMode - 1); updateSelection(); });

        function confirmMode() {
            if (selectedMode === 0) {
                gameConfig.mode = "singleplayer";
                go("difficultySelect");
            } else if (selectedMode === 1) {
                gameConfig.mode = "multiplayer";
                go("playerCount");
            } else {
                gameConfig.mode = "online";
                go("onlineMenu");
            }
        }

        onKeyPress("space", confirmMode);
        onKeyPress("enter", confirmMode);

        // NATIVE TOUCH HANDLER for mobile (bypasses Kaboom's broken coordinates)
        const spacing = 280;
        const touchButtons = modes.map((_, i) => ({
            x: width() / 2 - spacing + i * spacing,
            y: buttonY,
            w: 240,
            h: 120,
            action: () => {
                selectedMode = i;
                updateSelection();
                confirmMode();
            }
        }));
        const cleanupTouch = setupMenuTouch(touchButtons);
        onSceneLeave(cleanupTouch);
    });

    // Scene: Online Menu
    scene("onlineMenu", () => {
        // connect if not connected
        import("../net/socket.js").then(({ socket }) => {
            if (!socket.connected) {
                const protocol = window.location.protocol === "https:" ? "wss" : "ws";
                const host = window.location.hostname === "localhost" ? "localhost:3000" : window.location.host;
                socket.connect(`${protocol}://${host}`);
            }

            let selectedOption = 0;
            const options = ["CREATE ROOM", "JOIN ROOM"];

            add([
                text("ONLINE MULTIPLAYER", { size: 36 }),
                pos(width() / 2, 80),
                anchor("center"),
                color(100, 255, 100),
            ]);

            const buttons = [];

            options.forEach((opt, i) => {
                const btn = add([
                    rect(300, 60, { radius: 8 }),
                    pos(width() / 2, 250 + i * 100),
                    anchor("center"),
                    color(rgb(40, 40, 60)),
                    outline(4, rgb(60, 60, 80)),
                    area(),
                    "onlineBtn",
                    { optIndex: i }
                ]);
                buttons.push(btn);

                // Click handler
                btn.onClick(() => {
                    selectedOption = i;
                    confirm();
                });

                add([
                    text(opt, { size: 24 }),
                    pos(width() / 2, 250 + i * 100),
                    anchor("center"),
                    color(255, 255, 255),
                ]);
            });

            function updateSelection() {
                buttons.forEach((btn, i) => {
                    btn.color = i === selectedOption ? rgb(80, 80, 120) : rgb(40, 40, 60);
                    btn.outline.color = i === selectedOption ? rgb(100, 255, 100) : rgb(60, 60, 80);
                });
            }
            updateSelection();

            onKeyPress("w", () => { selectedOption = 0; updateSelection(); });
            onKeyPress("up", () => { selectedOption = 0; updateSelection(); });
            onKeyPress("s", () => { selectedOption = 1; updateSelection(); });
            onKeyPress("down", () => { selectedOption = 1; updateSelection(); });

            function confirm() {
                if (selectedOption === 0) {
                    // Create
                    socket.send("create_room", { name: `Player_${Math.floor(Math.random() * 1000)}` });
                    // Listen for room_created (handled in lobby scene or global listener)
                    go("lobby");
                } else {
                    // Join
                    const code = window.prompt("Enter Room Code:");
                    if (code) {
                        socket.send("join_room", { roomId: code.toUpperCase(), name: `Player_${Math.floor(Math.random() * 1000)}` });
                        go("lobby");
                    }
                }
            }

            onKeyPress("space", confirm);
            onKeyPress("enter", confirm);
            onKeyPress("escape", () => go("modeSelect"));
        });

        onKeyPress("escape", () => go("menu"));

        add([
            text("< A / D > SELECT     SPACE CONFIRM     ESC BACK", { size: 14 }),
            pos(width() / 2, 500),
            anchor("center"),
            color(120, 120, 120),
        ]);

        // NATIVE TOUCH HANDLERS for mobile (added outside the import callback)
        const touchButtons = [
            // CREATE ROOM button
            {
                x: width() / 2,
                y: 250,
                w: 300,
                h: 60,
                action: () => {
                    import("../net/socket.js").then(({ socket }) => {
                        socket.send("create_room", { name: `Player_${Math.floor(Math.random() * 1000)}` });
                        go("lobby");
                    });
                }
            },
            // JOIN ROOM button
            {
                x: width() / 2,
                y: 350,
                w: 300,
                h: 60,
                action: () => {
                    const code = window.prompt("Enter Room Code:");
                    if (code) {
                        import("../net/socket.js").then(({ socket }) => {
                            socket.send("join_room", { roomId: code.toUpperCase(), name: `Player_${Math.floor(Math.random() * 1000)}` });
                            go("lobby");
                        });
                    }
                }
            }
        ];
        const cleanupTouch = setupMenuTouch(touchButtons);
        onSceneLeave(cleanupTouch);
    });

    // Scene: Difficulty Selection
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
            rgb(100, 200, 100),
            rgb(255, 200, 100),
            rgb(255, 100, 100),
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
                area(),
                "diffBtn",
                z(0),
            ]);
            diffButtons.push(btn);

            btn.onClick(() => {
                selectedDifficulty = i;
                updateDiffSelection();
                confirmDifficulty();
            });

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
                    sprite(PLAYERS[(i + 1) % PLAYERS.length].spriteFront),
                    pos(previewStartX + i * 100, 520),
                    anchor("center"),
                    scale(1),
                ]);
                // Auto-scale Opponent Preview
                if (cpuSprite.width) {
                    const fitSize = 80;
                    cpuSprite.scale = vec2(Math.min(fitSize / cpuSprite.width, fitSize / cpuSprite.height));
                }
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

        // Touch Arrows for Opponent Count
        add([
            text("<", { size: 48 }),
            pos(width() / 2 - 100, 380),
            anchor("center"),
            color(255, 255, 255),
            area(),
            "oppDec"
        ]).onClick(() => {
            selectedOpponents = Math.max(1, selectedOpponents - 1);
            countDisplay.text = selectedOpponents.toString();
            updateOpponentPreview();
        });

        add([
            text(">", { size: 48 }),
            pos(width() / 2 + 100, 380),
            anchor("center"),
            color(255, 255, 255),
            area(),
            "oppInc"
        ]).onClick(() => {
            selectedOpponents = Math.min(3, selectedOpponents + 1);
            countDisplay.text = selectedOpponents.toString();
            updateOpponentPreview();
        });

        // Confirm Button for touch
        add([
            rect(200, 60, { radius: 8 }),
            pos(width() / 2, 650),
            anchor("center"),
            color(rgb(40, 40, 60)),
            outline(4, rgb(100, 200, 100)),
            area(),
            "confirmDiffBtn"
        ]).onClick(() => confirmDifficulty());

        add([
            text("CONFIRM", { size: 24 }),
            pos(width() / 2, 650),
            anchor("center"),
            color(255, 255, 255),
        ]);

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

        // NATIVE TOUCH HANDLERS for mobile
        const touchButtons = [
            // Difficulty buttons
            ...difficulties.map((_, i) => ({
                x: startX + i * spacing,
                y: buttonY,
                w: buttonWidth,
                h: 100,
                action: () => {
                    selectedDifficulty = i;
                    updateDiffSelection();
                }
            })),
            // Opponent decrease arrow
            {
                x: width() / 2 - 100,
                y: 380,
                w: 80,
                h: 80,
                action: () => {
                    selectedOpponents = Math.max(1, selectedOpponents - 1);
                    countDisplay.text = selectedOpponents.toString();
                    updateOpponentPreview();
                }
            },
            // Opponent increase arrow
            {
                x: width() / 2 + 100,
                y: 380,
                w: 80,
                h: 80,
                action: () => {
                    selectedOpponents = Math.min(PLAYERS.length - 1, selectedOpponents + 1);
                    countDisplay.text = selectedOpponents.toString();
                    updateOpponentPreview();
                }
            },
            // Confirm button
            {
                x: width() / 2,
                y: 650,
                w: 200,
                h: 60,
                action: confirmDifficulty
            }
        ];
        const cleanupTouch = setupMenuTouch(touchButtons);
        onSceneLeave(cleanupTouch);
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
                    scale(1),
                ]);
                // Auto-scale Count Preview
                if (icon.width) {
                    const fitSize = 80;
                    icon.scale = vec2(Math.min(fitSize / icon.width, fitSize / icon.height));
                }
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

        // Touch Arrows for Player Count
        add([
            text("<", { size: 60 }),
            pos(width() / 2 - 150, 250),
            anchor("center"),
            color(255, 255, 255),
            area(),
        ]).onClick(() => {
            selectedCount = Math.max(2, selectedCount - 1);
            countDisplay.text = selectedCount.toString();
            updatePlayerIcons();
        });

        add([
            text(">", { size: 60 }),
            pos(width() / 2 + 150, 250),
            anchor("center"),
            color(255, 255, 255),
            area(),
        ]).onClick(() => {
            selectedCount = Math.min(4, selectedCount + 1);
            countDisplay.text = selectedCount.toString();
            updatePlayerIcons();
        });

        // Confirm Button (Touch)
        add([
            rect(240, 70, { radius: 8 }),
            pos(width() / 2, 450),
            anchor("center"),
            color(rgb(40, 40, 60)),
            outline(4, rgb(100, 200, 100)),
            area(),
        ]).onClick(() => {
            gameConfig.playerCount = selectedCount;
            gameConfig.playerCharacters = [];
            go("characterSelect", { currentPlayer: 0 });
        });

        onKeyPress("space", () => {
            gameConfig.playerCount = selectedCount;
            gameConfig.playerCharacters = [];
            go("characterSelect", { currentPlayer: 0 });
        });

        onKeyPress("escape", () => go("menu"));

        // NATIVE TOUCH HANDLERS for mobile
        function confirmPlayerCount() {
            gameConfig.playerCount = selectedCount;
            gameConfig.playerCharacters = [];
            go("characterSelect", { currentPlayer: 0 });
        }

        const touchButtons = [
            // Decrease count arrow
            {
                x: width() / 2 - 150,
                y: 250,
                w: 100,
                h: 100,
                action: () => {
                    selectedCount = Math.max(2, selectedCount - 1);
                    countDisplay.text = selectedCount.toString();
                    updatePlayerIcons();
                }
            },
            // Increase count arrow
            {
                x: width() / 2 + 150,
                y: 250,
                w: 100,
                h: 100,
                action: () => {
                    selectedCount = Math.min(4, selectedCount + 1);
                    countDisplay.text = selectedCount.toString();
                    updatePlayerIcons();
                }
            },
            // Confirm button
            {
                x: width() / 2,
                y: 450,
                w: 240,
                h: 70,
                action: confirmPlayerCount
            }
        ];
        const cleanupTouch = setupMenuTouch(touchButtons);
        onSceneLeave(cleanupTouch);
    });

    // Global select music handle
    let selectMusicHandle = null;

    // Scene: Character Select
    scene("characterSelect", ({ currentPlayer }) => {
        if (currentPlayer === 0) {
            if (selectMusicHandle && selectMusicHandle.stop) selectMusicHandle.stop();
            const music = play("selectmusic", { loop: true, volume: 0.5 });
            if (music && music.stop) {
                selectMusicHandle = music;
            } else {
                selectMusicHandle = null;
            }
        }

        let selectedChar = 0;
        const takenCharacters = gameConfig.playerCharacters;

        while (takenCharacters.includes(selectedChar) && selectedChar < PLAYERS.length) {
            selectedChar++;
        }
        if (selectedChar >= PLAYERS.length) selectedChar = 0; // Fallback

        const playerColors = [
            rgb(255, 200, 50),
            rgb(100, 150, 255),
            rgb(255, 100, 150),
            rgb(100, 255, 150),
            rgb(200, 100, 255),
        ];

        add([
            rect(width(), height()),
            pos(0, 0),
            color(20, 20, 40),
            z(-2),
        ]);

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

        const charSprites = [];
        const charBoxes = [];
        const rosterY = 280;
        const boxSize = 120;
        const spacing = 130;
        const gridStartX = width() * 0.6; // Center of grid roughly on right side
        const gridStartY = 350;

        PLAYERS.forEach((p, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = gridStartX + (col - 1) * spacing;
            const y = gridStartY + (row - 0.5) * spacing;

            const isTaken = takenCharacters.includes(i);
            const takenByPlayer = takenCharacters.indexOf(i);

            const box = add([
                rect(boxSize, boxSize, { radius: 4 }),
                pos(x, y),
                anchor("center"),
                color(isTaken ? rgb(30, 30, 40) : rgb(50, 50, 70)),
                outline(4, isTaken ? playerColors[takenByPlayer] : rgb(80, 80, 100)),
                z(0),
                area(),
                "charBox",
                { charIndex: i },
            ]);
            charBoxes.push(box);

            box.onClick(() => {
                if (selectedChar !== i) {
                    selectedChar = i;
                    updateSelection();
                } else {
                    confirmSelection();
                }
            });

            const charSprite = add([
                sprite(p.spriteFront),
                pos(x, y - 10),
                anchor("center"),
                // scale(0.12 * (p.scale || 1)),
                scale(1),
                opacity(isTaken ? 0.4 : 1),
                z(1),
            ]);
            // Auto-scale to fit box (Grid Icon)
            if (charSprite.width) {
                const fitSize = 80;
                // Allow some distinct sizes? No, uniformity is safer for "Too Big/Small" complaints
                charSprite.scale = vec2(Math.min(fitSize / charSprite.width, fitSize / charSprite.height));
            }
            charSprites.push(charSprite);

            add([
                rect(boxSize - 10, 22, { radius: 2 }),
                pos(x, y + 55),
                anchor("center"),
                color(isTaken ? rgb(40, 40, 50) : rgb(20, 20, 30)),
                z(1),
            ]);

            add([
                text(p.name, { size: 11 }),
                pos(x, y + 55),
                anchor("center"),
                color(isTaken ? rgb(100, 100, 100) : rgb(255, 255, 255)),
                z(2),
            ]);

            if (isTaken) {
                add([
                    rect(30, 18, { radius: 2 }),
                    pos(x + boxSize / 2 - 20, y - boxSize / 2 + 15),
                    anchor("center"),
                    color(playerColors[takenByPlayer]),
                    z(3),
                ]);
                add([
                    text(`P${takenByPlayer + 1}`, { size: 10 }),
                    pos(x + boxSize / 2 - 20, y - boxSize / 2 + 15),
                    anchor("center"),
                    color(0, 0, 0),
                    z(4),
                ]);
            }
        });

        const cursor = add([
            pos(0, 0), // Will be set by updateSelection
            anchor("center"),
            z(5),
            {
                draw() {
                    const pulse = 3 + Math.sin(time() * 6) * 2;
                    drawRect({
                        width: boxSize + 10,
                        height: boxSize + 10,
                        anchor: "center",
                        fill: false,
                        outline: { color: playerColors[currentPlayer], width: 5 + pulse }
                    });
                }
            }
        ]);

        const previewSprite = add([
            sprite(PLAYERS[selectedChar].spriteFront),
            pos(width() * 0.25, 450), // Big portrait on LEFT
            anchor("center"),
            scale(0.45 * (PLAYERS[selectedChar].scale || 1)), // Much bigger
        ]);

        add([
            rect(200, 30, { radius: 4 }),
            pos(width() / 2, 620),
            anchor("center"),
            color(playerColors[currentPlayer]),
        ]);

        const previewName = add([
            text(PLAYERS[selectedChar].name, { size: 24 }),
            pos(width() * 0.25, 600),
            anchor("center"),
            color(0, 0, 0),
        ]);

        function updateSelection() {
            const col = selectedChar % 3;
            const row = Math.floor(selectedChar / 3);
            const x = gridStartX + (col - 1) * spacing;
            const y = gridStartY + (row - 0.5) * spacing;

            cursor.pos.x = x;
            cursor.pos.y = y;

            previewSprite.use(sprite(PLAYERS[selectedChar].spriteFront));
            // previewSprite.scale = vec2(0.45 * (PLAYERS[selectedChar].scale || 1));
            // Auto-scale Preview
            if (previewSprite.width) {
                const fitHeight = 300;
                previewSprite.scale = vec2(fitHeight / previewSprite.height);
            }
            previewName.text = PLAYERS[selectedChar].name;

            // Pulse effect reset?
            // cursor.outline.color = playerColors[currentPlayer];
        }

        if (takenCharacters.length > 0) {
            add([
                text("SELECTED:", { size: 12 }),
                pos(50, 450),
                anchor("left"),
                color(150, 150, 150),
            ]);

            takenCharacters.forEach((charIdx, i) => {
                const listSprite = add([
                    sprite(PLAYERS[charIdx].spriteFront),
                    pos(50 + i * 70, 520),
                    anchor("center"),
                    // scale(0.08 * (PLAYERS[charIdx].scale || 1)),
                    scale(1),
                ]);
                // Auto-scale Selected List
                if (listSprite.width) {
                    const fitSize = 40;
                    listSprite.scale = vec2(Math.min(fitSize / listSprite.width, fitSize / listSprite.height));
                }
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
            let offset = 0;
            if (dir === "left") offset = -1;
            if (dir === "right") offset = 1;
            if (dir === "up") offset = -3;
            if (dir === "down") offset = 3;

            let newChar = selectedChar + offset;

            // Simple wrap
            if (newChar < 0) newChar += PLAYERS.length;
            if (newChar >= PLAYERS.length) newChar -= PLAYERS.length;

            let attempts = 0;
            // Try to find available slot in that direction (naive)
            while (takenCharacters.includes(newChar) && attempts < 6) {
                newChar += offset;
                if (newChar < 0) newChar += PLAYERS.length;
                if (newChar >= PLAYERS.length) newChar -= PLAYERS.length;
                attempts++;
            }

            if (!takenCharacters.includes(newChar)) {
                selectedChar = newChar;
                updateSelection();
            }
        }

        const controls = PLAYERS[currentPlayer].keys;


        // Universal Controls
        onKeyPress("a", () => moveSelection("left"));
        onKeyPress("d", () => moveSelection("right"));
        onKeyPress("w", () => moveSelection("up"));
        onKeyPress("s", () => moveSelection("down"));

        onKeyPress("left", () => moveSelection("left"));
        onKeyPress("right", () => moveSelection("right"));
        onKeyPress("up", () => moveSelection("up"));
        onKeyPress("down", () => moveSelection("down"));

        onKeyPress(controls.bomb, () => confirmSelection());
        onKeyPress("space", () => confirmSelection());
        onKeyPress("enter", () => confirmSelection());

        function confirmSelection() {
            if (takenCharacters.includes(selectedChar)) return;

            play(`callout_${selectedChar}`, { volume: 0.9 });
            gameConfig.playerCharacters.push(selectedChar);

            add([
                rect(width(), height()),
                pos(0, 0),
                color(255, 255, 255),
                opacity(0.5),
                z(100),
                lifespan(0.2, { fade: 0.2 }),
            ]);

            wait(0.5, () => {
                if (gameConfig.mode === "singleplayer" && currentPlayer === 0) {
                    const availableChars = Array.from({ length: PLAYERS.length }, (_, i) => i).filter(c => !gameConfig.playerCharacters.includes(c));
                    for (let i = 1; i < gameConfig.playerCount; i++) {
                        const randomIndex = Math.floor(Math.random() * availableChars.length);
                        gameConfig.playerCharacters.push(availableChars.splice(randomIndex, 1)[0]);
                    }
                    if (selectMusicHandle && selectMusicHandle.stop) {
                        selectMusicHandle.stop();
                        selectMusicHandle = null;
                    }
                    go("game");
                } else if (currentPlayer + 1 < gameConfig.playerCount) {
                    go("characterSelect", { currentPlayer: currentPlayer + 1 });
                } else {
                    if (selectMusicHandle && selectMusicHandle.stop) {
                        selectMusicHandle.stop();
                        selectMusicHandle = null;
                    }
                    go("game");
                }
            });
        }

        onKeyPress("escape", () => {
            if (selectMusicHandle && selectMusicHandle.stop) {
                selectMusicHandle.stop();
                selectMusicHandle = null;
            }
            if (gameConfig.mode === "singleplayer") {
                go("difficultySelect");
            } else {
                go("playerCount");
            }
        });

        add([
            text("ARROWS: SELECT     SPACE: CONFIRM     ESC: BACK", { size: 14 }),
            pos(width() / 2, 700),
            anchor("center"),
            color(150, 150, 150),
        ]);

        // NATIVE TOUCH HANDLERS for mobile
        const touchButtons = PLAYERS.map((_, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = gridStartX + (col - 1) * spacing;
            const y = gridStartY + (row - 0.5) * spacing;

            return {
                x: x,
                y: y,
                w: boxSize,
                h: boxSize,
                action: () => {
                    if (takenCharacters.includes(i)) return;
                    if (selectedChar === i) {
                        // Double tap = confirm
                        confirmSelection();
                    } else {
                        selectedChar = i;
                        updateSelection();
                    }
                }
            };
        });
        const cleanupTouch = setupMenuTouch(touchButtons);
        onSceneLeave(cleanupTouch);
    });
}
