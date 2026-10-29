"use client";

import { useState, useRef, useTransition } from "react";
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
  PiArrowCounterClockwiseBold,
  PiArrowsLeftRightBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiTagBold,
  PiSpinnerGapBold,
} from "react-icons/pi";
import { formatRupiah } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/date";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { DEFAULT_CATEGORY_LIST, getCategoryById } from "@/lib/categories";
import { listExpenses } from "@/actions/expenses";
import type { CustomCategoryRecord } from "@/actions/categories";
import type { ExpenseRecord } from "@/types/expense";

interface ExpenseListProps {
  initialExpenses: ExpenseRecord[];
  initialTotalAmount?: number;
  initialTotalCount?: number;
  customCategories?: CustomCategoryRecord[];
}

function formatToDdMmYyyy(dateStr: string): string {
  return formatDate(dateStr);
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [];
  if (currentPage <= 3) {
    pages.push(1, 2, 3, "...", totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "...", currentPage, "...", totalPages);
  }
  return pages;
}



function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type QuickDatePreset = "all" | "today" | "week" | "month" | "last_month";

export function ExpenseList({
  initialExpenses,
  initialTotalAmount,
  initialTotalCount,
  customCategories = [],
}: ExpenseListProps) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [totalAmount, setTotalAmount] = useState<number>(
    initialTotalAmount ?? initialExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  );
  const [totalCount, setTotalCount] = useState<number>(
    initialTotalCount ?? initialExpenses.length
  );
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [prevFilterKey, setPrevFilterKey] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const listTopRef = useRef<HTMLDivElement>(null);

  const currentFilterKey = `${filterCategory}|${searchQuery}|${fromDate}|${toDate}|${pageSize}`;
  if (currentFilterKey !== prevFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  }

  const fetchFilteredExpenses = (newFrom: string, newTo: string, newCategory: string) => {
    startTransition(async () => {
      const res = await listExpenses({
        from: newFrom || undefined,
        to: newTo || undefined,
        category_id: newCategory || undefined,
        limit: 100,
      });
      if (res.ok && res.data) {
        setExpenses(res.data.expenses);
        setTotalAmount(
          res.data.totalAmount ??
            res.data.expenses.reduce((acc, curr) => acc + curr.amount, 0)
        );
        setTotalCount(res.data.totalCount ?? res.data.expenses.length);
      }
    });
  };

  const handleSelectPreset = (preset: QuickDatePreset) => {
    const now = new Date();
    let newFrom = "";
    let newTo = "";
    if (preset === "all") {
      newFrom = "";
      newTo = "";
    } else if (preset === "today") {
      const todayStr = toLocalDateString(now);
      newFrom = todayStr;
      newTo = todayStr;
    } else if (preset === "week") {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      newFrom = toLocalDateString(past);
      newTo = toLocalDateString(now);
    } else if (preset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      newFrom = toLocalDateString(start);
      newTo = toLocalDateString(end);
    } else if (preset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      newFrom = toLocalDateString(start);
      newTo = toLocalDateString(end);
    }
    setFromDate(newFrom);
    setToDate(newTo);
    fetchFilteredExpenses(newFrom, newTo, filterCategory);
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

  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateComp = b.expense_date.localeCompare(a.expense_date);
    if (dateComp !== 0) return dateComp;
    return (b.created_at || "").localeCompare(a.created_at || "");
  });

  const filteredExpenses = sortedExpenses.filter((item) => {
    if (filterCategory && item.category_id !== filterCategory) return false;
    if (searchQuery && !item.name_lower.includes(searchQuery.toLowerCase())) return false;
    if (fromDate && item.expense_date < fromDate) return false;
    if (toDate && item.expense_date > toDate) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredExpenses.length);
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);
  const pageNumbers = getPageNumbers(safePage, totalPages);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
      case "PiArrowsLeftRightBold":
        return <PiArrowsLeftRightBold className="text-xl" />;
      case "PiTagBold":
        return <PiTagBold className="text-xl" />;
      default:
        return <PiDotsThreeOutlineBold className="text-xl" />;
    }
  };

  const handleExportCsv = () => {
    if (filteredExpenses.length === 0) return;
    const headers = ["Tanggal", "Nama", "Kategori", "Nominal", "Sumber", "Catatan"];
    const rows = filteredExpenses.map((e) => {
      const cat = getCategoryById(e.category_id, customCategories);
      return [
        `"${formatDate(e.expense_date)}"`,
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
        <div className="text-center sm:text-left">
          <h1 className="font-display text-3xl md:text-4xl text-tinta">
            Daftar Pengeluaran
          </h1>
          <p className="text-sm text-tinta-pudar mt-1">
            Riwayat seluruh pengeluaran yang pernah kamu catat.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Tombol Utama: Baca Struk (Full width di baris atas mobile) */}
          <Link
            href="/expenses/new?tab=scan"
            className={`${filteredExpenses.length > 0 ? "col-span-2" : "col-span-1"
              } sm:col-auto bg-kuning text-karbon font-bold border-2 border-karbon rounded-md shadow-hard min-h-11 px-4 flex items-center justify-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100 sm:order-2`}
          >
            <PiCameraBold className="text-xl text-karbon shrink-0" />
            <span className="text-karbon">Baca Struk</span>
          </Link>

          {/* Tombol Kedua: Isi Manual */}
          <Link
            href="/expenses/new?tab=manual"
            className="col-span-1 sm:col-auto bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-4 flex items-center justify-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100 sm:order-3"
          >
            <PiPlusBold className="text-xl shrink-0" />
            <span>Isi Manual</span>
          </Link>

          {/* Tombol Ketiga: Export CSV */}
          {filteredExpenses.length > 0 && (
            <button
              onClick={handleExportCsv}
              title="Unduh file CSV"
              className="col-span-1 sm:col-auto bg-kertas text-tinta font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-3 flex items-center justify-center gap-1.5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100 cursor-pointer text-xs sm:text-sm sm:order-1"
            >
              <PiDownloadSimpleBold className="text-lg shrink-0" />
              <span>Export CSV</span>
            </button>
          )}
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
            className={`px-3 py-1 rounded-full border-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${activePreset === "all"
              ? "bg-kuning text-karbon border-karbon shadow-hard-sm"
              : "bg-karbon/40 text-tinta border-tinta/40 hover:border-tinta hover:bg-karbon/70"
              }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("today")}
            className={`px-3 py-1 rounded-full border-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${activePreset === "today"
              ? "bg-kuning text-karbon border-karbon shadow-hard-sm"
              : "bg-karbon/40 text-tinta border-tinta/40 hover:border-tinta hover:bg-karbon/70"
              }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("week")}
            className={`px-3 py-1 rounded-full border-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${activePreset === "week"
              ? "bg-kuning text-karbon border-karbon shadow-hard-sm"
              : "bg-karbon/40 text-tinta border-tinta/40 hover:border-tinta hover:bg-karbon/70"
              }`}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("month")}
            className={`px-3 py-1 rounded-full border-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${activePreset === "month"
              ? "bg-kuning text-karbon border-karbon shadow-hard-sm"
              : "bg-karbon/40 text-tinta border-tinta/40 hover:border-tinta hover:bg-karbon/70"
              }`}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset("last_month")}
            className={`px-3 py-1 rounded-full border-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${activePreset === "last_month"
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
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <PiMagnifyingGlassBold className="absolute left-3 top-3.5 text-tinta-pudar text-lg pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pengeluaran..."
              className="bg-kertas border-2 border-tinta rounded-md min-h-11 pl-10 pr-3 text-tinta placeholder:text-tinta-pudar focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-sm"
            />
          </div>

          {/* Category Filter (Full width on mobile, auto on desktop) */}
          <select
            value={filterCategory}
            onChange={(e) => {
              const newCat = e.target.value;
              setFilterCategory(newCat);
              fetchFilteredExpenses(fromDate, toDate, newCat);
            }}
            className="w-full sm:w-auto bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] text-sm cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            <optgroup label="Kategori Bawaan">
              {DEFAULT_CATEGORY_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            {customCategories.length > 0 && (
              <optgroup label="Kategori Kustom">
                {customCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Date From & Date To (Full width on mobile, auto on desktop) */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <DatePickerField
              value={fromDate}
              onChange={(newFrom) => {
                setFromDate(newFrom);
                fetchFilteredExpenses(newFrom, toDate, filterCategory);
              }}
              title="Dari tanggal"
              placeholder="dd/mm/yyyy"
            />
            <span className="text-tinta-pudar text-xs font-bold shrink-0">-</span>
            <DatePickerField
              value={toDate}
              onChange={(newTo) => {
                setToDate(newTo);
                fetchFilteredExpenses(fromDate, newTo, filterCategory);
              }}
              title="Sampai tanggal"
              placeholder="dd/mm/yyyy"
            />
          </div>

          {/* Reset Button (Full width on mobile, auto on desktop) */}
          {(searchQuery || filterCategory || fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("");
                setFromDate("");
                setToDate("");
                fetchFilteredExpenses("", "", "");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-11 bg-stempel text-white font-bold text-xs rounded-md border-2 border-karbon shadow-hard-sm hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shrink-0"
              title="Reset semua filter pencarian"
            >
              <PiArrowCounterClockwiseBold className="text-sm shrink-0" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Summary Pill for Filtered Expenses (Per Hari & Per Minggu) */}
      {(filteredExpenses.length > 0 || totalCount > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-karbon/50 border-2 border-tinta/20 rounded-lg px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-tinta">
            <span className="text-tinta-pudar">Total Terpilih:</span>
            <span className="text-kuning tabular-nums text-sm font-display">
              {formatRupiah(
                searchQuery
                  ? filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0)
                  : totalAmount
              )}
            </span>
            <span className="text-tinta-pudar font-normal">
              ({searchQuery ? filteredExpenses.length : totalCount} transaksi)
            </span>
            {isPending && (
              <PiSpinnerGapBold className="animate-spin text-kuning text-sm ml-1" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-tinta-pudar font-semibold">
            <div>
              Rata-rata/hari:{" "}
              <span className="text-tinta font-bold tabular-nums">
                {formatRupiah(
                  Math.round(
                    (searchQuery
                      ? filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0)
                      : totalAmount) /
                      Math.max(1, new Set(filteredExpenses.map((e) => e.expense_date)).size)
                  )
                )}
              </span>
            </div>
            <div>
              Rata-rata/minggu:{" "}
              <span className="text-tinta font-bold tabular-nums">
                {formatRupiah(
                  Math.round(
                    (searchQuery
                      ? filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0)
                      : totalAmount) /
                      Math.max(
                        1,
                        Math.ceil(new Set(filteredExpenses.map((e) => e.expense_date)).size / 7)
                      )
                  )
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* List / Empty State */}
      <div
        ref={listTopRef}
        className="bg-kertas border-2 border-tinta rounded-[10px] overflow-hidden shadow-hard scroll-mt-6"
      >
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
          <>
            <div className="divide-y-2 divide-dashed divide-tinta/30">
              {paginatedExpenses.map((expense) => {
                const cat = getCategoryById(expense.category_id, customCategories);
                return (
                  <Link
                    key={expense.id}
                    href={`/expenses/${expense.id}`}
                    className="flex items-center justify-between p-4 hover:bg-karbon/30 transition-colors group gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Category Icon Badge */}
                      <div
                        style={{ backgroundColor: cat.color }}
                        className="w-10 h-10 rounded-full border-2 border-karbon flex items-center justify-center text-karbon shrink-0 shadow-hard-sm"
                      >
                        {getCategoryIcon(cat.iconName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-tinta group-hover:text-kuning transition-colors truncate">
                          {expense.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-tinta-pudar mt-0.5 truncate">
                          <span className="shrink-0">{formatToDdMmYyyy(expense.expense_date)}</span>
                          {expense.created_at && (
                            <>
                              <span>•</span>
                              <span className="shrink-0 font-medium" suppressHydrationWarning>
                                {formatTime(expense.created_at)}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="truncate">{cat.name}</span>
                          {expense.source === "scan" && (
                            <span className="bg-kuning text-karbon font-bold px-1.5 py-0.2 rounded border border-karbon text-[10px] shrink-0">
                              SCAN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nominal (tabular-nums, bold, right-aligned, shrink-0, whitespace-nowrap) */}
                    <div className="text-right shrink-0 whitespace-nowrap pl-2">
                      <span className="font-bold text-base md:text-lg tabular-nums text-tinta group-hover:text-kuning transition-colors whitespace-nowrap">
                        {formatRupiah(expense.amount)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {filteredExpenses.length > 0 && (
              <div className="border-t-2 border-dashed border-tinta/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-kertas/60">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-tinta-pudar font-medium">
                  <span>
                    Menampilkan <span className="font-bold text-tinta">{startIndex + 1}</span>-
                    <span className="font-bold text-tinta">{endIndex}</span> dari{" "}
                    <span className="font-bold text-tinta">
                      {searchQuery ? filteredExpenses.length : totalCount}
                    </span>{" "}
                    pengeluaran
                  </span>
                  <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-tinta/30">
                    <span className="hidden sm:inline">Per hal:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="bg-kertas border-2 border-tinta rounded text-xs font-bold text-tinta py-0.5 px-2 focus:ring-0 focus:shadow-[2px_2px_0_0_var(--pulpen)] cursor-pointer"
                      title="Jumlah baris per halaman"
                    >
                      <option value={10}>10 / hal</option>
                      <option value={20}>20 / hal</option>
                      <option value={50}>50 / hal</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePageChange(safePage - 1)}
                    disabled={safePage === 1}
                    className="min-h-9 px-3 flex items-center gap-1 bg-kertas text-tinta font-bold text-xs border-2 border-tinta rounded-md shadow-hard-sm hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 transition-all cursor-pointer"
                    title="Halaman sebelumnya"
                  >
                    <PiCaretLeftBold className="text-sm" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {pageNumbers.map((p, idx) =>
                      typeof p === "number" ? (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-md border-2 transition-all cursor-pointer ${p === safePage
                            ? "bg-kuning text-karbon border-karbon shadow-hard-sm font-extrabold"
                            : "bg-kertas text-tinta border-tinta hover:bg-karbon/40"
                            }`}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={`dots-${idx}`} className="px-1 text-tinta-pudar text-xs select-none">
                          •••
                        </span>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePageChange(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="min-h-9 px-3 flex items-center gap-1 bg-kertas text-tinta font-bold text-xs border-2 border-tinta rounded-md shadow-hard-sm hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 transition-all cursor-pointer"
                    title="Halaman selanjutnya"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <PiCaretRightBold className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
