import { NextResponse } from "next/server";
import path from "node:path";
import { createWorker } from "tesseract.js";
import { FieldValue } from "firebase-admin/firestore";
import { userCol } from "@/lib/firebase/admin";
import { getUidByIngestionKey } from "@/actions/ingestion";
import { parseReceiptText, isExpenseDocument } from "@/lib/extract/parse";
import { normalizeOcrText } from "@/lib/extract/parse/normalize";
import { sendTelegramScanResult } from "@/lib/telegram";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { withTimeout, TimeoutError } from "@/lib/timeout";
import { isGeminiExtractionEnabled, extractReceiptWithGemini } from "@/lib/extract/gemini";
import type { ExtractionResult } from "@/lib/extract/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

async function reportScanFailure(
  uid: string,
  failReason: string,
  imageBuffer: Buffer | null
): Promise<string | null> {
  let uploadedUrl: string | null = null;
  if (imageBuffer && imageBuffer.length > 0) {
    uploadedUrl = await uploadToCloudinary(imageBuffer);
  }
  await sendTelegramScanResult(uid, {
    success: false,
    errorReason: failReason,
    imageUrl: uploadedUrl,
  });
  return uploadedUrl;
}

async function runTesseractOcrAndParse(imageBuffer: Buffer): Promise<{
  parsed: ExtractionResult;
  ocrText: string;
}> {
  const workerPath = path.resolve(
    process.cwd(),
    "node_modules/tesseract.js/src/worker-script/node/index.js"
  );

  const worker = await createWorker(["ind", "eng"], 1, {
    workerPath,
    langPath: path.resolve(process.cwd(), "public/tesseract"),
    cachePath: path.resolve(process.cwd(), "public/tesseract"),
  });

  let processedBuffer = imageBuffer;
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(imageBuffer).metadata();
    const targetWidth = Math.max(meta.width || 0, 2000);
    processedBuffer = await sharp(imageBuffer)
      .trim()
      .resize({ width: targetWidth, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .toBuffer();
  } catch {
    // Fallback to original imageBuffer
  }

  const { data } = await worker.recognize(processedBuffer);
  const ocrText = data.text || "";
  const ocrConfidence =
    typeof data.confidence === "number" ? data.confidence / 100 : 0.8;
  await worker.terminate();

  const parsed = parseReceiptText(ocrText, ocrConfidence);
  return { parsed, ocrText };
}

export async function POST(request: Request) {
  let uid: string | null = null;
  let imageBuffer: Buffer | null = null;
  let mimeType = "image/jpeg";

  try {
    return await withTimeout(
      (async () => {
    const contentType = request.headers.get("content-type") || "";
    let key =
      request.headers.get("x-boncos-key") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const formKey = formData.get("key") || formData.get("token") || formData.get("code");
      if (typeof formKey === "string" && formKey.trim()) {
        key = formKey.trim();
      }

      const file = formData.get("file") || formData.get("image");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const fileObj = file as File;
        const arrayBuffer = await fileObj.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        if (fileObj.type) {
          mimeType = fileObj.type;
        }
      }
    } else if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      if (body.key || body.token || body.code) {
        key = String(body.key || body.token || body.code).trim();
      }

      const rawBase64 = body.image || body.file;
      if (typeof rawBase64 === "string" && rawBase64.trim()) {
        const dataUriMatch = rawBase64.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,/);
        if (dataUriMatch && dataUriMatch[1]) {
          mimeType = dataUriMatch[1];
        }
        const base64Data = rawBase64.replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, "");
        imageBuffer = Buffer.from(base64Data, "base64");
      }
    }

    // 1. Validasi Kode Unik / Key
    if (!key) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAUTHORIZED",
          message: "Kode unik (key) wajib disertakan melalui form-data, json body, atau header X-Boncos-Key.",
        },
        { status: 401 }
      );
    }

    uid = await getUidByIngestionKey(key);
    if (!uid) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_KEY",
          message: "Kode unik tidak valid atau tidak terdaftar.",
        },
        { status: 401 }
      );
    }

    // 2. Validasi Buffer Gambar
    if (!imageBuffer || imageBuffer.length === 0) {
      const failReason = "File gambar struk tidak ditemukan atau kosong.";
      await sendTelegramScanResult(uid, {
        success: false,
        errorReason: failReason,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "NO_IMAGE",
          message: `Pencatatan gagal karena: ${failReason}`,
        },
        { status: 400 }
      );
    }

    if (imageBuffer.length > 10 * 1024 * 1024) {
      const failReason = "Ukuran gambar melebihi batas maksimal (10MB).";
      await sendTelegramScanResult(uid, {
        success: false,
        errorReason: failReason,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "FILE_TOO_LARGE",
          message: `Pencatatan gagal karena: ${failReason}`,
        },
        { status: 400 }
      );
    }

    // 3. Ekstraksi Dokumen: Gemini AI atau Tesseract OCR berdasarkan ENV
    let parsed: ExtractionResult;
    let ocrText = "";

    if (isGeminiExtractionEnabled()) {
      try {
        parsed = await extractReceiptWithGemini(
          imageBuffer,
          mimeType
        );
        ocrText = parsed.raw_text;
      } catch (geminiErr) {
        console.warn(
          "[POST /api/scan] Ekstraksi Gemini AI gagal, beralih ke OCR:",
          geminiErr
        );
        try {
          const ocrRes = await runTesseractOcrAndParse(imageBuffer);
          parsed = ocrRes.parsed;
          ocrText = ocrRes.ocrText;
        } catch (ocrErr) {
          console.error("[POST /api/scan OCR Error]:", ocrErr);
          const failReason = "Mesin OCR gagal membaca gambar struk.";
          const uploadedUrl = await reportScanFailure(uid, failReason, imageBuffer);

          return NextResponse.json(
            {
              ok: false,
              error: "OCR_ERROR",
              message: `Pencatatan gagal karena: ${failReason}`,
              image_url: uploadedUrl,
            },
            { status: 422 }
          );
        }
      }
    } else {
      try {
        const ocrRes = await runTesseractOcrAndParse(imageBuffer);
        parsed = ocrRes.parsed;
        ocrText = ocrRes.ocrText;
      } catch (ocrErr) {
        console.error("[POST /api/scan OCR Error]:", ocrErr);
        const failReason = "Mesin OCR gagal membaca gambar struk.";
        const uploadedUrl = await reportScanFailure(uid, failReason, imageBuffer);

        return NextResponse.json(
          {
            ok: false,
            error: "OCR_ERROR",
            message: `Pencatatan gagal karena: ${failReason}`,
            image_url: uploadedUrl,
          },
          { status: 422 }
        );
      }
    }

    // 4. Validasi Dokumen Pengeluaran
    const isAiMode = parsed.name.rule === "ai" || parsed.name.rule === "gemini_ai";
    if (!isAiMode) {
      const lines = normalizeOcrText(ocrText);
      const isValidExpense = isExpenseDocument(lines, parsed.doc_type, parsed);

      if (!isValidExpense) {
        const failReason = "Foto yang diunggah bukan struk atau nota pembayaran.";
        const uploadedUrl = await reportScanFailure(uid, failReason, imageBuffer);

        return NextResponse.json(
          {
            ok: false,
            error: "NOT_AN_EXPENSE",
            message: `Pencatatan gagal karena: ${failReason}`,
            image_url: uploadedUrl,
          },
          { status: 422 }
        );
      }
    } else if (parsed.doc_type === "unknown" && !parsed.amount.value) {
      const failReason = "Foto yang diunggah bukan struk atau bukti bayar pengeluaran.";
      const uploadedUrl = await reportScanFailure(uid, failReason, imageBuffer);

      return NextResponse.json(
        {
          ok: false,
          error: "NOT_AN_EXPENSE",
          message: `Pencatatan gagal karena: ${failReason}`,
          image_url: uploadedUrl,
        },
        { status: 422 }
      );
    }

    if (parsed.extraction_confidence < 0.5) {
      const failReason = `Tingkat keyakinan hasil pembacaan struk terlalu rendah (${Math.round(parsed.extraction_confidence * 100)}% < 50%).`;
      const uploadedUrl = await reportScanFailure(uid, failReason, imageBuffer);

      return NextResponse.json(
        {
          ok: false,
          error: "LOW_CONFIDENCE",
          message: `Pencatatan gagal karena: ${failReason} Silakan foto ulang dengan lebih jelas atau catat manual.`,
          image_url: uploadedUrl,
        },
        { status: 422 }
      );
    }

    const amountVal = parsed.amount.value;

    if (!amountVal || !Number.isSafeInteger(amountVal) || amountVal <= 0) {
      const failReason =
        parsed.warnings[0] ||
        (ocrText.trim().length < 5
          ? "Gambar buram atau tidak ada teks terbaca pada struk."
          : "Nominal total belanja tidak ditemukan pada struk.");
      const uploadedUrl = await reportScanFailure(uid, failReason, imageBuffer);

      return NextResponse.json(
        {
          ok: false,
          error: "PARSE_FAILED",
          message: `Pencatatan gagal karena: ${failReason}`,
          image_url: uploadedUrl,
        },
        { status: 422 }
      );
    }

    // 5. Masukkan ke catatan pengeluaran
    const expenseDate = parsed.expense_date.value || new Date().toISOString().slice(0, 10);
    const month = expenseDate.slice(0, 7);
    const name = parsed.name.value || "Struk Belanja";
    const categoryId = parsed.category_suggestion.value || "other";

    const docRef = userCol(uid, "expenses").doc();
    const note = isAiMode
      ? `Auto-scan via AI (${parsed.doc_type})`
      : `Auto-scan via Webhook (${parsed.doc_type})`;

    const expenseData = {
      name,
      name_lower: name.toLowerCase(),
      amount: amountVal,
      currency: "IDR",
      expense_date: expenseDate,
      month,
      category_id: categoryId,
      note,
      source: "scan",
      scan_method: isAiMode ? "ai" : "ocr",
      extraction_confidence: parsed.extraction_confidence,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    await docRef.set(expenseData);

    // 6. Notifikasi Telegram Sukses (jika user mengaitkan telegram)
    await sendTelegramScanResult(uid, {
      success: true,
      method: isAiMode ? "ai" : "ocr",
      expense: {
        name,
        amount: amountVal,
        expense_date: expenseDate,
        category_id: categoryId,
      },
    });



        return NextResponse.json({
          ok: true,
          message: "Struk berhasil discan dan dicatat ke pengeluaran.",
          data: {
            id: docRef.id,
            name,
            amount: amountVal,
            expense_date: expenseDate,
            category_id: categoryId,
            confidence: parsed.extraction_confidence,
          },
        });
      })(),
      30000
    );
  } catch (err) {
    if (err instanceof TimeoutError || (err as Error)?.name === "TimeoutError") {
      if (uid) {
        await reportScanFailure(uid, "Waktu pemrosesan struk melebihi batas 30 detik.", imageBuffer);
      }

      return NextResponse.json(
        {
          ok: false,
          error: "TIMEOUT",
          message: "Pencatatan gagal karena: Waktu pemrosesan struk melebihi batas 30 detik.",
        },
        { status: 504 }
      );
    }

    if (uid) {
      await reportScanFailure(uid, "Terjadi gangguan internal pada server saat memproses struk.", imageBuffer);
    }

    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: "Pencatatan gagal karena: Terjadi kesalahan internal pada server.",
      },
      { status: 500 }
    );
  }
}
