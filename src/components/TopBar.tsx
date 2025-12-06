'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from 'zustand';
import { useWhiteboardStore, type Stroke } from '@/store/whiteboardStore';
import { useModal } from '@/components/providers/ModalProvider';
import { exportAllPagesAsPDF } from '@/utils/exportPDF';
import {
    ChevronRight,
    MousePointer2,
    Pencil,
    Highlighter,
    Eraser,
    Square,
    Circle,
    Triangle,
    Pentagon,
    Hexagon,
    Star,
    Minus,
    MoveUpRight,
    Palette,
    Type,
    Undo2,
    Redo2,
    Download,
    Upload,
    Trash2,
    Sparkles,
    FileDown,
    ChevronDown,
    Share2,
    PenTool,
} from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import BoardSelector from './BoardSelector';
import WorkspaceMenu from './WorkspaceMenu';
import RecordingButton from './RecordingButton';
import PageManager from './PageManager';

const COLORS = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

const PAGE_STYLES = [
    { value: 'plain', label: 'Plain' },
    { value: 'ruled', label: 'Ruled' },
    { value: 'wide-ruled', label: 'Wide Ruled' },
    { value: 'graph', label: 'Graph' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'music', label: 'Music' },
];

const HANDWRITING_FONTS = [
    { label: 'Caveat', value: 'Caveat' },
    { label: 'Dancing Script', value: 'Dancing Script' },
    { label: 'Pacifico', value: 'Pacifico' },
    { label: 'Shadows Into Light', value: 'Shadows Into Light' },
    { label: 'Indie Flower', value: 'Indie Flower' },
    { label: 'Permanent Marker', value: 'Permanent Marker' },
    { label: 'Patrick Hand', value: 'Patrick Hand' },
    { label: 'Kalam', value: 'Kalam' },
    { label: 'Sacramento', value: 'Sacramento' },
    { label: 'Gloria Hallelujah', value: 'Gloria Hallelujah' },
    { label: 'Cookie', value: 'Cookie' },
    { label: 'Handlee', value: 'Handlee' },
    { label: 'Rock Salt', value: 'Rock Salt' },
    { label: 'Great Vibes', value: 'Great Vibes' },
    { label: 'Yellowtail', value: 'Yellowtail' },
];

const isValidPoint = (value: unknown): value is { x: number; y: number } =>
    Boolean(
        value &&
        typeof value === 'object' &&
        typeof (value as { x?: unknown }).x === 'number' &&
        typeof (value as { y?: unknown }).y === 'number'
    );

