"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_CATEGORY_LIST } from "@/lib/categories";
import { formatRupiah, parseRupiahInput } from "@/lib/money";
import { createExpense, updateExpense, deleteExpense } from "@/actions/expenses";
import type { ExpenseRecord } from "@/types/expense";

interface ExpenseFormProps {
  initialData?: ExpenseRecord;
  sourceDefault?: "manual" | "scan";
  extractionConfidence?: number | null;
  onSuccess?: (id: string) => void;
}

export function ExpenseForm({
  initialData,
  sourceDefault = "manual",
  extractionConfidence = null,
  onSuccess,
}: ExpenseFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [amountStr, setAmountStr] = useState(
    initialData ? initialData.amount.toLocaleString("id-ID") : ""
  );
  const [expenseDate, setExpenseDate] = useState(
    initialData?.expense_date || new Date().toISOString().slice(0, 10)
  );
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "food");
  const [note, setNote] = useState(initialData?.note || "");

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSavedStamp, setShowSavedStamp] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (!rawVal) {
      setAmountStr("");
      return;
    }
    const num = parseInt(rawVal, 10);
    setAmountStr(num.toLocaleString("id-ID"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (initialData?.id) {
        // Edit mode
        const res = await updateExpense({
          id: initialData.id,
          name: name.trim(),
          amount: intAmount,
          expense_date: expenseDate,
          category_id: categoryId,
          note: note.trim() || null,
        });

        if (!res.ok) {
          throw new Error(res.message || "Gagal memperbarui pengeluaran.");
        }

        setShowSavedStamp(true);
        setTimeout(() => {
          if (onSuccess) onSuccess(initialData.id);
          else router.push("/expenses");
        }, 800);
      } else {
        // Create mode
        const res = await createExpense({
          name: name.trim(),
          amount: intAmount,
          currency: "IDR",
          expense_date: expenseDate,
          category_id: categoryId,
          note: note.trim() || null,
          source: sourceDefault,
          extraction_confidence: extractionConfidence,
        });

        if (!res.ok) {
          throw new Error(res.message || "Gagal menyimpan pengeluaran.");
        }

        setShowSavedStamp(true);
        setTimeout(() => {
          if (onSuccess && res.data?.id) onSuccess(res.data.id);
          else router.push("/expenses");
        }, 800);
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj.message || "Terjadi kesalahan.");
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    const confirmDelete = window.confirm(
      `Hapus pengeluaran ini?\n${initialData.name}, ${formatRupiah(
        initialData.amount
      )}, ${initialData.expense_date} akan hilang dan tidak bisa dikembalikan.`
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await deleteExpense(initialData.id);
      if (!res.ok) {
        throw new Error(res.message || "Gagal menghapus pengeluaran.");
      }
      router.push("/expenses");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj.message || "Gagal menghapus.");
      setDeleting(false);
    }
  };

  return (
    <div className="relative bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard max-w-xl mx-auto">
      {/* Cap TERSIMPAN (DESIGN.md 5.3) */}
      {showSavedStamp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-kertas/80 rounded-[10px]">
          <div className="border-[3px] border-stempel text-stempel font-display text-4xl px-6 py-2 -rotate-6 uppercase tracking-wider scale-110 transition-transform animate-bounce">
            TERSIMPAN
          </div>
        </div>
      )}

      <h2 className="font-display text-2xl text-tinta mb-4">
        {initialData ? "Ubah Pengeluaran" : "Catat Pengeluaran"}
      </h2>

      {errorMessage && (
        <div className="mb-4 p-3 bg-stempel/10 border-2 border-stempel rounded-md text-stempel text-sm font-semibold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nama Pengeluaran */}
        <div>
          <label
            htmlFor="expense-name"
            className="font-bold text-sm text-tinta mb-1.5 block"
          >
            Nama Pengeluaran
          </label>
          <input
            id="expense-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Kopi susu gula aren"
            className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
          />
        </div>

        {/* Nominal Field (Prefix Rp menempel di kiri, rata kanan, tabular-nums) */}
        <div>
          <label
            htmlFor="expense-amount"
            className="font-bold text-sm text-tinta mb-1.5 block"
          >
            Nominal
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-tinta font-bold text-base pointer-events-none">
              Rp
            </span>
            <input
              id="expense-amount"
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
          <label
            htmlFor="expense-date"
            className="font-bold text-sm text-tinta mb-1.5 block"
          >
            Tanggal
          </label>
          <input
            id="expense-date"
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
          />
        </div>

        {/* Kategori */}
        <div>
          <label
            htmlFor="expense-category"
            className="font-bold text-sm text-tinta mb-1.5 block"
          >
            Kategori
          </label>
          <select
            id="expense-category"
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

        {/* Catatan (Opsional) */}
        <div>
          <label
            htmlFor="expense-note"
            className="font-bold text-sm text-tinta mb-1.5 block"
          >
            Catatan (Opsional)
          </label>
          <textarea
            id="expense-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Keterangan tambahan..."
            className="bg-kertas border-2 border-tinta rounded-md p-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t-2 border-dashed border-tinta/30">
          <button
            type="submit"
            disabled={submitting}
            className="bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100 flex-1 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Menyimpan…" : "Simpan Pengeluaran"}
          </button>

          {initialData?.id && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-stempel text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100 disabled:opacity-50 cursor-pointer"
            >
              {deleting ? "Menghapus…" : "Hapus"}
            </button>
          )}

          <button
            type="button"
            onClick={() => router.back()}
            className="bg-kertas text-tinta font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100 cursor-pointer"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
