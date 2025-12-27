import kaboom from "kaboom";
import "kaboom/global";
import { loadAssets } from "./assets.js";
import { initGameScene } from "./scenes/game.js";
import { initGameOverScene } from "./scenes/gameover.js";
import { initMenuScenes } from "./scenes/menu.js";
import { initLobbyScene } from "./scenes/lobby.js";
import { initOnlineGameScene } from "./scenes/onlineGame.js";
import { initMobileTestScene } from "./scenes/mobileTest.js";

// Debug Logger for Mobile - Removed after verification
// Initialize Kaboom

// Initialize Kaboom (16:9 Aspect Ratio)
const k = kaboom({
    width: 1280,
    height: 720,
    background: [30, 30, 50],
    // scale: 1,
    debug: true,
    letterbox: false, // Disable built-in scaler, using manual fitCanvas below
    touchToMouse: true,
    pixelDensity: 1,
    loadingScreen: false, // Custom loading screen below
});

// Global flag for Portrait Mode Prototype
window.MOBILE_PORTRAIT_MODE = false;

// MANUAL RESIZE HANDLER FOR MOBILE
// Correctly fits the game's 1280x720 resolution into the window 
// without distorting aspect ratio or breaking input coordinates.
function fitCanvas() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    // Check if we are in portrait mode rotato-town
    if (window.MOBILE_PORTRAIT_MODE) {
        document.body.classList.add("allow-portrait");
        canvas.style.transform = "rotate(90deg)"; // Rotate 90 CW

        // In rotated mode:
        // Game width (1280) runs along Window Height
        // Game height (720) runs along Window Width
        const gameWidth = 1280;
        const gameHeight = 720;
        const gameRatio = gameWidth / gameHeight; // ~1.77

        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        // The 'visual' aspect ratio we are trying to fill is effectively inverted
        // We want 1280 px of game to fit into winHeight
        // We want 720 px of game to fit into winWidth

        // Constraint: Does Height fit in Width?
        // Rotated Ratio = 720 / 1280 = 0.5625 (Aspect ratio of the rotated rect)

        // Let's just fit "GameHeight" into "WindowWidth" and "GameWidth" into "WindowHeight"

        const scaleX = winWidth / gameHeight;
        const scaleY = winHeight / gameWidth;
        const scale = Math.min(scaleX, scaleY);

        const fittedWidth = gameWidth * scale;
        const fittedHeight = gameHeight * scale;

        // Apply size (Canvas internal size is still 1280x720, we style the element)
        // But since we rotate, width controls vertical size? No, transform rotates the coordinate system.
        // If we have a 100x50 box and rotate 90deg, it occupies 50x100 space visually.
        // So we need to set the CSS width/height such that when rotated it fits.
        // Actually, CSS width applies to the pre-transformed element.

        canvas.style.width = `${fittedWidth}px`;
        canvas.style.height = `${fittedHeight}px`;

        // Center it. 
        // Bounding rect is rotated.
        // Top/Left calculation is tricky with rotation center. 
        // Easiest is to center via flex or grid on body, but we are using absolute/fixed positioning.
        // Let's assume transform-origin is center.
        canvas.style.transformOrigin = "center center";
        canvas.style.top = `${(winHeight - fittedHeight) / 2}px`;
        canvas.style.left = `${(winWidth - fittedWidth) / 2}px`;

    } else {
        document.body.classList.remove("allow-portrait");
        canvas.style.transform = "none";

        const gameWidth = 1280;
        const gameHeight = 720;
        const gameRatio = gameWidth / gameHeight;

        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const winRatio = winWidth / winHeight;

        if (winRatio > gameRatio) {
            // Window is wider than game -> limit by HEIGHT
            const newHeight = winHeight;
            const newWidth = newHeight * gameRatio;
            canvas.style.height = `${newHeight}px`;
            canvas.style.width = `${newWidth}px`;
        } else {
            // Window is taller than game -> limit by WIDTH
            const newWidth = winWidth;
            const newHeight = newWidth / gameRatio;
            canvas.style.width = `${newWidth}px`;
            canvas.style.height = `${newHeight}px`;
        }

        // Explicitly center manually since we are using position: fixed
        canvas.style.top = `${(winHeight - parseFloat(canvas.style.height)) / 2}px`;
        canvas.style.left = `${(winWidth - parseFloat(canvas.style.width)) / 2}px`;
    }
}
window.fitCanvas = fitCanvas;

window.addEventListener("resize", fitCanvas);
window.addEventListener("load", fitCanvas);
// Throttle resize
setInterval(fitCanvas, 500);

// GLOBAL TOUCH COORDINATE FIX
// Since we manually scale the canvas, Kaboom's built-in touch/mouse handling
// gets the wrong coordinates. We intercept touches, calculate correct game
// coords, and dispatch synthetic mouse events that Kaboom understands.
// Load all assets
loadAssets();

