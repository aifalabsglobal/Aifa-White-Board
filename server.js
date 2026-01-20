
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();

// Store active connections per page
const pageConnections = new Map();

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(server, {
        cors: {
            origin: dev ? ['http://localhost:3000'] : process.env.ALLOWED_ORIGINS?.split(',') || [],
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        let currentPageId = null;
        let userId = null;

        // Join a page room for collaborative editing
        socket.on('join-page', async (data) => {
            try {
                const { pageId, authToken } = data;

                // For now, we'll trust the client's auth token
                // In production, verify the token with Clerk
                userId = data.userId;
                currentPageId = pageId;

                // Leave any previous room
                if (socket.rooms.size > 1) {
                    socket.rooms.forEach((room) => {
                        if (room !== socket.id) {
                            socket.leave(room);
                        }
                    });
                }

                // Join the new page room
                socket.join(`page:${pageId}`);

                // Track connection
                if (!pageConnections.has(pageId)) {
                    pageConnections.set(pageId, new Set());
                }
                pageConnections.get(pageId).add(socket.id);

                console.log(`User ${userId} joined page ${pageId}`);

                // Notify client of successful join
                socket.emit('joined', {
                    pageId,
                    connectedUsers: pageConnections.get(pageId).size
                });

                // Notify others in the room
                socket.to(`page:${pageId}`).emit('user-joined', {
                    userId,
                    connectedUsers: pageConnections.get(pageId).size
                });
            } catch (error) {
                console.error('Error joining page:', error);
                socket.emit('error', { message: 'Failed to join page' });
            }
        });

        // Handle save events
        socket.on('save', async (data) => {
            try {
                const { pageId, content, thumbnail } = data;

                if (!pageId) {
                    socket.emit('save-error', { message: 'No page ID provided' });
                    return;
                }

                // Save to database
                const contentToSave = {
                    ...content,
                    thumbnail: thumbnail || content?.thumbnail,
                };

                await prisma.page.update({
                    where: { id: pageId },
                    data: { content: contentToSave },
                });

                // Confirm save to sender
                socket.emit('saved', {
                    pageId,
                    timestamp: new Date().toISOString()
                });

                // Broadcast to other clients in the same room
                socket.to(`page:${pageId}`).emit('sync', {
                    pageId,
                    content: contentToSave,
                    userId,
                    timestamp: new Date().toISOString()
                });

                console.log(`Page ${pageId} saved by user ${userId}`);
            } catch (error) {
                console.error('Error saving page:', error);
                socket.emit('save-error', {
                    message: 'Failed to save',
                    error: error.message
                });
            }
        });

        // Handle cursor position updates (for real-time collaboration)
        socket.on('cursor-move', (data) => {
            if (currentPageId) {
                socket.to(`page:${currentPageId}`).emit('cursor-update', {
                    userId,
                    position: data.position,
                    socketId: socket.id
                });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            if (currentPageId && pageConnections.has(currentPageId)) {
                pageConnections.get(currentPageId).delete(socket.id);

                // Notify others
                socket.to(`page:${currentPageId}`).emit('user-left', {
                    userId,
                    connectedUsers: pageConnections.get(currentPageId).size
                });

                // Clean up empty rooms
                if (pageConnections.get(currentPageId).size === 0) {
                    pageConnections.delete(currentPageId);
                }
            }
        });
    });

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> WebSocket server running`);
    });
});
