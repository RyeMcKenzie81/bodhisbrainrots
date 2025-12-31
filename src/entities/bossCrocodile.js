import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y } from "../constants.js";
import { gameState } from "../state.js";
import { spawnEgg } from "./bossEgg.js";

export function spawnCrocodilo(startPos) {
    play("callout_boss");
    const hoverSound = play("boss_hovering", { loop: true, volume: 0.4 });

    // Boss Entity
    const boss = add([
        sprite("boss_crocodilo"),
        pos(startPos),
        anchor("center"),
        scale(2), // Double size "100% bigger"
        area({ scale: 0.6 }), // Smaller hitbox than visual
        // No body() means it ignores physics/walls
        health(10),
        z(100), // Fly above everything
        "boss",
        "enemy",
        {
            dir: vec2(1, 0),
            speed: 100,
            state: "idle",
            timer: 0,
            targetPos: null,
            needsReset: false, // Flag to break stack recursion
            isHurting: false, // I-Frame flag
        }
    ]);

    boss.play("fly_down");

    // UI: Boss Health Bar?
    // For now, flash on hit is feedback.

    // Cleanup sound on death
    boss.onDestroy(() => {
        hoverSound.paused = true;
    });

    let reticle = null;

    boss.onUpdate(() => {
        // State Machine
        boss.timer -= dt();

        // Handle deferred animation reset to prevent stack overflow
        if (boss.needsReset) {
            boss.play("fly_down");
            boss.needsReset = false;
        }

        if (boss.state === "idle") {
            // Pick new action often
            if (boss.timer <= 0) {
                // Determine action
                const action = choose(["move", "bomb", "egg", "egg"]);

                if (action === "move") {
                    // Pick random spot within grid
                    // Restrict bounds significantly to keep Boss on screen (Sprite is HUGE)
                    // Grid Width is 15. Boss is ~8 tiles wide visually.
                    // Range: 4 to 10 (Width-5)
                    const gridX = rand(4, GRID_WIDTH - 5);
                    const gridY = rand(2, GRID_HEIGHT - 3);
                    // Center on tile: Offset + (Index * 64) + 32
                    boss.targetPos = vec2(
                        GRID_OFFSET_X + gridX * TILE_SIZE + TILE_SIZE / 2,
                        GRID_OFFSET_Y + gridY * TILE_SIZE + TILE_SIZE / 2
                    );
                    boss.state = "moving";
                } else if (action === "bomb") {
                    boss.state = "attack_bomb";
                    boss.timer = 1.0;
                    const targets = gameState.players.filter(p => p.alive);
                    if (targets.length > 0) {
                        boss.targetPlayer = choose(targets);
                        boss.targetLockedPos = boss.targetPlayer.pos.clone();

                        // Spawn Reticle Entity
                        if (reticle) destroy(reticle);
                        reticle = add([
                            circle(30),
                            color(255, 0, 0),
                            opacity(0.5),
                            pos(boss.targetLockedPos),
                            anchor("center"),
                            z(50), // On ground
                            "reticle"
                        ]);
                    }
                } else if (action === "egg") {
                    // Fly to a corner first to drop egg
                    // Add TILE_SIZE/2 to center in the tile
                    const halfTile = TILE_SIZE / 2;
                    // User requested "pull them in one more"
                    // Use Index 3 and Index MAX-4
                    const minX = GRID_OFFSET_X + TILE_SIZE * 3 + halfTile;
                    const maxX = GRID_OFFSET_X + (GRID_WIDTH - 4) * TILE_SIZE + halfTile;
                    const minY = GRID_OFFSET_Y + TILE_SIZE * 3 + halfTile;
                    const maxY = GRID_OFFSET_Y + (GRID_HEIGHT - 4) * TILE_SIZE + halfTile;

                    const corners = [
                        vec2(minX, minY), // Top Left
                        vec2(maxX, minY), // Top Right
                        vec2(minX, maxY), // Bot Left
                        vec2(maxX, maxY), // Bot Right
                    ];
                    boss.targetPos = choose(corners);
                    boss.state = "moving_to_egg";
                }
            }
        }
        else if (boss.state === "moving" || boss.state === "moving_to_egg") {
            if (boss.targetPos) {
                const dir = boss.targetPos.sub(boss.pos).unit();
                boss.move(dir.scale(boss.speed));

                if (Math.abs(dir.x) > Math.abs(dir.y)) {
                    if (boss.curAnim() !== "fly_side") boss.play("fly_side");
                    boss.flipX = dir.x > 0;
                } else {
                    boss.flipX = false; // Reset flip for up/down
                    if (dir.y < 0) {
                        if (boss.curAnim() !== "fly_up") boss.play("fly_up");
                    } else {
                        if (boss.curAnim() !== "fly_down") boss.play("fly_down");
                    }
                }

                if (boss.pos.dist(boss.targetPos) < 10) {
                    if (boss.state === "moving_to_egg") {
                        // Arrived at corner, drop egg
                        boss.state = "attack_egg";
                        boss.timer = 0.5;
                    } else {
                        // Just finished moving
                        boss.state = "idle";
                        boss.timer = rand(0.5, 1.0);
                    }
                }
            }
        }
        else if (boss.state === "attack_bomb") {
            // Update Reticle
            if (boss.targetPlayer && boss.targetPlayer.alive && boss.timer > 0.3) {
                boss.targetLockedPos = boss.targetPlayer.pos.clone();
            }
            if (reticle) {
                reticle.pos = boss.targetLockedPos;
                // Pulse effect
                reticle.radius = 30 + Math.sin(time() * 20) * 5;
            }

            if (boss.timer <= 0) {
                boss.play("attack_open");
                wait(0.2, () => {
                    play("rocket_shoot");

                    // Use clone() to prevent shared reference bugs
                    // Spawn slightly lower (y+50) to avoid instant wall collision if hovering
                    spawnProjectile(boss.pos.add(vec2(0, 50)), boss.targetLockedPos ? boss.targetLockedPos.clone() : boss.pos.add(vec2(0, 100)));

                    if (reticle) {
                        destroy(reticle);
                        reticle = null;
                    }

                    wait(0.5, () => {
                        // Defer play() to next frame to break call stack
                        boss.needsReset = true;
                        boss.state = "idle";
                        boss.timer = 1.0;
                        boss.targetPlayer = null;
                    });
                });
                boss.timer = 999;
            }
        }
        else if (boss.state === "attack_egg") {
            if (boss.timer <= 0) {
                boss.play("attack_egg");
                wait(0.3, () => {
                    spawnEgg(boss.pos);
                    wait(0.5, () => {
                        boss.play("fly_down");
                        // Move back to center-ish or just random spot?
                        // "move back to the middle to fight"
                        // Approximate middle
                        boss.targetPos = vec2(
                            GRID_OFFSET_X + (GRID_WIDTH / 2) * TILE_SIZE,
                            GRID_OFFSET_Y + (GRID_HEIGHT / 2) * TILE_SIZE
                        );
                        boss.state = "moving"; // Go to middle
                    });
                });
                boss.timer = 999;
            }
        }
    });

    // Projectile Helper
    function spawnProjectile(startPos, targetPos) {
        const dir = targetPos.sub(startPos).unit();

        const proj = add([
            sprite("boss_missile"),
            pos(startPos), // startPos is already a clone now
            anchor("center"),
            scale(1), // Scale is 1 for 32x32 sprite
            z(200), // Above Boss
            move(dir, 300), // Fast
            lifespan(3), // Dies if misses
            "boss_projectile",
            "enemy"
        ]);

        // Rotate sprite to face dir
        proj.angle = dir.angle();

        proj.onCollide("player", (p) => {
            if (p.alive) {
                // Explode!
                // Trigger explosion equivalent
                add([
                    sprite("brainboom"), // Reusing explosion sprite
                    pos(proj.pos),
                    anchor("center"),
                    scale(0.07), // Match brain.js scale (source is huge)
                    lifespan(0.5),
                    "explosion", // Hurts player
                    area({ scale: 0.5 }),
                ]);
                play("bomb1");
                proj.destroy();
            }
        });

        // Missiles are "flying" so they ignore walls/blocks
        // They only explode on players or timeout (lifespan)
        // proj.onCollide("wall", () => { ... });
    }

    // Hurt Logic
    boss.onCollide("explosion", () => {
        if (boss.isHurting) return; // Prevent recursion/double-hits
        boss.isHurting = true;

        boss.hurt(1);
        boss.color = rgb(255, 100, 100);
        wait(0.5, () => {
            boss.color = rgb(255, 255, 255);
            boss.isHurting = false;
        });
    });

    boss.on("death", () => {
        destroy(boss);
        // Big Explosion Chain
        for (let i = 0; i < 5; i++) {
            wait(i * 0.2, () => {
                add([
                    sprite("brainboom"),
                    pos(boss.pos.add(rand(-50, 50), rand(-50, 50))),
                    anchor("center"),
                    scale(2),
                    lifespan(0.5),
                ]);
                play("bomb2");
            });
        }

        // Destroy all minions/eggs
        get("minion").forEach(m => m.destroy());
        get("egg").forEach(e => e.destroy());

        play("win"); // Placeholder win sound
    });
}
