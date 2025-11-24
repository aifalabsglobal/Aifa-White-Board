'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, ChevronRight, Check, Layout } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Board = {
    id: string;
    title: string;
    updatedAt: string;
};

type Workspace = {
    id: string;
    name: string;
    boards: Board[];
};

export default function UserMenu() {
    const { data: session, status } = useSession({
        required: false,
    });
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchWorkspaces();
        }
    }, [isOpen]);

    // Fetch profile image separately to avoid JWT size issues
    useEffect(() => {
        if (session?.user?.id) {
            fetch('/api/user/profile')
                .then(res => res.json())
                .then(data => {
                    if (data.user?.image) {
                        setProfileImage(data.user.image);
                    }
                })
                .catch(err => console.error('Failed to load profile image:', err));
        }
    }, [session?.user?.id]);

    const fetchWorkspaces = async () => {
        setLoadingWorkspaces(true);
        try {
            const res = await fetch('/api/workspaces');
            const data = await res.json();
            if (data.workspaces) {
                setWorkspaces(data.workspaces);
            }
        } catch (error) {
            console.error('Failed to load workspaces:', error);
        } finally {
            setLoadingWorkspaces(false);
        }
    };

    if (!session?.user) return null;

    const userInitials = session.user.name
        ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-sm hover:shadow-md transition-all overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
                {profileImage ? (
                    <img
                        src={profileImage}
                        alt={session.user.name || 'User'}
                        className="w-full h-full object-cover rounded-full"
                    />
                ) : (
                    <span>{userInitials}</span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                            {session.user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {session.user.email}
                        </p>
                    </div>

                    {/* Workspaces Section */}
                    <div className="py-2">
                        <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            My Workspaces
                        </div>

                        {loadingWorkspaces ? (
                            <div className="px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                Loading...
                            </div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto">
                                {workspaces.map((workspace) => (
                                    <div key={workspace.id} className="px-2">
                                        <div className="px-2 py-1.5 text-xs font-medium text-gray-600 flex items-center gap-2">
                                            <Layout size={12} />
                                            {workspace.name}
                                        </div>
                                        <div className="pl-2 space-y-0.5">
                                            {workspace.boards.map((board) => (
                                                <button
                                                    key={board.id}
                                                    onClick={() => {
                                                        router.push(`/board/${board.id}`);
                                                        setIsOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between group"
                                                >
                                                    <span className="truncate">{board.title}</span>
                                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-blue-400" />
                                                </button>
                                            ))}
                                            {workspace.boards.length === 0 && (
                                                <div className="px-3 py-1.5 text-xs text-gray-400 italic">
                                                    No boards
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-100 my-1" />

                    {/* Profile Link */}
                    <div className="px-2">
                        <button
                            onClick={() => {
                                router.push('/profile');
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <User size={16} />
                            Profile Settings
                        </button>
                    </div>

                    {/* Logout */}
                    <div className="px-2">
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={16} />
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
