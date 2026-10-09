import type { DocumentType } from "../types";
import type { NormalizedLine } from "./normalize";

/**
 * Patterns that definitively identify non-receipt documents:
 * Identity cards, driving licenses, family cards, passports, certificates,
 * academic transcripts, official letters without payment, and lab results.
 */
export const DISQUALIFIED_DOCUMENT_PATTERNS: RegExp[] = [
  // Identity cards & government documents
  /\bKARTU\s+TANDA\s+PENDUDUK\b/i,
  /\bSURAT\s+IZIN\s+MENGEMUDI\b/i,
  /\bKARTU\s+KELUARGA\b/i,
  /\bPASPOR\b/i,
  /\bPASSPORT\b/i,
  /\bKARTU\s+IDENTITAS\s+ANAK\b/i,
  /\bKARTU\s+MAHASISWA\b/i,
  /\bKARTU\s+PELAJAR\b/i,
  /\bSURAT\s+TANDA\s+NOMOR\s+KENDARAAN\b/i,
  /\bREPUBLIK\s+INDONESIA\b/i,
  /\bKEPOLISIAN\s+NEGARA\s+REPUBLIK\s+INDONESIA\b/i,

  // Academic & Employment records
  /\bIJAZAH\b/i,
  /\bSERTIFIKAT\b/i,
  /\bCERTIFICATE\s+OF\b/i,
  /\bTRANSKRIP\s+NILAI\b/i,
  /\bCURRICULUM\s+VITAE\b/i,
  /\bDAFTAR\s+RIWAYAT\s+HIDUP\b/i,
  /\bSURAT\s+LAMARAN\s+KERJA\b/i,

  // Official correspondence without financial payment
  /\bSURAT\s+PERJANJIAN\s+KERJA\b/i,
  /\bSURAT\s+KEPUTUSAN\b/i,
  /\bSURAT\s+PERNYATAAN\b/i,
  /\bSURAT\s+KETERANGAN\s+LULUS\b/i,
  /\bSURAT\s+TUGAS\b/i,
  /\bSURAT\s+KUASA\b/i,

  // Medical/lab non-bills
  /\bHASIL\s+LABORATORIUM\b/i,
  /\bHASIL\s+PEMERIKSAAN\b/i,
  /\bREKAM\s+MEDIS\b/i,
];

/**
 * Positive keywords that signal an authentic transaction, receipt, or payment proof.
 */
export const TRANSACTION_KEYWORDS: string[] = [
  // Retail / Restaurant / Receipt terms
  "STRUK",
  "NOTA",
  "KWITANSI",
  "KASIR",
  "SUBTOTAL",
  "SUB TOTAL",
  "SUB-TOTAL",
  "TOTAL BAYAR",
  "TOTAL BELANJA",
  "TOTAL PEMBAYARAN",
  "TOTAL TAGIHAN",
  "GRAND TOTAL",
  "JUMLAH BAYAR",
  "TUNAI",
  "KEMBALI",
  "KEMBALIAN",
  "PB1",
  "DINE-IN",
  "DINE IN",
  "TAKE AWAY",
  "TAKEAWAY",
  "FAKTUR",
  "INVOICE",
  "BILL",
  "RECEIPT",
  "ORDER ID",
  "NO STRUK",
  "NO. STRUK",
  "NO NOTA",
  "NO. NOTA",
  "HARGA",
  "HARGA JUAL",
  "BIAYA",
  "TAGIHAN",
  "PEMBAYARAN",
  "ITEMS",
  "QTY",

  // E-Wallet terms
  "PEMBAYARAN BERHASIL",
  "TRANSAKSI BERHASIL",
  "BUKTI PEMBAYARAN",
  "BUKTI TRANSAKSI",
  "RINCIAN TRANSAKSI",
  "DETAIL TRANSAKSI",
  "DETAIL PEMBAYARAN",
  "QRIS",
  "GOPAY",
  "OVO",
  "DANA",
  "SHOPEEPAY",
  "LINKAJA",
  "ASTRAPAY",
  "ISAKU",

  // Bank Transfer terms
  "M-TRANSFER",
  "MYBCA",
  "TRANSFER BERHASIL",
  "BUKTI TRANSFER",
  "DITRANSFER KE",
  "TRANSFER RUPIAH",
  "TRANSFER DANA",
  "KIRIM UANG",
  "BI-FAST",
  "BI FAST",
  "REKENING TUJUAN",
  "NOMINAL TRANSFER",
  "JUMLAH TRANSFER",
  "TRANSFER KE",

  // Known Retailers / Merchants
  "INDOMARET",
  "ALFAMART",
  "ALFAMIDI",
  "SUPERINDO",
  "HYPERMART",
  "PERTAMINA",
  "SPBU",
  "SHELL",
  "KOPI NAKO",
  "KOPI KENANGAN",
  "JANJI JIWA",
  "STARBUCKS",
  "KFC",
  "MCDONALDS",
  "MCD",
  "SOLARIA",
  "CHATIME",
  "JCO",
  "POINT COFFEE",
  "PLN PREPAID",
  "TOKEN LISTRIK",
];

