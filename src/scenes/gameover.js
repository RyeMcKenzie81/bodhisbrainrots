export function initGameOverScene() {
    scene("gameover", (winnerName) => {
        // Play appropriate sound
        if (winnerName === "Nobody" || winnerName.includes("DRAW")) {
            play("loss");
        } else {
            // If it's singleplayer and the human (P1) won, play win. 
            // If AI won, might still just play win music or loss? 
            // For now, simple logic:
            play("win");
        }

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
}
