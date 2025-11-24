'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, Plus, Loader, Search, Users, Layout as LayoutIcon } from 'lucide-react';
import TopBar from '@/components/TopBar';

interface Workspace {
    id: string;
    name: string;
    boards: any[];
    members?: any[];
    updatedAt: string;
}

export default function WorkspacesPage() {
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
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
            const res = await fetch('/api/workspaces/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newWorkspaceName }),
            });

            if (res.ok) {
                setShowCreateDialog(false);
                setNewWorkspaceName('');
                await loadWorkspaces();
            } else {
                alert('Failed to create workspace');
            }
        } catch (error) {
            console.error('Error creating workspace:', error);
            alert('Failed to create workspace');
        } finally {
            setCreating(false);
        }
    };

    const filteredWorkspaces = workspaces.filter(workspace =>
        workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays < 1) return 'Today';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
                    <p className="text-gray-600 font-medium">Loading workspaces...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
            <TopBar />

            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Workspaces</h1>
                            <p className="text-gray-600">
                                {filteredWorkspaces.length} {filteredWorkspaces.length === 1 ? 'workspace' : 'workspaces'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium"
                        >
                            <Plus size={20} />
                            <span>New Workspace</span>
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
                                placeholder="Search workspaces..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Workspaces Grid */}
                    {filteredWorkspaces.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Folder className="text-gray-400" size={40} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Create your first workspace to organize your boards'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setShowCreateDialog(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                                >
                                    <Plus size={20} />
                                    Create Workspace
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredWorkspaces.map((workspace) => (
                                <button
                                    key={workspace.id}
                                    onClick={() => router.push(`/workspaces/${workspace.id}`)}
                                    className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all text-left"
                                >
                                    {/* Workspace Icon */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Folder className="text-blue-600" size={24} />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatDate(workspace.updatedAt)}
                                        </div>
                                    </div>

                                    {/* Workspace Name */}
                                    <h3 className="font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 text-lg">
                                        {workspace.name}
                                    </h3>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <LayoutIcon size={14} />
                                            <span>{workspace.boards?.length || 0} boards</span>
                                        </div>
                                        {workspace.members && workspace.members.length > 0 && (
                                            <div className="flex items-center gap-1.5">
                                                <Users size={14} />
                                                <span>{workspace.members.length} members</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Workspace Dialog */}
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Workspace</h2>
                        <p className="text-gray-600 mb-6">Enter a name for your new workspace.</p>

                        <input
                            type="text"
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                            placeholder="e.g., Team Projects"
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
        </div>
    );
}
