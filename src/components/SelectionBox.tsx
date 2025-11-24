'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Rect, Group, Circle as KonvaCircle } from 'react-konva';
import type { Stroke } from '@/store/whiteboardStore';
import { getStrokeBounds } from '@/utils/strokeBounds';

interface SelectionBoxProps {
    selectedStroke: Stroke | null;
    onDelete: () => void;
    onResize: (handleIndex: number, newX: number, newY: number) => void;
    onMove: (deltaX: number, deltaY: number) => void;
    stageScale: number;
}

const HANDLE_SIZE = 8;
const BORDER_COLOR = '#2563eb'; // Blue-600
const HANDLE_FILL = '#ffffff';
const PADDING = 10; // Padding around the selection

// Handle names and cursor styles
const HANDLE_CURSORS = [
    'nw-resize', // Top-left
    'n-resize',  // Top-center
    'ne-resize', // Top-right
    'e-resize',  // Right-center
    'se-resize', // Bottom-right
    's-resize',  // Bottom-center
    'sw-resize', // Bottom-left
    'w-resize',  // Left-center
];

export function SelectionBox({ selectedStroke, onDelete, onResize, onMove, stageScale }: SelectionBoxProps) {
    if (!selectedStroke) return null;

    const bounds = getStrokeBounds(selectedStroke);

    // Add padding
    const x = bounds.x - PADDING;
    const y = bounds.y - PADDING;
    const width = bounds.width + PADDING * 2;
    const height = bounds.height + PADDING * 2;

    // Handle positions (8 handles: 4 corners + 4 edges)
    const handles = [
        { x: x, y: y, index: 0 }, // Top-left
        { x: x + width / 2, y: y, index: 1 }, // Top-center
        { x: x + width, y: y, index: 2 }, // Top-right
        { x: x + width, y: y + height / 2, index: 3 }, // Right-center
        { x: x + width, y: y + height, index: 4 }, // Bottom-right
        { x: x + width / 2, y: y + height, index: 5 }, // Bottom-center
        { x: x, y: y + height, index: 6 }, // Bottom-left
        { x: x, y: y + height / 2, index: 7 }, // Left-center
    ];

    return (
        <Group>
            {/* Bounding box border - draggable to move */}
            <Rect
                x={x}
                y={y}
                width={width}
                height={height}
                stroke={BORDER_COLOR}
                strokeWidth={2 / stageScale}
                dash={[5 / stageScale, 5 / stageScale]}
                draggable
                onDragMove={(e) => {
                    const delta = {
                        x: e.target.x() - x,
                        y: e.target.y() - y
                    };
                    onMove(delta.x, delta.y);
                    // Reset position to prevent double movement
                    e.target.position({ x, y });
                }}
                onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                        container.style.cursor = 'move';
                    }
                }}
                onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                        container.style.cursor = 'default';
                    }
                }}
            />

            {/* Resize handles */}
            {handles.map((handle) => (
                <KonvaCircle
                    key={handle.index}
                    x={handle.x}
                    y={handle.y}
                    radius={HANDLE_SIZE / stageScale}
                    fill={HANDLE_FILL}
                    stroke={BORDER_COLOR}
                    strokeWidth={2 / stageScale}
                    draggable
                    onDragMove={(e) => {
                        const pos = e.target.position();
                        onResize(handle.index, pos.x, pos.y);
                    }}
                    onMouseEnter={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) {
                            container.style.cursor = HANDLE_CURSORS[handle.index];
                        }
                    }}
                    onMouseLeave={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) {
                            container.style.cursor = 'default';
                        }
                    }}
                />
            ))}
        </Group>
    );
}

// Floating toolbar component (rendered outside canvas, in DOM)
interface FloatingToolbarProps {
    bounds: { x: number; y: number; width: number; height: number };
    onDelete: () => void;
    stageTransform: { x: number; y: number; scale: number };
}

export function FloatingToolbar({ bounds, onDelete, stageTransform }: FloatingToolbarProps) {
    // Convert scene coordinates to screen coordinates
    const screenX = bounds.x * stageTransform.scale + stageTransform.x;
    const screenY = (bounds.y - 50) * stageTransform.scale + stageTransform.y; // 50px above selection

    return (
        <div
            className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 px-2 py-1 flex items-center gap-1"
            style={{
                left: `${screenX}px`,
                top: `${screenY}px`,
            }}
        >
            <button
                onClick={onDelete}
                className="p-2 rounded hover:bg-red-50 text-red-600 transition-colors"
                title="Delete (Del)"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}
