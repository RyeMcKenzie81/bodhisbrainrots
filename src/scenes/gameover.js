import { setupMenuTouch } from "../utils/touchUtils.js";

export function initGameOverScene() {
    scene("gameover", (winnerName) => {
        // Play appropriate sound
        if (winnerName === "Nobody" || winnerName.includes("DRAW")) {
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
                action: () => go("menu")
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
