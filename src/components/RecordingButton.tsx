'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Video, StopCircle, CheckCircle, Loader } from 'lucide-react';
import { useRecordingStore } from '@/store/recordingStore';
import { useModal } from '@/components/providers/ModalProvider';

interface RecordingButtonProps {
    boardId: string;
}

export default function RecordingButton({ boardId }: RecordingButtonProps) {
    const { isRecording, startRecording, stopRecording } = useRecordingStore();
    const { showAlert } = useModal();
    const [recordingTime, setRecordingTime] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [starting, setStarting] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);

    // Timer for recording duration
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartRecording = async () => {
        setStarting(true);
        try {
            // Request screen sharing
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            // Request camera (optional - don't fail if denied)
            let cameraStream: MediaStream | null = null;
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
            } catch (err) {
                console.log('Camera not available:', err);
            }

            // Update global store
            startRecording(screenStream, cameraStream);

            // Combine streams for recording
            const combinedStream = new MediaStream();

            // Add screen video and audio
            screenStream.getTracks().forEach(track => combinedStream.addTrack(track));

            // Create MediaRecorder
            chunksRef.current = [];
            startTimeRef.current = Date.now();

            const recorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9',
            });

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current = recorder;
            recorder.start(1000); // Collect data every second

        } catch (error) {
            console.error('Error starting recording:', error);
            showAlert('Recording Failed', 'Failed to start recording. Please allow screen sharing.', 'danger');
        } finally {
            setStarting(false);
        }
    };

    const handleStopRecording = async () => {
        if (!mediaRecorderRef.current) return;

        const recorder = mediaRecorderRef.current;

        // Stop the recorder and wait for final data
        await new Promise<void>((resolve) => {
            recorder.addEventListener('stop', () => resolve(), { once: true });
            recorder.stop();
        });

        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Download to desktop
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aifa-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Save metadata to database
        try {
            await fetch('/api/recording-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boardId,
                    title: 'Board Recording',
                    durationSec,
                    videoUrl: null, // Not storing file on server
                }),
            });
        } catch (error) {
            console.error('Error saving recording metadata:', error);
        }

        // Cleanup global store
        stopRecording();

        // Show success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Cleanup refs
        mediaRecorderRef.current = null;
        chunksRef.current = [];
    };

    if (starting) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white">
                <Loader className="animate-spin text-blue-600" size={18} />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">Starting...</span>
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-300 text-green-700">
                <CheckCircle size={18} />
                <span className="text-sm font-medium hidden sm:inline">Saved to desktop!</span>
            </div>
        );
    }

    if (isRecording) {
        return (
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
        );
    }

    return (
        <button
            onClick={handleStartRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all shadow-sm hover:shadow-md"
            title="Start Recording"
        >
            <Video size={18} />
            <span className="text-sm font-medium hidden sm:inline">Record</span>
        </button>
    );
}
