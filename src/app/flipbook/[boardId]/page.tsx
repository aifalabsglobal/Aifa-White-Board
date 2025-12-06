'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import FlipbookViewer from '@/components/FlipbookViewer';
import { exportAllPagesAsPDF } from '@/utils/exportPDF';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';


interface PageData {
    id: string;
    title: string;
    order: number;
    content?: {
        strokes: any[];
        backgroundColor?: string;
        pageStyle?: string;
        thumbnail?: string;
    };
    thumbnail?: string;
}

// Page dimensions for rendering (Portrait 3:4 ratio for realistic book feel)
const PAGE_WIDTH = 800;
const PAGE_HEIGHT = 1100;

// Render strokes to canvas and return data URL
async function renderPageToImage(pageData: PageData): Promise<string> {
    const bgColor = pageData.content?.backgroundColor || '#3b82f6';
    const pageStyle = pageData.content?.pageStyle || 'plain';

    const strokes = pageData.content?.strokes || [];

    // Helper to draw page style pattern
    const drawPageStyle = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        switch (pageStyle) {
            case 'ruled':
            case 'wide-ruled':
                const spacing = pageStyle === 'ruled' ? 32 : 40;
                for (let y = spacing; y < height; y += spacing) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.stroke();
                }
                break;
            case 'graph':
                const gridSize = 24;
                for (let x = gridSize; x < width; x += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                    ctx.stroke();
                }
                for (let y = gridSize; y < height; y += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.stroke();
                }
                break;
            case 'dotted':
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                const dotSpacing = 24;
                for (let x = dotSpacing; x < width; x += dotSpacing) {
                    for (let y = dotSpacing; y < height; y += dotSpacing) {
                        ctx.beginPath();
                        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                break;
        }
    };

    // Return solid background with style for empty pages
    if (strokes.length === 0) {
        const canvas = document.createElement('canvas');
        canvas.width = PAGE_WIDTH;
        canvas.height = PAGE_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
            drawPageStyle(ctx, PAGE_WIDTH, PAGE_HEIGHT);
        }
        return canvas.toDataURL();
    }

    // Render with Konva
    return new Promise(async (resolve) => {
        try {
            const Konva = (await import('konva')).default;
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.top = '-9999px';
            container.style.left = '-9999px';
            document.body.appendChild(container);

            const stage = new Konva.Stage({
                container: container,
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
            });

            const layer = new Konva.Layer();
            stage.add(layer);

            // Full background first (outside clip group so it fills everything)
            layer.add(new Konva.Rect({
                x: 0, y: 0,
                width: PAGE_WIDTH, height: PAGE_HEIGHT,
                fill: bgColor,
            }));

            // Create a group with strict clipping to keep content within page bounds
            const contentGroup = new Konva.Group({
                clip: {
                    x: 0,
                    y: 0,
                    width: PAGE_WIDTH,
                    height: PAGE_HEIGHT,
                },
            });

            // Draw page style pattern using a canvas shape
            if (pageStyle !== 'plain') {
                const patternCanvas = document.createElement('canvas');
                patternCanvas.width = PAGE_WIDTH;
                patternCanvas.height = PAGE_HEIGHT;
                const patternCtx = patternCanvas.getContext('2d');
                if (patternCtx) {
                    drawPageStyle(patternCtx, PAGE_WIDTH, PAGE_HEIGHT);
                    layer.add(new Konva.Image({
                        x: 0, y: 0,
                        image: patternCanvas,
                        width: PAGE_WIDTH,
                        height: PAGE_HEIGHT,
                    }));
                }
            }

            // Scale from typical whiteboard size (1920) to render size
            const s = PAGE_WIDTH / 1920;

            strokes.forEach((stroke: any) => {
                if (stroke.tool === 'text' && stroke.text) {
                    const { x, y } = stroke.points[0] ?? { x: 0, y: 0 };
                    contentGroup.add(new Konva.Text({
                        text: stroke.text,
                        x: x * s, y: y * s,
                        fontSize: (stroke.fontSize || 24) * s,
                        fontFamily: stroke.fontFamily || 'Caveat',
                        fontStyle: stroke.fontStyle || 'normal',
                        fontVariant: stroke.fontWeight || 'normal',
                        textDecoration: stroke.textDecoration || 'none',
                        align: stroke.textAlign || 'left',
                        fill: stroke.color,
                        opacity: stroke.opacity || 1,
                    }));
                } else if (stroke.shapeType && stroke.points?.length >= 2) {
                    const [start, end] = stroke.points;
                    const sx = start.x * s, sy = start.y * s;
                    const ex = end.x * s, ey = end.y * s;
                    const sw = stroke.width * s;

                    if (stroke.shapeType === 'rectangle') {
                        contentGroup.add(new Konva.Rect({
                            x: sx, y: sy, width: ex - sx, height: ey - sy,
                            stroke: stroke.color, strokeWidth: sw, opacity: stroke.opacity || 1,
                        }));
                    } else if (stroke.shapeType === 'circle') {
                        contentGroup.add(new Konva.Ellipse({
                            x: sx + (ex - sx) / 2, y: sy + (ey - sy) / 2,
                            radiusX: Math.abs((ex - sx) / 2), radiusY: Math.abs((ey - sy) / 2),
                            stroke: stroke.color, strokeWidth: sw, opacity: stroke.opacity || 1,
                        }));
                    } else if (stroke.shapeType === 'line') {
                        contentGroup.add(new Konva.Line({
                            points: [sx, sy, ex, ey],
                            stroke: stroke.color, strokeWidth: sw, opacity: stroke.opacity || 1,
                        }));
                    } else if (stroke.shapeType === 'arrow') {
                        contentGroup.add(new Konva.Arrow({
                            points: [sx, sy, ex, ey],
                            stroke: stroke.color, fill: stroke.color, strokeWidth: sw, opacity: stroke.opacity || 1,
                        }));
                    } else if (stroke.shapeType === 'triangle') {
                        const cx = sx + (ex - sx) / 2;
                        contentGroup.add(new Konva.Line({
                            points: [cx, sy, sx, ey, ex, ey],
                            stroke: stroke.color, strokeWidth: sw, opacity: stroke.opacity || 1, closed: true,
                        }));
                    } else if (stroke.shapeType === 'pentagon' || stroke.shapeType === 'hexagon' || stroke.shapeType === 'star') {
                        const cx = sx + (ex - sx) / 2;
                        const cy = sy + (ey - sy) / 2;
                        const rx = Math.abs((ex - sx) / 2);
                        const ry = Math.abs((ey - sy) / 2);
                        const sides = stroke.shapeType === 'pentagon' ? 5 : stroke.shapeType === 'hexagon' ? 6 : 5;
                        const points: number[] = [];

                        if (stroke.shapeType === 'star') {
                            for (let i = 0; i < 10; i++) {
                                const angle = (i * Math.PI / 5) - Math.PI / 2;
                                const r = i % 2 === 0 ? rx : rx * 0.4;
                                const rY = i % 2 === 0 ? ry : ry * 0.4;
                                points.push(cx + r * Math.cos(angle), cy + rY * Math.sin(angle));
                            }
                        } else {
                            for (let i = 0; i < sides; i++) {
                                const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
                                points.push(cx + rx * Math.cos(angle), cy + ry * Math.sin(angle));
                            }
                        }

                        contentGroup.add(new Konva.Line({
                            points, stroke: stroke.color, strokeWidth: sw, opacity: stroke.opacity || 1, closed: true,
                        }));
                    }
                } else if (stroke.points?.length > 0) {
                    const points = stroke.points.flatMap((p: any) => [p.x * s, p.y * s]);
                    contentGroup.add(new Konva.Line({
                        points, stroke: stroke.color, strokeWidth: stroke.width * s,
                        opacity: stroke.opacity || 1, tension: 0.5, lineCap: 'round', lineJoin: 'round',
                        globalCompositeOperation: stroke.tool === 'eraser' ? 'destination-out' : 'source-over',
                    }));
                }
            });

            layer.add(contentGroup);
            layer.draw();

            // Two-stage rendering: Konva → Canvas with explicit clip
            const konvaDataURL = stage.toDataURL({ pixelRatio: 1 });

            // Create a final canvas to ensure strict clipping
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = PAGE_WIDTH;
            finalCanvas.height = PAGE_HEIGHT;
            const finalCtx = finalCanvas.getContext('2d');

            if (finalCtx) {
                const img = new Image();
                img.onload = () => {
                    // Draw only the bounded portion
                    finalCtx.drawImage(
                        img,
                        0, 0, PAGE_WIDTH, PAGE_HEIGHT,  // Source rect (clipped)
                        0, 0, PAGE_WIDTH, PAGE_HEIGHT   // Dest rect
                    );

                    stage.destroy();
                    document.body.removeChild(container);
                    resolve(finalCanvas.toDataURL());
                };
                img.onerror = () => {
                    stage.destroy();
                    document.body.removeChild(container);
                    resolve(konvaDataURL);
                };
                img.src = konvaDataURL;
            } else {
                stage.destroy();
                document.body.removeChild(container);
                resolve(konvaDataURL);
            }
        } catch (e) {
            console.error('Render error:', e);
            const canvas = document.createElement('canvas');
            canvas.width = PAGE_WIDTH; canvas.height = PAGE_HEIGHT;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT); }
            resolve(canvas.toDataURL());
        }
    });
}

