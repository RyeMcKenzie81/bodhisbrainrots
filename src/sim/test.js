import { createGameState, SIM_CONSTANTS } from "./state.js";
import { tick, applyInput } from "./game.js";

console.log("Running Headless Simulation Test...");

// 1. Create Game
const state = createGameState("test_seed");
console.log("State Created:", state ? "OK" : "FAIL");

// 2. Add a dummy player
const player = {
    id: "p1",
    pos: { x: 100, y: 100 }, // Start somewhere valid
    alive: true,
    brainCount: 1,
    brainsPlaced: 0,
    fireRange: 2,
    speed: SIM_CONSTANTS.PLAYER_SPEED,
    intent: { dx: 0, dy: 0 }
};
state.players.push(player);

// 3. Simulate Input (Move Right)
console.log(`Initial Pos: (${player.pos.x}, ${player.pos.y})`);
applyInput(state, "p1", { seq: 1, dir: "right" });

// 4. Tick Forward 1 second
const dt = 1.0;
tick(state, dt);

console.log(`Pos after 1s Right @ ${SIM_CONSTANTS.PLAYER_SPEED}px/s: (${player.pos.x}, ${player.pos.y})`);

// Expected X = 100 + 300 * 1 = 400
if (Math.abs(player.pos.x - 400) < 5) {
    console.log("Movement Test: PASS");
} else {
    console.log("Movement Test: FAIL");
}

// 5. Simulate Brain Drop
applyInput(state, "p1", { seq: 2, dropBrain: true });
tick(state, 0.1);

if (state.brains.length === 1) {
    console.log("Brain Drop Test: PASS");
} else {
    console.log("Brain Drop Test: FAIL");
}

console.log("Test Complete.");
