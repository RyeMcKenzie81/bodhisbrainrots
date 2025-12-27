import { socket } from "../net/socket.js";
import { PLAYERS } from "../constants.js";
import { setupMenuTouch } from "../utils/touchUtils.js";

export function initLobbyScene() {
    scene("lobby", () => {
        let players = [];
        let myPlayerId = null;
        let roomId = null;
        let isHost = false;

        add([
            rect(width(), height()),
            pos(0, 0),
            color(20, 20, 40),
            z(-1),
        ]);

        add([
            text("ONLINE LOBBY", { size: 36 }),
            pos(width() / 2, 40),
            anchor("center"),
            color(100, 255, 100),
        ]);

        const roomCodeText = add([
            text("ROOM CODE: ???", { size: 28 }),
            pos(width() / 2, 90),
            anchor("center"),
            color(255, 200, 100),
        ]);

        const playerCountText = add([
            text("Players: 0/4", { size: 20 }),
            pos(width() / 2, 130),
            anchor("center"),
            color(200, 200, 200),
        ]);

        const playerListContainer = add([
            pos(width() / 2, 180),
            anchor("top"),
        ]);

        // Start button (visible only to host when 2+ players)
        const startBtn = add([
            rect(280, 70, { radius: 8 }),
            pos(width() / 2, 550),
            anchor("center"),
            color(rgb(40, 80, 40)),
            outline(4, rgb(100, 255, 100)),
            opacity(0), // Initially hidden
            z(10),
        ]);

        const startBtnText = add([
            text("START GAME", { size: 28 }),
            pos(width() / 2, 550),
            anchor("center"),
            color(255, 255, 255),
            opacity(0),
            z(11),
        ]);

        const waitingText = add([
            text("Share the room code with friends!", { size: 18 }),
            pos(width() / 2, 620),
            anchor("center"),
            color(150, 150, 150),
        ]);

        // ===== SETTINGS UI (Host Only) =====
        const timeOptions = [
            { label: "1 MIN", value: 60 },
            { label: "2 MIN", value: 120 },
            { label: "3 MIN", value: 180 },
            { label: "∞", value: 0 }, // Endless
        ];
        const speedOptions = [
            { label: "SLOW", value: 140 },
            { label: "NORMAL", value: 175 },
            { label: "FAST", value: 220 },
            { label: "TURBO", value: 280 },
        ];

        let currentTimeIdx = 1;  // Default: 2 MIN
        let currentSpeedIdx = 1; // Default: NORMAL

        // Time Label
        const timeLabelText = add([
            text("TIME:", { size: 16 }),
            pos(width() / 2 - 180, 470),
            anchor("center"),
            color(180, 180, 180),
            opacity(0), // Hidden until host
        ]);

        const timeValueText = add([
            text(timeOptions[currentTimeIdx].label, { size: 20 }),
            pos(width() / 2 - 80, 470),
            anchor("center"),
            color(255, 255, 100),
            opacity(0),
        ]);

        const timeLeftBtn = add([
            text("◀", { size: 24 }),
            pos(width() / 2 - 130, 470),
            anchor("center"),
            color(200, 200, 200),
            area(),
            opacity(0),
            "settingsBtn",
        ]);

        const timeRightBtn = add([
            text("▶", { size: 24 }),
            pos(width() / 2 - 30, 470),
            anchor("center"),
            color(200, 200, 200),
            area(),
            opacity(0),
            "settingsBtn",
        ]);

        // Speed Label
        const speedLabelText = add([
            text("SPEED:", { size: 16 }),
            pos(width() / 2 + 60, 470),
            anchor("center"),
            color(180, 180, 180),
            opacity(0),
        ]);

        const speedValueText = add([
            text(speedOptions[currentSpeedIdx].label, { size: 20 }),
            pos(width() / 2 + 180, 470),
            anchor("center"),
            color(100, 255, 255),
            opacity(0),
        ]);

        const speedLeftBtn = add([
            text("◀", { size: 24 }),
            pos(width() / 2 + 120, 470),
            anchor("center"),
            color(200, 200, 200),
            area(),
            opacity(0),
            "settingsBtn",
        ]);

        const speedRightBtn = add([
            text("▶", { size: 24 }),
            pos(width() / 2 + 240, 470),
            anchor("center"),
            color(200, 200, 200),
            area(),
            opacity(0),
            "settingsBtn",
        ]);

        function updateSettingsUI() {
            // Labels and values visible to all, arrows only to host
            const showLabels = 1; // Always show settings info
            const showArrows = isHost ? 1 : 0;

            timeLabelText.opacity = showLabels;
            timeValueText.opacity = showLabels;
            timeLeftBtn.opacity = showArrows;
            timeRightBtn.opacity = showArrows;
            speedLabelText.opacity = showLabels;
            speedValueText.opacity = showLabels;
            speedLeftBtn.opacity = showArrows;
            speedRightBtn.opacity = showArrows;

            timeValueText.text = timeOptions[currentTimeIdx].label;
            speedValueText.text = speedOptions[currentSpeedIdx].label;
        }

        function sendSettings() {
            socket.send("update_settings", {
                timeLimit: timeOptions[currentTimeIdx].value,
                playerSpeed: speedOptions[currentSpeedIdx].value,
            });
        }

        timeLeftBtn.onClick(() => {
            if (isHost) {
                currentTimeIdx = (currentTimeIdx - 1 + timeOptions.length) % timeOptions.length;
                updateSettingsUI();
                sendSettings();
            }
        });

        timeRightBtn.onClick(() => {
            if (isHost) {
                currentTimeIdx = (currentTimeIdx + 1) % timeOptions.length;
                updateSettingsUI();
                sendSettings();
            }
        });

        speedLeftBtn.onClick(() => {
            if (isHost) {
                currentSpeedIdx = (currentSpeedIdx - 1 + speedOptions.length) % speedOptions.length;
                updateSettingsUI();
                sendSettings();
            }
        });

        speedRightBtn.onClick(() => {
            if (isHost) {
                currentSpeedIdx = (currentSpeedIdx + 1) % speedOptions.length;
                updateSettingsUI();
                sendSettings();
            }
        });

        // Debug display for mobile
        const debugText = add([
            text("", { size: 14 }),
            pos(10, height() - 30),
            anchor("left"),
            color(255, 255, 0),
            z(999),
        ]);

        add([
            text("Use [A] / [D] to Change Character", { size: 16 }),
            pos(width() / 2, 160),
            anchor("center"),
            color(150, 150, 200),
        ]);

        function renderPlayers() {
            // Destroy all children manually (Kaboom doesn't have removeAllChildren)
            playerListContainer.get("*").forEach(child => destroy(child));

            players.forEach((p, i) => {
                const y = i * 85; // Increased spacing

                // Player box
                playerListContainer.add([
                    rect(400, 75, { radius: 6 }),
                    pos(0, y),
                    anchor("center"),
                    color(p.id === myPlayerId ? rgb(60, 60, 100) : rgb(40, 40, 60)),
                    outline(3, p.ready ? rgb(100, 255, 100) : rgb(80, 80, 80)),
                ]);

                // Character Sprite Preview
                const charIndex = p.characterIndex || 0;
                const charInfo = PLAYERS[charIndex];

                if (charInfo) {
                    playerListContainer.add([
                        sprite(charInfo.spriteFront),
                        pos(-150, y),
                        anchor("center"),
                        scale(0.12 * (charInfo.scale || 1))
                    ]);
                }

                // Player name + status
                const statusIcon = p.ready ? "✓" : "○";
                const hostTag = i === 0 ? " [HOST]" : "";
                const youTag = p.id === myPlayerId ? " (YOU)" : "";

                playerListContainer.add([
                    text(`${statusIcon} ${p.name || "Player"}${hostTag}${youTag}`, { size: 18 }),
                    pos(-100, y - 10), // Offset slightly up
                    anchor("left"),
                    color(255, 255, 255),
                ]);

                // Character Name Label
                playerListContainer.add([
                    text(`${charInfo ? charInfo.name : "Unknown"}`, { size: 14 }),
                    pos(-100, y + 15),
                    anchor("left"),
                    color(200, 200, 255),
                ]);

                // My Player Controls (Arrows)
                if (p.id === myPlayerId && !p.ready) {
                    // Left Arrow
                    const leftBtn = playerListContainer.add([
                        rect(60, 60, { radius: 8 }),
                        pos(140, y),
                        anchor("center"),
                        color(80, 80, 100),
                        outline(2, rgb(150, 150, 200)),
                        area({ cursor: "pointer" }),
                        z(200) // Ensure WAY on top
                    ]);
                    playerListContainer.add([
                        text("<", { size: 32 }),
                        pos(140, y),
                        anchor("center"),
                        z(201)
                    ]);

                    leftBtn.onHover(() => leftBtn.color = rgb(100, 100, 150));
                    leftBtn.onHoverEnd(() => leftBtn.color = rgb(80, 80, 100));
                    leftBtn.onClick(() => {
                        cycleMyCharacter(-1);
                    });

                    // Right Arrow
                    const rightBtn = playerListContainer.add([
                        rect(60, 60, { radius: 8 }),
                        pos(210, y), // Move right more
                        anchor("center"),
                        color(80, 80, 100),
                        outline(2, rgb(150, 150, 200)),
                        area({ cursor: "pointer" }),
                        z(200)
                    ]);
                    playerListContainer.add([
                        text(">", { size: 32 }),
                        pos(210, y),
                        anchor("center"),
                        z(201)
                    ]);

                    rightBtn.onHover(() => rightBtn.color = rgb(100, 100, 150));
                    rightBtn.onHoverEnd(() => rightBtn.color = rgb(80, 80, 100));
                    rightBtn.onClick(() => {
                        cycleMyCharacter(1);
                    });
                }
            });

            playerCountText.text = `Players: ${players.length}/4`;

            // Show/hide start button (only host, allow solo testing)
            if (isHost && players.length >= 1) {
                startBtn.opacity = 1;
                startBtnText.opacity = 1;
                waitingText.text = "↑↓ Navigate | ←→ Change | SPACE Confirm | Navigate to START";
            } else {
                startBtn.opacity = 0;
                startBtnText.opacity = 0;
                waitingText.text = "←→ Change Character | SPACE Ready Up";
            }
        }

        // Socket Events - Store handlers for cleanup
        const handleRoomCreated = (data) => {
            roomCodeText.text = `ROOM CODE: ${data.roomId}`;
            roomId = data.roomId;
            myPlayerId = data.playerId;
            isHost = true;
            players = [{ id: data.playerId, name: "You", ready: false }];
            renderPlayers();
            updateSettingsUI(); // Show settings controls for host
        };

        const handleRoomJoined = (data) => {
            console.log("[DEBUG] room_joined event received:", data);
            debugText.text = `Joined! Players: ${data.players?.length || 0} | MyID: ${data.playerId}`;
            roomCodeText.text = `ROOM CODE: ${data.roomId}`;
            roomId = data.roomId;
            myPlayerId = data.playerId;
            isHost = false;
            players = data.players;
            console.log("[DEBUG] Setting players array to:", players);
            renderPlayers();
        };


        const handlePlayerJoined = (data) => {
            // Only add if player doesn't already exist in the array
            const existingPlayer = players.find(p => p.id === data.player.id);
            if (!existingPlayer) {
                players.push(data.player);
                renderPlayers();
                try { play("powerup", { volume: 0.5 }); } catch (e) { }
            }
        };

        const handlePlayerReady = (data) => {
            const p = players.find(player => player.id === data.playerId);
            if (p) {
                p.ready = true;
                renderPlayers();
            }
        };

        const handlePlayerUpdated = (data) => {
            const p = players.find(player => player.id === data.player.id);
            if (p) {
                // Play callout if character changed
                if (p.characterIndex !== data.player.characterIndex) {
                    try {
                        play(`callout_${data.player.characterIndex}`);
                    } catch (e) { console.error(e); }
                }

                // Update properties
                p.characterIndex = data.player.characterIndex;
                p.name = data.player.name;
                p.ready = data.player.ready;
                p.wins = data.player.wins;
                p.losses = data.player.losses;
                renderPlayers();
            }
        };

        const handleGameStart = () => {
            go("onlineGame", { roomId, myPlayerId, players });
        };

        const handleSettingsUpdated = (data) => {
            // Update local settings display (for non-hosts to see)
            const timeIdx = timeOptions.findIndex(t => t.value === data.settings.timeLimit);
            const speedIdx = speedOptions.findIndex(s => s.value === data.settings.playerSpeed);
            if (timeIdx >= 0) currentTimeIdx = timeIdx;
            if (speedIdx >= 0) currentSpeedIdx = speedIdx;
            updateSettingsUI();
        };

        // Register handlers
        socket.on("room_created", handleRoomCreated);
        socket.on("room_joined", handleRoomJoined);
        socket.on("player_joined", handlePlayerJoined);
        socket.on("player_ready", handlePlayerReady);
        socket.on("player_updated", handlePlayerUpdated);
        socket.on("game_start", handleGameStart);
        socket.on("settings_updated", handleSettingsUpdated);

        // Start game function (host only, allow solo for testing)
        function startGame() {
            if (isHost && players.length >= 1) {
                socket.send("start_game");
            }
        }

        // Helper to cycle character
        function cycleMyCharacter(delta) {
            const p = players.find(player => player.id === myPlayerId);
            if (p && !p.ready) {
                const charIndex = p.characterIndex || 0;
                let newIdx = (charIndex + delta + PLAYERS.length) % PLAYERS.length;

                // Optimistic Update
                p.characterIndex = newIdx;
                renderPlayers();

                socket.send("update_character", { characterIndex: newIdx });
                try { play(`callout_${newIdx}`); } catch (e) { }
            }
        }

        // (Old input handlers removed - now using row-based navigation below)

        onKeyPress("escape", () => {
            go("menu");
        });

        // === ROW-BASED NAVIGATION ===
        // Rows: 0 = Character, 1 = Time, 2 = Speed, 3 = Start
        let selectedRow = 0;

        // Visual indicator for selected row
        const rowIndicator = add([
            text("▶", { size: 20 }),
            pos(0, 0),
            anchor("center"),
            color(255, 255, 100),
            z(50),
        ]);

        function updateRowIndicator() {
            // Position indicator based on selected row
            const me = players.find(p => p.id === myPlayerId);
            const myIndex = players.indexOf(me);

            if (selectedRow === 0) {
                // Character row (player's own box)
                const y = 180 + myIndex * 85;
                rowIndicator.pos = vec2(width() / 2 - 220, y);
                rowIndicator.opacity = 1;
            } else if (selectedRow === 1 && isHost) {
                // Time row
                rowIndicator.pos = vec2(width() / 2 - 200, 470);
                rowIndicator.opacity = 1;
            } else if (selectedRow === 2 && isHost) {
                // Speed row
                rowIndicator.pos = vec2(width() / 2 + 40, 470);
                rowIndicator.opacity = 1;
            } else if (selectedRow === 3 && isHost) {
                // Start button
                rowIndicator.pos = vec2(width() / 2 - 160, 550);
                rowIndicator.opacity = 1;
            } else {
                rowIndicator.opacity = 0;
            }
        }

        // Navigation
        onKeyPress("up", () => {
            if (isHost) {
                selectedRow = (selectedRow - 1 + 4) % 4;
            }
            updateRowIndicator();
        });
        onKeyPress("w", () => {
            if (isHost) {
                selectedRow = (selectedRow - 1 + 4) % 4;
            }
            updateRowIndicator();
        });

        onKeyPress("down", () => {
            if (isHost) {
                selectedRow = (selectedRow + 1) % 4;
            }
            updateRowIndicator();
        });
        onKeyPress("s", () => {
            if (isHost) {
                selectedRow = (selectedRow + 1) % 4;
            }
            updateRowIndicator();
        });

        // Left/Right controls current row
        onKeyPress("left", () => {
            if (selectedRow === 0) {
                cycleMyCharacter(-1);
            } else if (selectedRow === 1 && isHost) {
                currentTimeIdx = (currentTimeIdx - 1 + timeOptions.length) % timeOptions.length;
                updateSettingsUI();
                sendSettings();
            } else if (selectedRow === 2 && isHost) {
                currentSpeedIdx = (currentSpeedIdx - 1 + speedOptions.length) % speedOptions.length;
                updateSettingsUI();
                sendSettings();
            }
        });
        onKeyPress("a", () => {
            if (selectedRow === 0) {
                cycleMyCharacter(-1);
            } else if (selectedRow === 1 && isHost) {
                currentTimeIdx = (currentTimeIdx - 1 + timeOptions.length) % timeOptions.length;
                updateSettingsUI();
                sendSettings();
            } else if (selectedRow === 2 && isHost) {
                currentSpeedIdx = (currentSpeedIdx - 1 + speedOptions.length) % speedOptions.length;
                updateSettingsUI();
                sendSettings();
            }
        });

        onKeyPress("right", () => {
            if (selectedRow === 0) {
                cycleMyCharacter(1);
            } else if (selectedRow === 1 && isHost) {
                currentTimeIdx = (currentTimeIdx + 1) % timeOptions.length;
                updateSettingsUI();
                sendSettings();
            } else if (selectedRow === 2 && isHost) {
                currentSpeedIdx = (currentSpeedIdx + 1) % speedOptions.length;
                updateSettingsUI();
                sendSettings();
            }
        });
        onKeyPress("d", () => {
            if (selectedRow === 0) {
                cycleMyCharacter(1);
            } else if (selectedRow === 1 && isHost) {
                currentTimeIdx = (currentTimeIdx + 1) % timeOptions.length;
                updateSettingsUI();
                sendSettings();
            } else if (selectedRow === 2 && isHost) {
                currentSpeedIdx = (currentSpeedIdx + 1) % speedOptions.length;
                updateSettingsUI();
                sendSettings();
            }
        });

        // Space/Enter activates current row
        onKeyPress("space", () => {
            if (selectedRow === 0) {
                // Ready up
                socket.send("ready");
            } else if (selectedRow === 3 && isHost) {
                // Start game
                startGame();
            }
        });
        onKeyPress("enter", () => {
            if (selectedRow === 0) {
                // Ready up
                socket.send("ready");
            } else if (selectedRow === 3 && isHost) {
                // Start game
                startGame();
            }
        });

        // NATIVE TOUCH HANDLERS
        const touchButtons = [
            {
                x: width() / 2,
                y: 550,
                w: 280,
                h: 70,
                action: startGame
            }
        ];
        const cleanupTouch = setupMenuTouch(touchButtons);

        // Cleanup on scene leave
        onSceneLeave(() => {
            cleanupTouch();
            socket.removeAllListeners();
        });

        // Loop to update debug text
        onUpdate(() => {
            const p = players.find(p => p.id === myPlayerId);
            debugText.text = `ID: ${myPlayerId || "?"} | P: ${players.length} | Ready: ${p ? p.ready : "?"} | Idx: ${p ? p.characterIndex : "?"}`;
        });
    });
}
