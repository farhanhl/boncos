"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PiForkKnifeBold,
  PiCarBold,
  PiShoppingBagBold,
  PiReceiptBold,
  PiGameControllerBold,
  PiHeartbeatBold,
  PiGraduationCapBold,
  PiDotsThreeOutlineBold,
  PiMagnifyingGlassBold,
  PiCameraBold,
  PiPlusBold,
  PiDownloadSimpleBold,
} from "react-icons/pi";
import { formatRupiah } from "@/lib/money";
import { DEFAULT_CATEGORY_LIST, getCategoryById } from "@/lib/categories";
import type { ExpenseRecord } from "@/types/expense";

interface ExpenseListProps {
  initialExpenses: ExpenseRecord[];
}

export function ExpenseList({ initialExpenses }: ExpenseListProps) {
  const [expenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const filteredExpenses = expenses.filter((item) => {
    if (filterCategory && item.category_id !== filterCategory) return false;
    if (searchQuery && !item.name_lower.includes(searchQuery.toLowerCase())) return false;
    if (fromDate && item.expense_date < fromDate) return false;
    if (toDate && item.expense_date > toDate) return false;
    return true;
  });

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "PiForkKnifeBold":
        return <PiForkKnifeBold className="text-xl" />;
      case "PiCarBold":
        return <PiCarBold className="text-xl" />;
      case "PiShoppingBagBold":
        return <PiShoppingBagBold className="text-xl" />;
      case "PiReceiptBold":
        return <PiReceiptBold className="text-xl" />;
      case "PiGameControllerBold":
        return <PiGameControllerBold className="text-xl" />;
      case "PiHeartbeatBold":
        return <PiHeartbeatBold className="text-xl" />;
      case "PiGraduationCapBold":
        return <PiGraduationCapBold className="text-xl" />;
      default:
        return <PiDotsThreeOutlineBold className="text-xl" />;
    }
  };

  const handleExportCsv = () => {
    if (filteredExpenses.length === 0) return;
    const headers = ["Tanggal", "Nama", "Kategori", "Nominal", "Sumber", "Catatan"];
    const rows = filteredExpenses.map((e) => {
      const cat = getCategoryById(e.category_id);
      return [
        `"${e.expense_date}"`,
        `"${e.name.replace(/"/g, '""')}"`,
        `"${cat.name}"`,
        e.amount,
        `"${e.source === "scan" ? "Scan Struk" : "Manual"}"`,
        `"${(e.note || "").replace(/"/g, '""')}"`,
      ].join(",");
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `boncos-pengeluaran-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-tinta">
            Daftar Jajan
          </h1>
          <p className="text-sm text-tinta-pudar mt-1">
            Riwayat seluruh pengeluaran yang pernah kamu catat.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filteredExpenses.length > 0 && (
            <button
              onClick={handleExportCsv}
              title="Unduh file CSV"
              className="bg-kertas text-tinta font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-3 flex items-center gap-1.5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100 cursor-pointer text-xs sm:text-sm"
            >
              <PiDownloadSimpleBold className="text-lg" />
              <span>Export CSV</span>
            </button>
          )}
          <Link
            href="/expenses/new?tab=scan"
            className="bg-kuning text-karbon font-bold border-2 border-karbon rounded-md shadow-hard min-h-11 px-4 flex items-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100"
          >
            <PiCameraBold className="text-xl text-karbon" />
            <span className="text-karbon">Baca Struk</span>
          </Link>
          <Link
            href="/expenses/new?tab=manual"
            className="bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-4 flex items-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100"
          >
            <PiPlusBold className="text-xl" />
            <span>Isi Manual</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-4 shadow-hard flex flex-wrap gap-3 items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <PiMagnifyingGlassBold className="absolute left-3 top-3.5 text-tinta-pudar text-lg pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pengeluaran..."
            className="bg-kertas border-2 border-tinta rounded-md min-h-11 pl-10 pr-3 text-tinta placeholder:text-tinta-pudar focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-sm"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] text-sm cursor-pointer"
        >
          <option value="">Semua Kategori</option>
          {DEFAULT_CATEGORY_LIST.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Date From */}
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] text-sm cursor-pointer"
          title="Dari tanggal"
        />

        {/* Date To */}
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] text-sm cursor-pointer"
          title="Sampai tanggal"
        />

        {(searchQuery || filterCategory || fromDate || toDate) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterCategory("");
              setFromDate("");
              setToDate("");
            }}
            className="text-xs font-bold text-stempel underline px-2 py-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* List / Empty State */}
      <div className="bg-kertas border-2 border-tinta rounded-[10px] overflow-hidden shadow-hard">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-bold text-lg text-tinta mb-2">
              Belum ada jajan yang tercatat.
            </p>
            <p className="text-sm text-tinta-pudar max-w-sm mx-auto mb-6">
              Foto struk pertamamu atau isi manual sekarang biar pengeluaranmu rapi.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/expenses/new?tab=scan"
                className="bg-kuning text-karbon font-bold border-2 border-karbon rounded-md shadow-hard min-h-11 px-4 flex items-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow]"
              >
                <PiCameraBold className="text-xl text-karbon" />
                <span className="text-karbon">Foto Struk</span>
              </Link>
              <Link
                href="/expenses/new?tab=manual"
                className="bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-4 flex items-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow]"
              >
                <span>Isi Manual</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y-2 divide-dashed divide-tinta/30">
            {filteredExpenses.map((expense) => {
              const cat = getCategoryById(expense.category_id);
              return (
                <Link
                  key={expense.id}
                  href={`/expenses/${expense.id}`}
                  className="flex items-center justify-between p-4 hover:bg-karbon/30 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Category Icon Badge */}
                    <div
                      style={{ backgroundColor: cat.color }}
                      className="w-10 h-10 rounded-full border-2 border-karbon flex items-center justify-center text-karbon shrink-0 shadow-hard-sm"
                    >
                      {getCategoryIcon(cat.iconName)}
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-tinta group-hover:text-pulpen transition-colors">
                        {expense.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-tinta-pudar mt-0.5">
                        <span>{expense.expense_date}</span>
                        <span>•</span>
                        <span>{cat.name}</span>
                        {expense.source === "scan" && (
                          <span className="bg-kuning text-karbon font-bold px-1.5 py-0.2 rounded border border-karbon text-[10px]">
                            SCAN
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nominal (tabular-nums, bold, right-aligned) */}
                  <div className="text-right">
                    <span className="font-bold text-base md:text-lg tabular-nums text-tinta">
                      {formatRupiah(expense.amount)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
