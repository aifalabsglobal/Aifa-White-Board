'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Ellipse, Arrow, Text, Path, RegularPolygon, Star as KonvaStar } from 'react-konva';
import { getStroke } from 'perfect-freehand';
import { useWhiteboardStore, type Stroke, type Point } from '@/store/whiteboardStore';
import { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { SelectionBox, FloatingToolbar } from '@/components/SelectionBox';
import { getStrokeBounds } from '@/utils/strokeBounds';


type ExportFormat = 'png' | 'pdf' | 'svg';

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const SCALE_STEP = 1.05;
const GRID_SIZE = 40;

declare global {
    interface Window {
        exportCanvas?: (format: ExportFormat) => void;
    }
}

interface WhiteboardCanvasProps {
    boardId?: string;
}

function getSvgPathFromStroke(stroke: number[][]) {
    if (!stroke.length) return '';

    const d = stroke.reduce(
        (acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            return acc;
        },
        ['M', ...stroke[0], 'Q']
    );

    d.push('Z');
    return d.join(' ');
}

// Helper function to find a stroke at a given point
function findStrokeAtPoint(point: Point, strokes: Stroke[]): Stroke | null {
    // Check strokes in reverse order (top to bottom in z-order)
    for (let i = strokes.length - 1; i >= 0; i--) {
        const stroke = strokes[i];

        // Skip if stroke has no points
        if (!stroke.points || stroke.points.length === 0) continue;

        let minX: number, minY: number, maxX: number, maxY: number;

        // For text strokes, use proper text bounds calculation
        if (stroke.tool === 'text' && stroke.text) {
            const textPoint = stroke.points[0];
            const fontSize = stroke.fontSize || 20;

            // Match the getStrokeBounds calculation for text
            const avgCharWidth = 0.6; // Average for most fonts
            const textWidth = Math.max(stroke.text.length * fontSize * avgCharWidth, fontSize);
            const textHeight = fontSize * 1.2;

            minX = textPoint.x;
            minY = textPoint.y; // Konva renders text with y as TOP
            maxX = textPoint.x + textWidth;
            maxY = textPoint.y + textHeight;
        } else {
            // Get the bounding box for other strokes
            minX = Infinity;
            minY = Infinity;
            maxX = -Infinity;
            maxY = -Infinity;
            stroke.points.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
        }

        // Add some padding for easier selection (based on stroke width)
        const padding = Math.max(stroke.width * 2, 10);
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // Check if point is within bounding box
        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
            // For shapes and text, bounding box is enough
            if (['rectangle', 'circle', 'triangle', 'pentagon', 'hexagon', 'star', 'text'].includes(stroke.tool)) {
                return stroke;
            }

            // For freehand strokes, check if point is close to any segment
            for (let j = 0; j < stroke.points.length - 1; j++) {
                const p1 = stroke.points[j];
                const p2 = stroke.points[j + 1];
                const distance = distanceToLineSegment(point, p1, p2);
                if (distance <= padding) {
                    return stroke;
                }
            }

            // For lines and arrows with 2 points
            if (stroke.points.length === 2 && ['line', 'arrow'].includes(stroke.tool)) {
                const distance = distanceToLineSegment(point, stroke.points[0], stroke.points[1]);
                if (distance <= padding) {
                    return stroke;
                }
            }

            // For single point strokes (dots)
            if (stroke.points.length === 1) {
                const dx = point.x - stroke.points[0].x;
                const dy = point.y - stroke.points[0].y;
                if (Math.sqrt(dx * dx + dy * dy) <= padding) {
                    return stroke;
                }
            }
        }
    }
    return null;
}

// Helper function to calculate distance from a point to a line segment
function distanceToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx: number, yy: number;

    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

