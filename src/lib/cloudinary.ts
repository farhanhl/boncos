/**
 * Utility to upload failed receipt scans to Cloudinary (unsigned upload).
 * Used exclusively for reporting failed scans to Telegram.
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
    return data.secure_url || data.url || null;
  } catch (err) {
    console.error("[uploadToCloudinary Exception]:", err);
    return null;
  }
}
