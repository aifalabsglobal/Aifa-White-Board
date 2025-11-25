'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ChevronDown, Plus, FileText } from 'lucide-react';
import { useModal } from '@/components/providers/ModalProvider';

export default function BoardNavigator() {
    const router = useRouter();
    const {
        boards,
        currentTopicId,
        currentBoardId,
        setBoards,
        addBoard,
        setCurrentBoard,
    } = useWorkspaceStore();
    const { showPrompt, showAlert } = useModal();

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const topicBoards = boards.filter((b) => b.topicId === currentTopicId);
    const currentBoard = boards.find((b) => b.id === currentBoardId);

    useEffect(() => {
        if (currentTopicId) {
            loadBoards();
        }
    }, [currentTopicId]);

    const loadBoards = async () => {
        if (!currentTopicId) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/topics/${currentTopicId}/boards`);
            if (!res.ok) throw new Error('Failed to load boards');
            const data = await res.json();
            setBoards(data);

            // Auto-select first board if none selected
            if (!currentBoardId && data.length > 0) {
                setCurrentBoard(data[0].id);
                router.push(`/board/${data[0].id}`);
            }
        } catch (error) {
            console.error('Error loading boards:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBoard = async () => {
        if (!currentTopicId) {
            showAlert('Error', 'Please select a topic first', 'warning');
            return;
        }

        const title = await showPrompt('New Board', 'Enter board name:', 'Board Name');
        if (!title) return;

        try {
            const res = await fetch(`/api/topics/${currentTopicId}/boards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });

            if (!res.ok) throw new Error('Failed to create board');
            const newBoard = await res.json();

            addBoard(newBoard);
            setCurrentBoard(newBoard.id);
            router.push(`/board/${newBoard.id}`);
            setIsOpen(false);
        } catch (error) {
            console.error('Error creating board:', error);
            showAlert('Error', 'Failed to create board', 'danger');
        }
    };

    const handleSelectBoard = (boardId: string) => {
        setCurrentBoard(boardId);
        router.push(`/board/${boardId}`);
        setIsOpen(false);
    };

    if (!currentTopicId) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="px-4 py-2 text-sm text-gray-500">
                Loading boards...
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors"
            >
                <FileText size={16} className="text-gray-600" />
                <span className="font-medium text-gray-900">
                    {currentBoard?.title || 'Select Board'}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                            {topicBoards.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    No boards yet
                                </div>
                            ) : (
                                topicBoards.map((board) => (
                                    <button
                                        key={board.id}
                                        onClick={() => handleSelectBoard(board.id)}
                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${board.id === currentBoardId
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700'
                                            }`}
                                    >
                                        {board.title}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="border-t border-gray-200">
                            <button
                                onClick={handleCreateBoard}
                                className="w-full flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                <Plus size={16} />
                                <span className="font-medium">New Board</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
