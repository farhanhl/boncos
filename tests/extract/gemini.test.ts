import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isGeminiExtractionEnabled,
  extractReceiptWithGemini,
  normalizeExtractedDate,
  getActiveAiModel,
} from "@/lib/extract/gemini";

describe("Gemini Extraction Engine (lib/extract/gemini.ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("isGeminiExtractionEnabled", () => {
    it("returns false if EXTRACTION_MODE is ocr or unset", () => {
      delete process.env.EXTRACTION_MODE;
      process.env.AI_API_KEY = "test-key";
      expect(isGeminiExtractionEnabled()).toBe(false);

      process.env.EXTRACTION_MODE = "ocr";
      expect(isGeminiExtractionEnabled()).toBe(false);
    });

    it("returns false if EXTRACTION_MODE is ai but AI_API_KEY is empty", () => {
      process.env.EXTRACTION_MODE = "ai";
      delete process.env.AI_API_KEY;
      expect(isGeminiExtractionEnabled()).toBe(false);

      process.env.AI_API_KEY = "   ";
      expect(isGeminiExtractionEnabled()).toBe(false);
    });

    it("returns true when EXTRACTION_MODE is ai and AI_API_KEY is present", () => {
      process.env.EXTRACTION_MODE = "ai";
      process.env.AI_API_KEY = "dummy-api-key";
      expect(isGeminiExtractionEnabled()).toBe(true);
    });
  });

  describe("getActiveAiModel", () => {
    it("returns gemini-3.8-flash by default when AI_MODEL is unset", () => {
      delete process.env.AI_MODEL;
      expect(getActiveAiModel()).toBe("gemini-3.8-flash");
    });

    it("returns trimmed AI_MODEL when provided", () => {
      process.env.AI_MODEL = "  gemini-1.5-pro  ";
      expect(getActiveAiModel()).toBe("gemini-1.5-pro");
    });
  });

  describe("extractReceiptWithGemini", () => {
    it("throws error if AI_API_KEY is missing", async () => {
      delete process.env.AI_API_KEY;
      const buffer = Buffer.from("dummy-image-bytes");
      await expect(extractReceiptWithGemini(buffer)).rejects.toThrow("AI_API_KEY");
    });

    it("parses successful Gemini JSON response into ExtractionResult", async () => {
      process.env.AI_API_KEY = "dummy-key";
      process.env.AI_MODEL = "gemini-2.5-flash";

      const mockGeminiJson = {
        name: "[Buy 1 Get 1] Rexona Men Apa Ice Cool 40g [Flash Sale]",
        amount: 22120,
        expense_date: "2026-10-16",
        category_suggestion: "shopping",
        doc_type: "receipt",
        confidence: 0.98,
        summary: "Pembelian Rexona Men 40g promo Flash Sale di TikTok Shop",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockGeminiJson) }],
              },
            },
          ],
        }),
      } as unknown as Response);

      const buffer = Buffer.from("dummy-image-bytes");
      const result = await extractReceiptWithGemini(buffer, "image/jpeg");

      expect(result.status).toBe("ok");
      expect(result.name.value).toBe("[Buy 1 Get 1] Rexona Men Apa Ice Cool 40g [Flash Sale]");
      expect(result.amount.value).toBe(22120);
      expect(result.expense_date.value).toBe("2026-10-16");
      expect(result.category_suggestion.value).toBe("shopping");
      expect(result.doc_type).toBe("receipt");
      expect(result.name.rule).toBe("ai");
      expect(result.extraction_confidence).toBeGreaterThan(0.9);
    });


    it("handles partial extraction from Gemini gracefully", async () => {
      process.env.AI_API_KEY = "dummy-key";

      const mockPartialJson = {
        name: "Warkop Lina",
        amount: 5000,
        expense_date: null,
        category_suggestion: "food",
        doc_type: "receipt",
        confidence: 0.85,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockPartialJson) }],
              },
            },
          ],
        }),
      } as unknown as Response);

      const buffer = Buffer.from("dummy-image-bytes");
      const result = await extractReceiptWithGemini(buffer);

      expect(result.status).toBe("partial");
      expect(result.name.value).toBe("Warkop Lina");
      expect(result.amount.value).toBe(5000);
      expect(result.expense_date.value).toBeNull();
      expect(result.category_suggestion.value).toBe("food");
    });

    it("normalizes non-ISO date format like DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD", async () => {
      process.env.AI_API_KEY = "dummy-key";

      const mockJson = {
        name: "Warung Imen",
        amount: 3000,
        expense_date: "27/10/2026",
        category_suggestion: "food",
        doc_type: "receipt",
        confidence: 0.95,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockJson) }],
              },
            },
          ],
        }),
      } as unknown as Response);

      const buffer = Buffer.from("dummy-image-bytes");
      const result = await extractReceiptWithGemini(buffer);

      expect(result.expense_date.value).toBe("2026-10-27");
    });

    it("falls back to candidate model when primary model returns 503 or 404", async () => {
      process.env.AI_API_KEY = "dummy-key";
      process.env.AI_MODEL = "gemini-3.8-flash";

      const mockJson = {
        name: "Indomaret",
        amount: 15000,
        expense_date: "2026-10-28",
        category_suggestion: "shopping",
        doc_type: "receipt",
        confidence: 0.99,
      };

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        callCount++;
        // First call to gemini-3.8-flash returns 503
        if (url.includes("gemini-3.8-flash")) {
          return {
            ok: false,
            status: 503,
            text: async () => JSON.stringify({ error: { message: "High demand" } }),
          } as unknown as Response;
        }

        // Fallback call returns 200
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(mockJson) }],
                },
              },
            ],
          }),
        } as unknown as Response;
      });

      const buffer = Buffer.from("dummy-image-bytes");
      const result = await extractReceiptWithGemini(buffer);

      expect(callCount).toBeGreaterThan(1);
      expect(result.status).toBe("ok");
      expect(result.name.value).toBe("Indomaret");
      expect(result.amount.value).toBe(15000);
    });
  });

  describe("normalizeExtractedDate", () => {
    it("returns YYYY-MM-DD unchanged", () => {
      expect(normalizeExtractedDate("2026-10-27")).toBe("2026-10-27");
      expect(normalizeExtractedDate("2026/10/27")).toBe("2026-10-27");
    });

    it("converts DD/MM/YYYY and DD-MM-YYYY to YYYY-MM-DD", () => {
      expect(normalizeExtractedDate("27/10/2026")).toBe("2026-10-27");
      expect(normalizeExtractedDate("27-10-2026")).toBe("2026-10-27");
      expect(normalizeExtractedDate("05/01/2026")).toBe("2026-01-05");
    });

    it("converts two-digit year DD/MM/YY to 20YY-MM-DD", () => {
      expect(normalizeExtractedDate("27/10/26")).toBe("2026-10-27");
      expect(normalizeExtractedDate("01-05-26")).toBe("2026-05-01");
    });

    it("returns null for invalid or empty date", () => {
      expect(normalizeExtractedDate(null)).toBeNull();
      expect(normalizeExtractedDate(undefined)).toBeNull();
      expect(normalizeExtractedDate("")).toBeNull();
      expect(normalizeExtractedDate("invalid-date")).toBeNull();
    });
  });
});
