'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Save, Plus, Layout, ArrowLeft, Camera, Trash2, Edit2, LogOut, ExternalLink, Users } from 'lucide-react';

interface Workspace {
    id: string;
    name: string;
    userRole: string;
    ownerId: string;
    _count: {
        boards: number;
        members: number;
    };
    boards: { id: string; title: string }[];
    updatedAt: string;
}

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile states
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [image, setImage] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Workspace states
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [creatingWorkspace, setCreatingWorkspace] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null);
    const [editWorkspaceName, setEditWorkspaceName] = useState('');

    useEffect(() => {
        if (session?.user) {
            loadProfile();
            loadWorkspaces();
        }
    }, [session]);

    const loadProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.ok) {
                const data = await res.json();
                setName(data.user.name || '');
                setBio(data.user.bio || '');
                setPhone(data.user.phone || '');
                setLocation(data.user.location || '');
                setImage(data.user.image || '');
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    };

    const loadWorkspaces = async () => {
        try {
            const res = await fetch('/api/workspaces');
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to load workspaces:', error);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, bio, phone, location, image }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update profile');
            }

            // Only update name in session - image is too large for JWT
            // The UserMenu will fetch the image directly from the database
            await update({ name });

            // Reload to fetch fresh session with updated image URL
            window.location.reload();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;

        setCreatingWorkspace(true);
        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newWorkspaceName }),
            });

            if (!res.ok) throw new Error('Failed to create workspace');

            setNewWorkspaceName('');
            setMessage({ type: 'success', text: 'Workspace created successfully' });
            loadWorkspaces();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to create workspace' });
        } finally {
            setCreatingWorkspace(false);
        }
    };

    const handleRenameWorkspace = async (workspaceId: string) => {
        if (!editWorkspaceName.trim()) return;

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editWorkspaceName }),
            });

            if (!res.ok) throw new Error('Failed to rename workspace');

            setMessage({ type: 'success', text: 'Workspace renamed successfully' });
            setEditingWorkspace(null);
            loadWorkspaces();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to rename workspace' });
        }
    };

    const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
        if (!confirm(`Are you sure you want to delete "${workspaceName}"? This will delete all boards and cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete workspace');

            setMessage({ type: 'success', text: 'Workspace deleted successfully' });
            loadWorkspaces();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete workspace' });
        }
    };

    const handleLeaveWorkspace = async (workspaceId: string, workspaceName: string) => {
        if (!confirm(`Are you sure you want to leave "${workspaceName}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/leave`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error('Failed to leave workspace');

            setMessage({ type: 'success', text: 'Left workspace successfully' });
            loadWorkspaces();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to leave workspace' });
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getRoleBadgeColor = (role: string) => {
        const colors = {
            OWNER: 'bg-purple-100 text-purple-700',
            ADMIN: 'bg-blue-100 text-blue-700',
            MEMBER: 'bg-green-100 text-green-700',
            VIEWER: 'bg-gray-100 text-gray-700',
        };
        return colors[role as keyof typeof colors] || colors.VIEWER;
    };

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Board
                </button>

                <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile Settings</h1>
                <p className="text-gray-600 mb-8">Manage your personal information and workspaces</p>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Section */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <User size={24} />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900">Personal Information</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        {/* Profile Picture */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                    {image ? (
                                        <img src={image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        getInitials(name || session.user?.name || '')
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    <Camera size={16} className="text-gray-700" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Profile Picture</h3>
                                <p className="text-sm text-gray-600">Click the camera icon to upload (max 5MB)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={session.user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bio <span className="text-gray-500 text-xs">({bio.length}/500)</span>
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                maxLength={500}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location <span className="text-gray-500 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="New York, USA"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Workspace Management Section */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Layout size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">My Workspaces</h2>
                                <p className="text-sm text-gray-600">Manage and organize your workspaces</p>
                            </div>
                        </div>
                    </div>

                    {/* Create Workspace Form */}
                    <form onSubmit={handleCreateWorkspace} className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                placeholder="New workspace name..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={creatingWorkspace || !newWorkspaceName.trim()}
                                className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md whitespace-nowrap"
                            >
                                <Plus size={18} />
                                Create
                            </button>
                        </div>
                    </form>

                    {/* Workspaces Grid */}
                    {workspaces.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Layout size={48} className="mx-auto mb-3 opacity-30" />
                            <p>No workspaces yet. Create one to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {workspaces.map((workspace) => {
                                const isOwner = workspace.userRole === 'OWNER';
                                const canEdit = isOwner || workspace.userRole === 'ADMIN';

                                return (
                                    <div
                                        key={workspace.id}
                                        className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50"
                                    >
                                        {editingWorkspace === workspace.id ? (
                                            <div className="flex gap-2 mb-3">
                                                <input
                                                    type="text"
                                                    value={editWorkspaceName}
                                                    onChange={(e) => setEditWorkspaceName(e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleRenameWorkspace(workspace.id)}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingWorkspace(null)}
                                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{workspace.name}</h3>
                                                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(workspace.userRole)}`}>
                                                        {workspace.userRole}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                            <div className="flex items-center gap-1">
                                                <Layout size={14} />
                                                <span>{workspace._count.boards} boards</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users size={14} />
                                                <span>{workspace._count.members} members</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 flex-wrap">
                                            {workspace.boards[0] && (
                                                <button
                                                    onClick={() => router.push(`/board/${workspace.boards[0].id}`)}
                                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                >
                                                    <ExternalLink size={14} />
                                                    Open Board
                                                </button>
                                            )}
                                            {canEdit && (
                                                <button
                                                    onClick={() => {
                                                        setEditingWorkspace(workspace.id);
                                                        setEditWorkspaceName(workspace.name);
                                                    }}
                                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                                    title="Rename workspace"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                            {isOwner ? (
                                                <button
                                                    onClick={() => handleDeleteWorkspace(workspace.id, workspace.name)}
                                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                                                    title="Delete workspace"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleLeaveWorkspace(workspace.id, workspace.name)}
                                                    className="px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm"
                                                    title="Leave workspace"
                                                >
                                                    <LogOut size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
