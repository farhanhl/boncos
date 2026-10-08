import "server-only";
import https from "node:https";
import dns from "node:dns";
import { userCol } from "./firebase/admin";
import { decryptText } from "./crypto";
import { formatRupiah } from "./money";
import { getCategoryById } from "./categories";

export interface ExpenseNotificationData {
  name: string;
  amount: number;
  expense_date: string;
  category_id: string | null;
  source: "manual" | "scan";
}

export interface TelegramSettingsDoc {
  enabled: boolean;
  chat_id: string;
  bot_token_enc: string;
  bot_token_hint: string;
  updated_at?: unknown;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Official Telegram Bot API IP address used as a resilient fallback
 * when local ISPs or DNS providers sinkhole api.telegram.org to 0.0.0.0 / ::
 */
const TELEGRAM_OFFICIAL_IP = "149.154.167.220";

function resilientTelegramLookup(
  hostname: string,
  options: unknown,
  callback: (
    err: NodeJS.ErrnoException | null,
    address: string | dns.LookupAddress[],
    family?: number
  ) => void
) {
  const isAll = Boolean(options && typeof options === "object" && (options as { all?: boolean }).all);

  if (hostname === "api.telegram.org") {
    dns.lookup(hostname, { family: 4 }, (err, address, family) => {
      // If DNS resolves to a valid non-sinkholed IP, use it
      if (!err && address && address !== "0.0.0.0" && address !== "127.0.0.1") {
        if (isAll) {
          return callback(null, [{ address, family: family || 4 }]);
        }
        return callback(null, address, family || 4);
      }
      // Otherwise gracefully fall back to Telegram official IP
      if (isAll) {
        return callback(null, [{ address: TELEGRAM_OFFICIAL_IP, family: 4 }]);
      }
      return callback(null, TELEGRAM_OFFICIAL_IP, 4);
    });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dns.lookup as any)(hostname, options, callback);
}

/**
 * Resilient request sender to Telegram Bot API.
 * Supports custom base proxy via TELEGRAM_API_BASE and built-in DNS sinkhole bypass.
 */
async function callTelegramApi(
  path: string,
  method: "GET" | "POST",
  payload?: Record<string, unknown>
): Promise<{ ok: boolean; status?: number; description?: string; result?: unknown }> {
  const customBase = process.env.TELEGRAM_API_BASE;
  if (customBase) {
    try {
      const url = new URL(path, customBase);
      const res = await fetch(url.toString(), {
        method,
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(10000),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as {
        ok?: boolean;
        description?: string;
        result?: unknown;
      };
      return {
        ok: data.ok ?? false,
        status: res.status,
        description: data.description,
        result: data.result,
      };
    } catch (err) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : "Gagal terhubung ke proxy Telegram.",
      };
    }
  }

  return new Promise((resolve) => {
    const postData = payload ? JSON.stringify(payload) : null;
    const req = https.request(
      {
        hostname: "api.telegram.org",
        servername: "api.telegram.org",
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          "Host": "api.telegram.org",
          ...(postData ? { "Content-Length": Buffer.byteLength(postData) } : {}),
        },
        lookup: resilientTelegramLookup,
        timeout: 10000,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(raw);
            resolve({
              ok: parsed.ok ?? false,
              status: res.statusCode,
              description: parsed.description,
              result: parsed.result,
            });
          } catch {
            resolve({
              ok: false,
              status: res.statusCode,
              description: "Respon dari server Telegram tidak valid.",
            });
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({
        ok: false,
        description: "Waktu koneksi ke Telegram habis (timeout).",
      });
    });

    req.on("error", (err) => {
      resolve({
        ok: false,
        description: `Koneksi gagal: ${err.message}`,
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Sends an expense notification message to the user's configured Telegram channel/chat.
 * In accordance with AGENTS.md rule 11:
 * - Best-effort: failures never fail createExpense
 * - Bot token is decrypted on the fly and never logged
 * - All user text is HTML-escaped
 */
export async function sendTelegramNotificationForExpense(
  uid: string,
  data: ExpenseNotificationData
): Promise<void> {
  try {
    const settingsDoc = await userCol<TelegramSettingsDoc>(uid, "settings")
      .doc("telegram")
      .get();

    if (!settingsDoc.exists) return;
    const settings = settingsDoc.data();
    if (!settings || !settings.enabled || !settings.bot_token_enc || !settings.chat_id) {
      return;
    }

    const token = decryptText(settings.bot_token_enc);
    const categoryInfo = getCategoryById(data.category_id);
    const sourceLabel = data.source === "scan" ? "Scan struk" : "Manual";

    const messageHtml = [
      "💸 <b>Pengeluaran baru</b>",
      `Nama: ${escapeHtml(data.name)}`,
      `Nominal: ${escapeHtml(formatRupiah(data.amount))}`,
      `Tanggal: ${escapeHtml(data.expense_date)}`,
      `Kategori: ${escapeHtml(categoryInfo.name)}`,
      `Sumber: ${sourceLabel}`,
    ].join("\n");

    await sendTelegramMessage(token, settings.chat_id, messageHtml);
  } catch {
    // Best effort catch: never rethrow or log sensitive credentials
  }
}

/**
 * Sends a raw HTML message via Telegram Bot API with 429 retry support.
 */
async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  htmlText: string
): Promise<{ ok: boolean; description?: string }> {
  const path = `/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: htmlText,
    parse_mode: "HTML",
  };

  let res = await callTelegramApi(path, "POST", payload);

  // Handle HTTP 429 Rate Limit with retry
  if (res.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    res = await callTelegramApi(path, "POST", payload);
  }

  return { ok: res.ok, description: res.description };
}

/**
 * Verifies a bot token and attempts to send a test message.
 */
export async function testTelegramBot(
  botToken: string,
  chatId: string
): Promise<{ ok: boolean; message: string }> {
  try {
    // 1. Verify token with getMe
    const meRes = await callTelegramApi(`/bot${botToken}/getMe`, "GET");

    if (!meRes.ok) {
      const desc = (meRes.description || "").toLowerCase();
      if (desc.includes("unauthorized") || meRes.status === 401) {
        return {
          ok: false,
          message: "Token bot tidak valid. Silakan periksa kembali token dari @BotFather.",
        };
      }
      return {
        ok: false,
        message: meRes.description || "Token bot tidak valid atau tidak ditemukan.",
      };
    }

    // 2. Send test message
    const testText = "👋 <b>Pesan tes dari Boncos</b>\nKoneksi bot Telegram berhasil!";
    const sendRes = await sendTelegramMessage(botToken, chatId, testText);

    if (!sendRes.ok) {
      const desc = (sendRes.description || "").toLowerCase();
      if (desc.includes("chat not found")) {
        return {
          ok: false,
          message: "Channel atau Chat ID tidak ditemukan. Pastikan bot sudah dimasukkan ke channel.",
        };
      }
      if (
        desc.includes("not enough rights") ||
        desc.includes("have no rights") ||
        desc.includes("admin")
      ) {
        return {
          ok: false,
          message: "Bot belum menjadi admin channel dengan izin mengirim pesan.",
        };
      }
      return {
        ok: false,
        message: `Pesan tes gagal: ${sendRes.description || "Periksa Chat ID dan hak akses bot."}`,
      };
    }

    return {
      ok: true,
      message: "Pesan tes terkirim! Silakan cek channel atau chat Telegram kamu.",
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Gagal menghubungi server Telegram.",
    };
  }
}

