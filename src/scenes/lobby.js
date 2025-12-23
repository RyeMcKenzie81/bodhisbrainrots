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

        function renderPlayers() {
            // Destroy all children manually (Kaboom doesn't have removeAllChildren)
            playerListContainer.get("*").forEach(child => destroy(child));

            players.forEach((p, i) => {
                const y = i * 70;

                // Player box
                playerListContainer.add([
                    rect(400, 60, { radius: 6 }),
                    pos(0, y),
                    anchor("center"),
                    color(p.id === myPlayerId ? rgb(60, 60, 100) : rgb(40, 40, 60)),
                    outline(3, p.ready ? rgb(100, 255, 100) : rgb(80, 80, 80)),
                ]);

                // Player name + status
                const statusIcon = p.ready ? "✓" : "○";
                const hostTag = i === 0 ? " [HOST]" : "";
                const youTag = p.id === myPlayerId ? " (YOU)" : "";
                playerListContainer.add([
                    text(`${statusIcon} ${p.name}${hostTag}${youTag}`, { size: 20 }),
                    pos(0, y),
                    anchor("center"),
                    color(255, 255, 255),
                ]);
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
            players.push(data.player);
            renderPlayers();
            try { play("powerup", { volume: 0.5 }); } catch (e) { }
        };

        const handlePlayerReady = (data) => {
            const p = players.find(player => player.id === data.playerId);
            if (p) {
                p.ready = true;
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
        socket.on("game_start", handleGameStart);

        // Start game function (host only, allow solo for testing)
        function startGame() {
            if (isHost && players.length >= 1) {
                socket.send("start_game");
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