export default function WhiteboardCanvas({ boardId }: WhiteboardCanvasProps) {
    console.log('WhiteboardCanvas: Component rendering');
    const {
        strokes,
        activeStrokes,
        startStroke,
        addPointToStroke,
        endStroke,
        currentTool,
        currentFontFamily,
        currentFontSize,
        setStageRef,
        selectedStrokeIds,
        setSelectedStrokeIds,
        addToSelection,
        toggleSelection,
        deleteStroke,
        moveStroke,
        resizeStroke,
        replaceStrokes,
        backgroundColor,
        setBackgroundColor,
        isMagicMode,
        // Page state actions
        setPages,
        setCurrentPageId,
        currentPageId,
        addPage,
        pageStyle,
    } = useWhiteboardStore();

    const stageRef = useRef<KonvaStage | null>(null);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
    const lastSavedStrokes = useRef<string>('[]');

    // Pan/Zoom state
    const [stageTransform, setStageTransform] = useState({ scale: 1, x: 0, y: 0 });

    // Inline text input state for Magic Mode
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInputValue, setTextInputValue] = useState('');
    const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
    const [pendingStrokeId, setPendingStrokeId] = useState<string | null>(null);
    const textInputRef = useRef<HTMLInputElement>(null);

    // Text formatting state
    const [textBold, setTextBold] = useState(false);
    const [textItalic, setTextItalic] = useState(false);
    const [textUnderline, setTextUnderline] = useState(false);
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

    // Drag to move state
    const [isDraggingStroke, setIsDraggingStroke] = useState(false);
    const [dragStart, setDragStart] = useState<Point | null>(null);


    // Load board data
    useEffect(() => {
        if (!boardId) return;

        const loadBoard = async () => {
            try {
                const res = await fetch(`/api/boards/${boardId}`, { cache: 'no-store' });
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    console.error(`Fetch failed: ${res.status} ${res.statusText}`, errBody);
                    throw new Error(errBody.error || 'Failed to load board');
                }
                const data = await res.json();

                if (data.pages && data.pages.length > 0) {
                    // Board has pages, load them
                    setPages(data.pages);
                    const firstPage = data.pages[0];
                    setCurrentPageId(firstPage.id);

                    // Load content of first page
                    if (firstPage.content) {
                        if (typeof firstPage.content === 'object') {
                            replaceStrokes(firstPage.content.strokes || []);
                            if (firstPage.content.backgroundColor) {
                                setBackgroundColor(firstPage.content.backgroundColor);
                            }
                        } else if (Array.isArray(firstPage.content)) {
                            replaceStrokes(firstPage.content);
                        }
                        lastSavedStrokes.current = JSON.stringify(firstPage.content);
                    } else {
                        replaceStrokes([]);
                        lastSavedStrokes.current = JSON.stringify({ strokes: [], backgroundColor: '#3b82f6' });
                    }
                } else {
                    // No pages (legacy or new), create default page
                    console.log('No pages found, creating default page...');
                    const createRes = await fetch(`/api/boards/${boardId}/pages`, { method: 'POST' });
                    if (createRes.ok) {
                        const newPage = await createRes.json();
                        addPage(newPage);
                        setCurrentPageId(newPage.id);

                        // If legacy content exists, migrate it
                        if (data.content) {
                            console.log('Migrating legacy content...');
                            let legacyStrokes = [];
                            let legacyBg = '#3b82f6';

                            if (Array.isArray(data.content)) {
                                legacyStrokes = data.content;
                            } else if (typeof data.content === 'object') {
                                legacyStrokes = data.content.strokes || [];
                                legacyBg = data.content.backgroundColor || '#3b82f6';
                            }

                            replaceStrokes(legacyStrokes);
                            setBackgroundColor(legacyBg);

                            // Save immediately to the new page
                            await fetch(`/api/pages/${newPage.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    content: { strokes: legacyStrokes, backgroundColor: legacyBg },
                                    title: 'Page 1'
                                }),
                            });
                            lastSavedStrokes.current = JSON.stringify({ strokes: legacyStrokes, backgroundColor: legacyBg });
                        } else {
                            replaceStrokes([]);
                            lastSavedStrokes.current = JSON.stringify({ strokes: [], backgroundColor: '#3b82f6' });
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading board:', error);
            }
        };

        loadBoard();
    }, [boardId, replaceStrokes, setBackgroundColor, setPages, setCurrentPageId, addPage]);

    // Auto-save logic with thumbnail generation
    // Auto-save logic with thumbnail generation
    useEffect(() => {
        if (!boardId || !currentPageId) return;

        const contentToSave = { strokes, backgroundColor, pageStyle };
        const currentContentStr = JSON.stringify(contentToSave);

        // Sync to client-side cache immediately
        useWhiteboardStore.getState().updatePageContent(currentPageId, contentToSave);

        if (currentContentStr === lastSavedStrokes.current) return;

        setSaveStatus('saving');
        const timeoutId = setTimeout(async () => {
            try {
                // Generate thumbnail from canvas
                let thumbnail: string | undefined;
                if (stageRef.current) {
                    try {
                        thumbnail = stageRef.current.toDataURL({ pixelRatio: 0.25 }); // Low res for thumbnail
                    } catch (e) {
                        console.warn('Failed to generate thumbnail:', e);
                    }
                }

                // Save to the specific page endpoint with thumbnail
                const res = await fetch(`/api/pages/${currentPageId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: contentToSave, thumbnail }),
                });

                if (!res.ok) throw new Error('Failed to save');

                lastSavedStrokes.current = currentContentStr;
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus(null), 2000);
            } catch (error) {
                console.error('Error saving page:', error);
                setSaveStatus('error');
            }
        }, 2000); // Debounce save by 2 seconds

        return () => clearTimeout(timeoutId);
    }, [strokes, backgroundColor, pageStyle, boardId, currentPageId]);

    // Handle text input completion
    const handleTextInputComplete = useCallback(() => {
        if (!textInputValue.trim()) {
            setShowTextInput(false);
            return;
        }

        // Get the scene position where text was clicked
        const scenePos = (window as any).__textInputScenePos;
        if (scenePos) {
            const newStroke: Stroke = {
                id: crypto.randomUUID(),
                tool: 'text',
                points: [scenePos],
                color: useWhiteboardStore.getState().currentColor,
                width: currentFontSize, // Use font size as width for text tool
                opacity: 1,
                pageId: 'page1',
                createdAt: new Date().toISOString(),
                text: textInputValue,
                fontFamily: currentFontFamily,
                fontSize: currentFontSize,
                fontWeight: textBold ? 'bold' : 'normal',
                fontStyle: textItalic ? 'italic' : 'normal',
                textDecoration: textUnderline ? 'underline' : 'none',
                textAlign: textAlign
            };
            replaceStrokes([...strokes, newStroke]);
        }

        setShowTextInput(false);
        setTextInputValue('');
        setPendingStrokeId(null);
        delete (window as any).__textInputScenePos;
    }, [textInputValue, strokes, currentFontFamily, currentFontSize, textBold, textItalic, textUnderline, textAlign, replaceStrokes]);


    // Export canvas as PNG, PDF, or SVG
    const exportCanvas = useCallback((format: ExportFormat) => {
        if (!stageRef.current) return;
        if (format === 'png') {
            const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = 'whiteboard.png';
            link.href = dataURL;
            link.click();
        } else if (format === 'svg') {
            // SVG export not currently supported in this version of Konva
            // Fallback to PNG export
            const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = 'whiteboard.png';
            link.href = dataURL;
            link.click();
        } else if (format === 'pdf') {
            // Simple PDF export using jsPDF (add as dependency if not present)
            import('jspdf').then(({ jsPDF }) => {
                if (!stageRef.current) return;
                const imgData = stageRef.current.toDataURL({ pixelRatio: 2 });
                const pdf = new jsPDF({ orientation: 'landscape' });
                pdf.addImage(imgData, 'PNG', 10, 10, 280, 150);
                pdf.save('whiteboard.pdf');
            });
        }
    }, []);

    // expose export function globally for toolbar button
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.exportCanvas = exportCanvas;
        return () => {
            if (window.exportCanvas === exportCanvas) {
                delete window.exportCanvas;
            }
        };
    }, [exportCanvas]);

    // Set the stage reference in the store for external use (e.g., export)
    useEffect(() => {
        setStageRef(stageRef.current);
        return () => setStageRef(null);
    }, [setStageRef]);

    const isDrawing = useRef<Set<string>>(new Set());
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const panOrigin = useRef<{ x: number; y: number; stageX: number; stageY: number } | null>(null);
    const pinchState = useRef<{
        initialDistance: number;
        initialScale: number;
        centerScene: Point;
    } | null>(null);
    const isSelectionMode = currentTool === 'select';
    const zoomPercentage = Math.round(stageTransform.scale * 100);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setStageSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                event.preventDefault();
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                event.preventDefault();
                setIsSpacePressed(false);
                setIsPanning(false);
                panOrigin.current = null;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        const container = stageRef.current?.container();
        if (!container) return;
        if (isPanning) {
            container.style.cursor = 'grabbing';
        } else if (isSpacePressed) {
            container.style.cursor = 'grab';
        } else if (isSelectionMode) {
            container.style.cursor = 'default';
        } else {
            container.style.cursor = 'crosshair';
        }
    }, [isPanning, isSpacePressed, isSelectionMode]);

    // Delete selected strokes with keyboard
    useEffect(() => {
        const handleDeleteKey = (event: KeyboardEvent) => {
            // Don't delete if user is typing in text input
            if (showTextInput) return;

            if ((event.key === 'Delete' || event.key === 'Backspace') && selectedStrokeIds.length > 0) {
                event.preventDefault();
                // Delete all selected strokes
                selectedStrokeIds.forEach(id => deleteStroke(id));
            }
        };

        window.addEventListener('keydown', handleDeleteKey);
        return () => window.removeEventListener('keydown', handleDeleteKey);
    }, [selectedStrokeIds, showTextInput, deleteStroke]);

    useEffect(() => {
        if (!isSelectionMode) {
            pinchState.current = null;
        }
    }, [isSelectionMode]);

    const clientToScenePoint = useCallback(
        (clientX: number, clientY: number, transform = stageTransform): Point | null => {
            const stage = stageRef.current;
            if (!stage) return null;
            const box = stage.container().getBoundingClientRect();
            const pointer = {
                x: clientX - box.left,
                y: clientY - box.top,
            };
            return {
                x: (pointer.x - transform.x) / transform.scale,
                y: (pointer.y - transform.y) / transform.scale,
            };
        },
        [stageTransform]
    );

    const clampScale = useCallback((value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value)), []);

    const handleWheel = useCallback(
        (event: KonvaEventObject<WheelEvent>) => {
            event.evt.preventDefault();
            const stage = stageRef.current;
            if (!stage) return;
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const direction = event.evt.deltaY > 0 ? -1 : 1;

            setStageTransform((prev) => {
                const nextScale = clampScale(prev.scale * (direction > 0 ? SCALE_STEP : 1 / SCALE_STEP));
                const mousePoint = {
                    x: (pointer.x - prev.x) / prev.scale,
                    y: (pointer.y - prev.y) / prev.scale,
                };

                return {
                    scale: nextScale,
                    x: pointer.x - mousePoint.x * nextScale,
                    y: pointer.y - mousePoint.y * nextScale,
                };
            });
        },
        [clampScale]
    );

    const beginPan = useCallback(
        (clientX: number, clientY: number) => {
            setIsPanning(true);
            panOrigin.current = { x: clientX, y: clientY, stageX: stageTransform.x, stageY: stageTransform.y };
        },
        [stageTransform]
    );

    const zoomByStep = useCallback(
        (direction: 'in' | 'out') => {
            const pointer = {
                x: stageSize.width / 2,
                y: stageSize.height / 2,
            };

            setStageTransform((prev) => {
                const nextScale = clampScale(prev.scale * (direction === 'in' ? SCALE_STEP : 1 / SCALE_STEP));
                const scenePoint = {
                    x: (pointer.x - prev.x) / prev.scale,
                    y: (pointer.y - prev.y) / prev.scale,
                };

                return {
                    scale: nextScale,
                    x: pointer.x - scenePoint.x * nextScale,
                    y: pointer.y - scenePoint.y * nextScale,
                };
            });
        },
        [clampScale, stageSize.height, stageSize.width]
    );

    const resetView = useCallback(() => {
        setStageTransform({ scale: 1, x: 0, y: 0 });
    }, []);

    // Smart tool detection - click = text, drag = draw
    const [clickStartPos, setClickStartPos] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Mouse events (single point) - Smart detection
    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        // Don't trigger pan if we're in text mode (wait for text input instead)
        if (showTextInput || (isSpacePressed || e.evt.button === 1)) {
            if (!showTextInput) {
                beginPan(e.evt.clientX, e.evt.clientY);
            }
            return;
        }

        const pos = clientToScenePoint(e.evt.clientX, e.evt.clientY);
        if (!pos) return;

        if (isSelectionMode) {
            const clickedOnEmpty = e.target === e.target.getStage();
            if (clickedOnEmpty) {
                setSelectedStrokeIds([]);
                return;
            }

            // Find which stroke was clicked by checking if any stroke contains this point
            const clickedStroke = findStrokeAtPoint(pos, strokes);

            if (clickedStroke) {
                // Check if Shift key is held for multi-select
                if (e.evt.shiftKey) {
                    // Toggle this stroke in/out of selection
                    toggleSelection(clickedStroke.id);
                    return;
                }

                // If clicking on a stroke that's already selected, start dragging
                if (selectedStrokeIds.includes(clickedStroke.id)) {
                    setIsDraggingStroke(true);
                    setDragStart(pos);
                    return;
                }

                // Otherwise, select only this stroke (replace selection)
                setSelectedStrokeIds([clickedStroke.id]);
                return;
            } else {
                // Clicked on canvas but no stroke found - deselect
                setSelectedStrokeIds([]);
            }
            return;
        }

        // Store click position for smart detection
        setClickStartPos(pos);
        setIsDragging(false);
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        if (isPanning && panOrigin.current) {
            const origin = panOrigin.current;
            const dx = e.evt.clientX - origin.x;
            const dy = e.evt.clientY - origin.y;
            setStageTransform((prev) => ({
                ...prev,
                x: origin.stageX + dx,
                y: origin.stageY + dy,
            }));
            return;
        }

        // Handle dragging selected strokes
        if (isDraggingStroke && dragStart && selectedStrokeIds.length > 0) {
            const pos = clientToScenePoint(e.evt.clientX, e.evt.clientY);
            if (pos) {
                const deltaX = pos.x - dragStart.x;
                const deltaY = pos.y - dragStart.y;

                // Move all selected strokes
                selectedStrokeIds.forEach(id => moveStroke(id, deltaX, deltaY));

                // Update drag start for next movement
                setDragStart(pos);
            }
            return;
        }

        if (showTextInput) return;

        const pos = clientToScenePoint(e.evt.clientX, e.evt.clientY);
        if (!pos) return;

        // Check if user is dragging (moved more than 5 pixels)
        if (clickStartPos && !isDragging) {
            const distance = Math.sqrt(
                Math.pow(pos.x - clickStartPos.x, 2) + Math.pow(pos.y - clickStartPos.y, 2)
            );
            if (distance > 5) {
                // User is dragging - switch to draw mode automatically
                setIsDragging(true);

                // Only auto-switch to pen when we are in the default pointer tool
                // This preserves any tool the user explicitly selected (highlighter, eraser, etc.).
                if (currentTool === 'select') {
                    useWhiteboardStore.getState().setTool('pen');
                }

                isDrawing.current.add('mouse');
                startStroke(clickStartPos, 'mouse');
            }
        }

        if (isDrawing.current.has('mouse')) {
            addPointToStroke(pos, 'mouse');
        }
    };

    const handleMouseUp = (e: KonvaEventObject<MouseEvent>) => {
        if (isPanning) {
            setIsPanning(false);
            panOrigin.current = null;
            return;
        }

        // Stop dragging stroke
        if (isDraggingStroke) {
            setIsDraggingStroke(false);
            setDragStart(null);
            return;
        }

        if (isDrawing.current.has('mouse')) {
            isDrawing.current.delete('mouse');
            endStroke('mouse');
        } else if (clickStartPos && !isDragging && !showTextInput) {
            // User clicked without dragging - switch to text mode automatically
            const pos = clientToScenePoint(e.evt.clientX, e.evt.clientY);
            if (pos) {
                // Explicitly switch to text tool
                useWhiteboardStore.getState().setTool('text');

                const screenX = pos.x * stageTransform.scale + stageTransform.x;
                const screenY = pos.y * stageTransform.scale + stageTransform.y;

                setTextInputPosition({ x: screenX, y: screenY });
                setTextInputValue('');
                setShowTextInput(true);

                // Store the scene position for later use
                (window as any).__textInputScenePos = pos;

                setTimeout(() => textInputRef.current?.focus(), 50);
            }
        }

        setClickStartPos(null);
        setIsDragging(false);
    };

    // Touch events (multi-point)
    const handleTouchStart = (e: KonvaEventObject<TouchEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;

        const shouldUsePinch = isSelectionMode && e.evt.touches.length >= 2;
        if (shouldUsePinch) {
            const touch1 = e.evt.touches[0];
            const touch2 = e.evt.touches[1];
            const initialDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            const centerClientX = (touch1.clientX + touch2.clientX) / 2;
            const centerClientY = (touch1.clientY + touch2.clientY) / 2;
            const centerScene = clientToScenePoint(centerClientX, centerClientY);
            if (centerScene) {
                pinchState.current = {
                    initialDistance,
                    initialScale: stageTransform.scale,
                    centerScene,
                };
            }
            return;
        }

        if (isSelectionMode) {
            const tappedOnEmpty = e.target === stage;
            if (tappedOnEmpty) {
                setSelectedStrokeIds([]);
            }
            return;
        }

        const touches = e.evt.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const touchId = `touch-${touch.identifier}`;
            isDrawing.current.add(touchId);

            const point = clientToScenePoint(touch.clientX, touch.clientY);
            if (point) {
                startStroke(point, touchId);
            }
        }
    };

    const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;

        if (pinchState.current && isSelectionMode && e.evt.touches.length >= 2) {
            const touch1 = e.evt.touches[0];
            const touch2 = e.evt.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            const centerClientX = (touch1.clientX + touch2.clientX) / 2;
            const centerClientY = (touch1.clientY + touch2.clientY) / 2;

            const pinch = pinchState.current;
            if (!pinch || pinch.initialDistance === 0) {
                return;
            }

            const nextScale = clampScale(
                (distance / pinch.initialDistance) * pinch.initialScale
            );

            const stageNode = stageRef.current;
            if (!stageNode) return;
            const box = stageNode.container().getBoundingClientRect();
            const centerPointer = {
                x: centerClientX - box.left,
                y: centerClientY - box.top,
            };

            setStageTransform({
                scale: nextScale,
                x: centerPointer.x - pinch.centerScene.x * nextScale,
                y: centerPointer.y - pinch.centerScene.y * nextScale,
            });
            return;
        }

        if (isSelectionMode) {
            return;
        }

        const touches = e.evt.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const touchId = `touch-${touch.identifier}`;

            if (!isDrawing.current.has(touchId)) continue;

            const point = clientToScenePoint(touch.clientX, touch.clientY);
            if (point) {
                addPointToStroke(point, touchId);
            }
        }
    };

    const handleTouchEnd = (e: KonvaEventObject<TouchEvent>) => {
        e.evt.preventDefault();

        if (pinchState.current && e.evt.touches.length < 2) {
            pinchState.current = null;
        }

        if (isSelectionMode) {
            return;
        }

        const touches = e.evt.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const touchId = `touch-${touch.identifier}`;
            isDrawing.current.delete(touchId);
            endStroke(touchId);
        }
    };

    // Convert activeStrokes Map to array for rendering
    const activeStrokesArray = Array.from(activeStrokes.values());

    // Helper function to render a stroke (line or shape)
    const renderStroke = (stroke: Stroke) => {
        const isSelectedStroke = selectedStrokeIds.includes(stroke.id);
        const selectionStyles = isSelectedStroke
            ? {
                shadowColor: '#2563eb',
                shadowBlur: 12,
                shadowOpacity: 0.8,
            }
            : {};
        const selectionHandlers = {
            onMouseDown: (event: KonvaEventObject<MouseEvent>) => {
                if (!isSelectionMode) return;
                event.cancelBubble = true;
                if (event.evt.shiftKey) {
                    toggleSelection(stroke.id);
                } else {
                    setSelectedStrokeIds([stroke.id]);
                }
            },
            onTouchStart: (event: KonvaEventObject<TouchEvent>) => {
                if (!isSelectionMode) return;
                event.cancelBubble = true;
                setSelectedStrokeIds([stroke.id]);
            },
        };
        const compositeOp = (stroke.tool === 'eraser' ? 'destination-out' : 'source-over') as globalThis.GlobalCompositeOperation;

        const commonProps = {
            stroke: stroke.color,
            strokeWidth: stroke.width,
            opacity: stroke.opacity,
            globalCompositeOperation: compositeOp,
            ...selectionStyles,
        };

        if (stroke.tool === 'text' && stroke.text) {
            const { x, y } = stroke.points[0] ?? { x: 0, y: 0 };
            return (
                <Text
                    key={stroke.id}
                    text={stroke.text}
                    x={x}
                    y={y}
                    fontSize={stroke.fontSize || Math.max(stroke.width * 4, 12)}
                    fontFamily={stroke.fontFamily || 'Caveat'}
                    fontStyle={stroke.fontStyle || 'normal'}
                    fontVariant={stroke.fontWeight || 'normal'}
                    textDecoration={stroke.textDecoration || 'none'}
                    align={stroke.textAlign || 'left'}
                    fill={stroke.color}
                    opacity={stroke.opacity}
                    {...selectionStyles}
                    {...selectionHandlers}
                />
            );
        }

        // Live preview of text being typed (for inline editing)
        if (showTextInput && textInputValue && pendingStrokeId === stroke.id) {
            const { x, y } = stroke.points[0] ?? { x: 0, y: 0 };
            return (
                <Text
                    key={`${stroke.id}-preview`}
                    text={textInputValue + '|'} // Add cursor
                    x={x}
                    y={y}
                    fontSize={currentFontSize}
                    fontFamily={currentFontFamily}
                    fontStyle={textItalic ? 'italic' : 'normal'}
                    fontVariant={textBold ? 'bold' : 'normal'}
                    textDecoration={textUnderline ? 'underline' : 'none'}
                    align={textAlign}
                    fill={stroke.color || useWhiteboardStore.getState().currentColor}
                    opacity={0.8}
                />
            );
        }

        if (stroke.tool === 'calligraphy') {
            const points = stroke.points.map((p) => [p.x, p.y]);
            const outlinePoints = getStroke(points, {
                size: stroke.width * 1.5,
                thinning: 0.5,
                smoothing: 0.5,
                streamline: 0.5,
            });
            const pathData = getSvgPathFromStroke(outlinePoints);

            return (
                <Path
                    key={stroke.id}
                    {...commonProps}
                    {...selectionHandlers}
                    data={pathData}
                    fill={stroke.color}
                    stroke={undefined} // Path uses fill for the shape
                    strokeWidth={undefined}
                />
            );
        }

        if (!stroke.shapeType || stroke.points.length < 2) {
            // Regular line/pen stroke
            return (
                <Line
                    key={stroke.id}
                    {...commonProps}
                    {...selectionHandlers}
                    points={stroke.points.flatMap((p) => [p.x, p.y])}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                />
            );
        }

        // Shape rendering
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const width = end.x - start.x;
        const height = end.y - start.y;

        switch (stroke.shapeType) {
            case 'rectangle':
                return (
                    <Rect
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        x={Math.min(start.x, end.x)}
                        y={Math.min(start.y, end.y)}
                        width={Math.abs(width)}
                        height={Math.abs(height)}
                    />
                );
            case 'circle':
                return (
                    <Ellipse
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        x={start.x + width / 2}
                        y={start.y + height / 2}
                        radiusX={Math.abs(width) / 2}
                        radiusY={Math.abs(height) / 2}
                    />
                );
            case 'line':
                return (
                    <Line
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        points={[start.x, start.y, end.x, end.y]}
                        lineCap="round"
                    />
                );
            case 'arrow':
                return (
                    <Arrow
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        points={[start.x, start.y, end.x, end.y]}
                        pointerLength={15}
                        pointerWidth={15}
                        fill={stroke.color}
                    />
                );
            case 'triangle':
                // Calculate center point and radius
                const triCenterX = start.x + width / 2;
                const triCenterY = start.y + height / 2;
                const triRadius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                return (
                    <RegularPolygon
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        x={triCenterX}
                        y={triCenterY}
                        sides={3}
                        radius={triRadius}
                        fill={undefined}
                    />
                );
            case 'pentagon':
                const pentCenterX = start.x + width / 2;
                const pentCenterY = start.y + height / 2;
                const pentRadius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                return (
                    <RegularPolygon
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        x={pentCenterX}
                        y={pentCenterY}
                        sides={5}
                        radius={pentRadius}
                        fill={undefined}
                    />
                );
            case 'hexagon':
                const hexCenterX = start.x + width / 2;
                const hexCenterY = start.y + height / 2;
                const hexRadius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                return (
                    <RegularPolygon
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        x={hexCenterX}
                        y={hexCenterY}
                        sides={6}
                        radius={hexRadius}
                        fill={undefined}
                    />
                );
            case 'star':
                const starCenterX = start.x + width / 2;
                const starCenterY = start.y + height / 2;
                const starOuterRadius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                const starInnerRadius = starOuterRadius * 0.5;
                return (
                    <KonvaStar
                        key={stroke.id}
                        {...commonProps}
                        {...selectionHandlers}
                        x={starCenterX}
                        y={starCenterY}
                        numPoints={5}
                        innerRadius={starInnerRadius}
                        outerRadius={starOuterRadius}
                        fill={undefined}
                    />
                );
            default:
                return null;
        }
    };

    // Get page style background
    const getPageStyleBackground = () => {
        switch (pageStyle) {
            case 'ruled':
                return {
                    backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 31px,
                        rgba(255, 255, 255, 0.5) 31px,
                        rgba(255, 255, 255, 0.5) 32px
                    )`,
                    backgroundPosition: '0 0',
                };
            case 'wide-ruled':
                return {
                    backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 39px,
                        rgba(255, 255, 255, 0.5) 39px,
                        rgba(255, 255, 255, 0.5) 40px
                    )`,
                    backgroundPosition: '0 0',
                };
            case 'graph':
                return {
                    backgroundImage: `
                        linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '24px 24px',
                };
            case 'dotted':
                return {
                    backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.5) 1.5px, transparent 1.5px)`,
                    backgroundSize: '24px 24px',
                };
            case 'music':
                return {
                    backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 7px,
                        rgba(255, 255, 255, 0.4) 7px,
                        rgba(255, 255, 255, 0.4) 8px,
                        transparent 8px,
                        transparent 15px,
                        rgba(255, 255, 255, 0.4) 15px,
                        rgba(255, 255, 255, 0.4) 16px,
                        transparent 16px,
                        transparent 23px,
                        rgba(255, 255, 255, 0.4) 23px,
                        rgba(255, 255, 255, 0.4) 24px,
                        transparent 24px,
                        transparent 31px,
                        rgba(255, 255, 255, 0.4) 31px,
                        rgba(255, 255, 255, 0.4) 32px,
                        transparent 32px,
                        transparent 39px,
                        rgba(255, 255, 255, 0.4) 39px,
                        rgba(255, 255, 255, 0.4) 40px,
                        transparent 40px,
                        transparent 80px
                    )`,
                    backgroundPosition: '0 0',
                };
            case 'plain':
            default:
                return {
                    backgroundImage: `
                        linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 0),
                        linear-gradient(180deg, rgba(99,102,241,0.08) 1px, transparent 0)
                    `,
                    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                };
        }
    };

    const pageStyleBg = getPageStyleBackground();

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full touch-none"
            style={{
                backgroundColor: backgroundColor,
                ...pageStyleBg,
            }}
        >
            <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                scaleX={stageTransform.scale}
                scaleY={stageTransform.scale}
                x={stageTransform.x}
                y={stageTransform.y}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ backgroundColor: 'transparent' }}
            >
                <Layer>
                    {strokes.map(renderStroke)}
                    {activeStrokesArray.map(renderStroke)}

                    {/* Live preview of new text being typed */}
                    {showTextInput && textInputValue && (
                        <Text
                            text={textInputValue + '|'}
                            x={textInputPosition.x / stageTransform.scale - stageTransform.x / stageTransform.scale}
                            y={textInputPosition.y / stageTransform.scale - stageTransform.y / stageTransform.scale}
                            fontSize={currentFontSize}
                            fontFamily={currentFontFamily}
                            fontStyle={textItalic ? 'italic' : 'normal'}
                            fontVariant={textBold ? 'bold' : 'normal'}
                            textDecoration={textUnderline ? 'underline' : 'none'}
                            align={textAlign}
                            fill={useWhiteboardStore.getState().currentColor}
                            opacity={0.8}
                        />
                    )}

                    {/* Selection Box for each selected stroke */}
                    {selectedStrokeIds.map(strokeId => {
                        const selectedStroke = strokes.find(s => s.id === strokeId);
                        if (!selectedStroke) return null;

                        const handleResize = (handleIndex: number, newX: number, newY: number) => {
                            const currentBounds = getStrokeBounds(selectedStroke);
                            const padding = 10;
                            const x = currentBounds.x - padding;
                            const y = currentBounds.y - padding;
                            const width = currentBounds.width + padding * 2;
                            const height = currentBounds.height + padding * 2;

                            let newBounds = { x, y, width, height };

                            // Calculate new bounds based on which handle was dragged
                            switch (handleIndex) {
                                case 0: // Top-left
                                    newBounds = { x: newX, y: newY, width: x + width - newX, height: y + height - newY };
                                    break;
                                case 1: // Top-center
                                    newBounds = { x, y: newY, width, height: y + height - newY };
                                    break;
                                case 2: // Top-right
                                    newBounds = { x, y: newY, width: newX - x, height: y + height - newY };
                                    break;
                                case 3: // Right-center
                                    newBounds = { x, y, width: newX - x, height };
                                    break;
                                case 4: // Bottom-right
                                    newBounds = { x, y, width: newX - x, height: newY - y };
                                    break;
                                case 5: // Bottom-center
                                    newBounds = { x, y, width, height: newY - y };
                                    break;
                                case 6: // Bottom-left
                                    newBounds = { x: newX, y, width: x + width - newX, height: newY - y };
                                    break;
                                case 7: // Left-center
                                    newBounds = { x: newX, y, width: x + width - newX, height };
                                    break;
                            }

                            // Ensure minimum size
                            if (newBounds.width < 20) newBounds.width = 20;
                            if (newBounds.height < 20) newBounds.height = 20;

                            // Remove padding from bounds before resizing
                            const finalBounds = {
                                x: newBounds.x + padding,
                                y: newBounds.y + padding,
                                width: newBounds.width - padding * 2,
                                height: newBounds.height - padding * 2
                            };

                            resizeStroke(strokeId, finalBounds);
                        };

                        return (
                            <SelectionBox
                                key={strokeId}
                                selectedStroke={selectedStroke}
                                onDelete={() => deleteStroke(strokeId)}
                                onResize={handleResize}
                                onMove={(deltaX, deltaY) => moveStroke(strokeId, deltaX, deltaY)}
                                stageScale={stageTransform.scale}
                            />
                        );
                    })}
                </Layer>
            </Stage>

            {/* Save Status Indicator */}
            {saveStatus && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-full shadow-sm text-xs font-medium transition-all">
                    {saveStatus === 'saving' && (
                        <>
                            <Loader2 size={14} className="animate-spin text-blue-500" />
                            <span className="text-gray-600">Saving...</span>
                        </>
                    )}
                    {saveStatus === 'saved' && (
                        <>
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span className="text-gray-600">Saved</span>
                        </>
                    )}
                    {saveStatus === 'error' && (
                        <>
                            <AlertCircle size={14} className="text-red-500" />
                            <span className="text-red-600">Error</span>
                        </>
                    )}
                    {isMagicMode && (
                        <>
                            <Sparkles size={14} className="text-purple-500 animate-pulse" />
                            <span className="text-purple-600">Magic Mode</span>
                        </>
                    )}
                </div>
            )}

            {/* Zoom Controls UI... */}
            {!isSelectionMode && (
                <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-40">
                    <button
                        onClick={() => zoomByStep('in')}
                        className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                        title="Zoom In"
                    >
                        +
                    </button>
                    <button
                        onClick={resetView}
                        className="px-2 py-1 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors text-xs font-medium"
                        title="Reset Zoom"
                    >
                        {zoomPercentage}%
                    </button>
                    <button
                        onClick={() => zoomByStep('out')}
                        className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                        title="Zoom Out"
                    >
                        −
                    </button>
                </div>
            )}



            {/* Invisible textarea for capturing keyboard input */}
            {showTextInput && (
                <textarea
                    ref={textInputRef as any}
                    value={textInputValue}
                    onChange={(e) => setTextInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        // Prevent space bar from triggering pan mode
                        if (e.key === ' ') {
                            e.stopPropagation();
                        }

                        // Ctrl+Enter or ESC to finish - regular Enter creates new line
                        if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault();
                            handleTextInputComplete();
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setShowTextInput(false);
                            setTextInputValue('');
                        }
                        // Regular Enter creates new line (default behavior)
                    }}
                    onBlur={handleTextInputComplete}
                    className="absolute z-40"
                    style={{
                        left: `${textInputPosition.x}px`,
                        top: `${textInputPosition.y}px`,
                        width: '1px',
                        height: '1px',
                        opacity: 0,
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        overflow: 'hidden',
                        background: 'transparent',
                    }}
                    autoFocus
                />
            )}

            {/* Floating Toolbar - show for last selected stroke */}
            {selectedStrokeIds.length > 0 && strokes.find(s => s.id === selectedStrokeIds[selectedStrokeIds.length - 1]) && (
                <FloatingToolbar
                    bounds={getStrokeBounds(strokes.find(s => s.id === selectedStrokeIds[selectedStrokeIds.length - 1])!)}
                    onDelete={() => selectedStrokeIds.forEach(id => deleteStroke(id))}
                    stageTransform={stageTransform}
                />
            )}
        </div>
    );
}
