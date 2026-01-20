/**
 * Shape Recognition Utilities for Magic Mode
 * Pure math-based shape detection - no AI/API needed
 */

import type { Point } from '@/store/whiteboardStore';

export interface RecognizedShape {
    type: 'circle' | 'rectangle' | 'triangle' | 'line' | 'arrow' | 'none';
    confidence: number;
    points: Point[]; // Transformed points for the perfect shape
}

// ============ Helper Functions ============

function distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function getCentroid(points: Point[]): Point {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
}

function getBoundingBox(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

function mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
    const avg = mean(values);
    const squareDiffs = values.map(v => (v - avg) ** 2);
    return Math.sqrt(mean(squareDiffs));
}

function isClosedShape(points: Point[], threshold = 30): boolean {
    if (points.length < 3) return false;
    const first = points[0];
    const last = points[points.length - 1];
    return distance(first, last) < threshold;
}

function getTotalLength(points: Point[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
        length += distance(points[i - 1], points[i]);
    }
    return length;
}

// ============ Shape Detection Functions ============

function detectCircle(points: Point[]): { isCircle: boolean; confidence: number; center: Point; radius: number } {
    if (points.length < 10) return { isCircle: false, confidence: 0, center: { x: 0, y: 0 }, radius: 0 };

    const centroid = getCentroid(points);
    const distances = points.map(p => distance(p, centroid));
    const avgRadius = mean(distances);
    const deviation = stdDev(distances);
    const variance = deviation / avgRadius;

    // Low variance means points are equidistant from center = circle
    const isCircle = variance < 0.25 && isClosedShape(points, avgRadius * 0.5);
    const confidence = isCircle ? Math.max(0, 1 - variance * 2) : 0;

    return { isCircle, confidence, center: centroid, radius: avgRadius };
}

function detectRectangle(points: Point[]): { isRectangle: boolean; confidence: number; bounds: ReturnType<typeof getBoundingBox> } {
    if (points.length < 10) return { isRectangle: false, confidence: 0, bounds: getBoundingBox(points) };

    const bounds = getBoundingBox(points);
    const { width, height, minX, minY, maxX, maxY } = bounds;

    if (width < 20 || height < 20) return { isRectangle: false, confidence: 0, bounds };
    if (!isClosedShape(points, Math.min(width, height) * 0.3)) return { isRectangle: false, confidence: 0, bounds };

    // Check how many points are near the edges
    const edgeThreshold = Math.min(width, height) * 0.15;
    let nearEdge = 0;

    for (const p of points) {
        const nearLeft = Math.abs(p.x - minX) < edgeThreshold;
        const nearRight = Math.abs(p.x - maxX) < edgeThreshold;
        const nearTop = Math.abs(p.y - minY) < edgeThreshold;
        const nearBottom = Math.abs(p.y - maxY) < edgeThreshold;

        if (nearLeft || nearRight || nearTop || nearBottom) {
            nearEdge++;
        }
    }

    const edgeRatio = nearEdge / points.length;
    const isRectangle = edgeRatio > 0.7;
    const confidence = isRectangle ? edgeRatio : 0;

    return { isRectangle, confidence, bounds };
}

function detectTriangle(points: Point[]): { isTriangle: boolean; confidence: number; vertices: Point[] } {
    if (points.length < 10) return { isTriangle: false, confidence: 0, vertices: [] };
    if (!isClosedShape(points)) return { isTriangle: false, confidence: 0, vertices: [] };

    // Find corners using angle changes
    const corners = findCorners(points, 3);
    if (corners.length !== 3) return { isTriangle: false, confidence: 0, vertices: [] };

    // Verify it's triangular by checking the stroke follows the edges
    const bounds = getBoundingBox(points);
    const perimeter = distance(corners[0], corners[1]) + distance(corners[1], corners[2]) + distance(corners[2], corners[0]);
    const pathLength = getTotalLength(points);

    const lengthRatio = Math.min(perimeter / pathLength, pathLength / perimeter);
    const isTriangle = lengthRatio > 0.7;

    return { isTriangle, confidence: lengthRatio, vertices: corners };
}

