"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DEFAULT_CATEGORY_LIST } from "@/lib/categories";
import { parseRupiahInput } from "@/lib/money";
import { createExpense } from "@/actions/expenses";
import type { ExtractionResult } from "@/lib/extract/types";

interface ReviewFormProps {
  extraction: ExtractionResult;
  imageFile: File;
  onCancel: () => void;
}

export function ReviewForm({
  extraction,
  imageFile,
  onCancel,
}: ReviewFormProps) {
  const router = useRouter();

  // Local object URL for client-only preview (never uploaded)
  const previewUrl = useMemo(() => {
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const [isZoomed, setIsZoomed] = useState(false);

  const [name, setName] = useState(extraction.name.value || "");
  const [amountStr, setAmountStr] = useState(
    extraction.amount.value ? extraction.amount.value.toLocaleString("id-ID") : ""
  );
  const [expenseDate, setExpenseDate] = useState(
    extraction.expense_date.value || new Date().toISOString().slice(0, 10)
  );
  const [categoryId, setCategoryId] = useState<string>(
    extraction.category_suggestion.value || "other"
  );
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [showSavedStamp, setShowSavedStamp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check which fields need "Cek lagi" highlight (DESIGN.md 5.6)
  const isNameDoubtful = !extraction.name.value || extraction.name.confidence < 0.7;
  const isAmountDoubtful = !extraction.amount.value || extraction.amount.confidence < 0.7;
  const isDateDoubtful = !extraction.expense_date.value || extraction.expense_date.confidence < 0.7;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (!rawVal) {
      setAmountStr("");
      return;
    }
    const num = parseInt(rawVal, 10);
    setAmountStr(num.toLocaleString("id-ID"));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const intAmount = parseRupiahInput(amountStr);
    if (intAmount <= 0) {
      setErrorMessage("Nominal pengeluaran harus lebih dari Rp 0.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Nama pengeluaran wajib diisi.");
      return;
    }

    setSubmitting(true);

    try {
      // In accordance with AGENTS.md rule 4:
      // Only the final reviewed data is sent. raw_text and image are NEVER sent.
      const res = await createExpense({
        name: name.trim(),
        amount: intAmount,
        currency: "IDR",
        expense_date: expenseDate,
        category_id: categoryId,
        note: note.trim() || null,
        source: "scan",
        extraction_confidence: extraction.extraction_confidence,
      });

      if (!res.ok) {
        throw new Error(res.message || "Gagal menyimpan pengeluaran.");
      }

      setShowSavedStamp(true);
      setTimeout(() => {
        router.push("/expenses");
      }, 800);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj.message || "Terjadi kesalahan.");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard max-w-4xl mx-auto">
      {/* Cap TERSIMPAN (DESIGN.md 5.3) */}
      {showSavedStamp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-kertas/85 rounded-[10px]">
          <div className="border-[3px] border-stempel text-stempel font-display text-4xl px-6 py-2 -rotate-8 uppercase tracking-wider scale-110 transition-transform animate-bounce">
            TERSIMPAN
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-dashed border-tinta/30 pb-4">
        <div>
          <h2 className="font-display text-2xl text-tinta">
            Kebaca! Cek Dulu Sebelum Disimpan
          </h2>
          <p className="text-xs text-tinta-pudar mt-0.5">
            Field bertanda <span className="bg-kuning text-karbon px-1.5 py-0.5 font-bold rounded-sm border border-karbon">Cek lagi</span> perlu kamu pastikan kembali.
          </p>
        </div>

        <div className="bg-karbon/80 border border-tinta/40 px-3 py-1 rounded-full text-xs font-bold text-tinta self-start sm:self-auto">
          Tingkat keyakinan: {Math.round(extraction.extraction_confidence * 100)}%
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-stempel/10 border-2 border-stempel rounded-md text-stempel text-sm font-semibold">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Preview Gambar Lokal (DESIGN.md 5.2 Tape & 5.6 Preview) */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative w-full border-2 border-tinta rounded-[10px] overflow-hidden bg-karbon/30 p-2">
            {/* Tape dekorasi miring di pojok preview (DESIGN.md 5.2) */}
            <div className="absolute top-2 -left-3 w-16 h-5 bg-kuning/90 border border-tinta -rotate-6 z-20 pointer-events-none shadow-sm" />

            {previewUrl && (
              <div
                onClick={() => setIsZoomed(!isZoomed)}
                className="relative w-full h-64 md:h-80 cursor-zoom-in overflow-hidden rounded-md border border-tinta/30 bg-white flex items-center justify-center"
                title="Klik untuk memperbesar"
              >
                <Image
                  src={previewUrl}
                  alt="Preview struk lokal"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            )}
            <p className="text-[11px] text-tinta-pudar text-center mt-2 font-semibold">
              Foto lokal (hanya di browsermu)
            </p>
          </div>
        </div>

        {/* Form Review (md:col-span-7) */}
        <form onSubmit={handleSave} className="md:col-span-7 flex flex-col gap-4">
          {/* Nama Pengeluaran */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-name"
                className={`font-bold text-sm ${
                  isNameDoubtful ? "bg-kuning text-karbon px-1 rounded-sm" : "text-tinta"
                }`}
              >
                Nama Pengeluaran
              </label>
              {isNameDoubtful && (
                <span className="text-[11px] font-bold bg-kuning text-karbon border border-karbon px-1.5 py-0.2 rounded-full">
                  Cek lagi
                </span>
              )}
            </div>
            <input
              id="review-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Indomaret Point"
              className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
            />
          </div>

          {/* Nominal */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-amount"
                className={`font-bold text-sm ${
                  isAmountDoubtful ? "bg-kuning text-karbon px-1 rounded-sm" : "text-tinta"
                }`}
              >
                Nominal
              </label>
              {isAmountDoubtful && (
                <span className="text-[11px] font-bold bg-kuning text-karbon border border-karbon px-1.5 py-0.2 rounded-full">
                  Cek lagi
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-tinta font-bold text-base pointer-events-none">
                Rp
              </span>
              <input
                id="review-amount"
                type="text"
                inputMode="numeric"
                required
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="0"
                className="bg-kertas border-2 border-tinta rounded-md min-h-11 pl-10 pr-3 text-right font-bold tabular-nums text-tinta placeholder:text-tinta-pudar focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-lg"
              />
            </div>
          </div>

          {/* Tanggal */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-date"
                className={`font-bold text-sm ${
                  isDateDoubtful ? "bg-kuning text-karbon px-1 rounded-sm" : "text-tinta"
                }`}
              >
                Tanggal
              </label>
              {isDateDoubtful && (
                <span className="text-[11px] font-bold bg-kuning text-karbon border border-karbon px-1.5 py-0.2 rounded-full">
                  Cek lagi
                </span>
              )}
            </div>
            <input
              id="review-date"
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
            />
          </div>

          {/* Kategori */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-category"
                className="font-bold text-sm text-tinta"
              >
                Kategori (Saran)
              </label>
              {extraction.category_suggestion.value && (
                <span className="text-[11px] font-bold bg-pulpen/60 text-tinta border border-tinta/40 px-2 py-0.5 rounded-full">
                  Disarankan otomatis
                </span>
              )}
            </div>
            <select
              id="review-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base cursor-pointer"
            >
              {DEFAULT_CATEGORY_LIST.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Catatan (opsional) */}
          <div>
            <label
              htmlFor="review-note"
              className="font-bold text-sm text-tinta mb-1 block"
            >
              Catatan (Opsional)
            </label>
            <textarea
              id="review-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan jajan..."
              className="bg-kertas border-2 border-tinta rounded-md p-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3 mt-2 border-t-2 border-dashed border-tinta/30">
            <button
              type="submit"
              disabled={submitting || !name || !amountStr || !expenseDate}
              className="bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] flex-1 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Menyimpan…" : "Simpan Pengeluaran"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-kertas text-tinta font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
