'use client';

import React, { useState, useCallback } from 'react';
import { ScanText, Loader2 } from 'lucide-react';
import { useWhiteboardStore } from '@/store/whiteboardStore';
import { useModal } from '@/components/providers/ModalProvider';
import { recognizeText, captureCanvasRegion, getBoundsFromPoints, OcrProgress } from '@/utils/ocr';

interface OcrButtonProps {
    className?: string;
}

export default function OcrButton({ className = '' }: OcrButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<OcrProgress | null>(null);

    const {
        selectedStrokeIds,
        strokes,
        stageRef,
        addStroke,
        currentPageId,
        currentColor,
        currentFontFamily,
        setSelectedStrokeIds
    } = useWhiteboardStore();

    const { showAlert } = useModal();

    const handleOcr = useCallback(async () => {
        // Check if we can perform OCR
        if (!stageRef) {
            showAlert('OCR Error', 'Canvas not ready. Please try again.', 'warning');
            return;
        }

        setIsProcessing(true);
        setProgress({ status: 'Initializing...', progress: 0 });

        try {
            let imageData: string;
            let bounds: { x: number; y: number; width: number; height: number } | undefined;

            // If strokes are selected, OCR only the selected region
            if (selectedStrokeIds.length > 0) {
                const selectedStrokes = strokes.filter(s => selectedStrokeIds.includes(s.id));
                const allPoints = selectedStrokes.flatMap(s => s.points);

                if (allPoints.length === 0) {
                    showAlert('OCR Error', 'No content in selection.', 'warning');
                    setIsProcessing(false);
                    return;
                }

                bounds = getBoundsFromPoints(allPoints);
                imageData = captureCanvasRegion(stageRef, bounds);
            } else {
                // OCR the entire visible canvas
                imageData = captureCanvasRegion(stageRef);
                bounds = { x: 50, y: 50, width: 200, height: 50 }; // Default position for result
            }

            // Perform OCR
            const result = await recognizeText(imageData, (p) => {
                setProgress(p);
            });

            if (!result.text || result.text.trim().length === 0) {
                showAlert('OCR Result', 'No text detected. Try selecting a region with clearer handwriting.', 'info');
                setIsProcessing(false);
                return;
            }

            // Create a text stroke with the recognized text
            const newTextStroke = {
                id: crypto.randomUUID(),
                tool: 'text' as const,
                points: [{ x: bounds?.x || 50, y: (bounds?.y || 0) + (bounds?.height || 0) + 30 }],
                color: currentColor,
                width: 24,
                opacity: 1,
                pageId: currentPageId || 'default',
                createdAt: new Date().toISOString(),
                text: result.text.trim(),
                fontFamily: currentFontFamily,
                fontSize: 24,
            };

            addStroke(newTextStroke);
            setSelectedStrokeIds([newTextStroke.id]);

            showAlert(
                'Text Recognized!',
                `Confidence: ${Math.round(result.confidence)}%\n\nRecognized: "${result.text.trim().substring(0, 100)}${result.text.length > 100 ? '...' : ''}"`,
                'success'
            );

        } catch (error) {
            console.error('OCR Error:', error);
            showAlert(
                'OCR Failed',
                error instanceof Error ? error.message : 'Unable to recognize text. Please try again.',
                'danger'
            );
        } finally {
            setIsProcessing(false);
            setProgress(null);
        }
    }, [stageRef, selectedStrokeIds, strokes, addStroke, currentPageId, currentColor, currentFontFamily, setSelectedStrokeIds, showAlert]);

    return (
        <>
            <button
                onClick={handleOcr}
                disabled={isProcessing}
                className={`p-2.5 rounded-xl transition-all ${isProcessing
                        ? 'bg-blue-100 text-blue-600 cursor-wait'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                    } ${className}`}
                title={selectedStrokeIds.length > 0 ? 'Recognize Text (Selection)' : 'Recognize Text (Full Canvas)'}
            >
                {isProcessing ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <ScanText size={20} />
                )}
            </button>

            {/* OCR Progress Overlay */}
            {isProcessing && progress && (
                <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center">
                        <div className="mb-4">
                            <ScanText size={48} className="mx-auto text-blue-500 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Recognizing Text...</h3>
                        <p className="text-gray-500 mb-4 capitalize">{progress.status}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.round(progress.progress * 100)}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-400 mt-2">{Math.round(progress.progress * 100)}%</p>
                    </div>
                </div>
            )}
        </>
    );
}