/**
 * Checks if the text has clear markers of non-expense documents (e.g. ID card, SIM, resume).
 */
export function isDisqualifiedDocument(lines: NormalizedLine[]): boolean {
  const fullText = lines.map((l) => l.upper).join(" ");

  for (const pattern of DISQUALIFIED_DOCUMENT_PATTERNS) {
    if (pattern.test(fullText)) {
      return true;
    }
  }

  // Identity card check (e.g. NIK accompanied by government/demographic terms)
  if (
    /\bNIK\b/.test(fullText) &&
    (/\bPROVINSI\b/.test(fullText) ||
      /\bKABUPATEN\b/.test(fullText) ||
      /\bTEMPAT\/TGL\s*LAHIR\b/.test(fullText) ||
      /\bGOL\.?\s*DARAH\b/.test(fullText) ||
      /\bAGAMA\b/.test(fullText))
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if the text contains positive transaction / receipt keywords.
 */
export function hasTransactionKeywords(lines: NormalizedLine[]): boolean {
  const fullUpper = lines.map((l) => l.upper).join(" ");
  return TRANSACTION_KEYWORDS.some((kw) => fullUpper.includes(kw));
}

export interface ExpenseValidationResult {
  isExpense: boolean;
  reason?: string;
}

/**
 * Validates whether the document represents a genuine expense, receipt, or payment proof.
 * Rejects non-receipts (ID cards, book pages, personal chats, landscape/object text, etc.).
 */
export function isExpenseDocument(
  lines: NormalizedLine[],
  docType: DocumentType,
  result?: {
    amount?: { value: number | null };
    name?: { value: string | null };
  }
): boolean {
  // 1. Negative check: definitely disqualified (ID cards, CV, etc.)
  if (isDisqualifiedDocument(lines)) {
    return false;
  }

  const fullUpper = lines.map((l) => l.upper).join(" ");

  // 2. Currency indicator
  const hasCurrency = /\b(?:RP|IDR)\b/i.test(fullUpper);

  // 3. Positive transaction keywords
  const hasTransKw = hasTransactionKeywords(lines);

  // 4. Known document type from OCR header rules
  const isKnownType =
    docType === "receipt" || docType === "ewallet" || docType === "bank_transfer";

  // 5. Valid detected amount
  const hasValidAmount =
    typeof result?.amount?.value === "number" &&
    Number.isSafeInteger(result.amount.value) &&
    result.amount.value > 0;

  // If doc_type is unknown, has no transaction keywords, and no currency symbol:
  // It is definitely not an expense!
  if (!isKnownType && !hasTransKw && !hasCurrency) {
    return false;
  }

  // If doc_type is unknown, and no valid amount was extracted, and no transaction keywords exist:
  if (!isKnownType && !hasValidAmount && !hasTransKw) {
    return false;
  }

  return true;
}
