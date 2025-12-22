import { TILE_SIZE, BRAIN_TIMER, EXPLOSION_DURATION } from "../constants.js";
import { getGridPos } from "../utils/grid.js";
import { destroyBlock } from "./environment.js";

// Place a brain
export function placeBrain(player) {
    const gridX = Math.round((player.pos.x - TILE_SIZE / 2) / TILE_SIZE);
    const gridY = Math.round((player.pos.y - TILE_SIZE / 2) / TILE_SIZE);

    // Check if there's already a brain here
    for (const brain of get("brain")) {
        const brainGridX = Math.round((brain.pos.x - TILE_SIZE / 2) / TILE_SIZE);
        const brainGridY = Math.round((brain.pos.y - TILE_SIZE / 2) / TILE_SIZE);
        if (brainGridX === gridX && brainGridY === gridY) return;
    }

    player.brainsPlaced++;

    // Create the brain!
    const brain = add([
        sprite("brainbomb"),
        pos(gridX * TILE_SIZE + TILE_SIZE / 2, gridY * TILE_SIZE + TILE_SIZE / 2),
        anchor("center"),
        scale(0.05),
        area({ scale: 0.9 }), // Tighter collision for brains
        z(gridY), // Match grid row depth
        "brain",
        "passable",  // Tag to mark brain as currently passable
        {
            owner: player,
            range: player.fireRange,
            gridX,
            gridY,
            baseScale: 0.05,
            solid: false, // Track if brain has become solid yet
            isKicked: false,
            kickDirection: null,
            kickSpeed: 300,
            timer: BRAIN_TIMER,
        },
    ]);

    // Pulsing animation + check if owner has left + handle kicks
    brain.onUpdate(() => {
        const pulse = 1 + Math.sin(time() * 8) * 0.15;
        brain.scale = vec2(brain.baseScale * pulse);

        // Update Z if kicked
        if (brain.isKicked) {
            brain.z = brain.pos.y / TILE_SIZE;
        }

        // Handle kicked brain movement
        if (brain.isKicked && brain.kickDirection) {
            const dir = brain.kickDirection;
            const moveAmount = brain.kickSpeed * dt();

            // Calculate new position
            const newX = brain.pos.x + dir.dx * moveAmount;
            const newY = brain.pos.y + dir.dy * moveAmount;

            // Check if we'd hit something
            const targetGridX = Math.round((newX - TILE_SIZE / 2) / TILE_SIZE);
            const targetGridY = Math.round((newY - TILE_SIZE / 2) / TILE_SIZE);

            let blocked = false;

            // Check walls
            for (const wall of get("wall")) {
                const wallPos = getGridPos(wall);
                if (wallPos.x === targetGridX && wallPos.y === targetGridY) {
                    blocked = true;
                    break;
                }
            }

            // Check blocks
            if (!blocked) {
                for (const block of get("block")) {
                    const blockPos = getGridPos(block);
                    if (blockPos.x === targetGridX && blockPos.y === targetGridY) {
                        blocked = true;
                        break;
                    }
                }
            }

            // Check other brains
            if (!blocked) {
                for (const otherBrain of get("brain")) {
                    if (otherBrain !== brain) {
                        const otherPos = getGridPos(otherBrain);
                        if (otherPos.x === targetGridX && otherPos.y === targetGridY) {
                            blocked = true;
                            break;
                        }
                    }
                }
            }

            if (blocked) {
                // Stop at grid-aligned position
                brain.isKicked = false;
                brain.kickDirection = null;
                brain.gridX = Math.round((brain.pos.x - TILE_SIZE / 2) / TILE_SIZE);
                brain.gridY = Math.round((brain.pos.y - TILE_SIZE / 2) / TILE_SIZE);
                brain.pos.x = brain.gridX * TILE_SIZE + TILE_SIZE / 2;
                brain.pos.y = brain.gridY * TILE_SIZE + TILE_SIZE / 2;
            } else {
                // Keep moving
                brain.pos.x = newX;
                brain.pos.y = newY;
                brain.gridX = targetGridX;
                brain.gridY = targetGridY;
            }
        }

        // If brain isn't solid yet, check if owner has escaped
        if (!brain.solid && !brain.isKicked) {
            const ownerGridX = Math.round((brain.owner.pos.x - TILE_SIZE / 2) / TILE_SIZE);
            const ownerGridY = Math.round((brain.owner.pos.y - TILE_SIZE / 2) / TILE_SIZE);

            // Owner has left the brain tile - make it solid
            if (ownerGridX !== brain.gridX || ownerGridY !== brain.gridY) {
                brain.solid = true;
                brain.use(body({ isStatic: true }));
                brain.unuse("passable");
            }
        }

        // Update timer
        brain.timer -= dt();
        if (brain.timer <= 0) {
            explodeBrain(brain);
        }
    });
}

// Explode a brain
export function explodeBrain(brain) {
    if (!brain.exists()) return;

    const { gridX, gridY, range, owner } = brain;
    owner.brainsPlaced--;
    destroy(brain);

    // Create explosions in cross pattern
    createExplosion(gridX, gridY); // Center

    const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
    ];

    for (const dir of directions) {
        for (let i = 1; i <= range; i++) {
            const ex = gridX + dir.dx * i;
            const ey = gridY + dir.dy * i;

            // Check for walls
            let hitWall = false;
            for (const wall of get("wall")) {
                const wallGX = Math.round((wall.pos.x - TILE_SIZE / 2) / TILE_SIZE);
                const wallGY = Math.round((wall.pos.y - TILE_SIZE / 2) / TILE_SIZE);
                if (wallGX === ex && wallGY === ey) {
                    hitWall = true;
                    break;
                }
            }
            if (hitWall) break;

            // Check for blocks (destructible)
            let hitBlock = false;
            for (const block of get("block")) {
                const blockGX = Math.round((block.pos.x - TILE_SIZE / 2) / TILE_SIZE);
                const blockGY = Math.round((block.pos.y - TILE_SIZE / 2) / TILE_SIZE);
                if (blockGX === ex && blockGY === ey) {
                    hitBlock = true;
                    destroyBlock(block);
                    hitBlock = true; // Still break the loop
                    break;
                }
            }

            createExplosion(ex, ey, false);
            if (hitBlock) break;
        }
    }
}

// Create explosion effect at grid position
function createExplosion(gridX, gridY, playSound = true) {
    // Play random explosion sound and shake screen (only for center of explosion)
    if (playSound) {
        play(Math.random() > 0.5 ? "bomb1" : "bomb2", { volume: 0.6 });
        shake(8); // Screen shake on explosion!
    }

    const exp = add([
        sprite("brainboom"),
        pos(gridX * TILE_SIZE + TILE_SIZE / 2, gridY * TILE_SIZE + TILE_SIZE / 2),
        anchor("center"),
        scale(0.07),
        area({ scale: 0.5 }),
        opacity(1),
        z(15),
        "explosion",
        { gridX, gridY },
    ]);

    // Check for chain reaction with other brains
    for (const brain of get("brain")) {
        if (brain.gridX === gridX && brain.gridY === gridY) {
            wait(0.1, () => explodeBrain(brain));
        }
    }

    // Animate and fade
    exp.onUpdate(() => {
        exp.opacity -= dt() * 1.5;
    });

    // Destroy
    wait(EXPLOSION_DURATION, () => {
        destroy(exp);
    });
}
