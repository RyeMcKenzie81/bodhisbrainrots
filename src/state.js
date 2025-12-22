export const gameState = {
    players: [],
    gameStarted: false,
};

// Game configuration (set by selection screens)
export const gameConfig = {
    mode: "multiplayer", // "singleplayer" or "multiplayer"
    playerCount: 4,
    playerCharacters: [0, 1, 2, 3], // Which character index each player chose
    difficulty: "medium", // "easy", "medium", "hard" (for singleplayer)
};
