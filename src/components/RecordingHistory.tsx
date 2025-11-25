'use client';

import { useEffect, useState } from 'react';
import { Video, Loader, FolderOpen, Layout } from 'lucide-react';

interface Recording {
    id: string;
    title: string;
    createdAt: string;
    durationSec: number | null;
    workspace: { id: string; name: string } | null;
    board: { id: string; title: string } | null;
}

export default function RecordingHistory() {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecordings();
    }, []);

    const fetchRecordings = async () => {
        try {
            const res = await fetch('/api/recording-sessions');
            if (res.ok) {
                const data = await res.json();
                setRecordings(data.sessions || []);
            }
        } catch (error) {
            console.error('Error fetching recordings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group recordings by workspace -> board
    const grouped = recordings.reduce((acc, rec) => {
        const wsName = rec.workspace?.name || 'Unknown Workspace';
        const wsId = rec.workspace?.id || 'unknown';
        const boardTitle = rec.board?.title || 'Unknown Board';
        const boardId = rec.board?.id || 'unknown';

        if (!acc[wsId]) {
            acc[wsId] = { name: wsName, boards: {} };
        }
        if (!acc[wsId].boards[boardId]) {
            acc[wsId].boards[boardId] = { title: boardTitle, recordings: [] };
        }

        acc[wsId].boards[boardId].recordings.push(rec);
        return acc;
    }, {} as Record<string, { name: string; boards: Record<string, { title: string; recordings: Recording[] }> }>);

    const formatDuration = (sec: number | null) => {
        if (!sec) return 'Unknown';
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (recordings.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recordings Yet</h3>
                <p className="text-gray-600">
                    Start recording on a board to see your recording history here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Recording History</h2>
                <span className="text-sm text-gray-500">
                    {recordings.length} {recordings.length === 1 ? 'recording' : 'recordings'}
                </span>
            </div>

            <div className="space-y-6">
                {Object.entries(grouped).map(([wsId, workspace]) => (
                    <div key={wsId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Workspace Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <FolderOpen className="text-blue-600" size={20} />
                                <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
                            </div>
                        </div>

                        {/* Boards */}
                        <div className="divide-y divide-gray-100">
                            {Object.entries(workspace.boards).map(([boardId, board]) => (
                                <div key={boardId} className="px-6 py-4">
                                    {/* Board Title */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <Layout className="text-purple-600" size={16} />
                                        <h4 className="font-medium text-gray-800">{board.title}</h4>
                                        <span className="text-xs text-gray-500">
                                            ({board.recordings.length} {board.recordings.length === 1 ? 'recording' : 'recordings'})
                                        </span>
                                    </div>

                                    {/* Recordings List */}
                                    <div className="space-y-2 ml-6">
                                        {board.recordings.map((rec) => (
                                            <div
                                                key={rec.id}
                                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <Video size={14} className="text-gray-400 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {rec.title}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                            <span>{formatDate(rec.createdAt)}</span>
                                                            <span>•</span>
                                                            <span>{formatDuration(rec.durationSec)}</span>
                                                            <span>•</span>
                                                            <span className="text-gray-400">Saved to desktop</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Recordings are automatically downloaded to your desktop when you stop recording.
                    This history shows metadata for reference.
                </p>
            </div>
        </div>
    );
}
