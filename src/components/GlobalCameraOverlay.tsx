'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRecordingStore } from '@/store/recordingStore';

export default function GlobalCameraOverlay() {
    const { isRecording, cameraStream } = useRecordingStore();
    const videoRef = useRef<HTMLVideoElement>(null);

    // Default position: bottom-right (will be adjusted on mount/resize if needed)
    // Default position: bottom-right
    const [position, setPosition] = useState(() => {
        if (typeof window !== 'undefined') {
            return {
                x: window.innerWidth - 180 - 24, // width - size - margin
                y: window.innerHeight - 180 - 24
            };
        }
        return { x: 0, y: 0 };
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
            videoRef.current.play().catch((error) => {
                console.error('Error playing camera video:', error);
            });
        }

        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [cameraStream]);

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
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

            // Constrain to viewport
            const size = 160; // Diameter
            const maxX = window.innerWidth - size;
            const maxY = window.innerHeight - size;

            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(0, Math.min(newY, maxY));

            setPosition({ x: constrainedX, y: constrainedY });
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
    }, [isDragging, dragOffset]);

    if (!isRecording || !cameraStream) {
        return null;
    }

    return (
        <div
            className={`fixed z-[80] rounded-full shadow-2xl overflow-hidden cursor-move transition-shadow hover:shadow-xl ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '160px',
                height: '160px',
                // Ensure no border is visible, just the shadow and content
            }}
            onMouseDown={handleMouseDown}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-cover transform scale-x-[-1]"
                autoPlay
                playsInline
                muted
            />
            {/* Optional: Minimal recording indicator overlay */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full pointer-events-none">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            </div>
        </div>
    );
}
