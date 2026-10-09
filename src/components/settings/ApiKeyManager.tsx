"use client";

import { useState, useSyncExternalStore } from "react";
import {
  PiKeyBold,
  PiCopyBold,
  PiCheckBold,
  PiEyeBold,
  PiEyeSlashBold,
  PiArrowsClockwiseBold,
  PiTerminalBold,
  PiTelegramLogoBold,
  PiInfoBold,
} from "react-icons/pi";
import { regenerateUserIngestionKey, type IngestionKeyData } from "@/actions/ingestion";

const emptySubscribe = () => () => {};
const getWindowOrigin = () => (typeof window !== "undefined" ? window.location.origin : "");

interface ApiKeyManagerProps {
  initialKeyData: IngestionKeyData | null;
  telegramEnabled: boolean;
  baseUrl?: string;
}

export function ApiKeyManager({
  initialKeyData,
  telegramEnabled,
  baseUrl,
}: ApiKeyManagerProps) {
  const [key, setKey] = useState<string>(initialKeyData?.key || "");
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const clientOrigin = useSyncExternalStore(emptySubscribe, getWindowOrigin, () => "");
  const origin = clientOrigin || baseUrl || "";
  const [regenerating, setRegenerating] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const scanApiUrl = `${origin ? origin.replace(/\/$/, "") : ""}/api/scan`;

  const handleCopyKey = async () => {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyUrl = async () => {
    if (!scanApiUrl) return;
    try {
      await navigator.clipboard.writeText(scanApiUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlExample);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleRegenerate = async () => {
    const confirm = window.confirm(
      "Apakah kamu yakin ingin membuat kode unik baru? Kode yang lama tidak akan bisa digunakan lagi."
    );
    if (!confirm) return;

    setRegenerating(true);
    setFeedback(null);

    try {
      const res = await regenerateUserIngestionKey();
      if (res.ok && res.data?.key) {
        setKey(res.data.key);
        setFeedback({
          type: "success",
          text: "Kode unik berhasil diperbarui. Harap simpan kode baru ini.",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Gagal memperbarui kode unik.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Terjadi kesalahan saat memperbarui kode unik.",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const curlExample = `curl -X POST ${scanApiUrl || "http://localhost:3000/api/scan"} \\
  -F "key=${key || "KODE_UNIK_KAMU"}" \\
  -F "image=@struk_belanja.jpg"`;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Alert status integrasi Telegram */}
      <div
        className="bg-kertas border-2 border-tinta rounded-[10px] p-4 sm:p-6 shadow-hard flex items-start gap-3 sm:gap-4 max-w-full min-w-0"
      >
        <PiTelegramLogoBold
          className={`text-2xl shrink-0 mt-0.5 ${
            telegramEnabled ? "text-cendol" : "text-kuning"
          }`}
        />
        <div className="text-xs leading-relaxed min-w-0 flex-1">
          <p
            className={`font-bold text-sm mb-0.5 ${
              telegramEnabled ? "text-cendol" : "text-kuning"
            }`}
          >
            {telegramEnabled
              ? "Notifikasi Telegram Terhubung 🚀"
              : "Notifikasi Telegram Belum Terhubung"}
          </p>
          <span className="text-tinta-pudar break-words">
            {telegramEnabled
              ? "Setiap struk yang dikirim via endpoint akan otomatis dilaporkan ke Telegram kamu (sukses beserta rincian, atau alasan jika gagal)."
              : "Untuk mendapatkan notifikasi real-time saat struk discan dari endpoint ini, kamu bisa mengaktifkan bot Telegram di tab 'Notifikasi Telegram'."}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-md border-2 font-bold text-sm shadow-hard-sm max-w-full min-w-0 break-words ${
            feedback.type === "success"
              ? "bg-cendol/20 border-cendol text-tinta"
              : "bg-stempel/10 border-stempel text-stempel"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Kartu Kode Unik */}
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-4 sm:p-6 shadow-hard space-y-4 max-w-full min-w-0">
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-tinta/30 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <PiKeyBold className="text-2xl text-kuning shrink-0" />
            <h2 className="font-display text-xl sm:text-2xl text-tinta truncate">
              Kode Unik Pengguna
            </h2>
          </div>
          <span className="bg-kuning text-karbon text-xs font-bold px-2 py-0.5 rounded border-2 border-tinta shrink-0">
            Rahasia
          </span>
        </div>

        <p className="text-xs text-tinta-pudar break-words">
          Gunakan kode unik ini untuk mengirim struk via endpoint tanpa perlu login.
          Hanya kamu yang memiliki kode ini. Jangan bagikan kepada siapa pun.
        </p>

        {/* Display Key */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 w-full min-w-0">
          <div className="flex-1 min-w-0 bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta font-mono text-sm tracking-wide flex items-center justify-between gap-2 overflow-hidden">
            <span className="truncate min-w-0 select-all">
              {showKey ? key : key ? `${key.slice(0, 7)}${"•".repeat(18)}` : "Memuat..."}
            </span>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-tinta-pudar hover:text-tinta p-1 shrink-0 transition-colors cursor-pointer"
              title={showKey ? "Sembunyikan kode" : "Tampilkan kode"}
            >
              {showKey ? <PiEyeSlashBold className="text-lg" /> : <PiEyeBold className="text-lg" />}
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyKey}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 min-h-11 bg-kuning text-karbon font-bold border-2 border-tinta rounded-md shadow-hard hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm cursor-pointer"
            >
              {copiedKey ? (
                <>
                  <PiCheckBold className="text-base text-karbon" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <PiCopyBold className="text-base" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center justify-center gap-1.5 px-3 min-h-11 bg-kertas text-tinta font-bold border-2 border-tinta rounded-md shadow-hard hover:bg-tinta/10 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm cursor-pointer disabled:opacity-50 shrink-0"
              title="Buat kode baru"
            >
              <PiArrowsClockwiseBold className={`text-base ${regenerating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Petunjuk Penggunaan Endpoint */}
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-4 sm:p-6 shadow-hard space-y-4 max-w-full min-w-0">
        <div className="flex items-center gap-2 pb-3 border-b-2 border-dashed border-tinta/30">
          <PiTerminalBold className="text-2xl text-pulpen shrink-0" />
          <h2 className="font-display text-xl sm:text-2xl text-tinta break-words leading-tight">
            Cara Penggunaan Endpoint Webhook Scan
          </h2>
        </div>

        <p className="text-xs text-tinta-pudar leading-relaxed break-words">
          Kirim request HTTP <code className="bg-karbon text-kuning px-1.5 py-0.5 rounded border border-tinta/20">POST</code> ke endpoint scan di bawah dengan menyertakan file gambar struk dan kode unik kamu. Endpoint ini tidak memerlukan session login.
        </p>

        {/* URL Endpoint Scan dengan Tombol Salin */}
        <div className="space-y-1.5 pt-1 w-full min-w-0">
          <label className="text-xs font-bold text-tinta">URL Endpoint Scan:</label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full min-w-0">
            <div className="flex-1 min-w-0 bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta font-mono text-sm tracking-wide flex items-center overflow-hidden">
              <span className="truncate select-all min-w-0 w-full block">
                {scanApiUrl || "/api/scan"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center justify-center gap-1.5 px-4 min-h-11 bg-kuning text-karbon font-bold border-2 border-tinta rounded-md shadow-hard hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm cursor-pointer shrink-0"
            >
              {copiedUrl ? (
                <>
                  <PiCheckBold className="text-base text-karbon" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <PiCopyBold className="text-base" />
                  <span>Salin Endpoint</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contoh cURL */}
        <div className="space-y-1.5 pt-2 w-full min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-tinta">Contoh Perintah cURL:</span>
            <button
              type="button"
              onClick={handleCopyCurl}
              className="text-xs font-bold text-pulpen hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedCurl ? (
                <>
                  <PiCheckBold className="text-sm text-cendol" />
                  <span className="text-cendol">cURL Tersalin!</span>
                </>
              ) : (
                <>
                  <PiCopyBold className="text-sm" />
                  <span>Salin cURL</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-karbon border-2 border-tinta/40 text-tinta p-3 sm:p-4 rounded-md font-mono text-xs overflow-x-auto shadow-inner w-full max-w-full">
            <pre className="text-cendol whitespace-pre-wrap break-all">{curlExample}</pre>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-karbon/80 border-2 border-tinta/30 rounded-md text-xs leading-relaxed space-y-2 break-words max-w-full min-w-0">
          <p className="font-bold text-sm text-kuning flex items-center gap-1.5">
            <PiInfoBold className="text-base shrink-0" /> Parameter yang Didukung:
          </p>
          <ul className="list-disc list-inside space-y-1 text-tinta-pudar ml-1">
            <li className="break-all sm:break-normal">
              <code className="text-tinta font-bold">key</code> (Form-data / JSON) atau header <code className="text-tinta font-bold">X-Boncos-Key</code>: Kode unik rahasia kamu.
            </li>
            <li className="break-all sm:break-normal">
              <code className="text-tinta font-bold">image</code> atau <code className="text-tinta font-bold">file</code>: Berkas gambar struk (JPEG, PNG, WebP maksimal 10MB) atau string base64 pada JSON.
            </li>
          </ul>
        </div>

        <div className="border-t-2 border-dashed border-tinta/30 pt-4 text-xs text-tinta-pudar space-y-1.5 break-words">
          <p className="font-bold text-tinta text-sm mb-1">Alur Otomatis:</p>
          <p>
            1. Server memproses OCR di memori secara aman tanpa menyimpan foto ke database atau disk.
          </p>
          <p>
            2. Jika nominal struk terdeteksi → dicatat ke riwayat pengeluaran & kirim rincian ke Telegram.
          </p>
          <p>
            3. Jika struk gagal terbaca → kirim notifikasi Telegram bahwa pencatatan gagal beserta alasannya.
          </p>
        </div>
      </div>
    </div>
  );
}
