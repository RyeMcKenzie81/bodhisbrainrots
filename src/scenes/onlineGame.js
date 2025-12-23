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

        // UI Layer - Timer
        const timerBg = add([
            rect(120, 40, { radius: 4 }),
            pos(width() / 2, 30),
            anchor("center"),
            color(0, 0, 0),
            opacity(0.5),
            fixed(),
            z(100)
        ]);

        const timerText = add([
            text("WAIT", { size: 24 }),
            pos(width() / 2, 30),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101)
        ]);

        socket.on("snapshot", (data) => {
            const state = data.state;

            // Update Timer UI
            if (state.gameTime !== undefined) {
                const minutes = Math.floor(state.gameTime / 60);
                const seconds = Math.floor(state.gameTime % 60);
                timerText.text = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                if (state.suddenDeath) {
                    timerText.text = "SUDDEN DEATH";
                    timerText.color = rgb(255, 50, 50);
                    // Pulse effect?
                    if (time() % 0.5 < 0.25) timerText.color = rgb(255, 255, 255);
                } else if (state.gameTime < 30) {
                    timerText.color = rgb(255, 100, 100);
                } else {
                    timerText.color = rgb(255, 255, 255);
                }
            } else {
                timerText.text = "WAIT";
            }

            // Play background music on first snapshot
            if (!window.musicStarted) {
                window.bgMusic = play("music", { loop: true, volume: 0.5 });
                window.musicStarted = true;
                window.overtimeStarted = false;
            }

            // Switch to Overtime music
            if (state.suddenDeath && !window.overtimeStarted) {
                if (window.bgMusic) window.bgMusic.paused = true;
                // Don't loop if it's a voice clip or short sound
                window.overtimeMusic = play("overtime", { loop: false, volume: 1.0 });
                window.overtimeStarted = true;
            }

            console.log("[DEBUG] Snapshot received - Grid:", state.grid?.length, "Players:", state.players?.length, "Brains:", state.brains?.length);

            // Check for game over
            if (state.gameOver) {
                console.log("[CLIENT] Game Over detected - Winner:", state.winner);

                // Stop music
                if (window.overtimeMusic) window.overtimeMusic.paused = true;
                window.musicStarted = false;
                window.overtimeStarted = false;

                const winnerPlayer = state.players.find(p => p.id === state.winner);
                go("gameover", {
                    winner: winnerPlayer ? winnerPlayer.id : "No one",
                    isMultiplayer: true,
                    roomId: roomId,
                    restartDelay: 10 // Default Fallback
                });
                return;
            }

        // A. Render Grid - Only when it changes
        const gridHash = JSON.stringify(state.grid);
        if (!window.lastGridHash || window.lastGridHash !== gridHash) {
            console.log("[DEBUG] Grid changed - re-rendering");
            window.lastGridHash = gridHash;
            renderGrid(state.grid);
        }

        // B. Sync Players
        state.players.forEach(pState => {
            // Handle dead players - destroy sprite and play death sound
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
                    {
                        characterIndex: charIdx,
                        prevFacing: "down",
                        prevMoving: false,
                        targetPos: vec2(pState.pos.x, pState.pos.y),
                        hasReceivedState: true
                    }
                ]);

                // Smooth movement interpolation
                pObj.onUpdate(() => {
                    if (pObj.targetPos) {
                        // Lerp factor: 15Hz = 66ms. At 60fps, we want to close gap in ~4 frames.
                        // dt() * 15 is a good baseline for 15Hz updates.
                        pObj.pos = pObj.pos.lerp(pObj.targetPos, dt() * 15);
                    }
                });

                playerMap.set(pState.id, pObj);
            }

            // Update Position (Interpolation Target)
            if (pObj.isMyPlayer) {
                // For my player, we might want to reconcile, but for now simple interpolation is safer
                // to prevent jitter between prediction and server state.
                // Or keep prediction and snap if too far? 
                // Let's stick to server authority for now to be safe, but smooth it.
            }

            // Store target for interpolation in main loop
            pObj.targetPos = vec2(pState.pos.x, pState.pos.y);

            // If this is the FIRST update or distance is huge (teleport), snap immediately
            if (!pObj.hasReceivedState || pObj.pos.dist(pObj.targetPos) > SIM_CONSTANTS.TILE_SIZE * 2) {
                pObj.pos = pObj.targetPos.clone();
                pObj.hasReceivedState = true;
            }

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
        // Add/Update
        state.brains.forEach(b => {
            let obj = brainMap.get(b.id);

            // Calculate target position (prioritize world coords if sliding)
            const targetX = (b.worldX !== undefined) ? b.worldX : (b.gridX * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2);
            const targetY = (b.worldY !== undefined) ? b.worldY : (b.gridY * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2);

            if (!obj) {
                obj = add([
                    sprite("brainbomb"),
                    pos(targetX, targetY),
                    anchor("center"),
                    scale(0.05),
                    z(5), // Below players (z=10) but above floor (z=-1)
                    {
                        timer: 0,
                        targetPos: vec2(targetX, targetY)
                    }
                ]);

                // Pulse animation & Interpolation
                obj.onUpdate(() => {
                    obj.timer += dt();
                    const scaleMod = 0.05 + Math.sin(obj.timer * 10) * 0.005;
                    obj.scale = vec2(scaleMod);

                    // Interpolate position
                    if (obj.targetPos) {
                        obj.pos = obj.pos.lerp(obj.targetPos, dt() * 15);
                    }
                });

                brainMap.set(b.id, obj);
                play("bomb1");
            } else {
                // Update target for existing brain
                obj.targetPos = vec2(targetX, targetY);
            }
        });

        // D. Render Powerups
        if (!window.powerupMap) window.powerupMap = new Map();
        const powerupMap = window.powerupMap;

        // Remove collected powerups
        powerupMap.forEach((pObj, pid) => {
            const pState = state.powerups?.find(p => p.id === pid);
            if (!pState) {
                destroy(pObj);
                powerupMap.delete(pid);
            }
        });

        // Add new powerups
        state.powerups?.forEach(pState => {
            let pObj = powerupMap.get(pState.id);
            if (!pObj) {
                const powerupSprites = {
                    brain: "powerup_bomb",
                    fire: "powerup_fire",
                    speed: "powerup_speed",
                    kick: "powerup_speed", // Use speed sprite for kick (boot?)
                    skull: "powerup_bomb"  // Use bomb sprite for skull
                };

                const sprName = powerupSprites[pState.type];
                if (sprName) {
                    const baseScale = (SIM_CONSTANTS.TILE_SIZE * 0.63) / 500;
                    const baseY = pState.gridY * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2;

                    // Tint colors
                    let tintColor = rgb(255, 255, 255);
                    if (pState.type === "kick") tintColor = rgb(255, 255, 100); // Yellow-ish
                    if (pState.type === "skull") tintColor = rgb(100, 100, 100); // Dark

                    pObj = add([
                        sprite(sprName),
                        pos(pState.gridX * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2, baseY),
                        anchor("center"),
                        scale(baseScale),
                        color(tintColor),
                        opacity(1),
                        z(pState.gridY),
                        { baseY, jiggleOffset: Math.random() * Math.PI * 2 }
                    ]);

                    // Bounce animation
                    pObj.onUpdate(() => {
                        const t = time() * 5 + pObj.jiggleOffset;
                        pObj.pos.y = pObj.baseY + Math.sin(t) * 3;
                    });

                    powerupMap.set(pState.id, pObj);
                }
            }
        });

        // Detect powerup collection by checking for removed powerups
        if (window.lastPowerupCount && state.powerups.length < window.lastPowerupCount) {
            play("powerup");
        }
        window.lastPowerupCount = state.powerups?.length || 0;

        // E. Explosions (Transient)
        // Track which explosions we've already rendered to prevent duplicates
        if (!window.renderedExplosions) {
            window.renderedExplosions = new Set();
        }

        state.explosions.forEach(exp => {
            // Create unique ID for this explosion
            const expId = `${exp.x}_${exp.y}_${Math.floor(exp.timestamp * 1000)}`;

            if (!window.renderedExplosions.has(expId)) {
                window.renderedExplosions.add(expId);

                console.log("[DEBUG] Explosion cells:", exp.cells?.length || 0, "cells");

                // Play explosion sound and shake
                play("bomb2");
                shake(4);

                // Render flame sprite at each affected cell
                if (exp.cells && exp.cells.length > 0) {
                    exp.cells.forEach(cell => {
                        const flame = add([
                            sprite("brainboom"),
                            pos(cell.x * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2,
                                cell.y * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2),
                            anchor("center"),
                            scale(0.07), // Match local game
                            opacity(1),
                            z(15) // High z-index like local game
                        ]);

                        // Fade out animation
                        flame.onUpdate(() => {
                            flame.opacity -= dt() * 1.5;
                            if (flame.opacity <= 0) destroy(flame);
                        });
                    });
                } else {
                    // Fallback for old explosion format (just center)
                    const flame = add([
                        sprite("brainboom"),
                        pos(exp.x * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2,
                            exp.y * SIM_CONSTANTS.TILE_SIZE + SIM_CONSTANTS.TILE_SIZE / 2),
                        anchor("center"),
                        scale(0.07), // Match local game
                        opacity(1),
                        z(15)
                    ]);

                    flame.onUpdate(() => {
                        flame.opacity -= dt() * 1.5;
                        if (flame.opacity <= 0) destroy(flame);
                    });
                }

                play("bomb2");
                shake(8);

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

    // Listen for explicit game over message (contains restart delay info)
    socket.on("game_over", (data) => {
        console.log("[CLIENT] Received explicit game_over", data);

        if (window.bgMusic) window.bgMusic.paused = true;
        if (window.overtimeMusic) window.overtimeMusic.paused = true;
        window.musicStarted = false;
        window.overtimeStarted = false;

        go("gameover", {
            winner: data.winner || "No one",
            isMultiplayer: true,
            roomId: roomId,
            restartDelay: data.restartDelay || 10
        });
    });

    // Cleanup
    onSceneLeave(() => {
        // socket.off("snapshot");
    });
});
}
