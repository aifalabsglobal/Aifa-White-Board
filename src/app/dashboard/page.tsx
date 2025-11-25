'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, Plus, Loader, Clock, ChevronRight, Layout, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useModal } from '@/components/providers/ModalProvider';

interface Board {
    id: string;
    title: string;
    updatedAt: string;
}

interface WorkspaceWithBoards {
    id: string;
    name: string;
    boards: Board[];
    updatedAt?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { showAlert, showConfirm } = useModal();
    const [workspaces, setWorkspaces] = useState<WorkspaceWithBoards[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedWorkspace, setExpandedWorkspace] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Create workspace state
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [creating, setCreating] = useState(false);

    // Delete workspace state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadWorkspaces();
    }, []);

    const loadWorkspaces = async () => {
        try {
            const res = await fetch('/api/workspaces');
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(data);
            }
        } catch (error) {
            console.error('Error loading workspaces:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim() || creating) return;

        setCreating(true);
        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newWorkspaceName }),
            });

            if (res.ok) {
                setShowCreateDialog(false);
                setNewWorkspaceName('');
                await loadWorkspaces();
            } else {
                const error = await res.json();
                showAlert('Error', error.error || 'Failed to create workspace', 'danger');
            }
        } catch (error) {
            console.error('Error creating workspace:', error);
            showAlert('Error', 'Failed to create workspace', 'danger');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!workspaceToDelete || deleting) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/workspaces/${workspaceToDelete}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setShowDeleteDialog(false);
                setWorkspaceToDelete(null);
                await loadWorkspaces();
            } else {
                const error = await res.json();
                showAlert('Error', error.error || 'Failed to delete workspace', 'danger');
            }
        } catch (error) {
            console.error('Error deleting workspace:', error);
            showAlert('Error', 'Failed to delete workspace', 'danger');
        } finally {
            setDeleting(false);
        }
    };

    const confirmDelete = (workspaceId: string) => {
        setWorkspaceToDelete(workspaceId);
        setShowDeleteDialog(true);
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

    const toggleWorkspace = (workspaceId: string) => {
        setExpandedWorkspace(expandedWorkspace === workspaceId ? null : workspaceId);
    };


    if (!mounted || loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
                    <p className="text-gray-600 font-medium">Loading your workspaces...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" suppressHydrationWarning>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                My Workspaces
                            </h1>
                            <p className="text-gray-600">
                                Select a board to start working
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                        >
                            <Plus size={20} />
                            <span className="font-medium">New Workspace</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {workspaces.length === 0 ? (
                    <Card className="shadow-lg">
                        <EmptyState
                            icon={Folder}
                            title="No workspaces yet"
                            description="Create your first workspace to organize your boards and start collaborating with your team."
                            action={
                                <button
                                    onClick={() => setShowCreateDialog(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                                >
                                    <Plus size={20} />
                                    Create Workspace
                                </button>
                            }
                        />
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {workspaces.map((workspace) => (
                            <Card key={workspace.id} className="shadow-md overflow-hidden">
                                <div onClick={() => toggleWorkspace(workspace.id)} className="w-full cursor-pointer">
                                    <CardHeader className="hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                                                    <Folder className="text-white" size={24} />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-xl font-semibold text-gray-900">{workspace.name}</h3>
                                                    <p className="text-sm text-gray-500">{workspace.boards.length} {workspace.boards.length === 1 ? 'board' : 'boards'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); confirmDelete(workspace.id); }} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Delete workspace">
                                                    <Trash2 size={18} />
                                                </button>
                                                <ChevronRight className={`text-gray-400 transition-transform ${expandedWorkspace === workspace.id ? 'rotate-90' : ''}`} size={24} />
                                            </div>
                                        </div>
                                    </CardHeader>
                                </div>

                                {expandedWorkspace === workspace.id && (
                                    <CardContent className="pt-4 pb-6">
                                        {workspace.boards.length === 0 ? (
                                            <div className="py-8 text-center">
                                                <Layout className="mx-auto mb-3 text-gray-300" size={48} />
                                                <p className="text-gray-500 mb-4">No boards in this workspace yet</p>
                                                <button onClick={() => {/* TODO: Create board */ }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                                    <Plus size={16} />
                                                    Create First Board
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {workspace.boards.map((board) => (
                                                    <button key={board.id} onClick={() => navigateToBoard(board.id)} className="group relative p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all text-left">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Layout className="text-blue-600" size={20} />
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                <Clock size={12} />
                                                                <span>{formatDate(board.updatedAt)}</span>
                                                            </div>
                                                        </div>
                                                        <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{board.title}</h4>
                                                        <p className="text-xs text-gray-500">Click to open</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Workspace Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !creating && setShowCreateDialog(false)}>
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Workspace</h2>
                        <p className="text-gray-600 mb-6">Enter a name for your new workspace. A default board will be created for you.</p>

                        <input
                            type="text"
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                            placeholder="e.g., My Team Workspace"
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
                                onClick={handleCreateWorkspace}
                                disabled={!newWorkspaceName.trim() || creating}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {creating ? (
                                    <>
                                        <Loader className="animate-spin" size={16} />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Workspace'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Workspace Confirmation Dialog */}
            {showDeleteDialog && workspaceToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !deleting && setShowDeleteDialog(false)}>
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Delete Workspace</h2>
                        <p className="text-gray-700 mb-2">Are you sure you want to delete this workspace?</p>
                        <p className="text-sm text-gray-600 mb-6">This will permanently delete the workspace and all its boards. This action cannot be undone.</p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteWorkspace}
                                disabled={deleting}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <Loader className="animate-spin" size={16} />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Workspace'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}