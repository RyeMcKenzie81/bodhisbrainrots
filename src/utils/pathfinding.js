import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, EXPLOSION_DURATION } from "../constants.js";
import { getGridPos } from "./grid.js";

// Check if a grid cell is walkable (no walls, blocks, or solid bombs)
export function isWalkable(gridX, gridY) {
    // Check bounds
    if (gridX < 1 || gridX >= GRID_WIDTH - 1 || gridY < 1 || gridY >= GRID_HEIGHT - 1) {
        return false;
    }

    // Check walls
    for (const wall of get("wall")) {
        const wallPos = getGridPos(wall);
        if (wallPos.x === gridX && wallPos.y === gridY) return false;
    }

    // Check blocks
    for (const block of get("block")) {
        const blockPos = getGridPos(block);
        if (blockPos.x === gridX && blockPos.y === gridY) return false;
    }

    // Check solid brains
    for (const brain of get("brain")) {
        if (brain.solid) {
            const brainPos = getGridPos(brain);
            if (brainPos.x === gridX && brainPos.y === gridY) return false;
        }
    }

    return true;
}

// Get all grid positions that will explode soon (danger zones)
export function getExplosionDangerZones() {
    const dangerZones = [];

    for (const brain of get("brain")) {
        const brainPos = getGridPos(brain);
        dangerZones.push({ x: brainPos.x, y: brainPos.y });

        // Add explosion paths
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
        ];

        for (const dir of directions) {
            for (let i = 1; i <= brain.range; i++) {
                const ex = brainPos.x + dir.dx * i;
                const ey = brainPos.y + dir.dy * i;

                // Check for walls (explosion stops)
                let blocked = false;
                for (const wall of get("wall")) {
                    const wallPos = getGridPos(wall);
                    if (wallPos.x === ex && wallPos.y === ey) {
                        blocked = true;
                        break;
                    }
                }
                if (blocked) break;

                dangerZones.push({ x: ex, y: ey });

                // Check for blocks (explosion stops after hitting)
                for (const block of get("block")) {
                    const blockPos = getGridPos(block);
                    if (blockPos.x === ex && blockPos.y === ey) {
                        blocked = true;
                        break;
                    }
                }
                if (blocked) break;
            }
        }
    }


    // Include active explosions!
    for (const exp of get("explosion")) {
        dangerZones.push({ x: exp.gridX, y: exp.gridY });
    }

    return dangerZones;
}

// NEW: Predictive Danger Map (Heatmap of explosion times)
// Returns object: { "x,y": remainingSeconds }
export function getDangerMap(virtualBrains = []) {
    const map = {};
    const allBrains = [...get("brain"), ...virtualBrains];

    // Add current brains
    for (const brain of allBrains) {
        const remaining = brain.timer; // Seconds until explosion
        const brainPos = getGridPos(brain);

        const markDanger = (x, y, time) => {
            const key = `${x},${y}`;
            if (map[key] === undefined || time < map[key]) {
                map[key] = time;
            }
        };

        markDanger(brainPos.x, brainPos.y, remaining);

        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];

        for (const dir of directions) {
            for (let i = 1; i <= brain.range; i++) {
                const ex = brainPos.x + dir.dx * i;
                const ey = brainPos.y + dir.dy * i;

                let blocked = false;
                // Check walls
                for (const wall of get("wall")) {
                    const wp = getGridPos(wall);
                    if (wp.x === ex && wp.y === ey) { blocked = true; break; }
                }
                if (blocked) break;

                markDanger(ex, ey, remaining);

                // Check blocks (stops explosion)
                for (const block of get("block")) {
                    const bp = getGridPos(block);
                    if (bp.x === ex && bp.y === ey) { blocked = true; break; }
                }
                if (blocked) break;
            }
        }
    }


    // Add active explosions (immediate danger)
    for (const exp of get("explosion")) {
        const markDanger = (x, y, time) => {
            const key = `${x},${y}`;
            if (map[key] === undefined || time < map[key]) {
                map[key] = time;
            }
        };
        markDanger(exp.gridX, exp.gridY, 0);
    }

    return map;
}

