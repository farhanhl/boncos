import { describe, it, expect } from "vitest";
import {
  calculatePeakSpendingDay,
  calculateDailySpending,
  calculateWeeklySpending,
  getDaysInMonth,
} from "@/lib/dashboard-stats";

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

  describe("getDaysInMonth", () => {
    it("returns 31 for October", () => {
      expect(getDaysInMonth(2026, 10)).toBe(31);
    });

    it("returns 28 for non-leap February", () => {
      expect(getDaysInMonth(2026, 2)).toBe(28);
    });

    it("returns 29 for leap February", () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
    });

    it("returns 30 for April", () => {
      expect(getDaysInMonth(2026, 4)).toBe(30);
    });
  });

  describe("calculateDailySpending", () => {
    it("handles empty expenses correctly", () => {
      const res = calculateDailySpending([], "2026-10");
      expect(res.total).toBe(0);
      expect(res.totalDays).toBe(31);
      expect(res.items.length).toBe(31);
      expect(res.activeItems.length).toBe(0);
      expect(res.activeDaysCount).toBe(0);
      expect(res.averagePerDay).toBe(0);
      expect(res.peakDay).toBeNull();
    });

    it("aggregates expenses per day and computes correct stats", () => {
      const expenses = [
        { expense_date: "2026-10-01", amount: 20000 },
        { expense_date: "2026-10-01", amount: 30000 }, // Total 50.000
        { expense_date: "2026-10-15", amount: 150000 }, // Peak day
        { expense_date: "2026-10-20", amount: 100000 },
      ];

      // Use currentDateOverride = '2026-10-31' to test full month calculation
      const res = calculateDailySpending(expenses, "2026-10", "2026-10-31");
      expect(res.total).toBe(300000);
      expect(res.activeDaysCount).toBe(3);
      expect(res.activeItems.length).toBe(3);
      // Active items sorted descending by total
      expect(res.activeItems[0].date).toBe("2026-10-15");
      expect(res.activeItems[0].total).toBe(150000);
      expect(res.activeItems[1].date).toBe("2026-10-20");
      expect(res.activeItems[1].total).toBe(100000);
      expect(res.activeItems[2].date).toBe("2026-10-01");
      expect(res.activeItems[2].total).toBe(50000);

      expect(res.peakDay).toEqual({
        date: "2026-10-15",
        dayName: "Kamis",
        total: 150000,
      });

      // Average: 300.000 / 31 = 9677 (integer)
      expect(res.averagePerDay).toBe(Math.round(300000 / 31));
    });

    it("uses elapsed days for current month average", () => {
      const expenses = [
        { expense_date: "2026-10-01", amount: 50000 },
        { expense_date: "2026-10-05", amount: 50000 },
      ];

      // If today is 2026-10-10, elapsed days = 10
      const res = calculateDailySpending(expenses, "2026-10", "2026-10-10");
      expect(res.total).toBe(100000);
      // 100.000 / 10 = 10000
      expect(res.averagePerDay).toBe(10000);
    });
  });

  describe("calculateWeeklySpending", () => {
    it("handles empty expenses correctly", () => {
      const res = calculateWeeklySpending([], "2026-10");
      expect(res.total).toBe(0);
      expect(res.items.length).toBe(5); // 31 days has 5 weeks
      expect(res.averagePerWeek).toBe(0);
      expect(res.peakWeek).toBeNull();
    });

    it("generates 4 weeks for February (28 days)", () => {
      const res = calculateWeeklySpending([], "2026-02");
      expect(res.items.length).toBe(4);
      expect(res.items[3].endDate).toBe("2026-02-28");
    });

    it("correctly buckets expenses into weekly ranges and computes percentages", () => {
      const expenses = [
        { expense_date: "2026-10-03", amount: 50000 },  // Week 1 (1–7)
        { expense_date: "2026-10-10", amount: 150000 }, // Week 2 (8–14)
        { expense_date: "2026-10-18", amount: 50000 },  // Week 3 (15–21)
        { expense_date: "2026-10-25", amount: 50000 },  // Week 4 (22–28)
        { expense_date: "2026-10-30", amount: 100000 }, // Week 5 (29–31)
      ];

      const res = calculateWeeklySpending(expenses, "2026-10", "2026-10-31");
      expect(res.total).toBe(400000);
      expect(res.items.length).toBe(5);

      // Week 1: 50.000 (13%)
      expect(res.items[0].weekNumber).toBe(1);
      expect(res.items[0].total).toBe(50000);
      expect(res.items[0].percentage).toBe(Math.round((50000 / 400000) * 100));

      // Week 2: 150.000 (38%) -> Peak week
      expect(res.items[1].weekNumber).toBe(2);
      expect(res.items[1].total).toBe(150000);
      expect(res.items[1].percentage).toBe(Math.round((150000 / 400000) * 100));

      // Peak week check
      expect(res.peakWeek).toEqual({
        weekNumber: 2,
        label: "Minggu 2 (8–14 Okt)",
        total: 150000,
      });

      // Average: 400.000 / 5 = 80000
      expect(res.averagePerWeek).toBe(80000);
    });
  });
});
