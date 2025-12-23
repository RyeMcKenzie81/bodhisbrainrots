import { MAX_TIME, GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, PLAYERS, START_POSITIONS } from "../constants.js";
import { gameState, gameConfig } from "../state.js";
import { spawnPlayer } from "../entities/player.js";
import { spawnAIPlayer } from "../entities/ai.js";
import { spawnPowerup, createLevel } from "../entities/environment.js";

export function initGameScene() {
    scene("game", () => {
        let bgMusic = play("music", { loop: true, volume: 0.4 });
        if (!bgMusic || !bgMusic.stop) {
            bgMusic = null;
        }

        // Stop music when leaving scene
        onSceneLeave(() => {
            if (bgMusic && bgMusic.stop) bgMusic.stop();
        });

        // Reset Game State
        gameState.players = [];

        gameState.gameStarted = false;
        gameState.matchTime = 120; // 2 minutes
        gameState.matchEnded = false;

        // Match timer display (top center)
        const timerDisplay = add([
            text("2:00", { size: 32 }),
            pos(width() / 2, 30),
            anchor("center"),
            color(255, 255, 255),
            z(100),
            fixed(),
        ]);

        // Update match timer every frame
        let lastSecond = gameState.matchTime;
        onUpdate(() => {
            if (!gameState.gameStarted || gameState.matchEnded) return;

            gameState.matchTime -= dt();

            const currentSecond = Math.ceil(gameState.matchTime);
            if (currentSecond !== lastSecond) {
                lastSecond = currentSecond;

                // Update timer display
                const mins = Math.floor(Math.max(0, gameState.matchTime) / 60);
                const secs = Math.floor(Math.max(0, gameState.matchTime) % 60);
                timerDisplay.text = `${mins}:${secs.toString().padStart(2, '0')}`;

                // Change color based on time remaining
                if (gameState.matchTime <= 10) {
                    timerDisplay.color = rgb(255, 50, 50);
                    timerDisplay.scale = vec2(1.2);
                } else if (gameState.matchTime <= 30) {
                    timerDisplay.color = rgb(255, 150, 50);
                }

                // Speed up music as time runs out (starting at 30 seconds)
                if (gameState.matchTime <= 30 && gameState.matchTime > 0) {
                    // Speed from 1.0 at 30s to 1.5 at 0s
                    const speedMultiplier = 1 + (30 - gameState.matchTime) / 60;
                    if (bgMusic && bgMusic.speed) bgMusic.speed = speedMultiplier;
                }
            }

            // Time's up!
            if (gameState.matchTime <= 0 && !gameState.matchEnded) {
                gameState.matchEnded = true;
                endMatchByTime();
            }
        });

        // End match when time runs out
        function endMatchByTime() {
            // Find player(s) with most stats or just pick survivors
            const alivePlayers = gameState.players.filter(p => p.alive);
            if (alivePlayers.length === 0) {
                go("gameover", "Nobody");
            } else if (alivePlayers.length === 1) {
                go("gameover", alivePlayers[0].name);
            } else {
                // Tie - could pick by stats, for now just say "Draw"
                go("gameover", "DRAW - Time's Up!");
            }
        }

        // Screen shake function
        function shakeScreen(intensity = 5) {
            shake(intensity);
        }

        // Create the grid


        // ============ COLLISION HANDLERS ============
        // Handle Explosion hitting Player
        // Handle Explosion hitting Player
        onCollide("explosion", "player", (explosion, player) => {
            if (player.alive && !player.invulnerable) {
                player.alive = false;
                // player.play("dead"); // Animation not available
                play("dead"); // Play death sound

                // Visual death effect: Spin and fade
                player.use(rotate(0));
                tween(0, 360, 1.5, (val) => player.angle = val, easings.easeOutQuad);
                tween(1, 0, 1.5, (val) => player.opacity = val, easings.easeOutQuad);
                tween(player.scale, vec2(0), 1.5, (val) => player.scale = val, easings.easeOutQuad);

                // Name tag gray out
                const tag = get("nametag").find(t => t.owner === player);
                if (tag) {
                    tag.color = rgb(100, 100, 100);
                    tag.text += " (RIP)";
                }

                // Check win condition
                wait(1.5, checkWinCondition);
            }
        });

        // Handle Kick: Player hitting Brain
        onCollide("player", "brain", (player, brain) => {
            // Only kick if:
            // 1. Player has kick powerup
            // 2. Brain is solid (can't kick if we're standing on it)
            // 3. Brain is not already moving
            if (player.canKick && brain.solid && !brain.isKicked) {
                // Determine direction based on relative position
                // (Using center positions for accuracy)
                const dx = brain.pos.x - player.pos.x;
                const dy = brain.pos.y - player.pos.y;

                // Must be primarily horizontal or vertical
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal
                    brain.kickDirection = { dx: Math.sign(dx), dy: 0 };
                } else {
                    // Vertical
                    brain.kickDirection = { dx: 0, dy: Math.sign(dy) };
                }

                brain.isKicked = true;
                play("kick_sound", { volume: 0.8 });
            }
        });

        // Handle Powerup collection
        onCollide("player", "powerup", (player, powerup) => {
            if (!player.alive) return;

            play("powerup", { volume: 0.7 });

            // Floating text effect
            add([
                text(powerup.powerupType.toUpperCase() + "!", { size: 14 }),
                pos(player.pos.x, player.pos.y - 40),
                anchor("center"),
                color(255, 255, 100),
                z(100),
                lifespan(1, { fade: 1 }),
                move(UP, 50),
            ]);

            const isSkull = powerup.powerupType === "skull";

            switch (powerup.powerupType) {
                case "brain":
                    player.brainCount++;
                    play("powerup_bomb");
                    break;
                case "fire":
                    player.fireRange++;
                    play("powerup_fire");
                    break;
                case "speed":
                    player.speed += 40;
                    play("powerup_speed");
                    break;
                case "kick":
                    player.canKick = true;
                    // Visual feedback - could add a sound here
                    break;
                case "skull":
                    // Random curse effect!
                    applyCurse(player);
                    break;
            }
            destroy(powerup);

            // Pulse and glow effect for 2 seconds (skip for skull - different effect)
            if (!isSkull) {
                const baseScale = 0.25;
                const glowDuration = 2;
                const startTime = time();

                // Cancel any existing glow effect
                if (player.glowCancel) player.glowCancel();

                const glowUpdate = player.onUpdate(() => {
                    if (!player.alive) {
                        glowUpdate.cancel();
                        player.glowCancel = null;
                        return;
                    }

                    const elapsed = time() - startTime;
                    if (elapsed > glowDuration) {
                        // Reset to normal
                        player.scale = vec2(baseScale);
                        player.opacity = 1;
                        glowUpdate.cancel();
                        player.glowCancel = null;
                        return;
                    }

                    // Pulse scale
                    const pulse = 1 + Math.sin(elapsed * 12) * 0.15;
                    player.scale = vec2(baseScale * pulse);

                    // Glow opacity
                    player.opacity = 0.7 + Math.sin(elapsed * 12) * 0.3;
                });

                player.glowCancel = () => glowUpdate.cancel();
            }
        });

        // Apply a random curse from the skull powerup
        function applyCurse(player) {
            const curses = [
                { type: "slow", name: "SLOW!", apply: () => { player.speed = Math.max(100, player.speed - 80); } },
                { type: "nobomb", name: "NO BOMBS!", apply: () => { player.bombCount = Math.max(1, player.bombCount - 1); } },
                { type: "shortfuse", name: "SHORT FUSE!", apply: () => { player.fireRange = Math.max(1, player.fireRange - 1); } },
                { type: "reverse", name: "REVERSED!", apply: () => { player.cursed = true; player.curseType = "reverse"; } },
            ];

            const curse = curses[Math.floor(Math.random() * curses.length)];
            curse.apply();

            // Show curse text above player
            const curseText = add([
                text(curse.name, { size: 14 }),
                pos(player.pos.x, player.pos.y - 60),
                anchor("center"),
                color(255, 50, 255),
                z(100),
                lifespan(2, { fade: 1 }),
            ]);

            // Make player flash purple
            const baseScale = 0.25;
            const curseDuration = 3;
            const startTime = time();

            if (player.glowCancel) player.glowCancel();

            const curseUpdate = player.onUpdate(() => {
                if (!player.alive) {
                    curseUpdate.cancel();
                    player.glowCancel = null;
                    if (curseText.exists()) destroy(curseText);
                    return;
                }

                const elapsed = time() - startTime;

                // Update floating text position
                if (curseText.exists()) {
                    curseText.pos.x = player.pos.x;
                    curseText.pos.y = player.pos.y - 60 - elapsed * 10;
                }

                if (elapsed > curseDuration) {
                    player.scale = vec2(baseScale);
                    player.opacity = 1;
                    // Clear reverse curse after duration
                    if (player.curseType === "reverse") {
                        player.cursed = false;
                        player.curseType = null;
                    }
                    curseUpdate.cancel();
                    player.glowCancel = null;
                    return;
                }

                // Purple flash effect
                const flash = Math.sin(elapsed * 15) > 0 ? 1 : 0.5;
                player.opacity = flash;
            });

            player.glowCancel = () => curseUpdate.cancel();
        }

        // Check for winner
        function checkWinCondition() {
            const alivePlayers = gameState.players.filter((p) => p.alive);
            if (alivePlayers.length <= 1) {
                wait(1, () => {
                    if (bgMusic && bgMusic.stop) bgMusic.stop();
                    go("gameover", alivePlayers[0]?.name || "Nobody");
                });
            }
        }

        // Create level and spawn players based on selection
        createLevel();
        let localPlayer = null;
        for (let i = 0; i < gameConfig.playerCount; i++) {
            const characterIndex = gameConfig.playerCharacters[i];
            // In singleplayer, player 0 is human, others are AI
            if (gameConfig.mode === "singleplayer" && i > 0) {
                spawnAIPlayer(i, characterIndex, gameConfig.difficulty);
            } else {
                const p = spawnPlayer(i, characterIndex);
                if (i === 0) localPlayer = p;
            }
        }

        // ============ MOBILE CONTROLS ============
        // Add D-pad and Action button if on touch device (or always for now)
        function createTouchControls() {
            const dpadRadius = 25;
            const dpadBaseX = 80;
            const dpadBaseY = height() - 80;
            const btnColor = rgb(255, 255, 255);
            const btnOpacity = 0.3;

            // Helper to create button
            function createBtn(x, y, txt, onPress, onRelease) {
                const btn = add([
                    circle(dpadRadius),
                    pos(x, y),
                    anchor("center"),
                    color(btnColor),
                    opacity(btnOpacity),
                    fixed(),
                    z(200),
                    area(),
                ]);

                add([
                    text(txt, { size: 24 }),
                    pos(x, y),
                    anchor("center"),
                    color(0, 0, 0),
                    opacity(0.5),
                    fixed(),
                    z(201),
                ]);

                // Touch events
                btn.onUpdate(() => {
                    if (btn.isHovering() && isMouseDown()) {
                        btn.opacity = 0.6;
                        onPress(); // Repeatedly call press (good for movement)
                    } else {
                        btn.opacity = btnOpacity;
                        // Release is harder to track perfectly in loop without state, 
                        // relying on player logic to stop when not pressed.
                        // Actually, our player logic requires a "release" call to stop animation.
                    }
                });

                // Better way: defined press/release events if kaboom supports them well for touch
                // Using generic mouse/touch events
                btn.onClick(() => { }); // Just to capture click

                // Hacky continuous press:
                // We really need 'touch start' and 'touch end'. 
                // Kaboom's `onHover` + `isMouseDown` is close for mouse.
                // For multitouch, pure Kaboom might be tricky without a plugin.
                // But let's try basic pointer logic.
            }

            // Since Kaboom native multitouch UI is tricky, let's use a simpler "Click" approach 
            // where holding down buttons works.
            // We need to inject logic into the update loop for the local player.

            // Re-implementing D-Pad logic:
            const dPad = add([
                pos(dpadBaseX, dpadBaseY),
                fixed(),
                z(200),
            ]);

            const buttons = [
                { dir: "up", x: 0, y: -40, txt: "W" },
                { dir: "down", x: 0, y: 40, txt: "S" },
                { dir: "left", x: -40, y: 0, txt: "A" },
                { dir: "right", x: 40, y: 0, txt: "D" },
            ];

            buttons.forEach(b => {
                const btn = dPad.add([
                    circle(22),
                    pos(b.x, b.y),
                    anchor("center"),
                    color(255, 255, 255),
                    opacity(0.2),
                    area(),
                    { dir: b.dir }
                ]);

                // Logic: check every frame if this button is being touched
                btn.onUpdate(() => {
                    // With 'touchToMouse', only one touch is tracked as mouse.
                    // This is bad for D-Pad + Bomb.
                    // BUT for MVP, user can tap bomb or tap move.
                    // If 'touchToMouse: true' is on, isHovering() works for single touch.
                    // If localPlayer exists...
                    if (!localPlayer) return;

                    if (btn.isHovering() && isMouseDown()) {
                        btn.opacity = 0.5;
                        // Trigger press
                        const method = "press" + b.dir.charAt(0).toUpperCase() + b.dir.slice(1);
                        if (localPlayer[method]) localPlayer[method]();
                    } else {
                        btn.opacity = 0.2;
                        // Trigger release - verify if we need to release explicitly
                        // Our player logic stops moving if we stop calling press? 
                        // No, player logic has "isMoving = true" on press, and "isMoving = false" on RELEASE.
                        // So we MUST call release when not touching.
                        const method = "release" + b.dir.charAt(0).toUpperCase() + b.dir.slice(1);
                        // Only release if we were previously moving in this dir? 
                        // Simplest: Always call release if not pressed? Might spam.
                        // Better: Helper in player.js could start/stop.
                        if (localPlayer[method]) localPlayer[method]();
                    }
                });
            });

            // Action Button (Bomb)
            const actionBtn = add([
                circle(35),
                pos(width() - 80, height() - 80),
                anchor("center"),
                color(255, 50, 50),
                opacity(0.4),
                fixed(),
                z(200),
                area(),
                "actionBtn"
            ]);

            actionBtn.onClick(() => {
                if (localPlayer && localPlayer.dropBomb) localPlayer.dropBomb();
            });
            // Also allow hold for spamming?
            actionBtn.onUpdate(() => {
                if (actionBtn.isHovering() && isMouseDown()) {
                    actionBtn.opacity = 0.7;
                } else {
                    actionBtn.opacity = 0.4;
                }
            });
        }

        // Countdown Timer
        function startCountdown() {
            let count = 3;
            const countText = add([
                text(count, { size: 72 }),
                pos(width() / 2, height() / 2),
                anchor("center"),
                color(255, 255, 255),
                z(200),
                fixed(),
            ]);

            // Countdown Sound
            play("callout_" + Math.floor(Math.random() * 4)); // Random character shout? Or a beep?

            const tick = loop(1, () => {
                count--;
                if (count > 0) {
                    countText.text = count;
                    // Pulse effect
                    countText.scale = vec2(1.5);
                    tween(vec2(1.5), vec2(1), 0.5, (val) => countText.scale = val, easings.easeOutBounce);
                } else if (count === 0) {
                    countText.text = "GO!";
                    countText.color = rgb(255, 255, 50);
                    countText.scale = vec2(2);
                    tween(vec2(2), vec2(1), 0.5, (val) => countText.scale = val, easings.easeOutBounce);

                    gameState.gameStarted = true;
                } else {
                    destroy(countText);
                    tick.cancel();
                }
            });
        }

        // Spawn UI
        createTouchControls();

        // Start the countdown after a brief delay
        wait(0.3, () => {
            startCountdown();
        });
    });
}
