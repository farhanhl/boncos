import { formatRupiah } from "@/lib/money";
import type { ExpenseRecord } from "@/types/expense";

interface HeroNotaProps {
  topExpenses: ExpenseRecord[];
  total: number;
  diffAmount: number;
  diffType: "boncos" | "hemat" | "same";
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

export function HeroNota({
  topExpenses,
  total,
  diffAmount,
  diffType,
  month,
}: HeroNotaProps) {
  let periodTitle = "Nota Bulan Ini";
  if (month) {
    const [y, m] = month.split("-");
    const mIdx = parseInt(m || "1", 10) - 1;
    if (MONTH_NAMES[mIdx]) {
      periodTitle = `Nota ${MONTH_NAMES[mIdx]} ${y}`;
    }
  }

  return (
    <div className="relative bg-kertas-nota border-2 border-tinta-dark rounded-t-[10px] p-6 shadow-hard w-full max-w-lg mx-auto text-tinta-dark">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pb-3 mb-3 border-b-2 border-dashed border-tinta-dark/30">
        <h2 className="font-display text-xl sm:text-2xl text-tinta-dark">
          {periodTitle}
        </h2>
        <span className="text-xs font-bold text-tinta-dark/70 uppercase tracking-wider shrink-0">
          Pengeluaran Terbesar
        </span>
      </div>

      {/* Daftar Baris Pengeluaran Terbesar */}
      {topExpenses.length === 0 ? (
        <div className="py-8 text-center text-tinta-dark/60 text-sm">
          Belum ada jajan tercatat pada periode ini.
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {topExpenses.map((e) => (
            <div
              key={e.id}
              className="flex justify-between items-center text-sm py-1.5 border-b border-dashed border-tinta-dark/20"
            >
              <span className="font-semibold text-tinta-dark truncate max-w-[200px]">
                {e.name}
              </span>
              <span className="font-bold tabular-nums text-tinta-dark">
                {formatRupiah(e.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Total Section + Stempel Perbandingan Bulan Lalu */}
      <div className="pt-4 border-t-2 border-dashed border-tinta-dark/40 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-tinta-dark/70 uppercase tracking-wider">
            Total
          </span>
          <span className="font-display text-3xl md:text-4xl text-tinta-dark tabular-nums">
            {formatRupiah(total)}
          </span>
        </div>

        {/* Stempel perbandingan (DESIGN.md 5.1: miring -3°) */}
        {total > 0 && (
          <div className="self-end mt-1">
            {diffType === "boncos" && (
              <span className="inline-block px-2.5 py-0.5 text-xs font-bold text-stempel border-2 border-stempel bg-stempel/10 rounded-sm -rotate-3 shadow-hard-sm">
                Lebih boncos {formatRupiah(diffAmount)} dari bulan lalu
              </span>
            )}
            {diffType === "hemat" && (
              <span className="inline-block px-2.5 py-0.5 text-xs font-bold text-cendol border-2 border-cendol bg-cendol/20 rounded-sm -rotate-3 shadow-hard-sm">
                Lebih hemat {formatRupiah(diffAmount)} dari bulan lalu
              </span>
            )}
            {diffType === "same" && (
              <span className="inline-block px-2.5 py-0.5 text-xs font-bold text-tinta-dark/60 border-2 border-tinta-dark/30 rounded-sm -rotate-3">
                Sama persis dengan bulan lalu
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tepi Bawah Bergerigi Seperti Sobekan Nota (DESIGN.md 5.1 SVG) */}
      <div className="absolute -bottom-2.5 left-0 right-0 h-2.5 flex overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="10"
            viewBox="0 0 24 10"
            className="shrink-0"
          >
            <path d="M0 0H24L12 9Z" fill="#FCF1D0" />
            <path d="M0 0L12 9L24 0" fill="none" stroke="#010736" strokeWidth="2" />
          </svg>
        ))}
      </div>
    </div>
  );
}