// Check if position is in danger (Legacy wrapper)
export function isInDanger(gridX, gridY, dangerZones) {
    if (dangerZones) {
        return dangerZones.some(d => d.x === gridX && d.y === gridY);
    }
    return false;
}

// Verify if a path is safe given the danger map and AI speed
export function isPathSafe(path, dangerMap, aiSpeed = 100) {
    if (!path || path.length === 0) return true;

    for (let i = 0; i < path.length; i++) {
        const step = path[i];
        const key = `${step.x},${step.y}`;
        const dangerTime = dangerMap[key];

        if (dangerTime !== undefined) {
            // Estimated arrival time (tiles * size / speed)
            // i+1 because path[0] is the first step, not current pos
            // i+1 because path[0] is the first step, not current pos
            const arrivalTime = ((i + 1) * TILE_SIZE) / aiSpeed;
            const timeToCross = (TILE_SIZE / aiSpeed) * 1.5; // Add extra buffer for movement

            // Bomb danger window
            const boomStart = dangerTime;
            const boomEnd = dangerTime + EXPLOSION_DURATION;

            // Check overlap: Unsafe if we are there during explosion
            // We are there from [arrivalTime, arrivalTime + timeToCross]
            // Safe padding
            // prePadding: Time buffer BEFORE explosion (must leave by then)
            // postPadding: Time buffer AFTER explosion (must wait until then)
            const prePadding = 1.0;
            const postPadding = 2.0;

            // If we arrive and leave before it explodes: Safe
            if (arrivalTime + timeToCross + prePadding < boomStart) continue;

            // If we arrive after it finishes exploding: Safe
            if (arrivalTime > boomEnd + postPadding) continue;

            // Otherwise, RISK OF DEATH
            return false;
        }
    }
    return true;
}

// Simple BFS to find path to target
export function findPath(startX, startY, targetX, targetY, avoidDanger = true) {
    const dangerZones = avoidDanger ? getExplosionDangerZones() : [];
    const queue = [{ x: startX, y: startY, path: [] }];
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    const directions = [
        { dx: 0, dy: -1, dir: "up" },
        { dx: 0, dy: 1, dir: "down" },
        { dx: -1, dy: 0, dir: "left" },
        { dx: 1, dy: 0, dir: "right" },
    ];

    while (queue.length > 0) {
        const current = queue.shift();

        if (current.x === targetX && current.y === targetY) {
            return current.path;
        }

        for (const dir of directions) {
            const newX = current.x + dir.dx;
            const newY = current.y + dir.dy;
            const key = `${newX},${newY}`;

            if (!visited.has(key) && isWalkable(newX, newY)) {
                // Optionally avoid danger zones
                if (avoidDanger && isInDanger(newX, newY, dangerZones)) {
                    continue;
                }

                visited.add(key);
                queue.push({
                    x: newX,
                    y: newY,
                    path: [...current.path, { x: newX, y: newY, dir: dir.dir }]
                });
            }
        }
    }

    return null; // No path found
}

// Find nearest safe spot from current position
export function findSafeSpot(startX, startY, extraBrains = []) {
    const dangerMap = getDangerMap(extraBrains);

    // Helper to check if a spot is safe (undefined in dangerMap)
    const isSpotSafe = (x, y) => dangerMap[`${x},${y}`] === undefined;

    // If current spot is safe, stay there
    if (isSpotSafe(startX, startY)) {
        return { x: startX, y: startY };
    }

    // BFS to find nearest safe spot
    // We explore through ALL walkable tiles
    // But we only RETURN tiles that are TRULY safe (no danger at all)
    const queue = [{ x: startX, y: startY, dist: 0 }];
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
    ];

    while (queue.length > 0) {
        const current = queue.shift();

        for (const dir of directions) {
            const newX = current.x + dir.dx;
            const newY = current.y + dir.dy;
            const key = `${newX},${newY}`;

            if (visited.has(key)) continue;
            visited.add(key);

            if (!isWalkable(newX, newY)) continue;

            if (isSpotSafe(newX, newY)) {
                // Found a PERMANENTLY safe spot!
                return { x: newX, y: newY };
            }

            // Even if dangerous, add to queue so we can explore beyond
            queue.push({ x: newX, y: newY, dist: current.dist + 1 });
        }
    }

    return null; // No safe spot found
}
