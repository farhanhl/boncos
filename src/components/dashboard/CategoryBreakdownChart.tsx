import { formatRupiah, formatRupiahCompact } from "@/lib/money";
import type { CategorySummaryItem } from "@/actions/dashboard";

interface CategoryBreakdownChartProps {
  items: CategorySummaryItem[];
  total: number;
}

export function CategoryBreakdownChart({
  items,
  total,
}: CategoryBreakdownChartProps) {
  if (items.length === 0) {
    return (
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard text-center text-tinta-pudar text-sm">
        Belum ada data kategori untuk bulan ini.
      </div>
    );
  }

  const maxTotal = items[0]?.total || 1;

  return (
    <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard space-y-4">
      <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-tinta/30">
        <h3 className="font-display text-xl text-tinta">Per Kategori</h3>
        <span className="text-xs font-bold text-tinta-pudar">
          {items.length} Kategori
        </span>
      </div>

      <div className="space-y-3">
        {items.map((cat) => {
          const percentage = total > 0 ? Math.round((cat.total / total) * 100) : 0;
          const barWidthPercent = Math.max(12, Math.round((cat.total / maxTotal) * 100));

          return (
            <div key={cat.categoryId} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-tinta">
                <span>{cat.name}</span>
                <span className="tabular-nums">
                  {formatRupiah(cat.total)}{" "}
                  <span className="text-tinta-pudar font-normal">({percentage}%)</span>
                </span>
              </div>

              {/* Horizontal Bar (DESIGN.md 5.7: Batang tebal, warna solid kategori, border 2px tinta) */}
              <div className="h-6 w-full bg-karbon/30 rounded-sm border-2 border-tinta/30 overflow-hidden flex items-center">
                <div
                  style={{
                    width: `${barWidthPercent}%`,
                    backgroundColor: cat.color,
                  }}
                  className="h-full border-r-2 border-tinta flex items-center px-2 text-[11px] font-bold text-tinta truncate transition-all duration-300"
                >
                  {formatRupiahCompact(cat.total)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
