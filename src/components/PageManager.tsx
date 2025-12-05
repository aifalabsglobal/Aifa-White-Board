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
        setBackgroundColor,
        setPageStyle
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

        // 1. Save current page state to cache before switching
        if (currentPageId) {
            const { strokes, backgroundColor, pageStyle } = useWhiteboardStore.getState();
            useWhiteboardStore.getState().updatePageContent(currentPageId, {
                strokes,
                backgroundColor,
                pageStyle
            });
        }

        // 2. Check cache for target page
        const cachedContent = useWhiteboardStore.getState().pageContents[pageId];

        // 3. Optimistic update - switch immediately if cached
        setCurrentPageId(pageId);
        if (cachedContent) {
            replaceStrokes(cachedContent.strokes);
            setBackgroundColor(cachedContent.backgroundColor);
            setPageStyle(cachedContent.pageStyle);
        } else {
            // If not cached, clear canvas temporarily (or show loading state)
            replaceStrokes([]);
            setBackgroundColor('#3b82f6');
            setPageStyle('plain');
        }

        // 4. Background fetch to ensure data is fresh (stale-while-revalidate)
        // Only set loading if we don't have cached data to show
        if (!cachedContent) setIsLoading(true);

        try {
            const res = await fetch(`/api/pages/${pageId}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to load page');

            const pageData = await res.json();

            // Update store with fresh data
            // Only update if we are still on the same page (user might have switched again)
            if (useWhiteboardStore.getState().currentPageId === pageId) {
                if (pageData.content) {
                    const newContent = {
                        strokes: Array.isArray(pageData.content) ? pageData.content : (pageData.content.strokes || []),
                        backgroundColor: !Array.isArray(pageData.content) ? (pageData.content.backgroundColor || '#3b82f6') : '#3b82f6',
                        pageStyle: !Array.isArray(pageData.content) ? (pageData.content.pageStyle || 'plain') : 'plain'
                    };

                    replaceStrokes(newContent.strokes);
                    setBackgroundColor(newContent.backgroundColor);
                    setPageStyle(newContent.pageStyle as any);

                    // Update cache with fresh data
                    useWhiteboardStore.getState().updatePageContent(pageId, newContent as any);
                }
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
        <div className="flex items-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200/60 p-1 sm:p-1.5 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 hover:shadow-xl hover:bg-white">
                {/* Previous Button */}
                <button
                    onClick={handlePrevPage}
                    disabled={currentIndex <= 0 || isLoading}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                >
                    <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                </button>

                {/* Page Indicator - Compact on mobile */}
                <div className="px-1.5 sm:px-3 font-medium text-slate-700 text-xs sm:text-sm tabular-nums select-none text-center whitespace-nowrap">
                    <span className="hidden sm:inline">Page </span>{currentPageNumber}/{totalPages}
                </div>

                {/* Next Button */}
                <button
                    onClick={handleNextPage}
                    disabled={currentIndex >= totalPages - 1 || isLoading}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                >
                    <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                </button>

                {/* Divider - Hidden on mobile */}
                <div className="w-px h-5 sm:h-6 bg-slate-200 mx-0.5 sm:mx-1 hidden sm:block" />

                {/* Add Page */}
                <button
                    onClick={handleAddPage}
                    disabled={isLoading}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-blue-50 text-blue-600 disabled:opacity-50 transition-colors"
                    title="New Page"
                >
                    <Plus size={16} className="sm:w-5 sm:h-5" />
                </button>

                {/* Delete Page - Hidden on mobile */}
                <button
                    onClick={handleDeletePage}
                    disabled={isLoading || pages.length <= 1}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-red-50 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors hidden sm:block"
                    title="Delete Page"
                >
                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
            </div>
        </div>
    );
}
