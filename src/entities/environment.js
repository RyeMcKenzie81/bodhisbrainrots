import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, START_POSITIONS } from "../constants.js";
import { getGridPos } from "../utils/grid.js";
import { gameState } from "../state.js";

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

    // Adjust base size assumption: standard powerups are 500x500, but 67 is 64x64
    // Also applying a boost to 67 because of transparent padding
    let sourceSize = 500;
    let visualFactor = 0.63;

    if (powerupType.type === "67") {
        sourceSize = 64;
        visualFactor = 1.1; // Boost scale to >100% to offset padding
    }

    const baseScale = (TILE_SIZE * visualFactor) / sourceSize;
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
    // Determine Theme based on Level
    // Level 1: Standard (Blue/Wood)
    // Level 2: Tropical (Sand/Palm/Bamboo)
    const isTropical = gameState.currentLevel === 2;

    const assets = {
        floorSprite: isTropical ? "floor_tropical" : null,
        floorColor: isTropical ? null : rgb(40, 40, 60),
        wallSprite: isTropical ? "wall_tropical" : "diamondblock",
        blockSprite: isTropical ? "block_tropical" : "woodblock",
        wallTint: isTropical ? rgb(255, 255, 255) : rgb(120, 120, 140),
    };

    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            // Floor tile
            if (assets.floorSprite) {
                add([
                    sprite(assets.floorSprite),
                    pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
                    anchor("center"),
                    scale(TILE_SIZE / 400), // 400x400 source -> 64x64
                    z(-1),
                ]);
            } else {
                add([
                    rect(TILE_SIZE - 2, TILE_SIZE - 2, { radius: 2 }),
                    pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
                    anchor("center"),
                    color(assets.floorColor),
                    z(-1),
                ]);
            }

            // Walls on edges and grid pattern
            if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
                add([
                    sprite(assets.wallSprite),
                    pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
                    anchor("center"),
                    scale((TILE_SIZE * 0.85) / 400),
                    color(assets.wallTint),
                    area({ scale: 0.9 }),
                    body({ isStatic: true }),
                    z(y),
                    "wall",
                ]);
            }
            // Indestructible pillars (every other tile)
            else if (x % 2 === 0 && y % 2 === 0) {
                add([
                    sprite(assets.wallSprite),
                    pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
                    anchor("center"),
                    scale((TILE_SIZE * 0.85) / 400),
                    area({ scale: 0.9 }),
                    body({ isStatic: true }),
                    z(y),  // Z-order based on Y position
                    "wall",
                ]);
            }
            // Destructible blocks
            else if (!isSpawnZone(x, y) && Math.random() > 0.35) {
                add([
                    sprite(assets.blockSprite),
                    pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
                    anchor("center"),
                    scale((TILE_SIZE * 0.85) / 400),
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
