import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { handleConnection } from './rooms.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files from the 'dist' directory (Vite build output)
// We assume 'dist' is in the project root, so we go up one level from 'server'
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

console.log(`Serving static files from ${distPath}`);

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');
    handleConnection(ws);
    ws.on('error', console.error);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});
