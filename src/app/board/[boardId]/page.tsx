'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import WorkspaceSelector from '@/components/WorkspaceSelector';
import Toolbar from '@/components/Toolbar';
import UserMenu from '@/components/UserMenu';
import PageManager from '@/components/PageManager';
import RecordingButton from '@/components/RecordingButton';
import { Home, ChevronRight } from 'lucide-react';

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

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="relative w-full h-screen overflow-hidden bg-slate-50">
            {/* Top Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 md:px-6 md:py-3">
                    {/* Left Side: Logo + Breadcrumb + Board Selector */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* AIFA Logo */}
                        <div className="flex items-center">
                            <Image
                                src="/aifa-logo.png"
                                alt="AIFA"
                                width={80}
                                height={40}
                                className="object-contain"
                                priority
                            />
                        </div>

                        {/* Separator */}
                        <div className="h-8 w-px bg-gray-300"></div>

                        {/* Dashboard Link */}
                        <a
                            href="/dashboard"
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                            title="Back to Dashboard"
                        >
                            <Home size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors hidden sm:inline">
                                Dashboard
                            </span>
                        </a>

                        {/* Separator */}
                        <ChevronRight size={16} className="text-gray-400" />

                        {/* Board Selector */}
                        <WorkspaceSelector currentBoardId={boardId} />
                    </div>

                    {/* Center: Page Manager */}
                    <div className="flex items-center justify-center flex-1 order-last md:order-none w-full md:w-auto">
                        <PageManager boardId={boardId} />
                    </div>

                    {/* Right Side: Recording Button + User Menu */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <RecordingButton boardId={boardId} />
                        <UserMenu />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <Toolbar boardId={boardId} />

            {/* Canvas */}
            <div className="absolute inset-0 z-0">
                <WhiteboardCanvas boardId={boardId} />
            </div>
        </main>
    );
}