// GLOBAL TOUCH COORDINATE FIX RE-IMPLEMENTATION
// Required because manual CSS scaling confuses Kaboom's native input.
function setupTouchFix() {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
        setTimeout(setupTouchFix, 100);
        return;
    }

    function dispatchSafeMouseEvent(type, clientX, clientY) {
        if (!isFinite(clientX) || !isFinite(clientY)) return;

        // CRITICAL: Round to integers to prevent browser errors
        const safeX = Math.round(clientX);
        const safeY = Math.round(clientY);

        try {
            // Minimal event properties
            const evt = new MouseEvent(type, {
                clientX: safeX,
                clientY: safeY,
                bubbles: true,
                cancelable: true,
                view: window
            });
            canvas.dispatchEvent(evt);
        } catch (e) {
            // Silent catch to prevent UI blocking alerts
            // console.warn("Input fix failed:", e);
        }
    }

    function handleTouch(e) {
        // Do NOT run this fix in Portrait Mode (it handles itself now)
        if (window.MOBILE_PORTRAIT_MODE) return;

        // Prevent default browser/Kaboom handling to avoid duplicates
        // e.preventDefault(); // Warning: might block scrolling/other behavior? 
        // We act on 'passive: false' ideally but 'touchstart' is passive by default.

        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();

            // Standard Mode Scaling Logic
            // We want to map Touch Visual Pos -> Game Coordinate -> Synthetic Mouse Visual Pos
            // Actually, for Standard Mode, we just want to ensure coordinates are mapped via the Canvas Rect correctly.
            // If Kaboom uses (Client - Left) / Width...
            // And we produce a MouseEvent with the SAME ClientX...
            // Then Kaboom does the same math.

            // WAIT. If Kaboom is wrong natively, it's because it uses the wrong Scale or Rect?
            // If we provide a mouse event with calculated Game Coordinates?
            // Kaboom takes Mouse Event -> Transforms to Game.

            // The original issue was likely that Kaboom didn't account for the CSS scaling vs Internal resolution correctly.
            // So we need to Provide a ClientX that calculates to the Correct GameX.

            const gameX = ((touch.clientX - rect.left) / rect.width) * 1280;
            const gameY = ((touch.clientY - rect.top) / rect.height) * 720;

            // Now reverse-engineer a "Perfect" ClientX that Kaboom will like.
            // Kaboom: mousePos = (Client - Rect.left) ...
            // If we give it a synthetic event, it uses the current Rect.
            // So SyntheticClientX = (GameX / 1280) * Rect.Width + Rect.Left

            const fakeClientX = (gameX / 1280) * rect.width + rect.left;
            const fakeClientY = (gameY / 720) * rect.height + rect.top;

            // Pass the touch type as mouse type
            let mouseType = "";
            if (e.type === "touchstart") mouseType = "mousedown";
            if (e.type === "touchmove") mouseType = "mousemove";
            if (e.type === "touchend") mouseType = "mouseup";

            dispatchSafeMouseEvent(mouseType, fakeClientX, fakeClientY);

            // For click simulation
            if (e.type === "touchend") {
                dispatchSafeMouseEvent("click", fakeClientX, fakeClientY);
            }
        }
    }

    canvas.addEventListener("touchstart", handleTouch, { passive: true });
    canvas.addEventListener("touchmove", handleTouch, { passive: true });
    canvas.addEventListener("touchend", handleTouch, { passive: true });
}
setupTouchFix();

// Initialize Scenes
initMenuScenes();
initGameScene();
initGameOverScene();
initLobbyScene();
initOnlineGameScene();
initMobileTestScene();

// Custom Loading Screen
onDraw(() => {
    if (loadProgress() < 1) {
        // Background
        drawRect({
            width: width(),
            height: height(),
            pos: vec2(0, 0),
            color: rgb(20, 20, 30),
        });

        // Title
        drawText({
            text: "BoDawg's Brainrots",
            pos: vec2(width() / 2, height() / 2 - 60),
            anchor: "center",
            size: 48,
            font: "monospace", // Or default
            color: rgb(255, 255, 0),
        });

        // Loading Text
        drawText({
            text: "LOADING",
            pos: vec2(width() / 2, height() / 2 + 10),
            anchor: "center",
            size: 24,
            color: rgb(200, 200, 200),
        });

        // Bar Background
        const barW = 400;
        const barH = 20;
        drawRect({
            width: barW,
            height: barH,
            pos: vec2(width() / 2, height() / 2 + 50),
            anchor: "center",
            color: rgb(50, 50, 50),
            outline: { color: rgb(255, 255, 255), width: 2 },
        });

        // Bar Fill
        drawRect({
            width: barW * loadProgress(),
            height: barH,
            pos: vec2(width() / 2 - barW / 2, height() / 2 + 50 - barH / 2),
            anchor: "topleft",
            color: rgb(255, 255, 0),
        });
    }
});

// Start the game
// Use onLoad to be safe with asset loading
onLoad(() => {
    go("menu");
});
