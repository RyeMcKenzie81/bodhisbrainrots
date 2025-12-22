import { TILE_SIZE } from "../constants.js";

// Get grid position from pixel position
export function getGridPos(entity) {
    return {
        x: Math.round((entity.pos.x - TILE_SIZE / 2) / TILE_SIZE),
        y: Math.round((entity.pos.y - TILE_SIZE / 2) / TILE_SIZE)
    };
}

// Get pixel center from grid position
export function getPixelPos(gridX, gridY) {
    return {
        x: gridX * TILE_SIZE + TILE_SIZE / 2,
        y: gridY * TILE_SIZE + TILE_SIZE / 2
    };
}
