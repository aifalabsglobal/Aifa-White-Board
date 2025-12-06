'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Copy, Palette, Check, Volume2, VolumeX } from 'lucide-react';

interface PageData {
    id: string;
    title: string;
    order: number;
    thumbnail?: string;
}

interface FlipbookViewerProps {
    boardId: string;
    pages: PageData[];
    onDownloadPDF?: () => void;
}

const BACKGROUNDS = [
    { name: 'Light', value: 'bg-gradient-to-br from-slate-100 via-gray-50 to-white', dark: false },
    { name: 'Warm', value: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50', dark: false },
    { name: 'Sky', value: 'bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50', dark: false },
    { name: 'Nature', value: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50', dark: false },
    { name: 'Lavender', value: 'bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50', dark: false },
    { name: 'Dark', value: 'bg-gradient-to-br from-slate-800 via-gray-900 to-slate-900', dark: true },
];

export default function FlipbookViewer({ boardId, pages, onDownloadPDF }: FlipbookViewerProps) {
    const [background, setBackground] = useState(BACKGROUNDS[0]);
    const [showBgPicker, setShowBgPicker] = useState(false);
    const [copied, setCopied] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [currentSpread, setCurrentSpread] = useState(0);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [dragProgress, setDragProgress] = useState(0);
    const [dragSide, setDragSide] = useState<'left' | 'right' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const bookRef = useRef<HTMLDivElement>(null);
    const dragStartX = useRef(0);

    const totalSpreads = Math.ceil(pages.length / 2);

    const playFlipSound = useCallback(() => {
        if (!soundEnabled) return;
        const audio = new Audio('/sounds/page-flip.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => { });
    }, [soundEnabled]);

    // Handle mouse/touch start
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent, side: 'left' | 'right') => {
        if (isAnimating) return;
        if (side === 'right' && currentSpread >= totalSpreads - 1) return;
        if (side === 'left' && currentSpread <= 0) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        dragStartX.current = clientX;
        setIsDragging(true);
        setDragSide(side);
        setDragProgress(0);
    };

    // Handle mouse/touch move
    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging || !bookRef.current) return;

            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const bookWidth = bookRef.current.offsetWidth / 2;
            const deltaX = clientX - dragStartX.current;

            let progress = 0;
            if (dragSide === 'right') {
                progress = Math.max(0, Math.min(1, -deltaX / bookWidth));
            } else {
                progress = Math.max(0, Math.min(1, deltaX / bookWidth));
            }

            setDragProgress(progress);
        };

        const handleEnd = () => {
            if (!isDragging) return;

            setIsDragging(false);

            // If dragged more than 30%, complete the flip with bounce animation
            if (dragProgress > 0.3) {
                setIsAnimating(true);
                setDragProgress(1); // Animate to completion
                playFlipSound();

                setTimeout(() => {
                    setIsSwitching(true); // Disable transition for reset
                    if (dragSide === 'right') {
                        setCurrentSpread(prev => Math.min(prev + 1, totalSpreads - 1));
                    } else {
                        setCurrentSpread(prev => Math.max(prev - 1, 0));
                    }
                    setDragProgress(0);
                    setDragSide(null);

                    // Re-enable transition after a brief delay
                    setTimeout(() => {
                        setIsSwitching(false);
                        setIsAnimating(false);
                    }, 50);
                }, 400);
            } else {
                // Snap back
                setDragProgress(0);
                setDragSide(null);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, dragSide, dragProgress, playFlipSound, totalSpreads]);

    const flipToNext = () => {
        if (currentSpread >= totalSpreads - 1 || isAnimating) return;
        setIsAnimating(true);
        setDragSide('right');
        setDragProgress(1);
        playFlipSound();

        setTimeout(() => {
            setIsSwitching(true);
            setCurrentSpread(prev => Math.min(prev + 1, totalSpreads - 1));
            setDragProgress(0);
            setDragSide(null);
            setTimeout(() => {
                setIsSwitching(false);
                setIsAnimating(false);
            }, 50);
        }, 400);
    };

    const flipToPrev = () => {
        if (currentSpread <= 0 || isAnimating) return;
        setIsAnimating(true);
        setDragSide('left');
        setDragProgress(1);
        playFlipSound();

        setTimeout(() => {
            setIsSwitching(true);
            setCurrentSpread(prev => Math.max(prev - 1, 0));
            setDragProgress(0);
            setDragSide(null);
            setTimeout(() => {
                setIsSwitching(false);
                setIsAnimating(false);
            }, 50);
        }, 400);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isDark = background.dark;

    // Current visible pages
    const leftPageIndex = currentSpread * 2;
    const rightPageIndex = currentSpread * 2 + 1;
    const leftPage = pages[leftPageIndex];
    const rightPage = pages[rightPageIndex];

    // Calculate 3D transform based on drag
    const rightPageRotation = dragSide === 'right' ? dragProgress * -180 : 0;
    const leftPageRotation = dragSide === 'left' ? dragProgress * 180 : 0;

    // Page style with rounded corners and clipping
    const pageStyle = {
        borderRadius: '8px',
        overflow: 'hidden' as const,
    };

    return (
        <div className={`fixed inset-0 ${background.value} overflow-hidden transition-colors duration-500`}>
            {/* Logo */}
            <div className="absolute top-4 left-4 z-50">
                <div className="bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-gray-100">
                    <span className="text-lg sm:text-xl font-bold tracking-tight">
                        <span className="text-blue-600">ai</span>
                        <span className="text-gray-900">fa</span>
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-2.5 rounded-xl shadow-lg border transition-all ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    title={soundEnabled ? "Mute Sound" : "Enable Sound"}
                >
                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowBgPicker(!showBgPicker)}
                        className={`p-2.5 rounded-xl shadow-lg border transition-all ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Palette size={18} />
                    </button>
                    {showBgPicker && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[140px] z-50">
                            {BACKGROUNDS.map((bg) => (
                                <button
                                    key={bg.name}
                                    onClick={() => { setBackground(bg); setShowBgPicker(false); }}
                                    className={`w-full px-3 py-2 rounded-lg text-sm text-left flex items-center justify-between hover:bg-gray-100 ${background.name === bg.name ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                                >
                                    {bg.name}
                                    {background.name === bg.name && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={copyLink}
                    className={`p-2.5 rounded-xl shadow-lg border transition-all ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} ${copied ? 'bg-green-500 text-white border-green-500' : ''}`}
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>

                {onDownloadPDF && (
                    <button
                        onClick={onDownloadPDF}
                        className="p-2.5 rounded-xl shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all"
                    >
                        <Download size={18} />
                    </button>
                )}
            </div>

            {/* Full-screen Book Container */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '2500px' }}>
                {/* Book */}
                <div
                    ref={bookRef}
                    className="relative select-none"
                    style={{
                        // Maintain 16:11 aspect ratio (2 pages of 800x1100)
                        width: 'min(90vw, 85vh * (16/11))',
                        height: 'min(85vh, 90vw * (11/16))',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* Book shadow underneath */}
                    <div
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                        style={{
                            width: '80%',
                            height: '20px',
                            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
                            filter: 'blur(10px)',
                        }}
                    />

                    {/* Left Page */}
                    <div
                        className="absolute left-0 top-0 w-1/2 h-full cursor-grab active:cursor-grabbing"
                        style={{
                            ...pageStyle,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            transformOrigin: 'right center',
                            transformStyle: 'preserve-3d',
                            transform: `rotateY(${leftPageRotation}deg)`,
                            transition: isDragging || isSwitching ? 'none' : 'transform 0.4s cubic-bezier(0.645, 0.045, 0.355, 1.1)',
                            boxShadow: leftPageRotation > 0
                                ? `${5 + leftPageRotation * 0.1}px 0 ${20 + leftPageRotation * 0.2}px rgba(0,0,0,${0.1 + leftPageRotation * 0.002})`
                                : 'inset -5px 0 15px rgba(0,0,0,0.1)',
                            zIndex: dragSide === 'left' ? 30 : 10,
                        }}
                        onMouseDown={(e) => handleDragStart(e, 'left')}
                        onTouchStart={(e) => handleDragStart(e, 'left')}
                    >
                        {/* Front of left page */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backfaceVisibility: 'hidden',
                                borderRadius: 'inherit',
                                overflow: 'hidden',
                            }}
                        >
                            {leftPage?.thumbnail ? (
                                <img
                                    src={leftPage.thumbnail}
                                    alt={`Page ${leftPageIndex + 1}`}
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                    draggable={false}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
                                    {leftPage ? 'Empty Page' : ''}
                                </div>
                            )}
                            <div className="absolute bottom-6 left-6 text-sm font-medium text-gray-600 bg-white/90 px-3 py-1.5 rounded-full shadow pointer-events-none">
                                {leftPageIndex + 1}
                            </div>
                            <div
                                className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
                                style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)' }}
                            />
                        </div>
                        {/* Back of left page */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                borderRadius: 'inherit',
                                overflow: 'hidden',
                            }}
                        >
                            {pages[(currentSpread - 1) * 2 + 1]?.thumbnail ? (
                                <img
                                    src={pages[(currentSpread - 1) * 2 + 1].thumbnail}
                                    alt="Previous"
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                    style={{ transform: 'scaleX(-1)' }}
                                    draggable={false}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-200" />
                            )}
                        </div>
                    </div>

                    {/* Right Page */}
                    <div
                        className="absolute right-0 top-0 w-1/2 h-full cursor-grab active:cursor-grabbing"
                        style={{
                            ...pageStyle,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            transformOrigin: 'left center',
                            transformStyle: 'preserve-3d',
                            transform: `rotateY(${rightPageRotation}deg)`,
                            transition: isDragging || isSwitching ? 'none' : 'transform 0.4s cubic-bezier(0.645, 0.045, 0.355, 1.1)',
                            boxShadow: rightPageRotation < 0
                                ? `${-5 + rightPageRotation * 0.1}px 0 ${20 - rightPageRotation * 0.2}px rgba(0,0,0,${0.1 - rightPageRotation * 0.002})`
                                : 'inset 5px 0 15px rgba(0,0,0,0.1)',
                            zIndex: dragSide === 'right' ? 30 : 10,
                        }}
                        onMouseDown={(e) => handleDragStart(e, 'right')}
                        onTouchStart={(e) => handleDragStart(e, 'right')}
                    >
                        {/* Front of right page */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backfaceVisibility: 'hidden',
                                borderRadius: 'inherit',
                                overflow: 'hidden',
                            }}
                        >
                            {rightPage?.thumbnail ? (
                                <img
                                    src={rightPage.thumbnail}
                                    alt={`Page ${rightPageIndex + 1}`}
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                    draggable={false}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
                                    {rightPage ? 'Empty Page' : ''}
                                </div>
                            )}
                            {rightPage && (
                                <div className="absolute bottom-6 right-6 text-sm font-medium text-gray-600 bg-white/90 px-3 py-1.5 rounded-full shadow pointer-events-none">
                                    {rightPageIndex + 1}
                                </div>
                            )}
                            <div
                                className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none"
                                style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)' }}
                            />
                        </div>
                        {/* Back of right page */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                borderRadius: 'inherit',
                                overflow: 'hidden',
                            }}
                        >
                            {pages[(currentSpread + 1) * 2]?.thumbnail ? (
                                <img
                                    src={pages[(currentSpread + 1) * 2].thumbnail}
                                    alt="Next"
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                    style={{ transform: 'scaleX(-1)' }}
                                    draggable={false}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-200" />
                            )}
                        </div>
                    </div>

                    {/* Center spine */}
                    <div
                        className="absolute left-1/2 top-0 bottom-0 w-1 -ml-0.5 z-20 pointer-events-none"
                        style={{
                            background: 'linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0.4), rgba(0,0,0,0.2))',
                        }}
                    />
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
                <button
                    onClick={flipToPrev}
                    disabled={currentSpread <= 0 || isAnimating}
                    className={`p-3 rounded-full shadow-lg border transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    <ChevronLeft size={24} />
                </button>

                <div className={`px-5 py-2.5 rounded-full shadow-lg border backdrop-blur-md ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white/90 border-gray-200 text-gray-600'}`}>
                    <span className="font-semibold text-sm">
                        Page {leftPageIndex + 1}{rightPage ? `-${rightPageIndex + 1}` : ''} of {pages.length}
                    </span>
                </div>

                <button
                    onClick={flipToNext}
                    disabled={currentSpread >= totalSpreads - 1 || isAnimating}
                    className={`p-3 rounded-full shadow-lg border transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}
