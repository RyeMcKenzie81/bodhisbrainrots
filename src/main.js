import kaboom from "kaboom";
import "kaboom/global";
import { loadAssets } from "./assets.js";
import { initGameScene } from "./scenes/game.js";
import { initGameOverScene } from "./scenes/gameover.js";
import { initMenuScenes } from "./scenes/menu.js";
import { initLobbyScene } from "./scenes/lobby.js";
import { initOnlineGameScene } from "./scenes/onlineGame.js";

// Debug Logger for Mobile
const debugEl = document.getElementById("debug-overlay");
if (debugEl) {
    window.onerror = (msg, url, line, col, error) => {
        debugEl.innerText += `\n[ERROR] ${msg} (${line}:${col})\n`;
        return false;
    };
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => {
        // originalLog(...args); // Keep console working
        // debugEl.innerText += `[LOG] ${args.join(" ")}\n`; // Optional: spammy
    };
    console.error = (...args) => {
        originalError(...args);
        debugEl.innerText += `[CONSOLE_ERROR] ${args.join(" ")}\n`;
    };
}

// Initialize Kaboom
const k = kaboom({
    width: 960,
    height: 744,
    background: [30, 30, 50],
    scale: 1, // Standard scale, let browser resize the canvas element
    debug: true,
    letterbox: true, // Maintain aspect ratio with black bars
    touchToMouse: true, // Maps touch events to mouse events
});

// FORCE CANVAS SCALING FOR MOBILE
// Kaboom sometimes sets explicit pixel width/height on the canvas styled
// We want to override this to ensure it fits the window.
function resizeCanvas() {
    const canvas = document.querySelector("canvas");
    if (canvas) {
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.maxWidth = "100vw";
        canvas.style.maxHeight = "100vh";
        canvas.style.objectFit = "contain";
        canvas.style.position = "absolute";
        canvas.style.top = "50%";
        canvas.style.left = "50%";
        canvas.style.transform = "translate(-50%, -50%)";
    }
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);
// Call repeatedly for safety during load
setTimeout(resizeCanvas, 100);
setTimeout(resizeCanvas, 500);
setTimeout(resizeCanvas, 2000);

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
