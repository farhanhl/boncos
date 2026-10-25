"use server";

import { getCurrentUser } from "@/lib/firebase/session";
import { userCol } from "@/lib/firebase/admin";
import { getCategoryById } from "@/lib/categories";
import {
  calculatePeakSpendingDay,
  type PeakSpendingDay,
} from "@/lib/dashboard-stats";
import type { CustomCategoryRecord } from "@/actions/categories";
import type { ExpenseRecord } from "@/types/expense";

export type { PeakSpendingDay };

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
  monthlyBudget: number;
  peakSpendingDay: PeakSpendingDay | null;
  customCategories: CustomCategoryRecord[];
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

    // Parallel Firestore reads: all independent queries at once
    const [thisMonthSnap, lastMonthSnap, customCatsSnap, budgetDoc] = await Promise.all([
      expensesCol.where("month", "==", currentMonth).get(),
      expensesCol.where("month", "==", lastMonth).get(),
      userCol(user.uid, "categories").orderBy("created_at", "asc").get().catch(() => null),
      userCol(user.uid, "settings").doc("budget").get().catch(() => null),
    ]);

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

    // Top 5 expenses for hero nota (sorted by amount descending in memory)
    const topExpenses = [...thisMonthExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Recent 5 expenses: derived from this month's data (no extra Firestore query)
    const recentExpenses = [...thisMonthExpenses]
      .sort((a, b) => {
        const dateComp = b.expense_date.localeCompare(a.expense_date);
        if (dateComp !== 0) return dateComp;
        return (b.created_at || "").localeCompare(a.created_at || "");
      })
      .slice(0, 5);

    // Custom categories from parallel fetch
    let customCategories: CustomCategoryRecord[] = [];
    if (customCatsSnap) {
      customCategories = customCatsSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name,
          icon: d.icon || "PiTagBold",
          color: d.color || "#FF9F45",
          created_at: d.created_at?.toDate ? d.created_at.toDate().toISOString() : new Date().toISOString(),
        };
      });
    }

    // Breakdown array sorted by total
    const categoryBreakdown: CategorySummaryItem[] = Array.from(catMap.entries())
      .map(([catId, stats]) => {
        const catInfo = getCategoryById(catId, customCategories);
        return {
          categoryId: catId,
          name: catInfo.name,
          color: catInfo.color,
          total: stats.total,
          count: stats.count,
        };
      })
      .sort((a, b) => b.total - a.total);

    let monthlyBudget = 0;
    if (budgetDoc?.exists) {
      monthlyBudget = budgetDoc.data()?.monthly_budget || 0;
    }

    const diff = currentMonthTotal - lastMonthTotal;
    const diffType = diff > 0 ? "boncos" : diff < 0 ? "hemat" : "same";
    const peakSpendingDay = calculatePeakSpendingDay(thisMonthExpenses);

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
        monthlyBudget,
        peakSpendingDay,
        customCategories,
      },
    };
  } catch (err) {
    console.error("[getDashboardSummary Error]:", err);
    return { ok: false, message: "Gagal memuat ringkasan dashboard." };
  }
}

export async function saveMonthlyBudget(
  amount: number
): Promise<{ ok: boolean; message: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, message: "Silakan masuk terlebih dahulu." };
    }

    if (!Number.isSafeInteger(amount) || amount < 0) {
      return { ok: false, message: "Nominal anggaran harus berupa angka bulat positif." };
    }

    await userCol(user.uid, "settings").doc("budget").set(
      {
        monthly_budget: amount,
        updated_at: new Date(),
      },
      { merge: true }
    );

    return { ok: true, message: "Target anggaran berhasil disimpan." };
  } catch (err) {
    console.error("[saveMonthlyBudget Error]:", err);
    return { ok: false, message: "Gagal menyimpan target anggaran." };
  }
}
