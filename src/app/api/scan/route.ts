import { NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { FieldValue } from "firebase-admin/firestore";
import { userCol } from "@/lib/firebase/admin";
import { getUidByIngestionKey } from "@/actions/ingestion";
import { sendTelegramScanResult } from "@/lib/telegram";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { withTimeout, TimeoutError } from "@/lib/timeout";
import { checkRateLimit } from "@/lib/rate-limit";
import { findPotentialDuplicate } from "@/actions/expenses";
import { extractReceiptWithGemini, getActiveAiModel } from "@/lib/extract/gemini";
import type { ExtractionResult } from "@/lib/extract/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Optimizes an uploaded receipt image by auto-rotating EXIF,
 * constraining max dimensions to 1400x1800, and compressing to JPEG.
 * Reduces 5MB-10MB camera uploads to ~250KB-400KB, accelerating AI processing.
 */
async function optimizeImageForProcessing(
  buffer: Buffer
): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    const optimized = await sharp(buffer)
      .rotate()
      .resize({
        width: 1400,
        height: 1800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, progressive: false })
      .toBuffer();

    return { buffer: optimized, mimeType: "image/jpeg" };
  } catch {
    return { buffer, mimeType: "image/jpeg" };
  }
}

async function reportScanFailure(
  uid: string,
  failReason: string,
  imageBuffer: Buffer | null,
  model?: string
): Promise<string | null> {
  let uploadedUrl: string | null = null;
  if (imageBuffer && imageBuffer.length > 0) {
    uploadedUrl = await uploadToCloudinary(imageBuffer);
  }
  await sendTelegramScanResult(uid, {
    success: false,
    errorReason: failReason,
    imageUrl: uploadedUrl,
    method: "ai",
    model: model || getActiveAiModel(),
  });
  return uploadedUrl;
}

