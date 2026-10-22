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
