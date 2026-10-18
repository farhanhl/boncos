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
  "TO",
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
  "QRIS",
  "AMBIL PESANAN",
  "REPUBLIK INDONESIA",
  "KARTU TANDA PENDUDUK",
  "SURAT IZIN MENGEMUDI",
  "KEPOLISIAN NEGARA",
  "IJAZAH",
  "SERTIFIKAT",
  "CURRICULUM VITAE",
  "DAFTAR RIWAYAT HIDUP",
  "PEMBAYARAN BERHASIL",
  "TRANSAKSI BERHASIL",
  "TRANSFER BERHASIL",
  "PEMBAYARAN SUKSES",
  "TRANSAKSI SUKSES",
  "TRANSFER SUKSES",
  "BERHASIL",
  "SUCCESS",
  "SUCCESSFUL",
  "PAYMENT SUCCESSFUL",
  "TRANSACTION SUCCESSFUL",
  "TRANSFER SUCCESSFUL",
  "LIHAT RESI",
  "BAGIKAN RESI",
  "BAGIKAN BUKTI",
  "UNDUH RESI",
  "UNDUH BUKTI",
  "BUKTI PEMBAYARAN",
  "BUKTI TRANSAKSI",
  "BUKTI TRANSFER",
  "NOMINAL TRANSAKSI",
  "NOMINAL PEMBAYARAN",
  "NOMINAL TRANSFER",
  "APP STORE",
  "GOOGLE PLAY",
  "PLAY STORE",
  "VOUCHER",
  "HADIAH VOUCHER",
  "CASHBACK",
  "TOTAL REWARDS",
  "PROMOTION DETAILS",
  "PAYMENT DETAILS",
  "PAYMENT TIME",
  "PAYMENT VERIFICATION",
  "SKIPPING PAYMENT VERIFICATION",
  "PAYMENT VERIF",
  "SEAMLESS AND SECURE PAYMENT",
  "SEAMLESS",
  "YOU PAID",
  "ENABLE",
  "ENJOY SEAMLESS",
  "SPLIT BILL",
  "VIEW MORE",
  "KLAIM",
  "PENERIMA",
  "PENGIRIM",
  "BENEFICIARY",
  "BENEFICIARY NAME",
  "NAMA MERCHANT",
  "COMPLETED",
  "ORDER DETAILS",
  "ORDER DETAIL",
  "THANK YOU FOR PURCHASING",
  "PURCHASING DIGITAL PRODUCTS",
  "DIGITAL PRODUCTS",
  "PRODUK DIGITAL",
  "BUY AGAIN",
  "BELI LAGI",
  "PAYMENT INFO",
  "INFO PEMBAYARAN",
  "SERIAL NUMBER",
  "NOMOR SERIAL",
  "ORDER ID",
  "NO. PESANAN",
  "NOMOR PESANAN",
  "PHONE NUMBER",
  "NOMOR TELEPON",
  "NOMOR HP",
  "NO. HP",
  "NO HP",
  "ALAMAT PENGIRIMAN",
  "ALAMAT PENERIMA",
  "HUBUNGI PENJUAL",
  "CUSTOMER SERVICE",
  "CUSTOMER SERVICE PRIORITAS",
  "BATALKAN PESANAN",
  "LIHAT LEBIH SEDIKIT",
  "BUTUH BANTUAN",
  "DENGAN VIP",
  "KAMU SUDAH HEMAT",
  "WAKTU PEMESANAN",
  "WAKTU PEMBAYARAN",
  "KONVERSI TRANSAKSI",
];

const CELLULAR_PROVIDERS: { pattern: RegExp; name: string }[] = [
  { pattern: /\b(?:THREE|TRI)\b/i, name: "Three" },
  { pattern: /\b(?:TELKOMSEL|SIMPATI|KARTU\s*AS|BY\.?U)\b/i, name: "Telkomsel" },
  { pattern: /\b(?:INDOSAT|IM3|OOREDOO)\b/i, name: "Indosat" },
  { pattern: /\b(?:XL\s*AXIATA|\bXL\b)\b/i, name: "XL" },
  { pattern: /\b(?:AXIS)\b/i, name: "Axis" },
  { pattern: /\b(?:SMARTFREN)\b/i, name: "Smartfren" },
];

