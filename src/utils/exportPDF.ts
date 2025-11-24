import { jsPDF } from 'jspdf';
import Konva from 'konva';
import { Stroke } from '@/store/whiteboardStore';

interface PageData {
    id: string;
    title: string;
    order: number;
    content: {
        strokes: Stroke[];
        backgroundColor?: string;
    };
}

interface ExportOptions {
    boardId: string;
    onProgress?: (current: number, total: number) => void;
    pixelRatio?: number;
}

/**
 * Renders a single page's content to a Konva Stage and returns a data URL
 */
async function renderPageToDataURL(
    pageData: PageData,
    width: number,
    height: number,
    pixelRatio: number = 2
): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
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
            const background = new Konva.Rect({
                x: 0,
                y: 0,
                width: width,
                height: height,
                fill: backgroundColor,
            });
            layer.add(background);

            // Render all strokes
            const strokes = pageData.content.strokes || [];
            strokes.forEach((stroke) => {
                const element = renderStrokeToKonva(stroke);
                if (element) {
                    layer.add(element);
                }
            });

            layer.draw();

            // Convert to data URL
            const dataURL = stage.toDataURL({ pixelRatio });

            // Cleanup
            stage.destroy();
            document.body.removeChild(container);

            resolve(dataURL);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Converts a Stroke object to a Konva shape
 */
function renderStrokeToKonva(stroke: Stroke): Konva.Shape | Konva.Group | null {
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

        // Calculate dimensions to fit in PDF page with margins
        const margin = 10;
        const availableWidth = pageWidth - 2 * margin;
        const availableHeight = pageHeight - 2 * margin;

        // Maintain aspect ratio
        const scale = Math.min(
            availableWidth / (canvasWidth / 10), // Convert pixels to mm (rough conversion)
            availableHeight / (canvasHeight / 10)
        );

        const imgWidth = (canvasWidth / 10) * scale;
        const imgHeight = (canvasHeight / 10) * scale;

        // Center the image
        const xOffset = (pageWidth - imgWidth) / 2;
        const yOffset = (pageHeight - imgHeight) / 2;

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

            // Add image to PDF
            pdf.addImage(dataURL, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

            // Add page number at bottom
            pdf.setFontSize(10);
            pdf.setTextColor(128, 128, 128);
            pdf.text(
                `Page ${i + 1} of ${pages.length}`,
                pageWidth / 2,
                pageHeight - 5,
                { align: 'center' }
            );

            // Add page title at top (optional)
            if (page.title) {
                pdf.setFontSize(12);
                pdf.setTextColor(64, 64, 64);
                pdf.text(page.title, pageWidth / 2, 5, { align: 'center' });
            }
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
