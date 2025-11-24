'use client';

import React, { useState } from 'react';
import { Video } from 'lucide-react';
import ScreenRecorder from './ScreenRecorder';

interface RecordingButtonProps {
    boardId?: string;
}

export default function RecordingButton({ boardId }: RecordingButtonProps) {
    const [isRecorderActive, setIsRecorderActive] = useState(false);

    return (
        <div className="relative">
            {/* Recording Button - Integrated in nav bar */}
            <button
                onClick={() => setIsRecorderActive(!isRecorderActive)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isRecorderActive
                    ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                title={isRecorderActive ? 'Recording Active' : 'Start Recording'}
            >
                <Video size={18} className={isRecorderActive ? 'animate-pulse' : ''} />
                <span className="text-sm font-medium hidden sm:inline">
                    {isRecorderActive ? 'Recording' : 'Record'}
                </span>
            </button>

            {/* Screen Recorder Component */}
            {isRecorderActive && (
                <ScreenRecorder
                    boardId={boardId}
                    onRecordingComplete={(blob: Blob) => {
                        console.log('Recording complete:', blob.size, 'bytes');
                    }}
                />
            )}
        </div>
    );
}
