import Link from "next/link";
import { formatRupiah } from "@/lib/money";
import { getCategoryById } from "@/lib/categories";
import type { ExpenseRecord } from "@/types/expense";

interface RecentExpensesListProps {
  expenses: ExpenseRecord[];
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatHumanDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;

  const y = parts[0]!;
  const m = parts[1]!;
  const d = parts[2]!;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (dateStr === todayStr) {
    return "Hari ini";
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  if (dateStr === yesterdayStr) {
    return "Kemarin";
  }

  const mIdx = parseInt(m, 10) - 1;
  const monthName = SHORT_MONTHS[mIdx] || m;
  const dayNum = parseInt(d, 10);

  // If different year, show year too
  if (parseInt(y, 10) !== now.getFullYear()) {
    return `${dayNum} ${monthName} ${y}`;
  }
  return `${dayNum} ${monthName}`;
}

export function RecentExpensesList({ expenses }: RecentExpensesListProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard text-center space-y-2">
        <div className="text-2xl">⚡</div>
        <div className="font-bold text-sm text-tinta">Belum ada transaksi terakhir</div>
        <p className="text-xs text-tinta-pudar max-w-xs mx-auto">
          Catat jajan atau scan struk untuk melihat aktivitas keuangan terbarumu di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard space-y-3">
      <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-tinta/30">
        <h3 className="font-display text-xl text-tinta">Terakhir</h3>
        <Link
          href="/expenses"
          className="text-xs font-bold text-kuning underline hover:text-white transition-colors"
        >
          Lihat Semua →
        </Link>
      </div>

      <div className="divide-y-2 divide-dashed divide-tinta/20">
        {expenses.map((e) => {
          const cat = getCategoryById(e.category_id);
          return (
            <Link
              key={e.id}
              href={`/expenses/${e.id}`}
              className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded hover:bg-karbon/50 transition-colors group"
            >
              <div className="flex items-center gap-3 truncate flex-1 min-w-0 mr-2">
                <span
                  style={{ backgroundColor: cat.color }}
                  className="w-3 h-3 rounded-full border border-tinta shrink-0"
                />
                <span className="font-bold text-sm text-tinta truncate group-hover:text-kuning transition-colors">
                  {e.name}
                </span>
                <span className="text-xs text-tinta-pudar shrink-0 bg-karbon/40 px-1.5 py-0.5 rounded border border-tinta/20">
                  {formatHumanDate(e.expense_date)}
                </span>
              </div>

              <span className="font-bold text-sm tabular-nums text-tinta shrink-0 ml-2 group-hover:text-kuning transition-colors">
                {formatRupiah(e.amount)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
