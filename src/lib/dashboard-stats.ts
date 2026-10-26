/**
 * Pure helper functions for dashboard analytics and statistics.
 */

export interface PeakSpendingDay {
  date: string; // 'YYYY-MM-DD'
  total: number;
  count: number;
  topExpenseName?: string;
  topExpenseAmount?: number;
}

export interface DailySpendingItem {
  date: string; // 'YYYY-MM-DD'
  dayNumber: number; // 1 to 31
  dayName: string; // 'Senin', 'Selasa', etc.
  total: number;
  count: number;
}

export interface DailySpendingSummary {
  items: DailySpendingItem[];
  activeItems: DailySpendingItem[];
  total: number;
  averagePerDay: number;
  activeDaysCount: number;
  totalDays: number;
  peakDay: {
    date: string;
    dayName: string;
    total: number;
  } | null;
}

export interface WeeklySpendingItem {
  weekNumber: number; // 1, 2, 3, 4, 5
  label: string; // 'Minggu 1 (1–7 Okt)'
  shortLabel: string; // 'M1 (1–7)'
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  total: number;
  count: number;
  percentage: number;
}

export interface WeeklySpendingSummary {
  items: WeeklySpendingItem[];
  total: number;
  averagePerWeek: number;
  peakWeek: {
    weekNumber: number;
    label: string;
    total: number;
  } | null;
}

const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const INDONESIAN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Returns total days in a month for a given year.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Calculates daily spending breakdown and statistics for a given month.
 * Pure function with no side effects.
 */
export function calculateDailySpending(
  expenses: Array<{ expense_date: string; amount: number }>,
  targetMonth: string,
  currentDateOverride?: string
): DailySpendingSummary {
  const [yStr, mStr] = (targetMonth || "").split("-");
  const year = parseInt(yStr || "2026", 10);
  const month = parseInt(mStr || "10", 10);
  const totalDays = getDaysInMonth(year, month);

  const dailyMap = new Map<string, { total: number; count: number }>();
  let totalSpending = 0;

  for (const exp of expenses || []) {
    if (!exp.expense_date) continue;
    const amt = typeof exp.amount === "number" && !isNaN(exp.amount) ? exp.amount : 0;
    totalSpending += amt;
    const existing = dailyMap.get(exp.expense_date) || { total: 0, count: 0 };
    dailyMap.set(exp.expense_date, {
      total: existing.total + amt,
      count: existing.count + 1,
    });
  }

  const items: DailySpendingItem[] = [];
  const activeItems: DailySpendingItem[] = [];
  let peakDay: DailySpendingSummary["peakDay"] = null;
  let maxDailyTotal = 0;

  for (let day = 1; day <= totalDays; day++) {
    const dayStr = String(day).padStart(2, "0");
    const mStrPad = String(month).padStart(2, "0");
    const dateStr = `${year}-${mStrPad}-${dayStr}`;

    const dateObj = new Date(`${dateStr}T12:00:00Z`);
    const dayName = INDONESIAN_DAYS[dateObj.getUTCDay()] || "Senin";

    const stat = dailyMap.get(dateStr) || { total: 0, count: 0 };
    const item: DailySpendingItem = {
      date: dateStr,
      dayNumber: day,
      dayName,
      total: stat.total,
      count: stat.count,
    };

    items.push(item);
    if (stat.total > 0) {
      activeItems.push(item);
      if (stat.total > maxDailyTotal) {
        maxDailyTotal = stat.total;
        peakDay = {
          date: dateStr,
          dayName,
          total: stat.total,
        };
      }
    }
  }

  const today = currentDateOverride ? new Date(`${currentDateOverride}T12:00:00Z`) : new Date();
  const currentMonthStr = today.toISOString().slice(0, 7);
  let effectiveDays = totalDays;
  if (targetMonth === currentMonthStr) {
    effectiveDays = Math.min(today.getUTCDate(), totalDays);
  }

  const averagePerDay = Math.round(totalSpending / Math.max(1, effectiveDays));
  activeItems.sort((a, b) => b.total - a.total);

  return {
    items,
    activeItems,
    total: totalSpending,
    averagePerDay,
    activeDaysCount: activeItems.length,
    totalDays,
    peakDay,
  };
}

/**
 * Calculates weekly spending breakdown and statistics for a given month.
 * Pure function with no side effects.
 */
