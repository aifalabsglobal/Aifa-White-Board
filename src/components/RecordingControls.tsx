'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Circle, Square, Pause, Play, Video, VideoOff, Settings, Download, GripVertical } from 'lucide-react';
import { useRecordingStore } from '@/store/recordingStore';

interface RecordingControlsProps {
    status: 'idle' | 'recording' | 'paused' | 'stopped';
    duration: number;
    showCamera: boolean;
    hasRecording: boolean;
    onStart: () => void;
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
    onToggleCamera: () => void;
    onSettings: () => void;
    onDownload: () => void;
}

export default function RecordingControls({
    status,
    duration,
    showCamera,
    hasRecording,
    onStart,
    onStop,
    onPause,
    onResume,
    onToggleCamera,
    onSettings,
    onDownload,
}: RecordingControlsProps) {
    const [audioLevel, setAudioLevel] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const { recordedChunks } = useRecordingStore();

    // Format duration as MM:SS
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Simulate audio level
    useEffect(() => {
        if (status === 'recording') {
            const interval = setInterval(() => {
                setAudioLevel(Math.random() * 100);
            }, 100);

            return () => {
                clearInterval(interval);
                setAudioLevel(0);
            };
        }
    }, [status]);

    // Generate download URL when recording stops
    useEffect(() => {
        if (status === 'idle' && hasRecording && recordedChunks.length > 0 && !downloadUrl) {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            return () => {
                URL.revokeObjectURL(url);
                setDownloadUrl(null);
            };
        }
    }, [status, hasRecording, recordedChunks, downloadUrl]);

    const isRecording = status === 'recording';
    const isPaused = status === 'paused';
    const isIdle = status === 'idle';

    return (
        <div className="absolute top-full right-0 mt-4 z-50 min-w-[340px]">
            <div
                className={`
                    bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/60
                    p-4 flex items-center gap-4 transition-all duration-300
                    ${isRecording ? 'ring-2 ring-red-500/50' : ''}
                    ${isPaused ? 'ring-2 ring-yellow-500/50' : ''}
                `}
            >
                {/* Main Control Button */}
                {isIdle && !hasRecording && (
                    <button
                        onClick={onStart}
                        className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <Circle size={20} className="fill-current" />
                        <span>Start Recording</span>
                    </button>
                )}

                {/* Download Button (When recording is ready) */}
                {isIdle && hasRecording && downloadUrl && (
                    <a
                        href={downloadUrl}
                        download={`aifa-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`}
                        className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        onClick={(e) => {
                            // Optional: Trigger any cleanup or analytics here
                            // e.preventDefault(); // Don't prevent default, we want the download
                        }}
                    >
                        <Download size={20} />
                        <span>Save Recording</span>
                    </a>
                )}

                {(isRecording || isPaused) && (
                    <>
                        {/* Timer */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                            {isRecording && (
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            )}
                            {isPaused && (
                                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                            )}
                            <span className="font-mono text-lg font-bold text-gray-800 tabular-nums">
                                {formatDuration(duration)}
                            </span>
                        </div>

                        {/* Pause/Resume Button */}
                        {isRecording ? (
                            <button
                                onClick={onPause}
                                className="p-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white transition-all shadow-md hover:shadow-lg"
                                title="Pause"
                            >
                                <Pause size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={onResume}
                                className="p-3 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all shadow-md hover:shadow-lg"
                                title="Resume"
                            >
                                <Play size={20} className="ml-0.5" />
                            </button>
                        )}

                        {/* Stop Button */}
                        <button
                            onClick={onStop}
                            className="p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-md hover:shadow-lg"
                            title="Stop Recording"
                        >
                            <Square size={20} className="fill-current" />
                        </button>

                        {/* Divider */}
                        <div className="w-px h-8 bg-gray-300" />

                        {/* Audio Level Indicator */}
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                                    style={{
                                        height: `${audioLevel}%`,
                                        transform: 'translateY(100%)',
                                        animation: isRecording ? 'slideUp 0.1s ease-out forwards' : 'none',
                                    }}
                                />
                            </div>
                            <style jsx>{`
                                @keyframes slideUp {
                                    to {
                                        transform: translateY(0);
                                    }
                                }
                            `}</style>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-8 bg-gray-300" />
                    </>
                )}

                {/* Camera Toggle */}
                <button
                    onClick={onToggleCamera}
                    className={`p-3 rounded-xl transition-all shadow-md hover:shadow-lg ${showCamera
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                    title={showCamera ? 'Hide Camera' : 'Show Camera'}
                    disabled={isIdle && !hasRecording}
                >
                    {showCamera ? <Video size={20} /> : <VideoOff size={20} />}
                </button>

                {/* Settings Button */}
                <button
                    onClick={onSettings}
                    className="p-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all shadow-md hover:shadow-lg"
                    title="Settings"
                    disabled={isRecording || isPaused}
                >
                    <Settings size={20} />
                </button>

                {/* Start New Recording (if has recording) */}
                {isIdle && hasRecording && (
                    <button
                        onClick={onStart}
                        className="p-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 transition-all shadow-md hover:shadow-lg"
                        title="Start New Recording"
                    >
                        <Circle size={20} className="fill-current" />
                    </button>
                )}
            </div>

            {/* Status Text */}
            {isRecording && (
                <div className="mt-2 text-center bg-white/90 backdrop-blur px-3 py-1 rounded-lg shadow-sm border border-gray-100 inline-block ml-auto w-full">
                    <p className="text-xs text-gray-500 font-medium">
                        Recording in progress...
                    </p>
                </div>
            )}
            {isPaused && (
                <div className="mt-2 text-center bg-white/90 backdrop-blur px-3 py-1 rounded-lg shadow-sm border border-gray-100 inline-block ml-auto w-full">
                    <p className="text-xs text-yellow-600 font-medium">
                        Recording paused
                    </p>
                </div>
            )}
            {isIdle && hasRecording && (
                <div className="mt-2 text-center bg-white/90 backdrop-blur px-3 py-1 rounded-lg shadow-sm border border-gray-100 inline-block ml-auto w-full">
                    <p className="text-xs text-green-600 font-medium">
                        Recording ready to save
                    </p>
                </div>
            )}
        </div>
    );
}
