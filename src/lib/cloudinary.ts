/**
 * Transforms a Cloudinary delivery URL to convert the image to WebP
 * and apply automatic quality compression (q_auto).
 * Example:
 *   https://res.cloudinary.com/demo/image/upload/v123/receipt.jpg
 * becomes:
 *   https://res.cloudinary.com/demo/image/upload/f_webp,q_auto/v123/receipt.webp
 */
export function formatCloudinaryWebp(url: string): string {
  if (!url || typeof url !== "string") return url;

  // Insert f_webp,q_auto into the upload path if not already present
  let transformed = url;
  if (!transformed.includes("f_webp")) {
    transformed = transformed.replace(
      /\/image\/upload\//i,
      "/image/upload/f_webp,q_auto/"
    );
  }

  // Replace file extension with .webp
  transformed = transformed.replace(/\.(?:jpe?g|png|heic|heif|tiff?|bmp)$/i, ".webp");
  return transformed;
}

/**
 * Utility to upload failed receipt scans to Cloudinary (unsigned upload).
 * Automatically applies WebP conversion and compression to the returned URL.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<string | null> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "qxwi3ibh";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "tibatiba_preset";

  try {
    const formData = new FormData();
    formData.append("upload_preset", uploadPreset);
    const base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;
    formData.append("file", base64Data);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[uploadToCloudinary Error]:", errText);
      return null;
    }

    const data = (await res.json()) as { secure_url?: string; url?: string };
    const rawUrl = data.secure_url || data.url || null;
    if (!rawUrl) return null;

    return formatCloudinaryWebp(rawUrl);
  } catch (err) {
    console.error("[uploadToCloudinary Exception]:", err);
    return null;
  }
}
