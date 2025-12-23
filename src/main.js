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
    // scale: 1, // Allow auto-scaling with letterbox
    debug: true,
    letterbox: true,
    touchToMouse: true, // Maps touch events to mouse events (for clicks)
});

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
