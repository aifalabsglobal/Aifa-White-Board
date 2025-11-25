import { create } from 'zustand';

interface RecordingState {
    isRecording: boolean;
    screenStream: MediaStream | null;
    cameraStream: MediaStream | null;
    mediaRecorder: MediaRecorder | null;
    recordedChunks: Blob[];
    startTime: number | null;

    startRecording: (screenStream: MediaStream, cameraStream: MediaStream | null) => void;
    stopRecording: () => Promise<Blob | null>;
    addChunk: (chunk: Blob) => void;
    cleanup: () => void;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
    isRecording: false,
    screenStream: null,
    cameraStream: null,
    mediaRecorder: null,
    recordedChunks: [],
    startTime: null,

    startRecording: (screenStream: MediaStream, cameraStream: MediaStream | null) => {
        set({
            isRecording: true,
            screenStream,
            cameraStream,
            recordedChunks: [],
            startTime: Date.now(),
        });

        // Listen for stream end
        screenStream.getTracks().forEach(track => {
            track.addEventListener('ended', () => {
                get().cleanup();
            });
        });
    },

    stopRecording: async () => {
        const { recordedChunks, mediaRecorder } = get();

        return new Promise((resolve) => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.addEventListener('stop', () => {
                    const blob = new Blob(recordedChunks, { type: 'video/webm' });
                    get().cleanup();
                    resolve(blob);
                });
                mediaRecorder.stop();
            } else {
                get().cleanup();
                resolve(null);
            }
        });
    },

    addChunk: (chunk: Blob) => {
        set(state => ({
            recordedChunks: [...state.recordedChunks, chunk],
        }));
    },

    cleanup: () => {
        const { screenStream, cameraStream } = get();

        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }

        set({
            isRecording: false,
            screenStream: null,
            cameraStream: null,
            mediaRecorder: null,
            recordedChunks: [],
            startTime: null,
        });
    },
}));
