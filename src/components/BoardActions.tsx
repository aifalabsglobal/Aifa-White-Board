'use client';

import { useState } from 'react';
import { MoreVertical, Edit, Trash, Loader } from 'lucide-react';
import { useModal } from '@/components/providers/ModalProvider';

interface BoardActionsProps {
    boardId: string;
    boardTitle: string;
    onUpdate?: () => void;
    onDelete?: () => void;
}

export default function BoardActions({ boardId, boardTitle, onUpdate, onDelete }: BoardActionsProps) {
    const { showAlert } = useModal();
    const [showMenu, setShowMenu] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [newTitle, setNewTitle] = useState(boardTitle);
    const [loading, setLoading] = useState(false);

    const handleRename = async () => {
        if (!newTitle.trim() || loading) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/boards/${boardId}/rename-delete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle }),
            });

            if (res.ok) {
                setShowRenameDialog(false);
                setShowMenu(false);
                onUpdate?.();
            } else {
                const error = await res.json();
                showAlert('Error', error.error || 'Failed to rename board', 'danger');
            }
        } catch (error) {
            console.error('Error renaming board:', error);
            showAlert('Error', 'Failed to rename board', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/boards/${boardId}/rename-delete`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setShowDeleteDialog(false);
                setShowMenu(false);
                onDelete?.();
            } else {
                const error = await res.json();
                showAlert('Error', error.error || 'Failed to delete board', 'danger');
            }
        } catch (error) {
            console.error('Error deleting board:', error);
            showAlert('Error', 'Failed to delete board', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* Menu Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Board actions"
            >
                <MoreVertical size={16} className="text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
                <>
                    <div
                        className="fixed inset-0"
                        style={{ zIndex: 'var(--z-dropdown)' }}
                        onClick={() => setShowMenu(false)}
                    />
                    <div
                        className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]"
                        style={{ zIndex: 'calc(var(--z-dropdown) + 1)' }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowRenameDialog(true);
                                setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-gray-700 text-sm"
                        >
                            <Edit size={14} />
                            <span>Rename</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteDialog(true);
                                setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-red-50 text-red-600 text-sm"
                        >
                            <Trash size={14} />
                            <span>Delete</span>
                        </button>
                    </div>
                </>
            )}

            {/* Rename Dialog */}
            {showRenameDialog && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
                    style={{ zIndex: 'var(--z-modal)' }}
                    onClick={() => !loading && setShowRenameDialog(false)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Rename Board</h2>
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                            autoFocus
                            disabled={loading}
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowRenameDialog(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRename}
                                disabled={!newTitle.trim() || loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" size={16} /> : null}
                                {loading ? 'Renaming...' : 'Rename'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Dialog */}
            {showDeleteDialog && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
                    style={{ zIndex: 'var(--z-modal)' }}
                    onClick={() => !loading && setShowDeleteDialog(false)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Board?</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{boardTitle}</strong>? All pages and content
                            will be permanently removed. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 flex items-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" size={16} /> : null}
                                {loading ? 'Deleting...' : 'Delete Board'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
