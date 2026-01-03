/**
 * Real-Time Collaboration Server using Socket.io
 * 
 * This module handles:
 * - Real-time stroke synchronization
 * - User presence and cursor tracking
 * - Room management for different boards
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

export interface UserPresence {
    socketId: string;
    userId: string;
    userName: string;
    userColor: string;
    cursor?: { x: number; y: number };
    lastSeen: number;
}

export interface StrokeOperation {
    type: 'add' | 'update' | 'delete' | 'clear';
    stroke?: any;
    strokeId?: string;
    pageId: string;
    userId: string;
    timestamp: number;
}

// Store for active rooms and users
const rooms = new Map<string, Map<string, UserPresence>>();

// Generate a random color for user cursor
function generateUserColor(): string {
    const colors = [
        '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? process.env.NEXT_PUBLIC_APP_URL
                : ['http://localhost:3000', 'http://127.0.0.1:3000'],
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        let currentRoom: string | null = null;
        let currentUser: UserPresence | null = null;

        // Join a board room
        socket.on('join-board', (data: {
            boardId: string;
            pageId: string;
            userId: string;
            userName: string
        }) => {
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
            rooms.get(roomId)!.set(socket.id, currentUser);

            // Notify others of new user
            const roomUsers = Array.from(rooms.get(roomId)!.values());
            io.to(roomId).emit('presence-update', roomUsers);

            // Send current user their socket id and color
            socket.emit('joined', {
                socketId: socket.id,
                userColor: currentUser.userColor,
                users: roomUsers
            });

            console.log(`[Socket] User ${data.userName} joined room ${roomId}`);
        });

        // Handle cursor movement
        socket.on('cursor-move', (data: { x: number; y: number }) => {
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
        socket.on('stroke-operation', (operation: StrokeOperation) => {
            if (!currentRoom) return;

            // Broadcast the stroke operation to all others in the room
            socket.to(currentRoom).emit('stroke-operation', {
                ...operation,
                senderId: socket.id
            });

            console.log(`[Socket] Stroke ${operation.type} in room ${currentRoom}`);
        });

        // Handle page switch
        socket.on('switch-page', (data: { boardId: string; pageId: string }) => {
            if (!currentUser) return;

            // Re-emit join-board to switch rooms
            socket.emit('join-board', {
                boardId: data.boardId,
                pageId: data.pageId,
                userId: currentUser.userId,
                userName: currentUser.userName
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

    return io;
}
