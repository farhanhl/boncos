import Link from "next/link";
import { formatRupiah } from "@/lib/money";
import { getCategoryById } from "@/lib/categories";
import type { ExpenseRecord } from "@/types/expense";

interface RecentExpensesListProps {
  expenses: ExpenseRecord[];
}

export function RecentExpensesList({ expenses }: RecentExpensesListProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard text-center text-tinta-pudar text-sm">
        Belum ada transaksi terakhir.
      </div>
    );
  }

  return (
    <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard space-y-3">
      <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-tinta/30">
        <h3 className="font-display text-xl text-tinta">Terakhir</h3>
        <Link
          href="/expenses"
          className="text-xs font-bold text-kuning underline hover:text-white"
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
              className="flex items-center justify-between py-2.5 hover:bg-karbon/30 transition-colors group px-1"
            >
              <div className="flex items-center gap-3 truncate">
                <span
                  style={{ backgroundColor: cat.color }}
                  className="w-3 h-3 rounded-full border border-tinta shrink-0"
                />
                <span className="font-bold text-sm text-tinta truncate group-hover:text-pulpen">
                  {e.name}
                </span>
                <span className="text-xs text-tinta-pudar shrink-0">
                  {e.expense_date}
                </span>
              </div>

              <span className="font-bold text-sm tabular-nums text-tinta shrink-0 ml-2">
                {formatRupiah(e.amount)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
