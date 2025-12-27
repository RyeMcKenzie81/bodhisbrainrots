import { SIM_CONSTANTS } from "../sim/state.js";
import { PLAYERS } from "../constants.js";

export function initMobileTestScene() {
    scene("mobileTest", () => {
        // Enable Portrait Mode
        window.MOBILE_PORTRAIT_MODE = true;
        document.body.classList.add("allow-portrait"); // Force hide overlay immediately

        // Safe Resize Trigger
        // Initial Resize
        if (window.fitCanvas) {
            window.fitCanvas();
        } else {
            // Fallback (shouldn't be needed)
            try { window.dispatchEvent(new Event("resize")); } catch (e) { }
        }

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
            rotate(-90),
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
            rotate(-90),
        ]);

        add([
            text("Hold phone vertically!\nTap Top = Forward\nTap Bottom = Backward", { size: 24, align: "center" }),
            pos(width() / 2, height() - 100),
            anchor("center"),
            color(200, 200, 200),
            rotate(-90),
        ]);

        // Player
        const player = add([
            sprite(PLAYERS[0].spriteFront),
            pos(width() / 2, height() / 2),
            anchor("center"),
            scale(1),
            rotate(-90), // Player faces up
            area(),
        ]);

        // Manual Touch Handling for Portrait Mode
        let dest = player.pos.clone();
        let sceneStartTime = time(); // For debounce

        function handleTouch(e) {
            // Debounce: Ignore touches for first 0.5s to prevent immediate exit from menu click
            if (time() - sceneStartTime < 0.5) return;

            e.preventDefault();
            const touch = e.changedTouches[0];
            const canvas = document.querySelector("canvas");
            const rect = canvas.getBoundingClientRect();

            // Calculate Game Coordinates based on 90deg rotation
            const visualX = (touch.clientX - rect.left) / rect.width;
            const visualY = (touch.clientY - rect.top) / rect.height;

            const gameX = visualY * 1280;
            const gameY = (1 - visualX) * 720;
            const gamePos = vec2(gameX, gameY);

            // Check Exit Button (Box: 0..200, 20..80)
            if (gameX >= 0 && gameX <= 200 && gameY >= 20 && gameY <= 80) {
                go("menu");
                return;
            }

            // Move Player
            dest = gamePos;

            // Visual indicator
            add([
                circle(10),
                pos(gamePos),
                color(255, 0, 0),
                lifespan(0.5, { fade: 0.5 }),
                anchor("center"),
            ]);
        }

        window.addEventListener("touchstart", handleTouch, { passive: false });

        onUpdate(() => {
            player.pos = player.pos.lerp(dest, dt() * 5);
        });

        // Exit Button (Visual Only)
        add([
            rect(200, 60, { radius: 8 }),
            pos(100, 50),
            anchor("center"),
            color(200, 50, 50),
            rotate(-90),
            fixed(),
            area(), // Make it clickable if we used onClick, but we use manual handling
            z(100),
        ]);

        add([
            text("EXIT", { size: 24 }),
            pos(100, 50),
            anchor("center"),
            color(255, 255, 255),
            rotate(-90),
            fixed(),
            z(101),
        ]);

        // Clean up on leave
        // Clean up on leave
        onSceneLeave(() => {
            window.removeEventListener("touchstart", handleTouch);
            window.MOBILE_PORTRAIT_MODE = false;
            document.body.classList.remove("allow-portrait");
            if (window.fitCanvas) window.fitCanvas();
            else try { window.dispatchEvent(new Event("resize")); } catch (e) { }
        });
    });
}
