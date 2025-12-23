export const SIM_CONSTANTS = {
    GRID_WIDTH: 15,
    GRID_HEIGHT: 13,
    TILE_SIZE: 64,
    BRAIN_TIMER: 3, // Seconds
    EXPLOSION_DURATION: 0.5,
    PLAYER_SPEED: 300,
    MAX_BRAINS: 1, // Default starting
    FIRE_RANGE: 1,  // Default starting
};

/**
 * Creates the initial game state.
 * @param {string} seed - Seed for deterministic RNG.
 * @returns {object} The initial game state.
 */
export function createGameState(seed) {
    return {
        step: 0,
        time: 0,
        seed: seed || Date.now().toString(),
        grid: createGrid(SIM_CONSTANTS.GRID_WIDTH, SIM_CONSTANTS.GRID_HEIGHT),
        players: [], // Array of Player objects
        brains: [],  // Array of active Brain objects
        explosions: [], // Array of active Explosion objects
        powerups: [], // Array of Powerup objects
        gameStarted: false,
        gameOver: false,
        winner: null,
    };
}

/**
 * Initializes a grid with walls and destructible blocks.
 */
function createGrid(width, height) {
    const grid = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            // Basic perimeter walls
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                row.push({ type: "wall", solid: true, destructible: false });
            } else if (x % 2 === 0 && y % 2 === 0) {
                // Hard blocks pattern (indestructible)
                row.push({ type: "wall", solid: true, destructible: false });
            } else {
                // Potentially add destructible blocks
                // Leave corners clear for player spawns (top-left, top-right, bottom-left, bottom-right)
                const isCornerSpawn =
                    (x <= 2 && y <= 2) ||           // Top-left
                    (x >= width - 3 && y <= 2) ||   // Top-right
                    (x <= 2 && y >= height - 3) ||  // Bottom-left
                    (x >= width - 3 && y >= height - 3); // Bottom-right

                if (!isCornerSpawn && Math.random() < 0.6) {
                    // 60% chance of destructible block
                    row.push({ type: "block", solid: true, destructible: true });
                } else {
                    row.push({ type: "empty", solid: false });
                }
            }
        }
        grid.push(row);
    }
    return grid;
}
