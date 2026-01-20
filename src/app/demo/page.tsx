'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    points: Point[];
    color: string;
    width: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
const STROKE_LIMIT = 10; // After this many strokes, prompt to sign up

export default function DemoPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#3b82f6');
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
    const [hasSeenPrompt, setHasSeenPrompt] = useState(false);

    // Redraw canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and fill background
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw all strokes
        [...strokes, { points: currentStroke, color, width: strokeWidth }].forEach(stroke => {
            if (stroke.points.length < 2) return;
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            stroke.points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.stroke();
        });

        // Draw watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AIFA Board Demo', canvas.width / 2, canvas.height - 30);
    }, [strokes, currentStroke, color, strokeWidth]);

    const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        // Check stroke limit
        if (strokes.length >= STROKE_LIMIT && !hasSeenPrompt) {
            setShowSignUpPrompt(true);
            setHasSeenPrompt(true);
            return;
        }
        setIsDrawing(true);
        setCurrentStroke([getPoint(e)]);
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        setCurrentStroke(prev => [...prev, getPoint(e)]);
    };

    const handleEnd = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentStroke.length > 1) {
            setStrokes(prev => [...prev, { points: currentStroke, color, width: strokeWidth }]);
        }
        setCurrentStroke([]);
    };

    const handleClear = () => {
        setStrokes([]);
    };

    return (
        <main className="min-h-screen bg-slate-900">
            {/* Header */}
            <header className="bg-slate-800 border-b border-white/10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link href="/marketing" className="flex items-center gap-2">
                        <Image src="/aifa-logo.png" alt="AIFA" width={32} height={32} className="rounded-lg" />
                        <span className="text-xl font-bold">
                            <span className="text-blue-400">ai</span>
                            <span className="text-white">fa</span>
                            <span className="text-orange-400 ml-1 text-sm">DEMO</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <span className="text-white/50 text-sm hidden sm:block">
                            {strokes.length}/{STROKE_LIMIT} strokes used
                        </span>
                        <Link
                            href="/sign-up"
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
                        >
                            Sign Up for Full Version
                        </Link>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="bg-slate-800/50 border-b border-white/10 py-3">
                <div className="container mx-auto px-4 flex items-center gap-6 overflow-x-auto">
                    {/* Colors */}
                    <div className="flex items-center gap-2">
                        <span className="text-white/50 text-sm mr-2">Color:</span>
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="w-px h-8 bg-white/20" />

                    {/* Stroke Width */}
                    <div className="flex items-center gap-2">
                        <span className="text-white/50 text-sm">Size:</span>
                        {[2, 4, 8].map(w => (
                            <button
                                key={w}
                                onClick={() => setStrokeWidth(w)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${strokeWidth === w ? 'bg-white/20 ring-2 ring-blue-500' : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="rounded-full bg-white" style={{ width: w * 2, height: w * 2 }} />
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-8 bg-white/20" />

                    {/* Clear */}
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all"
                    >
                        Clear
                    </button>

                    <div className="flex-1" />

                    {/* Locked Features */}
                    <div className="flex items-center gap-2 opacity-50">
                        <span className="text-white/50 text-sm">🔒</span>
                        <span className="text-white/40 text-sm">Shapes</span>
                        <span className="text-white/40 text-sm">Text</span>
                        <span className="text-white/40 text-sm">Save</span>
                        <span className="text-white/40 text-sm">Export</span>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 p-4">
                <div className="max-w-5xl mx-auto">
                    <canvas
                        ref={canvasRef}
                        width={1000}
                        height={600}
                        className="w-full rounded-xl shadow-2xl cursor-crosshair touch-none"
                        onMouseDown={handleStart}
                        onMouseMove={handleMove}
                        onMouseUp={handleEnd}
                        onMouseLeave={handleEnd}
                        onTouchStart={handleStart}
                        onTouchMove={handleMove}
                        onTouchEnd={handleEnd}
                    />
                </div>
            </div>

            {/* Demo Limitations Banner */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 py-3 px-4">
                <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-white text-center sm:text-left">
                        <span className="font-medium">🎨 Demo Mode:</span>
                        <span className="text-white/80 ml-2">Drawing only • No save • Limited strokes</span>
                    </div>
                    <Link
                        href="/sign-up"
                        className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all whitespace-nowrap"
                    >
                        Unlock All Features →
                    </Link>
                </div>
            </div>

            {/* Sign Up Prompt Modal */}
            {showSignUpPrompt && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center border border-white/10 shadow-2xl">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-white mb-2">You&apos;re a Natural!</h2>
                        <p className="text-white/70 mb-6">
                            You&apos;ve reached the demo limit. Sign up for free to unlock unlimited strokes,
                            shapes, text, saving, exporting, and so much more!
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/sign-up"
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                Create Free Account
                            </Link>
                            <button
                                onClick={() => setShowSignUpPrompt(false)}
                                className="w-full py-3 bg-white/10 text-white/70 rounded-xl hover:bg-white/20 transition-all"
                            >
                                Continue Demo (Limited)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
