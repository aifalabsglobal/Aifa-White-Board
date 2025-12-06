/**
 * RecordingManager - Handles all media stream and recording operations
 */

export interface RecordingOptions {
    audioBitsPerSecond?: number;
    videoBitsPerSecond?: number;
    mimeType?: string;
}

export interface RecordingPreferences {
    microphoneId?: string;
    cameraId?: string;
    quality: '720p' | '1080p' | '4K';
    frameRate: 30 | 60;
    includeMicrophone: boolean;
    includeCamera: boolean;
}

export class RecordingManager {
    private screenStream: MediaStream | null = null;
    private audioStream: MediaStream | null = null;
    private cameraStream: MediaStream | null = null;
    private combinedStream: MediaStream | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];

    /**
     * Get screen capture stream
     */
    async getScreenStream(): Promise<MediaStream> {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'browser',
                } as any,
                audio: true, // Capture system audio from the screen share
            });

            this.screenStream = stream;
            return stream;
        } catch (error) {
            console.error('Error getting screen stream:', error);
            throw new Error('Failed to capture screen. Please grant permission.');
        }
    }

    /**
     * Get microphone audio stream
     */
    async getAudioStream(deviceId?: string): Promise<MediaStream> {
        try {
            const constraints: MediaStreamConstraints = {
                audio: deviceId
                    ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
                    : { echoCancellation: true, noiseSuppression: true },
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.audioStream = stream;
            return stream;
        } catch (error) {
            console.error('Error getting audio stream:', error);
            throw new Error('Failed to access microphone. Please grant permission.');
        }
    }

    /**
     * Get camera video stream
     */
    async getCameraStream(deviceId?: string, quality: '720p' | '1080p' | '4K' = '1080p'): Promise<MediaStream> {
        try {
            const resolutions = {
                '720p': { width: 1280, height: 720 },
                '1080p': { width: 1920, height: 1080 },
                '4K': { width: 3840, height: 2160 },
            };

            const resolution = resolutions[quality];

            const constraints: MediaStreamConstraints = {
                video: deviceId
                    ? {
                        deviceId: { exact: deviceId },
                        width: { ideal: resolution.width },
                        height: { ideal: resolution.height },
                        frameRate: { ideal: 30 },
                    }
                    : {
                        width: { ideal: resolution.width },
                        height: { ideal: resolution.height },
                        frameRate: { ideal: 30 },
                    },
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.cameraStream = stream;
            return stream;
        } catch (error) {
            console.error('Error getting camera stream:', error);
            throw new Error('Failed to access camera. Please grant permission.');
        }
    }

    /**
     * Combine multiple media streams into one
     */
    combineStreams(...streams: MediaStream[]): MediaStream {
        const combinedStream = new MediaStream();

        streams.forEach((stream) => {
            stream.getTracks().forEach((track) => {
                combinedStream.addTrack(track);
            });
        });

        this.combinedStream = combinedStream;
        return combinedStream;
    }

    /**
     * Create MediaRecorder instance
     */
    createRecorder(stream: MediaStream, options?: RecordingOptions): MediaRecorder {
        // Determine best supported MIME type
        const mimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
        ];

        let mimeType = options?.mimeType;
        if (!mimeType) {
            mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || 'video/webm';
        }

        const recorderOptions: MediaRecorderOptions = {
            mimeType,
            videoBitsPerSecond: options?.videoBitsPerSecond || 2500000, // 2.5 Mbps
            audioBitsPerSecond: options?.audioBitsPerSecond || 128000, // 128 kbps
        };

        try {
            const recorder = new MediaRecorder(stream, recorderOptions);

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder = recorder;
            return recorder;
        } catch (error) {
            console.error('Error creating MediaRecorder:', error);
            throw new Error('Failed to create recorder. Your browser may not support recording.');
        }
    }

    /**
     * Start recording
     */
    startRecording(): void {
        if (!this.mediaRecorder) {
            throw new Error('MediaRecorder not initialized. Call createRecorder first.');
        }

        this.recordedChunks = [];
        this.mediaRecorder.start(100); // Collect data every 100ms
    }

    /**
     * Pause recording
     */
    pauseRecording(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
        }
    }

    /**
     * Resume recording
     */
    resumeRecording(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
        }
    }

    /**
     * Stop recording and return the recorded blob
     */
    async stopRecording(): Promise<Blob> {
        return new Promise<Blob>((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error('No active recording'));
                return;
            }

            this.mediaRecorder.onstop = () => {
                const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
                const blob = new Blob(this.recordedChunks, { type: mimeType });
                resolve(blob);
            };

            this.mediaRecorder.onerror = (event: any) => {
                reject(new Error(`Recording error: ${event.error}`));
            };

            if (this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            } else {
                // Already stopped
                const mimeType = this.mediaRecorder.mimeType || 'video/webm';
                const blob = new Blob(this.recordedChunks, { type: mimeType });
                resolve(blob);
            }
        });
    }

    /**
     * Get current recording state
     */
    getRecorderState(): RecordingState | null {
        return this.mediaRecorder?.state || null;
    }

    /**
     * Clean up all streams and resources
     */
    cleanup(): void {
        // Stop all tracks in all streams
        [this.screenStream, this.audioStream, this.cameraStream, this.combinedStream].forEach((stream) => {
            stream?.getTracks().forEach((track) => {
                track.stop();
            });
        });

        // Clear references
        this.screenStream = null;
        this.audioStream = null;
        this.cameraStream = null;
        this.combinedStream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
    }

    /**
     * Get available media devices
     */
    static async getDevices(): Promise<{
        microphones: MediaDeviceInfo[];
        cameras: MediaDeviceInfo[];
    }> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            const microphones = devices.filter((device) => device.kind === 'audioinput');
            const cameras = devices.filter((device) => device.kind === 'videoinput');

            return { microphones, cameras };
        } catch (error) {
            console.error('Error enumerating devices:', error);
            return { microphones: [], cameras: [] };
        }
    }

    /**
     * Download blob as file
     */
    static downloadRecording(blob: Blob, filename?: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename || `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;

        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    /**
     * Format file size for display
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}

export type RecordingState = 'inactive' | 'recording' | 'paused';
