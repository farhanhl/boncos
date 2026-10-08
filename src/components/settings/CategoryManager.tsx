"use client";

import { useState } from "react";
import {
  PiTagBold,
  PiPlusBold,
  PiTrashBold,
  PiLockKeyBold,
} from "react-icons/pi";
import { DEFAULT_CATEGORY_LIST } from "@/lib/categories";
import {
  createCustomCategory,
  deleteCustomCategory,
  type CustomCategoryRecord,
} from "@/actions/categories";

const ALLOWED_COLORS = [
  "#FF9F45", // food
  "#6EC6FF", // transport
  "#FF7EB6", // shopping
  "#B9C0FF", // bills
  "#FFD23F", // entertainment
  "#2BD67B", // health
  "#C8E36B", // education
  "#818CF8", // transfer
  "#D9DBF0", // other
];

interface CategoryManagerProps {
  customCategories: CustomCategoryRecord[];
}

export function CategoryManager({
  customCategories: initialCategories,
}: CategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [color, setColor] = useState(ALLOWED_COLORS[0] || "#FF9F45");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await createCustomCategory({
        name: name.trim(),
        color,
        icon: "PiTagBold",
      });

      if (!res.ok || !res.data) {
        throw new Error(res.message || "Gagal membuat kategori.");
      }

      setCategories((prev) => [
        ...prev,
        {
          id: res.data!.id,
          name: name.trim(),
          color,
          icon: "PiTagBold",
          created_at: new Date().toISOString(),
        },
      ]);

      setName("");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj.message || "Gagal menambahkan kategori.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Hapus kategori custom "${catName}"?`)) return;
    try {
      const res = await deleteCustomCategory(id);
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Form Tambah Kategori Custom */}
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard">
        <h2 className="font-display text-2xl text-tinta mb-1">
          Tambah Kategori Sendiri
        </h2>
        <p className="text-xs text-tinta-pudar mb-5">
          Buat kategori khusus yang sering kamu pakai selain kategori bawaan.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-stempel/10 border-2 border-stempel rounded-md text-stempel text-sm font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label
              htmlFor="category-name"
              className="font-bold text-sm text-tinta mb-1.5 block"
            >
              Nama Kategori
            </label>
            <input
              id="category-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Skincare, Kucing, Hobi"
              className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
            />
          </div>

          <div>
            <span className="font-bold text-sm text-tinta mb-1.5 block">
              Pilih Warna Stiker
            </span>
            <div className="flex flex-wrap gap-2.5">
              {ALLOWED_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-9 h-9 rounded-full border-2 border-tinta transition-transform cursor-pointer ${
                    color === c ? "scale-110 ring-2 ring-tinta shadow-hard-sm" : "hover:scale-105"
                  }`}
                  title={c}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="mt-2 bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5 flex items-center justify-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] cursor-pointer disabled:opacity-50"
          >
            <PiPlusBold className="text-lg" />
            <span>{submitting ? "Menambahkan…" : "Tambah Kategori"}</span>
          </button>
        </form>
      </div>

      {/* Kategori Custom Milik User */}
      {categories.length > 0 && (
        <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard space-y-3">
          <h3 className="font-display text-xl text-tinta">Kategori Kustom Kamu</h3>
          <div className="flex flex-wrap gap-2.5 pt-2">
            {categories.map((c) => (
              <div
                key={c.id}
                style={{ backgroundColor: c.color }}
                className="inline-flex items-center gap-2 border-2 border-karbon rounded-full px-3.5 py-1 text-sm font-bold text-karbon shadow-hard-sm"
              >
                <PiTagBold className="text-base text-karbon" />
                <span className="text-karbon">{c.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id, c.name)}
                  className="hover:text-stempel text-karbon transition-colors ml-1 cursor-pointer"
                  title="Hapus Kategori"
                >
                  <PiTrashBold className="text-base" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kategori Default (Bawaan Sistem) */}
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard space-y-3">
        <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-tinta/30">
          <h3 className="font-display text-xl text-tinta">Kategori Bawaan</h3>
          <span className="text-xs text-tinta-pudar font-semibold flex items-center gap-1">
            <PiLockKeyBold /> Tetap
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5 pt-2">
          {DEFAULT_CATEGORY_LIST.map((cat) => (
            <div
              key={cat.id}
              style={{ backgroundColor: cat.color }}
              className="inline-flex items-center gap-2 border-2 border-karbon rounded-full px-3.5 py-1 text-sm font-bold text-karbon shadow-hard-sm"
            >
              <PiTagBold className="text-base text-karbon" />
              <span className="text-karbon">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
