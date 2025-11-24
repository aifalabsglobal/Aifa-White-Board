'use client';

import React, { useRef, useEffect, useState } from 'react';
import { X, Move, Maximize2, Minimize2 } from 'lucide-react';

interface CameraOverlayProps {
    stream: MediaStream | null;
    onClose: () => void;
    onPositionChange?: (position: { x: number; y: number }) => void;
}

type CameraSize = 'small' | 'medium' | 'large';

const SIZES = {
    small: { width: 120, height: 120 },
    medium: { width: 180, height: 180 },
    large: { width: 240, height: 240 },
};

export default function CameraOverlay({ stream, onClose, onPositionChange }: CameraOverlayProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [position, setPosition] = useState({ x: window.innerWidth - 250, y: window.innerHeight - 250 });
    const [size, setSize] = useState<CameraSize>('medium');
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isFlipped, setIsFlipped] = useState(true);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((error) => {
                console.error('Error playing video:', error);
            });
        }

        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [stream]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.camera-controls')) {
            return;
        }

        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            const maxX = window.innerWidth - SIZES[size].width - 20;
            const maxY = window.innerHeight - SIZES[size].height - 20;

            const constrainedX = Math.max(20, Math.min(newX, maxX));
            const constrainedY = Math.max(20, Math.min(newY, maxY));

            setPosition({ x: constrainedX, y: constrainedY });
            onPositionChange?.({ x: constrainedX, y: constrainedY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, size, onPositionChange]);

    const toggleSize = () => {
        setSize((prev) => {
            if (prev === 'small') return 'medium';
            if (prev === 'medium') return 'large';
            return 'small';
        });
    };

    const currentSize = SIZES[size];

    return (
        <div
            ref={containerRef}
            className={`fixed z-50 group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${currentSize.width}px`,
                height: `${currentSize.height}px`,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Circular Camera Feed */}
            <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-white/30 backdrop-blur-sm ring-4 ring-black/10">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{
                        transform: isFlipped ? 'scaleX(-1)' : 'none',
                    }}
                />

                {/* Overlay Controls */}
                <div className="camera-controls absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/60 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-full">
                    <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 px-2">
                            <Move size={14} className="text-white cursor-move" />
                            <span className="text-white text-xs font-medium">Drag</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleSize}
                                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                                title="Change Size"
                            >
                                {size === 'large' ? (
                                    <Minimize2 size={12} className="text-white" />
                                ) : (
                                    <Maximize2 size={12} className="text-white" />
                                )}
                            </button>

                            <button
                                onClick={() => setIsFlipped(!isFlipped)}
                                className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white text-xs font-bold"
                                title="Flip Camera"
                            >
                                ⇄
                            </button>

                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-red-500/80 transition-colors"
                                title="Hide Camera"
                            >
                                <X size={12} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recording Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/70 backdrop-blur px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-xs font-medium">Live</span>
                </div>
            </div>
        </div>
    );
}
