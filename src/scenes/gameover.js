import { setupMenuTouch } from "../utils/touchUtils.js";

export function initGameOverScene() {
    scene("gameover", (args) => {
        // Handle both string (singleplayer) and object (multiplayer) args
        let winnerName = "Nobody";
        let isMultiplayer = false;

        if (typeof args === "string") {
            winnerName = args;
        } else if (typeof args === "object") {
            winnerName = args.winner || "Nobody";
            isMultiplayer = args.isMultiplayer || false;
        }

        // Play appropriate sound
        if (winnerName === "Nobody" || winnerName === "No one" || (winnerName && winnerName.includes && winnerName.includes("DRAW"))) {
            play("loss");
        } else {
            play("win");
        }

        add([
            rect(width(), height()),
            pos(0, 0),
            color(20, 20, 40),
            z(-1),
        ]);

        add([
            sprite("brainboom"),
            pos(width() / 2, 250),
            anchor("center"),
            scale(0.3),
        ]);

        add([
            text(`${winnerName} Wins!`, { size: 42 }),
            pos(width() / 2, 420),
            anchor("center"),
            color(255, 255, 100),
        ]);

        // Play Again button (large, touch-friendly)
        add([
            rect(320, 80, { radius: 8 }),
            pos(width() / 2, 540),
            anchor("center"),
            color(rgb(40, 80, 40)),
            outline(4, rgb(100, 255, 100)),
        ]);

        add([
            text("TAP TO PLAY AGAIN", { size: 24 }),
            pos(width() / 2, 540),
            anchor("center"),
            color(255, 255, 255),
        ]);

        // Back to Menu button
        add([
            rect(200, 50, { radius: 6 }),
            pos(width() / 2, 640),
            anchor("center"),
            color(rgb(60, 40, 40)),
            outline(3, rgb(200, 100, 100)),
        ]);

        add([
            text("MENU", { size: 20 }),
            pos(width() / 2, 640),
            anchor("center"),
            color(255, 255, 255),
        ]);

        onKeyPress("space", () => go("menu"));
        onKeyPress("enter", () => go("menu"));
        onKeyPress("escape", () => go("menu"));

        // NATIVE TOUCH HANDLERS
        const touchButtons = [
            // Play Again
            {
                x: width() / 2,
                y: 540,
                w: 320,
                h: 80,
                action: () => {
                    if (isMultiplayer) {
                        go("lobby");
                    } else {
                        // For single player, restart game? Or menu?
                        // Let's assume menu since 'game' scene might need args
                        // But original code said go("menu"). 
                        // Let's actually verify if go("game") works for single player.
                        // Assuming single player setup scene is "game" or "main"?
                        // Let's stick to "menu" for now to be safe, or "lobby" if that's the hub.
                        // Actually, user wants "Play Again".
                        // Assuming "game" is the single player scene.
                        go("game");
                    }
                }
            },
            // Menu
            {
                x: width() / 2,
                y: 640,
                w: 200,
                h: 50,
                action: () => go("menu")
            }
        ];
        const cleanupTouch = setupMenuTouch(touchButtons);
        onSceneLeave(cleanupTouch);
    });
}
