"use client";

import { useState, useSyncExternalStore } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  PiForkKnifeBold,
  PiCookieBold,
  PiCarBold,
  PiShoppingBagBold,
  PiReceiptBold,
  PiGameControllerBold,
  PiHeartbeatBold,
  PiGraduationCapBold,
  PiArrowsLeftRightBold,
  PiTagBold,
  PiDotsThreeOutlineBold,
  PiCaretDownBold,
  PiCaretUpBold,
} from "react-icons/pi";
import { formatRupiah, formatRupiahCompact } from "@/lib/money";
import type { CategorySummaryItem } from "@/actions/dashboard";

interface CategoryBreakdownChartProps {
  items: CategorySummaryItem[];
  total: number;
}

function renderCategoryIcon(iconName?: string) {
  switch (iconName) {
    case "PiForkKnifeBold":
      return <PiForkKnifeBold className="w-3.5 h-3.5" />;
    case "PiCookieBold":
      return <PiCookieBold className="w-3.5 h-3.5" />;
    case "PiCarBold":
      return <PiCarBold className="w-3.5 h-3.5" />;
    case "PiShoppingBagBold":
      return <PiShoppingBagBold className="w-3.5 h-3.5" />;
    case "PiReceiptBold":
      return <PiReceiptBold className="w-3.5 h-3.5" />;
    case "PiGameControllerBold":
      return <PiGameControllerBold className="w-3.5 h-3.5" />;
    case "PiHeartbeatBold":
      return <PiHeartbeatBold className="w-3.5 h-3.5" />;
    case "PiGraduationCapBold":
      return <PiGraduationCapBold className="w-3.5 h-3.5" />;
    case "PiArrowsLeftRightBold":
      return <PiArrowsLeftRightBold className="w-3.5 h-3.5" />;
    case "PiTagBold":
      return <PiTagBold className="w-3.5 h-3.5" />;
    default:
      return <PiDotsThreeOutlineBold className="w-3.5 h-3.5" />;
  }
}

export function CategoryBreakdownChart({
  items,
  total,
}: CategoryBreakdownChartProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) {
    return (
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard text-center space-y-2">
        <div className="text-2xl">📊</div>
        <div className="font-bold text-sm text-tinta">Belum ada data kategori</div>
        <p className="text-xs text-tinta-pudar max-w-xs mx-auto">
          Grafik komposisi pengeluaran akan otomatis muncul begitu kamu mencatat transaksi pada bulan ini.
        </p>
      </div>
    );
  }

  const INITIAL_COUNT = 5;
  const hasMore = items.length > INITIAL_COUNT;
  const displayedItems = isExpanded ? items : items.slice(0, INITIAL_COUNT);

  const activeItem = activeIndex !== null && items[activeIndex] ? items[activeIndex] : null;

  return (
    <div className="bg-kertas border-2 border-tinta rounded-[10px] p-5 sm:p-6 shadow-hard space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-tinta/30">
        <h3 className="font-display text-xl text-tinta">Per Kategori</h3>
        <span className="text-xs font-bold text-tinta-pudar bg-karbon/50 px-2 py-0.5 rounded-full border border-tinta/20">
          {items.length} Kategori
        </span>
      </div>

      {/* Donut Chart Container */}
      <div className="relative w-full h-[220px] flex items-center justify-center">
        {mounted ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const item = payload[0].payload as CategorySummaryItem;
                    const percentage = total > 0 ? Math.round((item.total / total) * 100) : 0;
                    return (
                      <div className="bg-kuning text-karbon border-2 border-karbon rounded-md px-2.5 py-1.5 shadow-hard-sm pointer-events-none z-50">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-karbon shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate max-w-[140px]">{item.name}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-karbon/20 text-xs">
                          <span className="font-display text-sm">{formatRupiah(item.total)}</span>
                          <span className="font-bold text-[11px] bg-karbon text-kuning px-1.5 py-0.2 rounded-xs">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={items}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={items.length > 1 ? 3 : 0}
                stroke="#010736"
                strokeWidth={2}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                cursor="pointer"
              >
                {items.map((cat, idx) => (
                  <Cell
                    key={cat.categoryId}
                    fill={cat.color}
                    className="transition-all duration-200 outline-none"
                    opacity={activeIndex === null || activeIndex === idx ? 1 : 0.45}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-[160px] h-[160px] rounded-full border-4 border-dashed border-tinta/20 animate-pulse flex items-center justify-center" />
        )}

        {/* Center Hole Content (HTML Typography) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center flex flex-col items-center justify-center w-24 select-none">
          {activeItem ? (
            <>
              <span className="text-[10px] font-bold text-tinta-pudar uppercase truncate max-w-full px-1">
                {activeItem.name}
              </span>
              <span className="font-display text-sm sm:text-base text-kuning tabular-nums leading-tight">
                {formatRupiahCompact(activeItem.total)}
              </span>
              <span className="text-[10px] font-bold text-tinta-pudar mt-0.5">
                {total > 0 ? `${Math.round((activeItem.total / total) * 100)}%` : "0%"}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold text-tinta-pudar uppercase">
                Total
              </span>
              <span className="font-display text-sm sm:text-base text-tinta tabular-nums leading-tight">
                {formatRupiahCompact(total)}
              </span>
              <span className="text-[10px] text-tinta-pudar font-semibold mt-0.5">
                {items.length} Kategori
              </span>
            </>
          )}
        </div>
      </div>

      {/* Categories List */}
      <div className="pt-2 border-t-2 border-dashed border-tinta/20 space-y-2">
        <div
          className={`space-y-1.5 divide-y divide-dashed divide-tinta/10 ${
            isExpanded ? "max-h-60 overflow-y-auto pr-1.5" : ""
          }`}
        >
          {displayedItems.map((cat, idx) => {
            const percentage = total > 0 ? Math.round((cat.total / total) * 100) : 0;
            const isHovered = activeIndex === idx;

            return (
              <div
                key={cat.categoryId}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`pt-1.5 first:pt-0 flex items-center justify-between text-xs py-1 px-1.5 rounded transition-colors cursor-pointer ${
                  isHovered ? "bg-karbon/80 border border-tinta/30" : "hover:bg-karbon/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <span
                    style={{ backgroundColor: cat.color }}
                    className="w-5 h-5 rounded-md border border-tinta flex items-center justify-center text-karbon shrink-0"
                  >
                    {renderCategoryIcon(cat.iconName)}
                  </span>
                  <span className={`font-bold truncate ${isHovered ? "text-kuning" : "text-tinta"}`}>
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-tinta-pudar bg-karbon/60 px-1.5 py-0.5 rounded border border-tinta/10">
                    {percentage}%
                  </span>
                  <span className="font-bold tabular-nums text-tinta text-xs">
                    {formatRupiah(cat.total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-1.5 px-3 bg-karbon/40 hover:bg-karbon/70 border border-dashed border-tinta/30 rounded-md text-xs font-bold text-kuning flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-1"
          >
            <span>
              {isExpanded
                ? "Tampilkan Lebih Sedikit"
                : `Lihat Semua (${items.length} Kategori)`}
            </span>
            {isExpanded ? (
              <PiCaretUpBold className="w-3.5 h-3.5" />
            ) : (
              <PiCaretDownBold className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
