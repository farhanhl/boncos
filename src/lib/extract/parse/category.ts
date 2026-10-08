import type { CategorySlug, DocumentType, Field } from "../types";
import { CATEGORY_KEYWORDS } from "../category-keywords";
import type { NormalizedLine } from "./normalize";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const STRONG_TRANSFER_INDICATORS = [
  "M-TRANSFER",
  "M TRANSFER",
  "TRANSFER BERHASIL",
  "TRANSFER SUCCESSFUL",
  "BUKTI TRANSFER",
  "DITRANSFER KE",
  "TRANSFER KE",
  "TRANSFER RUPIAH",
  "TRANSFER DANA",
  "TRANSFER SALDO",
  "KIRIM UANG",
  "KIRIM DANA",
  "KIRIM SALDO",
  "KIRIM KE BANK",
  "SENT TO BANK",
  "TRANSFER DETAILS",
  "BI-FAST",
  "BI FAST",
  "REALTIME ONLINE",
  "REK PEMINDAHAN",
  "REKENING TUJUAN",
  "NO REKENING",
  "NOMOR REKENING",
  "BENEFICIARY NAME",
  "BENEFICIARY ACCOUNT",
  "PENERIMA TRANSFER",
];

export function extractCategorySuggestion(
  lines: NormalizedLine[],
  docType?: DocumentType
): Field<CategorySlug> {
  // 1. Direct bank transfer document type is definitively a transfer
  if (docType === "bank_transfer") {
    return {
      value: "transfer",
      confidence: 0.95,
      rule: "doc_type_bank_transfer",
    };
  }

  const fullText = lines.map((l) => l.upper).join(" ");

  // 2. Strong transfer indicators for e-wallet transfers or non-receipt docs
  if (docType !== "receipt") {
    for (const indicator of STRONG_TRANSFER_INDICATORS) {
      if (fullText.includes(indicator)) {
        return {
          value: "transfer",
          confidence: 0.95,
          rule: "transfer_indicator_match",
        };
      }
    }
  }

  const scores: Record<CategorySlug, number> = {
    food: 0,
    transport: 0,
    shopping: 0,
    bills: 0,
    transfer: 0,
    entertainment: 0,
    health: 0,
    education: 0,
    other: 0,
  };

  // Header lines (store name / merchant) carry higher weight
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (!line) continue;
    const isHeader = lineIndex < 3;
    const lineWeight = isHeader ? 3 : 1;

    for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS) as [CategorySlug, string[]][]) {
      // In physical store receipts, avoid payment method "transfer" overshadowing the store category
      if (slug === "transfer" && docType === "receipt") {
        continue;
      }

      for (const kw of keywords) {
        const isMultiWord = kw.includes(" ") || kw.includes("-") || kw.length >= 8;
        const kwWeight = isMultiWord ? 2 : 1;

        const escaped = escapeRegex(kw);
        const regex = new RegExp(`(?:^|[^A-Z0-9])${escaped}(?:$|[^A-Z0-9])`, "g");
        const matches = line.upper.match(regex);
        if (matches) {
          scores[slug] += matches.length * lineWeight * kwWeight;
        }
      }
    }
  }

  let bestSlug: CategorySlug | null = null;
  let maxScore = 0;
  let isTie = false;

  for (const [slug, score] of Object.entries(scores) as [CategorySlug, number][]) {
    if (score > maxScore) {
      maxScore = score;
      bestSlug = slug;
      isTie = false;
    } else if (score === maxScore && score > 0) {
      isTie = true;
    }
  }

  if (bestSlug && !isTie && maxScore > 0) {
    return {
      value: bestSlug,
      confidence: Math.min(0.95, 0.65 + Math.min(maxScore, 5) * 0.06),
      rule: `keywords_match_${maxScore}`,
    };
  }

  return {
    value: null,
    confidence: 0,
    rule: isTie ? "category_tie" : "no_category_match",
  };
}
