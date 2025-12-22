// Game constants
export const TILE_SIZE = 64;
export const GRID_WIDTH = 15;
export const GRID_HEIGHT = 11;
export const BOMB_TIMER = 2.5;
export const EXPLOSION_DURATION = 0.8;
export const MAX_TIME = 120; // 2 minutes

// Player configs
export const PLAYERS = [
    {
        name: "Tung Tung",
        spriteFront: "tungtung_front",
        spriteBack: "tungtung_back",
        spriteAnim: "tungtung_anim",
        keys: { up: "w", down: "s", left: "a", right: "d", bomb: "space" }
    },
    {
        name: "Meowl",
        spriteFront: "meowl_front",
        spriteBack: "meowl_back",
        spriteAnim: "meowl_anim",
        keys: { up: "up", down: "down", left: "left", right: "right", bomb: "enter" }
    },
    {
        name: "Strawberry",
        spriteFront: "strawberry_front",
        spriteBack: "strawberry_back",
        spriteAnim: "strawberry_anim",
        keys: { up: "i", down: "k", left: "j", right: "l", bomb: "o" }
    },
    {
        name: "Cappucino",
        spriteFront: "cappucino_front",
        spriteBack: "cappucino_back",
        spriteAnim: "cappucino_anim",
        keys: { up: "t", down: "g", left: "f", right: "h", bomb: "y" }
    },
];

// Start positions (corners)
export const START_POSITIONS = [
    { x: 1, y: 1 },
    { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2 },
    { x: GRID_WIDTH - 2, y: 1 },
    { x: 1, y: GRID_HEIGHT - 2 },
];

