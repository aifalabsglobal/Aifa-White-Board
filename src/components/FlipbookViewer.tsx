'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, Copy, Palette, Check } from 'lucide-react';

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
    const [currentSpread, setCurrentSpread] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);
    const [flipProgress, setFlipProgress] = useState(0);
    const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [background, setBackground] = useState(BACKGROUNDS[0]);
    const [showBgPicker, setShowBgPicker] = useState(false);
    const [copied, setCopied] = useState(false);
    const bookRef = useRef<HTMLDivElement>(null);

    const totalSpreads = Math.ceil(pages.length / 2);

    const animateFlip = useCallback((direction: 'next' | 'prev', startProgress = direction === 'next' ? 0 : 180) => {
        setFlipDirection(direction);
        setIsFlipping(true);

        let progress = startProgress;
        const targetProgress = direction === 'next' ? 180 : 0;
        const step = direction === 'next' ? 5 : -5;

        const animate = () => {
            progress += step;
            setFlipProgress(Math.max(0, Math.min(180, progress)));

            if ((direction === 'next' && progress < targetProgress) ||
                (direction === 'prev' && progress > targetProgress)) {
                requestAnimationFrame(animate);
            } else {
                if (direction === 'next') setCurrentSpread(prev => Math.min(prev + 1, totalSpreads - 1));
                else setCurrentSpread(prev => Math.max(prev - 1, 0));
                setIsFlipping(false);
                setFlipProgress(0);
                setFlipDirection(null);
            }
        };
        requestAnimationFrame(animate);
    }, [totalSpreads]);

    const flipToNext = useCallback(() => {
        if (isFlipping || currentSpread >= totalSpreads - 1) return;
        animateFlip('next');
    }, [currentSpread, totalSpreads, isFlipping, animateFlip]);

    const flipToPrev = useCallback(() => {
        if (isFlipping || currentSpread <= 0) return;
        animateFlip('prev');
    }, [currentSpread, isFlipping, animateFlip]);

    // Drag handling
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent, side: 'left' | 'right') => {
        if (isFlipping) return;
        setIsDragging(true);
        setFlipDirection(side === 'right' ? 'next' : 'prev');
    };

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !bookRef.current) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const rect = bookRef.current.getBoundingClientRect();
        const bookCenter = rect.left + rect.width / 2;

        let progress: number;
        if (flipDirection === 'next') {
            progress = Math.max(0, Math.min(180, ((bookCenter - clientX) / (rect.width / 2)) * 180));
        } else {
            progress = Math.max(0, Math.min(180, ((clientX - bookCenter) / (rect.width / 2)) * 180));
        }
        setFlipProgress(progress);
    }, [isDragging, flipDirection]);

    const handleDragEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        if (flipProgress > 90) {
            if (flipDirection === 'next' && currentSpread < totalSpreads - 1) {
                animateFlip('next', flipProgress);
            } else if (flipDirection === 'prev' && currentSpread > 0) {
                animateFlip('prev', flipProgress);
            } else {
                setFlipProgress(0);
                setFlipDirection(null);
            }
        } else {
            setFlipProgress(0);
            setFlipDirection(null);
        }
    }, [isDragging, flipProgress, flipDirection, currentSpread, totalSpreads, animateFlip]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove);
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') flipToNext();
            if (e.key === 'ArrowLeft') flipToPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [flipToNext, flipToPrev]);

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const leftPageIndex = currentSpread * 2;
    const rightPageIndex = leftPageIndex + 1;
    const leftPage = pages[leftPageIndex];
    const rightPage = pages[rightPageIndex];
    const nextLeftPage = pages[(currentSpread + 1) * 2];
    const prevRightPage = pages[currentSpread * 2 - 1];

    const shadowOpacity = flipProgress / 360;
    const isDark = background.dark;

    return (
        <div className={`flex flex-col items-center justify-center h-screen ${background.value} overflow-hidden transition-colors duration-500`}>
            {/* Logo */}
            <div className="absolute top-4 left-4 z-20">
                <div className="bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-gray-100">
                    <span className="text-lg sm:text-xl font-bold tracking-tight">
                        <span className="text-blue-600">ai</span>
                        <span className="text-gray-900">fa</span>
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                {/* Background Picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowBgPicker(!showBgPicker)}
                        className={`p-2.5 rounded-xl shadow-lg border transition-all ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Palette size={18} />
                    </button>
                    {showBgPicker && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[140px]">
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

                {/* Copy Link */}
                <button
                    onClick={copyLink}
                    className={`p-2.5 rounded-xl shadow-lg border transition-all ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} ${copied ? 'bg-green-500 text-white border-green-500' : ''}`}
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>

                {/* Download PDF */}
                {onDownloadPDF && (
                    <button
                        onClick={onDownloadPDF}
                        className="p-2.5 rounded-xl shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all"
                    >
                        <Download size={18} />
                    </button>
                )}
            </div>

            {/* 3D Book */}
            <div
                className="relative flex-1 flex items-center justify-center w-full px-4"
                style={{ perspective: '2000px' }}
            >
                <div
                    ref={bookRef}
                    className="relative flex cursor-grab active:cursor-grabbing select-none"
                    style={{
                        width: 'min(94vw, 1400px)',
                        height: 'min(80vh, 788px)',
                        transformStyle: 'preserve-3d',
                        transform: 'rotateX(2deg)',
                    }}
                >
                    {/* Book Shadow */}
                    <div
                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[75%] h-8 rounded-full"
                        style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.2) 0%, transparent 70%)' }}
                    />

                    {/* LEFT PAGE */}
                    <div
                        className="relative w-1/2 h-full overflow-hidden rounded-l-lg shadow-2xl"
                        style={{ backgroundColor: '#fafafa' }}
                        onMouseDown={(e) => currentSpread > 0 && handleDragStart(e, 'left')}
                        onTouchStart={(e) => currentSpread > 0 && handleDragStart(e, 'left')}
                    >
                        {leftPage?.thumbnail ? (
                            <img src={leftPage.thumbnail} alt="" className="w-full h-full object-cover" draggable={false} />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                        )}
                        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset -8px 0 20px rgba(0,0,0,0.08)' }} />
                        {/* Page number */}
                        <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 font-semibold text-xs border border-gray-200">
                            {leftPageIndex + 1}
                        </div>
                    </div>

                    {/* SPINE */}
                    <div
                        className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 z-30"
                        style={{
                            background: 'linear-gradient(90deg, #e5e5e5 0%, #d4d4d4 50%, #e5e5e5 100%)',
                            boxShadow: '0 0 15px rgba(0,0,0,0.15)',
                        }}
                    />

                    {/* RIGHT PAGE */}
                    <div
                        className="relative w-1/2 h-full overflow-hidden rounded-r-lg shadow-2xl"
                        style={{ backgroundColor: '#fafafa' }}
                        onMouseDown={(e) => currentSpread < totalSpreads - 1 && handleDragStart(e, 'right')}
                        onTouchStart={(e) => currentSpread < totalSpreads - 1 && handleDragStart(e, 'right')}
                    >
                        {rightPage?.thumbnail ? (
                            <img src={rightPage.thumbnail} alt="" className="w-full h-full object-cover" draggable={false} />
                        ) : rightPageIndex < pages.length ? (
                            <div className="w-full h-full bg-gradient-to-bl from-slate-100 to-slate-200" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-bl from-gray-100 to-gray-200" />
                        )}
                        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 8px 0 20px rgba(0,0,0,0.08)' }} />
                        {/* Page number */}
                        {rightPageIndex < pages.length && (
                            <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 font-semibold text-xs border border-gray-200">
                                {rightPageIndex + 1}
                            </div>
                        )}
                    </div>

                    {/* FLIP NEXT */}
                    {(isFlipping || isDragging) && flipDirection === 'next' && (
                        <>
                            <div
                                className="absolute right-0 top-0 w-1/2 h-full overflow-hidden z-40 rounded-r-lg shadow-2xl"
                                style={{
                                    backgroundColor: '#fafafa',
                                    transformStyle: 'preserve-3d',
                                    transformOrigin: 'left center',
                                    transform: `rotateY(-${flipProgress}deg)`,
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                {rightPage?.thumbnail ? (
                                    <img src={rightPage.thumbnail} alt="" className="w-full h-full object-cover" draggable={false} />
                                ) : (
                                    <div className="w-full h-full bg-slate-100" />
                                )}
                                <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(0,0,0,${shadowOpacity * 0.3}) 0%, transparent 60%)` }} />
                            </div>
                            <div
                                className="absolute right-0 top-0 w-1/2 h-full overflow-hidden z-40 rounded-r-lg shadow-2xl"
                                style={{
                                    backgroundColor: '#fafafa',
                                    transformStyle: 'preserve-3d',
                                    transformOrigin: 'left center',
                                    transform: `rotateY(${180 - flipProgress}deg)`,
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                {nextLeftPage?.thumbnail ? (
                                    <img src={nextLeftPage.thumbnail} alt="" className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} draggable={false} />
                                ) : (
                                    <div className="w-full h-full bg-slate-50" />
                                )}
                            </div>
                        </>
                    )}

                    {/* FLIP PREV */}
                    {(isFlipping || isDragging) && flipDirection === 'prev' && (
                        <>
                            <div
                                className="absolute left-0 top-0 w-1/2 h-full overflow-hidden z-40 rounded-l-lg shadow-2xl"
                                style={{
                                    backgroundColor: '#fafafa',
                                    transformStyle: 'preserve-3d',
                                    transformOrigin: 'right center',
                                    transform: `rotateY(${flipProgress}deg)`,
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                {leftPage?.thumbnail ? (
                                    <img src={leftPage.thumbnail} alt="" className="w-full h-full object-cover" draggable={false} />
                                ) : (
                                    <div className="w-full h-full bg-slate-100" />
                                )}
                            </div>
                            <div
                                className="absolute left-0 top-0 w-1/2 h-full overflow-hidden z-40 rounded-l-lg shadow-2xl"
                                style={{
                                    backgroundColor: '#fafafa',
                                    transformStyle: 'preserve-3d',
                                    transformOrigin: 'right center',
                                    transform: `rotateY(${flipProgress - 180}deg)`,
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                {prevRightPage?.thumbnail ? (
                                    <img src={prevRightPage.thumbnail} alt="" className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} draggable={false} />
                                ) : (
                                    <div className="w-full h-full bg-slate-50" />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-6 pb-6">
                <button
                    onClick={flipToPrev}
                    disabled={currentSpread === 0 || isFlipping}
                    className={`p-3 rounded-full shadow-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    <ChevronLeft size={22} />
                </button>

                {/* Page indicator */}
                <div className={`px-4 py-2 rounded-full shadow-lg border ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                    <span className="font-medium">{leftPageIndex + 1}</span>
                    <span className="opacity-50"> - </span>
                    <span className="font-medium">{Math.min(rightPageIndex + 1, pages.length)}</span>
                    <span className="opacity-50"> of </span>
                    <span className="font-medium">{pages.length}</span>
                </div>

                <button
                    onClick={flipToNext}
                    disabled={currentSpread >= totalSpreads - 1 || isFlipping}
                    className={`p-3 rounded-full shadow-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    <ChevronRight size={22} />
                </button>
            </div>
        </div>
    );
}
