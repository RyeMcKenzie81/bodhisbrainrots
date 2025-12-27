import { createGameState, SIM_CONSTANTS } from '../src/sim/state.js';
import { applyInput, tick } from '../src/sim/game.js';

const rooms = new Map(); // roomId -> roomObject
const PLAYERS_PER_ROOM = 4;
const TICK_RATE = 15; // Hz
const TICK_INTERVAL = 1000 / TICK_RATE;

export function handleConnection(ws) {
    let currentRoomId = null;
    let playerId = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const type = data.type;

            if (type === 'create_room') {
                const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                const room = createRoom(roomId);

                playerId = `p${room.players.length}`;
                const player = {
                    id: playerId,
                    ws: ws,
                    name: data.name || `Player 1`,
                    ready: false,
                    connected: true,
                    characterIndex: 0
                };

                room.players.push(player);
                player.wins = 0;
                player.losses = 0;
                console.log(`[SERVER] Player ${playerId} initialized stats: 0-0`);
                // Add player to simulation state
                addPlayerToSim(room.state, playerId);

                currentRoomId = roomId;
                rooms.set(roomId, room);

                ws.send(JSON.stringify({
                    type: 'room_created',
                    roomId,
                    playerId,
                    state: room.state // Send initial state
                }));

                console.log(`Room ${roomId} created by ${playerId}`);
            }

            else if (type === 'join_room') {
                const roomId = data.roomId;
                const room = rooms.get(roomId);

                if (!room) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
                    return;
                }

                if (room.players.length >= PLAYERS_PER_ROOM) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
                    return;
                }

                currentRoomId = roomId;
                playerId = `p${room.players.length}`;

                const player = {
                    id: playerId,
                    ws: ws,
                    name: data.name || `Player ${room.players.length + 1}`,
                    ready: false,
                    connected: true,
                    characterIndex: 0
                };

                room.players.push(player);
                player.wins = 0;
                player.losses = 0;
                addPlayerToSim(room.state, playerId);

                // Notify new player
                ws.send(JSON.stringify({
                    type: 'room_joined',
                    roomId,
                    playerId,
                    players: room.players.map(p => ({ id: p.id, name: p.name, ready: p.ready })),
                    state: room.state
                }));

                // Notify others
                broadcastToRoom(room, {
                    type: 'player_joined',
                    player: {
                        id: playerId,
                        name: player.name,
                        ready: player.ready,
                        wins: player.wins,
                        losses: player.losses
                    }
                });

                console.log(`${playerId} joined room ${roomId}`);
            }

            else if (type === 'input') {
                if (currentRoomId) {
                    const room = rooms.get(currentRoomId);
                    if (room) {
                        applyInput(room.state, playerId, data.input);
                    }
                }
            }

            else if (type === 'ready') {
                if (currentRoomId) {
                    const room = rooms.get(currentRoomId);
                    const player = room.players.find(p => p.id === playerId);
                    if (player) {
                        player.ready = true;
                        broadcastToRoom(room, {
                            type: 'player_ready',
                            playerId: playerId
                        });
                    }
                }
            }

            else if (type === 'update_character') {
                if (currentRoomId) {
                    const room = rooms.get(currentRoomId);
                    const player = room.players.find(p => p.id === playerId);
                    if (player) {
                        player.characterIndex = data.characterIndex;

                        // Also update simulation state
                        const simPlayer = room.state.players.find(p => p.id === playerId);
                        if (simPlayer) {
                            simPlayer.characterIndex = data.characterIndex;
                        }

                        broadcastToRoom(room, {
                            type: 'player_updated',
                            player: player
                        });
                    }
                }
            }

            // Host can update room settings
            else if (type === 'update_settings') {
                if (currentRoomId && playerId === 'p0') { // Only host
                    const room = rooms.get(currentRoomId);
                    if (room && !room.state.gameStarted) {
                        // Update room settings
                        if (data.timeLimit !== undefined) {
                            room.settings.timeLimit = data.timeLimit;
                        }
                        if (data.playerSpeed !== undefined) {
                            room.settings.playerSpeed = data.playerSpeed;
                        }

                        // Recreate state with new settings (preserves players)
                        const oldPlayers = room.state.players;
                        room.state = createGameState(room.id, room.settings);
                        room.state.players = oldPlayers;

                        // Update state settings reference
                        room.state.settings = {
                            timeLimit: room.settings.timeLimit,
                            playerSpeed: room.settings.playerSpeed,
                            endless: room.settings.timeLimit === 0,
                        };

                        // Broadcast to all players
                        broadcastToRoom(room, {
                            type: 'settings_updated',
                            settings: room.settings
                        });

                        console.log(`[SERVER] Room ${room.id} settings updated:`, room.settings);
                    }
                }
            }

            // Host can explicitly start the game (even solo for testing)
            else if (type === 'start_game') {
                if (currentRoomId) {
                    const room = rooms.get(currentRoomId);
                    // Only host (first player) can start
                    if (playerId === 'p0' && room.players.length >= 1) {
                        console.log(`Host starting game in room ${currentRoomId} with ${room.players.length} player(s)`);
                        startGameLoop(room);
                    }
                }
            }

        } catch (e) {
            console.error('Invalid message:', e);
        }
    });

    ws.on('close', () => {
        if (currentRoomId && playerId) {
            const room = rooms.get(currentRoomId);
            if (room) {
                const player = room.players.find(p => p.id === playerId);
                if (player) {
                    player.connected = false;
                    console.log(`${playerId} disconnected from ${currentRoomId}`);
                    // For MVP maybe just mark disconnect or remove?
                    // Implementation Plan said hold slot, so we'll just mark connected=false for now.
                }
            }
        }
    });
}

