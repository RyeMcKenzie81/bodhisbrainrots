import { socket } from "../net/socket.js";
import { PLAYERS } from "../constants.js";
import { SIM_CONSTANTS } from "../sim/state.js";

export function initOnlineGameScene() {
    scene("onlineGame", ({ roomId, myPlayerId, players }) => {

        // 1. Setup Input map
        let seq = 0;

        // Setup static layers
        const keys = {
            up: ["w", "up"],
            down: ["s", "down"],
            left: ["a", "left"],
            right: ["d", "right"],
            bomb: ["space", "enter"],
        };

        // 2. Render Functions
        const playerMap = new Map(); // id -> gameObj
        const brainMap = new Map(); // id -> gameObj
        const explosionMap = new Map(); // id -> gameObj

        // Render Grid (Static for now, but really should be dynamic if blocks break)
        // We'll trust the snapshot for blocks if we want destructible environments
        let gridObjs = [];

        function renderGrid(gridState) {
            // Clear old grid if needed (optimization: only update changed cells)
            gridObjs.forEach(o => destroy(o));
            gridObjs = [];

            gridState.forEach((row, y) => {
                row.forEach((cell, x) => {
                    const posX = x * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2;
                    const posY = y * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2;

                    if (cell.type === "wall") {
                        // Indestructible walls
                        if (x % 2 === 0 && y % 2 === 0 && x !== 0 && x !== 14 && y !== 0 && y !== 12) {
                            gridObjs.push(add([
                                sprite("diamondblock"),
                                pos(posX, posY),
                                anchor("center"),
                                scale(0.12),
                            ]));
                        } else {
                            gridObjs.push(add([
                                sprite("woodblock"),
                                pos(posX, posY),
                                anchor("center"),
                                scale(0.12),
                            ]));
                        }
                    } else if (cell.type === "block") {
                        // Destructible blocks
                        gridObjs.push(add([
                            sprite("box"),
                            pos(posX, posY),
                            anchor("center"),
                            scale(0.12),
                        ]));
                    }
                });
            });
        }

        // Initial Grid Render (empty initially, wait for snapshot)

        socket.on("snapshot", (data) => {
            const state = data.state;

            // A. Render Grid (Lazy init)
            if (gridObjs.length === 0) {
                renderGrid(state.grid);
            }

            // B. Sync Players
            state.players.forEach(pState => {
                if (!pState.alive) {
                    if (playerMap.has(pState.id)) {
                        destroy(playerMap.get(pState.id));
                        playerMap.delete(pState.id);
                        play("die");
                    }
                    return;
                }

                let pObj = playerMap.get(pState.id);
                if (!pObj) {
                    // Create new player sprite
                    // Find character index from Lobby data
                    const lobbyPlayer = players.find(lp => lp.id === pState.id);
                    // Default to char 0 if simple setup
                    const charIdx = 0; // TODO: Pass char index in spawn info

                    pObj = add([
                        sprite(PLAYERS[charIdx].spriteFront),
                        pos(pState.pos.x, pState.pos.y),
                        anchor("center"),
                        scale(0.06),
                        z(10),
                    ]);
                    playerMap.set(pState.id, pObj);
                }

                // Interpolate / Update Position
                // For MVP: Snap directly
                pObj.pos.x = pState.pos.x;
                pObj.pos.y = pState.pos.y;

                // Animation State
                // (Can simply infer from movement or use state.facing)
            });

            // C. Sync Brains
            // Remove missing
            brainMap.forEach((obj, id) => {
                if (!state.brains.find(b => b.id === id)) {
                    destroy(obj);
                    brainMap.delete(id);
                }
            });

            // Add/Update
            state.brains.forEach(b => {
                if (!brainMap.has(b.id)) {
                    const obj = add([
                        sprite("brainbomb"),
                        pos(b.gridX * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2, b.gridY * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2),
                        anchor("center"),
                        scale(0.05),
                        { timer: 0 } // Visual timer
                    ]);

                    // Pulse animation
                    obj.onUpdate(() => {
                        obj.timer += dt();
                        const scaleMod = 0.05 + Math.sin(obj.timer * 10) * 0.005;
                        obj.scale = vec2(scaleMod);
                    });

                    brainMap.set(b.id, obj);
                    play("bomb1");
                }
            });

            // D. Explosions (Transient)
            // Track which explosions we've already rendered to prevent duplicates
            if (!window.renderedExplosions) {
                window.renderedExplosions = new Set();
            }

            state.explosions.forEach(exp => {
                // Create unique ID for this explosion
                const expId = `${exp.x}_${exp.y}_${Math.floor(exp.timestamp * 1000)}`;

                if (!window.renderedExplosions.has(expId)) {
                    window.renderedExplosions.add(expId);

                    // Spawn visual explosion
                    add([
                        sprite("brainboom"),
                        pos(exp.x * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2, exp.y * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2),
                        anchor("center"),
                        scale(0.25),
                        lifespan(0.5)
                    ]);
                    play("bomb2");

                    // Clean up tracking after lifespan
                    wait(0.6, () => {
                        window.renderedExplosions.delete(expId);
                    });
                }
            });
        });

        // 3. Input Loop
        onUpdate(() => {
            let dir = null;
            if (isKeyDown("w") || isKeyDown("up")) dir = "up";
            else if (isKeyDown("s") || isKeyDown("down")) dir = "down";
            else if (isKeyDown("a") || isKeyDown("left")) dir = "left";
            else if (isKeyDown("d") || isKeyDown("right")) dir = "right";

            const payload = {
                seq: seq++,
                input: {
                    seq: seq,
                    dir: dir,
                    dropBrain: isKeyPressed("space") || isKeyPressed("enter")
                }
            };

            // Only send if input changed or heartbeat?
            // MVP: Send every frame (15-60hz)
            socket.send("input", payload);
        });

        // Cleanup
        onSceneLeave(() => {
            // socket.off("snapshot");
        });
    });
}
