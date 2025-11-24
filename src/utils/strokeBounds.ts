import type { Stroke } from '@/store/whiteboardStore';

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Calculate the bounding box for any stroke type
 */
export function getStrokeBounds(stroke: Stroke): Bounds {
    if (!stroke || !stroke.points || stroke.points.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    // For text strokes
    if (stroke.tool === 'text' && stroke.text) {
        const point = stroke.points[0];
        const fontSize = stroke.fontSize || 20;

        // More accurate width calculation for cursive fonts
        const avgCharWidth = stroke.fontFamily?.toLowerCase().includes('cursive') ? 0.5 : 0.55;
        const textWidth = stroke.text.length * fontSize * avgCharWidth;

        // Tighter height - just slightly more than fontSize
        const textHeight = fontSize * 1.1;

        return {
            x: point.x,
            y: point.y - fontSize * 0.85, // Better baseline adjustment
            width: textWidth,
            height: textHeight,
        };
    }

    // For shapes (rectangle, circle, line, arrow)
    if (stroke.shapeType) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];

        const minX = Math.min(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxX = Math.max(start.x, end.x);
        const maxY = Math.max(start.y, end.y);

        // Ensure minimum size for visibility
        const width = Math.max(maxX - minX, 10);
        const height = Math.max(maxY - minY, 10);

        return {
            x: minX,
            y: minY,
            width,
            height,
        };
    }

    // For pen/highlighter/eraser (freehand drawing)
    const xs = stroke.points.map(p => p.x);
    const ys = stroke.points.map(p => p.y);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}
