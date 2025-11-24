import { create } from 'zustand'
import { temporal } from 'zundo'
import type { Stage } from 'konva/lib/Stage'

export type ToolType = "select" | "lasso" | "pen" | "highlighter" | "eraser" | "rectangle" | "circle" | "line" | "arrow" | "triangle" | "pentagon" | "hexagon" | "star" | "text" | "calligraphy";
export type ShapeType = "rectangle" | "circle" | "line" | "arrow" | "triangle" | "pentagon" | "hexagon" | "star";

export interface Point {
    x: number;
    y: number;
}

export interface Stroke {
    id: string;
    tool: ToolType;
    points: Point[];
    color: string;
    width: number;
    opacity: number;
    pageId: string;
    createdAt: string;
    shapeType?: ShapeType; // For shape tools
    text?: string; // For text tool
    fontFamily?: string; // For text tool
    fontSize?: number; // Font size
    fontWeight?: 'normal' | 'bold'; // Bold
    fontStyle?: 'normal' | 'italic'; // Italic
    textDecoration?: 'none' | 'underline'; // Underline
    textAlign?: 'left' | 'center' | 'right'; // Alignment
}

export interface Page {
    id: string;
    title: string;
    order: number;
}

interface WhiteboardState {
    currentTool: ToolType;
    currentColor: string;
    currentWidth: number;
    currentOpacity: number;
    currentFontFamily: string;
    currentFontSize: number;
    backgroundColor: string;
    strokes: Stroke[];
    activeStrokes: Map<string, Stroke>; // Map of touchId -> active stroke
    stageRef: Stage | null; // Konva Stage reference for export
    selectedStrokeId: string | null;
    isMagicMode: boolean;

    // Page state
    pages: Page[];
    currentPageId: string | null;

    toggleMagicMode: () => void;
    setTool: (tool: ToolType) => void;
    setColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    setWidth: (width: number) => void;
    setOpacity: (opacity: number) => void;
    setFontFamily: (fontFamily: string) => void;
    setFontSize: (fontSize: number) => void;

    setStrokes: (strokes: Stroke[]) => void;
    addStroke: (stroke: Stroke) => void;
    updateStroke: (id: string, updates: Partial<Stroke>) => void;
    deleteStroke: (id: string) => void;
    moveStroke: (id: string, deltaX: number, deltaY: number) => void;
    resizeStroke: (id: string, newBounds: { x: number; y: number; width: number; height: number }) => void;
    replaceStrokes: (strokes: Stroke[]) => void;
    clearPage: () => void;
    setStageRef: (stage: Stage | null) => void;
    setSelectedStrokeId: (id: string | null) => void;
    startStroke: (point: Point, touchId?: string, pressure?: number) => void;
    addPointToStroke: (point: Point, touchId?: string, pressure?: number) => void;
    endStroke: (touchId?: string) => void;

    // Page actions
    setPages: (pages: Page[]) => void;
    setCurrentPageId: (pageId: string | null) => void;
    addPage: (page: Page) => void;
    removePage: (pageId: string) => void;
}

