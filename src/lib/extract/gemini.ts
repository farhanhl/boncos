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
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  return (mode === "ai" || mode === "gemini") && apiKey.length > 0;
}

export const isGeminiExtractionEnabled = isAiExtractionEnabled;

/**
 * Extracts receipt information from an image buffer using Google Gemini API.
 */
export async function extractReceiptWithGemini(
  imageBuffer: Buffer,
  mimeType = "image/jpeg"
): Promise<ExtractionResult> {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi di environment variable.");
  }

  const model = process.env.AI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const base64Image = imageBuffer.toString("base64");

  const prompt = `Anda adalah asisten pencatat pengeluaran keuangan berbahasa Indonesia.
Tugas Anda adalah membaca gambar bukti transaksi/struk belanja/nota/bukti transfer dan mengekstrak data penting secara akurat.

Petunjuk Ekstraksi:
1. name: Nama pengeluaran utama atau merchant/toko. Jika struk belanja minimarket/marketplace (seperti Shopee, TikTok Shop, Alfamart, Indomaret) memiliki item barang spesifik, gunakan nama item produk utama (sertakan varian/tag promo jika ada, misal: "[Buy 1 Get 1] Rexona Men Apa Ice Cool 40g [Flash Sale]" atau "Telur Ayam Negri 1 kg"). Jika transfer bank/e-wallet, sebutkan tujuannya (misal: "Transfer ke Warkop Lina").
2. amount: Nominal TOTAL belanja / Grand Total yang dibayarkan oleh pembeli. Nilai HARUS INTEGER RUPIAH penuh (contoh: jika Rp22.120 maka 22120; jika 122.000 maka 122000). Jangan gunakan subtotal atau nominal sebelum diskon.
3. expense_date: Tanggal transaksi / receipt date dalam format persis "YYYY-MM-DD". Prioritaskan tanggal pembayaran/resi/receipt date dibanding tanggal pemesanan.
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
              mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
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

  const validDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const expenseDateVal =
    parsedData.expense_date && validDateRegex.test(parsedData.expense_date)
      ? parsedData.expense_date
      : null;

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
