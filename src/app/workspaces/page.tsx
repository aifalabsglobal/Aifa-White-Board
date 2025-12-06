'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, Plus, Loader, Search, Users, Layout as LayoutIcon, ChevronRight } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import TopBar from '@/components/TopBar';
import RecordingHistory from '@/components/RecordingHistory';

interface Workspace {
    id: string;
    name: string;
    boards: any[];
    members?: any[];
    updatedAt: string;
}

export default function WorkspacesPage() {
    const router = useRouter();
    const { isLoaded, userId } = useAuth();
    const { user } = useUser();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isLoaded && userId) {
            loadWorkspaces();
        } else if (isLoaded && !userId) {
            router.push('/'); // Redirect to home if not logged in
        }
    }, [isLoaded, userId, router]);

    const loadWorkspaces = async () => {
        try {
            const res = await fetch('/api/workspaces');
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error loading workspaces:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newWorkspaceName }),
            });

            if (res.ok) {
                setNewWorkspaceName('');
                setShowCreateDialog(false);
                loadWorkspaces();
            }
        } catch (error) {
            console.error('Error creating workspace:', error);
        } finally {
            setCreating(false);
        }
    };

    const filteredWorkspaces = workspaces.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isLoaded || !userId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopBar workspaceName="Dashboard" showBackButton={false} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Workspaces (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">My Workspaces</h1>
                            <button
                                onClick={() => setShowCreateDialog(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus size={20} />
                                New Workspace
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search workspaces..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader className="animate-spin text-blue-600" size={32} />
                            </div>
                        ) : filteredWorkspaces.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 border-dashed">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Folder className="text-gray-400" size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No workspaces found</h3>
                                <p className="text-gray-500 mb-4">Get started by creating your first workspace</p>
                                <button
                                    onClick={() => setShowCreateDialog(true)}
                                    className="text-blue-600 font-medium hover:underline"
                                >
                                    Create new workspace
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredWorkspaces.map((workspace) => (
                                    <div
                                        key={workspace.id}
                                        onClick={() => router.push(`/workspaces/${workspace.id}`)}
                                        className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="text-blue-400" size={20} />
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                                                <LayoutIcon size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                                                    {workspace.name}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <LayoutIcon size={14} />
                                                        {workspace.boards?.length || 0} boards
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users size={14} />
                                                        {workspace.members?.length || 1} members
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-3">
                                                    Updated {new Date(workspace.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Profile & History (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                            <div className="px-6 pb-6">
                                <div className="relative flex justify-between items-end -mt-12 mb-4">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center text-2xl font-bold text-blue-600 bg-blue-50">
                                            <img
                                                src={user?.imageUrl}
                                                alt={user?.fullName || 'User'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
                                    <p className="text-gray-500 text-sm mb-4">{user?.primaryEmailAddress?.emailAddress}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recording History */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Recordings</h2>
                            <RecordingHistory />
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Workspace Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Workspace</h2>
                        <form onSubmit={handleCreateWorkspace}>
                            <input
                                type="text"
                                placeholder="Workspace Name"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateDialog(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newWorkspaceName.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Workspace'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
