import { jsPDF } from 'jspdf';
import type Konva from 'konva';
import { Stroke } from '@/store/whiteboardStore';

interface PageData {
    id: string;
    title: string;
    order: number;
    content: {
        strokes: Stroke[];
        backgroundColor?: string;
        pageStyle?: string;
    };
}

interface ExportOptions {
    boardId: string;
    onProgress?: (current: number, total: number) => void;
    pixelRatio?: number;
}

// Load logo image as base64
async function loadLogoAsBase64(): Promise<string | null> {
    try {
        const response = await fetch('/aifa-logo.png');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/**
 * Renders a single page's content to a Konva Stage and returns a data URL
 * Uses two-stage rendering: Konva for strokes, then canvas clip for strict bounds
 */
async function renderPageToDataURL(
    pageData: PageData,
    width: number,
    height: number,
    pixelRatio: number = 2
): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            const Konva = (await import('konva')).default;

            // Create a temporary container for the stage
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.top = '-9999px';
            container.style.left = '-9999px';
            document.body.appendChild(container);

            // Create an off-screen stage
            const stage = new Konva.Stage({
                container: container,
                width: width,
                height: height,
            });

            const layer = new Konva.Layer();
            stage.add(layer);

            // Set background color
            const backgroundColor = pageData.content.backgroundColor || '#3b82f6';
            const pageStyle = pageData.content.pageStyle || 'plain';
            const background = new Konva.Rect({
                x: 0,
                y: 0,
                width: width,
                height: height,
                fill: backgroundColor,
            });
            layer.add(background);

            // Draw page style pattern
            if (pageStyle !== 'plain') {
                const patternCanvas = document.createElement('canvas');
                patternCanvas.width = width;
                patternCanvas.height = height;
                const ctx = patternCanvas.getContext('2d');
                if (ctx) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 1;

                    if (pageStyle === 'ruled' || pageStyle === 'wide-ruled') {
                        const spacing = pageStyle === 'ruled' ? 32 : 40;
                        for (let y = spacing; y < height; y += spacing) {
                            ctx.beginPath();
                            ctx.moveTo(0, y);
                            ctx.lineTo(width, y);
                            ctx.stroke();
                        }
                    } else if (pageStyle === 'graph') {
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
                    } else if (pageStyle === 'dotted') {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        const dotSpacing = 24;
                        for (let x = dotSpacing; x < width; x += dotSpacing) {
                            for (let y = dotSpacing; y < height; y += dotSpacing) {
                                ctx.beginPath();
                                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                    }

                    layer.add(new Konva.Image({
                        x: 0, y: 0,
                        image: patternCanvas,
                        width: width,
                        height: height,
                    }));
                }
            }

            // Create a clip group using Konva's clip property (more reliable than clipFunc)
            const contentGroup = new Konva.Group({
                clip: {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                },
            });

            // Render all strokes into the clipped group
            const strokes = pageData.content.strokes || [];
            strokes.forEach((stroke) => {
                const element = renderStrokeToKonva(stroke, Konva);
                if (element) {
                    contentGroup.add(element);
                }
            });

            layer.add(contentGroup);
            layer.draw();

            // Get the Konva canvas data
            const konvaDataURL = stage.toDataURL({ pixelRatio });

            // Create a final canvas with explicit clipping to ensure strict bounds
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = width * pixelRatio;
            finalCanvas.height = height * pixelRatio;
            const finalCtx = finalCanvas.getContext('2d');

            if (finalCtx) {
                // Create an image from the Konva output
                const img = new Image();
                img.onload = () => {
                    // Clear and clip the canvas
                    finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);

                    // Draw only the portion within bounds (0, 0, width*pixelRatio, height*pixelRatio)
                    finalCtx.drawImage(
                        img,
                        0, 0, width * pixelRatio, height * pixelRatio,  // Source rect (clipped)
                        0, 0, width * pixelRatio, height * pixelRatio   // Dest rect
                    );

                    // Cleanup
                    stage.destroy();
                    document.body.removeChild(container);

                    resolve(finalCanvas.toDataURL('image/png'));
                };
                img.onerror = () => {
                    stage.destroy();
                    document.body.removeChild(container);
                    resolve(konvaDataURL); // Fallback to Konva output
                };
                img.src = konvaDataURL;
            } else {
                // Fallback if canvas context fails
                stage.destroy();
                document.body.removeChild(container);
                resolve(konvaDataURL);
            }
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Converts a Stroke object to a Konva shape
 */
function renderStrokeToKonva(stroke: Stroke, Konva: any): Konva.Shape | Konva.Group | null {
    const compositeOp = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

    // Handle text
    if (stroke.tool === 'text' && stroke.text) {
        const { x, y } = stroke.points[0] ?? { x: 0, y: 0 };
        return new Konva.Text({
            text: stroke.text,
            x: x,
            y: y,
            fontSize: stroke.fontSize || Math.max(stroke.width * 4, 12),
            fontFamily: stroke.fontFamily || 'Caveat',
            fontStyle: stroke.fontStyle || 'normal',
            fontVariant: stroke.fontWeight || 'normal',
            textDecoration: stroke.textDecoration || 'none',
            align: stroke.textAlign || 'left',
            fill: stroke.color,
            opacity: stroke.opacity,
        });
    }

    // Handle shapes
    if (stroke.shapeType && stroke.points.length >= 2) {
        const [start, end] = stroke.points;
        const width = end.x - start.x;
        const height = end.y - start.y;

        switch (stroke.shapeType) {
            case 'rectangle':
                return new Konva.Rect({
                    x: start.x,
                    y: start.y,
                    width: width,
                    height: height,
                    stroke: stroke.color,
                    strokeWidth: stroke.width,
                    opacity: stroke.opacity,
                    globalCompositeOperation: compositeOp,
                });

            case 'circle':
                return new Konva.Ellipse({
                    x: start.x + width / 2,
                    y: start.y + height / 2,
                    radiusX: Math.abs(width / 2),
                    radiusY: Math.abs(height / 2),
                    stroke: stroke.color,
                    strokeWidth: stroke.width,
                    opacity: stroke.opacity,
                    globalCompositeOperation: compositeOp,
                });

            case 'line':
                return new Konva.Line({
                    points: [start.x, start.y, end.x, end.y],
                    stroke: stroke.color,
                    strokeWidth: stroke.width,
                    opacity: stroke.opacity,
                    globalCompositeOperation: compositeOp,
                });

            case 'arrow':
                return new Konva.Arrow({
                    points: [start.x, start.y, end.x, end.y],
                    stroke: stroke.color,
                    strokeWidth: stroke.width,
                    fill: stroke.color,
                    opacity: stroke.opacity,
                    pointerLength: 10,
                    pointerWidth: 10,
                    globalCompositeOperation: compositeOp,
                });

            case 'triangle': {
                const cx = start.x + width / 2;
                const points = [
                    cx, start.y,  // top
                    start.x, end.y,  // bottom left
                    end.x, end.y,  // bottom right
                ];
                return new Konva.Line({
                    points,
                    stroke: stroke.color,
                    strokeWidth: stroke.width,
                    opacity: stroke.opacity,
                    closed: true,
                    globalCompositeOperation: compositeOp,
                });
            }

            case 'pentagon':
            case 'hexagon':
            case 'star': {
                const cx = start.x + width / 2;
                const cy = start.y + height / 2;
                const rx = Math.abs(width / 2);
                const ry = Math.abs(height / 2);
                const sides = stroke.shapeType === 'pentagon' ? 5 : stroke.shapeType === 'hexagon' ? 6 : 5;
                const points: number[] = [];

                if (stroke.shapeType === 'star') {
                    // Star shape with inner and outer points
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

                return new Konva.Line({
                    points,
                    stroke: stroke.color,
                    strokeWidth: stroke.width,
                    opacity: stroke.opacity,
                    closed: true,
                    globalCompositeOperation: compositeOp,
                });
            }
        }
    }

    // Handle freehand drawing (pen, highlighter, eraser)
    if (stroke.points.length > 0) {
        const points = stroke.points.flatMap((p) => [p.x, p.y]);

        return new Konva.Line({
            points: points,
            stroke: stroke.color,
            strokeWidth: stroke.width,
            opacity: stroke.opacity,
            tension: 0.5,
            lineCap: 'round',
            lineJoin: 'round',
            globalCompositeOperation: compositeOp,
        });
    }

    return null;
}

/**
 * Exports all pages from a board as a single PDF file
 */
export async function exportAllPagesAsPDF(options: ExportOptions): Promise<void> {
    const { boardId, onProgress, pixelRatio = 2 } = options;

    try {
        // Load logo first
        const logoBase64 = await loadLogoAsBase64();

        // Fetch all pages for the board
        const response = await fetch(`/api/boards/${boardId}/pages`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pages');
        }

        const pages: PageData[] = await response.json();

        if (!pages || pages.length === 0) {
            throw new Error('No pages found to export');
        }

        // Sort pages by order
        pages.sort((a, b) => a.order - b.order);

        // Create PDF document (A4 landscape)
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Standard canvas dimensions (adjust as needed)
        const canvasWidth = 1920;
        const canvasHeight = 1080;

        // Calculate dimensions to fit full page (no margins for clean export)
        const imgWidth = pageWidth;
        const imgHeight = pageHeight;
        const xOffset = 0;
        const yOffset = 0;

        // Process each page
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            // Report progress
            if (onProgress) {
                onProgress(i + 1, pages.length);
            }

            // Render page to data URL
            const dataURL = await renderPageToDataURL(
                page,
                canvasWidth,
                canvasHeight,
                pixelRatio
            );

            // Add new page if not the first one
            if (i > 0) {
                pdf.addPage();
            }

            // Add image to PDF (full page, no borders)
            pdf.addImage(dataURL, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

            // Add AIFA text logo (bottom right corner)
            const logoX = pageWidth - 25;
            const logoY = pageHeight - 8;
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            // "ai" in blue
            pdf.setTextColor(37, 99, 235); // blue-600
            pdf.text('ai', logoX, logoY);
            // "fa" in dark gray (right after 'ai')
            pdf.setTextColor(31, 41, 55); // gray-800
            pdf.text('fa', logoX + 6, logoY);
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `whiteboard-export-${timestamp}.pdf`;

        // Save the PDF
        pdf.save(filename);

        // Final progress update
        if (onProgress) {
            onProgress(pages.length, pages.length);
        }
    } catch (error) {
        console.error('Error exporting pages as PDF:', error);
        throw error;
    }
}
