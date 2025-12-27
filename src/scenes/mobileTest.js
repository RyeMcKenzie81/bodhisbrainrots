import { SIM_CONSTANTS } from "../sim/state.js";
import { PLAYERS } from "../constants.js";

export function initMobileTestScene() {
    scene("mobileTest", () => {
        // Enable Portrait Mode
        window.MOBILE_PORTRAIT_MODE = true;
        document.body.classList.add("allow-portrait"); // Force hide overlay immediately

        // Trigger resize to apply rotation
        window.dispatchEvent(new Event("resize"));

        // Background (Distinct Color)
        add([
            rect(width(), height()),
            pos(0, 0),
            color(50, 50, 100), // Distinct Blue
        ]);

        // Status Text
        add([
            text("PORTRAIT MODE ACTIVE", { size: 48 }),
            pos(width() / 2, height() / 2),
            anchor("center"),
            color(0, 255, 0),
            opacity(0.5),
            z(0),
        ]);

        // Center Camera
        camPos(width() / 2, height() / 2);

        // Render Grid
        const GRID_OFFSET_X = 160;
        const GRID_OFFSET_Y = 8;

        for (let y = 0; y < 11; y++) {
            for (let x = 0; x < 15; x++) {
                add([
                    rect(60, 60),
                    pos(x * 64 + 32 + GRID_OFFSET_X, y * 64 + 32 + GRID_OFFSET_Y),
                    anchor("center"),
                    color((x + y) % 2 === 0 ? rgb(40, 40, 60) : rgb(50, 50, 70)),
                ]);
            }
        }

        // Instructions
        add([
            text("PORTRAIT MODE TEST", { size: 32 }),
            pos(width() / 2, 50),
            anchor("center"),
            color(255, 255, 0),
        ]);

        add([
            text("Hold phone vertically!\nTap top = Move Right\nTap bottom = Move Left", { size: 24, align: "center" }),
            pos(width() / 2, height() - 100),
            anchor("center"),
            color(200, 200, 200),
        ]);

        // Player
        const player = add([
            sprite(PLAYERS[0].spriteFront),
            pos(width() / 2, height() / 2),
            anchor("center"),
            scale(1),
            area(),
        ]);

        // Touch Interaction
        // We use standard Kaboom events because we remapped the coordinates in main.js!

        let dest = player.pos.clone();

        onClick(() => {
            const m = mousePos();
            dest = m;

            // Visual indicator
            add([
                circle(10),
                pos(m),
                color(255, 0, 0),
                lifespan(0.5, { fade: 0.5 }),
                anchor("center"),
            ]);
        });

        onUpdate(() => {
            player.pos = player.pos.lerp(dest, dt() * 5);
        });

        // Exit Button
        add([
            rect(200, 60, { radius: 8 }),
            pos(100, 50),
            anchor("center"),
            color(200, 50, 50),
            area(),
        ]).onClick(() => {
            go("menu");
        });

        add([
            text("EXIT", { size: 24 }),
            pos(100, 50),
            anchor("center"),
            color(255, 255, 255),
        ]);

        // Clean up on leave
        onSceneLeave(() => {
            window.MOBILE_PORTRAIT_MODE = false;
            document.body.classList.remove("allow-portrait");
            window.dispatchEvent(new Event("resize"));
        });
    });
}
