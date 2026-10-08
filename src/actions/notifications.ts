"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import { userCol } from "@/lib/firebase/admin";
import { encryptText, decryptText } from "@/lib/crypto";
import { testTelegramBot, type TelegramSettingsDoc } from "@/lib/telegram";

export interface TelegramSettingsClientView {
  enabled: boolean;
  chat_id: string;
  bot_token_hint: string;
}

const saveTelegramSchema = z.object({
  enabled: z.boolean(),
  chat_id: z
    .string()
    .trim()
    .refine(
      (val) => /^-?\d+$/.test(val) || /^@[A-Za-z0-9_]{5,}$/.test(val),
      "Chat ID harus berupa angka atau username channel berawalan @ (contoh: @mychannel atau -100123456789)"
    ),
  bot_token: z.string().trim().optional(),
});

export async function getTelegramSettings(): Promise<{
  ok: boolean;
  data?: TelegramSettingsClientView | null;
  message?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, message: "Silakan masuk terlebih dahulu." };
    }

    const doc = await userCol<TelegramSettingsDoc>(user.uid, "settings")
      .doc("telegram")
      .get();

    if (!doc.exists) {
      return { ok: true, data: null };
    }

    const d = doc.data();
    if (!d) return { ok: true, data: null };

    // In accordance with AGENTS.md rule 11:
    // Bot token is NEVER sent to client, only hint (last 4 chars)
    return {
      ok: true,
      data: {
        enabled: Boolean(d.enabled),
        chat_id: d.chat_id || "",
        bot_token_hint: d.bot_token_hint || "",
      },
    };
  } catch {
    return { ok: false, message: "Gagal memuat pengaturan Telegram." };
  }
}

export async function saveTelegramSettings(
  rawInput: z.infer<typeof saveTelegramSchema>
): Promise<{ ok: boolean; message: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, message: "Silakan masuk terlebih dahulu." };
    }

    const parsed = saveTelegramSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message || "Input tidak valid.",
      };
    }

    const { enabled, chat_id, bot_token } = parsed.data;
    const docRef = userCol<TelegramSettingsDoc>(user.uid, "settings").doc("telegram");
    const existingDoc = await docRef.get();
    const existing = existingDoc.data();

    let botTokenEnc = existing?.bot_token_enc || "";
    let botTokenHint = existing?.bot_token_hint || "";

    if (bot_token && bot_token.trim()) {
      const cleanToken = bot_token.trim();
      botTokenEnc = encryptText(cleanToken);
      botTokenHint = cleanToken.slice(-4);
    } else if (!botTokenEnc && enabled) {
      return {
        ok: false,
        message: "Bot token wajib diisi untuk mengaktifkan notifikasi.",
      };
    }

    await docRef.set({
      enabled,
      chat_id,
      bot_token_enc: botTokenEnc,
      bot_token_hint: botTokenHint,
      updated_at: FieldValue.serverTimestamp(),
    });

    revalidatePath("/settings/notifications");

    return { ok: true, message: "Pengaturan Telegram berhasil disimpan." };
  } catch {
    return { ok: false, message: "Gagal menyimpan pengaturan Telegram." };
  }
}

export async function sendTelegramTest(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, message: "Silakan masuk terlebih dahulu." };
    }

    const doc = await userCol<TelegramSettingsDoc>(user.uid, "settings")
      .doc("telegram")
      .get();

    if (!doc.exists) {
      return { ok: false, message: "Pengaturan Telegram belum disimpan." };
    }

    const d = doc.data();
    if (!d || !d.bot_token_enc || !d.chat_id) {
      return { ok: false, message: "Bot token atau chat ID belum lengkap." };
    }

    const token = decryptText(d.bot_token_enc);
    return await testTelegramBot(token, d.chat_id);
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menguji bot Telegram." };
  }
}

export async function deleteTelegramSettings(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, message: "Silakan masuk terlebih dahulu." };
    }

    await userCol(user.uid, "settings").doc("telegram").delete();
    revalidatePath("/settings/notifications");

    return { ok: true, message: "Pengaturan Telegram berhasil dihapus." };
  } catch {
    return { ok: false, message: "Gagal menghapus pengaturan Telegram." };
  }
}
