"use client";

import { useState } from "react";
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

interface ApiKeyManagerProps {
  initialKeyData: IngestionKeyData | null;
  telegramEnabled: boolean;
}

export function ApiKeyManager({
  initialKeyData,
  telegramEnabled,
}: ApiKeyManagerProps) {
  const [key, setKey] = useState<string>(initialKeyData?.key || "");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleCopy = async () => {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const curlExample = `curl -X POST http://localhost:3000/api/scan \\
  -F "key=${key || "KODE_UNIK_KAMU"}" \\
  -F "image=@struk_belanja.jpg"`;

  return (
    <div className="space-y-6 w-full">
      {/* Alert status integrasi Telegram */}
      <div
        className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard flex items-start gap-4"
      >
        <PiTelegramLogoBold
          className={`text-2xl shrink-0 mt-0.5 ${telegramEnabled ? "text-cendol" : "text-kuning"
            }`}
        />
        <div className="text-xs leading-relaxed">
          <p
            className={`font-bold text-sm mb-0.5 ${telegramEnabled ? "text-cendol" : "text-kuning"
              }`}
          >
            {telegramEnabled
              ? "Notifikasi Telegram Terhubung 🚀"
              : "Notifikasi Telegram Belum Terhubung"}
          </p>
          <span className="text-tinta-pudar">
            {telegramEnabled
              ? "Setiap struk yang dikirim via endpoint akan otomatis dilaporkan ke Telegram kamu (sukses beserta rincian, atau alasan jika gagal)."
              : "Untuk mendapatkan notifikasi real-time saat struk discan dari endpoint ini, kamu bisa mengaktifkan bot Telegram di tab 'Notifikasi Telegram'."}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-md border-2 font-bold text-sm shadow-hard-sm ${feedback.type === "success"
            ? "bg-cendol/20 border-cendol text-tinta"
            : "bg-stempel/10 border-stempel text-stempel"
            }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Kartu Kode Unik */}
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-tinta/30">
          <div className="flex items-center gap-2">
            <PiKeyBold className="text-2xl text-kuning" />
            <h2 className="font-display text-2xl text-tinta">
              Kode Unik Pengguna
            </h2>
          </div>
          <span className="bg-kuning text-karbon text-xs font-bold px-2 py-0.5 rounded border-2 border-tinta">
            Rahasia
          </span>
        </div>

        <p className="text-xs text-tinta-pudar">
          Gunakan kode unik ini untuk mengirim struk via endpoint tanpa perlu login.
          Hanya kamu yang memiliki kode ini. Jangan bagikan kepada siapa pun.
        </p>

        {/* Display Key */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="flex-1 bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta font-mono text-sm tracking-wide flex items-center justify-between">
            <span className="truncate">
              {showKey ? key : key ? `${key.slice(0, 7)}${"•".repeat(18)}` : "Memuat..."}
            </span>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-tinta-pudar hover:text-tinta p-1 ml-2 transition-colors cursor-pointer"
              title={showKey ? "Sembunyikan kode" : "Tampilkan kode"}
            >
              {showKey ? <PiEyeSlashBold className="text-lg" /> : <PiEyeBold className="text-lg" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 min-h-11 bg-kuning text-karbon font-bold border-2 border-tinta rounded-md shadow-hard hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm cursor-pointer"
            >
              {copied ? (
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
              className="flex items-center justify-center gap-1.5 px-3 min-h-11 bg-kertas text-tinta font-bold border-2 border-tinta rounded-md shadow-hard hover:bg-tinta/10 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm cursor-pointer disabled:opacity-50"
              title="Buat kode baru"
            >
              <PiArrowsClockwiseBold className={`text-base ${regenerating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Petunjuk Penggunaan Endpoint */}
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b-2 border-dashed border-tinta/30">
          <PiTerminalBold className="text-2xl text-pulpen" />
          <h2 className="font-display text-2xl text-tinta">
            Cara Penggunaan Endpoint Webhook Scan
          </h2>
        </div>

        <p className="text-xs text-tinta-pudar leading-relaxed">
          Kirim request HTTP <code className="bg-karbon text-kuning px-1.5 py-0.5 rounded border border-tinta/20">POST</code> ke endpoint <code className="bg-karbon text-kuning px-1.5 py-0.5 rounded border border-tinta/20">/api/scan</code> dengan menyertakan file gambar dan kode unik kamu. Endpoint ini tidak memerlukan session login.
        </p>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-tinta">Contoh Perintah cURL:</span>
          <div className="bg-karbon border-2 border-tinta/40 text-tinta p-4 rounded-md font-mono text-xs overflow-x-auto shadow-inner">
            <pre className="text-cendol">{curlExample}</pre>
          </div>
        </div>

        <div className="p-4 bg-karbon/80 border-2 border-tinta/30 rounded-md text-xs leading-relaxed space-y-2">
          <p className="font-bold text-sm text-kuning flex items-center gap-1.5">
            <PiInfoBold className="text-base" /> Parameter yang Didukung:
          </p>
          <ul className="list-disc list-inside space-y-1 text-tinta-pudar ml-1">
            <li>
              <code className="text-tinta font-bold">key</code> (Form-data / JSON) atau header <code className="text-tinta font-bold">X-Boncos-Key</code>: Kode unik rahasia kamu.
            </li>
            <li>
              <code className="text-tinta font-bold">image</code> atau <code className="text-tinta font-bold">file</code>: Berkas gambar struk (JPEG, PNG, WebP maksimal 10MB) atau string base64 pada JSON.
            </li>
          </ul>
        </div>

        <div className="border-t-2 border-dashed border-tinta/30 pt-4 text-xs text-tinta-pudar space-y-1.5">
          <p className="font-bold text-tinta text-sm mb-1">Alur Otomatis:</p>
          <p>
            1. Server memproses OCR di memori secara aman tanpa menyimpan foto ke database atau disk.
          </p>
          <p>
            2. Jika nominal struk terdeteksi $\rightarrow$ dicatat ke riwayat pengeluaran & kirim rincian ke Telegram.
          </p>
          <p>
            3. Jika struk gagal terbaca $\rightarrow$ kirim notifikasi Telegram bahwa pencatatan gagal beserta alasannya.
          </p>
        </div>
      </div>
    </div>
  );
}
