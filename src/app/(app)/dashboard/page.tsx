import { getDashboardSummary } from "@/actions/dashboard";
import { HeroNota } from "@/components/dashboard/HeroNota";
import { BudgetProgressCard } from "@/components/dashboard/BudgetProgressCard";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { RecentExpensesList } from "@/components/dashboard/RecentExpensesList";
import { MonthYearPicker } from "@/components/dashboard/MonthYearPicker";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — Boncos",
};

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = await searchParams;
  const targetMonth = resolvedParams.month;

  const summaryRes = await getDashboardSummary(targetMonth);
  const data = summaryRes.ok && summaryRes.data ? summaryRes.data : null;

  const activeMonth = data?.currentMonth || targetMonth || new Date().toISOString().slice(0, 7);
  const currentTotal = data?.currentMonthTotal || 0;
  const topExpenses = data?.topExpenses || [];
  const recentExpenses = data?.recentExpenses || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const diffAmount = data?.diffAmount || 0;
  const diffType = data?.diffType || "same";

  return (
    <main className="space-y-6">
      {/* Top Banner */}
      <div className="text-center sm:text-left">
        <h1 className="font-display text-3xl md:text-4xl text-tinta">
          Boncos
        </h1>
        <p className="text-xs md:text-sm text-tinta-pudar mt-0.5">
          Pantau boncosmu bulan ini sebelum kantong jebol.
        </p>
      </div>

      {/* Month & Year Filter Picker */}
      <MonthYearPicker currentMonth={activeMonth} />

      {/* Main Grid: Desktop 5/12 Left, 7/12 Right (DESIGN.md Section 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Nota Hero (lg:col-span-5) */}
        <div className="lg:col-span-5">
          <HeroNota
            topExpenses={topExpenses}
            total={currentTotal}
            diffAmount={diffAmount}
            diffType={diffType}
            month={activeMonth}
          />
        </div>

        {/* Kolom Kanan: Target Budget + Kategori + Terakhir (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <BudgetProgressCard
            currentTotal={currentTotal}
            initialBudget={data?.monthlyBudget || 0}
          />
          <CategoryBreakdownChart
            items={categoryBreakdown}
            total={currentTotal}
          />
          <RecentExpensesList
            expenses={recentExpenses}
            customCategories={data?.customCategories || []}
          />
        </div>
      </div>
    </main>
  );
}
