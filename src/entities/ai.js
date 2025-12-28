
import { TILE_SIZE, BRAIN_TIMER, PLAYERS, START_POSITIONS } from "../constants.js";
import { getGridPos } from "../utils/grid.js";
import { gameState } from "../state.js";
import {
    isWalkable,
    getExplosionDangerZones,
    isInDanger,
    findSafeSpot,
    findPath,
    getDangerMap,
    isPathSafe
} from "../utils/pathfinding.js";
import { placeBrain } from "./brain.js";

// Spawn an AI Player (LAYER 3: THE BOMBER)
export function spawnAIPlayer(playerIndex, characterIndex, difficulty) {
    const character = PLAYERS[characterIndex];
    const startPos = START_POSITIONS[playerIndex];
    const isBoss = difficulty === "BOSS";

    const ai = add([
        sprite(isBoss ? "boss_cappuccino" : character.spriteAnim),
        pos(startPos.x * TILE_SIZE + TILE_SIZE / 2, startPos.y * TILE_SIZE + TILE_SIZE / 2),
        anchor("center"),
        scale(0.25),
        area({ scale: 0.6, offset: vec2(0, 10) }),
        body(),
        z(startPos.y),
        "player",
        "ai",
        {
            playerIndex,
            characterIndex,
            speed: isBoss ? 220 : 170, // Faster boss
            brainCount: isBoss ? 5 : 1,
            brainsPlaced: 0,
            fireRange: isBoss ? 6 : 2,
            alive: true,
            name: isBoss ? "Cappuccino Clownino" : (character.name + " (CPU)"),
            spriteFront: isBoss ? "boss_cappuccino" : character.spriteFront,
            spriteBack: isBoss ? "boss_cappuccino" : character.spriteBack,
            spriteAnim: isBoss ? undefined : character.spriteAnim,
            facing: "down",
            isMoving: false,
            isAI: true,
            moveDirection: null,
            timer: 0,
            currentAction: "wander", // wander | flee | attack
            lastPos: vec2(0, 0),
            stuckTimer: 0,
            difficulty: difficulty, // Store it
        },
    ]);

    if (difficulty === "BOSS") {
        // ai.use(color(255, 100, 100)); // REMOVED TINT for Cappuccino
        ai.use(scale(0.35)); // Larger (base was 0.25)
    }

    if (!isBoss) ai.play("idle_down");

    // Name tag
    const aiNameTag = add([
        text(difficulty === "BOSS" ? "BOSS" : `CPU${playerIndex} `, { size: 12 }),
        pos(ai.pos.x, ai.pos.y - 40),
        anchor("center"),
        color(difficulty === "BOSS" ? rgb(255, 50, 50) : rgb(100, 200, 255)),
        z(12),
        "nametag",
        { owner: ai },
    ]);

    aiNameTag.onUpdate(() => {
        if (ai.exists() && ai.alive) {
            aiNameTag.pos.x = ai.pos.x;
            aiNameTag.pos.y = ai.pos.y - 40;
        } else {
            destroy(aiNameTag);
        }
    });

    // AI Loop
    ai.onUpdate(() => {
        if (!ai.alive || !gameState.gameStarted) return;

        // stuck check
        checkStuck(ai);

        // LAYER 2: SURVIVAL
        // Priority 1: Check if we are in danger
        const myPos = getGridPos(ai);
        const dangerZones = getExplosionDangerZones();
        const amInDanger = isInDanger(myPos.x, myPos.y, dangerZones);

        if (amInDanger) {
            ai.currentAction = "flee";
            // Find nearest safe spot
            const safeSpot = findSafeSpot(myPos.x, myPos.y);
            if (safeSpot) {
                const path = findPath(myPos.x, myPos.y, safeSpot.x, safeSpot.y, false); // false = don't strictly avoid danger on the way out, just GO
                if (path && path.length > 0) {
                    executeMove(ai, path[0].dir);
                    ai.moveDirection = path[0].dir; // sticky direction
                    return; // Done for this frame
                }
            }
        }

        // LAYER 3: ATTACK
        // If safe, consider dropping a brain
        else if (ai.brainsPlaced < ai.brainCount) {
            // Simple logic: Drop brain if we are next to a breakable block or a player
            if (shouldDropBrain(ai)) {
                // CRITICAL SAFETY CHECK:
                // Simulate if we drop a brain here, can we escape?
                const sim = canSmartBrain(ai, myPos.x, myPos.y);
                if (sim.safe) {
                    placeBrain(ai);
                    // Immediately switch to fleeing logic next frame naturally
                    // But we can also set direction to escapeDir right now
                    executeMove(ai, sim.escapeDir);
                    ai.moveDirection = sim.escapeDir;
                    return;
                }
            }
            ai.currentAction = "wander";
        } else {
            ai.currentAction = "wander";
        }

        // LAYER 4: HUNT STRATEGY (Hard/BOSS Mode)
        // If we are currently wandering, try to hunt the nearest player
        if ((ai.difficulty === "hard" || ai.difficulty === "BOSS") && ai.currentAction === "wander") {
            const targetPos = findNearestEnemy(ai, myPos.x, myPos.y);
            if (targetPos) {
                // Try to find a safe path to the enemy
                const path = findPathToAdjacent(myPos.x, myPos.y, targetPos.x, targetPos.y);
                if (path && path.length > 0) {
                    executeMove(ai, path[0].dir);
                    ai.moveDirection = path[0].dir;
                    ai.currentAction = "hunt"; // Semantic state (behaves like wander but focused)
                    return;
                }
            }
        }

        // LAYER 1: PURE RANDOM WANDER (Modified for Safety)
        // If we have no direction, or we are stopped, pick a new random safe direction
        // ALSO: If our current move takes us INTO danger, cancel it.

        // 1. Check if current direction is leading us into doom
        // (Skip this check if we are already fleeing an immediate danger, as our pathfinder knows best)
        if (ai.moveDirection && ai.currentAction !== "flee") {
            if (willWalkIntoDanger(ai, ai.moveDirection, dangerZones)) {
                ai.moveDirection = null; // Stop!
                ai.isMoving = false;
            }
        }

        // 2. Pick new direction if needed
        if (!ai.moveDirection) {
            ai.moveDirection = pickRandomSafeDirection(ai, dangerZones);
        }

        // Execute Move
        if (ai.moveDirection) {
            executeMove(ai, ai.moveDirection);
        }

        // Z-ordering
        ai.z = ai.pos.y / TILE_SIZE;
    });

    gameState.players.push(ai);
    return ai;
}

