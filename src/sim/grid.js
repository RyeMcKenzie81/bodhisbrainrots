import { SIM_CONSTANTS } from "./state.js";

/**
 * Converts world coordinates to grid coordinates.
 * @param {number} x 
 * @param {number} y 
 * @returns {object} {x, y} grid indices
 */
export function toGrid(x, y) {
    return {
        x: Math.floor(x / SIM_CONSTANTS.TILE_SIZE),
        y: Math.floor(y / SIM_CONSTANTS.TILE_SIZE),
    };
}

/**
 * Converts grid coordinates to world coordinates (center of tile).
 * @param {number} gx 
 * @param {number} gy 
 * @returns {object} {x, y} world position
 */
export function toWorld(gx, gy) {
    return {
        x: gx * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2,
        y: gy * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2,
    };
}

/**
 * Checks if a specific grid cell is walkable.
 * @param {object} gameState 
 * @param {number} gx 
 * @param {number} gy 
 * @returns {boolean}
 */
export function isWalkable(gameState, gx, gy) {
    // Bounds check
    if (gx < 0 || gx >= SIM_CONSTANTS.GRID_WIDTH || gy < 0 || gy >= SIM_CONSTANTS.GRID_HEIGHT) {
        return false;
    }

    // Check static grid (Walls/Blocks)
    const cell = gameState.grid[gy][gx];
    if (cell.type !== "empty") {
        return false;
    }

    // Check solid Brains
    // Note: In Bomberman, you can walk off a brain you just placed, but once you step off, it becomes solid.
    // For MVP simplicity, we might make them always solid or add that logic later.
    const brain = gameState.brains.find(b => b.gridX === gx && b.gridY === gy);
    if (brain && brain.solid) {
        return false;
    }

    return true;
}
