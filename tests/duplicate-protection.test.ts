import { describe, it, expect, vi } from "vitest";
import { createExpenseSchema } from "@/types/expense";

vi.mock("@/lib/firebase/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({
  userCol: vi.fn(),
  userDoc: vi.fn(),
}));

describe("Duplicate Protection & Idempotency", () => {
  it("validates allow_duplicate flag in createExpenseSchema", () => {
    const withoutFlag = createExpenseSchema.safeParse({
      name: "Kopi Kenangan",
      amount: 25000,
      expense_date: "2026-10-28",
      source: "manual",
    });
    expect(withoutFlag.success).toBe(true);
    if (withoutFlag.success) {
      expect(withoutFlag.data.allow_duplicate).toBeUndefined();
    }

    const withFlagTrue = createExpenseSchema.safeParse({
      name: "Kopi Kenangan",
      amount: 25000,
      expense_date: "2026-10-28",
      source: "manual",
      allow_duplicate: true,
    });
    expect(withFlagTrue.success).toBe(true);
    if (withFlagTrue.success) {
      expect(withFlagTrue.data.allow_duplicate).toBe(true);
    }
  });

  it("findPotentialDuplicate identifies matching records by date, amount, and name", async () => {
    const { findPotentialDuplicate } = await import("@/actions/expenses");
    const { userCol } = await import("@/lib/firebase/admin");

    const mockDocs = [
      {
        id: "exp-1",
        data: () => ({
          name: "Makan Siang Nasi Padang",
          name_lower: "makan siang nasi padang",
          amount: 35000,
          currency: "IDR",
          expense_date: "2026-10-28",
          category_id: "food",
          note: null,
          source: "manual",
          extraction_confidence: null,
          created_at: { toDate: () => new Date("2026-10-28T12:00:00Z") },
          updated_at: { toDate: () => new Date("2026-10-28T12:00:00Z") },
        }),
      },
    ];

    const mockQuery = {
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        empty: false,
        docs: mockDocs,
      }),
    };

    (userCol as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

    const duplicate = await findPotentialDuplicate("test-uid", {
      name: "Nasi Padang",
      amount: 35000,
      expense_date: "2026-10-28",
    });

    expect(duplicate).not.toBeNull();
    expect(duplicate?.id).toBe("exp-1");
    expect(duplicate?.amount).toBe(35000);
  });

  it("findPotentialDuplicate returns null if no record matches amount and date", async () => {
    const { findPotentialDuplicate } = await import("@/actions/expenses");
    const { userCol } = await import("@/lib/firebase/admin");

    const mockQuery = {
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        empty: true,
        docs: [],
      }),
    };

    (userCol as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

    const result = await findPotentialDuplicate("test-uid", {
      name: "Bensin Pertamax",
      amount: 50000,
      expense_date: "2026-10-28",
    });

    expect(result).toBeNull();
  });
});
