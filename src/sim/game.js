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

            // Player hitbox radius (25% of tile size, matching local game area)
            const playerRadius = SIM_CONSTANTS.TILE_SIZE * 0.25;

            // Offset collision center downward (like local game's area offset)
            // This allows head to get closer to blocks above, feet further from blocks below
            const collisionOffsetY = SIM_CONSTANTS.TILE_SIZE * 0.15;

            // AABB Collision Check - test all four corners with offset
            const canMoveX = checkAABBWalkable(state, newX, player.pos.y + collisionOffsetY, playerRadius);
            const canMoveY = checkAABBWalkable(state, player.pos.x, newY + collisionOffsetY, playerRadius);

            // Apply movement if no collision
            if (canMoveX) {
                player.pos.x = newX;

                // Snap to lane when moving horizontally
                if (player.intent.dx !== 0) {
                    const tileCenterY = Math.floor(player.pos.y / SIM_CONSTANTS.TILE_SIZE) * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2;
                    if (Math.abs(player.pos.y - tileCenterY) < 8) { // Match local game SNAP_THRESHOLD
                        player.pos.y = tileCenterY;
                    }
                }
            }

            if (canMoveY) {
                player.pos.y = newY;

                // Snap to lane when moving vertically
                if (player.intent.dy !== 0) {
                    const tileCenterX = Math.floor(player.pos.x / SIM_CONSTANTS.TILE_SIZE) * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2;
                    if (Math.abs(player.pos.x - tileCenterX) < 8) { // Match local game SNAP_THRESHOLD
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

    // 4. Check Powerup Collisions
    state.powerups.forEach(powerup => {
        state.players.forEach(player => {
            if (!player.alive) return;

            const playerGridPos = toGrid(player.pos.x, player.pos.y);

            if (playerGridPos.x === powerup.gridX && playerGridPos.y === powerup.gridY) {
                // Apply powerup effect
                applyPowerup(player, powerup.type);
                powerup.collected = true;
                console.log(`[SERVER] Player ${player.id} collected ${powerup.type} powerup`);
            }
        });
    });

    // Remove collected powerups
    state.powerups = state.powerups.filter(p => !p.collected);

    // 5. Tick Explosions
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
            console.log(`[SERVER] Brain placed at (${gridPos.x}, ${gridPos.y}), timer: ${brain.timer}s, range: ${brain.range}`);
        } else {
            console.log(`[SERVER] Brain already exists at (${gridPos.x}, ${gridPos.y})`);
        }
    } else {
        console.log(`[SERVER] Player maxed out brains: ${player.brainsPlaced}/${player.brainCount}`);
    }
}

function explodeBrain(state, brain) {
    brain.exploded = true;
    const owner = state.players.find(p => p.id === brain.ownerId);
    if (owner) owner.brainsPlaced--;

    console.log(`[SERVER] Brain exploding at (${brain.gridX}, ${brain.gridY}), range: ${brain.range}`);

    // Calculate explosion cells in 4 directions (cross pattern)
    const explosionCells = calculateExplosionCells(state, brain.gridX, brain.gridY, brain.range);

    // Destroy destructible blocks
    destroyBlocksInExplosion(state, explosionCells);

    // Damage players in explosion radius
    damagePlayersInExplosion(state, explosionCells);

    // Trigger chain reactions (other brains in radius)
    triggerChainReactions(state, explosionCells);

    // Add explosion visualization data with cells for flame rendering
    state.explosions.push({
        x: brain.gridX,
        y: brain.gridY,
        range: brain.range,
        timestamp: state.time,
        cells: explosionCells
    });
}

/**
 * Calculate which grid cells are affected by explosion
 * Expands in 4 directions until hitting a wall or reaching range limit
 */
function calculateExplosionCells(state, centerX, centerY, range) {
    const cells = [{ x: centerX, y: centerY }]; // Always include center

    // Direction vectors: up, down, left, right
    const directions = [
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }, // left
        { dx: 1, dy: 0 }   // right
    ];

    directions.forEach(dir => {
        for (let i = 1; i <= range; i++) {
            const x = centerX + dir.dx * i;
            const y = centerY + dir.dy * i;

            // Stop at grid boundaries
            if (x < 0 || x >= SIM_CONSTANTS.GRID_WIDTH || y < 0 || y >= SIM_CONSTANTS.GRID_HEIGHT) {
                break;
            }

            const cell = state.grid[y][x];

            // Add this cell to explosion
            cells.push({ x, y });

            // Stop if we hit a solid wall (not destructible blocks)
            if (cell.type === "wall" && !cell.destructible) {
                break;
            }

            // Stop if we hit a destructible block (but include it in explosion)
            if (cell.type === "block" && cell.destructible) {
                break;
            }
        }
    });

    return cells;
}

/**
 * Destroy destructible blocks in explosion cells
 */
function destroyBlocksInExplosion(state, cells) {
    cells.forEach(({ x, y }) => {
        const cell = state.grid[y][x];
        if (cell.type === "block" && cell.destructible) {
            // Destroy the block
            state.grid[y][x] = { type: "empty", solid: false };

            // 50% chance to spawn powerup (same as local game)
            if (Math.random() > 0.5) {
                spawnPowerup(state, x, y);
            }
        }
    });
}

/**
 * Spawn a powerup at grid position
 */
function spawnPowerup(state, gridX, gridY) {
    // Weighted powerup types (same as local game)
    const types = [
        { type: "brain", weight: 30 },
        { type: "fire", weight: 30 },
        { type: "speed", weight: 25 },
        { type: "kick", weight: 10 },
        { type: "skull", weight: 5 },
    ];

    // Weighted random selection
    const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    let powerupType = types[0].type;

    for (const t of types) {
        random -= t.weight;
        if (random <= 0) {
            powerupType = t.type;
            break;
        }
    }

    // Add powerup to state
    const powerup = {
        id: `powerup_${Date.now()}_${Math.random()}`,
        gridX,
        gridY,
        type: powerupType,
        timestamp: state.time
    };

    if (!state.powerups) {
        state.powerups = [];
    }
    state.powerups.push(powerup);
    console.log(`[SERVER] Powerup spawned: ${powerupType} at (${gridX}, ${gridY})`);
}

/**
 * Damage/kill players in explosion cells
 */
function damagePlayersInExplosion(state, cells) {
    state.players.forEach(player => {
        if (!player.alive) return;

        // Get player's grid position
        const playerGridPos = toGrid(player.pos.x, player.pos.y);

        // Check if player is in any explosion cell
        const inExplosion = cells.some(cell =>
            cell.x === playerGridPos.x && cell.y === playerGridPos.y
        );

        if (inExplosion) {
            player.alive = false;
        }
    });
}

/**
 * Trigger chain reactions - explode other brains in explosion radius
 */
function triggerChainReactions(state, cells) {
    const brainsToExplode = [];

    // Find brains in explosion cells
    state.brains.forEach(brain => {
        if (brain.exploded) return; // Skip already exploded brains

        const inExplosion = cells.some(cell =>
            cell.x === brain.gridX && cell.y === brain.gridY
        );

        if (inExplosion) {
            brainsToExplode.push(brain);
        }
    });

    // Explode them (recursive chain reactions!)
    brainsToExplode.forEach(brain => {
        explodeBrain(state, brain);
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
