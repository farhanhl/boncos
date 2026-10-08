/**
 * Client-side Canvas-based image preprocessor for OCR.
 * In accordance with EXTRACTION.md Preprocessing:
 * - EXIF orientation correction via createImageBitmap
 * - Resize (longest side <= 2000px, enlarge x2 if width < 1000px)
 * - Grayscale + contrast stretching (Pass 1)
 * - Adaptive binarization (Sauvola-like window) for thermal paper (Pass 2)
 * - No heavy external library, executed purely in browser memory
 */

export interface PreprocessOptions {
  adaptiveBinarization?: boolean; // Pass 2
}

export async function preprocessImage(
  fileOrBlob: Blob,
  options: PreprocessOptions = {}
): Promise<Blob> {
  // 1. Decode with EXIF orientation correction
  const bitmap = await createImageBitmap(fileOrBlob, {
    imageOrientation: "from-image",
  });

  let width = bitmap.width;
  let height = bitmap.height;

  // 2. Scaling logic
  const longest = Math.max(width, height);
  if (longest > 2000) {
    const scale = 2000 / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  } else if (width < 1000) {
    width = Math.round(width * 2);
    height = Math.round(height * 2);
  }

  // Draw onto offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context 2D not supported");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  // 3. Grayscale
  const gray = new Uint8Array(width * height);
  let minGray = 255;
  let maxGray = 0;

  for (let i = 0, j = 0; i < len; i += 4, j++) {
    // Standard luminosity formula
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    gray[j] = luma;
    if (luma < minGray) minGray = luma;
    if (luma > maxGray) maxGray = luma;
  }

  // 4. Contrast normalization (Histogram stretching)
  const range = maxGray - minGray || 1;
  for (let j = 0; j < gray.length; j++) {
    const current = gray[j] ?? 0;
    gray[j] = Math.min(255, Math.max(0, Math.round(((current - minGray) / range) * 255)));
  }

  // 5. Pass 2: Adaptive Binarization (Sauvola-like window) if requested
  if (options.adaptiveBinarization) {
    const output = new Uint8Array(width * height);
    const windowSize = Math.max(15, Math.floor(width / 30));
    const halfWin = Math.floor(windowSize / 2);

    // Compute integral image for fast local mean computation
    const integral = new Float64Array((width + 1) * (height + 1));
    for (let y = 0; y < height; y++) {
      let sum = 0;
      for (let x = 0; x < width; x++) {
        sum += gray[y * width + x] ?? 0;
        integral[(y + 1) * (width + 1) + (x + 1)] =
          (integral[y * (width + 1) + (x + 1)] ?? 0) + sum;
      }
    }

    // Adaptive thresholding: T = localMean * (1 - 0.15)
    for (let y = 0; y < height; y++) {
      const y1 = Math.max(0, y - halfWin);
      const y2 = Math.min(height - 1, y + halfWin);
      for (let x = 0; x < width; x++) {
        const x1 = Math.max(0, x - halfWin);
        const x2 = Math.min(width - 1, x + halfWin);

        const count = (x2 - x1 + 1) * (y2 - y1 + 1);
        const areaSum =
          (integral[(y2 + 1) * (width + 1) + (x2 + 1)] ?? 0) -
          (integral[y1 * (width + 1) + (x2 + 1)] ?? 0) -
          (integral[(y2 + 1) * (width + 1) + x1] ?? 0) +
          (integral[y1 * (width + 1) + x1] ?? 0);

        const localMean = areaSum / count;
        const threshold = localMean * 0.85;

        const pixelVal = gray[y * width + x] ?? 0;
        output[y * width + x] = pixelVal < threshold ? 0 : 255;
      }
    }

    // Copy binarized pixels back to canvas data
    for (let j = 0, i = 0; j < output.length; j++, i += 4) {
      const val = output[j] ?? 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  } else {
    // Copy stretched grayscale back to canvas data
    for (let j = 0, i = 0; j < gray.length; j++, i += 4) {
      const val = gray[j] ?? 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export canvas blob"));
    }, "image/png");
  });
}
