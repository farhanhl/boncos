import type { ExtractionResult, ExtractionErrorCode } from "./types";
import { preprocessImage } from "./preprocess";
import { BrowserOcrEngine, type OcrProgressCallback } from "./ocr";
import { parseReceiptText } from "./parse";

export class ExtractionError extends Error {
  code: ExtractionErrorCode;

  constructor(code: ExtractionErrorCode, message: string) {
    super(message);
    this.name = "ExtractionError";
    this.code = code;
  }
}

/**
 * Validates the uploaded file.
 * Allowed formats: JPG, PNG, WEBP (and HEIC if supported). Max 10MB.
 */
export function validateImageFile(file: Blob): void {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new ExtractionError(
      "INVALID_FILE",
      "File terlalu besar. Maksimal 10 MB."
    );
  }

  // Type check if available
  if (file.type && !file.type.match(/^image\/(jpeg|png|webp|heic|heif)/i)) {
    throw new ExtractionError(
      "INVALID_FILE",
      "Format file tidak didukung. Gunakan JPG, PNG, atau WEBP."
    );
  }
}

/**
 * Main client-side extraction pipeline.
 * Entirely runs inside browser memory; NEVER sends images or OCR text to server.
 */
export async function extractFromImage(
  file: Blob,
  onProgress?: OcrProgressCallback
): Promise<ExtractionResult> {
  // 1. Validation
  validateImageFile(file);

  const engine = new BrowserOcrEngine(onProgress);

  try {
    // 2. Preprocess Pass 1 (Grayscale + Contrast stretch)
    const preprocessedBlob1 = await preprocessImage(file, {
      adaptiveBinarization: false,
    });

    // 3. OCR Pass 1 (PSM 6: Assume a single uniform block of text)
    const ocrOutput1 = await engine.recognize(preprocessedBlob1, { psm: 6 });
    const rawText1 = ocrOutput1.text.trim();

    // Check minimum readable text length
    const alphaNumChars = (rawText1.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphaNumChars < 10) {
      throw new ExtractionError(
        "NO_TEXT",
        "Tidak ada tulisan yang terbaca. Coba foto yang lebih terang, lurus, dan lebih dekat, atau isi manual."
      );
    }

    const avgConfidence1 =
      ocrOutput1.lines.length > 0
        ? ocrOutput1.lines.reduce((acc, l) => acc + l.confidence, 0) /
          ocrOutput1.lines.length
        : 50;

    let result1 = parseReceiptText(rawText1, avgConfidence1 / 100);

    // Check if definitely not an expense
    if (
      result1.amount.value === null &&
      result1.doc_type === "unknown" &&
      result1.name.value === null
    ) {
      throw new ExtractionError(
        "NOT_AN_EXPENSE",
        "Ini sepertinya bukan struk atau bukti bayar. Coba foto lain atau isi manual."
      );
    }

    // 4. Pass 2 (Adaptive binarization) if Pass 1 confidence is low (< 0.7)
    if (result1.extraction_confidence < 0.7) {
      try {
        const preprocessedBlob2 = await preprocessImage(file, {
          adaptiveBinarization: true,
        });
        const ocrOutput2 = await engine.recognize(preprocessedBlob2, { psm: 6 });
        const rawText2 = ocrOutput2.text.trim();

        const avgConfidence2 =
          ocrOutput2.lines.length > 0
            ? ocrOutput2.lines.reduce((acc, l) => acc + l.confidence, 0) /
              ocrOutput2.lines.length
            : 50;

        const result2 = parseReceiptText(rawText2, avgConfidence2 / 100);

        // Pick whichever result achieved higher confidence
        if (result2.extraction_confidence > result1.extraction_confidence) {
          result1 = result2;
        }
      } catch {
        // If Pass 2 fails, keep Pass 1 result
      }
    }

    return result1;
  } catch (err) {
    if (err instanceof ExtractionError) {
      throw err;
    }
    console.error("[extractFromImage Error]:", err);
    throw new ExtractionError(
      "OCR_FAILED",
      err instanceof Error
        ? `Pembaca struk gagal memproses gambar: ${err.message}`
        : "Pembaca struk gagal memuat atau memproses gambar. Muat ulang halaman atau isi manual."
    );
  }
}
