export function loadAssets() {
    // Load sprites (PNGs with transparent backgrounds)
    loadSprite("tungtung_front", "sprites/tungtungfront.png");
    loadSprite("tungtung_back", "sprites/tungtungback.png");
    loadSprite("meowl_front", "sprites/meowlfront.png");
    loadSprite("meowl_back", "sprites/meowlback.png");
    loadSprite("strawberry_front", "sprites/strawberryfront.png");
    loadSprite("strawberry_back", "sprites/strawberryback.png");
    loadSprite("cappucino_front", "sprites/cappucinofront.png");
    loadSprite("cappucino_back", "sprites/cappucinoback.png");
    loadSprite("brainbomb", "sprites/brainbomb.png");
    loadSprite("brainboom", "sprites/brainbombexplode.png");
    loadSprite("woodblock", "sprites/woodblock.png");
    loadSprite("diamondblock", "sprites/diamondblock.png");
    loadSprite("christmas_tree", "sprites/christmas_tree.png");
    loadSprite("christmas_elf", "sprites/christmas_elf.png");
    loadSprite("powerup_bomb", "sprites/powerupbomb.png");
    loadSprite("powerup_fire", "sprites/powerupfire.png");
    loadSprite("powerup_speed", "sprites/powerupspeed.png");
    loadSound("music", "sprites/music.mp3");
    loadSound("bomb1", "sprites/bomb1.mp3");
    loadSound("bomb2", "sprites/bomb2.mp3");
    loadSound("die", "sprites/die.mp3");
    loadSound("powerup", "sprites/powerup.mp3");
    loadSound("dead", "sprites/dead.mp3");
    loadSound("powerup_bomb", "sprites/bombspoweredup.mp3");
    loadSound("powerup_fire", "sprites/flamespoweredup.mp3");
    loadSound("powerup_speed", "sprites/speedpowerup.mp3");
    loadSound("selectmusic", "sprites/characterselect.mp3");
    loadSound("callout_0", "sprites/mamarizz-callout.mp3");
    loadSound("callout_1", "sprites/callout_tungtung.mp3");
    loadSound("callout_2", "sprites/callout_meowl.mp3");
    loadSound("callout_3", "sprites/callout_strawberry.mp3");
    loadSound("callout_4", "sprites/callout_cappucino.mp3");
    loadSound("callout_5", "sprites/zippycallout.mp3");

    // New Audio Polish sounds
    loadSound("kick_sound", "sprites/kick.mp3");
    loadSound("footsteps", "sprites/footsteps.mp3");
    loadSound("win", "sprites/win.mp3");
    loadSound("loss", "sprites/loss.mp3");
    loadSound("overtime", "sprites/overtime.mp3");

    // Zippy Zartle
    // Zippy Zartle
    loadSprite("zippy_front", "sprites/zippy_front.png");
    loadSprite("zippy_back", "sprites/zippy_back.png");
    loadSprite("zippy_anim", "sprites/zippysprite_sheet.png", {
        sliceX: 4, sliceY: 4,
        anims: {
            walk_down: { from: 0, to: 3, loop: true, speed: 8 },
            walk_up: { from: 4, to: 7, loop: true, speed: 8 },
            walk_left: { from: 8, to: 11, loop: true, speed: 8 },
            walk_right: { from: 12, to: 15, loop: true, speed: 8 },
            idle_down: { from: 0, to: 0 },
            idle_up: { from: 4, to: 4 },
            idle_left: { from: 8, to: 8 },
            idle_right: { from: 12, to: 12 },
            idle_side: { from: 8, to: 8 },
        }
    });

    // Mama Rizz
    loadSprite("mamarizz_front", "sprites/mamarizz_front.png");
    loadSprite("mamarizz_back", "sprites/mamarizz_back.png");
    loadSprite("mamarizz_anim", "sprites/mamarizz_sheet.png", {
        sliceX: 4, sliceY: 4,
        anims: {
            walk_down: { from: 0, to: 3, loop: true, speed: 8 },
            walk_up: { from: 4, to: 7, loop: true, speed: 8 },
            walk_left: { from: 8, to: 11, loop: true, speed: 8 },
            walk_right: { from: 12, to: 15, loop: true, speed: 8 },
            idle_down: { from: 0, to: 0 },
            idle_up: { from: 4, to: 4 },
            idle_left: { from: 8, to: 8 },
            idle_right: { from: 12, to: 12 },
            idle_side: { from: 8, to: 8 },
        }
    });

    // Load animated sprite sheets (4x4 grid: down, up, left, right rows)
    loadSprite("tungtung_anim", "sprites/tungtung_spritesheet.png", {
        sliceX: 4,
        sliceY: 4,
        anims: {
            walk_down: { from: 0, to: 3, loop: true, speed: 8 },
            walk_up: { from: 4, to: 7, loop: true, speed: 8 },
            walk_left: { from: 8, to: 11, loop: true, speed: 8 },
            walk_right: { from: 12, to: 15, loop: true, speed: 8 },
            idle_down: { from: 0, to: 0 },
            idle_up: { from: 4, to: 4 },
            idle_left: { from: 8, to: 8 },
            idle_right: { from: 12, to: 12 },
        },
    });

    loadSprite("meowl_anim", "sprites/meowl_spritesheet.png", {
        sliceX: 4,
        sliceY: 4,
        anims: {
            walk_down: { from: 0, to: 3, loop: true, speed: 8 },
            walk_up: { from: 4, to: 7, loop: true, speed: 8 },
            walk_left: { from: 8, to: 11, loop: true, speed: 8 },
            walk_right: { from: 12, to: 15, loop: true, speed: 8 },
            idle_down: { from: 0, to: 0 },
            idle_up: { from: 4, to: 4 },
            idle_left: { from: 8, to: 8 },
            idle_right: { from: 12, to: 12 },
        },
    });

    loadSprite("strawberry_anim", "sprites/strawberry_spritesheet.png", {
        sliceX: 4,
        sliceY: 4,
        anims: {
            walk_down: { from: 0, to: 3, loop: true, speed: 8 },
            walk_up: { from: 4, to: 7, loop: true, speed: 8 },
            walk_left: { from: 8, to: 11, loop: true, speed: 8 },
            walk_right: { from: 12, to: 15, loop: true, speed: 8 },
            idle_down: { from: 0, to: 0 },
            idle_up: { from: 4, to: 4 },
            idle_left: { from: 8, to: 8 },
            idle_right: { from: 12, to: 12 },
        },
    });

    loadSprite("cappucino_anim", "sprites/cappuccino_spritesheet.png", {
        sliceX: 4,
        sliceY: 4,
        anims: {
            walk_down: { from: 0, to: 3, loop: true, speed: 8 },
            walk_up: { from: 4, to: 7, loop: true, speed: 8 },
            walk_left: { from: 8, to: 11, loop: true, speed: 8 },
            walk_right: { from: 12, to: 15, loop: true, speed: 8 },
            idle_down: { from: 0, to: 0 },
            idle_up: { from: 4, to: 4 },
            idle_left: { from: 8, to: 8 },
            idle_right: { from: 12, to: 12 },
        },
    });
}
