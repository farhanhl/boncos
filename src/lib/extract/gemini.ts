import type { ExtractionResult, CategorySlug, DocumentType } from "./types";

interface GeminiReceiptResponse {
  name?: string;
  amount?: number;
  expense_date?: string; // YYYY-MM-DD
  category_suggestion?: CategorySlug;
  doc_type?: DocumentType;
  confidence?: number;
  summary?: string;
}

const VALID_CATEGORIES: CategorySlug[] = [
  "food",
  "transport",
  "shopping",
  "bills",
  "entertainment",
  "health",
  "education",
  "transfer",
  "other",
];

const VALID_DOC_TYPES: DocumentType[] = [
  "receipt",
  "ewallet",
  "bank_transfer",
  "unknown",
];

/**
 * Checks if AI extraction mode is active and properly configured.
 * Supports EXTRACTION_MODE=ai or EXTRACTION_MODE=gemini.
 */
export function isAiExtractionEnabled(): boolean {
  const mode = (process.env.EXTRACTION_MODE || "").toLowerCase().trim();
  const apiKey = (process.env.AI_API_KEY || "").trim();
  return (mode === "ai" || mode === "gemini") && apiKey.length > 0;
}

export const isGeminiExtractionEnabled = isAiExtractionEnabled;

/**
 * Returns the configured AI model name, defaulting to "gemini-2.5-flash".
 */
export function getActiveAiModel(): string {
  return (process.env.AI_MODEL || "").trim() || "gemini-2.5-flash";
}

/**
 * Normalizes date returned by AI into YYYY-MM-DD.
 * Handles ISO (YYYY-MM-DD), DD/MM/YYYY, DD-MM-YYYY, or two-digit years (DD/MM/YY).
 */
export function normalizeExtractedDate(rawDate?: string | null): string | null {
  if (!rawDate || typeof rawDate !== "string") return null;
  const trimmed = rawDate.trim();

  // Case 1: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])$/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Case 2: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/](\d{4})$/);
  if (dmyMatch && dmyMatch[1] && dmyMatch[2] && dmyMatch[3]) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }

  // Case 3: DD-MM-YY or DD/MM/YY
  const dmyShortMatch = trimmed.match(/^(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/](\d{2})$/);
  if (dmyShortMatch && dmyShortMatch[1] && dmyShortMatch[2] && dmyShortMatch[3]) {
    const year = 2000 + parseInt(dmyShortMatch[3], 10);
    return `${year}-${dmyShortMatch[2]}-${dmyShortMatch[1]}`;
  }

  return null;
}

/**
 * Extracts receipt information from an image buffer using Google Gemini API.
 */
