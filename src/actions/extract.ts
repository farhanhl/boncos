"use server";

import { getCurrentUser } from "@/lib/firebase/session";
import { extractReceiptWithGemini } from "@/lib/extract/gemini";
import type { ExtractionResult } from "@/lib/extract/types";

/**
 * Server action for AI-based receipt extraction.
 * Processes receipt image directly using Gemini AI (OCR disabled).
 */
export async function extractReceiptAction(
  formData: FormData
): Promise<{ ok: boolean; data?: ExtractionResult; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, error: "UNAUTHORIZED" };
    }

    const apiKey = (process.env.AI_API_KEY || "").trim();
    if (!apiKey) {
      return {
        ok: false,
        error: "AI_API_KEY belum dikonfigurasi di environment server.",
      };
    }

    const file = formData.get("image") as File | null;
    if (!file) {
      return { ok: false, error: "NO_FILE" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/jpeg";

    const result = await extractReceiptWithGemini(buffer, mimeType);
    return { ok: true, data: result };
  } catch (err) {
    console.error("[extractReceiptAction Error]:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat ekstraksi AI.",
    };
  }
}
