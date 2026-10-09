import type { Field, DocumentType } from "../types";
import type { NormalizedLine } from "./normalize";

const EWALLET_NAME_LABELS = [
  "BENEFICIARY NAME",
  "TRANSFER TO",
  "DITRANSFER KE",
  "NAMA MERCHANT",
  "DIBAYAR KE",
  "PEMBAYARAN KE",
  "PENERIMA",
  "MERCHANT",
  "TUJUAN",
  "KE",
];

const KNOWN_MERCHANTS = [
  "INDOMARET",
  "ALFAMART",
  "ALFAMIDI",
  "SUPERINDO",
  "HYPERMART",
  "KOPI NAKO",
  "KFC",
  "MCDONALDS",
  "MCD",
  "SOLARIA",
  "STARBUCKS",
  "CHATIME",
  "JCO",
  "JANJI JIWA",
  "KOPI KENANGAN",
  "POINT COFFEE",
  "WARUNG",
  "PERTAMINA",
  "SPBU",
  "SHELL",
  "GRAMEDIA",
  "PLN",
  "TELKOM",
];

// Use word boundary regex for short address/phone markers so "PERTAMINA" doesn't match "RT"
const ADDRESS_PHONE_REGEX = /\b(JL|JALAN|NO\.?|TELP|TLP|HP|WA|NPWP|KEL|KEC|RT|RW)\b/i;

const GENERIC_KEYWORDS = [
  "STRUK",
  "NOTA",
  "RECEIPT",
  "INVOICE",
  "FAKTUR",
  "KASIR",
  "SELAMAT DATANG",
  "TERIMA KASIH",
  "ORDER",
  "BILL",
  "TABLE",
  "MEJA",
  "TOTAL",
  "SUBTOTAL",
  "TUNAI",
  "KEMBALI",
  "DETAIL PESANAN",
  "DETAIL TRANSAKSI",
  "RINCIAN TRANSAKSI",
  "RINCIAN",
  "DITERIMA",
  "DIPROSES",
  "SELESAI",
  "DISKON",
  "GET REWARD",
  "TRANSACTION STATUS",
  "METODE PEMBAYARAN",
  "AMBIL PESANAN",
  "REPUBLIK INDONESIA",
  "KARTU TANDA PENDUDUK",
  "SURAT IZIN MENGEMUDI",
  "KEPOLISIAN NEGARA",
  "IJAZAH",
  "SERTIFIKAT",
  "CURRICULUM VITAE",
  "DAFTAR RIWAYAT HIDUP",
];

export function extractName(
  lines: NormalizedLine[],
  docType: DocumentType
): Field<string> {
  // Strategy 1: E-wallet / Bank Transfer
  if (docType === "ewallet" || docType === "bank_transfer") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      for (const label of EWALLET_NAME_LABELS) {
        const regex = new RegExp(`^${label}\\s*[:\\-]?\\s*(.*)$`, "i");
        const match = line.normalized.match(regex);
        if (match) {
          let nameCandidate = match[1]?.trim() || "";

          // If empty, clean decorative characters or if purely digits (e.g. account number), search next non-empty line
          nameCandidate = nameCandidate.replace(/^[®@\*\-><\s]+/, "").trim();
          if (!nameCandidate || /^\d[\d\s\-]*$/.test(nameCandidate)) {
            let nextIdx = i + 1;
            while (nextIdx < lines.length && !lines[nextIdx]?.normalized.trim()) {
              nextIdx++;
            }
            if (nextIdx < lines.length) {
              const nextCandidate = lines[nextIdx]?.normalized.replace(/^[®@\*\-><\s]+/, "").trim() || "";
              if (nextCandidate && /[a-zA-Z]/.test(nextCandidate)) {
                nameCandidate = nextCandidate;
              }
            }
          }

          if (nameCandidate && nameCandidate.length >= 2) {
            let finalName = toTitleCase(nameCandidate);
            const lowerFinal = finalName.toLowerCase();
            if (label === "DITRANSFER KE" && !lowerFinal.startsWith("ditransfer ke")) {
              finalName = `Ditransfer ke ${finalName}`;
            } else if (
              docType === "bank_transfer" &&
              !lowerFinal.startsWith("transfer ke") &&
              !lowerFinal.startsWith("ditransfer ke")
            ) {
              finalName = `Transfer ke ${finalName}`;
            }
            return {
              value: finalName.slice(0, 60),
              confidence: 0.85,
              rule: `ewallet_label:${label}`,
            };
          }
        }
      }
    }
  }

  // Strategy 2: Receipt (Top 1–8 lines)
  const topLines = lines.slice(0, Math.min(8, lines.length));
  for (let i = 0; i < topLines.length; i++) {
    const line = topLines[i];
    if (!line) continue;
    let norm = line.normalized.trim();
    const upper = line.upper;

    // Strip leading decoration/app noise: e.g. "Hb ", "< ", "> "
    norm = norm.replace(/^(?:Hb|<|>|[\[\(]\w+[\]\)])\s+/i, "").trim();

    // Must have length >= 3
    if (norm.length < 3) continue;

    // Check consecutive digits >= 9 (phone / tax / receipt numbers)
    if (/\d{9,}/.test(norm)) continue;

    // Check letter ratio >= 0.5 (handles store codes like "SPBU 34-12345")
    const letterCount = (norm.match(/[a-zA-Z]/g) || []).length;
    if (letterCount / norm.length < 0.5) continue;

    // Check if matches known merchant dictionary
    const isKnown = KNOWN_MERCHANTS.some((m) => upper.includes(m));

    // Must NOT be address or phone keywords (unless known merchant matched)
    if (!isKnown && ADDRESS_PHONE_REGEX.test(norm)) continue;

    // Must NOT contain generic receipt / app keywords
    const isGeneric = GENERIC_KEYWORDS.some((kw) => upper.includes(kw));
    if (isGeneric) continue;

    // Strip order-type suffixes like "Dine-In ft TA6"
    norm = norm.replace(/\s+(?:Dine-In|Take Away|Takeaway|ft\s+\w+).*$/i, "").trim();

    return {
      value: toTitleCase(norm).slice(0, 60),
      confidence: isKnown ? 0.85 : 0.7,
      rule: isKnown ? "receipt_header_known_merchant" : "receipt_header_line",
    };
  }

  return {
    value: null,
    confidence: 0,
    rule: "no_name_found",
  };
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|\/|-)\S/g, (char) => char.toUpperCase())
    .replace(/\bKe\b/g, "ke")
    .replace(/\bDi\b/g, "di")
    .replace(/\bDari\b/g, "dari");
}

