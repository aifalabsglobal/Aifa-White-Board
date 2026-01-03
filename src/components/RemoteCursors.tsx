'use client';

/**
 * RemoteCursors - Displays other users' cursors on the canvas
 */

import React from 'react';
import { useRealTime } from '@/components/providers/RealTimeProvider';

interface RemoteCursorsProps {
    stageTransform: { scale: number; x: number; y: number };
}

export default function RemoteCursors({ stageTransform }: RemoteCursorsProps) {
    const { remoteCursors, isConnected } = useRealTime();

    if (!isConnected || remoteCursors.size === 0) return null;

    return (
        <>
            {Array.from(remoteCursors.entries()).map(([socketId, cursor]) => {
                // Convert scene coordinates to screen coordinates
                const screenX = cursor.x * stageTransform.scale + stageTransform.x;
                const screenY = cursor.y * stageTransform.scale + stageTransform.y;

                return (
                    <div
                        key={socketId}
                        className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
                        style={{
                            left: screenX,
                            top: screenY,
                            transform: 'translate(-2px, -2px)'
                        }}
                    >
                        {/* Cursor Icon */}
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                        >
                            <path
                                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .69-.59.33-.93L6.4 2.85a.5.5 0 0 0-.9.36z"
                                fill={cursor.color}
                                stroke="white"
                                strokeWidth="1.5"
                            />
                        </svg>

                        {/* User Name Label */}
                        <div
                            className="absolute left-5 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
                            style={{
                                backgroundColor: cursor.color,
                                maxWidth: '120px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {cursor.name.split(' ')[0] || 'User'}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
