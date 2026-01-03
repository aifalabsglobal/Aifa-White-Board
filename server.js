/**
 * Custom Next.js server with Socket.io support
 * Run with: node server.js
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store for active rooms and users
const rooms = new Map();

// Generate a random color for user cursor
function generateUserColor() {
    const colors = [
        '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    // Initialize Socket.io
    const io = new Server(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
            origin: dev
                ? ['http://localhost:3000', 'http://127.0.0.1:3000']
                : process.env.NEXT_PUBLIC_APP_URL,
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        let currentRoom = null;
        let currentUser = null;

        // Join a board room
        socket.on('join-board', (data) => {
            const roomId = `${data.boardId}:${data.pageId}`;

            // Leave previous room if any
            if (currentRoom) {
                socket.leave(currentRoom);
                const roomUsers = rooms.get(currentRoom);
                if (roomUsers) {
                    roomUsers.delete(socket.id);
                    io.to(currentRoom).emit('presence-update', Array.from(roomUsers.values()));
                }
            }

            // Join new room
            socket.join(roomId);
            currentRoom = roomId;

            // Create user presence
            currentUser = {
                socketId: socket.id,
                userId: data.userId,
                userName: data.userName || 'Anonymous',
                userColor: generateUserColor(),
                lastSeen: Date.now()
            };

            // Add user to room
            if (!rooms.has(roomId)) {
                rooms.set(roomId, new Map());
            }
            rooms.get(roomId).set(socket.id, currentUser);

            // Notify others of new user
            const roomUsers = Array.from(rooms.get(roomId).values());
            io.to(roomId).emit('presence-update', roomUsers);

            // Send current user their socket id and color
            socket.emit('joined', {
                socketId: socket.id,
                userColor: currentUser.userColor,
                users: roomUsers
            });

            console.log(`[Socket] User ${data.userName} joined room ${roomId} (${roomUsers.length} users)`);
        });

        // Handle cursor movement (throttled on client)
        socket.on('cursor-move', (data) => {
            if (!currentRoom || !currentUser) return;

            currentUser.cursor = data;
            currentUser.lastSeen = Date.now();

            // Broadcast cursor position to others in the room
            socket.to(currentRoom).emit('cursor-update', {
                socketId: socket.id,
                cursor: data,
                userColor: currentUser.userColor,
                userName: currentUser.userName
            });
        });

        // Handle stroke operations
        socket.on('stroke-operation', (operation) => {
            if (!currentRoom) return;

            // Broadcast the stroke operation to all others in the room
            socket.to(currentRoom).emit('stroke-operation', {
                ...operation,
                senderId: socket.id
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);

            if (currentRoom) {
                const roomUsers = rooms.get(currentRoom);
                if (roomUsers) {
                    roomUsers.delete(socket.id);
                    io.to(currentRoom).emit('presence-update', Array.from(roomUsers.values()));

                    // Clean up empty rooms
                    if (roomUsers.size === 0) {
                        rooms.delete(currentRoom);
                    }
                }
            }
        });

        // Ping for presence heartbeat
        socket.on('ping-presence', () => {
            if (currentUser) {
                currentUser.lastSeen = Date.now();
            }
        });
    });

    // Cleanup stale users every 30 seconds
    setInterval(() => {
        const now = Date.now();
        const STALE_THRESHOLD = 60000; // 60 seconds

        for (const [roomId, users] of rooms) {
            for (const [socketId, user] of users) {
                if (now - user.lastSeen > STALE_THRESHOLD) {
                    users.delete(socketId);
                    io.to(roomId).emit('presence-update', Array.from(users.values()));
                }
            }
            if (users.size === 0) {
                rooms.delete(roomId);
            }
        }
    }, 30000);

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.io server running on /api/socket`);
    });
});
