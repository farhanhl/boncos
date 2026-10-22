import {
  PiCalendarCheckBold,
  PiCalendarBlankBold,
  PiReceiptBold,
} from "react-icons/pi";
import { formatRupiah } from "@/lib/money";
import { formatDateIndonesian } from "@/lib/date";
import type { PeakSpendingDay } from "@/lib/dashboard-stats";

interface PeakSpendingDayCardProps {
  peakDay: PeakSpendingDay | null | undefined;
  monthTotal: number;
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
  const [y, m] = monthStr.split("-");
  const idx = parseInt(m || "1", 10) - 1;
  if (MONTH_NAMES[idx]) {
    return `${MONTH_NAMES[idx]} ${y}`;
  }
  return "bulan ini";
}

export function PeakSpendingDayCard({
  peakDay,
  monthTotal,
  month,
}: PeakSpendingDayCardProps) {
  const monthLabel = getMonthLabel(month);

  if (!peakDay || peakDay.total === 0) {
    return (
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-5 sm:p-6 shadow-hard text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-karbon border-2 border-tinta/30 flex items-center justify-center mx-auto text-tinta-pudar text-lg">
          <PiCalendarBlankBold className="w-5 h-5" />
        </div>
        <h3 className="font-display text-xl text-tinta">Hari Pengeluaran Terbesar</h3>
        <p className="text-xs text-tinta-pudar max-w-xs mx-auto">
          Belum ada pengeluaran yang tercatat pada {monthLabel}.
        </p>
      </div>
    );
  }

  const percentage =
    monthTotal > 0 ? Math.round((peakDay.total / monthTotal) * 100) : 0;
  const clampedPercent = Math.min(100, Math.max(0, percentage));

  return (
    <div className="bg-kertas border-2 border-tinta rounded-[10px] p-5 sm:p-6 shadow-hard space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-tinta/30">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xl text-tinta">
            Hari Pengeluaran Terbesar
          </h3>
        </div>
      </div>

      {/* Box Utama: Tanggal & Nominal */}
      <div className="bg-karbon/60 border-2 border-tinta/30 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-tinta">
          <PiCalendarCheckBold className="w-4 h-4 text-kuning shrink-0" />
          <span>
            {formatDateIndonesian(peakDay.date, {
              withDay: true,
              monthFormat: "long",
            })}
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <span className="text-xs font-semibold text-tinta-pudar">
            Total hari ini
          </span>
          <span className="font-display text-2xl sm:text-3xl text-kuning tabular-nums">
            {formatRupiah(peakDay.total)}
          </span>
        </div>
      </div>

      {/* Progress Bar Porsi Bulanan */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-tinta-pudar">
            Porsi dari total {monthLabel}
          </span>
          <span className="font-bold text-tinta tabular-nums">
            {percentage}%
          </span>
        </div>
        <div className="h-2.5 w-full bg-karbon rounded-full border border-tinta/30 overflow-hidden">
          <div
            style={{ width: `${clampedPercent}%` }}
            className="h-full bg-stempel border-r border-tinta"
          />
        </div>
      </div>

      {/* Ringkasan Detail Transaksi */}
      <div className="space-y-1.5 pt-2 border-t-2 border-dashed border-tinta/20 text-xs">
        <div className="flex items-center justify-between py-1">
          <span className="text-tinta-pudar">Jumlah transaksi</span>
          <span className="font-bold text-tinta tabular-nums">
            {peakDay.count} transaksi
          </span>
        </div>

        {peakDay.topExpenseName && (
          <div className="flex items-center justify-between py-1 border-t border-dashed border-tinta/10">
            <span className="text-tinta-pudar shrink-0 mr-2 flex items-center gap-1">
              <PiReceiptBold className="w-3.5 h-3.5 text-tinta-pudar shrink-0" />
              <span>Transaksi terbesar</span>
            </span>
            <span className="font-bold text-tinta truncate text-right">
              {peakDay.topExpenseName}
              {peakDay.topExpenseAmount
                ? ` (${formatRupiah(peakDay.topExpenseAmount)})`
                : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
