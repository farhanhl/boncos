export type CategorySlug =
  | "food"
  | "transport"
  | "shopping"
  | "bills"
  | "entertainment"
  | "health"
  | "education"
  | "transfer"
  | "other";

export interface Field<T> {
  value: T | null;
  confidence: number; // 0–1
  rule: string; // rule ID for debugging/eval
}

export type DocumentType = "receipt" | "ewallet" | "bank_transfer" | "unknown";
export type ExtractionStatus = "ok" | "partial" | "empty";

export interface ExtractionResult {
  status: ExtractionStatus;
  doc_type: DocumentType;
  name: Field<string>;
  amount: Field<number>; // integer rupiah
  expense_date: Field<string>; // 'YYYY-MM-DD'
  category_suggestion: Field<CategorySlug>;
  extraction_confidence: number; // 0.6*amount + 0.2*date + 0.2*name (null = 0)
  ocr_confidence: number; // average OCR line confidence (0-100 or 0-1)
  warnings: string[];
  raw_text: string; // client-only memory, never sent/saved to server
}

export type ExtractionErrorCode =
  | "INVALID_FILE"
  | "OCR_FAILED"
  | "NO_TEXT"
  | "NOT_AN_EXPENSE";

export interface OcrBBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: OcrBBox;
}

export interface OcrOutput {
  text: string;
  lines: OcrLine[];
}

export interface OcrEngine {
  recognize(image: ImageBitmap | Blob, opts?: { psm?: number }): Promise<OcrOutput>;
  dispose(): Promise<void>;
}