export async function extractReceiptWithGemini(
  imageBuffer: Buffer,
  mimeType = "image/jpeg"
): Promise<ExtractionResult> {
  const apiKey = (process.env.AI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("AI_API_KEY belum dikonfigurasi di environment variable.");
  }

  const model = getActiveAiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let processedBuffer = imageBuffer;
  let processedMime = mimeType;
  // Only run sharp if image is large (> 500KB) and needs compression
  if (imageBuffer.length > 500 * 1024) {
    try {
      const sharp = (await import("sharp")).default;
      processedBuffer = await sharp(imageBuffer)
        .rotate()
        .resize({ width: 1400, height: 1800, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: false })
        .toBuffer();
      processedMime = "image/jpeg";
    } catch {
      // Fallback to original buffer if sharp fails or for non-image buffers in tests
    }
  }

  const base64Image = processedBuffer.toString("base64");

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const currentYear = now.getFullYear();

  const prompt = `Anda adalah asisten pencatat pengeluaran keuangan berbahasa Indonesia.
Tugas Anda adalah membaca gambar bukti transaksi/struk belanja/nota/bukti transfer dan mengekstrak data penting secara akurat.

Konteks Waktu Saat Ini:
- Tanggal hari ini adalah: ${todayIso} (Tahun ${currentYear}).

Petunjuk Ekstraksi:
1. name: Nama pengeluaran utama atau merchant/toko. Jika struk belanja minimarket/marketplace (seperti Shopee, TikTok Shop, Alfamart, Indomaret) memiliki item barang spesifik, gunakan nama item produk utama (sertakan varian/tag promo jika ada, misal: "[Buy 1 Get 1] Rexona Men Apa Ice Cool 40g [Flash Sale]" atau "Telur Ayam Negri 1 kg"). Jika transfer bank/e-wallet, sebutkan tujuannya (misal: "Transfer ke Warkop Lina").
2. amount: Nominal TOTAL belanja / Grand Total yang dibayarkan oleh pembeli. Nilai HARUS INTEGER RUPIAH penuh (contoh: jika Rp22.120 maka 22120; jika 122.000 maka 122000). Jangan gunakan subtotal atau nominal sebelum diskon.
3. expense_date: Tanggal transaksi / receipt date dalam format persis "YYYY-MM-DD".
   - Perhatikan tahun transaksi dengan sangat teliti. Jika pada gambar tertera tahun ${currentYear} (atau format dua digit "26"), gunakan tahun ${currentYear}.
   - Jangan berasumsi atau mengubah tahun menjadi 2024 atau tahun masa lalu jika struk/bukti bertanggal tahun ini (${currentYear}) atau masa kini.
   - Jika pada struk hanya tertera tanggal dan bulan tanpa tahun (contoh: "27 Okt" atau "27/10"), gunakan tahun saat ini yaitu ${currentYear}.
   - Prioritaskan tanggal pembayaran/resi/receipt date dibanding tanggal pemesanan.
4. category_suggestion: Pilih salah satu dari kategori ini: "food", "transport", "shopping", "bills", "entertainment", "health", "education", "transfer", "other".
   - Makanan/minuman/bahan pangan (telur, beras, warung, resto): "food"
   - Toko/fashion/skincare/supermarket umum: "shopping"
   - Bensin/parkir/ojek online: "transport"
   - Pulsa/listrik/air/internet: "bills"
   - Transfer sesama rekening/keluarga: "transfer"
5. doc_type: "receipt" | "ewallet" | "bank_transfer" | "unknown".
6. confidence: Nilai keyakinan Anda antara 0.0 sampai 1.0 (misal 0.95).

Kembalikan jawaban HANYA dalam format JSON valid sesuai schema.`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: processedMime,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      responseSchema: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nama pengeluaran/item/merchant" },
          amount: { type: "INTEGER", description: "Total nominal Rupiah (integer penuh)" },
          expense_date: {
            type: "STRING",
            description: `Tanggal transaksi dalam format YYYY-MM-DD. Perhatikan tahun dengan benar (gunakan tahun yang tertera atau tahun saat ini ${currentYear} jika tanpa tahun).`,
          },
          category_suggestion: {
            type: "STRING",
            enum: ["food", "transport", "shopping", "bills", "entertainment", "health", "education", "transfer", "other"],
          },
          doc_type: {
            type: "STRING",
            enum: ["receipt", "ewallet", "bank_transfer", "unknown"],
          },
          confidence: { type: "NUMBER", description: "Keyakinan 0.0 - 1.0" },
          summary: { type: "STRING", description: "Ringkasan singkat transaksi" },
        },
        required: ["name", "amount"],
      },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Gemini API request failed with status ${response.status}: ${errorBody.slice(0, 200)}`
    );
  }

  const jsonResponse = await response.json();
  const rawText =
    jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  let parsedData: GeminiReceiptResponse;
  try {
    parsedData = JSON.parse(rawText);
  } catch (parseErr) {
    throw new Error(`Gagal mem-parsing respon JSON dari Gemini: ${parseErr}`);
  }

  // Validate and sanitize extracted fields
  const amountVal =
    typeof parsedData.amount === "number" && Number.isFinite(parsedData.amount)
      ? Math.round(parsedData.amount)
      : null;

  const expenseDateVal = normalizeExtractedDate(parsedData.expense_date);

  const categorySuggestionVal: CategorySlug =
    parsedData.category_suggestion &&
      VALID_CATEGORIES.includes(parsedData.category_suggestion)
      ? parsedData.category_suggestion
      : "other";

  const docTypeVal: DocumentType =
    parsedData.doc_type && VALID_DOC_TYPES.includes(parsedData.doc_type)
      ? parsedData.doc_type
      : "receipt";

  const confidence =
    typeof parsedData.confidence === "number" &&
      parsedData.confidence >= 0 &&
      parsedData.confidence <= 1
      ? parsedData.confidence
      : 0.95;

  const nameVal = parsedData.name?.trim() || null;

  // Determine extraction status
  let status: "ok" | "partial" | "empty" = "ok";
  if (!nameVal && !amountVal && !expenseDateVal) {
    status = "empty";
  } else if (!nameVal || !amountVal || !expenseDateVal) {
    status = "partial";
  }

  // Calculate composite extraction confidence: 0.6*amount + 0.2*date + 0.2*name
  const amountScore = amountVal !== null ? confidence : 0;
  const dateScore = expenseDateVal !== null ? confidence : 0;
  const nameScore = nameVal !== null ? confidence : 0;
  const compositeConfidence = Math.min(
    1,
    Math.round((0.6 * amountScore + 0.2 * dateScore + 0.2 * nameScore) * 100) / 100
  );

  return {
    status,
    doc_type: docTypeVal,
    name: {
      value: nameVal,
      confidence: nameVal ? confidence : 0,
      rule: "ai",
    },
    amount: {
      value: amountVal,
      confidence: amountVal ? confidence : 0,
      rule: "ai",
    },
    expense_date: {
      value: expenseDateVal,
      confidence: expenseDateVal ? confidence : 0,
      rule: "ai",
    },
    category_suggestion: {
      value: categorySuggestionVal,
      confidence: 0.9,
      rule: "ai",
    },
    extraction_confidence: compositeConfidence,
    ocr_confidence: 0.98,
    warnings: [],
    raw_text: parsedData.summary || `[AI Extraction] ${nameVal || ""} - ${amountVal || ""}`,
  };

}
