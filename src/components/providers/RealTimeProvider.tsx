'use client';

/**
 * RealTimeProvider - React context for real-time collaboration
 * 
 * Provides:
 * - Socket.io connection management
 * - User presence tracking
 * - Cursor synchronization
 * - Stroke operation broadcasting
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';
import { Stroke } from '@/store/whiteboardStore';

export interface RemoteUser {
    socketId: string;
    userId: string;
    userName: string;
    userColor: string;
    cursor?: { x: number; y: number };
}

export interface StrokeOperation {
    type: 'add' | 'update' | 'delete' | 'clear';
    stroke?: Stroke;
    strokeId?: string;
    pageId: string;
    userId: string;
    timestamp: number;
    senderId?: string;
}

interface RealTimeContextType {
    isConnected: boolean;
    remoteUsers: RemoteUser[];
    remoteCursors: Map<string, { x: number; y: number; color: string; name: string }>;
    mySocketId: string | null;
    myColor: string | null;

    // Actions
    joinBoard: (boardId: string, pageId: string) => void;
    leaveBoard: () => void;
    broadcastCursor: (x: number, y: number) => void;
    broadcastStrokeOperation: (operation: Omit<StrokeOperation, 'userId' | 'timestamp'>) => void;

    // Event handlers (set by canvas)
    onRemoteStrokeOperation?: (operation: StrokeOperation) => void;
    setOnRemoteStrokeOperation: (handler: (operation: StrokeOperation) => void) => void;
}

const RealTimeContext = createContext<RealTimeContextType | null>(null);

export function useRealTime() {
    const context = useContext(RealTimeContext);
    if (!context) {
        throw new Error('useRealTime must be used within a RealTimeProvider');
    }
    return context;
}

interface RealTimeProviderProps {
    children: React.ReactNode;
}

export function RealTimeProvider({ children }: RealTimeProviderProps) {
    const { user, isLoaded } = useUser();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const [remoteCursors, setRemoteCursors] = useState<Map<string, { x: number; y: number; color: string; name: string }>>(new Map());
    const [mySocketId, setMySocketId] = useState<string | null>(null);
    const [myColor, setMyColor] = useState<string | null>(null);

    const currentBoardRef = useRef<{ boardId: string; pageId: string } | null>(null);
    const onRemoteStrokeOperationRef = useRef<((operation: StrokeOperation) => void) | undefined>();

    // Throttle cursor updates
    const lastCursorUpdate = useRef<number>(0);
    const CURSOR_THROTTLE_MS = 50; // 20 FPS max

    // Initialize socket connection
    useEffect(() => {
        if (!isLoaded) return;

        const socketInstance = io({
            path: '/api/socket',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
            console.log('[RealTime] Connected to server');
            setIsConnected(true);

            // Rejoin board if we were in one
            if (currentBoardRef.current && user) {
                socketInstance.emit('join-board', {
                    boardId: currentBoardRef.current.boardId,
                    pageId: currentBoardRef.current.pageId,
                    userId: user.id,
                    userName: user.fullName || user.emailAddresses[0]?.emailAddress || 'Anonymous'
                });
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('[RealTime] Disconnected from server');
            setIsConnected(false);
        });

        socketInstance.on('joined', (data: { socketId: string; userColor: string; users: RemoteUser[] }) => {
            console.log('[RealTime] Joined room:', data);
            setMySocketId(data.socketId);
            setMyColor(data.userColor);
            // Filter out self from users
            setRemoteUsers(data.users.filter(u => u.socketId !== data.socketId));
        });

        socketInstance.on('presence-update', (users: RemoteUser[]) => {
            // Filter out self
            const others = users.filter(u => u.socketId !== socketInstance.id);
            setRemoteUsers(others);
        });

        socketInstance.on('cursor-update', (data: {
            socketId: string;
            cursor: { x: number; y: number };
            userColor: string;
            userName: string;
        }) => {
            setRemoteCursors(prev => {
                const updated = new Map(prev);
                updated.set(data.socketId, {
                    x: data.cursor.x,
                    y: data.cursor.y,
                    color: data.userColor,
                    name: data.userName
                });
                return updated;
            });
        });

        socketInstance.on('stroke-operation', (operation: StrokeOperation) => {
            console.log('[RealTime] Received stroke operation:', operation.type);
            if (onRemoteStrokeOperationRef.current) {
                onRemoteStrokeOperationRef.current(operation);
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [isLoaded, user]);

    // Remove stale cursors
    useEffect(() => {
        const interval = setInterval(() => {
            // Remove cursors of users who left
            setRemoteCursors(prev => {
                const updated = new Map(prev);
                const activeSocketIds = new Set(remoteUsers.map(u => u.socketId));
                for (const socketId of updated.keys()) {
                    if (!activeSocketIds.has(socketId)) {
                        updated.delete(socketId);
                    }
                }
                return updated;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [remoteUsers]);

    const joinBoard = useCallback((boardId: string, pageId: string) => {
        if (!socket || !user) return;

        currentBoardRef.current = { boardId, pageId };

        socket.emit('join-board', {
            boardId,
            pageId,
            userId: user.id,
            userName: user.fullName || user.emailAddresses[0]?.emailAddress || 'Anonymous'
        });
    }, [socket, user]);

    const leaveBoard = useCallback(() => {
        currentBoardRef.current = null;
        setRemoteUsers([]);
        setRemoteCursors(new Map());
    }, []);

    const broadcastCursor = useCallback((x: number, y: number) => {
        if (!socket || !isConnected) return;

        const now = Date.now();
        if (now - lastCursorUpdate.current < CURSOR_THROTTLE_MS) return;
        lastCursorUpdate.current = now;

        socket.emit('cursor-move', { x, y });
    }, [socket, isConnected]);

    const broadcastStrokeOperation = useCallback((operation: Omit<StrokeOperation, 'userId' | 'timestamp'>) => {
        if (!socket || !isConnected || !user) return;

        socket.emit('stroke-operation', {
            ...operation,
            userId: user.id,
            timestamp: Date.now()
        });
    }, [socket, isConnected, user]);

    const setOnRemoteStrokeOperation = useCallback((handler: (operation: StrokeOperation) => void) => {
        onRemoteStrokeOperationRef.current = handler;
    }, []);

    const value: RealTimeContextType = {
        isConnected,
        remoteUsers,
        remoteCursors,
        mySocketId,
        myColor,
        joinBoard,
        leaveBoard,
        broadcastCursor,
        broadcastStrokeOperation,
        setOnRemoteStrokeOperation
    };

    return (
        <RealTimeContext.Provider value={value}>
            {children}
        </RealTimeContext.Provider>
    );
}
