'use client';

import React, { useState, useEffect } from 'react';
import { Video, StopCircle, CheckCircle } from 'lucide-react';
import ScreenRecorder from './ScreenRecorder';

interface RecordingButtonProps {
    boardId?: string;
}

export default function RecordingButton({ boardId }: RecordingButtonProps) {
    const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopped'>('idle');
    const [recordingTime, setRecordingTime] = useState(0);
    const [showRecorder, setShowRecorder] = useState(false);

    // Timer for recording duration
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (recordingState === 'recording') {
            interval = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [recordingState]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartRecording = () => {
        setRecordingState('recording');
        setShowRecorder(true);
    };

    const handleStopRecording = () => {
        setRecordingState('stopped');
        setShowRecorder(false);

        // Auto-reset to idle after 3 seconds
        setTimeout(() => {
            setRecordingState('idle');
        }, 3000);
    };

    return (
        <div className="relative">
            {/* Recording Button - Different states */}
            {recordingState === 'idle' && (
                <button
                    onClick={handleStartRecording}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all shadow-sm hover:shadow-md"
                    title="Start Recording"
                >
                    <Video size={18} />
                    <span className="text-sm font-medium hidden sm:inline">Record</span>
                </button>
            )}

            {recordingState === 'recording' && (
                <div className="flex items-center gap-3">
                    {/* Recording Indicator with Timer */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-300 text-red-600">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                        <span className="text-sm font-mono font-semibold">{formatTime(recordingTime)}</span>
                    </div>

                    {/* Stop Button */}
                    <button
                        onClick={handleStopRecording}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all shadow-md hover:shadow-lg"
                        title="Stop Recording"
                    >
                        <StopCircle size={18} />
                        <span className="text-sm font-medium hidden sm:inline">Stop</span>
                    </button>
                </div>
            )}

            {recordingState === 'stopped' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-300 text-green-700">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">Recording saved!</span>
                </div>
            )}

            {/* Screen Recorder Component */}
            {showRecorder && (
                <ScreenRecorder
                    boardId={boardId}
                    onRecordingComplete={(blob: Blob) => {
                        console.log('Recording complete:', blob.size, 'bytes');
                        handleStopRecording();
                    }}
                />
            )}
        </div>
    );
}
