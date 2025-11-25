'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Plus, Loader, Clock, Search, FolderOpen } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useModal } from '@/components/providers/ModalProvider';

interface Board {
    id: string;
    title: string;
    updatedAt: string;
    workspaceId?: string;
}

interface WorkspaceWithBoards {
    id: string;
    name: string;
    boards: Board[];
}

export default function BoardsPage() {
    const router = useRouter();
    const { showAlert } = useModal();
    const [workspaces, setWorkspaces] = useState<WorkspaceWithBoards[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewBoardDialog, setShowNewBoardDialog] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadWorkspaces();
    }, []);

    const loadWorkspaces = async () => {
        try {
            const res = await fetch('/api/workspaces');
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(data);
                // Set first workspace as default for new boards
                if (data.length > 0 && !selectedWorkspaceId) {
                    setSelectedWorkspaceId(data[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading workspaces:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async () => {
        if (!newBoardTitle.trim() || !selectedWorkspaceId || creating) return;

        setCreating(true);
        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newBoardTitle,
                    workspaceId: selectedWorkspaceId,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.board) {
                    // Navigate to the new board
                    router.push(`/board/${data.board.id}`);
                }
            } else {
                const error = await res.json();
                showAlert('Error', error.error || 'Failed to create board', 'danger');
            }
        } catch (error) {
            console.error('Error creating board:', error);
            showAlert('Error', 'Failed to create board', 'danger');
        } finally {
            setCreating(false);
        }
    };

    const navigateToBoard = (boardId: string) => {
        router.push(`/board/${boardId}`);
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

    // Get all boards across workspaces and filter by search
    const allBoards = workspaces.flatMap(w =>
        w.boards.map(b => ({ ...b, workspaceName: w.name, workspaceId: w.id }))
    );

    const filteredBoards = allBoards.filter(board =>
        board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.workspaceName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort by most recent
    const sortedBoards = [...filteredBoards].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
                    <p className="text-gray-600 font-medium">Loading your boards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
            {/* Top Bar */}
            <TopBar showBackButton={false} />

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                All Boards
                            </h1>
                            <p className="text-gray-600">
                                {sortedBoards.length} {sortedBoards.length === 1 ? 'board' : 'boards'} available
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNewBoardDialog(true)}
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
                    {sortedBoards.length === 0 ? (
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
                                    : 'Create your first board to get started'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setShowNewBoardDialog(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                                >
                                    <Plus size={20} />
                                    Create Board
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sortedBoards.map((board) => (
                                <button
                                    key={board.id}
                                    onClick={() => navigateToBoard(board.id)}
                                    className="group bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all text-left"
                                >
                                    {/* Board Icon */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Layout className="text-blue-600" size={24} />
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <Clock size={12} />
                                            <span>{formatDate(board.updatedAt)}</span>
                                        </div>
                                    </div>

                                    {/* Board Title */}
                                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-lg">
                                        {board.title}
                                    </h3>

                                    {/* Workspace Badge */}
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <FolderOpen size={12} />
                                        <span className="truncate">{board.workspaceName}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* New Board Dialog */}
            {showNewBoardDialog && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
                    style={{ zIndex: 'var(--z-modal)' }}
                    onClick={() => !creating && setShowNewBoardDialog(false)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Board</h2>
                        <p className="text-gray-600 mb-6">Enter a name for your new board.</p>

                        {/* Board Title Input */}
                        <input
                            type="text"
                            value={newBoardTitle}
                            onChange={(e) => setNewBoardTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                            placeholder="e.g., Project Planning"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                            autoFocus
                            disabled={creating}
                        />

                        {/* Workspace Selector */}
                        {workspaces.length > 1 && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Workspace
                                </label>
                                <select
                                    value={selectedWorkspaceId || ''}
                                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={creating}
                                >
                                    {workspaces.map((workspace) => (
                                        <option key={workspace.id} value={workspace.id}>
                                            {workspace.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowNewBoardDialog(false)}
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
