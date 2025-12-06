'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from 'zustand';
import { useWhiteboardStore, type Stroke } from '@/store/whiteboardStore';
import { useModal } from '@/components/providers/ModalProvider';
import {
    MousePointer2,
    Pencil,
    Highlighter,
    Eraser,
    Square,
    Circle,
    Minus,
    MoveUpRight,
    Download,
    Type,
    Upload,
    FileJson,
    FileDown,
    History,
    Palette,
    Undo2,
    Redo2,
    Trash2,
    Feather,
    PenTool,
    Sparkles,
    Lasso,
    Triangle,
    Pentagon,
    Hexagon,
    Star,
    Video,
    GripVertical,
} from 'lucide-react';
import { exportAllPagesAsPDF } from '@/utils/exportPDF';

const COLORS = [
    '#000000', // Black
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
];

const PAGE_STYLES = [
    { value: 'plain', label: 'Plain' },
    { value: 'ruled', label: 'Ruled Lines' },
    { value: 'wide-ruled', label: 'Wide Ruled' },
    { value: 'graph', label: 'Graph Paper' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'music', label: 'Music Staff' },
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

interface ToolbarProps {
    boardId?: string;
}

export default function Toolbar({ boardId }: ToolbarProps) {
    const {
        currentTool,
        currentColor,
        currentWidth,
        backgroundColor,
        currentFontFamily,
        currentFontSize,
        setTool,
        setColor,
        setBackgroundColor,
        setWidth,
        setFontFamily,
        setFontSize,
        deleteStroke,
        clearPage,
        strokes,
        selectedStrokeIds,
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
    const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

    // Draggable state
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const toolbarRef = useRef<HTMLDivElement>(null);

    // Initial position (center bottom)
    useEffect(() => {
        if (typeof window !== 'undefined' && position === null) {
            setPosition({
                x: window.innerWidth / 2 - 300, // Approximate half width
                y: window.innerHeight - 100
            });
        }
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (toolbarRef.current) {
            const rect = toolbarRef.current.getBoundingClientRect();
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            setIsDragging(true);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);


    const canUndo = pastStates.length > 0;
    const canRedo = futureStates.length > 0;

    const handleExportClick = useCallback(() => {
        if (typeof window === 'undefined') return;
        const exportCanvas = window.exportCanvas;
        if (typeof exportCanvas === 'function') {
            exportCanvas('png');
        }
    }, []);

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
                    if (typeof text !== 'string') {
                        throw new Error('Invalid file format.');
                    }
                    const parsed = JSON.parse(text);
                    if (!Array.isArray(parsed)) {
                        throw new Error('JSON must be an array of strokes.');
                    }

                    const sanitized = parsed.filter(isValidStroke) as Stroke[];
                    if (!sanitized.length) {
                        throw new Error('No valid strokes found in file.');
                    }
                    replaceStrokes(sanitized);
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unable to import board.';
                    showAlert('Import Failed', message, 'danger');
                } finally {
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            };
            reader.readAsText(file);
        },
        [replaceStrokes, showAlert]
    );

    const triggerImportDialog = () => {
        fileInputRef.current?.click();
    };

    const handleExportAllPages = useCallback(async () => {
        if (!boardId) {
            showAlert('Export Failed', 'Board ID not found', 'danger');
            return;
        }

        if (pages.length === 0) {
            showAlert('Export Failed', 'No pages to export', 'warning');
            return;
        }

        setIsExportingPDF(true);
        setExportProgress({ current: 0, total: pages.length });

        try {
            await exportAllPagesAsPDF({
                boardId,
                pixelRatio: 2,
                onProgress: (current, total) => {
                    setExportProgress({ current, total });
                },
            });

            setTimeout(() => {
                setExportProgress(null);
            }, 1000);
        } catch (error) {
            console.error('PDF export failed:', error);
            showAlert(
                'Export Failed',
                `Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'danger'
            );
        } finally {
            setIsExportingPDF(false);
        }
    }, [boardId, pages, showAlert]);

    type ToolConfig = {
        id: string;
        icon: React.ComponentType<{ size?: number | string }>;
        label: string;
        value?: string;
        action?: () => void;
    };

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
        { label: 'Grid Blue', value: '#eff6ff' },
    ];

    const HANDWRITING_FONTS = [
        { label: 'Great Vibes', value: 'Great Vibes' },
        { label: 'Dancing Script', value: 'Dancing Script' },
        { label: 'Allura', value: 'Allura' },
        { label: 'Alex Brush', value: 'Alex Brush' },
        { label: 'Caveat', value: 'Caveat' },
        { label: 'Pacifico', value: 'Pacifico' },
        { label: 'Satisfy', value: 'Satisfy' },
        { label: 'Tangerine', value: 'Tangerine' },
        { label: 'Kaushan Script', value: 'Kaushan Script' },
        { label: 'Courgette', value: 'Courgette' },
        { label: 'Shadows Into Light', value: 'Shadows Into Light' },
        { label: 'Indie Flower', value: 'Indie Flower' },
        { label: 'Permanent Marker', value: 'Permanent Marker' },
        { label: 'Patrick Hand', value: 'Patrick Hand' },
        { label: 'Cookie', value: 'Cookie' },
        { label: 'Kalam', value: 'Kalam' },
        { label: 'Handlee', value: 'Handlee' },
        { label: 'Sacramento', value: 'Sacramento' },
        { label: 'Parisienne', value: 'Parisienne' },
        { label: 'Yellowtail', value: 'Yellowtail' },
        { label: 'Mr Dafoe', value: 'Mr Dafoe' },
        { label: 'Delius', value: 'Delius' },
        { label: 'Rock Salt', value: 'Rock Salt' },
        { label: 'Gloria Hallelujah', value: 'Gloria Hallelujah' },
        { label: 'Covered By Your Grace', value: 'Covered By Your Grace' },
        { label: 'Reenie Beanie', value: 'Reenie Beanie' },
        { label: 'Nothing You Could Do', value: 'Nothing You Could Do' },
        { label: 'Bad Script', value: 'Bad Script' },
        { label: 'Marck Script', value: 'Marck Script' },
        { label: 'Damion', value: 'Damion' },
        { label: 'Homemade Apple', value: 'Homemade Apple' },
        { label: 'Cedarville Cursive', value: 'Cedarville Cursive' },
    ];

    // Handle click outside to close submenus
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
                setExpandedSection(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleSection = (section: string) => {
        setExpandedSection(prev => prev === section ? null : section);
    };

    // Determine submenu direction based on toolbar position
    const getSubmenuPositionClass = () => {
        if (!position) return 'bottom-full mb-3'; // Default to opening up
        // If toolbar is in the top half of the screen, open down
        if (position.y < window.innerHeight / 2) {
            return 'top-full mt-3';
        }
        return 'bottom-full mb-3';
    };

    const submenuPositionClass = getSubmenuPositionClass();

    if (!position) return null; // Don't render until client-side hydration sets position

    return (
        <>
            <div
                className="fixed max-w-[90vw] overflow-visible"
                style={{ left: position.x, top: position.y, zIndex: 'var(--z-toolbar)' }}
            >
                <div ref={toolbarRef} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/60 p-2 flex items-center gap-1 transition-all duration-300 hover:shadow-3xl hover:bg-white">

                    {/* Drag Handle */}
                    <div
                        onMouseDown={handleMouseDown}
                        className="cursor-move p-2 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                        title="Drag Toolbar"
                    >
                        <GripVertical size={20} />
                    </div>

                    <div className="w-px h-8 bg-gray-200 mx-1" />

                    {/* Pointer Tool */}
                    <button
                        onClick={() => setTool('select')}
                        className={`group relative p-2.5 rounded-xl transition-all ${currentTool === 'select'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        title="Pointer"
                    >
                        <MousePointer2 size={20} />
                    </button>

                    {/* Lasso Tool */}
                    <button
                        onClick={() => setTool('lasso')}
                        className={`group relative p-2.5 rounded-xl transition-all ${currentTool === 'lasso'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        title="Lasso Selection"
                    >
                        <Lasso size={20} />
                    </button>

                    <div className="w-px h-8 bg-gray-200 mx-1" />

                    {/* Draw Tools */}
                    <div className="relative">
                        <button
                            onClick={() => toggleSection('draw')}
                            className={`p-2.5 rounded-xl transition-all ${['pen', 'highlighter', 'eraser', 'text'].includes(currentTool)
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            title="Draw"
                        >
                            <Pencil size={20} />
                        </button>
                        {expandedSection === 'draw' && (
                            <div className={`absolute ${submenuPositionClass} left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 space-y-2 min-w-[180px]`}>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Draw</p>
                                {drawTools.map((tool) => {
                                    const Icon = tool.icon;
                                    return (
                                        <button
                                            key={tool.id}
                                            onClick={() => {
                                                if (tool.value) setTool(tool.value as any);
                                                setExpandedSection(null);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${currentTool === tool.value
                                                ? 'bg-blue-50 text-blue-600 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span>{tool.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Shape Tools */}
                    <div className="relative">
                        <button
                            onClick={() => toggleSection('shapes')}
                            className={`p-2.5 rounded-xl transition-all ${['rectangle', 'circle', 'triangle', 'pentagon', 'hexagon', 'star', 'line', 'arrow'].includes(currentTool)
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            title="Shapes"
                        >
                            <Square size={20} />
                        </button>
                        {expandedSection === 'shapes' && (
                            <div className={`absolute ${submenuPositionClass} left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 space-y-2 min-w-[180px]`}>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Shapes</p>
                                {shapeTools.map((tool) => {
                                    const Icon = tool.icon;
                                    return (
                                        <button
                                            key={tool.id}
                                            onClick={() => {
                                                if (tool.value) setTool(tool.value as any);
                                                setExpandedSection(null);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${currentTool === tool.value
                                                ? 'bg-blue-50 text-blue-600 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span>{tool.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Style */}
                    <div className="relative">
                        <button
                            onClick={() => toggleSection('style')}
                            className="p-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
                            title="Style & Background"
                        >
                            <Palette size={20} />
                        </button>
                        {expandedSection === 'style' && (
                            <div className={`absolute ${submenuPositionClass} left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 space-y-4 min-w-[240px]`}>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Stroke Color</p>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setColor(color)}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${currentColor === color
                                                    ? 'scale-110 border-blue-500 shadow-md'
                                                    : 'border-gray-200 hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                        <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer text-xs text-gray-500 hover:bg-gray-50">
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

                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Canvas Background</p>
                                    <div className="flex flex-wrap gap-2">
                                        {CANVAS_COLORS.map((bg) => (
                                            <button
                                                key={bg.value}
                                                onClick={() => setBackgroundColor(bg.value)}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${backgroundColor === bg.value
                                                    ? 'scale-110 border-blue-500 shadow-md'
                                                    : 'border-gray-200 hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: bg.value }}
                                                title={bg.label}
                                            />
                                        ))}
                                        <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer text-xs text-gray-500 hover:bg-gray-50">
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

                                <div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                        <span className="font-semibold text-gray-400 uppercase tracking-wider">Width</span>
                                        <span className="font-medium text-gray-700">{currentWidth}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        value={currentWidth}
                                        onChange={(e) => setWidth(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Page Style</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PAGE_STYLES.map((style) => (
                                            <button
                                                key={style.value}
                                                onClick={() => setPageStyle(style.value as any)}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${pageStyle === style.value
                                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                                                    : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                                                    }`}
                                            >
                                                {style.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-8 bg-gray-200 mx-1" />

                    {/* Fonts */}
                    <div className="relative">
                        <button
                            onClick={() => toggleSection('fonts')}
                            className={`p-2.5 rounded-xl transition-all ${currentTool === 'text'
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            title="Handwriting Fonts"
                        >
                            <PenTool size={20} />
                        </button>
                        {expandedSection === 'fonts' && (
                            <div className={`absolute ${submenuPositionClass} left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 space-y-2 min-w-[200px] max-h-[60vh] overflow-y-auto custom-scrollbar`}>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Handwriting Fonts</p>
                                {HANDWRITING_FONTS.map((font) => (
                                    <button
                                        key={font.value}
                                        onClick={() => {
                                            setFontFamily(font.value);
                                            setExpandedSection(null);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${currentFontFamily === font.value
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        style={{ fontFamily: font.value }}
                                    >
                                        <span>{font.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Text Tool Options (Font Size only) - shown when text tool is active but no stroke selected */}
                    {currentTool === 'text' && selectedStrokeIds.length === 0 && (
                        <select
                            value={currentFontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Font Size"
                        >
                            <option value={12}>12px</option>
                            <option value={16}>16px</option>
                            <option value={20}>20px</option>
                            <option value={24}>24px</option>
                            <option value={32}>32px</option>
                            <option value={48}>48px</option>
                            <option value={64}>64px</option>
                        </select>
                    )}

                    {/* Text Formatting Options - shown when a text stroke is selected */}
                    {selectedStrokeIds.length > 0 && (() => {
                        const selectedTextStroke = strokes.find(s => selectedStrokeIds.includes(s.id) && s.tool === 'text');
                        if (!selectedTextStroke) return null;
                        return (
                            <>
                                {/* Font Size */}
                                <select
                                    value={selectedTextStroke.fontSize || 20}
                                    onChange={(e) => {
                                        const newSize = Number(e.target.value);
                                        const newStroke = { ...selectedTextStroke, fontSize: newSize, width: newSize };
                                        const newStrokes = strokes.map(s => s.id === selectedTextStroke.id ? newStroke : s);
                                        useWhiteboardStore.getState().replaceStrokes(newStrokes);
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    title="Font Size"
                                >
                                    <option value={12}>12px</option>
                                    <option value={16}>16px</option>
                                    <option value={20}>20px</option>
                                    <option value={24}>24px</option>
                                    <option value={32}>32px</option>
                                    <option value={48}>48px</option>
                                    <option value={64}>64px</option>
                                </select>

                                {/* Bold */}
                                <button
                                    onClick={() => {
                                        const newWeight = selectedTextStroke.fontWeight === 'bold' ? 'normal' : 'bold';
                                        const newStroke = { ...selectedTextStroke, fontWeight: newWeight as 'bold' | 'normal' };
                                        const newStrokes = strokes.map(s => s.id === selectedTextStroke.id ? newStroke : s);
                                        useWhiteboardStore.getState().replaceStrokes(newStrokes);
                                    }}
                                    className={`px-2 py-1 rounded-lg font-bold transition-colors ${selectedTextStroke.fontWeight === 'bold'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    title="Bold"
                                >
                                    B
                                </button>

                                {/* Italic */}
                                <button
                                    onClick={() => {
                                        const newStyle = selectedTextStroke.fontStyle === 'italic' ? 'normal' : 'italic';
                                        const newStroke = { ...selectedTextStroke, fontStyle: newStyle as 'italic' | 'normal' };
                                        const newStrokes = strokes.map(s => s.id === selectedTextStroke.id ? newStroke : s);
                                        useWhiteboardStore.getState().replaceStrokes(newStrokes);
                                    }}
                                    className={`px-2 py-1 rounded-lg italic transition-colors ${selectedTextStroke.fontStyle === 'italic'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    title="Italic"
                                >
                                    I
                                </button>

                                {/* Underline */}
                                <button
                                    onClick={() => {
                                        const newDec = selectedTextStroke.textDecoration === 'underline' ? 'none' : 'underline';
                                        const newStroke = { ...selectedTextStroke, textDecoration: newDec as 'underline' | 'none' };
                                        const newStrokes = strokes.map(s => s.id === selectedTextStroke.id ? newStroke : s);
                                        useWhiteboardStore.getState().replaceStrokes(newStrokes);
                                    }}
                                    className={`px-2 py-1 rounded-lg underline transition-colors ${selectedTextStroke.textDecoration === 'underline'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    title="Underline"
                                >
                                    U
                                </button>
                            </>
                        );
                    })()}

                    <div className="w-px h-8 bg-gray-200 mx-1" />

                    {/* Undo / Redo */}
                    <button
                        onClick={() => undo()}
                        disabled={!canUndo}
                        className={`p-2.5 rounded-xl transition-all ${!canUndo
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        title="Undo"
                    >
                        <Undo2 size={20} />
                    </button>

                    <button
                        onClick={() => redo()}
                        disabled={!canRedo}
                        className={`p-2.5 rounded-xl transition-all ${!canRedo
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        title="Redo"
                    >
                        <Redo2 size={20} />
                    </button>

                    <div className="w-px h-8 bg-gray-200 mx-1" />

                    {/* Export / Import */}
                    <button
                        onClick={handleExportBoard}
                        className="p-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
                        title="Export Board"
                    >
                        <Download size={20} />
                    </button>

                    <button
                        onClick={triggerImportDialog}
                        className="p-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
                        title="Import Board"
                    >
                        <Upload size={20} />
                    </button>

                    <button
                        onClick={handleExportAllPages}
                        disabled={isExportingPDF}
                        className={`p-2.5 rounded-xl transition-all ${isExportingPDF
                            ? 'text-blue-400 bg-blue-50 cursor-wait'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        title="Export All Pages as PDF"
                    >
                        <FileDown size={20} />
                    </button>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImportBoard}
                        className="hidden"
                    />

                    {/* Clear Board */}
                    <button
                        onClick={async () => {
                            if (await showConfirm('Clear Board', 'Are you sure you want to clear the board? This cannot be undone.', 'danger')) {
                                clearPage();
                            }
                        }}
                        className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all"
                        title="Clear Board"
                    >
                        <Trash2 size={20} />
                    </button>

                    {/* Magic Mode Toggle */}
                    <button
                        onClick={toggleMagicMode}
                        className={`p-2.5 rounded-xl transition-all ${isMagicMode
                            ? 'bg-purple-100 text-purple-600 shadow-sm ring-2 ring-purple-200'
                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-500'
                            }`}
                        title="Magic Mode (AI Shape Recognition)"
                    >
                        <Sparkles size={20} />
                    </button>
                </div>
            </div>

            {/* Export Progress Overlay */}
            {exportProgress && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center">
                        <div className="mb-4">
                            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Exporting PDF...</h3>
                        <p className="text-gray-500 mb-4">
                            Processing page {exportProgress.current} of {exportProgress.total}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
