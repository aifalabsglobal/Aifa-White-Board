'use client';

import React, { useState, useEffect } from 'react';
import { X, Mic, Video, Monitor } from 'lucide-react';

interface RecordingSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: RecordingPreferences) => void;
    currentSettings: RecordingPreferences;
}

export interface RecordingPreferences {
    microphoneId: string;
    cameraId: string;
    quality: '720p' | '1080p' | '4K';
    frameRate: 30 | 60;
    includeMicrophone: boolean;
    includeCamera: boolean;
}

export default function RecordingSettings({
    isOpen,
    onClose,
    onSave,
    currentSettings,
}: RecordingSettingsProps) {
    const [settings, setSettings] = useState<RecordingPreferences>(currentSettings);
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);

    // Load available devices
    useEffect(() => {
        const loadDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const mics = devices.filter((d) => d.kind === 'audioinput');
                const cams = devices.filter((d) => d.kind === 'videoinput');

                setMicrophones(mics);
                setCameras(cams);

                // Set defaults if not already set
                if (!settings.microphoneId && mics.length > 0) {
                    setSettings((prev) => ({ ...prev, microphoneId: mics[0].deviceId }));
                }
                if (!settings.cameraId && cams.length > 0) {
                    setSettings((prev) => ({ ...prev, cameraId: cams[0].deviceId }));
                }
            } catch (error) {
                console.error('Error loading devices:', error);
            }
        };

        if (isOpen) {
            loadDevices();
        }
    }, [isOpen]);

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Monitor size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Recording Settings</h2>
                            <p className="text-sm text-gray-600">Configure your recording preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                    <div className="space-y-6">
                        {/* Recording Modes */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recording Mode</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={settings.includeMicrophone}
                                        onChange={(e) =>
                                            setSettings({ ...settings, includeMicrophone: e.target.checked })
                                        }
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <Mic size={20} className="text-gray-600" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Include Microphone</p>
                                        <p className="text-sm text-gray-600">Record audio narration</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={settings.includeCamera}
                                        onChange={(e) =>
                                            setSettings({ ...settings, includeCamera: e.target.checked })
                                        }
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <Video size={20} className="text-gray-600" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Include Camera</p>
                                        <p className="text-sm text-gray-600">Show webcam overlay</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Microphone Selection */}
                        {settings.includeMicrophone && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Microphone
                                </label>
                                <select
                                    value={settings.microphoneId}
                                    onChange={(e) => setSettings({ ...settings, microphoneId: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {microphones.map((mic) => (
                                        <option key={mic.deviceId} value={mic.deviceId}>
                                            {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Camera Selection */}
                        {settings.includeCamera && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Camera
                                </label>
                                <select
                                    value={settings.cameraId}
                                    onChange={(e) => setSettings({ ...settings, cameraId: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {cameras.map((cam) => (
                                        <option key={cam.deviceId} value={cam.deviceId}>
                                            {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Video Quality */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Video Quality
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['720p', '1080p', '4K'] as const).map((quality) => (
                                    <button
                                        key={quality}
                                        onClick={() => setSettings({ ...settings, quality })}
                                        className={`px-4 py-3 rounded-lg font-medium transition-all ${settings.quality === quality
                                                ? 'bg-blue-500 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {quality}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Higher quality = larger file size
                            </p>
                        </div>

                        {/* Frame Rate */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Frame Rate
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {([30, 60] as const).map((fps) => (
                                    <button
                                        key={fps}
                                        onClick={() => setSettings({ ...settings, frameRate: fps })}
                                        className={`px-4 py-3 rounded-lg font-medium transition-all ${settings.frameRate === fps
                                                ? 'bg-blue-500 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {fps} FPS
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                60 FPS = smoother but larger files
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-lg hover:shadow-xl"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
