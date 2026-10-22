import { describe, it, expect } from "vitest";
import { calculatePeakSpendingDay } from "@/lib/dashboard-stats";

describe("Dashboard Stats Utility (lib/dashboard-stats.ts)", () => {
  it("returns null for empty expenses list", () => {
    expect(calculatePeakSpendingDay([])).toBeNull();
  });

  it("calculates peak day correctly for single expense", () => {
    const expenses = [
      {
        expense_date: "2026-10-15",
        amount: 50000,
        name: "Makan Siang",
      },
    ];

    const result = calculatePeakSpendingDay(expenses);
    expect(result).toEqual({
      date: "2026-10-15",
      total: 50000,
      count: 1,
      topExpenseName: "Makan Siang",
      topExpenseAmount: 50000,
    });
  });

  it("sums multiple expenses on the same day", () => {
    const expenses = [
      {
        expense_date: "2026-10-15",
        amount: 25000,
        name: "Kopi Susu",
      },
      {
        expense_date: "2026-10-15",
        amount: 75000,
        name: "Belanja Supermarket",
      },
    ];

    const result = calculatePeakSpendingDay(expenses);
    expect(result).toEqual({
      date: "2026-10-15",
      total: 100000,
      count: 2,
      topExpenseName: "Belanja Supermarket",
      topExpenseAmount: 75000,
    });
  });

  it("finds the day with highest spending among multiple days", () => {
    const expenses = [
      {
        expense_date: "2026-10-02",
        amount: 50000,
        name: "Bensin",
      },
      {
        expense_date: "2026-10-10",
        amount: 300000,
        name: "Token Listrik",
      },
      {
        expense_date: "2026-10-15",
        amount: 120000,
        name: "Makan Malam",
      },
      {
        expense_date: "2026-10-15",
        amount: 50000,
        name: "Parkir",
      },
    ];

    const result = calculatePeakSpendingDay(expenses);
    expect(result).toEqual({
      date: "2026-10-10",
      total: 300000,
      count: 1,
      topExpenseName: "Token Listrik",
      topExpenseAmount: 300000,
    });
  });

  it("chooses the later date when totals tie", () => {
    const expenses = [
      {
        expense_date: "2026-10-05",
        amount: 100000,
        name: "Belanja 1",
      },
      {
        expense_date: "2026-10-20",
        amount: 100000,
        name: "Belanja 2",
      },
    ];

    const result = calculatePeakSpendingDay(expenses);
    expect(result?.date).toBe("2026-10-20");
    expect(result?.total).toBe(100000);
  });

  it("ignores expenses with missing expense_date", () => {
    const expenses = [
      {
        expense_date: "",
        amount: 500000,
        name: "Invalid",
      },
      {
        expense_date: "2026-10-12",
        amount: 20000,
        name: "Camilan",
      },
    ];

    const result = calculatePeakSpendingDay(expenses);
    expect(result).toEqual({
      date: "2026-10-12",
      total: 20000,
      count: 1,
      topExpenseName: "Camilan",
      topExpenseAmount: 20000,
    });
  });
});
