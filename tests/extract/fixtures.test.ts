import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseReceiptText } from "@/lib/extract/parse";

describe("OCR Text Fixtures Test Suite", () => {
  const fixturesDir = path.resolve(__dirname, "../fixtures/ocr-text");
  const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith(".txt"));

  for (const file of files) {
    const baseName = file.replace(".txt", "");
    const txtPath = path.join(fixturesDir, file);
    const jsonPath = path.join(fixturesDir, `${baseName}.expected.json`);

    if (fs.existsSync(jsonPath)) {
      it(`parses fixture ${baseName} accurately against expected.json`, () => {
        const rawText = fs.readFileSync(txtPath, "utf-8");
        const expected = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

        const result = parseReceiptText(rawText);

        expect(result.amount.value).toBe(expected.amount);
        expect(result.expense_date.value).toBe(expected.expense_date);
        expect(result.name.value).toBe(expected.name);
        expect(result.category_suggestion.value).toBe(expected.category_suggestion);
        expect(result.doc_type).toBe(expected.doc_type);
        expect(result.status).toBe(expected.status);
      });
    }
  }
});
