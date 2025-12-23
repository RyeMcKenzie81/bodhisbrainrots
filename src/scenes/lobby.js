import { socket } from "../net/socket.js";
import { PLAYERS } from "../constants.js";

export function initLobbyScene() {
    scene("lobby", () => {
        let players = [];
        let myPlayerId = null;
        let roomId = null;

        add([
            text("WAITING FOR PLAYERS...", { size: 28 }),
            pos(width() / 2, 50),
            anchor("center"),
            color(255, 255, 100),
        ]);

        const roomCodeText = add([
            text("ROOM CODE: ???", { size: 32 }),
            pos(width() / 2, 100),
            anchor("center"),
            color(100, 255, 255),
        ]);

        const playerListContainer = add([
            pos(width() / 2, 200),
            anchor("top"),
        ]);

        function renderPlayers() {
            playerListContainer.removeAllChildren();

            players.forEach((p, i) => {
                const y = i * 60;

                // Status Icon (Checkmark or cross)
                playerListContainer.add([
                    rect(30, 30, { radius: 4 }),
                    pos(-150, y),
                    anchor("center"),
                    color(p.ready ? rgb(50, 200, 50) : rgb(100, 100, 100)),
                ]);

                // Name
                playerListContainer.add([
                    text(p.name + (p.id === myPlayerId ? " (YOU)" : ""), { size: 20 }),
                    pos(-100, y),
                    anchor("left"),
                    color(255, 255, 255),
                ]);
            });
        }

        add([
            text("PRESS SPACE TO TOGGLE READY", { size: 18 }),
            pos(width() / 2, height() - 100),
            anchor("center"),
            color(150, 150, 150),
        ]);

        // Socket Events
        socket.on("room_created", (data) => {
            roomCodeText.text = `ROOM CODE: ${data.roomId}`;
            roomId = data.roomId;
            myPlayerId = data.playerId;
            players = [{ id: data.playerId, name: "You", ready: false }];
            renderPlayers();
        });

        socket.on("room_joined", (data) => {
            roomCodeText.text = `ROOM CODE: ${data.roomId}`;
            roomId = data.roomId;
            myPlayerId = data.playerId;
            players = data.players;
            renderPlayers();
        });

        socket.on("player_joined", (data) => {
            players.push(data.player);
            renderPlayers();
        });

        socket.on("player_ready", (data) => {
            const p = players.find(player => player.id === data.playerId);
            if (p) {
                p.ready = true;
                renderPlayers();
            }
        });

        socket.on("game_start", () => {
            go("onlineGame", { roomId, myPlayerId, players });
        });

        // Input
        onKeyPress("space", () => {
            socket.send("ready");
        });

        onKeyPress("enter", () => {
            socket.send("ready");
        });

        onKeyPress("escape", () => {
            // socket.disconnect(); // Or leave room
            go("menu");
        });
    });
}
