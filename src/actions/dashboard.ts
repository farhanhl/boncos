"use server";

import { getCurrentUser } from "@/lib/firebase/session";
import { userCol } from "@/lib/firebase/admin";
import { getCategoryById } from "@/lib/categories";
import type { ExpenseRecord } from "@/types/expense";

export interface CategorySummaryItem {
  categoryId: string;
  name: string;
  color: string;
  total: number;
  count: number;
}

export interface DashboardSummaryData {
  currentMonth: string;
  currentMonthTotal: number;
  lastMonthTotal: number;
  diffAmount: number;
  diffType: "boncos" | "hemat" | "same";
  topExpenses: ExpenseRecord[];
  recentExpenses: ExpenseRecord[];
  categoryBreakdown: CategorySummaryItem[];
}

export async function getDashboardSummary(
  targetMonth?: string
): Promise<{ ok: boolean; data?: DashboardSummaryData; message?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, message: "Silakan masuk terlebih dahulu." };
    }

    const now = new Date();
    const currentMonth = targetMonth || now.toISOString().slice(0, 7);

    // Compute previous month string 'YYYY-MM'
    const [yStr, mStr] = currentMonth.split("-");
    const y = parseInt(yStr || "2026", 10);
    const m = parseInt(mStr || "10", 10);
    const prevDate = new Date(Date.UTC(y, m - 2, 1));
    const lastMonth = prevDate.toISOString().slice(0, 7);

    const expensesCol = userCol(user.uid, "expenses");

    // Fetch this month expenses (single-field query on 'month' - no composite index required)
    const thisMonthSnap = await expensesCol
      .where("month", "==", currentMonth)
      .get();

    // Fetch last month expenses
    const lastMonthSnap = await expensesCol
      .where("month", "==", lastMonth)
      .get();

    // Sum last month
    let lastMonthTotal = 0;
    lastMonthSnap.forEach((doc) => {
      lastMonthTotal += doc.data().amount || 0;
    });

    let currentMonthTotal = 0;
    const catMap = new Map<string, { total: number; count: number }>();
    const thisMonthExpenses: ExpenseRecord[] = [];

    thisMonthSnap.forEach((doc) => {
      const d = doc.data();
      const amt = d.amount || 0;
      currentMonthTotal += amt;

      const catId = d.category_id || "other";
      const existing = catMap.get(catId) || { total: 0, count: 0 };
      catMap.set(catId, {
        total: existing.total + amt,
        count: existing.count + 1,
      });

      thisMonthExpenses.push({
        id: doc.id,
        name: d.name,
        name_lower: d.name_lower,
        amount: amt,
        currency: d.currency || "IDR",
        expense_date: d.expense_date,
        month: d.month,
        category_id: d.category_id || null,
        note: d.note || null,
        source: d.source || "manual",
        extraction_confidence: d.extraction_confidence ?? null,
        created_at: d.created_at?.toDate ? d.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: d.updated_at?.toDate ? d.updated_at.toDate().toISOString() : new Date().toISOString(),
      });
    });

    // Top 4 expenses for hero nota (sorted by amount descending in memory)
    const topExpenses = [...thisMonthExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    // Recent 5 expenses (try fetching recent, or fallback to in-memory)
    let recentExpenses: ExpenseRecord[] = [];
    try {
      const recentExpensesSnap = await expensesCol
        .orderBy("expense_date", "desc")
        .limit(5)
        .get();

      recentExpenses = recentExpensesSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name,
          name_lower: d.name_lower,
          amount: d.amount || 0,
          currency: d.currency || "IDR",
          expense_date: d.expense_date,
          month: d.month,
          category_id: d.category_id || null,
          note: d.note || null,
          source: d.source || "manual",
          extraction_confidence: d.extraction_confidence ?? null,
          created_at: d.created_at?.toDate ? d.created_at.toDate().toISOString() : new Date().toISOString(),
          updated_at: d.updated_at?.toDate ? d.updated_at.toDate().toISOString() : new Date().toISOString(),
        };
      });
    } catch {
      recentExpenses = [...thisMonthExpenses]
        .sort((a, b) => b.expense_date.localeCompare(a.expense_date))
        .slice(0, 5);
    }

    // Breakdown array sorted by total
    const categoryBreakdown: CategorySummaryItem[] = Array.from(catMap.entries())
      .map(([catId, stats]) => {
        const catInfo = getCategoryById(catId);
        return {
          categoryId: catId,
          name: catInfo.name,
          color: catInfo.color,
          total: stats.total,
          count: stats.count,
        };
      })
      .sort((a, b) => b.total - a.total);

    const diff = currentMonthTotal - lastMonthTotal;
    const diffType = diff > 0 ? "boncos" : diff < 0 ? "hemat" : "same";

    return {
      ok: true,
      data: {
        currentMonth,
        currentMonthTotal,
        lastMonthTotal,
        diffAmount: Math.abs(diff),
        diffType,
        topExpenses,
        recentExpenses,
        categoryBreakdown,
      },
    };
  } catch (err) {
    console.error("[getDashboardSummary Error]:", err);
    return { ok: false, message: "Gagal memuat ringkasan dashboard." };
  }
}
