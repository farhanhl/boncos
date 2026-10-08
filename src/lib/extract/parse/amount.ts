import type { Field, DocumentType } from "../types";
import type { NormalizedLine } from "./normalize";
import { findMoneyTokens } from "./money";

const STRONG_TOTAL_KEYWORDS = [
  "GRAND TOTAL",
  "TOTAL BAYAR",
  "TOTAL PEMBAYARAN",
  "TOTAL TAGIHAN",
  "TOTAL BELANJA",
  "JUMLAH BAYAR",
  "AMOUNT DUE",
  "TOTAL AKHIR",
  "TOTAL",
];

const IGNORE_TOTAL_KEYWORDS = [
  "SUBTOTAL",
  "SUB TOTAL",
  "SUB-TOTAL",
  "TOTAL ITEM",
  "TOTAL ITEMS",
  "TOTAL QTY",
  "TOTAL DISKON",
  "TOTAL HEMAT",
  "PPN",
  "PAJAK",
  "SERVICE",
  "DISKON",
  "DISCOUNT",
  "KEMBALI",
  "KEMBALIAN",
  "CHANGE",
];

const EWALLET_TOTAL_KEYWORDS = [
  "NOMINAL TRANSFER",
  "JUMLAH TRANSFER",
  "NOMINAL",
  "TOTAL TRANSAKSI",
  "JUMLAH",
  "TOTAL",
];

interface Candidate {
  amount: number;
  confidence: number;
  rule: string;
  lineIndex: number;
}