function cleanRecipientCandidate(raw: string): string {
  let cleaned = raw.replace(/^[®@©\*\-><~•|#_:\(\)\[\]\{\}\s]+/, "").trim();
  // Strip leading digit artifact e.g. "3 Ariman Tri Bawono" -> "Ariman Tri Bawono"
  cleaned = cleaned.replace(/^\d+\s+(?=[a-zA-Z])/i, "").trim();
  // Strip leading 1-2 letter avatar noise e.g. "e Ariman", "oy Muhammad"
  cleaned = cleaned
    .replace(/^(?!(?:PT|CV|UD)\b)[a-z]{1,2}\s+(?=[a-zA-Z]{2,})/i, (match) => {
      if (/^(?:PT|CV|UD)$/i.test(match.trim())) return match;
      return "";
    })
    .trim();
  return cleaned;
}

function cleanProductCandidate(raw: string): string {
  let cleaned = raw.replace(/^[®@©\*\-><~•|#_:\(\)\[\]\{\}\s/]+/, "").trim();
  // Strip leading 1-2 letter thumbnail noise (e.g. "Ea Telur Ayam" -> "Telur Ayam")
  cleaned = cleaned
    .replace(/^(?!(?:ES|MI|PT|CV|UD)\b)[a-z]{1,2}\s+(?=[a-zA-Z]{2,})/i, "")
    .trim();
  return cleaned;
}

function isProductItemFollower(line: NormalizedLine | undefined): boolean {
  if (!line) return false;
  const text = line.normalized.trim();
  // Quantity patterns: "1kg x5", "x5", "x 1", "2 pcs", "Qty: 1", "500gr x 2"
  if (
    /\b(?:x\s*\d+|\d+\s*x\b|\d+\s*(?:kg|gr|g|ml|l|pcs|buah|btl|box|paket)\s*x\s*\d+|\bqty\b)/i.test(
      text
    )
  ) {
    return true;
  }
  // Price line: "Rp30.000", "Rp 25.000"
  if (/^(?:Rp|IDR)\s*[\d\.,]+$/i.test(text)) {
    return true;
  }
  return false;
}

export function extractName(
  lines: NormalizedLine[],
  docType: DocumentType
): Field<string> {
  // Strategy 0: Pulsa / Paket Data / Cellular digital products
  const fullText = lines.map((l) => l.upper).join(" ");
  const hasPhoneContext =
    /\b(PHONE\s*NUMBER|NOMOR\s*(?:HP|HANDPHONE|TELEPON|TELP|PONSEL)|NO\.?\s*(?:HP|TELEPON|TELP)|MSISDN)\b/i.test(
      fullText
    ) || /\b08[1-9]\d{7,10}\b/.test(fullText);
  const hasDigitalContext =
    /\b(PULSA|PAKET\s*DATA|DATA\s*PACKAGE|PRODUK\s*DIGITAL|DIGITAL\s*PRODUCTS?|ISI\s*ULANG|TOP\s*UP)\b/i.test(
      fullText
    );

  // Even / round nominal pattern (e.g. 5.000, 10.000, 25.000, 50.000, 100.000, 10k, 25rb)
  const ROUND_PULSA_DENOM_REGEX = /\b(?:[1-9]\d{0,2}(?:\.000|\s*000|k|rb)|1\.000\.000)\b/i;

  for (const line of lines) {
    if (!line) continue;
    const upper = line.upper;
    // Skip generic informational/banner lines
    if (
      upper.includes("THANK YOU") ||
      upper.includes("PURCHASING") ||
      upper.includes("DIGITAL PRODUCTS") ||
      upper.includes("PRODUK DIGITAL")
    ) {
      continue;
    }

    for (const provider of CELLULAR_PROVIDERS) {
      if (provider.pattern.test(upper)) {
        const hasRoundDenom = ROUND_PULSA_DENOM_REGEX.test(upper);
        const hasPulsaWord = /\b(PULSA|PAKET|DATA|QUOTA|KUOTA)\b/i.test(upper);

        if (hasPhoneContext || hasDigitalContext || hasRoundDenom || hasPulsaWord) {
          const isData = /\b(DATA|PAKET|QUOTA|KUOTA)\b/i.test(upper);
          const finalName = isData
            ? `Pembayaran paket data ${provider.name}`
            : `Pembayaran pulsa ${provider.name}`;

          return {
            value: finalName,
            confidence: 0.95,
            rule: `digital_pulsa:${provider.name.toLowerCase()}`,
          };
        }
      }
    }
  }

  // Strategy 0.5: Marketplace / E-commerce Order Detail (Shopee, Tokopedia, etc.)
  const hasMarketplaceContext =
    (/\b(?:ALAMAT\s*PENGIRIMAN|HUBUNGI\s*PENJUAL|TOTAL\s*PESANAN|BATALKAN\s*PESANAN)\b/i.test(
      fullText
    ) ||
      (/\b(?:RINCIAN\s*PESANAN|DETAIL\s*PESANAN)\b/i.test(fullText) &&
        /\b(?:PENGIRIMAN|KURIR|ONGKIR|LACAK|PENJUAL)\b/i.test(fullText))) &&
    !/\b(?:DINE-IN|DINE\s*IN|TAKE\s*AWAY|TAKEAWAY|MEJA|PB1)\b/i.test(fullText);

  if (hasMarketplaceContext) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const upper = line.upper;

      // Skip generic/order meta lines or address/phone lines
      if (
        GENERIC_KEYWORDS.some((kw) => upper.includes(kw)) ||
        ADDRESS_PHONE_REGEX.test(upper) ||
        /\d{9,}/.test(line.normalized)
      ) {
        continue;
      }

      // Check if next line is an item follower (quantity or unit price)
      const nextLine = lines[i + 1];
      if (isProductItemFollower(nextLine)) {
        const cleaned = cleanProductCandidate(line.normalized);
        if (
          cleaned.length >= 3 &&
          !GENERIC_KEYWORDS.some((kw) => cleaned.toUpperCase().includes(kw)) &&
          !ADDRESS_PHONE_REGEX.test(cleaned)
        ) {
          const letterChars = cleaned.match(/[a-zA-Z]/g) || [];
          if (letterChars.length >= 3 && letterChars.length / cleaned.length >= 0.4) {
            return {
              value: toTitleCase(cleaned).slice(0, 60),
              confidence: 0.95,
              rule: "marketplace_order_item",
            };
          }
        }
      }
    }
  }
  // Strategy 1: Explicit recipient / beneficiary labels (E-wallet, Bank Transfer, or Labeled receipts)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    for (const label of EWALLET_NAME_LABELS) {
      const regex = new RegExp(
        `^(?:[®@©\\*\\-><~•|#_:\\(\\)\\[\\]\\{\\}\\/\\d\\s]*)(?:PAYMENT DETAILS\\s+)?(?:\\b${label}\\b|${label})(?:\\s*[:\\-]\\s*|\\s+|$)(.*)$`,
        "i"
      );
      const match = line.normalized.match(regex);
      if (match) {
        let nameCandidate = cleanRecipientCandidate(match[1]?.trim() || "");

        // If empty, or purely digits (e.g. account number), search next non-empty line
        if (!nameCandidate || /^\d[\d\s\-]*$/.test(nameCandidate)) {
          let nextIdx = i + 1;
          while (nextIdx < lines.length && !lines[nextIdx]?.normalized.trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextCandidate = cleanRecipientCandidate(lines[nextIdx]?.normalized || "");
            if (nextCandidate && /[a-zA-Z]/.test(nextCandidate)) {
              nameCandidate = nextCandidate;
            }
          }
        }

        if (
          nameCandidate &&
          nameCandidate.length >= 2 &&
          !GENERIC_KEYWORDS.some((kw) => nameCandidate.toUpperCase().includes(kw))
        ) {
          let finalName = toTitleCase(nameCandidate);
          const lowerFinal = finalName.toLowerCase();
          const hasResiOrTransfer = lines.some((l) =>
            /\b(RESI|BUKTI|TRANSFER)\b/i.test(l.normalized)
          );
          if (label === "DITRANSFER KE" && !lowerFinal.startsWith("ditransfer ke")) {
            finalName = `Ditransfer ke ${finalName}`;
          } else if (
            (docType === "bank_transfer" ||
              hasResiOrTransfer ||
              label === "TO" ||
              label === "TRANSFER TO" ||
              label === "PENERIMA") &&
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

  // Strategy 2: Receipt (Top 1–8 lines)
  const topLines = lines.slice(0, Math.min(8, lines.length));
  for (let i = 0; i < topLines.length; i++) {
    const line = topLines[i];
    if (!line) continue;
    let norm = line.normalized.trim();
    const upper = line.upper;

    // Strip leading decoration/app noise: e.g. "Hb ", "< ", "> ", "@", "®"
    norm = norm.replace(/^(?:Hb|<|>|[\[\(]\w+[\]\)]|[®@©\*\-><~•|#_:\(\)\[\]\{\}\/]+)\s*/i, "").trim();

    // Must have length >= 3
    if (norm.length < 3) continue;

    // Filter out short icon/status bar noise lines (e.g. "x Dr") where words are tiny and not a known merchant
    const words = norm.split(/\s+/).filter(Boolean);
    const letterChars = norm.match(/[a-zA-Z]/g) || [];
    const isKnown = KNOWN_MERCHANTS.some((m) => upper.includes(m));
    if (!isKnown && (letterChars.length < 4 || words.every((w) => w.length <= 2))) {
      continue;
    }

    // Check consecutive digits >= 9 (phone / tax / receipt numbers)
    if (/\d{9,}/.test(norm)) continue;

    // Check letter ratio >= 0.5 (handles store codes like "SPBU 34-12345")
    const letterCount = letterChars.length;
    if (letterCount / norm.length < 0.5) continue;

    // Must NOT be address or phone keywords (unless known merchant matched)
    if (!isKnown && ADDRESS_PHONE_REGEX.test(norm)) continue;

    // Must NOT contain generic receipt / app keywords
    const isGeneric = GENERIC_KEYWORDS.some((kw) => upper.includes(kw));
    if (isGeneric) continue;

    // Strip order-type suffixes like "Dine-In ft TA6"
    norm = norm.replace(/\s+(?:Dine-In|Take Away|Takeaway|ft\s+\w+).*$/i, "").trim();

    let finalName = toTitleCase(norm).slice(0, 60);
    const hasResiOrTransfer = lines.some((l) =>
      /\b(RESI|BUKTI|TRANSFER)\b/i.test(l.normalized)
    );
    if (
      docType !== "receipt" &&
      (docType === "bank_transfer" || hasResiOrTransfer) &&
      !finalName.toLowerCase().startsWith("transfer ke") &&
      !finalName.toLowerCase().startsWith("ditransfer ke")
    ) {
      finalName = `Transfer ke ${finalName}`;
    }

    return {
      value: finalName,
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
    .replace(/\bDari\b/g, "dari")
    .replace(/\bKg\b/g, "kg")
    .replace(/\bGr\b/g, "gr")
    .replace(/\bMl\b/g, "ml")
    .replace(/\bPcs\b/g, "pcs");
}