export const useWhiteboardStore = create<WhiteboardState>()(
    temporal((set, get) => ({
        currentTool: 'pen',
        currentColor: '#ffffff',
        currentWidth: 5,
        currentOpacity: 1,
        currentFontFamily: 'cursive',
        currentFontSize: 50,
        backgroundColor: '#3b82f6',
        strokes: [],
        activeStrokes: new Map(),
        stageRef: null,
        selectedStrokeId: null,
        isMagicMode: false,
        pages: [],
        currentPageId: null,

        toggleMagicMode: () => set((state) => ({ isMagicMode: !state.isMagicMode })),

        setTool: (tool) => {
            set({
                currentTool: tool,
                currentOpacity: tool === 'highlighter' ? 0.5 : 1
            })
        },
        setColor: (color) => set({ currentColor: color }),
        setBackgroundColor: (color) => set({ backgroundColor: color }),
        setWidth: (width) => set({ currentWidth: width }),
        setFontFamily: (fontFamily) => set({ currentFontFamily: fontFamily }),
        setFontSize: (fontSize) => set({ currentFontSize: fontSize }), // Added
        setOpacity: (opacity) => set({ currentOpacity: opacity }),
        setStageRef: (ref) => set({ stageRef: ref }),

        setStrokes: (strokes) => set({ strokes }),

        addStroke: (stroke) => set((state) => ({
            strokes: [...state.strokes, stroke]
        })),

        updateStroke: (id, updates) => set((state) => ({
            strokes: state.strokes.map((s) =>
                s.id === id ? { ...s, ...updates } : s
            )
        })),

        deleteStroke: (id) => set((state) => ({
            strokes: state.strokes.filter((s) => s.id !== id),
            selectedStrokeId: state.selectedStrokeId === id ? null : state.selectedStrokeId,
        })),

        moveStroke: (id, deltaX, deltaY) => set((state) => ({
            strokes: state.strokes.map((s) =>
                s.id === id
                    ? {
                        ...s,
                        points: s.points.map(p => ({ x: p.x + deltaX, y: p.y + deltaY }))
                    }
                    : s
            )
        })),

        resizeStroke: (id, newBounds) => set((state) => ({
            strokes: state.strokes.map((s) => {
                if (s.id !== id) return s;

                // For shapes (rectangle, circle, line, arrow)
                if (s.shapeType && s.points.length >= 2) {
                    return {
                        ...s,
                        points: [
                            { x: newBounds.x, y: newBounds.y },
                            { x: newBounds.x + newBounds.width, y: newBounds.y + newBounds.height }
                        ]
                    };
                }

                // For text - adjust font size proportionally
                if (s.tool === 'text' && s.text) {
                    const oldBounds = (() => {
                        const point = s.points[0];
                        const fontSize = s.fontSize || 20;
                        const textWidth = s.text.length * fontSize * 0.6;
                        const textHeight = fontSize * 1.2;
                        return { x: point.x, y: point.y - fontSize, width: textWidth, height: textHeight };
                    })();

                    const scaleX = newBounds.width / oldBounds.width;
                    const scaleY = newBounds.height / oldBounds.height;
                    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

                    return {
                        ...s,
                        points: [{ x: newBounds.x, y: newBounds.y + (s.fontSize || 20) * scale }],
                        fontSize: Math.max(8, Math.round((s.fontSize || 20) * scale))
                    };
                }

                // For freehand drawings - scale all points
                if (s.points.length > 0) {
                    const oldBounds = (() => {
                        const xs = s.points.map(p => p.x);
                        const ys = s.points.map(p => p.y);
                        const minX = Math.min(...xs);
                        const minY = Math.min(...ys);
                        const maxX = Math.max(...xs);
                        const maxY = Math.max(...ys);
                        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                    })();

                    if (oldBounds.width === 0 || oldBounds.height === 0) return s;

                    const scaleX = newBounds.width / oldBounds.width;
                    const scaleY = newBounds.height / oldBounds.height;

                    return {
                        ...s,
                        points: s.points.map(p => ({
                            x: newBounds.x + (p.x - oldBounds.x) * scaleX,
                            y: newBounds.y + (p.y - oldBounds.y) * scaleY
                        }))
                    };
                }

                return s;
            })
        })),

        replaceStrokes: (strokes) => set({
            strokes,
            activeStrokes: new Map(),
            selectedStrokeId: null,
        }),
        setSelectedStrokeId: (strokeId) => set({ selectedStrokeId: strokeId }),

        startStroke: (point: Point, touchId: string = 'mouse') => {
            const { currentTool, currentColor, currentWidth, currentOpacity, activeStrokes, currentPageId } = get();
            const id = crypto.randomUUID();

            const isShapeTool = ['rectangle', 'circle', 'line', 'arrow', 'triangle', 'pentagon', 'hexagon', 'star'].includes(currentTool);

            const newStroke: Stroke = {
                id,
                tool: currentTool,
                points: [point],
                color: currentColor,
                width: currentWidth,
                opacity: currentOpacity,
                pageId: currentPageId || 'default',
                createdAt: new Date().toISOString(),
                ...(isShapeTool && { shapeType: currentTool as ShapeType }),
            };

            const newActiveStrokes = new Map(activeStrokes);
            newActiveStrokes.set(touchId, newStroke);

            set({
                activeStrokes: newActiveStrokes,
                selectedStrokeId: null,
            });
        },

        addPointToStroke: (point: Point, touchId: string = 'mouse') => {
            const { activeStrokes } = get();
            const activeStroke = activeStrokes.get(touchId);
            if (!activeStroke) return;

            const newActiveStrokes = new Map(activeStrokes);

            // For shape tools, only keep start and end points
            if (activeStroke.shapeType) {
                newActiveStrokes.set(touchId, {
                    ...activeStroke,
                    points: [activeStroke.points[0], point], // Keep start, update end
                });
            } else {
                // For pen/highlighter/eraser, add all points
                newActiveStrokes.set(touchId, {
                    ...activeStroke,
                    points: [...activeStroke.points, point],
                });
            }

            set({
                activeStrokes: newActiveStrokes,
            });
        },

        endStroke: (touchId = 'mouse') => {
            const { activeStrokes } = get();
            const activeStroke = activeStrokes.get(touchId);

            if (activeStroke) {
                const newActiveStrokes = new Map(activeStrokes);
                newActiveStrokes.delete(touchId);

                set((state) => ({
                    strokes: [...state.strokes, activeStroke],
                    activeStrokes: newActiveStrokes,
                }));
            }
        },

        clearPage: () => {
            set({ strokes: [], activeStrokes: new Map(), selectedStrokeId: null });
        },

        // Page actions
        setPages: (pages) => set({ pages }),
        setCurrentPageId: (pageId) => set({ currentPageId: pageId }),
        addPage: (page) => set((state) => ({ pages: [...state.pages, page] })),
        removePage: (pageId) => set((state) => ({ pages: state.pages.filter(p => p.id !== pageId) })),

    }), {
        partialize: (state) => ({
            strokes: state.strokes,
            backgroundColor: state.backgroundColor
        }),
        equality: (pastState, currentState) => {
            // Only create a new history entry if the strokes array length changed OR background color changed
            // This prevents intermediate drawing updates (addPointToStroke) from being tracked
            return pastState.strokes.length === currentState.strokes.length && pastState.backgroundColor === currentState.backgroundColor;
        }
    })
);
