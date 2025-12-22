import { TILE_SIZE, PLAYERS, START_POSITIONS } from "../constants.js";
import { gameState } from "../state.js";
import { placeBrain } from "./brain.js";

// Spawn a player
export function spawnPlayer(playerIndex, characterIndex) {
    const character = PLAYERS[characterIndex];  // Character appearance
    const controls = PLAYERS[playerIndex];       // Controls for this player slot
    const startPos = START_POSITIONS[playerIndex];

    const player = add([
        sprite(character.spriteAnim),
        pos(startPos.x * TILE_SIZE + TILE_SIZE / 2, startPos.y * TILE_SIZE + TILE_SIZE / 2),
        anchor("center"),
        scale(0.25),  // Adjusted for 256x256 frames
        area({ scale: 0.6, offset: vec2(0, 10) }),
        body(),
        z(startPos.y), // Initial Z
        "player",
        {
            playerIndex,
            characterIndex,
            speed: 200,
            brainCount: 1,
            brainsPlaced: 0,
            fireRange: 2,
            alive: true,
            name: character.name,
            spriteFront: character.spriteFront,
            spriteBack: character.spriteBack,
            spriteAnim: character.spriteAnim,
            facing: "down",
            isMoving: false,
            canKick: false,  // For kick powerup
            cursed: false,   // For skull curse
            curseType: null,
        },
    ]);

    // Start with idle animation
    player.play("idle_down");

    // Name tag above player
    // Player colors (hardcoded for now, or move to constants)
    const playerColors = [
        rgb(255, 200, 50),   // P1 - Yellow
        rgb(100, 150, 255),  // P2 - Blue
        rgb(255, 100, 150),  // P3 - Pink
        rgb(100, 255, 150),  // P4 - Green
    ];

    const nameTag = add([
        text(`P${playerIndex + 1}`, { size: 12 }),
        pos(player.pos.x, player.pos.y - 40),
        anchor("center"),
        color(playerColors[playerIndex]),
        z(12),
        "nametag",
        { owner: player },
    ]);

    // Update name tag position to follow player
    nameTag.onUpdate(() => {
        if (player.exists() && player.alive) {
            nameTag.pos.x = player.pos.x;
            nameTag.pos.y = player.pos.y - 40;
        } else {
            destroy(nameTag);
        }
    });

    // Movement controls with lane locking (classic Bomberman style)
    const keys = controls.keys;
    const SNAP_THRESHOLD = 8; // How close to center before we snap

    // Helper: get the grid-aligned center position
    function getGridCenter() {
        const gridX = Math.round((player.pos.x - TILE_SIZE / 2) / TILE_SIZE);
        const gridY = Math.round((player.pos.y - TILE_SIZE / 2) / TILE_SIZE);
        return {
            x: gridX * TILE_SIZE + TILE_SIZE / 2,
            y: gridY * TILE_SIZE + TILE_SIZE / 2,
        };
    }

    // Snap to lane when moving - locks you to grid lines
    function snapToLane(axis) {
        const center = getGridCenter();
        if (axis === "x") {
            // Snap X position to grid center (for vertical movement)
            const diff = center.x - player.pos.x;
            if (Math.abs(diff) > SNAP_THRESHOLD) {
                player.move(Math.sign(diff) * player.speed * 0.8, 0);
            } else {
                player.pos.x = center.x;
            }
        } else {
            // Snap Y position to grid center (for horizontal movement)
            const diff = center.y - player.pos.y;
            if (Math.abs(diff) > SNAP_THRESHOLD) {
                player.move(0, Math.sign(diff) * player.speed * 0.8);
            } else {
                player.pos.y = center.y;
            }
        }
    }

    onKeyDown(keys.up, () => {
        if (player.alive && gameState.gameStarted) {
            player.move(0, -player.speed);
            snapToLane("x"); // Lock to vertical lane
            if (player.facing !== "up" || !player.isMoving) {
                player.facing = "up";
                player.isMoving = true;
                player.flipX = false;
                player.play("walk_up");
            }
        }
    });
    onKeyDown(keys.down, () => {
        if (player.alive && gameState.gameStarted) {
            player.move(0, player.speed);
            snapToLane("x"); // Lock to vertical lane
            if (player.facing !== "down" || !player.isMoving) {
                player.facing = "down";
                player.isMoving = true;
                player.flipX = false;
                player.play("walk_down");
            }
        }
    });
    onKeyDown(keys.left, () => {
        if (player.alive && gameState.gameStarted) {
            player.move(-player.speed, 0);
            snapToLane("y"); // Lock to horizontal lane
            if (player.facing !== "left" || !player.isMoving) {
                player.facing = "left";
                player.isMoving = true;
                player.flipX = false;  // Don't flip - use left animation
                player.play("walk_left");
            }
        }
    });
    onKeyDown(keys.right, () => {
        if (player.alive && gameState.gameStarted) {
            player.move(player.speed, 0);
            snapToLane("y"); // Lock to horizontal lane
            if (player.facing !== "right" || !player.isMoving) {
                player.facing = "right";
                player.isMoving = true;
                player.flipX = false;  // Don't flip - use right animation
                player.play("walk_right");
            }
        }
    });

    // Stop walking animation when keys are released
    onKeyRelease(keys.up, () => {
        if (player.alive && player.facing === "up") {
            player.isMoving = false;
            player.play("idle_up");
        }
    });
    onKeyRelease(keys.down, () => {
        if (player.alive && player.facing === "down") {
            player.isMoving = false;
            player.play("idle_down");
        }
    });
    onKeyRelease(keys.left, () => {
        if (player.alive && player.facing === "left") {
            player.isMoving = false;
            player.play("idle_left");
        }
    });
    onKeyRelease(keys.right, () => {
        if (player.alive && player.facing === "right") {
            player.isMoving = false;
            player.play("idle_right");
        }
    });

    // Brain placement
    onKeyPress(keys.bomb, () => {
        if (player.alive && gameState.gameStarted && player.brainsPlaced < player.brainCount) {
            placeBrain(player);
        }
    });

    // Dynamic Z-ordering for Player
    player.onUpdate(() => {
        player.z = player.pos.y / TILE_SIZE;
    });

    gameState.players.push(player);
    return player;
}
