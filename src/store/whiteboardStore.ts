import { create } from 'zustand'
import { temporal } from 'zundo'
import type { Stage } from 'konva/lib/Stage'

export type ToolType = "select" | "lasso" | "pen" | "highlighter" | "eraser" | "rectangle" | "circle" | "line" | "arrow" | "triangle" | "pentagon" | "hexagon" | "star" | "text" | "calligraphy";
export type ShapeType = "rectangle" | "circle" | "line" | "arrow" | "triangle" | "pentagon" | "hexagon" | "star";
export type PageStyleType = "ruled" | "wide-ruled" | "graph" | "dotted" | "music" | "plain";

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
    selectedStrokeIds: string[]; // Array for multi-select support
    isMagicMode: boolean;

    // Page state
    pages: Page[];
    currentPageId: string | null;
    pageStyle: PageStyleType;

    toggleMagicMode: () => void;
    setTool: (tool: ToolType) => void;
    setColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    setWidth: (width: number) => void;
    setOpacity: (opacity: number) => void;
    setFontFamily: (fontFamily: string) => void;
    setFontSize: (fontSize: number) => void;
    setPageStyle: (style: PageStyleType) => void;

    // Page content cache
    pageContents: Record<string, { strokes: Stroke[], backgroundColor: string, pageStyle: PageStyleType }>;
    updatePageContent: (pageId: string, content: { strokes: Stroke[], backgroundColor: string, pageStyle: PageStyleType }) => void;

    setStrokes: (strokes: Stroke[]) => void;
    addStroke: (stroke: Stroke) => void;
    updateStroke: (id: string, updates: Partial<Stroke>) => void;
    deleteStroke: (id: string) => void;
    moveStroke: (id: string, deltaX: number, deltaY: number) => void;
    resizeStroke: (id: string, newBounds: { x: number; y: number; width: number; height: number }) => void;
    replaceStrokes: (strokes: Stroke[]) => void;
    clearPage: () => void;
    setStageRef: (stage: Stage | null) => void;
    setSelectedStrokeIds: (ids: string[]) => void;
    addToSelection: (id: string) => void;
    removeFromSelection: (id: string) => void;
    toggleSelection: (id: string) => void;
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
        selectedStrokeIds: [],
        isMagicMode: false,
        pages: [],
        currentPageId: null,
        pageStyle: 'plain',
        pageContents: {}, // Cache for page contents

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
        setFontSize: (fontSize) => set({ currentFontSize: fontSize }),
        setPageStyle: (style) => set({ pageStyle: style }),
        setOpacity: (opacity) => set({ currentOpacity: opacity }),
        setStageRef: (ref) => set({ stageRef: ref }),

        updatePageContent: (pageId, content) => set((state) => ({
            pageContents: {
                ...state.pageContents,
                [pageId]: content
            }
        })),

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
            selectedStrokeIds: state.selectedStrokeIds.filter(sid => sid !== id),
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

        replaceStrokes: (strokes) => set({
            strokes,
            activeStrokes: new Map(),
            selectedStrokeIds: [],
        }),
        setSelectedStrokeIds: (ids) => set({ selectedStrokeIds: ids }),
        addToSelection: (id) => set((state) => ({
            selectedStrokeIds: state.selectedStrokeIds.includes(id)
                ? state.selectedStrokeIds
                : [...state.selectedStrokeIds, id]
        })),
        removeFromSelection: (id) => set((state) => ({
            selectedStrokeIds: state.selectedStrokeIds.filter(sid => sid !== id)
        })),
        toggleSelection: (id) => set((state) => ({
            selectedStrokeIds: state.selectedStrokeIds.includes(id)
                ? state.selectedStrokeIds.filter(sid => sid !== id)
                : [...state.selectedStrokeIds, id]
        })),

        resizeStroke: (id, newBounds) => set((state) => ({
            strokes: state.strokes.map((s) => {
                if (s.id !== id) return s;

                const MIN_SIZE = 10;
                const safeWidth = Math.max(newBounds.width, MIN_SIZE);
                const safeHeight = Math.max(newBounds.height, MIN_SIZE);

                // Handle shapes (rectangle, circle, line, arrow, etc.)
                if (s.shapeType && s.points.length >= 2) {
                    const start = s.points[0];
                    const end = s.points[s.points.length - 1];

                    // Calculate old bounding box
                    const oldMinX = Math.min(start.x, end.x);
                    const oldMinY = Math.min(start.y, end.y);
                    const oldMaxX = Math.max(start.x, end.x);
                    const oldMaxY = Math.max(start.y, end.y);
                    const oldWidth = oldMaxX - oldMinX || 1;
                    const oldHeight = oldMaxY - oldMinY || 1;

                    // Calculate scale factors
                    const scaleX = safeWidth / oldWidth;
                    const scaleY = safeHeight / oldHeight;

                    // Scale both points relative to the old bounding box origin
                    const newPoints = [
                        {
                            x: newBounds.x + (start.x - oldMinX) * scaleX,
                            y: newBounds.y + (start.y - oldMinY) * scaleY
                        },
                        {
                            x: newBounds.x + (end.x - oldMinX) * scaleX,
                            y: newBounds.y + (end.y - oldMinY) * scaleY
                        }
                    ];
                    return { ...s, points: newPoints };
                }

                // Handle text
                if (s.tool === 'text' && s.points.length > 0) {
                    const fontSize = s.fontSize || 20;
                    const text = s.text || '';
                    const avgCharWidth = fontSize * 0.6;
                    const oldWidth = Math.max(text.length * avgCharWidth, fontSize);
                    const oldHeight = fontSize * 1.2;

                    // Scale font size proportionally based on height change
                    const scale = safeHeight / oldHeight;
                    const newFontSize = Math.max(8, Math.round(fontSize * scale));

                    // Position text at new bounds origin (y is top of text in Konva)
                    const newPoints = [{ x: newBounds.x, y: newBounds.y }];
                    return { ...s, points: newPoints, fontSize: newFontSize };
                }

                // Handle freehand drawings (pen, highlighter, calligraphy)
                if (s.points.length > 0) {
                    // Calculate old bounds from points
                    const xs = s.points.map(p => p.x);
                    const ys = s.points.map(p => p.y);
                    const oldMinX = Math.min(...xs);
                    const oldMinY = Math.min(...ys);
                    const oldMaxX = Math.max(...xs);
                    const oldMaxY = Math.max(...ys);
                    const oldWidth = oldMaxX - oldMinX || 1;
                    const oldHeight = oldMaxY - oldMinY || 1;

                    // Scale all points to fit within new bounds
                    const scaleX = safeWidth / oldWidth;
                    const scaleY = safeHeight / oldHeight;
                    const newPoints = s.points.map(p => ({
                        x: newBounds.x + (p.x - oldMinX) * scaleX,
                        y: newBounds.y + (p.y - oldMinY) * scaleY
                    }));
                    return { ...s, points: newPoints };
                }

                return s;
            })
        })),

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
                selectedStrokeIds: [],
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
            set({ strokes: [], activeStrokes: new Map(), selectedStrokeIds: [] });
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
