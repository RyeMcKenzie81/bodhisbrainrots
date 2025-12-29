import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, START_POSITIONS } from "../constants.js";
import { getGridPos } from "../utils/grid.js";

// Destroy a block and maybe spawn powerup
export function destroyBlock(block) {
    const gx = Math.round((block.pos.x - TILE_SIZE / 2) / TILE_SIZE);
    const gy = Math.round((block.pos.y - TILE_SIZE / 2) / TILE_SIZE);

    if (block.hasPowerup) {
        spawnPowerup(gx, gy);
    }
    destroy(block);
}

// Spawn a powerup
export function spawnPowerup(gridX, gridY) {
    // Weighted powerup types - kick and skull are rarer
    const types = [
        { type: "brain", sprite: "powerup_bomb", weight: 30 },
        { type: "fire", sprite: "powerup_fire", weight: 30 },
        { type: "speed", sprite: "powerup_speed", weight: 25 },
        { type: "kick", sprite: null, weight: 10 },   // No sprite - use text
        { type: "skull", sprite: null, weight: 5 },   // No sprite - use text (curse!)
        { type: "67", sprite: "powerup_67", weight: 2 },      // Rare (2%) - "67" Ring Explosion
    ];

    // Weighted random selection
    const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    let powerupType = types[0];
    for (const t of types) {
        random -= t.weight;
        if (random <= 0) {
            powerupType = t;
            break;
        }
    }

    const baseScale = (TILE_SIZE * 0.63) / 500;
    const baseX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const baseY = gridY * TILE_SIZE + TILE_SIZE / 2;

    // Create powerup - use sprite if available, otherwise use text/rect
    let pu;
    if (powerupType.sprite) {
        pu = add([
            sprite(powerupType.sprite),
            pos(baseX, baseY),
            anchor("center"),
            scale(baseScale),
            area({ scale: 0.7 }),
            opacity(1),
            z(gridY), // Match floor depth
            "powerup",
            {
                powerupType: powerupType.type,
                baseScale,
                baseX,
                baseY,
                jiggleOffset: Math.random() * Math.PI * 2,
            },
        ]);
    } else {
        // Text-based powerup for kick and skull
        const puColors = {
            kick: rgb(100, 200, 255),   // Cyan for kick
            skull: rgb(150, 50, 200),   // Purple for skull (danger!)
            "67": rgb(255, 215, 0),     // Gold for 67
        };
        const puLabels = {
            kick: "KICK",
            skull: "SKULL",
            "67": "67",
        };

        // We create a container for text powerups
        pu = add([
            rect(40, 40),
            pos(baseX, baseY),
            anchor("center"),
            color(puColors[powerupType.type] || rgb(255, 255, 255)),
            opacity(0.8),
            scale(1),
            area({ scale: 0.8 }),
            z(gridY),
            "powerup",
            {
                powerupType: powerupType.type,
                baseScale: 1,
                baseX,
                baseY,
                jiggleOffset: Math.random() * Math.PI * 2,
            }
        ]);
        // Add text child
        pu.add([
            text(puLabels[powerupType.type] || "?", { size: 14 }),
            anchor("center"),
            color(0, 0, 0),
        ]);
    }

    // Jiggling animation
    pu.onUpdate(() => {
        const t = time() * 5 + pu.jiggleOffset;
        if (pu.powerupType === "skull" || pu.powerupType === "kick") {
            // Pulse scale for box items
            const pulse = 1 + Math.sin(t) * 0.1;
            pu.scale = vec2(pulse);
        } else {
            // Bounce Y for sprite items
            pu.pos.y = pu.baseY + Math.sin(t) * 3;
        }
    });
}

// Create the grid level
export function createLevel() {
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            // Floor tile
            add([
                rect(TILE_SIZE - 2, TILE_SIZE - 2, { radius: 2 }),
                pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
                anchor("center"),
                color(40, 40, 60),
                z(-1),
            ]);

            // Walls on edges and grid pattern
            if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
                add([
                    sprite("diamondblock"),
                    pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
                    anchor("center"),
                    scale((TILE_SIZE * 0.85) / 400),
                    color(120, 120, 140), // Slightly blue-ish tint to distinguish from pillars
                    area({ scale: 0.9 }),
                    body({ isStatic: true }),
                    z(y),
                    "wall",
                ]);
            }
            // Indestructible pillars (every other tile) - diamond blocks
            else if (x % 2 === 0 && y % 2 === 0) {
                add([
                    sprite("diamondblock"),
                    pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
                    anchor("center"),
                    scale((TILE_SIZE * 0.85) / 400),  // 85% of tile, accounting for image padding
                    area({ scale: 0.9 }),
                    body({ isStatic: true }),
                    z(y),  // Z-order based on Y position
                    "wall",
                ]);
            }
            // Destructible blocks (random, but not in corners where players spawn) - wood blocks
            else if (!isSpawnZone(x, y) && Math.random() > 0.35) {
                add([
                    sprite("woodblock"),
                    pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
                    anchor("center"),
                    scale((TILE_SIZE * 0.85) / 400),  // 85% of tile, accounting for image padding
                    area({ scale: 0.9 }),
                    body({ isStatic: true }),
                    z(y),  // Z-order based on Y position
                    "block",
                    { hasPowerup: Math.random() > 0.5 },
                ]);
            }
        }
    }
}

// Check if position is in a spawn zone
function isSpawnZone(x, y) {
    for (const sp of START_POSITIONS) {
        if (Math.abs(x - sp.x) <= 1 && Math.abs(y - sp.y) <= 1) {
            return true;
        }
    }
    return false;
}