const isValidStroke = (value: unknown): value is Stroke => {
    if (!value || typeof value !== 'object') return false;
    const stroke = value as Partial<Stroke>;
    const hasPoints = Array.isArray(stroke.points) && stroke.points.every(isValidPoint);
    return (
        typeof stroke.id === 'string' &&
        typeof stroke.tool === 'string' &&
        typeof stroke.color === 'string' &&
        typeof stroke.width === 'number' &&
        typeof stroke.opacity === 'number' &&
        typeof stroke.pageId === 'string' &&
        typeof stroke.createdAt === 'string' &&
        hasPoints
    );
};

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
    const {
        currentTool,
        currentColor,
        currentWidth,
        backgroundColor,
        currentFontFamily,
        setTool,
        setColor,
        setBackgroundColor,
        setWidth,
        setFontFamily,
        clearPage,
        strokes,
        replaceStrokes,
        isMagicMode,
        toggleMagicMode,
        pages,
        pageStyle,
        setPageStyle,
    } = useWhiteboardStore();

    const { undo, redo, pastStates, futureStates } = useStore(
        useWhiteboardStore.temporal,
        (state) => ({
            undo: state.undo,
            redo: state.redo,
            pastStates: state.pastStates,
            futureStates: state.futureStates,
        })
    );

    const { showAlert, showConfirm } = useModal();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);

    const canUndo = pastStates.length > 0;
    const canRedo = futureStates.length > 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
                setExpandedSection(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSection = (section: string) => {
        setExpandedSection(prev => prev === section ? null : section);
    };

    const handleExportBoard = useCallback(() => {
        if (!strokes.length) {
            showAlert('Export Failed', 'Nothing to export yet.', 'warning');
            return;
        }
        const payload = JSON.stringify(strokes, null, 2);
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `whiteboard-${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }, [strokes, showAlert]);

    const handleImportBoard = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const text = reader.result;
                    if (typeof text !== 'string') throw new Error('Invalid file format.');
                    const parsed = JSON.parse(text);
                    if (!Array.isArray(parsed)) throw new Error('JSON must be an array of strokes.');
                    const sanitized = parsed.filter(isValidStroke) as Stroke[];
                    if (!sanitized.length) throw new Error('No valid strokes found in file.');
                    replaceStrokes(sanitized);
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unable to import board.';
                    showAlert('Import Failed', message, 'danger');
                } finally {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            reader.readAsText(file);
        },
        [replaceStrokes, showAlert]
    );

    const handleExportAllPages = useCallback(async () => {
        if (!currentBoardId) {
            showAlert('Export Failed', 'Board ID not found', 'danger');
            return;
        }
        if (pages.length === 0) {
            showAlert('Export Failed', 'No pages to export', 'warning');
            return;
        }
        setIsExportingPDF(true);
        try {
            await exportAllPagesAsPDF({ boardId: currentBoardId, pixelRatio: 2 });
        } catch (error) {
            console.error('PDF export failed:', error);
            showAlert('Export Failed', `Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, 'danger');
        } finally {
            setIsExportingPDF(false);
        }
    }, [currentBoardId, pages, showAlert]);

    const handleShareFlipbook = useCallback(() => {
        if (!currentBoardId) {
            showAlert('Share Failed', 'Board ID not found', 'danger');
            return;
        }
        const flipbookUrl = `/flipbook/${currentBoardId}`;
        window.open(flipbookUrl, '_blank');
    }, [currentBoardId, showAlert]);

    type ToolConfig = { id: string; icon: React.ComponentType<{ size?: number | string }>; label: string; value?: string };

    const drawTools: ToolConfig[] = [
        { id: 'pen', icon: Pencil, label: 'Pen', value: 'pen' },
        { id: 'highlighter', icon: Highlighter, label: 'Highlighter', value: 'highlighter' },
        { id: 'eraser', icon: Eraser, label: 'Eraser', value: 'eraser' },
        { id: 'text', icon: Type, label: 'Text', value: 'text' },
    ];

    const shapeTools: ToolConfig[] = [
        { id: 'rectangle', icon: Square, label: 'Rectangle', value: 'rectangle' },
        { id: 'circle', icon: Circle, label: 'Circle', value: 'circle' },
        { id: 'triangle', icon: Triangle, label: 'Triangle', value: 'triangle' },
        { id: 'pentagon', icon: Pentagon, label: 'Pentagon', value: 'pentagon' },
        { id: 'hexagon', icon: Hexagon, label: 'Hexagon', value: 'hexagon' },
        { id: 'star', icon: Star, label: 'Star', value: 'star' },
        { id: 'line', icon: Minus, label: 'Line', value: 'line' },
        { id: 'arrow', icon: MoveUpRight, label: 'Arrow', value: 'arrow' },
    ];

    const CANVAS_COLORS = [
        { label: 'Default', value: '#f8fafc' },
        { label: 'White', value: '#ffffff' },
        { label: 'Paper', value: '#fefce8' },
        { label: 'Dark', value: '#1e293b' },
        { label: 'Black', value: '#000000' },
        { label: 'Blue', value: '#3b82f6' },
    ];

    const showToolbar = !!currentBoardId;

    return (
        <header
            className="w-full bg-blue-100/95 backdrop-blur-md border-b border-blue-200 shadow-sm"
            style={{ zIndex: 'var(--z-topbar)' }}
        >
            <div className="flex items-center justify-between gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2">
                {/* Left Section: Logo + Breadcrumb */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Link href="/workspaces" className="flex items-center hover:opacity-80 transition-opacity">
                        <span className="text-lg sm:text-xl font-bold tracking-tight">
                            <span className="text-blue-600">ai</span>
                            <span className="text-gray-900">fa</span>
                        </span>
                    </Link>

                    {/* Breadcrumb - Hidden on mobile */}
                    {(workspaceName || boardName) && (
                        <div className="hidden sm:flex items-center gap-1">
                            <ChevronRight size={14} className="text-gray-400" />
                            {workspaceName && (
                                currentWorkspaceId ? (
                                    <Link href={`/workspaces/${currentWorkspaceId}`} className="text-xs font-medium text-gray-600 hover:text-blue-600 truncate max-w-[80px] md:max-w-[120px]">
                                        {workspaceName}
                                    </Link>
                                ) : (
                                    <span className="text-xs font-medium text-gray-600 truncate max-w-[80px]">{workspaceName}</span>
                                )
                            )}
                            {boardName && (
                                <>
                                    {workspaceName && <ChevronRight size={14} className="text-gray-400" />}
                                    <span className="text-xs font-semibold text-gray-900 truncate max-w-[80px] md:max-w-[120px]">{boardName}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Board Selector - Hidden on small screens */}
                    {currentBoardId && (
                        <div className="hidden md:flex items-center gap-1">
                            <div className="w-px h-5 bg-gray-300 mx-1" />
                            <BoardSelector currentBoardId={currentBoardId} />
                        </div>
                    )}
                </div>

                {/* Center Section: Toolbar */}
                {showToolbar && (
                    <div ref={toolbarRef} className="flex items-center gap-0.5 bg-gray-50 rounded-xl px-1 sm:px-1.5 py-1 border border-gray-200">
                        {/* Pointer */}
                        <button
                            onClick={() => setTool('select')}
                            className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${currentTool === 'select' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                            title="Pointer"
                        >
                            <MousePointer2 size={18} />
                        </button>

                        {/* Draw Tools */}
                        <div className="relative flex-shrink-0">
                            <button
                                onClick={() => toggleSection('draw')}
                                className={`flex items-center gap-0.5 p-1.5 rounded-lg transition-all ${['pen', 'highlighter', 'eraser', 'text'].includes(currentTool) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                                title="Draw Tools"
                            >
                                <Pencil size={18} />
                                <ChevronDown size={12} className="hidden sm:block" />
                            </button>
                            {expandedSection === 'draw' && (
                                <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[140px] z-50">
                                    {drawTools.map((tool) => {
                                        const Icon = tool.icon;
                                        return (
                                            <button
                                                key={tool.id}
                                                onClick={() => { if (tool.value) setTool(tool.value as any); setExpandedSection(null); }}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${currentTool === tool.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <Icon size={16} />
                                                <span>{tool.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Shape Tools */}
                        <div className="relative flex-shrink-0">
                            <button
                                onClick={() => toggleSection('shapes')}
                                className={`flex items-center gap-0.5 p-1.5 rounded-lg transition-all ${['rectangle', 'circle', 'triangle', 'pentagon', 'hexagon', 'star', 'line', 'arrow'].includes(currentTool) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                                title="Shapes"
                            >
                                <Square size={18} />
                                <ChevronDown size={12} className="hidden sm:block" />
                            </button>
                            {expandedSection === 'shapes' && (
                                <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[140px] z-50">
                                    {shapeTools.map((tool) => {
                                        const Icon = tool.icon;
                                        return (
                                            <button
                                                key={tool.id}
                                                onClick={() => { if (tool.value) setTool(tool.value as any); setExpandedSection(null); }}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${currentTool === tool.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <Icon size={16} />
                                                <span>{tool.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Style Dropdown */}
                        <div className="relative flex-shrink-0">
                            <button
                                onClick={() => toggleSection('style')}
                                className="flex items-center gap-0.5 p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
                                title="Style & Colors"
                            >
                                <Palette size={18} />
                                <ChevronDown size={12} className="hidden sm:block" />
                            </button>
                            {expandedSection === 'style' && (
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-[240px] z-50 space-y-3">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Stroke</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setColor(color)}
                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${currentColor === color ? 'scale-110 border-blue-500' : 'border-gray-200 hover:scale-105'}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                            <label className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer text-[10px] text-gray-500 hover:bg-gray-50">
                                                +
                                                <input
                                                    type="color"
                                                    value={currentColor}
                                                    onChange={(e) => setColor(e.target.value)}
                                                    className="sr-only"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 pt-2">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Background</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {CANVAS_COLORS.map((bg) => (
                                                <button
                                                    key={bg.value}
                                                    onClick={() => setBackgroundColor(bg.value)}
                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${backgroundColor === bg.value ? 'scale-110 border-blue-500' : 'border-gray-200 hover:scale-105'}`}
                                                    style={{ backgroundColor: bg.value }}
                                                />
                                            ))}
                                            <label className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer text-[10px] text-gray-500 hover:bg-gray-50">
                                                +
                                                <input
                                                    type="color"
                                                    value={backgroundColor}
                                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                                    className="sr-only"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 pt-2">
                                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                            <span className="font-semibold text-gray-400 uppercase">Width</span>
                                            <span className="font-medium text-gray-700">{currentWidth}px</span>
                                        </div>
                                        <input type="range" min="1" max="30" value={currentWidth} onChange={(e) => setWidth(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                    </div>
                                    <div className="border-t border-gray-100 pt-2">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Page Style</p>
                                        <div className="grid grid-cols-3 gap-1">
                                            {PAGE_STYLES.map((style) => (
                                                <button
                                                    key={style.value}
                                                    onClick={() => setPageStyle(style.value as any)}
                                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${pageStyle === style.value ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                                >
                                                    {style.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 pt-2">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Handwriting Fonts</p>
                                        <div className="max-h-[120px] overflow-y-auto space-y-0.5">
                                            {HANDWRITING_FONTS.map((font) => (
                                                <button
                                                    key={font.value}
                                                    onClick={() => { setFontFamily(font.value); }}
                                                    className={`w-full text-left px-2 py-1 rounded text-sm transition-all ${currentFontFamily === font.value ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                                    style={{ fontFamily: font.value }}
                                                >
                                                    {font.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-px h-5 bg-gray-300 mx-0.5 hidden sm:block flex-shrink-0" />

                        {/* Undo/Redo */}
                        <button onClick={() => undo()} disabled={!canUndo} className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${!canUndo ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`} title="Undo">
                            <Undo2 size={18} />
                        </button>
                        <button onClick={() => redo()} disabled={!canRedo} className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${!canRedo ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`} title="Redo">
                            <Redo2 size={18} />
                        </button>

                        {/* Export/Import - Hidden on mobile */}
                        <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
                            <div className="w-px h-5 bg-gray-300 mx-0.5" />
                            <button onClick={handleExportBoard} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100" title="Export Board"><Download size={18} /></button>
                            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100" title="Import Board"><Upload size={18} /></button>
                            <button onClick={handleExportAllPages} disabled={isExportingPDF} className={`p-1.5 rounded-lg ${isExportingPDF ? 'text-blue-400 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'}`} title="Export PDF"><FileDown size={18} /></button>
                        </div>

                        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBoard} className="hidden" />

                        {/* Share Flipbook - Always visible */}
                        <button
                            onClick={handleShareFlipbook}
                            className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex-shrink-0"
                            title="Share Flipbook"
                        >
                            <Share2 size={18} />
                        </button>

                        <div className="w-px h-5 bg-gray-300 mx-0.5 hidden sm:block flex-shrink-0" />

                        {/* Clear & Magic */}
                        <button
                            onClick={async () => { if (await showConfirm('Clear Board', 'Clear everything?', 'danger')) clearPage(); }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 flex-shrink-0"
                            title="Clear"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={toggleMagicMode}
                            className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${isMagicMode ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-purple-50'}`}
                            title="Magic Mode"
                        >
                            <Sparkles size={18} />
                        </button>
                    </div>
                )}

                {/* Right Section */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {currentBoardId && <PageManager boardId={currentBoardId} />}
                    {currentBoardId && <RecordingButton boardId={currentBoardId} />}
                    <SignedIn>
                        <WorkspaceMenu />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                                Sign In
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9 border-2 border-white shadow-sm"
                                }
                            }}
                        />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
}
