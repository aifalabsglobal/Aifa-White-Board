'use client';

import React, { useState } from 'react';
import { useWhiteboardStore } from '@/store/whiteboardStore';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModal } from '@/components/providers/ModalProvider';

interface PageManagerProps {
    boardId: string;
}

export default function PageManager({ boardId }: PageManagerProps) {
    const {
        pages,
        currentPageId,
        setCurrentPageId,
        addPage,
        removePage,
        replaceStrokes,
        setBackgroundColor
    } = useWhiteboardStore();
    const { showAlert, showConfirm } = useModal();

    const [isLoading, setIsLoading] = useState(false);

    const currentIndex = pages.findIndex(p => p.id === currentPageId);
    const currentPageNumber = currentIndex !== -1 ? currentIndex + 1 : 0;
    const totalPages = pages.length;

    const handleAddPage = async () => {
        if (isLoading) return;
        if (!boardId) {
            showAlert('Error', 'Board ID is missing', 'danger');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/boards/${boardId}/pages`, {
                method: 'POST',
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create page');
            }

            const newPage = await res.json();
            addPage(newPage);

            // Switch to new page (which is empty)
            setCurrentPageId(newPage.id);
            replaceStrokes([]);
            setBackgroundColor('#3b82f6'); // Default for new page
        } catch (error: any) {
            console.error('Error creating page:', error);
            showAlert('Error', `Error creating page: ${error.message}`, 'danger');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchPage = async (pageId: string) => {
        if (pageId === currentPageId || isLoading) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/pages/${pageId}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to load page');

            const pageData = await res.json();

            setCurrentPageId(pageId);

            if (pageData.content) {
                if (typeof pageData.content === 'object') {
                    replaceStrokes(pageData.content.strokes || []);
                    // Set background color if present, otherwise reset to default
                    setBackgroundColor(pageData.content.backgroundColor || '#3b82f6');
                } else if (Array.isArray(pageData.content)) {
                    replaceStrokes(pageData.content);
                    setBackgroundColor('#3b82f6'); // Default for legacy array content
                }
            } else {
                replaceStrokes([]);
                setBackgroundColor('#3b82f6'); // Default for empty page
            }
        } catch (error) {
            console.error('Error switching page:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrevPage = () => {
        if (currentIndex > 0) {
            handleSwitchPage(pages[currentIndex - 1].id);
        }
    };

    const handleNextPage = () => {
        if (currentIndex < totalPages - 1) {
            handleSwitchPage(pages[currentIndex + 1].id);
        }
    };

    const handleDeletePage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLoading || !currentPageId) return;

        // No confirmation dialog as requested
        // But if we wanted one, we'd use showConfirm here

        setIsLoading(true);
        try {
            const res = await fetch(`/api/pages/${currentPageId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete page');

            removePage(currentPageId);

            // Switch to another page
            const remainingPages = pages.filter(p => p.id !== currentPageId);
            if (remainingPages.length > 0) {
                // Try to go to previous page, otherwise next (now first)
                const nextIndex = Math.max(0, currentIndex - 1);
                handleSwitchPage(remainingPages[nextIndex].id);
            } else {
                setCurrentPageId(null);
                replaceStrokes([]);
                setBackgroundColor('#3b82f6');
            }
        } catch (error) {
            console.error('Error deleting page:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (pages.length === 0) return null;

    return (
        <div className="flex items-center gap-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200/60 p-1.5 flex items-center gap-1 transition-all duration-300 hover:shadow-xl hover:bg-white">

                {/* Previous Button */}
                <button
                    onClick={handlePrevPage}
                    disabled={currentIndex <= 0 || isLoading}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Page Indicator */}
                <div className="px-3 font-medium text-slate-700 text-sm tabular-nums select-none min-w-[80px] text-center">
                    Page {currentPageNumber} / {totalPages}
                </div>

                {/* Next Button */}
                <button
                    onClick={handleNextPage}
                    disabled={currentIndex >= totalPages - 1 || isLoading}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                >
                    <ChevronRight size={20} />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 mx-1" />

                {/* Add Page */}
                <button
                    onClick={handleAddPage}
                    disabled={isLoading}
                    className="p-2 rounded-full hover:bg-blue-50 text-blue-600 disabled:opacity-50 transition-colors"
                    title="New Page"
                >
                    <Plus size={20} />
                </button>

                {/* Delete Page */}
                <button
                    onClick={handleDeletePage}
                    disabled={isLoading || pages.length <= 1}
                    className="p-2 rounded-full hover:bg-red-50 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Delete Page"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
