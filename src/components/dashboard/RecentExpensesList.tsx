import Link from "next/link";
import { formatRupiah } from "@/lib/money";
import { formatDate } from "@/lib/date";
import { getCategoryById } from "@/lib/categories";
import type { CustomCategoryRecord } from "@/actions/categories";
import type { ExpenseRecord } from "@/types/expense";

interface RecentExpensesListProps {
  expenses: ExpenseRecord[];
  customCategories?: CustomCategoryRecord[];
}

export function RecentExpensesList({
  expenses,
  customCategories = [],
}: RecentExpensesListProps) {
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
          const cat = getCategoryById(e.category_id, customCategories);
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
                  {formatDate(e.expense_date)}
                </span>
              </div>

              <span className="font-bold text-sm tabular-nums text-tinta shrink-0 ml-2 whitespace-nowrap group-hover:text-kuning transition-colors">
                {formatRupiah(e.amount)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
