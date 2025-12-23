// Basic Event Emitter for socket messages
const eventListeners = {};

export const socket = {
    ws: null,
    connected: false,
    playerId: null,
    roomId: null,

    connect(url) {
        // If url is provided, use it. 
        // Otherwise try to determine from Env or Window.
        // If url is provided, use it. 
        // Otherwise try to determine from Env or Window.
        let targetUrl = url;
        if (!targetUrl) {
            try {
                // Check for Vite Env
                const envHost = import.meta.env.VITE_WS_HOST;
                if (envHost) {
                    targetUrl = envHost;
                }
            } catch (e) {
                // Ignore env error
            }

            if (!targetUrl) {
                // Fallback to relative protocol
                const protocol = window.location.protocol === "https:" ? "wss" : "ws";
                const host = window.location.hostname === "localhost" ? "localhost:3000" : window.location.host;
                targetUrl = `${protocol}://${host}`;
            }
        }

        this.ws = new WebSocket(targetUrl);

        this.ws.onopen = () => {
            console.log("Connected to server");
            this.connected = true;
            this.emit("connect");
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit("message", data);
                if (data.type) {
                    this.emit(data.type, data);
                }
            } catch (e) {
                console.error("Failed to parse message", e);
            }
        };

        this.ws.onclose = () => {
            console.log("Disconnected from server");
            this.connected = false;
            this.emit("disconnect");
        };

        this.ws.onerror = (err) => {
            console.error("Socket error", err);
            this.emit("error", err);
        };
    },

    send(type, payload = {}) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify({ type, ...payload }));
        }
    },

    on(event, callback) {
        if (!eventListeners[event]) {
            eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
    },

    off(event, callback) {
        if (!eventListeners[event]) return;
        eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
        if (eventListeners[event]) {
            eventListeners[event].forEach(cb => cb(data));
        }
    }
};
