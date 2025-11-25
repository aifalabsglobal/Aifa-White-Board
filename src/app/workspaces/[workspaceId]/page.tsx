'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Layout, Plus, Loader, ArrowLeft, Search, Clock } from 'lucide-react';
import TopBar from '@/components/TopBar';
import BoardActions from '@/components/BoardActions';
import { useModal } from '@/components/providers/ModalProvider';

interface Board {
    id: string;
    title: string;
    updatedAt: string;
}

interface Workspace {
    id: string;
    name: string;
    boards: Board[];
}

export default function WorkspaceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const { showAlert, showPrompt } = useModal();

    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadWorkspace();
    }, [workspaceId]);

    const loadWorkspace = async () => {
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}`);
            if (res.ok) {
                const data = await res.json();
                setWorkspace(data);
            }
        } catch (error) {
            console.error('Error loading workspace:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async () => {
        if (!newBoardTitle.trim() || creating) return;

        setCreating(true);
        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newBoardTitle,
                    workspaceId: workspaceId,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.board) {
                    router.push(`/board/${data.board.id}`);
                }
            } else {
                showAlert('Error', 'Failed to create board', 'danger');
            }
        } catch (error) {
            console.error('Error creating board:', error);
            showAlert('Error', 'Failed to create board', 'danger');
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const filteredBoards = (workspace?.boards ?? []).filter(board =>
        board.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
                    <p className="text-gray-600 font-medium">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Workspace not found</p>
                    <button
                        onClick={() => router.push('/workspaces')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Workspaces
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
            <TopBar workspaceName={workspace.name} currentWorkspaceId={workspaceId} />

            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Back Link */}
                    <button
                        onClick={() => router.push('/workspaces')}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span className="font-medium">All Workspaces</span>
                    </button>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{workspace.name}</h1>
                            <p className="text-gray-600">
                                {filteredBoards.length} {filteredBoards.length === 1 ? 'board' : 'boards'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium"
                        >
                            <Plus size={20} />
                            <span>New Board</span>
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search boards..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Boards Grid */}
                    {filteredBoards.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Layout className="text-gray-400" size={40} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {searchQuery ? 'No boards found' : 'No boards yet'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Create your first board in this workspace'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setShowCreateDialog(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                                >
                                    <Plus size={20} />
                                    Create Board
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredBoards.map((board) => (
                                <div
                                    key={board.id}
                                    className="group bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all relative"
                                >
                                    {/* Board Icon */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            onClick={() => router.push(`/board/${board.id}`)}
                                            className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer"
                                        >
                                            <Layout className="text-blue-600" size={24} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <Clock size={12} />
                                                <span>{formatDate(board.updatedAt)}</span>
                                            </div>
                                            <BoardActions
                                                boardId={board.id}
                                                boardTitle={board.title}
                                                onUpdate={loadWorkspace}
                                                onDelete={loadWorkspace}
                                            />
                                        </div>
                                    </div>

                                    {/* Board Title */}
                                    <h3
                                        onClick={() => router.push(`/board/${board.id}`)}
                                        className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-lg cursor-pointer"
                                    >
                                        {board.title}
                                    </h3>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Board Dialog */}
            {showCreateDialog && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
                    style={{ zIndex: 'var(--z-modal)' }}
                    onClick={() => !creating && setShowCreateDialog(false)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Board</h2>
                        <p className="text-gray-600 mb-6">Enter a name for your new board.</p>

                        <input
                            type="text"
                            value={newBoardTitle}
                            onChange={(e) => setNewBoardTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                            placeholder="e.g., Sprint Planning"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
                            autoFocus
                            disabled={creating}
                        />

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowCreateDialog(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={creating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateBoard}
                                disabled={!newBoardTitle.trim() || creating}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {creating ? (
                                    <>
                                        <Loader className="animate-spin" size={16} />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Board'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
