import { TILE_SIZE, BOMB_TIMER, EXPLOSION_DURATION } from "../constants.js";
import { getGridPos } from "../utils/grid.js";
import { destroyBlock } from "./environment.js";

// Place a bomb
export function placeBomb(player) {
    const gridX = Math.round((player.pos.x - TILE_SIZE / 2) / TILE_SIZE);
    const gridY = Math.round((player.pos.y - TILE_SIZE / 2) / TILE_SIZE);

    // Check if there's already a bomb here
    for (const bomb of get("bomb")) {
        const bombGridX = Math.round((bomb.pos.x - TILE_SIZE / 2) / TILE_SIZE);
        const bombGridY = Math.round((bomb.pos.y - TILE_SIZE / 2) / TILE_SIZE);
        if (bombGridX === gridX && bombGridY === gridY) return;
    }

    player.bombsPlaced++;

    // Create the brain bomb!
    const bomb = add([
        sprite("brainbomb"),
        pos(gridX * TILE_SIZE + TILE_SIZE / 2, gridY * TILE_SIZE + TILE_SIZE / 2),
        anchor("center"),
        scale(0.05),
        area({ scale: 0.9 }), // Tighter collision for bombs
        z(gridY), // Match grid row depth
        "bomb",
        "فpassable",  // Tag to mark bomb as currently passable
        {
            owner: player,
            range: player.fireRange,
            gridX,
            gridY,
            baseScale: 0.05,
            solid: false, // Track if bomb has become solid yet
            isKicked: false,
            kickDirection: null,
            kickDirection: null,
            kickSpeed: 300,
            timer: BOMB_TIMER,
        },
    ]);

    // Pulsing animation + check if owner has left + handle kicks
    bomb.onUpdate(() => {
        const pulse = 1 + Math.sin(time() * 8) * 0.15;
        bomb.scale = vec2(bomb.baseScale * pulse);

        // Update Z if kicked
        if (bomb.isKicked) {
            bomb.z = bomb.pos.y / TILE_SIZE;
        }

        // Handle kicked bomb movement
        if (bomb.isKicked && bomb.kickDirection) {
            const dir = bomb.kickDirection;
            const moveAmount = bomb.kickSpeed * dt();

            // Calculate new position
            const newX = bomb.pos.x + dir.dx * moveAmount;
            const newY = bomb.pos.y + dir.dy * moveAmount;

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

            // Check other bombs
            if (!blocked) {
                for (const otherBomb of get("bomb")) {
                    if (otherBomb !== bomb) {
                        const otherPos = getGridPos(otherBomb);
                        if (otherPos.x === targetGridX && otherPos.y === targetGridY) {
                            blocked = true;
                            break;
                        }
                    }
                }
            }

            if (blocked) {
                // Stop at grid-aligned position
                bomb.isKicked = false;
                bomb.kickDirection = null;
                bomb.gridX = Math.round((bomb.pos.x - TILE_SIZE / 2) / TILE_SIZE);
                bomb.gridY = Math.round((bomb.pos.y - TILE_SIZE / 2) / TILE_SIZE);
                bomb.pos.x = bomb.gridX * TILE_SIZE + TILE_SIZE / 2;
                bomb.pos.y = bomb.gridY * TILE_SIZE + TILE_SIZE / 2;
            } else {
                // Keep moving
                bomb.pos.x = newX;
                bomb.pos.y = newY;
                bomb.gridX = targetGridX;
                bomb.gridY = targetGridY;
            }
        }

        // If bomb isn't solid yet, check if owner has escaped
        if (!bomb.solid && !bomb.isKicked) {
            const ownerGridX = Math.round((bomb.owner.pos.x - TILE_SIZE / 2) / TILE_SIZE);
            const ownerGridY = Math.round((bomb.owner.pos.y - TILE_SIZE / 2) / TILE_SIZE);

            // Owner has left the bomb tile - make it solid
            if (ownerGridX !== bomb.gridX || ownerGridY !== bomb.gridY) {
                bomb.solid = true;
                bomb.use(body({ isStatic: true }));
                bomb.unuse("فpassable");
            }
        }

        // Update timer
        bomb.timer -= dt();
        if (bomb.timer <= 0) {
            explodeBomb(bomb);
        }
    });
}

// Explode a bomb
export function explodeBomb(bomb) {
    if (!bomb.exists()) return;

    const { gridX, gridY, range, owner } = bomb;
    owner.bombsPlaced--;
    destroy(bomb);

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

    // Check for chain reaction with other bombs
    for (const bomb of get("bomb")) {
        if (bomb.gridX === gridX && bomb.gridY === gridY) {
            wait(0.1, () => explodeBomb(bomb));
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
