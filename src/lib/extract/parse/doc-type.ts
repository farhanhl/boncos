import type { DocumentType } from "../types";
import type { NormalizedLine } from "./normalize";

const BANK_TRANSFER_KEYWORDS = [
  "M-TRANSFER",
  "MYBCA",
  "TRANSFER SUCCESSFUL",
  "BUKTI TRANSFER",
  "SENT TO BANK",
  "BENEFICIARY NAME",
  "BENEFICIARY ACCOUNT",
  "TRANSFER TO",
  "DITRANSFER KE",
  "TRANSFER DETAILS",
  "TRANSFER BERHASIL",
  "TRANSFER RUPIAH",
  "TRANSFER DANA",
  "TRANSFER SALDO",
  "KIRIM UANG",
  "KIRIM KE BANK",
  "BI-FAST",
  "BI FAST",
  "REALTIME ONLINE",
  "REK PEMINDAHAN",
  "REKENING TUJUAN",
];

const STRONG_RECEIPT_KEYWORDS = [
  "SUBTOTAL",
  "SUB TOTAL",
  "SUB-TOTAL",
  "PB1",
  "DINE-IN",
  "DINE IN",
  "TAKE AWAY",
  "TAKEAWAY",
  "NO STRUK",
  "NO. STRUK",
  "KASIR",
  "NPWP",
  "MEJA",
  "TUNAI",
  "KEMBALI",
  "STRUK",
  "ITEMS",
];

const EWALLET_KEYWORDS = [
  "TRANSAKSI BERHASIL",
  "PEMBAYARAN BERHASIL",
  "BUKTI PEMBAYARAN",
  "QRIS",
  "NO. REFERENSI",
  "NO REFERENSI",
  "ID TRANSAKSI",
  "GOPAY",
  "OVO",
  "DANA",
  "SHOPEEPAY",
  "LINKAJA",
];

export function detectDocumentType(lines: NormalizedLine[]): DocumentType {
  const fullText = lines.map((l) => l.upper).join(" ");

  // 1. Bank transfer takes priority if specific bank transfer headers/fields exist
  for (const kw of BANK_TRANSFER_KEYWORDS) {
    if (fullText.includes(kw)) {
      return "bank_transfer";
    }
  }

  // 2. Strong receipt structure (even if paid with QRIS or e-wallet)
  for (const kw of STRONG_RECEIPT_KEYWORDS) {
    if (fullText.includes(kw)) {
      return "receipt";
    }
  }

  // 3. E-wallet payment screens
  for (const kw of EWALLET_KEYWORDS) {
    if (fullText.includes(kw)) {
      return "ewallet";
    }
  }

  // 4. Fallback checks
  if (fullText.includes("TRANSFER") || fullText.includes("BANK")) {
    return "bank_transfer";
  }

  if (fullText.includes("TOTAL")) {
    return "receipt";
  }

  return "unknown";
}

