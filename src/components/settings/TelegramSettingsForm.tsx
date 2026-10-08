"use client";

import { useState } from "react";
import { PiInfoBold, PiPaperPlaneRightBold, PiTrashBold } from "react-icons/pi";
import {
  saveTelegramSettings,
  sendTelegramTest,
  deleteTelegramSettings,
  type TelegramSettingsClientView,
} from "@/actions/notifications";

interface TelegramSettingsFormProps {
  initialSettings: TelegramSettingsClientView | null;
}

export function TelegramSettingsForm({
  initialSettings,
}: TelegramSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialSettings?.enabled ?? false);
  const [chatId, setChatId] = useState(initialSettings?.chat_id ?? "");
  const [botToken, setBotToken] = useState("");
  const hint = initialSettings?.bot_token_hint;

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);

    try {
      const res = await saveTelegramSettings({
        enabled,
        chat_id: chatId,
        bot_token: botToken || undefined,
      });

      if (res.ok) {
        setFeedback({ type: "success", text: res.message });
        setBotToken(""); // clear plain input field
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    } catch {
      setFeedback({ type: "error", text: "Terjadi kesalahan sistem." });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setFeedback(null);
    setTesting(true);

    try {
      const res = await sendTelegramTest();
      setFeedback({
        type: res.ok ? "success" : "error",
        text: res.message,
      });
    } catch {
      setFeedback({ type: "error", text: "Gagal mengirim pesan tes." });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Hapus seluruh pengaturan bot Telegram ini?")) return;
    setDeleting(true);
    try {
      const res = await deleteTelegramSettings();
      if (res.ok) {
        setEnabled(false);
        setChatId("");
        setBotToken("");
        setFeedback({ type: "success", text: "Pengaturan telah dihapus." });
      }
    } catch {
      setFeedback({ type: "error", text: "Gagal menghapus pengaturan." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard max-w-xl mx-auto">
      {/* Title + Toggle Switch (DESIGN.md 4 & 5.8) */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-dashed border-tinta/30">
        <div>
          <h2 className="font-display text-2xl text-tinta">Kirim ke Telegram</h2>
          <p className="text-xs text-tinta-pudar mt-0.5">
            Tiap ada pengeluaran baru, bot mengirim ringkasannya ke channel kamu.
          </p>
        </div>

        {/* Custom Neobrutalist Toggle */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-7 bg-kertas border-2 border-tinta rounded-full peer peer-checked:bg-cendol transition-colors after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-tinta after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
        </label>
      </div>

      {/* Catatan Privasi (DESIGN.md 5.8) */}
      <div className="my-5 p-4 bg-karbon/80 border-2 border-tinta/30 rounded-md flex items-start gap-3 shadow-hard-sm">
        <PiInfoBold className="text-2xl text-kuning shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-tinta">
          <p className="font-bold text-sm mb-1 text-kuning">Catatan Privasi:</p>
          <span className="text-tinta-pudar">
            Data yang dikirim ke Telegram mencakup nama, nominal, tanggal, dan kategori.
            Gambar struk <b className="text-tinta font-bold">tidak pernah</b> dikirim. Bot token dienkripsi aman.
          </span>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`mb-4 p-3 rounded-md border-2 font-bold text-sm ${
            feedback.type === "success"
              ? "bg-cendol/20 border-cendol text-tinta"
              : "bg-stempel/10 border-stempel text-stempel"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Bot Token Field */}
        <div>
          <label
            htmlFor="bot-token"
            className="font-bold text-sm text-tinta mb-1.5 block"
          >
            Bot Token (dari @BotFather)
          </label>
          <input
            id="bot-token"
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder={hint ? `••••••••••••${hint}` : "123456789:ABCdefGHIjklMNO..."}
            className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
          />
          {hint && (
            <p className="text-[11px] text-tinta-pudar mt-1">
              Token tersimpan: ••••{hint} (kosongkan jika tidak ingin mengubah).
            </p>
          )}
        </div>

        {/* Channel / Chat ID */}
        <div>
          <label
            htmlFor="chat-id"
            className="font-bold text-sm text-tinta mb-1.5 block"
          >
            Channel atau Chat ID
          </label>
          <input
            id="chat-id"
            type="text"
            required={enabled}
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="@namachannel atau -100123456789"
            className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
          />
          <p className="text-[11px] text-tinta-pudar mt-1">
            Petunjuk: Bot harus dijadikan <b>admin channel</b> dengan izin kirim pesan.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-dashed border-tinta/30">
          <button
            type="submit"
            disabled={saving}
            className="bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] flex-1 cursor-pointer disabled:opacity-50"
          >
            {saving ? "Menyimpan…" : "Simpan Pengaturan"}
          </button>

          <button
            type="button"
            onClick={handleTest}
            disabled={testing || (!hint && !botToken) || !chatId}
            className="bg-kertas text-tinta font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-4 flex items-center justify-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] cursor-pointer disabled:opacity-50"
          >
            <PiPaperPlaneRightBold className="text-lg" />
            <span>{testing ? "Menguji…" : "Kirim Pesan Tes"}</span>
          </button>

          {hint && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title="Hapus Pengaturan"
              className="p-2 border-2 border-tinta rounded-md hover:bg-stempel hover:text-white transition-colors cursor-pointer"
            >
              <PiTrashBold className="text-xl" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
