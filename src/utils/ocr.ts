'use client';

import Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export interface OcrProgress {
  status: string;
  progress: number;
}

/**
 * Recognize text from an image using Tesseract.js OCR
 * @param imageData - Base64 image data, Blob, or image URL
 * @param onProgress - Optional callback for progress updates
 * @returns Promise with OCR result containing text and confidence
 */
export async function recognizeText(
  imageData: string | Blob,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  const result = await Tesseract.recognize(imageData, 'eng', {
    logger: (m) => {
      if (onProgress && m.status) {
        onProgress({
          status: m.status,
          progress: m.progress || 0,
        });
      }
    },
  });

  return {
    text: result.data.text.trim(),
    confidence: result.data.confidence,
    words: (result.data as any).words.map((word: any) => ({
      text: word.text,
      confidence: word.confidence,
      bbox: word.bbox,
    })),
  };
}

/**
 * Capture a region of the canvas as an image
 * @param stage - Konva Stage reference
 * @param bounds - Region bounds { x, y, width, height }
 * @returns Base64 image data URL
 */
export function captureCanvasRegion(
  stage: any,
  bounds?: { x: number; y: number; width: number; height: number }
): string {
  if (bounds) {
    return stage.toDataURL({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      pixelRatio: 2, // Higher quality for better OCR
    });
  }
  return stage.toDataURL({ pixelRatio: 2 });
}

/**
 * Get bounding box from an array of points
 */
export function getBoundsFromPoints(points: Array<{ x: number; y: number }>): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Add padding for better OCR accuracy
  const padding = 20;

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}
