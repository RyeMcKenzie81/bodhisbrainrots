import { MAX_TIME, GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, PLAYERS, START_POSITIONS } from "../constants.js";
import { gameState, gameConfig } from "../state.js";
import { spawnPlayer } from "../entities/player.js";
import { spawnAIPlayer } from "../entities/ai.js";
import { spawnPowerup, createLevel } from "../entities/environment.js";

export function initGameScene() {
    scene("game", () => {
        // Play background music
        const bgMusic = play("music", { loop: true, volume: 0.45 });

        // Stop music when leaving scene
        onSceneLeave(() => {
            bgMusic.stop();
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
                    bgMusic.speed = speedMultiplier;
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
                    go("gameover", alivePlayers[0]?.name || "Nobody");
                });
            }
        }

        // Create level and spawn players based on selection
        createLevel();
        for (let i = 0; i < gameConfig.playerCount; i++) {
            const characterIndex = gameConfig.playerCharacters[i];
            // In singleplayer, player 0 is human, others are AI
            if (gameConfig.mode === "singleplayer" && i > 0) {
                spawnAIPlayer(i, characterIndex, gameConfig.difficulty);
            } else {
                spawnPlayer(i, characterIndex);
            }
        }

        // ESC to return to menu
        onKeyPress("escape", () => go("menu"));

        // ============ PLAYER STATS HUD ============
        const statsHUD = [];
        const hudY = GRID_HEIGHT * TILE_SIZE + 8;

        function createStatsHUD() {
            // Clear old HUD
            statsHUD.forEach(h => destroy(h));
            statsHUD.length = 0;

            const playerCount = gameState.players.length;
            const hudWidth = width() / playerCount;

            // Player colors
            const playerColors = [
                rgb(255, 200, 50),
                rgb(100, 150, 255),
                rgb(255, 100, 150),
                rgb(100, 255, 150),
            ];

            gameState.players.forEach((player, i) => {
                const hudX = hudWidth * i + 10;

                // Player name/label
                const label = add([
                    text(`P${player.playerIndex + 1}${player.isAI ? ' CPU' : ''}`, { size: 11 }),
                    pos(hudX, hudY),
                    color(playerColors[player.playerIndex] || rgb(255, 255, 255)),
                    z(20),
                    fixed(),
                    { playerId: player.playerIndex },
                ]);
                statsHUD.push(label);

                // Stats icons and values (bomb, fire, speed)
                const statsText = add([
                    text("", { size: 10 }),
                    pos(hudX + 60, hudY),
                    color(200, 200, 200),
                    z(20),
                    fixed(),
                    { playerId: player.playerIndex, isStats: true },
                ]);
                statsHUD.push(statsText);
            });
        }

        // Update stats HUD every frame
        onUpdate(() => {
            statsHUD.forEach(hud => {
                if (hud.isStats) {
                    const player = gameState.players.find(p => p.playerIndex === hud.playerId);
                    if (player && player.alive) {
                        hud.text = `B:${player.brainCount} F:${player.fireRange} S:${Math.floor(player.speed / 40)}`;
                    } else if (player && !player.alive) {
                        hud.text = "DEAD";
                        hud.color = rgb(100, 100, 100);
                    }
                }
            });
        });

        // Basic HUD info
        add([
            text("ESC = Menu", { size: 10 }),
            pos(width() - 70, hudY),
            color(80, 80, 80),
            z(20),
            fixed(),
        ]);

        // ============ COUNTDOWN SEQUENCE ============
        function startCountdown() {
            const countdownTexts = ["3", "2", "1", "GO!"];
            let countIndex = 0;

            // Hide the timer during countdown
            timerDisplay.text = "";

            function showCountdown() {
                if (countIndex >= countdownTexts.length) {
                    // Countdown complete - start the game!
                    gameState.gameStarted = true;
                    timerDisplay.text = "2:00";
                    createStatsHUD();
                    return;
                }

                const countText = add([
                    text(countdownTexts[countIndex], { size: 120 }),
                    pos(width() / 2, height() / 2 - 50),
                    anchor("center"),
                    color(countIndex === 3 ? rgb(100, 255, 100) : rgb(255, 255, 255)),
                    z(200),
                    opacity(1),
                    scale(1),
                ]);

                // Animate: scale up and fade out
                countText.onUpdate(() => {
                    countText.scale = countText.scale.add(vec2(dt() * 2));
                    countText.opacity -= dt() * 2;
                });

                // Play a sound for each count (reuse existing sounds)
                if (countIndex < 3) {
                    // Could add countdown sounds here
                }

                wait(0.8, () => {
                    destroy(countText);
                    countIndex++;
                    showCountdown();
                });
            }

            showCountdown();
        }

        // Start the countdown after a brief delay
        wait(0.3, () => {
            startCountdown();
        });
    });
}
