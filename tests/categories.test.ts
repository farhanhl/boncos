import { describe, it, expect } from "vitest";
import { getCategoryById } from "@/lib/categories";

describe("Category Utility (lib/categories.ts)", () => {
  it("resolves default category slugs correctly", () => {
    const food = getCategoryById("food");
    expect(food.name).toBe("Makanan & Minuman");
    expect(food.color).toBe("#FF9F45");

    const bills = getCategoryById("bills");
    expect(bills.name).toBe("Tagihan");
  });

  it("resolves custom categories when provided", () => {
    const customList = [
      {
        id: "cat_keluarga_123",
        name: "Keluarga",
        color: "#2BD67B",
        icon: "PiTagBold",
      },
    ];

    const resolved = getCategoryById("cat_keluarga_123", customList);
    expect(resolved.id).toBe("cat_keluarga_123");
    expect(resolved.name).toBe("Keluarga");
    expect(resolved.color).toBe("#2BD67B");
    expect(resolved.iconName).toBe("PiTagBold");
  });

  it("falls back to 'other' when category id is not found or null", () => {
    const notFound = getCategoryById("unknown_id");
    expect(notFound.id).toBe("other");
    expect(notFound.name).toBe("Lainnya");

    const nullCat = getCategoryById(null);
    expect(nullCat.id).toBe("other");
  });
});
