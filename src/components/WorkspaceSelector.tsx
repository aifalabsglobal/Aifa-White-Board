'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Layout, FolderOpen, Search } from 'lucide-react';

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

export default function WorkspaceSelector({ currentBoardId }: { currentBoardId?: string }) {
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewBoardInput, setShowNewBoardInput] = useState<string | null>(null);
    const [newBoardName, setNewBoardName] = useState('');

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

    const handleCreateBoard = async (workspaceId: string) => {
        if (!newBoardName.trim()) return;

        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newBoardName,
                    workspaceId,
                }),
            });
            const data = await res.json();
            if (data.board) {
                setNewBoardName('');
                setShowNewBoardInput(null);
                await fetchWorkspaces();
                router.push(`/board/${data.board.id}`);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Failed to create board:', error);
        }
    };

    const currentWorkspace = workspaces.find(w =>
        w.boards.some(b => b.id === currentBoardId)
    );

    const currentBoard = currentWorkspace?.boards.find(b => b.id === currentBoardId);

    // Filter boards based on search query
    const filteredWorkspaces = workspaces.map(workspace => ({
        ...workspace,
        boards: workspace.boards.filter(board =>
            board.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(workspace =>
        workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workspace.boards.length > 0
    );

    if (loading) {
        return <div className="h-11 w-64 bg-gray-100 animate-pulse rounded-lg shadow-sm" />;
    }

    return (
        <div className="relative z-50">
            {/* Selector Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all text-sm font-medium text-gray-700 hover:border-blue-300 hover:shadow-md min-w-[200px] md:min-w-[280px]"
            >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <Layout size={16} className="text-white" />
                </div>
                <div className="flex-1 text-left overflow-hidden">
                    <div className="font-semibold text-gray-900 truncate">
                        {currentBoard ? currentBoard.title : 'Select Board'}
                    </div>
                    {currentWorkspace && (
                        <div className="text-xs text-gray-500 truncate">
                            {currentWorkspace.name}
                        </div>
                    )}
                </div>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[600px] overflow-hidden z-50 flex flex-col">
                        {/* Search Bar */}
                        <div className="p-3 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
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
                            {filteredWorkspaces.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <Search className="mx-auto mb-2 text-gray-300" size={32} />
                                    <p className="text-sm text-gray-500">No boards found</p>
                                </div>
                            ) : (
                                filteredWorkspaces.map((workspace) => (
                                    <div key={workspace.id} className="mb-3 last:mb-0">
                                        {/* Workspace Header */}
                                        <div className="flex items-center justify-between px-3 py-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-md flex items-center justify-center">
                                                    <FolderOpen size={14} className="text-blue-600" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                                    {workspace.name}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowNewBoardInput(showNewBoardInput === workspace.id ? null : workspace.id);
                                                }}
                                                className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-md transition-colors"
                                                title="New Board"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        {/* New Board Input */}
                                        {showNewBoardInput === workspace.id && (
                                            <div className="px-3 mb-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newBoardName}
                                                        onChange={(e) => setNewBoardName(e.target.value)}
                                                        placeholder="Board name..."
                                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleCreateBoard(workspace.id);
                                                            if (e.key === 'Escape') setShowNewBoardInput(null);
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleCreateBoard(workspace.id)}
                                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Boards List */}
                                        <div className="space-y-1">
                                            {workspace.boards.map((board) => (
                                                <button
                                                    key={board.id}
                                                    onClick={() => {
                                                        router.push(`/board/${board.id}`);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group ${currentBoardId === board.id
                                                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span className="truncate flex-1">{board.title}</span>
                                                    {currentBoardId === board.id && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                            {workspace.boards.length === 0 && !showNewBoardInput && (
                                                <div className="px-3 py-2 text-xs text-gray-400 italic">
                                                    No boards yet
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
