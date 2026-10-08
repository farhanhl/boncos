import fs from "node:fs";
import path from "node:path";
import { createWorker } from "tesseract.js";
import { parseReceiptText } from "../src/lib/extract/parse";

async function main() {
  const trainingDir = path.resolve(process.cwd(), "training");
  const files = fs.readdirSync(trainingDir).filter(f => f.endsWith(".jpeg") || f.endsWith(".jpg") || f.endsWith(".png"));

  console.log(`Found ${files.length} training images in ${trainingDir}:`, files);

  // In Node, createWorker with ind+eng
  const worker = await createWorker(["ind", "eng"], 1, {
    // For Node environment, langPath can point to public/tesseract
    langPath: path.resolve(process.cwd(), "public/tesseract"),
    cachePath: path.resolve(process.cwd(), "public/tesseract"),
  });

  for (const file of files) {
    const filePath = path.join(trainingDir, file);
    console.log(`\n========================================`);
    console.log(`PROCESSING: ${file}`);
    console.log(`========================================`);

    const imageBuffer = fs.readFileSync(filePath);
    const { data } = await worker.recognize(imageBuffer);

    console.log(`--- RAW OCR TEXT ---`);
    console.log(data.text);
    console.log(`--- PARSED RESULT ---`);
    const parsed = parseReceiptText(data.text);
    console.log(JSON.stringify(parsed, null, 2));
  }

  await worker.terminate();
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
