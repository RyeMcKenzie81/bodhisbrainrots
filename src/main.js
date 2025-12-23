import kaboom from "kaboom";
import "kaboom/global";
import { loadAssets } from "./assets.js";
import { initGameScene } from "./scenes/game.js";
import { initGameOverScene } from "./scenes/gameover.js";
import { initMenuScenes } from "./scenes/menu.js";
import { initLobbyScene } from "./scenes/lobby.js";
import { initOnlineGameScene } from "./scenes/onlineGame.js";

// Debug Logger for Mobile - Removed after verification
// Initialize Kaboom

// Initialize Kaboom
const k = kaboom({
    width: 960,
    height: 744,
    background: [30, 30, 50],
    // scale: 1,
    debug: true,
    letterbox: false, // Disable built-in scaler, using manual fitCanvas below
    touchToMouse: true,
    pixelDensity: 1,
});

// MANUAL RESIZE HANDLER FOR MOBILE
// Correctly fits the game's 960x744 resolution into the window 
// without distorting aspect ratio or breaking input coordinates.
function fitCanvas() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const gameWidth = 960;
    const gameHeight = 744;
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

window.addEventListener("resize", fitCanvas);
window.addEventListener("load", fitCanvas);
// Throttle resize
setInterval(fitCanvas, 500);

// GLOBAL TOUCH COORDINATE FIX
// Since we manually scale the canvas, Kaboom's built-in touch/mouse handling
// gets the wrong coordinates. We intercept touches, calculate correct game
// coords, and dispatch synthetic mouse events that Kaboom understands.
function setupTouchFix() {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
        setTimeout(setupTouchFix, 100);
        return;
    }

    function translateTouch(touch) {
        const rect = canvas.getBoundingClientRect();
        // Convert screen coords to game coords (960x744)
        const gameX = ((touch.clientX - rect.left) / rect.width) * 960;
        const gameY = ((touch.clientY - rect.top) / rect.height) * 744;
        return { x: gameX, y: gameY };
    }

    // Override Kaboom's internal mouse position on touch
    canvas.addEventListener("touchstart", (e) => {
        if (e.touches.length > 0) {
            const pos = translateTouch(e.touches[0]);
            // Kaboom uses mousePos() internally - we need to update it
            // The simplest way is to dispatch a mousemove + mousedown
            canvas.dispatchEvent(new MouseEvent("mousemove", {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY,
                bubbles: true
            }));
            canvas.dispatchEvent(new MouseEvent("mousedown", {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY,
                bubbles: true
            }));
        }
    }, { passive: true });

    canvas.addEventListener("touchend", (e) => {
        // Dispatch click at last touch position for onClick handlers
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            canvas.dispatchEvent(new MouseEvent("mouseup", {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true
            }));
            canvas.dispatchEvent(new MouseEvent("click", {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true
            }));
        }
    }, { passive: true });
}
setupTouchFix();

// Load all assets
loadAssets();

// Initialize Scenes
initMenuScenes();
initGameScene();
initGameOverScene();
initLobbyScene();
initOnlineGameScene();

// Start the game
// Use onLoad to be safe with asset loading
onLoad(() => {
    go("menu");
});