function shouldDropBrain(ai) {
    // 5% Chance per frame to check (don't spam check)
    if (Math.random() > 0.05) return false;

    const myPos = getGridPos(ai);
    const neighbors = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];

    // Check for nearby blocks or players
    for (const n of neighbors) {
        const tx = myPos.x + n.dx;
        const ty = myPos.y + n.dy;

        // Check blocks
        for (const b of get("block")) {
            const bp = getGridPos(b);
            if (bp.x === tx && bp.y === ty) return true;
        }

        // Check players
        for (const p of gameState.players) {
            if (p !== ai && p.alive) {
                const pp = getGridPos(p);
                if (pp.x === tx && pp.y === ty) return true;
            }
        }
    }
    return false;
}

// Simulation: If I drop a brain at (x,y), can I escape?
function canSmartBrain(ai, gridX, gridY) {
    const virtualBrain = {
        pos: vec2(gridX * TILE_SIZE + TILE_SIZE / 2, gridY * TILE_SIZE + TILE_SIZE / 2),
        range: ai.fireRange,
        timer: BRAIN_TIMER
    };

    // 1. Where is the nearest safe spot considering this NEW brain?
    const safeTarget = findSafeSpot(gridX, gridY, [virtualBrain]);
    if (!safeTarget) return { safe: false };

    // 2. Can I get there?
    // We must find a path that is safe considering the new brain AND existing brains
    const path = findPath(gridX, gridY, safeTarget.x, safeTarget.y, false); // false = use isPathSafe check manually below
    if (!path || path.length === 0) return { safe: false };

    // 3. Is that path actually safe in time?
    const dangerMap = getDangerMap([virtualBrain]);
    const isSafe = isPathSafe(path, dangerMap, ai.speed);

    return { safe: isSafe, escapeDir: path[0].dir };
}

function willWalkIntoDanger(ai, direction, dangerZones) {
    // Only check this if we are near the center of a tile and about to cross into a new one
    if (isAtCenter(ai)) {
        const myPos = getGridPos(ai);
        let dx = 0, dy = 0;
        if (direction === "up") dy = -1;
        if (direction === "down") dy = 1;
        if (direction === "left") dx = -1;
        if (direction === "right") dx = 1;

        // If the NEXT tile is dangerous, don't go there.
        if (isInDanger(myPos.x + dx, myPos.y + dy, dangerZones)) {
            return true;
        }
    }
    return false;
}

function pickRandomSafeDirection(ai, dangerZones = []) {
    const myPos = getGridPos(ai);
    const directions = ["up", "down", "left", "right"];
    // Shuffle directions to be truly random
    for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    for (const dir of directions) {
        let dx = 0, dy = 0;
        if (dir === "up") dy = -1;
        if (dir === "down") dy = 1;
        if (dir === "left") dx = -1;
        if (dir === "right") dx = 1;

        const nextX = myPos.x + dx;
        const nextY = myPos.y + dy;

        // Must be walkable AND not a danger zone
        if (isWalkable(nextX, nextY) && !isInDanger(nextX, nextY, dangerZones)) {
            return dir;
        }
    }
    return null; // Stuck?
}

function checkStuck(ai) {
    if (ai.isMoving) {
        if (ai.pos.dist(ai.lastPos) < 2) {
            ai.stuckTimer += dt();
            if (ai.stuckTimer > 0.2) {
                // We are stuck!
                ai.moveDirection = null;
                ai.isMoving = false;
                ai.stuckTimer = 0;
                // Force a random new direction direction immediately
                const dangerZones = getExplosionDangerZones();
                ai.moveDirection = pickRandomSafeDirection(ai, dangerZones);
            }
        } else {
            ai.stuckTimer = 0;
            ai.lastPos = ai.pos.clone();
        }
    } else {
        ai.stuckTimer = 0;
        ai.lastPos = ai.pos.clone();
    }
}

