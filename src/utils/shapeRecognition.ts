/**
 * Shape Recognition Utilities for Magic Mode
 * Pure math-based shape detection - no AI/API needed
 */

import type { Point } from '@/store/whiteboardStore';

export interface RecognizedShape {
    type: 'circle' | 'ellipse' | 'rectangle' | 'triangle' | 'pentagon' | 'hexagon' | 'star' | 'line' | 'arrow' | 'none';
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

function isClosedShape(points: Point[], threshold = 40): boolean {
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
    if (points.length < 8) return { isCircle: false, confidence: 0, center: { x: 0, y: 0 }, radius: 0 };

    const centroid = getCentroid(points);
    const distances = points.map(p => distance(p, centroid));
    const avgRadius = mean(distances);
    const deviation = stdDev(distances);

    // Check for minimum size
    if (avgRadius < 15) return { isCircle: false, confidence: 0, center: centroid, radius: avgRadius };

    const variance = deviation / avgRadius;
    const bounds = getBoundingBox(points);
    const aspectRatio = Math.min(bounds.width, bounds.height) / Math.max(bounds.width, bounds.height);

    // Circle: low variance + nearly square bounding box + closed shape
    const isClosed = isClosedShape(points, avgRadius * 0.6);
    const isCircle = variance < 0.3 && aspectRatio > 0.75 && isClosed;
    const confidence = isCircle ? Math.max(0.6, 1 - variance * 1.5) * aspectRatio : 0;

    return { isCircle, confidence, center: centroid, radius: avgRadius };
}

function detectEllipse(points: Point[]): { isEllipse: boolean; confidence: number; center: Point; radiusX: number; radiusY: number } {
    if (points.length < 8) return { isEllipse: false, confidence: 0, center: { x: 0, y: 0 }, radiusX: 0, radiusY: 0 };

    const bounds = getBoundingBox(points);
    const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
    const radiusX = bounds.width / 2;
    const radiusY = bounds.height / 2;

    if (radiusX < 15 || radiusY < 15) return { isEllipse: false, confidence: 0, center, radiusX, radiusY };
    if (!isClosedShape(points, Math.max(radiusX, radiusY) * 0.6)) return { isEllipse: false, confidence: 0, center, radiusX, radiusY };

    // Check how well points fit an ellipse
    let totalError = 0;
    for (const p of points) {
        const normalizedX = (p.x - center.x) / radiusX;
        const normalizedY = (p.y - center.y) / radiusY;
        const ellipseValue = normalizedX ** 2 + normalizedY ** 2;
        totalError += Math.abs(ellipseValue - 1);
    }
    const avgError = totalError / points.length;
    const isEllipse = avgError < 0.4;
    const confidence = isEllipse ? Math.max(0.6, 1 - avgError) : 0;

    return { isEllipse, confidence, center, radiusX, radiusY };
}

function detectRectangle(points: Point[]): { isRectangle: boolean; confidence: number; bounds: ReturnType<typeof getBoundingBox> } {
    if (points.length < 10) return { isRectangle: false, confidence: 0, bounds: getBoundingBox(points) };

    const bounds = getBoundingBox(points);
    const { width, height, minX, minY, maxX, maxY } = bounds;

    if (width < 20 || height < 20) return { isRectangle: false, confidence: 0, bounds };
    if (!isClosedShape(points, Math.min(width, height) * 0.4)) return { isRectangle: false, confidence: 0, bounds };

    // Check how many points are near the edges
    const edgeThreshold = Math.min(width, height) * 0.2;
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
    const isRectangle = edgeRatio > 0.65;
    const confidence = isRectangle ? edgeRatio : 0;

    return { isRectangle, confidence, bounds };
}

function detectTriangle(points: Point[]): { isTriangle: boolean; confidence: number; vertices: Point[] } {
    if (points.length < 10) return { isTriangle: false, confidence: 0, vertices: [] };
    if (!isClosedShape(points, 50)) return { isTriangle: false, confidence: 0, vertices: [] };

    const corners = findCorners(points, 3);
    if (corners.length !== 3) return { isTriangle: false, confidence: 0, vertices: [] };

    const perimeter = distance(corners[0], corners[1]) + distance(corners[1], corners[2]) + distance(corners[2], corners[0]);
    const pathLength = getTotalLength(points);

    const lengthRatio = Math.min(perimeter / pathLength, pathLength / perimeter);
    const isTriangle = lengthRatio > 0.65;

    return { isTriangle, confidence: lengthRatio, vertices: corners };
}

function detectPolygon(points: Point[], sides: number): { isPolygon: boolean; confidence: number; vertices: Point[] } {
    if (points.length < 10) return { isPolygon: false, confidence: 0, vertices: [] };
    if (!isClosedShape(points, 50)) return { isPolygon: false, confidence: 0, vertices: [] };

    const corners = findCorners(points, sides);
    if (corners.length !== sides) return { isPolygon: false, confidence: 0, vertices: [] };

    // Calculate expected perimeter vs actual path length
    let perimeter = 0;
    for (let i = 0; i < corners.length; i++) {
        perimeter += distance(corners[i], corners[(i + 1) % corners.length]);
    }
    const pathLength = getTotalLength(points);
    const lengthRatio = Math.min(perimeter / pathLength, pathLength / perimeter);

    // Check if corners form a regular polygon (equal angles from center)
    const centroid = getCentroid(corners);
    const angles = corners.map(c => Math.atan2(c.y - centroid.y, c.x - centroid.x));
    angles.sort((a, b) => a - b);
    const angleDiffs: number[] = [];
    for (let i = 0; i < angles.length; i++) {
        let diff = angles[(i + 1) % angles.length] - angles[i];
        if (diff < 0) diff += 2 * Math.PI;
        angleDiffs.push(diff);
    }
    const expectedAngle = (2 * Math.PI) / sides;
    const angleVariance = stdDev(angleDiffs) / expectedAngle;

    const isPolygon = lengthRatio > 0.6 && angleVariance < 0.4;
    const confidence = isPolygon ? lengthRatio * (1 - angleVariance * 0.5) : 0;

    return { isPolygon, confidence, vertices: corners };
}

function detectStar(points: Point[]): { isStar: boolean; confidence: number; vertices: Point[] } {
    if (points.length < 15) return { isStar: false, confidence: 0, vertices: [] };
    if (!isClosedShape(points, 50)) return { isStar: false, confidence: 0, vertices: [] };

    // A star has 10 corners (5 outer + 5 inner for 5-pointed star)
    const corners = findCorners(points, 10);
    if (corners.length < 8) return { isStar: false, confidence: 0, vertices: [] };

    const centroid = getCentroid(points);
    const distances = corners.map(c => distance(c, centroid));

    // Stars have alternating near/far vertices
    distances.sort((a, b) => a - b);
    const innerRadius = mean(distances.slice(0, Math.floor(distances.length / 2)));
    const outerRadius = mean(distances.slice(Math.floor(distances.length / 2)));

    const radiusRatio = innerRadius / outerRadius;
    // Typical 5-pointed star has ratio around 0.38
    const isStar = radiusRatio > 0.25 && radiusRatio < 0.6;
    const confidence = isStar ? 0.7 + (1 - Math.abs(radiusRatio - 0.38)) * 0.3 : 0;

    return { isStar, confidence, vertices: [{ x: centroid.x, y: centroid.y - outerRadius }, { x: centroid.x + outerRadius, y: centroid.y + outerRadius * 0.7 }] };
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

function detectArrow(points: Point[]): { isArrow: boolean; confidence: number; start: Point; end: Point } {
    if (points.length < 5) return { isArrow: false, confidence: 0, start: points[0] || { x: 0, y: 0 }, end: points[points.length - 1] || { x: 0, y: 0 } };

    const start = points[0];
    const end = points[points.length - 1];
    const directDistance = distance(start, end);
    const pathLength = getTotalLength(points);

    if (directDistance < 30) return { isArrow: false, confidence: 0, start, end };

    // Arrow is like a line but with a hook at the end
    // Check the last portion of the stroke for direction changes
    const lastPortion = points.slice(-Math.floor(points.length * 0.3));
    if (lastPortion.length < 3) return { isArrow: false, confidence: 0, start, end };

    const mainLineEnd = points[Math.floor(points.length * 0.7)];
    const mainStraightness = distance(start, mainLineEnd) / getTotalLength(points.slice(0, Math.floor(points.length * 0.7) + 1));

    // Check if main part is straight and end has a direction change
    const isArrow = mainStraightness > 0.8 && pathLength > directDistance * 1.1;
    const confidence = isArrow ? mainStraightness * 0.9 : 0;

    return { isArrow, confidence, start, end };
}

function findCorners(points: Point[], targetCount: number): Point[] {
    if (points.length < 10) return [];

    const angles: { idx: number; angle: number }[] = [];
    const step = Math.max(1, Math.floor(points.length / 60));

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

    // Filter out corners that are too close together
    const minDistance = getTotalLength(points) / (targetCount * 3);
    const selectedCorners: Point[] = [];

    for (const a of angles) {
        if (selectedCorners.length >= targetCount) break;
        const point = points[a.idx];
        const tooClose = selectedCorners.some(c => distance(c, point) < minDistance);
        if (!tooClose) {
            selectedCorners.push(point);
        }
    }

    return selectedCorners;
}

// Generate polygon points for rendering
function generatePolygonPoints(center: Point, radius: number, sides: number): Point[] {
    const points: Point[] = [];
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
        points.push({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        });
    }
    return points;
}

function generateStarPoints(center: Point, outerRadius: number, innerRadius: number, points_count: number = 5): Point[] {
    const pts: Point[] = [];
    for (let i = 0; i < points_count * 2; i++) {
        const angle = (i * Math.PI / points_count) - Math.PI / 2;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        pts.push({
            x: center.x + r * Math.cos(angle),
            y: center.y + r * Math.sin(angle)
        });
    }
    return pts;
}

// ============ Main Recognition Function ============

export function recognizeShape(points: Point[]): RecognizedShape {
    if (points.length < 5) {
        return { type: 'none', confidence: 0, points };
    }

    // Try to detect each shape type
    const lineResult = detectLine(points);
    const arrowResult = detectArrow(points);
    const circleResult = detectCircle(points);
    const ellipseResult = detectEllipse(points);
    const rectResult = detectRectangle(points);
    const triangleResult = detectTriangle(points);
    const pentagonResult = detectPolygon(points, 5);
    const hexagonResult = detectPolygon(points, 6);
    const starResult = detectStar(points);

    const bounds = getBoundingBox(points);
    const centroid = getCentroid(points);
    const avgRadius = Math.max(bounds.width, bounds.height) / 2;

    // Find the best match
    const candidates: { type: RecognizedShape['type']; confidence: number; getPoints: () => Point[] }[] = [
        {
            type: 'line',
            confidence: lineResult.isLine ? lineResult.confidence : 0,
            getPoints: () => [lineResult.start, lineResult.end]
        },
        {
            type: 'arrow',
            confidence: arrowResult.isArrow ? arrowResult.confidence : 0,
            getPoints: () => [arrowResult.start, arrowResult.end]
        },
        {
            type: 'circle',
            confidence: circleResult.isCircle ? circleResult.confidence : 0,
            getPoints: () => {
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
            type: 'ellipse',
            confidence: ellipseResult.isEllipse ? ellipseResult.confidence : 0,
            getPoints: () => {
                const { center, radiusX, radiusY } = ellipseResult;
                return [
                    { x: center.x - radiusX, y: center.y - radiusY },
                    { x: center.x + radiusX, y: center.y + radiusY }
                ];
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
            getPoints: () => {
                // Return bounding box style points for triangle
                const b = getBoundingBox(triangleResult.vertices);
                return [{ x: b.minX, y: b.minY }, { x: b.maxX, y: b.maxY }];
            }
        },
        {
            type: 'pentagon',
            confidence: pentagonResult.isPolygon ? pentagonResult.confidence : 0,
            getPoints: () => {
                return [{ x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY }];
            }
        },
        {
            type: 'hexagon',
            confidence: hexagonResult.isPolygon ? hexagonResult.confidence : 0,
            getPoints: () => {
                return [{ x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY }];
            }
        },
        {
            type: 'star',
            confidence: starResult.isStar ? starResult.confidence : 0,
            getPoints: () => {
                return [{ x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY }];
            }
        }
    ];

    // Get best candidate with minimum confidence threshold
    const minConfidence = 0.55;
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
