import { spawnMinion } from "./minionCrocodile.js";

export function spawnEgg(startPos) {
    play("egg_lay");
    const egg = add([
        sprite("boss_items", { anim: "egg_crack" }),
        pos(startPos),
        anchor("center"),
        scale(1.5), // "At least size of regular character, maybe 50% bigger"
        area(),
        body({ isStatic: true }), // Solid
        health(1),
        z(10), // Above floor
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
                let spawnPos = egg.pos.add(offset);

                // Clamp to map bounds (approx 0 to width/height with padding)
                // Width ~960, Height ~720
                if (spawnPos.x < 32) spawnPos.x = 32;
                if (spawnPos.x > 960 - 32) spawnPos.x = 960 - 32;
                if (spawnPos.y < 32) spawnPos.y = 32;
                if (spawnPos.y > 704 - 32) spawnPos.y = 704 - 32;

                spawnMinion(spawnPos);
            }

            // Create "broken egg" debris?
            // For now just destroy.
            destroy(egg);
        }
    });

    // Damage Logic (Event Handler: Visuals Only outside of hurt())
    // Note: hurt() triggers "hurt". DO NOT call hurt() inside here.
    egg.on("hurt", () => {
        // Flash Red
        egg.color = rgb(255, 100, 100);
        wait(0.1, () => egg.color = rgb(255, 255, 255));
    });

    egg.on("death", () => {
        destroy(egg);
        play("kick_sound"); // Shatter sound (placeholder)
    });

    egg.onCollide("explosion", () => {
        egg.hurt(1); // Trigger damage here
    });
}
