import { NextResponse } from "next/server";
import path from "node:path";
import { createWorker } from "tesseract.js";
import { FieldValue } from "firebase-admin/firestore";
import { userCol } from "@/lib/firebase/admin";
import { getUidByIngestionKey } from "@/actions/ingestion";
import { parseReceiptText, isExpenseDocument } from "@/lib/extract/parse";
import { normalizeOcrText } from "@/lib/extract/parse/normalize";
import { sendTelegramScanResult } from "@/lib/telegram";
import { withTimeout, TimeoutError } from "@/lib/timeout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let uid: string | null = null;

  try {
    return await withTimeout(
      (async () => {
    const contentType = request.headers.get("content-type") || "";
    let key =
      request.headers.get("x-boncos-key") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";
    let imageBuffer: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const formKey = formData.get("key") || formData.get("token") || formData.get("code");
      if (typeof formKey === "string" && formKey.trim()) {
        key = formKey.trim();
      }

      const file = formData.get("file") || formData.get("image");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const arrayBuffer = await (file as File).arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }
    } else if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      if (body.key || body.token || body.code) {
        key = String(body.key || body.token || body.code).trim();
      }

      const rawBase64 = body.image || body.file;
      if (typeof rawBase64 === "string" && rawBase64.trim()) {
        const base64Data = rawBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
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

    // 3. Scan OCR di memori menggunakan Tesseract (WASM offline)
    // Gambar hanya diproses di RAM dan tidak disimpan ke disk / storage
    let ocrText = "";
    let ocrConfidence = 0.8;

    try {
      const workerPath = path.resolve(
        process.cwd(),
        "node_modules/tesseract.js/src/worker-script/node/index.js"
      );

      const worker = await createWorker(["ind", "eng"], 1, {
        workerPath,
        langPath: path.resolve(process.cwd(), "public/tesseract"),
        cachePath: path.resolve(process.cwd(), "public/tesseract"),
      });

      const { data } = await worker.recognize(imageBuffer);
      ocrText = data.text || "";
      ocrConfidence = typeof data.confidence === "number" ? data.confidence / 100 : 0.8;
      await worker.terminate();
    } catch (ocrErr) {
      console.error("[POST /api/scan OCR Error]:", ocrErr);
      const failReason = "Mesin OCR gagal membaca gambar struk.";
      await sendTelegramScanResult(uid, {
        success: false,
        errorReason: failReason,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "OCR_ERROR",
          message: `Pencatatan gagal karena: ${failReason}`,
        },
        { status: 422 }
      );
    }

    // 4. Ekstraksi Aturan / Rule-based Parser (Pure Function)
    const lines = normalizeOcrText(ocrText);
    const parsed = parseReceiptText(ocrText, ocrConfidence);
    const isValidExpense = isExpenseDocument(lines, parsed.doc_type, parsed);

    if (!isValidExpense) {
      const failReason = "Foto yang diunggah bukan struk atau nota pembayaran.";
      await sendTelegramScanResult(uid, {
        success: false,
        errorReason: failReason,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "NOT_AN_EXPENSE",
          message: `Pencatatan gagal karena: ${failReason}`,
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

      await sendTelegramScanResult(uid, {
        success: false,
        errorReason: failReason,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "PARSE_FAILED",
          message: `Pencatatan gagal karena: ${failReason}`,
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
    const expenseData = {
      name,
      name_lower: name.toLowerCase(),
      amount: amountVal,
      currency: "IDR",
      expense_date: expenseDate,
      month,
      category_id: categoryId,
      note: `Auto-scan via Webhook (${parsed.doc_type})`,
      source: "scan",
      extraction_confidence: parsed.extraction_confidence,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    await docRef.set(expenseData);

    // 6. Notifikasi Telegram Sukses (jika user mengaitkan telegram)
    await sendTelegramScanResult(uid, {
      success: true,
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
        await sendTelegramScanResult(uid, {
          success: false,
          errorReason: "Waktu pemrosesan struk melebihi batas 30 detik.",
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

    if (uid) {
      await sendTelegramScanResult(uid, {
        success: false,
        errorReason: "Terjadi gangguan internal pada server saat memproses struk.",
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
