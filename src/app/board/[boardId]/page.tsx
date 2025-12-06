'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import ErrorBoundary from '@/components/ErrorBoundary';

// Dynamically import WhiteboardCanvas to avoid SSR issues with Konva
const WhiteboardCanvas = dynamic(() => import('@/components/WhiteboardCanvas'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    ),
});

export default function BoardPage() {
    const params = useParams();
    const boardId = params.boardId as string;
    const [mounted, setMounted] = useState(false);
    const [boardData, setBoardData] = useState<any>(null);

    const fetchBoardData = async () => {
        try {
            const res = await fetch(`/api/boards/${boardId}`);
            if (res.ok) {
                const data = await res.json();
                setBoardData(data);
            }
        } catch (error) {
            console.error('Error fetching board:', error);
        }
    };

    useEffect(() => {
        setMounted(true);
        // Fetch board with workspace info
        fetchBoardData();
    }, [boardId]);

    if (!mounted) return null;

    return (
        <main className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50">
            {/* Top Bar - Fixed header with navigation, tools, and page controls */}
            <ErrorBoundary name="TopBar">
                <TopBar
                    currentBoardId={boardId}
                    currentWorkspaceId={boardData?.workspaceId}
                    workspaceName={boardData?.workspace?.name}
                    boardName={boardData?.title}
                />
            </ErrorBoundary>

            {/* Main Canvas Area - Completely clean */}
            <div className="flex-1 relative overflow-hidden">
                <div className="absolute inset-0" style={{ zIndex: 'var(--z-canvas)' }}>
                    <ErrorBoundary name="WhiteboardCanvas">
                        <WhiteboardCanvas boardId={boardId} />
                    </ErrorBoundary>
                </div>
            </div>
        </main >
    );
}
