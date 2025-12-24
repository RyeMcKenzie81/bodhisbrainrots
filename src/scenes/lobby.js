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
                        play("click"); // Feedback
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
                        play("click"); // Feedback
                        cycleMyCharacter(1);
                    });
                }
            });

            playerCountText.text = `Players: ${players.length}/4`;

            // Show/hide start button (only host, allow solo testing)
            if (isHost && players.length >= 1) {
                startBtn.opacity = 1;
                startBtnText.opacity = 1;
                if (players.length === 1) {
                    waitingText.text = "Press SPACE or tap START (solo testing mode)";
                } else {
                    waitingText.text = "Press SPACE or tap START to begin!";
                }
            } else {
                startBtn.opacity = 0;
                startBtnText.opacity = 0;
                waitingText.text = "Waiting for host to start the game...";
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

        // Register handlers
        socket.on("room_created", handleRoomCreated);
        socket.on("room_joined", handleRoomJoined);
        socket.on("player_joined", handlePlayerJoined);
        socket.on("player_ready", handlePlayerReady);
        socket.on("player_updated", handlePlayerUpdated);
        socket.on("game_start", handleGameStart);

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
                play("click"); // Ensure sound plays here too if keys used
            }
        }

        // Input
        onKeyPress("space", () => {
            if (isHost) {
                startGame();
            } else {
                socket.send("ready");
            }
        });

        onKeyPress("enter", () => {
            if (isHost) {
                startGame();
            } else {
                socket.send("ready");
            }
        });

        onKeyPress("escape", () => {
            go("menu");
        });

        // Character Selection Keys
        onKeyPress("left", () => cycleMyCharacter(-1));
        onKeyPress("a", () => cycleMyCharacter(-1));
        onKeyPress("right", () => cycleMyCharacter(1));
        onKeyPress("d", () => cycleMyCharacter(1));

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
            socket.off("room_created", handleRoomCreated);
            socket.off("room_joined", handleRoomJoined);
            socket.off("player_joined", handlePlayerJoined);
            socket.off("player_ready", handlePlayerReady);
            socket.off("game_start", handleGameStart);
            cleanupTouch();
        });
    });
}
