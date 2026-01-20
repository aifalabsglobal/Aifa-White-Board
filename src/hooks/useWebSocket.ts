'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
    pageId: string | null;
    onSync?: (content: any) => void;
    onUserJoined?: (data: { userId: string; connectedUsers: number }) => void;
    onUserLeft?: (data: { userId: string; connectedUsers: number }) => void;
}

interface UseWebSocketReturn {
    status: ConnectionStatus;
    connectedUsers: number;
    save: (content: any, thumbnail?: string) => void;
    lastSavedAt: Date | null;
    error: string | null;
}

export function useWebSocket({
    pageId,
    onSync,
    onUserJoined,
    onUserLeft,
}: UseWebSocketOptions): UseWebSocketReturn {
    const { user } = useUser();
    const socketRef = useRef<Socket | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [connectedUsers, setConnectedUsers] = useState(0);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reconnection state
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Throttle save calls
    const lastSaveTime = useRef<number>(0);
    const pendingSave = useRef<{ content: any; thumbnail?: string } | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const THROTTLE_MS = 500; // Minimum time between saves

    // Use refs for callbacks to avoid re-connecting when they change
    const onSyncRef = useRef(onSync);
    const onUserJoinedRef = useRef(onUserJoined);
    const onUserLeftRef = useRef(onUserLeft);

    useEffect(() => {
        onSyncRef.current = onSync;
        onUserJoinedRef.current = onUserJoined;
        onUserLeftRef.current = onUserLeft;
    }, [onSync, onUserJoined, onUserLeft]);

    const connect = useCallback(() => {
        if (!user?.id) return;

        setStatus('connecting');
        setError(null);

        const socket = io({
            transports: ['websocket', 'polling'],
            reconnection: false, // We handle reconnection manually
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('WebSocket connected');
            setStatus('connected');
            reconnectAttempts.current = 0;


        });

        socket.on('joined', (data) => {
            console.log('Joined page:', data);
            setConnectedUsers(data.connectedUsers);
        });

        socket.on('saved', (data) => {
            // console.log('Save confirmed:', data);
            setLastSavedAt(new Date(data.timestamp));
        });

        socket.on('save-error', (data) => {
            console.error('Save error:', data);
            setError(data.message);
        });

        socket.on('sync', (data) => {
            // console.log('Received sync from other user:', data);
            if (onSyncRef.current && data.userId !== user.id) {
                onSyncRef.current(data.content);
            }
        });

        socket.on('user-joined', (data) => {
            setConnectedUsers(data.connectedUsers);
            onUserJoinedRef.current?.(data);
        });

        socket.on('user-left', (data) => {
            setConnectedUsers(data.connectedUsers);
            onUserLeftRef.current?.(data);
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setStatus('disconnected');
            attemptReconnect();
        });

        socket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err);
            setStatus('error');
            setError(err.message);
            attemptReconnect();
        });
    }, [user?.id]);

    const attemptReconnect = useCallback(() => {
        if (reconnectAttempts.current >= maxReconnectAttempts) {
            setError('Max reconnection attempts reached');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Attempting reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);

        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
        }, delay);
    }, [connect]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setStatus('disconnected');
    }, []);

    // Initial Connection (Persistent across page changes)
    useEffect(() => {
        if (user?.id) {
            connect();
        }
        return () => disconnect();
    }, [user?.id, connect, disconnect]);

    // Handle Page/Room Switching
    useEffect(() => {
        if (status === 'connected' && socketRef.current && pageId && user?.id) {
            // Join the new page room (server handles leaving previous room)
            socketRef.current.emit('join-page', {
                pageId,
                userId: user.id,
            });
        }
    }, [pageId, status, user?.id]);

    // Flush pending save on unmount or page change
    useEffect(() => {
        return () => {
            // If we have a pending save when changing pages, flush it immediately (using the OLD pageId closed over)
            if (pendingSave.current && socketRef.current && status === 'connected' && pageId) {
                console.log('Flushing pending save for page', pageId);
                socketRef.current.emit('save', {
                    pageId,
                    content: pendingSave.current.content,
                    thumbnail: pendingSave.current.thumbnail,
                });
                pendingSave.current = null;
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [pageId, status]);

    // Throttled save function
    const save = useCallback((content: any, thumbnail?: string) => {
        if (!socketRef.current || status !== 'connected' || !pageId) {
            console.warn('Cannot save: WebSocket not connected');
            // Store pending save for when connection is restored
            pendingSave.current = { content, thumbnail };
            return;
        }

        const now = Date.now();
        const timeSinceLastSave = now - lastSaveTime.current;

        if (timeSinceLastSave < THROTTLE_MS) {
            // Throttle: schedule save for later
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            pendingSave.current = { content, thumbnail };
            saveTimeoutRef.current = setTimeout(() => {
                if (pendingSave.current && socketRef.current && status === 'connected') {
                    socketRef.current.emit('save', {
                        pageId,
                        content: pendingSave.current.content,
                        thumbnail: pendingSave.current.thumbnail,
                    });
                    lastSaveTime.current = Date.now();
                    pendingSave.current = null;
                }
            }, THROTTLE_MS - timeSinceLastSave);
        } else {
            // Send immediately
            socketRef.current.emit('save', { pageId, content, thumbnail });
            lastSaveTime.current = now;
            pendingSave.current = null;
        }
    }, [status, pageId]);

    // Send pending save when connection is restored
    useEffect(() => {
        if (status === 'connected' && pendingSave.current && socketRef.current && pageId) {
            socketRef.current.emit('save', {
                pageId,
                content: pendingSave.current.content,
                thumbnail: pendingSave.current.thumbnail,
            });
            lastSaveTime.current = Date.now();
            pendingSave.current = null;
        }
    }, [status, pageId]);

    return {
        status,
        connectedUsers,
        save,
        lastSavedAt,
        error,
    };
}
