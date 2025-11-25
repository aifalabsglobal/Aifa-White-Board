'use client';

import { useState } from 'react';
import { MoreVertical, Edit, Trash, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/components/providers/ModalProvider';

interface WorkspaceActionsProps {
    workspaceId: string;
    workspaceName: string;
    onUpdate?: () => void;
}

export default function WorkspaceActions({ workspaceId, workspaceName, onUpdate }: WorkspaceActionsProps) {
    const router = useRouter();
    const { showAlert } = useModal();
    const [showMenu, setShowMenu] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [newName, setNewName] = useState(workspaceName);
    const [loading, setLoading] = useState(false);

    const handleRename = async () => {
        if (!newName.trim() || loading) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });

            if (res.ok) {
                setShowRenameDialog(false);
                setShowMenu(false);
                onUpdate?.();
            } else {
                const error = await res.json();
                showAlert('Error', error.error || 'Failed to rename workspace', 'danger');
            }
        } catch (error) {
            console.error('Error renaming workspace:', error);
            showAlert('Error', 'Failed to rename workspace', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push('/workspaces');
                router.refresh();
            } else {
                const error = await res.json();
                showAlert('Error', error.error || 'Failed to delete workspace', 'danger');
            }
        } catch (error) {
            console.error('Error deleting workspace:', error);
            showAlert('Error', 'Failed to delete workspace', 'danger');
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
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Workspace actions"
            >
                <MoreVertical size={18} className="text-gray-600" />
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
                        className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
                        style={{ zIndex: 'calc(var(--z-dropdown) + 1)' }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowRenameDialog(true);
                                setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-gray-700"
                        >
                            <Edit size={16} />
                            <span>Rename</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteDialog(true);
                                setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-red-50 text-red-600"
                        >
                            <Trash size={16} />
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Rename Workspace</h2>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
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
                                disabled={!newName.trim() || loading}
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Workspace?</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{workspaceName}</strong>? This will remove all boards,
                            pages, and data in this workspace. This action cannot be undone.
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
                                {loading ? 'Deleting...' : 'Delete Workspace'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
