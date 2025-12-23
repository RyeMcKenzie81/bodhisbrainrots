import { SIM_CONSTANTS } from "./state.js";
import { isWalkable, toGrid, toWorld } from "./grid.js";

/**
 * Apply a player Input to the game state.
 * @param {object} gameState 
 * @param {string} playerId 
 * @param {object} input { seq, dir: "up"|"down"|"left"|"right"|null, dropBrain: boolean }
 */
export function applyInput(gameState, playerId, input) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || !player.alive) return;

    // 1. Handle Movement
    if (input.dir) {
        let dx = 0;
        let dy = 0;
        if (input.dir === "up") dy = -1;
        if (input.dir === "down") dy = 1;
        if (input.dir === "left") dx = -1;
        if (input.dir === "right") dx = 1;

        // Calculate potential new position
        // Ideally we use dt here, but inputs might come more frequent.
        // For MVP, applyInput just sets INTENT, and tick() applies physics.
        // OR we apply pure movement here if we trust the input rate.
        // Better: Update player's "velocity" or "intent" based on input.
        player.intent = { dx, dy };
        player.facing = input.dir;
        player.isMoving = true;
    } else {
        player.intent = { dx: 0, dy: 0 };
        player.isMoving = false;
    }

    // 2. Handle Brain Drop
    if (input.dropBrain) {
        attemptDropBrain(gameState, player);
    }

    player.lastInputSeq = input.seq;
}

/**
 * Main simulation tick.
 * @param {object} state 
 * @param {number} dt Delta time in seconds
 */
export function tick(state, dt) {
    state.time += dt;

    // 1. Move Players
    state.players.forEach(player => {
        if (!player.alive) return;

        if (player.intent && (player.intent.dx !== 0 || player.intent.dy !== 0)) {
            const moveAmt = SIM_CONSTANTS.PLAYER_SPEED * dt;
            let newX = player.pos.x + player.intent.dx * moveAmt;
            let newY = player.pos.y + player.intent.dy * moveAmt;

            // Player hitbox radius (30% of tile size)
            const playerRadius = SIM_CONSTANTS.TILE_SIZE * 0.3;

            // AABB Collision Check - test all four corners
            const canMoveX = checkAABBWalkable(state, newX, player.pos.y, playerRadius);
            const canMoveY = checkAABBWalkable(state, player.pos.x, newY, playerRadius);

            // Apply movement if no collision
            if (canMoveX) {
                player.pos.x = newX;

                // Snap to lane when moving horizontally
                if (player.intent.dx !== 0) {
                    const tileCenterY = Math.floor(player.pos.y / SIM_CONSTANTS.TILE_SIZE) * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2;
                    if (Math.abs(player.pos.y - tileCenterY) < 10) {
                        player.pos.y = tileCenterY;
                    }
                }
            }

            if (canMoveY) {
                player.pos.y = newY;

                // Snap to lane when moving vertically
                if (player.intent.dy !== 0) {
                    const tileCenterX = Math.floor(player.pos.x / SIM_CONSTANTS.TILE_SIZE) * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2;
                    if (Math.abs(player.pos.x - tileCenterX) < 10) {
                        player.pos.x = tileCenterX;
                    }
                }
            }
        }
    });

    // 2. Tick Brains
    state.brains.forEach(brain => {
        brain.timer -= dt;
        if (brain.timer <= 0 && !brain.exploded) {
            explodeBrain(state, brain);
        }
    });

    // 3. Remove Exploded Brains
    state.brains = state.brains.filter(b => !b.exploded);

    // 4. Tick Explosions
    // (TODO: Implement explosion duration and removal)
}

function attemptDropBrain(state, player) {
    if (player.brainsPlaced < player.brainCount) {
        const gridPos = toGrid(player.pos.x, player.pos.y);

        // Check if brain already exists here
        const existing = state.brains.find(b => b.gridX === gridPos.x && b.gridY === gridPos.y);
        if (!existing) {
            const brain = {
                id: `brain_${Date.now()}_${Math.random()}`,
                ownerId: player.id,
                gridX: gridPos.x,
                gridY: gridPos.y,
                timer: SIM_CONSTANTS.BRAIN_TIMER,
                range: player.fireRange,
                solid: false // Initially not solid until walked off
            };
            state.brains.push(brain);
            player.brainsPlaced++;
        }
    }
}

function explodeBrain(state, brain) {
    brain.exploded = true;
    const owner = state.players.find(p => p.id === brain.ownerId);
    if (owner) owner.brainsPlaced--;

    // Add explosion event/object to state for rendering
    // TODO: Calculate blast radius and destroy blocks
    state.explosions.push({
        x: brain.gridX,
        y: brain.gridY,
        range: brain.range,
        timestamp: state.time
    });
}

/**
 * Check if player can move to position with AABB collision
 */
function checkAABBWalkable(state, x, y, radius) {
    // Check all four corners of the player's bounding box
    const corners = [
        { x: x - radius, y: y - radius }, // Top-left
        { x: x + radius, y: y - radius }, // Top-right
        { x: x - radius, y: y + radius }, // Bottom-left
        { x: x + radius, y: y + radius }, // Bottom-right
    ];

    for (const corner of corners) {
        const gridPos = toGrid(corner.x, corner.y);
        if (!isWalkable(state, gridPos.x, gridPos.y)) {
            return false; // Collision detected
        }
    }
    return true; // No collision
}
