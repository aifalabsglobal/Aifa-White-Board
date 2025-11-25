'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import BoardSelector from './BoardSelector';
import UserMenu from './UserMenu';
import RecordingButton from './RecordingButton';

interface TopBarProps {
    currentBoardId?: string;
    currentWorkspaceId?: string;
    workspaceName?: string;
    boardName?: string;
    showBackButton?: boolean;
}

export default function TopBar({
    currentBoardId,
    currentWorkspaceId,
    workspaceName,
    boardName,
    showBackButton = true,
}: TopBarProps) {
    const router = useRouter();

    return (
        <header
            className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
            style={{ zIndex: 'var(--z-topbar)' }}
        >
            <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
                {/* Left Section: Logo + Breadcrumb */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* aifa Logo */}
                    <Link
                        href="/workspaces"
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <span className="text-2xl font-bold tracking-tight">
                            <span className="text-blue-600">ai</span>
                            <span className="text-gray-900">fa</span>
                        </span>
                    </Link>

                    {/* Breadcrumb Navigation */}
                    {(workspaceName || boardName) && (
                        <>
                            <ChevronRight size={16} className="text-gray-400" />

                            {/* Workspace Name */}
                            {workspaceName && (
                                <>
                                    {currentWorkspaceId ? (
                                        <Link
                                            href={`/workspaces/${currentWorkspaceId}`}
                                            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors max-w-[150px] truncate"
                                        >
                                            {workspaceName}
                                        </Link>
                                    ) : (
                                        <span className="text-sm font-medium text-gray-600 max-w-[150px] truncate">
                                            {workspaceName}
                                        </span>
                                    )}
                                </>
                            )}

                            {/* Board Name */}
                            {boardName && (
                                <>
                                    {workspaceName && <ChevronRight size={16} className="text-gray-400" />}
                                    <span className="text-sm font-semibold text-gray-900 max-w-[200px] truncate">
                                        {boardName}
                                    </span>
                                </>
                            )}
                        </>
                    )}

                    {/* Board Selector (when on board page) */}
                    {currentBoardId && (
                        <>
                            <div className="w-px h-6 bg-gray-300 hidden md:block" />
                            <BoardSelector currentBoardId={currentBoardId} />
                        </>
                    )}
                </div>

                {/* Right Section: Recording + User Menu */}
                <div className="flex items-center gap-4 ml-auto">
                    {/* Recording Controls (Before Profile) */}
                    <div className="flex items-center justify-center">
                        {currentBoardId && <RecordingButton boardId={currentBoardId} />}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <UserMenu />
                    </div>
                </div>
            </div>
        </header>
    );
}