// Helpers
function findNearestPowerup(startX, startY) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const pu of get("powerup")) {
        const puPos = getGridPos(pu);
        const dist = Math.abs(puPos.x - startX) + Math.abs(puPos.y - startY);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = puPos;
        }
    }
    return nearest;
}

function findNearestEnemy(ai, startX, startY) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const p of gameState.players) {
        if (p !== ai && p.alive) {
            const pPos = getGridPos(p);
            const dist = Math.abs(pPos.x - startX) + Math.abs(pPos.y - startY);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = pPos;
            }
        }
    }
    return nearest;
}

function findNearestBlock(startX, startY) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const block of get("block")) {
        const blockPos = getGridPos(block);
        const dist = Math.abs(blockPos.x - startX) + Math.abs(blockPos.y - startY);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = blockPos;
        }
    }
    return nearest;
}

function findPathToAdjacent(startX, startY, targetX, targetY) {
    // We want to go to a tile NEXT to the target, not ON the target
    const neighbors = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
    let bestPath = null;
    let bestLen = Infinity;

    for (const n of neighbors) {
        const tx = targetX + n.dx;
        const ty = targetY + n.dy;
        if (isWalkable(tx, ty)) {
            const path = findPath(startX, startY, tx, ty);
            if (path && path.length < bestLen) {
                bestLen = path.length;
                bestPath = path;
            }
        }
    }
    return bestPath;
}

// Execute movement
function executeMove(ai, direction) {
    const speed = ai.speed;
    const myPos = getGridPos(ai);

    // Check if we are about to hit a wall in our current direction
    // If so, stop immediately so we can pick a new direction next frame
    let dx = 0, dy = 0;
    if (direction === "up") dy = -1;
    if (direction === "down") dy = 1;
    if (direction === "left") dx = -1;
    if (direction === "right") dx = 1;

    // Look ahead 0.1s to see if we will hit a wall
    // Actually, simpler: Is the target tile still walkable?
    // If we are moving slightly past center, check the NEXT tile
    // For now, let's just move. If we hit a wall, physics might stop us, or we check center.

    // Better logic for grid movement:
    // If we are centered on a tile, check if the NEXT tile is valid.
    // If not, stop.

    if (isAtCenter(ai)) {
        if (!isWalkable(myPos.x + dx, myPos.y + dy)) {
            ai.moveDirection = null; // Stop, pick new dir next frame
            ai.isMoving = false;
            return;
        }
    }

    switch (direction) {
        case "up":
            ai.move(0, -speed);
            snapAIToLane(ai, "x");
            setFacing(ai, "up");
            break;
        case "down":
            ai.move(0, speed);
            snapAIToLane(ai, "x");
            setFacing(ai, "down");
            break;
        case "left":
            ai.move(-speed, 0);
            snapAIToLane(ai, "y");
            setFacing(ai, "left");
            break;
        case "right":
            ai.move(speed, 0);
            snapAIToLane(ai, "y");
            setFacing(ai, "right");
            break;
    }
}

function setFacing(ai, dir) {
    if (ai.facing !== dir || !ai.isMoving) {
        ai.facing = dir;
        ai.isMoving = true;
        if (ai.difficulty !== "BOSS") {
            ai.play("walk_" + dir);
        }
    }
}

function isAtCenter(ai) {
    const SNAP = 4;
    const gridX = Math.round((ai.pos.x - TILE_SIZE / 2) / TILE_SIZE);
    const gridY = Math.round((ai.pos.y - TILE_SIZE / 2) / TILE_SIZE);
    const centerX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = gridY * TILE_SIZE + TILE_SIZE / 2;
    return Math.abs(ai.pos.x - centerX) < SNAP && Math.abs(ai.pos.y - centerY) < SNAP;
}

function snapAIToLane(ai, axis) {
    const SNAP_THRESHOLD = 8;
    const gridX = Math.round((ai.pos.x - TILE_SIZE / 2) / TILE_SIZE);
    const gridY = Math.round((ai.pos.y - TILE_SIZE / 2) / TILE_SIZE);
    const centerX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = gridY * TILE_SIZE + TILE_SIZE / 2;

    if (axis === "x") {
        const diff = centerX - ai.pos.x;
        if (Math.abs(diff) > SNAP_THRESHOLD) {
            ai.move(Math.sign(diff) * ai.speed * 0.8, 0);
        } else {
            ai.pos.x = centerX;
        }
    } else {
        const diff = centerY - ai.pos.y;
        if (Math.abs(diff) > SNAP_THRESHOLD) {
            ai.move(0, Math.sign(diff) * ai.speed * 0.8);
        } else {
            ai.pos.y = centerY;
        }
    }
}
