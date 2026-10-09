export const MIN_MONEY = 100;
export const MAX_MONEY = 1_000_000_000;

export interface MoneyToken {
  amount: number;
  raw: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Parses a single token or candidate string into an integer Rupiah.
 * Returns null if invalid or outside realistic boundaries.
 * In accordance with EXTRACTION.md rule 2.
 */
export function parseMoney(token: string): number | null {
  if (!token) return null;
  let str = token.trim();

  // Strip trailing currency suffix/decorations like ",-" or ".-" or ":-"
  str = str.replace(/[,.:]-$/, "");

  // Strip prefix currency symbols
  str = str.replace(/^(?:Rp\.?|IDR)\s*/i, "").trim();

  // 1. Check for Indonesian abbreviations: rb / ribu / k
  // e.g. "25rb", "25 rb", "25k", "25 ribu", "1,5rb", "1.5rb"
  const rbMatch = str.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:rb|k|ribu)$/i);
  if (rbMatch && rbMatch[1]) {
    const val = parseFloat(rbMatch[1].replace(",", "."));
    const amount = Math.round(val * 1000);
    return isWithinBounds(amount) ? amount : null;
  }

  // 2. Check for Indonesian abbreviations: jt / juta / million
  // e.g. "1,5jt", "1.5jt", "1,5 juta", "2jt"
  const jtMatch = str.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:jt|juta|m)$/i);
  if (jtMatch && jtMatch[1]) {
    const val = parseFloat(jtMatch[1].replace(",", "."));
    const amount = Math.round(val * 1_000_000);
    return isWithinBounds(amount) ? amount : null;
  }

  // 3. Reject non-integer decimals like "12.5" or "12,5" (which is not thousands and not zero cents)
  // Check decimal suffixes: e.g. ",00" or ".00"
  if (/[.,]00$/.test(str)) {
    str = str.slice(0, -3);
  } else if (/[.,]\d{1,2}$/.test(str)) {
    // If it has 1 or 2 digits at the end after separator and it's NOT ,00/.00,
    // e.g., "12.5" or "10.50" (cents that aren't zero), it's not a standard integer rupiah
    return null;
  }

  // 4. Standard thousands separated number or plain integer:
  // Examples: "25.000", "25,000", "1.250.000", "1,250,000", "25000"
  // Clean all separators (dots and commas used as thousands separators)
  const cleanNumStr = str.replace(/[.,\s]/g, "");
  if (!/^\d+$/.test(cleanNumStr)) {
    return null;
  }

  const amount = parseInt(cleanNumStr, 10);
  return isWithinBounds(amount) ? amount : null;
}

function isWithinBounds(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount >= MIN_MONEY && amount <= MAX_MONEY;
}

/**
 * Extracts all valid money candidates from a text line.
 */
export function findMoneyTokens(line: string): MoneyToken[] {
  const results: MoneyToken[] = [];
  if (!line) return results;

  // Regex matches potential money tokens:
  // - "Rp 25.000,-"
  // - "1.250.000"
  // - "25.000,00"
  // - "25rb", "1,5jt"
  // - Plain numbers with 3+ digits
  const regex = /(?:Rp\.?\s*)?\d+(?:[.,\s]\d+)*(?:\s*(?:rb|k|ribu|jt|juta))?(?:[,-])?/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    const candidateStr = match[0].trim();
    // Skip tokens immediately followed by non-monetary units (e.g. 500 orang, 100 halaman)
    const remainingLine = line.slice(match.index + match[0].length);
    if (
      /^\s*(?:orang|siswa|peserta|halaman|hlm|kasus|korban|eksemplar|tahun|thn|hari|bulan|bln|persen|%|unit)\b/i.test(
        remainingLine
      )
    ) {
      continue;
    }
    const parsed = parseMoney(candidateStr);
    if (parsed !== null) {
      results.push({
        amount: parsed,
        raw: candidateStr,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  return results;
}
