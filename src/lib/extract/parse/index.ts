import type { ExtractionResult } from "../types";
import { normalizeOcrText } from "./normalize";
import { detectDocumentType } from "./doc-type";
import { extractAmount } from "./amount";
import { extractDate } from "./date";
import { extractName } from "./name";
import { extractCategorySuggestion } from "./category";
import { computeExtractionConfidence, determineExtractionStatus } from "./confidence";

/**
 * Pure parser function: transforms raw OCR text into structured ExtractionResult.
 * In accordance with AGENTS.md rule 6: Pure function with no I/O, no global state.
 */
export function parseReceiptText(
  rawText: string,
  ocrConfidence: number = 0.8
): ExtractionResult {
  const lines = normalizeOcrText(rawText);
  const docType = detectDocumentType(lines);

  const amountRes = extractAmount(lines, docType);
  const dateRes = extractDate(lines);
  const nameField = extractName(lines, docType);
  const categoryField = extractCategorySuggestion(lines, docType);

  const warnings: string[] = [];
  if (amountRes.warning) warnings.push(amountRes.warning);
  if (dateRes.warning) warnings.push(dateRes.warning);

  const extractionConfidence = computeExtractionConfidence(
    amountRes.field,
    dateRes.field,
    nameField
  );

  const status = determineExtractionStatus(
    amountRes.field,
    dateRes.field,
    nameField
  );

  return {
    status,
    doc_type: docType,
    name: nameField,
    amount: amountRes.field,
    expense_date: dateRes.field,
    category_suggestion: categoryField,
    extraction_confidence: extractionConfidence,
    ocr_confidence: ocrConfidence,
    warnings,
    raw_text: rawText,
  };
}
