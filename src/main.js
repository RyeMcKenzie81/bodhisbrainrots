import kaboom from "kaboom";
import { loadAssets } from "./assets.js";
import { initMenuScenes } from "./scenes/menu.js";
import { initGameScene } from "./scenes/game.js";
import { initGameOverScene } from "./scenes/gameover.js";

// Initialize Kaboom
const k = kaboom({
  width: 960,
  height: 744,
  background: [30, 30, 50],
  scale: 1,
});

// Load all assets
loadAssets();

// Initialize Scenes
import { initLobbyScene } from "./scenes/lobby.js";
import { initOnlineGameScene } from "./scenes/onlineGame.js";

// Initialize Scenes
initMenuScenes();
initGameScene();
initGameOverScene();
initLobbyScene();
initOnlineGameScene();

// Start the game
go("menu");
