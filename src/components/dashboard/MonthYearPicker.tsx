"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PiCaretLeftBold,
  PiCaretRightBold,
  PiCalendarBlankBold,
  PiArrowCounterClockwiseBold,
  PiSpinnerGapBold,
} from "react-icons/pi";

interface MonthYearPickerProps {
  currentMonth: string; // 'YYYY-MM'
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function MonthYearPicker({ currentMonth }: MonthYearPickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const realCurrentMonth = new Date().toISOString().slice(0, 7);
  const isViewingCurrentMonth = currentMonth === realCurrentMonth;

  const [yearStr, monthStr] = currentMonth.split("-");
  const year = parseInt(yearStr || "2026", 10);
  const month = parseInt(monthStr || "10", 10);

  // Generate range of available years (current year ± 3)
  const baseYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => baseYear - 4 + i);

  const navigateToMonth = (newYear: number, newMonth: number) => {
    let targetYear = newYear;
    let targetMonth = newMonth;
    if (targetMonth < 1) {
      targetMonth = 12;
      targetYear -= 1;
    } else if (targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }

    const formattedMonth = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
    startTransition(() => {
      router.push(`/dashboard?month=${formattedMonth}`);
    });
  };

  const handlePrev = () => {
    navigateToMonth(year, month - 1);
  };

  const handleNext = () => {
    navigateToMonth(year, month + 1);
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigateToMonth(year, parseInt(e.target.value, 10));
  };

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigateToMonth(parseInt(e.target.value, 10), month);
  };

  const handleResetCurrentMonth = () => {
    startTransition(() => {
      router.push("/dashboard");
    });
  };

  return (
    <div
      className={`bg-kertas border-2 border-tinta rounded-[10px] p-3.5 md:p-4 shadow-hard transition-all duration-200 ${
        isPending ? "opacity-80" : "opacity-100"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Label & Active Month Display */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-md bg-pulpen border-2 border-tinta flex items-center justify-center shrink-0">
            <PiCalendarBlankBold className="text-xl text-tinta" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-tinta-pudar uppercase tracking-wider block">
              Periode Laporan
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-lg md:text-xl text-tinta leading-tight">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              {isPending ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pulpen text-white border border-tinta flex items-center gap-1 animate-pulse">
                  <PiSpinnerGapBold className="animate-spin text-xs" />
                  <span>Memuat...</span>
                </span>
              ) : isViewingCurrentMonth ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cendol/20 text-cendol border border-cendol/40">
                  Bulan Ini
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-kuning text-karbon border border-karbon font-bold">
                  Arsip
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Controls Group */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          {/* Baris 1 di Mobile: Panah Kiri, Bulan, Tahun, Panah Kanan (Memenuhi 1 Baris Penuh 100%) */}
          <div className="w-full sm:w-auto flex items-center gap-1.5">
            {/* Tombol Panah Mundur */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={isPending}
              title="Bulan Sebelumnya"
              className="bg-kertas border-2 border-tinta text-tinta hover:bg-pulpen hover:text-white disabled:opacity-50 h-11 w-11 shrink-0 rounded-md flex items-center justify-center transition-colors font-bold shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              <PiCaretLeftBold className="text-lg" />
            </button>

            {/* Dropdown Pilihan Bulan (flex-1 memenuhi sisa ruang baris) */}
            <select
              value={month}
              onChange={handleMonthSelect}
              disabled={isPending}
              aria-label="Pilih Bulan"
              className="bg-kertas border-2 border-tinta text-tinta rounded-md h-11 px-3 font-bold text-sm focus:ring-0 focus:shadow-[2px_2px_0_0_var(--pulpen)] cursor-pointer flex-1 min-w-0"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            {/* Dropdown Pilihan Tahun (lebar w-28 pas agar tahun tidak tertutup) */}
            <select
              value={year}
              onChange={handleYearSelect}
              disabled={isPending}
              aria-label="Pilih Tahun"
              className="bg-kertas border-2 border-tinta text-tinta rounded-md h-11 px-3 font-bold text-sm focus:ring-0 focus:shadow-[2px_2px_0_0_var(--pulpen)] cursor-pointer w-28 shrink-0"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* Tombol Panah Maju */}
            <button
              type="button"
              onClick={handleNext}
              disabled={isPending}
              title="Bulan Berikutnya"
              className="bg-kertas border-2 border-tinta text-tinta hover:bg-pulpen hover:text-white disabled:opacity-50 h-11 w-11 shrink-0 rounded-md flex items-center justify-center transition-colors font-bold shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              <PiCaretRightBold className="text-lg" />
            </button>
          </div>

          {/* Baris 2 di Mobile / Sebelah Kanan di Desktop: Button "Bulan Ini" Memenuhi 1 Baris Penuh di Mobile */}
          {!isViewingCurrentMonth && (
            <button
              type="button"
              onClick={handleResetCurrentMonth}
              disabled={isPending}
              className="w-full sm:w-auto h-11 px-4 flex items-center justify-center gap-2 bg-pulpen text-white font-bold text-sm border-2 border-tinta rounded-md shadow-hard-sm hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all shrink-0 cursor-pointer"
            >
              {isPending ? (
                <PiSpinnerGapBold className="animate-spin text-base" />
              ) : (
                <PiArrowCounterClockwiseBold className="text-base" />
              )}
              <span>Bulan Ini</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar visual saat pergantian periode sedang diproses */}
      {isPending && (
        <div className="w-full h-1 bg-pulpen/40 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-kuning rounded-full animate-[pulse_1s_ease-in-out_infinite] w-full" />
        </div>
      )}
    </div>
  );
}
