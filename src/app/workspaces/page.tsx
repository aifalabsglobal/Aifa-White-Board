'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, Plus, Loader, Search, Users, Layout as LayoutIcon, User, Save, Camera, Lock, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import TopBar from '@/components/TopBar';
import WorkspaceActions from '@/components/WorkspaceActions';
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
    const { data: session, update } = useSession();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Profile States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [profileBio, setProfileBio] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password Change States
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        loadWorkspaces();
        if (session?.user) {
            loadProfile();
        }
    }, [session]);

    const loadProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setProfileName(data.user.name || '');
                setProfileBio(data.user.bio || '');
                setProfileImage(data.user.image || '');
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

    const handleUpdateProfile = async () => {
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: profileName, bio: profileBio }),
            });

            if (res.ok) {
                await update({ name: profileName });
                setIsEditingProfile(false);
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setProfileImage(data.user.image);
                await update(); // Refresh session to get new image
                window.location.reload(); // Force reload to show new image everywhere
            }
        } catch (error) {
            console.error('Failed to upload avatar:', error);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setChangingPassword(true);
        try {
            const res = await fetch('/api/profile/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setShowPasswordChange(false), 2000);
            } else {
                setPasswordMessage({ type: 'error', text: data.message || 'Failed to change password' });
            }
        } catch (error) {
            setPasswordMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setChangingPassword(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const filteredWorkspaces = workspaces.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                                            {profileImage ? (
                                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                getInitials(profileName || session?.user?.name || 'User')
                                            )}
                                        </div>
                                        {/* Avatar Upload Overlay */}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingAvatar}
                                            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            {uploadingAvatar ? (
                                                <Loader className="animate-spin text-white" size={20} />
                                            ) : (
                                                <Camera className="text-white" size={24} />
                                            )}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                    </div>
                                    {!isEditingProfile && (
                                        <button
                                            onClick={() => setIsEditingProfile(true)}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                </div>

                                {isEditingProfile ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Display Name</label>
                                            <input
                                                type="text"
                                                value={profileName}
                                                onChange={(e) => setProfileName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                                            <textarea
                                                value={profileBio}
                                                onChange={(e) => setProfileBio(e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                placeholder="Add a bio..."
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdateProfile}
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setIsEditingProfile(false)}
                                                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{profileName || session?.user?.name}</h2>
                                        <p className="text-gray-500 text-sm mb-4">{session?.user?.email}</p>
                                        {profileBio && (
                                            <p className="text-gray-600 text-sm mb-4">{profileBio}</p>
                                        )}

                                        <div className="pt-4 border-t border-gray-100 space-y-2">
                                            <button
                                                onClick={() => setShowPasswordChange(!showPasswordChange)}
                                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 w-full py-1"
                                            >
                                                <Lock size={16} />
                                                Change Password
                                            </button>
                                            <button
                                                onClick={() => signOut()}
                                                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 w-full py-1"
                                            >
                                                <LogOut size={16} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Password Change Form */}
                                {showPasswordChange && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Change Password</h3>
                                        {passwordMessage && (
                                            <div className={`text-xs p-2 rounded mb-3 ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                {passwordMessage.text}
                                            </div>
                                        )}
                                        <form onSubmit={handleChangePassword} className="space-y-3">
                                            <input
                                                type="password"
                                                placeholder="Current Password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <input
                                                type="password"
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Confirm New Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={changingPassword}
                                                    className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                                                >
                                                    {changingPassword ? 'Updating...' : 'Update Password'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswordChange(false)}
                                                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
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

function ChevronRight({ size, className }: { size?: number, className?: string }) {
    return (
        <svg
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}