export async function POST(request: Request) {
  let uid: string | null = null;
  let imageBuffer: Buffer | null = null;
  let mimeType = "image/jpeg";

  try {
    return await withTimeout(
      (async () => {
    const url = new URL(request.url);
    let allowDuplicate =
      url.searchParams.get("allow_duplicate") === "true" ||
      url.searchParams.get("force") === "true";

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
      if (formData.get("allow_duplicate") === "true" || formData.get("force") === "true") {
        allowDuplicate = true;
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
      if (body.allow_duplicate === true || body.force === true) {
        allowDuplicate = true;
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

    // 2. Proteksi Rate Limiting (15 request / menit per pengguna)
    const rateCheck = checkRateLimit(`scan:${uid}`, { limit: 15, windowMs: 60_000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "RATE_LIMITED",
          message: "Terlalu banyak permintaan pemindaian struk. Silakan coba lagi dalam beberapa saat.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
            "X-RateLimit-Limit": rateCheck.limit.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 2. Validasi Buffer Gambar
    if (!imageBuffer || imageBuffer.length === 0) {
      const failReason = "File gambar struk tidak ditemukan atau kosong.";
      await sendTelegramScanResult(uid, {
        success: false,
        errorReason: failReason,
        method: "ai",
        model: getActiveAiModel(),
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
        method: "ai",
        model: getActiveAiModel(),
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

    // Optimize image dimensions and compression to accelerate AI and OCR
    const optimizedImage = await optimizeImageForProcessing(imageBuffer);
    imageBuffer = optimizedImage.buffer;
    mimeType = optimizedImage.mimeType;

    // 3. Ekstraksi Dokumen: Mode AI Murni (skipOptimization: true karena sudah dioptimasi di atas)
    let parsed!: ExtractionResult;

    try {
      parsed = await extractReceiptWithGemini(imageBuffer, mimeType, { skipOptimization: true });
    } catch (geminiErr) {
      const errMsg =
        geminiErr instanceof Error ? geminiErr.message : "Gagal memproses struk dengan AI.";
      console.error("[POST /api/scan] Ekstraksi Gemini AI gagal:", errMsg);
      const failReason = `Ekstraksi AI gagal: ${errMsg}`;
      const uploadedUrl = await reportScanFailure(uid, failReason, imageBuffer);

      return NextResponse.json(
        {
          ok: false,
          error: "AI_ERROR",
          message: `Pencatatan gagal karena: ${failReason}`,
          image_url: uploadedUrl,
        },
        { status: 422 }
      );
    }

    const modelUsed = parsed.model_used || getActiveAiModel();

    // 4. Validasi Dokumen Pengeluaran
    if (parsed.doc_type === "unknown" && !parsed.amount.value) {
      const failReason = "Foto yang diunggah bukan struk atau bukti bayar pengeluaran.";
      const uploadedUrl = await reportScanFailure(uid, failReason, imageBuffer, modelUsed);

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
      const uploadedUrl = await reportScanFailure(uid, failReason, imageBuffer, modelUsed);

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
        parsed.warnings[0] || "Nominal total belanja tidak ditemukan pada struk.";
      const uploadedUrl = await reportScanFailure(uid, failReason, imageBuffer, modelUsed);

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

    // Proteksi Duplikasi Transaksi (jika allowDuplicate !== true)
    if (!allowDuplicate) {
      const duplicate = await findPotentialDuplicate(uid, {
        name,
        amount: amountVal,
        expense_date: expenseDate,
      });

      if (duplicate) {
        const failReason = `Struk serupa "${duplicate.name}" (Rp ${duplicate.amount.toLocaleString("id-ID")}) sudah pernah dicatat sebelumnya pada tanggal ${duplicate.expense_date}.`;
        await sendTelegramScanResult(uid, {
          success: false,
          errorReason: `Terdeteksi duplikat: ${failReason}`,
          method: "ai",
          model: parsed.model_used || getActiveAiModel(),
        });

        return NextResponse.json(
          {
            ok: false,
            error: "DUPLICATE_EXPENSE",
            message: `Pencatatan dibatalkan: ${failReason}`,
            data: {
              existing_id: duplicate.id,
              name: duplicate.name,
              amount: duplicate.amount,
              expense_date: duplicate.expense_date,
            },
          },
          { status: 409 }
        );
      }
    }

    const docRef = userCol(uid, "expenses").doc();
    const note = `Auto-scan via AI (${parsed.doc_type})`;

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
      scan_method: "ai",
      extraction_confidence: parsed.extraction_confidence,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    await docRef.set(expenseData);

    try {
      revalidatePath("/dashboard");
      revalidatePath("/expenses");
    } catch {
      // Best-effort cache revalidation
    }

    // 6. Notifikasi Telegram Sukses (dijalankan di background via after() agar tidak memblokir respon)
    const targetUid = uid;
    const actualModel = parsed.model_used || getActiveAiModel();
    const isFallback = Boolean(parsed.model_used && parsed.model_used !== getActiveAiModel());
    const displayModel = isFallback ? `${parsed.model_used} (fallback)` : actualModel;
    after(async () => {
      if (!targetUid) return;
      try {
        await sendTelegramScanResult(targetUid, {
          success: true,
          method: "ai",
          model: displayModel,
          expense: {
            name,
            amount: amountVal,
            expense_date: expenseDate,
            category_id: categoryId,
          },
        });
      } catch {
        // Best effort: never throws or fails scan
      }
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
        model: actualModel,
      },
    });
  })(),
  30000
);
  } catch (err) {
    const failureUid = uid;
    if (err instanceof TimeoutError || (err as Error)?.name === "TimeoutError") {
      if (failureUid) {
        after(async () => {
          try {
            await reportScanFailure(failureUid, "Waktu pemrosesan struk melebihi batas 30 detik.", imageBuffer);
          } catch {
            // Best effort
          }
        });
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

    if (failureUid) {
      after(async () => {
        try {
          await reportScanFailure(failureUid, "Terjadi gangguan internal pada server saat memproses struk.", imageBuffer);
        } catch {
          // Best effort
        }
      });
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