export default function FlipbookPage() {
    const params = useParams();
    const boardId = params.boardId as string;
    const [pages, setPages] = useState<PageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const loadBoard = async () => {
            try {
                const res = await fetch(`/api/boards/${boardId}`);
                if (!res.ok) throw new Error('Failed to load board');
                const data = await res.json();

                if (data.pages?.length > 0) {
                    // Load page content
                    const loadedPages = await Promise.all(
                        data.pages.map(async (page: any) => {
                            try {
                                const pageRes = await fetch(`/api/pages/${page.id}`);
                                if (pageRes.ok) {
                                    const pageData = await pageRes.json();
                                    return { ...page, content: pageData.content };
                                }
                            } catch (e) { console.error('Page load error:', e); }
                            return page;
                        })
                    );

                    // Render to images
                    const pagesWithImages = await Promise.all(
                        loadedPages.map(async (page) => ({
                            ...page,
                            thumbnail: await renderPageToImage(page),
                        }))
                    );
                    setPages(pagesWithImages);
                }
            } catch (error) {
                console.error('Flipbook load error:', error);
            } finally {
                setLoading(false);
            }
        };
        loadBoard();
    }, [boardId]);

    const handleDownloadPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            await exportAllPagesAsPDF({ boardId, pixelRatio: 2 });
        } catch (error) {
            console.error('PDF export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (pages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
                <h2 className="text-xl mb-4">No pages found</h2>
                <Link href={`/board/${boardId}`} className="text-blue-400 hover:underline">
                    Go back to editor
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="absolute top-4 left-4 z-10">
                <Link href={`/board/${boardId}`} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Editor</span>
                </Link>
            </div>
            <FlipbookViewer boardId={boardId} pages={pages} onDownloadPDF={handleDownloadPDF} />
        </div>
    );
}
