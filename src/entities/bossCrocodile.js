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
        }
    ]);

    boss.play("fly_down");

    // UI: Boss Health Bar?
    // For now, flash on hit is feedback.

    // Cleanup sound on death
    boss.onDestroy(() => {
        hoverSound.paused = true;
    });

    boss.onUpdate(() => {
        // State Machine
        boss.timer -= dt();

        if (boss.state === "idle") {
            // Pick new action often
            if (boss.timer <= 0) {
                const action = choose(["move", "move", "bomb", "egg", "egg"]);

                if (action === "move") {
                    // Pick random spot within grid
                    const gridX = rand(1, GRID_WIDTH - 1);
                    const gridY = rand(1, GRID_HEIGHT - 1);
                    boss.targetPos = vec2(
                        GRID_OFFSET_X + gridX * TILE_SIZE,
                        GRID_OFFSET_Y + gridY * TILE_SIZE
                    );
                    boss.state = "moving";
                } else if (action === "bomb") {
                    boss.state = "attack_bomb";
                    boss.timer = 1.0; // Telegraph time

                    // Lock Target
                    const targets = gameState.players.filter(p => p.alive);
                    if (targets.length > 0) {
                        boss.targetPlayer = choose(targets);
                        boss.targetLockedPos = boss.targetPlayer.pos.clone();
                    }
                } else if (action === "egg") {
                    boss.state = "attack_egg";
                    boss.timer = 0.5;
                }
            }
        }
        else if (boss.state === "moving") {
            if (boss.targetPos) {
                const dir = boss.targetPos.sub(boss.pos).unit();
                boss.move(dir.scale(boss.speed));

                // Animation
                if (Math.abs(dir.x) > Math.abs(dir.y)) {
                    if (boss.curAnim() !== "fly_side") boss.play("fly_side");
                    boss.flipX = dir.x < 0;
                } else {
                    if (dir.y < 0) {
                        if (boss.curAnim() !== "fly_up") boss.play("fly_up");
                    } else {
                        if (boss.curAnim() !== "fly_down") boss.play("fly_down");
                    }
                }

                if (boss.pos.dist(boss.targetPos) < 10) {
                    boss.state = "idle";
                    boss.timer = rand(0.5, 1.5);
                }
            }
        }
        else if (boss.state === "attack_bomb") {
            // Telegraph
            if (boss.targetPlayer && boss.targetPlayer.alive) {
                if (boss.timer > 0.3) boss.targetLockedPos = boss.targetPlayer.pos.clone();

                // Draw Line
                drawLine({
                    p1: boss.pos,
                    p2: boss.targetLockedPos,
                    width: 4,
                    color: rgb(255, 0, 0),
                    opacity: 0.5 + Math.sin(time() * 20) * 0.2,
                    z: 200,
                });
            }

            if (boss.timer <= 0) {
                // Drop Bomb!
                boss.play("attack_open"); // Open hatch
                wait(0.2, () => {
                    play("rocket_shoot");
                    spawnProjectile(boss.pos, boss.targetLockedPos || boss.pos.add(0, 100));

                    wait(0.5, () => {
                        boss.play("fly_down");
                        boss.state = "idle";
                        boss.timer = 1.0;
                        boss.targetPlayer = null;
                    });
                });
                boss.timer = 999; // Wait for callback
            }
        }
        else if (boss.state === "attack_egg") {
            if (boss.timer <= 0) {
                boss.play("attack_open");
                wait(0.3, () => {
                    spawnEgg(boss.pos);
                    wait(0.5, () => {
                        boss.play("fly_down");
                        boss.state = "idle";
                        boss.timer = 2.0; // Rest after egg
                    });
                });
                boss.timer = 999;
            }
        }
    });

    // Projectile Helper
    // Projectile Helper
    function spawnProjectile(startPos, targetPos) {
        const dir = targetPos.sub(startPos).unit();

        const proj = add([
            sprite("boss_items", { anim: "missile_fly" }),
            pos(startPos),
            anchor("center"),
            area({ scale: 0.5 }),
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

        proj.onCollide("wall", () => {
            // Explode on wall
            // Explode on wall
            add([
                sprite("brainboom"),
                pos(proj.pos),
                anchor("center"),
                scale(0.07),
                lifespan(0.5),
                "explosion",
                area({ scale: 0.5 }),
            ]);
            play("bomb1");
            proj.destroy();
        });
    }

    // Hurt Logic
    boss.onCollide("explosion", () => {
        boss.hurt(1);
        boss.color = rgb(255, 100, 100);
        wait(0.1, () => boss.color = rgb(255, 255, 255));
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
