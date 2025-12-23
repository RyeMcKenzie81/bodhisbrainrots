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
