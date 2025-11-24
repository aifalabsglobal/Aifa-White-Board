'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Layout, Search, Grid3x3 } from 'lucide-react';

type Board = {
    id: string;
    title: string;
    updatedAt: string;
    workspaceId?: string;
};

type Workspace = {
    id: string;
    name: string;
    boards: Board[];
};

interface BoardSelectorProps {
    currentBoardId?: string;
}

export default function BoardSelector({ currentBoardId }: BoardSelectorProps) {
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        try {
            const res = await fetch('/api/workspaces');
            const data = await res.json();
            if (Array.isArray(data)) {
                setWorkspaces(data);
            }
        } catch (error) {
            console.error('Failed to load workspaces:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentWorkspace = workspaces.find(w =>
        w.boards.some(b => b.id === currentBoardId)
    );

    const currentBoard = currentWorkspace?.boards.find(b => b.id === currentBoardId);

    // Get recent boards (up to 8 most recently updated across all workspaces)
    const allBoards = workspaces.flatMap(w =>
        w.boards.map(b => ({ ...b, workspaceName: w.name }))
    );
    const recentBoards = [...allBoards]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8);

    // Filter boards based on search query
    const filteredBoards = recentBoards.filter(board =>
        board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.workspaceName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-lg" />;
    }

    return (
        <div className="relative">
            {/* Selector Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all text-sm font-medium text-gray-700 hover:border-blue-300 min-w-[180px] max-w-[280px]"
            >
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
                    <Layout size={14} className="text-white" />
                </div>
                <div className="flex-1 text-left overflow-hidden">
                    <div className="font-semibold text-gray-900 truncate text-sm">
                        {currentBoard ? currentBoard.title : 'Select Board'}
                    </div>
                    {currentWorkspace && (
                        <div className="text-xs text-gray-500 truncate">
                            {currentWorkspace.name}
                        </div>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0"
                        style={{ zIndex: 'var(--z-dropdown)' }}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Content */}
                    <div
                        className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[500px] overflow-hidden flex flex-col"
                        style={{ zIndex: 'calc(var(--z-dropdown) + 1)' }}
                    >
                        {/* Search Bar */}
                        <div className="p-3 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search boards..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {/* View All Boards */}
                            <button
                                onClick={() => {
                                    router.push('/boards');
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-blue-600 hover:bg-blue-50 font-medium mb-2"
                            >
                                <Grid3x3 size={18} />
                                <span>View All Boards</span>
                            </button>

                            <div className="h-px bg-gray-200 my-2" />

                            {/* Recent Boards */}
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                                Recent Boards
                            </p>

                            {filteredBoards.length === 0 ? (
                                <div className="text-center py-6 px-4">
                                    <Search className="mx-auto mb-2 text-gray-300" size={28} />
                                    <p className="text-sm text-gray-500">No boards found</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredBoards.map((board) => (
                                        <button
                                            key={board.id}
                                            onClick={() => {
                                                router.push(`/board/${board.id}`);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group ${currentBoardId === board.id
                                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex-1 overflow-hidden">
                                                <div className="truncate">{board.title}</div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {board.workspaceName}
                                                </div>
                                            </div>
                                            {currentBoardId === board.id && (
                                                <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 ml-2" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
