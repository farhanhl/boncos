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

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type QuickDatePreset = "all" | "today" | "week" | "month" | "last_month";

export function ExpenseList({ initialExpenses }: ExpenseListProps) {
  const [expenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const handleSelectPreset = (preset: QuickDatePreset) => {
    const now = new Date();
    if (preset === "all") {
      setFromDate("");
      setToDate("");
    } else if (preset === "today") {
      const todayStr = toLocalDateString(now);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === "week") {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      setFromDate(toLocalDateString(past));
      setToDate(toLocalDateString(now));
    } else if (preset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFromDate(toLocalDateString(start));
      setToDate(toLocalDateString(end));
    } else if (preset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(toLocalDateString(start));
      setToDate(toLocalDateString(end));
    }
  };

  const getActivePreset = (): QuickDatePreset | "custom" => {
    if (!fromDate && !toDate) return "all";
    const now = new Date();
    const todayStr = toLocalDateString(now);
    if (fromDate === todayStr && toDate === todayStr) return "today";

    const pastWeek = new Date(now);
    pastWeek.setDate(now.getDate() - 6);
    if (fromDate === toLocalDateString(pastWeek) && toDate === todayStr) return "week";

    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    if (fromDate === toLocalDateString(startMonth) && toDate === toLocalDateString(endMonth)) return "month";

    const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLast = new Date(now.getFullYear(), now.getMonth(), 0);
    if (fromDate === toLocalDateString(startLast) && toDate === toLocalDateString(endLast)) return "last_month";

    return "custom";
  };

  const activePreset = getActivePreset();

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
            Daftar Pengeluaran
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
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-4 shadow-hard space-y-3">
        {/* Quick Date Presets Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-tinta-pudar font-bold shrink-0 mr-1 hidden sm:inline">
            Periode:
          </span>
          <button
            type="button"
            onClick={() => handleSelectPreset("all")}
            className={`px-3 py-1 rounded-full border-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activePreset === "all"
                ? "bg-kuning text-karbon border-karbon shadow-hard-sm"
                : "bg-karbon/40 text-tinta border-tinta/40 hover:border-tinta hover:bg-karbon/70"
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("today")}
            className={`px-3 py-1 rounded-full border-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activePreset === "today"
                ? "bg-kuning text-karbon border-karbon shadow-hard-sm"
                : "bg-karbon/40 text-tinta border-tinta/40 hover:border-tinta hover:bg-karbon/70"
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("week")}
            className={`px-3 py-1 rounded-full border-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activePreset === "week"
                ? "bg-kuning text-karbon border-karbon shadow-hard-sm"
                : "bg-karbon/40 text-tinta border-tinta/40 hover:border-tinta hover:bg-karbon/70"
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("month")}
            className={`px-3 py-1 rounded-full border-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activePreset === "month"
                ? "bg-kuning text-karbon border-karbon shadow-hard-sm"
                : "bg-karbon/40 text-tinta border-tinta/40 hover:border-tinta hover:bg-karbon/70"
            }`}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("last_month")}
            className={`px-3 py-1 rounded-full border-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activePreset === "last_month"
                ? "bg-kuning text-karbon border-karbon shadow-hard-sm"
                : "bg-karbon/40 text-tinta border-tinta/40 hover:border-tinta hover:bg-karbon/70"
            }`}
          >
            Bulan Lalu
          </button>
        </div>

        {/* Input Controls Bar */}
        <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-dashed border-tinta/20">
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

          {/* Date From & Date To */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] text-sm cursor-pointer"
              title="Dari tanggal"
            />
            <span className="text-tinta-pudar text-xs font-bold">-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] text-sm cursor-pointer"
              title="Sampai tanggal"
            />
          </div>

          {(searchQuery || filterCategory || fromDate || toDate) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("");
                setFromDate("");
                setToDate("");
              }}
              className="text-xs font-bold text-stempel underline px-2 py-1 hover:brightness-125 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
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
                      <h3 className="font-bold text-base text-tinta group-hover:text-kuning transition-colors">
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
                    <span className="font-bold text-base md:text-lg tabular-nums text-tinta group-hover:text-kuning transition-colors">
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
