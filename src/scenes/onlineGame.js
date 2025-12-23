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
            // Clear old grid if needed
            gridObjs.forEach(o => destroy(o));
            gridObjs = [];

            console.log("[DEBUG] Rendering grid:", gridState.length, "rows");

            gridState.forEach((row, y) => {
                row.forEach((cell, x) => {
                    const posX = x * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2;
                    const posY = y * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2;

                    // Always render floor tile first
                    gridObjs.push(add([
                        rect(SIM_CONSTANTS.TILE_SIZE - 2, SIM_CONSTANTS.TILE_SIZE - 2, { radius: 2 }),
                        pos(posX, posY),
                        anchor("center"),
                        color(40, 40, 60),
                        z(-1),
                    ]));

                    // Then render blocks/walls on top
                    if (cell.type === "wall") {
                        // Check if this is a perimeter wall (edge of grid)
                        const isPerimeter = (x === 0 || x === SIM_CONSTANTS.GRID_WIDTH - 1 || y === 0 || y === SIM_CONSTANTS.GRID_HEIGHT - 1);

                        // Check if this is an interior diamond block position (even x and y, not on perimeter)
                        const isDiamondBlock = !isPerimeter && (x % 2 === 0 && y % 2 === 0);

                        if (isDiamondBlock) {
                            gridObjs.push(add([
                                sprite("diamondblock"),
                                pos(posX, posY),
                                anchor("center"),
                                scale(0.12),
                            ]));
                        } else if (isPerimeter) {
                            // Perimeter walls use gray rect (like local game)
                            gridObjs.push(add([
                                rect(SIM_CONSTANTS.TILE_SIZE - 2, SIM_CONSTANTS.TILE_SIZE - 2, { radius: 4 }),
                                pos(posX, posY),
                                anchor("center"),
                                color(80, 80, 100),
                                z(y),
                            ]));
                        } else {
                            // Interior walls use woodblock
                            gridObjs.push(add([
                                sprite("woodblock"),
                                pos(posX, posY),
                                anchor("center"),
                                scale(0.12),
                            ]));
                        }
                    } else if (cell.type === "block") {
                        // Destructible blocks - use woodblock sprite like local game
                        gridObjs.push(add([
                            sprite("woodblock"),
                            pos(posX, posY),
                            anchor("center"),
                            scale(0.12),
                        ]));
                    }
                });
            });

            console.log("[DEBUG] Rendered", gridObjs.length, "grid objects");
        }

        // Initial Grid Render (empty initially, wait for snapshot)

        socket.on("snapshot", (data) => {
            const state = data.state;

            console.log("[DEBUG] Snapshot received - Grid:", state.grid?.length, "Players:", state.players?.length, "Brains:", state.brains?.length);

            // A. Render Grid (Lazy init)
            if (gridObjs.length === 0) {
                console.log("[DEBUG] First snapshot - initializing grid");
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
                    // Create new player sprite with animation
                    const lobbyPlayer = players.find(lp => lp.id === pState.id);
                    const charIdx = 0; // TODO: Pass char index in spawn info

                    pObj = add([
                        sprite(PLAYERS[charIdx].spriteAnim, { anim: "idle_down" }),
                        pos(pState.pos.x, pState.pos.y),
                        anchor("center"),
                        scale(0.25), // Match local game scale exactly
                        z(10),
                        { characterIndex: charIdx, prevFacing: "down", prevMoving: false }
                    ]);
                    playerMap.set(pState.id, pObj);
                }

                // Update Position
                pObj.pos.x = pState.pos.x;
                pObj.pos.y = pState.pos.y;

                // Update z-order based on y position (so player renders correctly behind/in front of blocks)
                pObj.z = Math.floor(pState.pos.y / SIM_CONSTANTS.TILE_SIZE);

                // Update Animation based on movement state
                const isMoving = pState.isMoving || false;
                const facing = pState.facing || "down";

                // Only change animation if state changed
                if (isMoving !== pObj.prevMoving || facing !== pObj.prevFacing) {
                    const animName = isMoving ? `walk_${facing}` : `idle_${facing}`;
                    try {
                        pObj.play(animName);
                    } catch (e) {
                        // Animation might not exist, ignore
                    }
                    pObj.prevMoving = isMoving;
                    pObj.prevFacing = facing;
                }
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

                    // Don't clean up - explosion should only render once EVER
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

            // Send input to server
            socket.send("input", payload);
        });

        // ============ MOBILE CONTROLS ============
        function createTouchControls() {
            // Only create touch controls on touch-capable devices
            const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            if (!isTouchDevice) {
                console.log("[DEBUG] Desktop device detected - skipping touch controls");
                return;
            }

            const canvas = document.querySelector("canvas");
            if (!canvas) return;

            const dpadBaseX = 140;
            const dpadBaseY = height() - 250;

            const dPad = add([
                pos(dpadBaseX, dpadBaseY),
                fixed(),
                z(200),
            ]);

            const buttons = [
                { dir: "up", x: 0, y: -90, txt: "▲" },
                { dir: "down", x: 0, y: 90, txt: "▼" },
                { dir: "left", x: -90, y: 0, txt: "◀" },
                { dir: "right", x: 90, y: 0, txt: "▶" },
            ];

            buttons.forEach(b => {
                b.vis = dPad.add([
                    circle(50),
                    pos(b.x, b.y),
                    anchor("center"),
                    color(255, 255, 255),
                    opacity(0.2),
                    fixed(),
                ]);
                dPad.add([
                    text(b.txt, { size: 40 }),
                    pos(b.x, b.y),
                    anchor("center"),
                    opacity(0.5),
                    fixed(),
                ]);
            });

            const actionBtnX = width() - 140;
            const actionBtnY = height() - 250;
            const actionBtnRadius = 70;
            const actionBtn = add([
                circle(actionBtnRadius),
                pos(actionBtnX, actionBtnY),
                anchor("center"),
                color(255, 50, 50),
                opacity(0.4),
                fixed(),
                z(200),
            ]);

            const activeTouches = new Map();
            let currentDir = null;

            function getGamePos(touch) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = 960 / rect.width;
                const scaleY = 744 / rect.height;
                return {
                    x: (touch.clientX - rect.left) * scaleX,
                    y: (touch.clientY - rect.top) * scaleY
                };
            }

            function handleTouch(touch, isEnd = false) {
                const pos = getGamePos(touch);
                let hitButton = null;

                buttons.forEach(b => {
                    const bx = dpadBaseX + b.x;
                    const by = dpadBaseY + b.y;
                    const dist = Math.sqrt((pos.x - bx) ** 2 + (pos.y - by) ** 2);
                    if (dist < 80) {
                        hitButton = b.dir;
                    }
                });

                const distAction = Math.sqrt((pos.x - actionBtnX) ** 2 + (pos.y - actionBtnY) ** 2);
                if (distAction < 100) {
                    hitButton = "action";
                }

                const prevButton = activeTouches.get(touch.identifier);

                if (isEnd || (hitButton !== prevButton)) {
                    if (prevButton) {
                        if (prevButton === "action") {
                            actionBtn.opacity = 0.4;
                        } else {
                            const btnObj = buttons.find(b => b.dir === prevButton);
                            if (btnObj) {
                                btnObj.vis.opacity = 0.2;
                                if (currentDir === prevButton) {
                                    currentDir = null;
                                }
                            }
                        }
                    }
                }

                if (!isEnd && hitButton) {
                    activeTouches.set(touch.identifier, hitButton);

                    if (hitButton === "action") {
                        actionBtn.opacity = 0.7;
                        if (hitButton !== prevButton) {
                            // Send drop brain input
                            socket.send("input", {
                                seq: seq++,
                                input: {
                                    seq: seq,
                                    dir: currentDir,
                                    dropBrain: true
                                }
                            });
                        }
                    } else {
                        const btnObj = buttons.find(b => b.dir === hitButton);
                        if (btnObj) {
                            btnObj.vis.opacity = 0.6;
                            currentDir = hitButton;
                        }
                    }
                } else if (isEnd) {
                    activeTouches.delete(touch.identifier);
                } else {
                    activeTouches.set(touch.identifier, null);
                }
            }

            canvas.addEventListener("touchstart", (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    handleTouch(e.changedTouches[i]);
                }
            }, { passive: false });

            canvas.addEventListener("touchmove", (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    handleTouch(e.changedTouches[i]);
                }
            }, { passive: false });

            canvas.addEventListener("touchend", (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    handleTouch(e.changedTouches[i], true);
                }
            }, { passive: false });

            // Continuous input update
            onUpdate(() => {
                if (currentDir) {
                    socket.send("input", {
                        seq: seq++,
                        input: {
                            seq: seq,
                            dir: currentDir,
                            dropBrain: false
                        }
                    });
                }
            });
        }
        createTouchControls();

        // Cleanup
        onSceneLeave(() => {
            // socket.off("snapshot");
        });
    });
}
