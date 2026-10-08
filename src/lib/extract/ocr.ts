import type { OcrEngine, OcrOutput } from "./types";

interface WorkerHolder {
  worker: unknown;
  idleTimer: ReturnType<typeof setTimeout> | null;
}

let workerHolder: WorkerHolder | null = null;

export type OcrProgressCallback = (status: string, progress: number) => void;

/**
 * Gets or initializes the singleton Tesseract.js worker configured with self-hosted assets.
 * Terminates after 60 seconds of idle time to conserve browser memory.
 */
async function getWorker(onProgress?: OcrProgressCallback): Promise<unknown> {
  if (workerHolder && workerHolder.worker) {
    if (workerHolder.idleTimer) {
      clearTimeout(workerHolder.idleTimer);
      workerHolder.idleTimer = null;
    }
    return workerHolder.worker;
  }

  // Dynamic import so Tesseract is not bundled into the main initial bundle
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("ind+eng", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract",
    langPath: "/tesseract",
    gzip: false,
    workerBlobURL: false,
    logger: (m: { status: string; progress: number }) => {
      if (onProgress) {
        onProgress(m.status, m.progress);
      }
    },
    errorHandler: (err: unknown) => {
      console.error("[Tesseract.js Error]:", err);
    },
  });

  workerHolder = {
    worker,
    idleTimer: null,
  };

  return worker;
}

function scheduleWorkerDisposal() {
  if (!workerHolder) return;
  if (workerHolder.idleTimer) clearTimeout(workerHolder.idleTimer);

  workerHolder.idleTimer = setTimeout(async () => {
    if (workerHolder?.worker) {
      try {
        const w = workerHolder.worker as { terminate: () => Promise<unknown> };
        await w.terminate();
      } catch {
        // ignore
      }
      workerHolder = null;
    }
  }, 60_000);
}

/**
 * Browser-based OCR Engine implementation using Tesseract.js.
 */
export class BrowserOcrEngine implements OcrEngine {
  private onProgress?: OcrProgressCallback;

  constructor(onProgress?: OcrProgressCallback) {
    this.onProgress = onProgress;
  }

  async recognize(
    image: Blob | ImageBitmap,
    opts?: { psm?: number }
  ): Promise<OcrOutput> {
    const rawWorker = await getWorker(this.onProgress);
    const worker = rawWorker as {
      setParameters: (params: Record<string, unknown>) => Promise<unknown>;
      recognize: (image: Blob | ImageBitmap) => Promise<{
        data: {
          text: string;
          lines: Array<{
            text: string;
            confidence: number;
            bbox: { x0: number; y0: number; x1: number; y1: number };
          }>;
        };
      }>;
    };

    if (opts?.psm !== undefined) {
      await worker.setParameters({
        tessedit_pageseg_mode: opts.psm,
      });
    }

    const { data } = await worker.recognize(image);
    scheduleWorkerDisposal();

    const rawData = data as unknown as { confidence?: number; text?: string };
    const rawText = rawData.text || "";
    const overallConfidence = typeof rawData.confidence === "number"
      ? rawData.confidence
      : 75;

    // Tesseract.js v7 returns text & confidence; lines may be undefined
    const rawLines = (data as unknown as { lines?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }> }).lines;

    const parsedLines = Array.isArray(rawLines) && rawLines.length > 0
      ? rawLines.map((l) => ({
          text: l.text || "",
          confidence: typeof l.confidence === "number" ? l.confidence : overallConfidence,
          bbox: l.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
        }))
      : rawText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => ({
            text: line,
            confidence: overallConfidence,
            bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
          }));

    return {
      text: rawText,
      lines: parsedLines,
    };
  }

  async dispose(): Promise<void> {
    if (workerHolder?.worker) {
      const w = workerHolder.worker as { terminate: () => Promise<unknown> };
      await w.terminate();
      workerHolder = null;
    }
  }
}
