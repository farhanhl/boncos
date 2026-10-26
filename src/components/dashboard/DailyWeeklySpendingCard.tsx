"use client";

import { useState } from "react";
import {
  PiCalendarBlankBold,
  PiChartBarBold,
  PiFlameBold,
  PiCalendarCheckBold,
  PiReceiptBold,
} from "react-icons/pi";
import { formatRupiah, formatRupiahCompact } from "@/lib/money";
import type {
  DailySpendingSummary,
  WeeklySpendingSummary,
} from "@/lib/dashboard-stats";

interface DailyWeeklySpendingCardProps {
  dailySpending?: DailySpendingSummary;
  weeklySpending?: WeeklySpendingSummary;
  month?: string;
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

function getMonthLabel(monthStr?: string): string {
  if (!monthStr) return "bulan ini";
  const [, m] = monthStr.split("-");
  const idx = parseInt(m || "1", 10) - 1;
  const monthName = MONTH_NAMES[idx] || "bulan ini";
  const [y] = (monthStr || "").split("-");
  return `${monthName} ${y || ""}`.trim();
}

export function DailyWeeklySpendingCard({
  dailySpending,
  weeklySpending,
  month,
}: DailyWeeklySpendingCardProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");
  const [showAllDays, setShowAllDays] = useState<boolean>(false);

  const monthLabel = getMonthLabel(month);
  const totalMonth = dailySpending?.total || weeklySpending?.total || 0;

  // Peak amounts for scaling horizontal bars
  const maxDailyTotal = dailySpending?.peakDay?.total || 1;
  const maxWeeklyTotal = weeklySpending?.peakWeek?.total || 1;

  // Daily items to show
  const dailyItems = showAllDays
    ? dailySpending?.items || []
    : (dailySpending?.activeItems && dailySpending.activeItems.length > 0)
    ? dailySpending.activeItems
    : dailySpending?.items || [];

  return (
    <div className="bg-kertas border-2 border-tinta rounded-[10px] p-5 sm:p-6 shadow-hard space-y-5">
      {/* Header & Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-dashed border-tinta/30">
        <div>
          <h3 className="font-display text-xl text-tinta">
            Pengeluaran Per Hari & Minggu
          </h3>
          <p className="text-xs text-tinta-pudar mt-0.5">
            Tren pengeluaran pada {monthLabel}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="inline-flex p-1 bg-karbon/70 border-2 border-tinta/30 rounded-lg shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "daily"
                ? "bg-kuning text-karbon shadow-hard-sm border-2 border-karbon"
                : "text-tinta-pudar border-2 border-transparent hover:text-tinta"
            }`}
          >
            <PiCalendarBlankBold className="w-4 h-4 shrink-0" />
            <span>Per Hari</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("weekly")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "weekly"
                ? "bg-kuning text-karbon shadow-hard-sm border-2 border-karbon"
                : "text-tinta-pudar border-2 border-transparent hover:text-tinta"
            }`}
          >
            <PiChartBarBold className="w-4 h-4 shrink-0" />
            <span>Per Minggu</span>
          </button>
        </div>
      </div>

      {/* Content: TAB PER HARI */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          {/* KPI Mini Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Box 1: Rata-rata per hari */}
            <div className="bg-karbon/50 border-2 border-tinta/20 rounded-lg p-3 space-y-1">
              <span className="text-[11px] font-bold text-tinta-pudar uppercase tracking-wider block">
                Rata-rata / Hari
              </span>
              <div className="font-display text-lg sm:text-xl text-kuning tabular-nums">
                {formatRupiah(dailySpending?.averagePerDay || 0)}
              </div>
            </div>

            {/* Box 2: Hari Paling Boncos */}
            <div className="bg-karbon/50 border-2 border-tinta/20 rounded-lg p-3 space-y-1">
              <span className="text-[11px] font-bold text-tinta-pudar uppercase tracking-wider block">
                Hari Paling Boncos
              </span>
              <div className="font-display text-lg sm:text-xl text-stempel tabular-nums truncate">
                {dailySpending?.peakDay
                  ? formatRupiah(dailySpending.peakDay.total)
                  : "-"}
              </div>
              {dailySpending?.peakDay && (
                <span className="text-[10px] text-tinta-pudar block truncate">
                  {dailySpending.peakDay.dayName}, {dailySpending.peakDay.date.slice(8, 10)} {monthLabel.slice(0, 3)}
                </span>
              )}
            </div>

            {/* Box 3: Hari Aktif */}
            <div className="bg-karbon/50 border-2 border-tinta/20 rounded-lg p-3 space-y-1">
              <span className="text-[11px] font-bold text-tinta-pudar uppercase tracking-wider block">
                Hari Ada Jajan
              </span>
              <div className="font-display text-lg sm:text-xl text-tinta tabular-nums">
                {dailySpending?.activeDaysCount || 0}{" "}
                <span className="text-xs font-normal text-tinta-pudar font-sans">
                  / {dailySpending?.totalDays || 30} hari
                </span>
              </div>
            </div>
          </div>

          {/* Sub-header Filter (Hanya Hari Aktif vs Semua Hari) */}
          {dailySpending && dailySpending.activeDaysCount > 0 && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="font-bold text-tinta-pudar">
                {showAllDays
                  ? `Menampilkan seluruh ${dailySpending.totalDays} hari`
                  : `Menampilkan ${dailySpending.activeDaysCount} hari bertransaksi (terbanyak ke sedikit)`}
              </span>
              <button
                type="button"
                onClick={() => setShowAllDays((prev) => !prev)}
                className="text-xs font-bold text-kuning underline hover:text-white cursor-pointer"
              >
                {showAllDays ? "Tampilkan Hari Aktif Saja" : "Tampilkan Semua Hari"}
              </button>
            </div>
          )}

          {/* List of Days */}
          {totalMonth === 0 || !dailySpending || dailySpending.activeDaysCount === 0 ? (
            <div className="p-6 text-center bg-karbon/30 rounded-lg border-2 border-dashed border-tinta/20 space-y-1.5">
              <PiCalendarCheckBold className="w-8 h-8 mx-auto text-tinta-pudar" />
              <p className="font-bold text-sm text-tinta">Belum ada pengeluaran harian</p>
              <p className="text-xs text-tinta-pudar max-w-xs mx-auto">
                Pengeluaran per hari akan muncul secara detail setelah ada transaksi pada {monthLabel}.
              </p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-dashed divide-tinta/10">
              {dailyItems.map((item) => {
                const isPeak =
                  dailySpending.peakDay &&
                  dailySpending.peakDay.date === item.date &&
                  item.total > 0;
                const barWidthPercent =
                  maxDailyTotal > 0
                    ? Math.max(item.total > 0 ? 8 : 0, Math.round((item.total / maxDailyTotal) * 100))
                    : 0;

                const dayDateNum = item.date.slice(8, 10);

                return (
                  <div key={item.date} className="pt-2 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-tinta">
                          {item.dayName}, {dayDateNum} {monthLabel.slice(0, 3)}
                        </span>
                        {isPeak && (
                          <span className="inline-flex items-center gap-0.5 bg-stempel text-white font-bold text-[10px] px-1.5 py-0.2 rounded-sm shadow-hard-sm">
                            <PiFlameBold className="w-3 h-3" />
                            Paling Boncos
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.count > 0 && (
                          <span className="text-[11px] font-normal text-tinta-pudar hidden sm:inline">
                            {item.count} transaksi
                          </span>
                        )}
                        <span className="tabular-nums text-tinta">
                          {formatRupiah(item.total)}
                        </span>
                      </div>
                    </div>

                    {/* Bar Visual */}
                    <div className="h-4 w-full bg-karbon/40 rounded-sm border border-tinta/20 overflow-hidden flex items-center">
                      <div
                        style={{ width: `${barWidthPercent}%` }}
                        className={`h-full flex items-center px-1.5 text-[10px] font-bold text-white transition-all duration-300 ${
                          isPeak ? "bg-stempel" : item.total > 0 ? "bg-pulpen" : "bg-transparent"
                        }`}
                      >
                        {item.total > 0 && barWidthPercent > 25 && (
                          <span className="truncate">{formatRupiahCompact(item.total)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content: TAB PER MINGGU */}
      {activeTab === "weekly" && (
        <div className="space-y-4">
          {/* KPI Mini Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Box 1: Rata-rata per minggu */}
            <div className="bg-karbon/50 border-2 border-tinta/20 rounded-lg p-3 space-y-1">
              <span className="text-[11px] font-bold text-tinta-pudar uppercase tracking-wider block">
                Rata-rata / Minggu
              </span>
              <div className="font-display text-lg sm:text-xl text-kuning tabular-nums">
                {formatRupiah(weeklySpending?.averagePerWeek || 0)}
              </div>
            </div>

            {/* Box 2: Minggu Paling Boncos */}
            <div className="bg-karbon/50 border-2 border-tinta/20 rounded-lg p-3 space-y-1">
              <span className="text-[11px] font-bold text-tinta-pudar uppercase tracking-wider block">
                Minggu Paling Boncos
              </span>
              <div className="font-display text-lg sm:text-xl text-stempel tabular-nums truncate">
                {weeklySpending?.peakWeek
                  ? formatRupiah(weeklySpending.peakWeek.total)
                  : "-"}
              </div>
              {weeklySpending?.peakWeek && (
                <span className="text-[10px] text-tinta-pudar block truncate">
                  {weeklySpending.peakWeek.label}
                </span>
              )}
            </div>
          </div>

          {/* List of Weeks */}
          {totalMonth === 0 || !weeklySpending || weeklySpending.items.length === 0 ? (
            <div className="p-6 text-center bg-karbon/30 rounded-lg border-2 border-dashed border-tinta/20 space-y-1.5">
              <PiReceiptBold className="w-8 h-8 mx-auto text-tinta-pudar" />
              <p className="font-bold text-sm text-tinta">Belum ada pengeluaran mingguan</p>
              <p className="text-xs text-tinta-pudar max-w-xs mx-auto">
                Rincian mingguan akan otomatis terhitung saat ada pengeluaran di {monthLabel}.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {weeklySpending.items.map((week) => {
                const isPeak =
                  weeklySpending.peakWeek &&
                  weeklySpending.peakWeek.weekNumber === week.weekNumber &&
                  week.total > 0;
                const barWidthPercent =
                  maxWeeklyTotal > 0
                    ? Math.max(week.total > 0 ? 12 : 0, Math.round((week.total / maxWeeklyTotal) * 100))
                    : 0;

                return (
                  <div
                    key={week.weekNumber}
                    className={`p-3 rounded-lg border-2 transition-all space-y-2 ${
                      isPeak
                        ? "bg-karbon/80 border-stempel/60 shadow-hard-sm"
                        : "bg-karbon/40 border-tinta/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-tinta font-bold text-sm">
                          {week.label}
                        </span>
                        {isPeak && (
                          <span className="inline-flex items-center gap-0.5 bg-stempel text-white font-bold text-[10px] px-1.5 py-0.5 rounded-sm">
                            <PiFlameBold className="w-3 h-3" />
                            Paling Boncos
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-display text-sm sm:text-base text-kuning tabular-nums block">
                          {formatRupiah(week.total)}
                        </span>
                        <span className="text-[11px] font-normal text-tinta-pudar">
                          {week.percentage}% dari total bulan ini
                          {week.count > 0 ? ` · ${week.count} trx` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Visual (DESIGN.md 5.7) */}
                    <div className="h-6 w-full bg-karbon/60 rounded-sm border-2 border-tinta/30 overflow-hidden flex items-center">
                      <div
                        style={{ width: `${barWidthPercent}%` }}
                        className={`h-full border-r-2 border-tinta flex items-center justify-between px-2 text-[11px] font-bold text-white transition-all duration-300 ${
                          isPeak ? "bg-stempel" : week.total > 0 ? "bg-pulpen" : "bg-transparent"
                        }`}
                      >
                        {week.total > 0 && (
                          <>
                            <span className="truncate">
                              {formatRupiahCompact(week.total)}
                            </span>
                            <span className="text-[10px] opacity-90 pl-1">
                              {week.percentage}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

