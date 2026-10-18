import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isGeminiExtractionEnabled, extractReceiptWithGemini } from "@/lib/extract/gemini";

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
      process.env.GEMINI_API_KEY = "test-key";
      expect(isGeminiExtractionEnabled()).toBe(false);

      process.env.EXTRACTION_MODE = "ocr";
      expect(isGeminiExtractionEnabled()).toBe(false);
    });

    it("returns false if EXTRACTION_MODE is gemini but GEMINI_API_KEY is empty", () => {
      process.env.EXTRACTION_MODE = "gemini";
      delete process.env.GEMINI_API_KEY;
      expect(isGeminiExtractionEnabled()).toBe(false);

      process.env.GEMINI_API_KEY = "   ";
      expect(isGeminiExtractionEnabled()).toBe(false);
    });

    it("returns true when EXTRACTION_MODE is ai and GEMINI_API_KEY is present", () => {
      process.env.EXTRACTION_MODE = "ai";
      process.env.GEMINI_API_KEY = "dummy-api-key";
      expect(isGeminiExtractionEnabled()).toBe(true);
    });

    it("returns true when EXTRACTION_MODE is gemini and GEMINI_API_KEY is present", () => {
      process.env.EXTRACTION_MODE = "gemini";
      process.env.GEMINI_API_KEY = "dummy-api-key";
      expect(isGeminiExtractionEnabled()).toBe(true);
    });
  });

  describe("extractReceiptWithGemini", () => {
    it("throws error if GEMINI_API_KEY is missing", async () => {
      delete process.env.GEMINI_API_KEY;
      const buffer = Buffer.from("dummy-image-bytes");
      await expect(extractReceiptWithGemini(buffer)).rejects.toThrow("GEMINI_API_KEY");
    });

    it("parses successful Gemini JSON response into ExtractionResult", async () => {
      process.env.GEMINI_API_KEY = "dummy-key";
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
      process.env.GEMINI_API_KEY = "dummy-key";

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
  });
});
