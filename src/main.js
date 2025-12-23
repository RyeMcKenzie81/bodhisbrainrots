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

// Initialize Kaboom with NATIVE scaling
// Let Kaboom handle all canvas sizing to keep coordinates consistent
const k = kaboom({
    width: 960,
    height: 744,
    background: [30, 30, 50],
    debug: true,
    letterbox: true, // Let Kaboom handle all scaling
    touchToMouse: true,
    pixelDensity: 1,
    stretch: true, // Fill the screen
    crisp: false, // Smooth scaling
});

// Note: We removed manual fitCanvas() and touch coordinate fixes.
// Kaboom's letterbox + stretch modes handle scaling correctly
// and keep touch coordinates aligned with game coordinates.

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
