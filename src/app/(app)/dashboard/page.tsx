import Link from "next/link";
import { PiCameraBold, PiPlusBold } from "react-icons/pi";
import { getDashboardSummary } from "@/actions/dashboard";
import { HeroNota } from "@/components/dashboard/HeroNota";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { RecentExpensesList } from "@/components/dashboard/RecentExpensesList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Beranda — Boncos",
};

export default async function DashboardPage() {
  const summaryRes = await getDashboardSummary();
  const data = summaryRes.ok && summaryRes.data ? summaryRes.data : null;

  const currentTotal = data?.currentMonthTotal || 0;
  const topExpenses = data?.topExpenses || [];
  const recentExpenses = data?.recentExpenses || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const diffAmount = data?.diffAmount || 0;
  const diffType = data?.diffType || "same";

  return (
    <main className="space-y-6">
      {/* Top Banner / Actions for Mobile */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-tinta">
            Catatan Jajan
          </h1>
          <p className="text-xs md:text-sm text-tinta-pudar mt-0.5">
            Pantau boncosmu bulan ini sebelum kantong jebol.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/expenses/new?tab=scan"
            className="bg-kuning text-karbon font-bold border-2 border-karbon rounded-md shadow-hard min-h-11 px-4 flex items-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow]"
          >
            <PiCameraBold className="text-xl text-karbon" />
            <span className="hidden sm:inline text-karbon">Baca Struk</span>
          </Link>
          <Link
            href="/expenses/new?tab=manual"
            className="bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-4 flex items-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow]"
          >
            <PiPlusBold className="text-xl" />
            <span className="hidden sm:inline">Isi Manual</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Desktop 5/12 Left, 7/12 Right (DESIGN.md Section 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Nota Hero (lg:col-span-5) */}
        <div className="lg:col-span-5">
          <HeroNota
            topExpenses={topExpenses}
            total={currentTotal}
            diffAmount={diffAmount}
            diffType={diffType}
          />
        </div>

        {/* Kolom Kanan: Kategori + Terakhir (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <CategoryBreakdownChart
            items={categoryBreakdown}
            total={currentTotal}
          />
          <RecentExpensesList expenses={recentExpenses} />
        </div>
      </div>
    </main>
  );
}