function createRoom(id) {
    // Default settings (host can modify in lobby)
    const settings = {
        timeLimit: 120,    // 2 minutes (0 = endless)
        playerSpeed: 175,  // Base speed
    };

    return {
        id,
        players: [], // { id, ws, name, ready }
        settings,    // Configurable by host
        state: createGameState(id, settings),
        interval: null
    };
}

function addPlayerToSim(state, id, characterIndex = 0) {
    // Determine start position based on player count/index
    const idx = state.players.length;
    let startX = 100;
    let startY = 100;

    // Simple corners logic
    if (idx === 0) { startX = SIM_CONSTANTS.TILE_SIZE * 1.5; startY = SIM_CONSTANTS.TILE_SIZE * 1.5; } // Top-Left
    if (idx === 1) { startX = SIM_CONSTANTS.TILE_SIZE * (SIM_CONSTANTS.GRID_WIDTH - 1.5); startY = SIM_CONSTANTS.TILE_SIZE * (SIM_CONSTANTS.GRID_HEIGHT - 1.5); } // Bottom-Right
    if (idx === 2) { startX = SIM_CONSTANTS.TILE_SIZE * (SIM_CONSTANTS.GRID_WIDTH - 1.5); startY = SIM_CONSTANTS.TILE_SIZE * 1.5; } // Top-Right
    if (idx === 3) { startX = SIM_CONSTANTS.TILE_SIZE * 1.5; startY = SIM_CONSTANTS.TILE_SIZE * (SIM_CONSTANTS.GRID_HEIGHT - 1.5); } // Bottom-Left
    if (idx === 4) {
        startX = SIM_CONSTANTS.TILE_SIZE * (SIM_CONSTANTS.GRID_WIDTH / 2);
        startY = SIM_CONSTANTS.TILE_SIZE * (SIM_CONSTANTS.GRID_HEIGHT / 2);
    } // Center (5th Player)

    state.players.push({
        id: id,
        pos: { x: startX, y: startY },
        characterIndex: characterIndex,
        alive: true,
        brainCount: SIM_CONSTANTS.MAX_BRAINS,
        brainsPlaced: 0,
        fireRange: SIM_CONSTANTS.FIRE_RANGE,
        speed: SIM_CONSTANTS.PLAYER_SPEED,
        intent: { dx: 0, dy: 0 },
        facing: 'down',
        isMoving: false
    });
}

function broadcastToRoom(room, msg) {
    const data = JSON.stringify(msg);
    room.players.forEach(p => {
        if (p.ws.readyState === 1) { // OPEN
            p.ws.send(data);
        }
    });
}

function startGameLoop(room) {
    if (room.interval) clearInterval(room.interval);

    console.log(`Starting game loop for room ${room.id}`);
    broadcastToRoom(room, { type: 'game_start' });

    room.interval = setInterval(() => {
        const dt = TICK_INTERVAL / 1000;
        tick(room.state, dt);

        // Broadcast state to all clients
        broadcastToRoom(room, {
            type: 'snapshot',
            state: room.state,
            time: Date.now()
        });

        // Stop loop if game is over
        // Stop loop if game is over
        if (room.state.gameOver) {
            console.log(`Game Over in room ${room.id}. Restarting in 10s.`);
            clearInterval(room.interval);
            room.interval = null;

            // Update Stats
            room.players.forEach(p => {
                if (p.id === room.state.winner) {
                    p.wins = (p.wins || 0) + 1;
                } else if (room.state.players.find(sp => sp.id === p.id)) {
                    // Only count loss if they were in the simulation (aka played)
                    p.losses = (p.losses || 0) + 1;
                }
            });

            // Broadcast Game Over with next round info AND updated stats
            const updatedPlayers = room.players.map(p => ({
                id: p.id,
                name: p.name,
                ready: p.ready,
                wins: p.wins || 0,
                losses: p.losses || 0
            }));

            broadcastToRoom(room, {
                type: 'game_over',
                winner: room.state.winner,
                restartDelay: 10,
                players: updatedPlayers
            });

            // Schedule Restart
            setTimeout(() => {
                console.log(`Restarting room ${room.id}`);

                // Preserve players list but reset state
                const players = room.players.filter(p => p.connected); // Keep only connected
                room.state = createGameState(room.id);
                room.players = players; // Keep references

                // Re-add players to simulation
                players.forEach(p => {
                    addPlayerToSim(room.state, p.id, p.characterIndex || 0);
                });

                startGameLoop(room);
            }, 10000);
        }

    }, TICK_INTERVAL);
}
