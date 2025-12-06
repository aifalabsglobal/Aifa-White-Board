'use client';

import { useState, useEffect, useRef } from 'react';
import { Layout, ChevronRight, Plus, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

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

export default function WorkspaceMenu() {
    const { userId, isLoaded } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
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
        if (isOpen && userId) {
            fetchWorkspaces();
        }
    }, [isOpen, userId]);

    const fetchWorkspaces = async () => {
        setLoadingWorkspaces(true);
        try {
            const res = await fetch('/api/workspaces');
            if (res.ok) {
                const data = await res.json();
                // Handle both array format and object format { workspaces: [...] }
                const list = Array.isArray(data) ? data : (data.workspaces || []);
                setWorkspaces(list);
            }
        } catch (error) {
            console.error('Failed to load workspaces:', error);
        } finally {
            setLoadingWorkspaces(false);
        }
    };

    if (!isLoaded || !userId) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                title="Switch Workspace"
            >
                <Layout size={18} className="text-gray-500" />
                <span className="hidden sm:inline">Workspaces</span>
                <ChevronRight size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            My Workspaces
                        </span>
                        <button
                            onClick={() => router.push('/workspaces')}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Manage
                        </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto py-1">
                        {loadingWorkspaces ? (
                            <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2 justify-center">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                Loading...
                            </div>
                        ) : workspaces.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center italic">
                                No workspaces found
                            </div>
                        ) : (
                            workspaces.map((workspace) => (
                                <div key={workspace.id} className="px-2 mb-1">
                                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-900 bg-gray-50 rounded-md mb-0.5">
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
                                                className="w-full text-left px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between group"
                                            >
                                                <span className="truncate">{board.title}</span>
                                            </button>
                                        ))}
                                        {workspace.boards.length === 0 && (
                                            <div className="px-3 py-1.5 text-xs text-gray-400 italic">
                                                No boards
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-gray-100 mt-1 pt-1 px-2">
                        <button
                            onClick={() => {
                                router.push('/workspaces'); // Or a create modal
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Plus size={16} />
                            Create New Workspace
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
