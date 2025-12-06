'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RecordingManager } from '@/utils/recordingManager';
import CameraOverlay from './CameraOverlay';
import RecordingControls from './RecordingControls';
import RecordingSettings, { type RecordingPreferences } from './RecordingSettings';

interface ScreenRecorderProps {
    boardId?: string;
    onRecordingComplete?: (blob: Blob) => void;
}

const DEFAULT_SETTINGS: RecordingPreferences = {
    microphoneId: '',
    cameraId: '',
    quality: '1080p',
    frameRate: 30,
    includeMicrophone: true,
    includeCamera: false,
};

export default function ScreenRecorder({ boardId, onRecordingComplete }: ScreenRecorderProps) {
    const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
    const [duration, setDuration] = useState(0);
    const [showCamera, setShowCamera] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<RecordingPreferences>(DEFAULT_SETTINGS);

    const recorderRef = useRef<RecordingManager | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('recordingPreferences');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    }, []);

    useEffect(() => {
        if (status === 'recording') {
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [status]);

    const handleSaveSettings = useCallback((newSettings: RecordingPreferences) => {
        setSettings(newSettings);
        localStorage.setItem('recordingPreferences', JSON.stringify(newSettings));
    }, []);

    const handleStop = useCallback(async () => {
        if (!recorderRef.current) return;

        try {
            const blob = await recorderRef.current.stopRecording();
            setRecordedBlob(blob);
            setStatus('stopped');

            recorderRef.current.cleanup();
            recorderRef.current = null;
            setCameraStream(null);
            setShowCamera(false);

            setTimeout(() => {
                setStatus('idle');
            }, 100);

            onRecordingComplete?.(blob);
        } catch (error: any) {
            console.error('Failed to stop recording:', error);
            setError(error.message || 'Failed to stop recording');
        }
    }, [onRecordingComplete]);

    const handleStart = useCallback(async () => {
        try {
            setError(null);
            const recorder = new RecordingManager();
            recorderRef.current = recorder;

            const screenStream = await recorder.getScreenStream();

            screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                handleStop();
            });

            const streams: MediaStream[] = [screenStream];

            if (settings.includeMicrophone) {
                try {
                    const audioStream = await recorder.getAudioStream(settings.microphoneId);
                    streams.push(audioStream);
                } catch (error) {
                    console.error('Microphone error:', error);
                    setError('Could not access microphone. Recording without audio.');
                }
            }

            if (settings.includeCamera) {
                try {
                    const camStream = await recorder.getCameraStream(settings.cameraId, settings.quality);
                    streams.push(camStream);
                    setCameraStream(camStream);
                    setShowCamera(true);
                } catch (error) {
                    console.error('Camera error:', error);
                    setError('Could not access camera. Recording without camera.');
                }
            }

            const combinedStream = recorder.combineStreams(...streams);

            recorder.createRecorder(combinedStream, {
                videoBitsPerSecond: settings.quality === '4K' ? 8000000 : settings.quality === '1080p' ? 2500000 : 1500000,
                audioBitsPerSecond: 128000,
            });

            recorder.startRecording();
            setStatus('recording');
            setDuration(0);
        } catch (error: any) {
            console.error('Failed to start recording:', error);
            setError(error.message || 'Failed to start recording');
            setStatus('idle');
        }
    }, [settings]);

    const handlePause = useCallback(() => {
        if (recorderRef.current) {
            recorderRef.current.pauseRecording();
            setStatus('paused');
        }
    }, []);

    const handleResume = useCallback(() => {
        if (recorderRef.current) {
            recorderRef.current.resumeRecording();
            setStatus('recording');
        }
    }, []);



    const handleDownload = useCallback(() => {
        if (recordedBlob) {
            RecordingManager.downloadRecording(recordedBlob);
            setRecordedBlob(null);
        }
    }, [recordedBlob]);

    const handleToggleCamera = useCallback(() => {
        if (status === 'idle') {
            return;
        }
        setShowCamera((prev) => !prev);
    }, [status]);

    useEffect(() => {
        return () => {
            if (recorderRef.current) {
                recorderRef.current.cleanup();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    return (
        <>
            <RecordingControls
                status={status}
                duration={duration}
                showCamera={showCamera && cameraStream !== null}
                hasRecording={recordedBlob !== null}
                onStart={handleStart}
                onStop={handleStop}
                onPause={handlePause}
                onResume={handleResume}
                onToggleCamera={handleToggleCamera}
                onSettings={() => setShowSettings(true)}
                onDownload={handleDownload}
            />

            {showCamera && cameraStream && (
                <CameraOverlay
                    stream={cameraStream}
                    onClose={() => setShowCamera(false)}
                />
            )}

            <RecordingSettings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={handleSaveSettings}
                currentSettings={settings}
            />

            {error && (
                <div className="fixed top-4 right-4 z-[101] max-w-md">
                    <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">Recording Error</p>
                            <p className="text-sm mt-1 opacity-90">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="flex-shrink-0 hover:bg-red-600 rounded p-1 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
