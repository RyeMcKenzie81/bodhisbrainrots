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

    // Log screen size on resize
    const logSize = () => {
        const c = document.querySelector("canvas");
        debugEl.innerText = `Screen: ${window.innerWidth}x${window.innerHeight}\nCanvas: ${c ? c.width : '?'}x${c ? c.height : '?'}\nStyle: ${c ? c.style.width : '?'}x${c ? c.style.height : '?'}\n` + debugEl.innerText.split('\n').slice(0, 5).join('\n');
    };
    window.addEventListener("resize", logSize);
    setTimeout(logSize, 1000);
}

// Initialize Kaboom
const k = kaboom({
    width: 960,
    height: 744,
    background: [30, 30, 50],
    scale: 1,
    debug: true,
    letterbox: true,
    touchToMouse: true,
    pixelDensity: 1, // Disable retina scaling to simplify mobile mobile dims
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
