'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import { useModal } from '@/components/providers/ModalProvider';

export default function WorkspaceNavigator() {
    const {
        workspaces,
        currentWorkspaceId,
        setWorkspaces,
        setCurrentWorkspace,
    } = useWorkspaceStore();
    const { showPrompt, showAlert } = useModal();

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Safety check: ensure workspaces is always an array
    const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];
    const currentWorkspace = safeWorkspaces.find((w) => w.id === currentWorkspaceId);

    useEffect(() => {
        loadWorkspaces();
    }, []);

    const loadWorkspaces = async () => {
        try {
            const res = await fetch('/api/workspaces');
            if (!res.ok) throw new Error('Failed to load workspaces');
            const data = await res.json();
            setWorkspaces(data);

            // Auto-select first workspace if none selected
            if (!currentWorkspaceId && data.length > 0) {
                setCurrentWorkspace(data[0].id);
            }
        } catch (error) {
            console.error('Error loading workspaces:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateWorkspace = async () => {
        const name = await showPrompt('New Workspace', 'Enter workspace name:', 'Workspace Name');
        if (!name) return;

        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) throw new Error('Failed to create workspace');
            const newWorkspace = await res.json();

            setWorkspaces([...safeWorkspaces, newWorkspace]);
            setCurrentWorkspace(newWorkspace.id);
            setIsOpen(false);
        } catch (error) {
            console.error('Error creating workspace:', error);
            showAlert('Error', 'Failed to create workspace', 'danger');
        }
    };

    if (isLoading) {
        return (
            <div className="px-4 py-2 text-sm text-gray-500">
                Loading workspaces...
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors"
            >
                <Settings size={16} className="text-gray-600" />
                <span className="font-medium text-gray-900">
                    {currentWorkspace?.name || 'Select Workspace'}
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
                            {safeWorkspaces.map((workspace) => (
                                <button
                                    key={workspace.id}
                                    onClick={() => {
                                        setCurrentWorkspace(workspace.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${workspace.id === currentWorkspaceId
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-700'
                                        }`}
                                >
                                    {workspace.name}
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-gray-200">
                            <button
                                onClick={handleCreateWorkspace}
                                className="w-full flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                <Plus size={16} />
                                <span className="font-medium">New Workspace</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