export function extractAmount(
  lines: NormalizedLine[],
  docType: DocumentType
): { field: Field<number>; warning?: string } {
  const candidatesTier1: Candidate[] = [];
  let tunaiVal: number | null = null;
  let kembaliVal: number | null = null;

  // Track tunai / kembali for cross-check
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const upper = line.upper;

    // Detect Tunai / Cash
    if (/\b(TUNAI|CASH|DIBAYAR|BAYAR)\b/.test(upper) && !/\b(TOTAL|SUBTOTAL)\b/.test(upper)) {
      const tokens = findMoneyTokens(line.normalized);
      if (tokens.length > 0) {
        const lastToken = tokens[tokens.length - 1];
        if (lastToken) tunaiVal = lastToken.amount;
      }
    }

    // Detect Kembali / Change
    if (/\b(KEMBALI|KEMBALIAN|CHANGE)\b/.test(upper)) {
      const tokens = findMoneyTokens(line.normalized);
      if (tokens.length > 0) {
        const lastToken = tokens[tokens.length - 1];
        if (lastToken) kembaliVal = lastToken.amount;
      }
    }

    // Tier 1: Check strong total keywords
    const isIgnored = IGNORE_TOTAL_KEYWORDS.some((kw) => upper.includes(kw));
    if (!isIgnored) {
      for (const kw of STRONG_TOTAL_KEYWORDS) {
        const idx = upper.indexOf(kw);
        if (idx !== -1) {
          // Find money in current line
          const tokens = findMoneyTokens(line.normalized);
          if (tokens.length > 0) {
            // Pick rightmost token
            const rightmost = tokens[tokens.length - 1];
            if (rightmost) {
              candidatesTier1.push({
                amount: rightmost.amount,
                confidence: 0.9,
                rule: `tier1:${kw}`,
                lineIndex: i,
              });
              break;
            }
          } else if (i + 1 < lines.length) {
            // Check next line if no money on current line
            const nextTokens = findMoneyTokens(lines[i + 1]?.normalized || "");
            if (nextTokens.length > 0) {
              const rightmost = nextTokens[nextTokens.length - 1];
              if (rightmost) {
                candidatesTier1.push({
                  amount: rightmost.amount,
                  confidence: 0.85,
                  rule: `tier1_next_line:${kw}`,
                  lineIndex: i + 1,
                });
                break;
              }
            }
          }
        }
      }
    }
  }

  // Tier 2: Cross check (Tunai - Kembali)
  let crossCheckCandidate: Candidate | null = null;
  if (tunaiVal !== null && kembaliVal !== null && tunaiVal >= kembaliVal) {
    const derived = tunaiVal - kembaliVal;
    if (derived > 0) {
      crossCheckCandidate = {
        amount: derived,
        confidence: 0.8,
        rule: "tier2:cross_check_tunai_kembali",
        lineIndex: -1,
      };
    }
  }

  // If Tier 1 has candidates
  if (candidatesTier1.length > 0) {
    // If multiple candidates in Tier 1: pick closest to bottom for receipt, top for ewallet
    const chosen =
      docType === "ewallet" || docType === "bank_transfer"
        ? candidatesTier1[0]
        : candidatesTier1[candidatesTier1.length - 1];

    if (!chosen) {
      return { field: { value: null, confidence: 0, rule: "none" } };
    }

    // Cross-check bonus!
    if (crossCheckCandidate && crossCheckCandidate.amount === chosen.amount) {
      return {
        field: {
          value: chosen.amount,
          confidence: 0.95,
          rule: `${chosen.rule}+cross_check_match`,
        },
      };
    }

    const conf = candidatesTier1.length > 1 ? Math.max(0.7, chosen.confidence - 0.15) : chosen.confidence;
    return {
      field: {
        value: chosen.amount,
        confidence: conf,
        rule: chosen.rule,
      },
    };
  }

  // If Tier 1 is empty but cross-check exists
  if (crossCheckCandidate) {
    return {
      field: {
        value: crossCheckCandidate.amount,
        confidence: crossCheckCandidate.confidence,
        rule: crossCheckCandidate.rule,
      },
    };
  }

  // Tier 3: E-wallet / Bank transfer keywords OR prominent Rp line at top
  if (docType === "ewallet" || docType === "bank_transfer") {
    // 3a. With keywords
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const upper = line.upper;
      for (const kw of EWALLET_TOTAL_KEYWORDS) {
        if (upper.includes(kw)) {
          const tokens = findMoneyTokens(line.normalized);
          if (tokens.length > 0) {
            const token = tokens[tokens.length - 1];
            if (token) {
              return {
                field: {
                  value: token.amount,
                  confidence: 0.85,
                  rule: `tier3_ewallet:${kw}`,
                },
              };
            }
          }
        }
      }
    }

    // 3b. Line starting with Rp or IDR in e-wallet/bank transfer screens (EXTRACTION.md 3.3)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const trimmed = line.normalized.trim();
      if (/^(?:Rp|IDR)\s*[\d\.,]+/i.test(trimmed)) {
        const tokens = findMoneyTokens(trimmed);
        if (tokens.length > 0 && tokens[0]) {
          return {
            field: {
              value: tokens[0].amount,
              confidence: 0.85,
              rule: "tier3_ewallet:top_rp_line",
            },
          };
        }
      }
    }
  }

  // Tier 4: Fallback to largest valid money candidate not in tunai/kembali line
  let maxRpAmount = 0;
  let maxFormattedAmount = 0;

  for (const line of lines) {
    const upper = line.upper;
    if (/\b(TUNAI|CASH|KEMBALI|KEMBALIAN|CHANGE)\b/.test(upper)) continue;
    const tokens = findMoneyTokens(line.normalized);
    for (const t of tokens) {
      if (line.normalized.includes("Rp") && t.amount > maxRpAmount) {
        maxRpAmount = t.amount;
      }
      if (t.amount > maxFormattedAmount) {
        maxFormattedAmount = t.amount;
      }
    }
  }

  const fallbackAmount = maxRpAmount > 0 ? maxRpAmount : maxFormattedAmount;
  if (fallbackAmount > 0) {
    return {
      field: {
        value: fallbackAmount,
        confidence: 0.5,
        rule: "tier4:largest_number_fallback",
      },
      warning: "Nominal ditebak dari angka terbesar",
    };
  }

  return {
    field: {
      value: null,
      confidence: 0,
      rule: "no_amount_found",
    },
  };
}