function detectLine(points: Point[]): { isLine: boolean; confidence: number; start: Point; end: Point } {
    if (points.length < 3) return { isLine: false, confidence: 0, start: points[0] || { x: 0, y: 0 }, end: points[points.length - 1] || { x: 0, y: 0 } };

    const start = points[0];
    const end = points[points.length - 1];
    const directDistance = distance(start, end);
    const pathLength = getTotalLength(points);

    if (directDistance < 20) return { isLine: false, confidence: 0, start, end };

    const straightness = directDistance / pathLength;
    const isLine = straightness > 0.85;

    return { isLine, confidence: straightness, start, end };
}

function findCorners(points: Point[], targetCount: number): Point[] {
    if (points.length < 10) return [];

    const angles: { idx: number; angle: number }[] = [];
    const step = Math.max(1, Math.floor(points.length / 50)); // Sample points

    for (let i = step; i < points.length - step; i += step) {
        const prev = points[i - step];
        const curr = points[i];
        const next = points[i + step];

        const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
        let angleDiff = Math.abs(angle2 - angle1);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        angles.push({ idx: i, angle: angleDiff });
    }

    // Sort by sharpest angle and pick top N
    angles.sort((a, b) => b.angle - a.angle);
    const corners = angles.slice(0, targetCount).map(a => points[a.idx]);

    return corners;
}

// ============ Main Recognition Function ============

export function recognizeShape(points: Point[]): RecognizedShape {
    if (points.length < 5) {
        return { type: 'none', confidence: 0, points };
    }

    // Try to detect each shape type
    const lineResult = detectLine(points);
    const circleResult = detectCircle(points);
    const rectResult = detectRectangle(points);
    const triangleResult = detectTriangle(points);

    // Find the best match
    const candidates: { type: RecognizedShape['type']; confidence: number; getPoints: () => Point[] }[] = [
        {
            type: 'line',
            confidence: lineResult.isLine ? lineResult.confidence : 0,
            getPoints: () => [lineResult.start, lineResult.end]
        },
        {
            type: 'circle',
            confidence: circleResult.isCircle ? circleResult.confidence : 0,
            getPoints: () => {
                // Generate circle points
                const { center, radius } = circleResult;
                const pts: Point[] = [];
                for (let i = 0; i <= 360; i += 10) {
                    const rad = (i * Math.PI) / 180;
                    pts.push({
                        x: center.x + radius * Math.cos(rad),
                        y: center.y + radius * Math.sin(rad)
                    });
                }
                return pts;
            }
        },
        {
            type: 'rectangle',
            confidence: rectResult.isRectangle ? rectResult.confidence : 0,
            getPoints: () => {
                const { minX, minY, maxX, maxY } = rectResult.bounds;
                return [
                    { x: minX, y: minY },
                    { x: maxX, y: maxY }
                ];
            }
        },
        {
            type: 'triangle',
            confidence: triangleResult.isTriangle ? triangleResult.confidence : 0,
            getPoints: () => triangleResult.vertices
        }
    ];

    // Get best candidate with minimum confidence threshold
    const minConfidence = 0.6;
    const best = candidates
        .filter(c => c.confidence >= minConfidence)
        .sort((a, b) => b.confidence - a.confidence)[0];

    if (best) {
        return {
            type: best.type,
            confidence: best.confidence,
            points: best.getPoints()
        };
    }

    return { type: 'none', confidence: 0, points };
}

/**
 * Smooth a freehand stroke using Ramer-Douglas-Peucker algorithm
 */
export function smoothStroke(points: Point[], epsilon = 2): Point[] {
    if (points.length < 3) return points;

    function rdp(pts: Point[], eps: number): Point[] {
        if (pts.length < 3) return pts;

        const first = pts[0];
        const last = pts[pts.length - 1];

        let maxDist = 0;
        let maxIdx = 0;

        for (let i = 1; i < pts.length - 1; i++) {
            const dist = perpendicularDistance(pts[i], first, last);
            if (dist > maxDist) {
                maxDist = dist;
                maxIdx = i;
            }
        }

        if (maxDist > eps) {
            const left = rdp(pts.slice(0, maxIdx + 1), eps);
            const right = rdp(pts.slice(maxIdx), eps);
            return [...left.slice(0, -1), ...right];
        }

        return [first, last];
    }

    function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d === 0) return distance(point, lineStart);

        return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / d;
    }

    return rdp(points, epsilon);
}
