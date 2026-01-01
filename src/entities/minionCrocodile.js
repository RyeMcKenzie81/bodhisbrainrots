import { gameState } from "../state.js";

export function spawnMinion(startPos) {
    const minion = add([
        sprite("boss_minion"),
        pos(startPos),
        anchor("center"),
        scale(0.9), // Slightly smaller than tile
        z(50), // Above blocks
        area({ scale: 0.6 }),
        body(),
        "minion",
        "enemy",
        {
            speed: 60,
            target: null,
            timer: 0,
        }
    ]);

    minion.play("walk_down");
    // play("callout_minion"); // Too spammy if 3 spawn at once. Handled by Egg.

    minion.onUpdate(() => {
        // Simple Chase Logic
        let nearest = null;
        let minDist = Infinity;

        gameState.players.forEach(p => {
            if (p.alive) {
                const d = p.pos.dist(minion.pos);
                if (d < minDist) {
                    minDist = d;
                    nearest = p;
                }
            }
        });

        if (nearest) {
            const dir = nearest.pos.sub(minion.pos).unit();
            // Simple movement (no pathfinding around blocks - they are dumb minions)
            // Or should they have pathfinding?
            // "Regular sized 'los crocodiles' hatch out and try to come kill the players"
            // "Standard ground enemies (like the AI bots) but simpler"
            // If they get stuck on blocks it's sad.
            // But implementing full A* here is heavy.
            // For now: Move direct. If stuck, maybe slide?

            minion.move(dir.scale(minion.speed));

            // Animations
            if (Math.abs(dir.x) > Math.abs(dir.y)) {
                // Moving Side
                // Check if playing already
                if (minion.curAnim() !== "walk_side") minion.play("walk_side");
                minion.flipX = dir.x < 0;
            } else {
                if (dir.y < 0) {
                    if (minion.curAnim() !== "walk_up") minion.play("walk_up");
                } else {
                    if (minion.curAnim() !== "walk_down") minion.play("walk_down");
                }
            }
        }
    });

    // Freeze Mechanic
    minion.onCollide("player", (p) => {
        if (p.alive && !p.frozen) {
            p.frozen = true;
            // Visual feedback: Blue tint
            p.color = rgb(100, 100, 255);

            // Play freeze/hit sound
            play("kick_sound", { detune: -600 }); // Low thud as improvised freeze sound

            wait(2.5, () => {
                if (p.alive) {
                    p.frozen = false;
                    p.color = rgb(255, 255, 255);
                }
            });

            // Minion sacrifice
            minion.destroy();
        }
    });

    // Minion can die from explosions
    minion.on("hurt", () => {
        minion.destroy();
        play("kick_sound"); // death sound
    });
    // Collide with explosion
    minion.onCollide("explosion", () => {
        minion.trigger("hurt");
    });
}
