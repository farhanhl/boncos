import { describe, it, expect } from "vitest";
import { escapeHtml } from "@/lib/telegram";
import { getUidByIngestionKey } from "@/actions/ingestion";

describe("Webhook Scan & Ingestion Unit Tests", () => {
  it("escapes html characters in notification messages correctly", () => {
    const raw = `Warung "Sate" <Kambing> & Es Teh`;
    const escaped = escapeHtml(raw);
    expect(escaped).toBe("Warung &quot;Sate&quot; &lt;Kambing&gt; &amp; Es Teh");
  });

  it("safely rejects invalid or empty ingestion keys without querying db", async () => {
    expect(await getUidByIngestionKey("")).toBeNull();
    // @ts-expect-error testing invalid type
    expect(await getUidByIngestionKey(null)).toBeNull();
    expect(await getUidByIngestionKey("   ")).toBeNull();
  });

  it("validates scan_method in createExpenseSchema", async () => {
    const { createExpenseSchema } = await import("@/types/expense");
    const validOcr = createExpenseSchema.safeParse({
      name: "Belanja",
      amount: 10000,
      expense_date: "2026-10-18",
      source: "scan",
      scan_method: "ocr",
    });
    expect(validOcr.success).toBe(true);

    const validAi = createExpenseSchema.safeParse({
      name: "Belanja",
      amount: 10000,
      expense_date: "2026-10-18",
      source: "scan",
      scan_method: "ai",
    });
    expect(validAi.success).toBe(true);

    const validManual = createExpenseSchema.safeParse({
      name: "Belanja",
      amount: 10000,
      expense_date: "2026-10-18",
      source: "manual",
      scan_method: "manual",
    });
    expect(validManual.success).toBe(true);
  });
});

