import type { Stroke, Point } from '@/store/whiteboardStore';
import { getStrokeBounds } from './strokeBounds';

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 * @param point Point to check
 * @param polygon Array of points forming the polygon
 * @returns true if point is inside polygon
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        const intersect =
            yi > point.y !== yj > point.y &&
            point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Get corner points of a stroke's bounding box
 * @param stroke Stroke to get bounds for
 * @returns Array of 4 corner points
 */
export function getStrokeBoundsPoints(stroke: Stroke): Point[] {
    const bounds = getStrokeBounds(stroke);
    return [
        { x: bounds.x, y: bounds.y },
        { x: bounds.x + bounds.width, y: bounds.y },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        { x: bounds.x, y: bounds.y + bounds.height },
    ];
}

/**
 * Check if a stroke is inside or intersects with a lasso path
 * A stroke is considered selected if any of its points or bounds corners are inside the lasso
 * @param stroke Stroke to check
 * @param lassoPath Lasso polygon path
 * @returns true if stroke should be selected
 */
export function isStrokeInLasso(stroke: Stroke, lassoPath: Point[]): boolean {
    if (lassoPath.length < 3) return false;

    // For text and shapes, check if any corner of the bounding box is inside
    if (stroke.tool === 'text' || stroke.shapeType) {
        const corners = getStrokeBoundsPoints(stroke);
        return corners.some(corner => isPointInPolygon(corner, lassoPath));
    }

    // For freehand strokes (pen, highlighter, eraser), check if any point is inside
    // We check every 5th point for performance, plus first and last
    const checkPoints: Point[] = [];
    checkPoints.push(stroke.points[0]);

    for (let i = 5; i < stroke.points.length; i += 5) {
        checkPoints.push(stroke.points[i]);
    }

    if (stroke.points.length > 1) {
        checkPoints.push(stroke.points[stroke.points.length - 1]);
    }

    return checkPoints.some(point => isPointInPolygon(point, lassoPath));
}

/**
 * Get all strokes that are inside a lasso path
 * @param strokes Array of all strokes
 * @param lassoPath Lasso polygon path
 * @returns Array of stroke IDs that are inside the lasso
 */
export function getStrokesInLasso(strokes: Stroke[], lassoPath: Point[]): string[] {
    return strokes
        .filter(stroke => isStrokeInLasso(stroke, lassoPath))
        .map(stroke => stroke.id);
}