export function calculateWeeklySpending(
  expenses: Array<{ expense_date: string; amount: number }>,
  targetMonth: string,
  currentDateOverride?: string
): WeeklySpendingSummary {
  const [yStr, mStr] = (targetMonth || "").split("-");
  const year = parseInt(yStr || "2026", 10);
  const month = parseInt(mStr || "10", 10);
  const totalDays = getDaysInMonth(year, month);
  const monthNameShort = INDONESIAN_MONTHS_SHORT[month - 1] || "";
  const mStrPad = String(month).padStart(2, "0");

  let totalSpending = 0;
  for (const exp of expenses || []) {
    const amt = typeof exp.amount === "number" && !isNaN(exp.amount) ? exp.amount : 0;
    totalSpending += amt;
  }

  const weekDefinitions: Array<{
    weekNumber: number;
    startDay: number;
    endDay: number;
  }> = [
    { weekNumber: 1, startDay: 1, endDay: 7 },
    { weekNumber: 2, startDay: 8, endDay: 14 },
    { weekNumber: 3, startDay: 15, endDay: 21 },
    { weekNumber: 4, startDay: 22, endDay: 28 },
  ];

  if (totalDays > 28) {
    weekDefinitions.push({
      weekNumber: 5,
      startDay: 29,
      endDay: totalDays,
    });
  }

  const items: WeeklySpendingItem[] = [];
  let peakWeek: WeeklySpendingSummary["peakWeek"] = null;
  let maxWeeklyTotal = 0;

  for (const def of weekDefinitions) {
    const startDate = `${year}-${mStrPad}-${String(def.startDay).padStart(2, "0")}`;
    const endDate = `${year}-${mStrPad}-${String(def.endDay).padStart(2, "0")}`;

    let weekTotal = 0;
    let weekCount = 0;

    for (const exp of expenses || []) {
      if (!exp.expense_date) continue;
      if (exp.expense_date >= startDate && exp.expense_date <= endDate) {
        const amt = typeof exp.amount === "number" && !isNaN(exp.amount) ? exp.amount : 0;
        weekTotal += amt;
        weekCount += 1;
      }
    }

    const percentage = totalSpending > 0 ? Math.round((weekTotal / totalSpending) * 100) : 0;
    const label = `Minggu ${def.weekNumber} (${def.startDay}–${def.endDay} ${monthNameShort})`;
    const shortLabel = `M${def.weekNumber} (${def.startDay}–${def.endDay})`;

    const item: WeeklySpendingItem = {
      weekNumber: def.weekNumber,
      label,
      shortLabel,
      startDate,
      endDate,
      total: weekTotal,
      count: weekCount,
      percentage,
    };

    items.push(item);

    if (weekTotal > maxWeeklyTotal) {
      maxWeeklyTotal = weekTotal;
      peakWeek = {
        weekNumber: def.weekNumber,
        label,
        total: weekTotal,
      };
    }
  }

  const today = currentDateOverride ? new Date(`${currentDateOverride}T12:00:00Z`) : new Date();
  const currentMonthStr = today.toISOString().slice(0, 7);
  let effectiveWeeks = weekDefinitions.length;
  if (targetMonth === currentMonthStr) {
    const elapsedDays = Math.min(today.getUTCDate(), totalDays);
    effectiveWeeks = Math.min(Math.ceil(elapsedDays / 7), weekDefinitions.length);
  }

  const averagePerWeek = Math.round(totalSpending / Math.max(1, effectiveWeeks));

  return {
    items,
    total: totalSpending,
    averagePerWeek,
    peakWeek,
  };
}

/**
 * Calculates the day with the highest total expenses for a given set of expenses in a month.
 * Pure function with no side effects.
 */
export function calculatePeakSpendingDay(
  expenses: Array<{
    expense_date: string;
    amount: number;
    name?: string;
  }>
): PeakSpendingDay | null {
  if (!expenses || expenses.length === 0) return null;

  const dailyMap = new Map<
    string,
    {
      total: number;
      count: number;
      topExpenseName: string;
      topExpenseAmount: number;
    }
  >();

  for (const exp of expenses) {
    const dateKey = exp.expense_date;
    if (!dateKey) continue;

    const amt = typeof exp.amount === "number" && !isNaN(exp.amount) ? exp.amount : 0;
    const current = dailyMap.get(dateKey) || {
      total: 0,
      count: 0,
      topExpenseName: "",
      topExpenseAmount: 0,
    };

    const newTotal = current.total + amt;
    const newCount = current.count + 1;
    let topName = current.topExpenseName;
    let topAmt = current.topExpenseAmount;

    if (amt > topAmt) {
      topAmt = amt;
      topName = exp.name || "";
    }

    dailyMap.set(dateKey, {
      total: newTotal,
      count: newCount,
      topExpenseName: topName,
      topExpenseAmount: topAmt,
    });
  }

  if (dailyMap.size === 0) return null;

  let peakDay: PeakSpendingDay | null = null;
  let maxTotal = -1;

  for (const [date, info] of dailyMap.entries()) {
    if (
      info.total > maxTotal ||
      (info.total === maxTotal && peakDay && date > peakDay.date)
    ) {
      maxTotal = info.total;
      peakDay = {
        date,
        total: info.total,
        count: info.count,
        topExpenseName: info.topExpenseName || undefined,
        topExpenseAmount: info.topExpenseAmount > 0 ? info.topExpenseAmount : undefined,
      };
    }
  }

  return peakDay;
}
