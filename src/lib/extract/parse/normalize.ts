export interface NormalizedLine {
  original: string;
  normalized: string;
  upper: string;
}

/**
 * Normalizes a raw OCR text string into structured lines and sanitized tokens.
 * In accordance with EXTRACTION.md rule 1:
 * - Unifies currency markers (Rp, Rp., RP, IDR, Rp:) -> Rp
 * - Fixes OCR character misreads ONLY within tokens having thousands separators
 * - Fixes spaces in numbers with thousands grouping (e.g., "25 000" -> "25.000")
 */
export function normalizeOcrText(rawText: string): NormalizedLine[] {
  if (!rawText) return [];

  const rawLines = rawText.split(/\r?\n/);

  return rawLines.map((line) => {
    let norm = line.trim();

    // 1. Unify currency symbols
    norm = norm.replace(/\b(Rp\.|RP|IDR|Rp:)\b/gi, "Rp");
    norm = norm.replace(/Rp\s*([0-9])/gi, "Rp $1");

    // 2. Fix space in thousands pattern: e.g. "25 000" -> "25.000" (if followed by exactly 3 digits)
    norm = norm.replace(/\b(\d{1,3})\s+(\d{3})\b/g, "$1.$2");

    // 3. Fix OCR misreads ONLY on tokens with thousands separators (dots or commas)
    // Matches patterns like "2O.OOO", "1O0.000", "Rp 25.OOO"
    norm = norm.replace(/\b([0-9OoIl|SB]{1,3}[.,][0-9OoIl|SB]{3}(?:[.,][0-9OoIl|SB]{3})*)\b/g, (match) => {
      // Replace only within this numeric token
      return match
        .replace(/[Oo]/g, "0")
        .replace(/[Il|]/g, "1")
        .replace(/S/g, "5")
        .replace(/B/g, "8");
    });

    return {
      original: line,
      normalized: norm,
      upper: norm.toUpperCase(),
    };
  });
}
