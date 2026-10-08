/**
 * Offline evaluation script for OCR & rule-based parser.
 * Reads anonymized test fixtures from tests/fixtures/ocr-text/ (or receipts/)
 * and computes exact-match accuracy metrics across:
 * - Nominal amount
 * - Expense date
 * - Merchant name
 * - Category suggestion
 */

import fs from "node:fs";
import path from "node:path";
import { parseReceiptText } from "../src/lib/extract/parse";

interface FixtureExpected {
  name: string;
  amount: number;
  expense_date: string;
  category_suggestion: string;
}

function runEvaluation() {
  const fixturesDir = path.resolve(__dirname, "../tests/fixtures/ocr-text");
  if (!fs.existsSync(fixturesDir)) {
    console.error("Fixtures directory not found:", fixturesDir);
    process.exit(1);
  }

  const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith(".txt"));
  if (files.length === 0) {
    console.log("No fixtures found.");
    return;
  }

  console.log(`\n======================================================`);
  console.log(`  BONCOS EXTRACTION EVALUATION (${files.length} fixtures)`);
  console.log(`======================================================\n`);

  let total = 0;
  let correctAmount = 0;
  let correctDate = 0;
  let correctName = 0;
  let correctCategory = 0;

  for (const file of files) {
    total++;
    const baseName = file.replace(".txt", "");
    const rawText = fs.readFileSync(path.join(fixturesDir, file), "utf-8");
    const jsonPath = path.join(fixturesDir, `${baseName}.expected.json`);

    let expected: FixtureExpected | null = null;
    if (fs.existsSync(jsonPath)) {
      expected = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    }

    const result = parseReceiptText(rawText);

    if (expected) {
      const matchAmount = result.amount.value === expected.amount;
      const matchDate = result.expense_date.value === expected.expense_date;
      const matchName = result.name.value?.toLowerCase() === expected.name.toLowerCase();
      const matchCat = result.category_suggestion.value === expected.category_suggestion;

      if (matchAmount) correctAmount++;
      if (matchDate) correctDate++;
      if (matchName) correctName++;
      if (matchCat) correctCategory++;

      console.log(
        `[${matchAmount ? "✔" : "✘"}] ${baseName.padEnd(20)} | ` +
        `Nominal: ${String(result.amount.value).padEnd(8)} (exp: ${expected.amount}) | ` +
        `Tgl: ${result.expense_date.value} | Nama: ${result.name.value}`
      );
    } else {
      console.log(`[?] ${baseName} | Extracted: Rp ${result.amount.value} | ${result.name.value}`);
    }
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`Accuracy Summary:`);
  console.log(`- Nominal (amount)     : ${((correctAmount / total) * 100).toFixed(1)}% (${correctAmount}/${total})`);
  console.log(`- Tanggal (date)       : ${((correctDate / total) * 100).toFixed(1)}% (${correctDate}/${total})`);
  console.log(`- Nama (merchant)      : ${((correctName / total) * 100).toFixed(1)}% (${correctName}/${total})`);
  console.log(`- Kategori (category)  : ${((correctCategory / total) * 100).toFixed(1)}% (${correctCategory}/${total})`);
  console.log(`======================================================\n`);
}

runEvaluation();
