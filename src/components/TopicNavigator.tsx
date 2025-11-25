'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ChevronDown, Plus, Folder } from 'lucide-react';
import { useModal } from '@/components/providers/ModalProvider';

export default function TopicNavigator() {
    const {
        topics,
        currentWorkspaceId,
        currentTopicId,
        setTopics,
        addTopic,
        setCurrentTopic,
    } = useWorkspaceStore();
    const { showPrompt, showAlert } = useModal();

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const workspaceTopics = topics.filter((t) => t.workspaceId === currentWorkspaceId);
    const currentTopic = topics.find((t) => t.id === currentTopicId);

    useEffect(() => {
        if (currentWorkspaceId) {
            loadTopics();
        }
    }, [currentWorkspaceId]);

    const loadTopics = async () => {
        if (!currentWorkspaceId) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/workspaces/${currentWorkspaceId}/topics`);
            if (!res.ok) throw new Error('Failed to load topics');
            const data = await res.json();
            setTopics(data);

            // Auto-select first topic if none selected
            if (!currentTopicId && data.length > 0) {
                setCurrentTopic(data[0].id);
            }
        } catch (error) {
            console.error('Error loading topics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTopic = async () => {
        if (!currentWorkspaceId) {
            showAlert('Error', 'Please select a workspace first', 'warning');
            return;
        }

        const name = await showPrompt('New Topic', 'Enter topic name:', 'Topic Name');
        if (!name) return;

        try {
            const res = await fetch(`/api/workspaces/${currentWorkspaceId}/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) throw new Error('Failed to create topic');
            const newTopic = await res.json();

            addTopic(newTopic);
            setCurrentTopic(newTopic.id);
            setIsOpen(false);
        } catch (error) {
            console.error('Error creating topic:', error);
            showAlert('Error', 'Failed to create topic', 'danger');
        }
    };

    if (!currentWorkspaceId) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="px-4 py-2 text-sm text-gray-500">
                Loading topics...
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors"
            >
                <Folder size={16} className="text-gray-600" />
                <span className="font-medium text-gray-900">
                    {currentTopic?.name || 'Select Topic'}
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
                            {workspaceTopics.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    No topics yet
                                </div>
                            ) : (
                                workspaceTopics.map((topic) => (
                                    <button
                                        key={topic.id}
                                        onClick={() => {
                                            setCurrentTopic(topic.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${topic.id === currentTopicId
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700'
                                            }`}
                                    >
                                        {topic.name}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="border-t border-gray-200">
                            <button
                                onClick={handleCreateTopic}
                                className="w-full flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                <Plus size={16} />
                                <span className="font-medium">New Topic</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
