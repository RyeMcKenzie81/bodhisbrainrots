import { spawnMinion } from "./minionCrocodile.js";

export function spawnEgg(startPos) {
    play("egg_lay");
    const egg = add([
        sprite("boss_items", { anim: "egg_crack" }),
        pos(startPos),
        anchor("center"),
        area(),
        body({ isStatic: true }), // Solid
        health(2),
        "egg",
        "enemy",
        "destructible", // Tag for easier destruction logic if needed
    ]);

    // Hatch Timer
    wait(10, () => {
        if (egg.exists()) {
            play("egg_crack");
            play("callout_minion");

            // Spawn Minions
            const num = randi(2, 4); // 2 or 3
            for (let i = 0; i < num; i++) {
                // Offset slightly so they don't stack perfectly
                const offset = vec2(rand(-40, 40), rand(-40, 40));
                // Ensure spawn on grid? Minions will resolve collision.
                spawnMinion(egg.pos.add(offset));
            }

            // Create "broken egg" debris?
            // For now just destroy.
            destroy(egg);
        }
    });

    // Damage Logic
    egg.on("hurt", () => {
        egg.hurt(1);
        // Flash Red
        egg.color = rgb(255, 100, 100);
        wait(0.1, () => egg.color = rgb(255, 255, 255));
    });

    egg.on("death", () => {
        destroy(egg);
        play("kick_sound"); // Shatter sound (placeholder)
    });

    egg.onCollide("explosion", () => {
        egg.trigger("hurt");
    });
}
