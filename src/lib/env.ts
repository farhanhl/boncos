import { z } from "zod";

/**
 * Schema for all required and optional environment variables in Boncos.
 */
export const envSchema = z.object({
  // Client-side Firebase Auth
  NEXT_PUBLIC_FIREBASE_API_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_API_KEY wajib diisi"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN wajib diisi"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID wajib diisi"),
  NEXT_PUBLIC_FIREBASE_APP_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_APP_ID wajib diisi"),

  // Server-side Firebase Admin SDK
  FIREBASE_PROJECT_ID: z
    .string()
    .min(1, "FIREBASE_PROJECT_ID wajib diisi"),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email("FIREBASE_CLIENT_EMAIL harus berupa email service account yang valid"),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .min(1, "FIREBASE_PRIVATE_KEY wajib diisi")
    .refine(
      (val) => {
        const clean = val.replace(/\\n/g, "\n");
        return clean.includes("BEGIN PRIVATE KEY") || clean.includes("BEGIN RSA PRIVATE KEY");
      },
      "FIREBASE_PRIVATE_KEY harus berupa string kunci privat PEM yang valid"
    ),

  // Telegram encryption (AES-256-GCM 32 bytes)
  TELEGRAM_ENCRYPTION_KEY: z
    .string()
    .min(1, "TELEGRAM_ENCRYPTION_KEY wajib diisi")
    .refine(
      (val) => {
        const clean = val.trim().replace(/^["']|["']$/g, "");
        const buf = Buffer.from(clean, "base64");
        return buf.length === 32;
      },
      "TELEGRAM_ENCRYPTION_KEY harus berupa 32-byte base64 string"
    ),

  // Optional settings
  DEFAULT_CURRENCY: z.string().default("IDR"),
  SESSION_COOKIE_MAX_AGE_DAYS: z.string().default("14"),
  TELEGRAM_API_BASE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and prints a friendly diagnostic summary.
 * If required variables are missing and isBuild is true, throws an Error to halt build.
 */
export function validateEnv(options: { isBuild?: boolean } = {}) {
  const isBuild = options.isBuild ?? false;

  console.log("\n========================================================");
  console.log(" 🔍 BONCOS: PENGECEKAN ENVIRONMENT VARIABLES");
  console.log("========================================================");

  const parsed = envSchema.safeParse(process.env);

  const requiredKeys = [
    { key: "NEXT_PUBLIC_FIREBASE_API_KEY", desc: "Firebase Client API Key", client: true },
    { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", desc: "Firebase Client Auth Domain", client: true },
    { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", desc: "Firebase Client Project ID", client: true },
    { key: "NEXT_PUBLIC_FIREBASE_APP_ID", desc: "Firebase Client App ID", client: true },
    { key: "FIREBASE_PROJECT_ID", desc: "Firebase Admin Project ID", client: false },
    { key: "FIREBASE_CLIENT_EMAIL", desc: "Firebase Admin Service Account Email", client: false },
    { key: "FIREBASE_PRIVATE_KEY", desc: "Firebase Admin RSA Private Key", client: false },
    { key: "TELEGRAM_ENCRYPTION_KEY", desc: "Telegram Token Encryption Key (32B)", client: false },
  ];

  let hasError = false;
  const missingErrors: string[] = [];

  for (const item of requiredKeys) {
    const rawVal = process.env[item.key];
    if (!rawVal || !rawVal.trim()) {
      console.log(` ❌ [MISSING] ${item.key}`);
      console.log(`    ↳ Penjelasan: ${item.desc}`);
      hasError = true;
      missingErrors.push(`${item.key} (${item.desc})`);
    } else {
      if (item.key === "FIREBASE_PRIVATE_KEY") {
        const isValid = rawVal.includes("BEGIN PRIVATE KEY") || rawVal.includes("BEGIN RSA PRIVATE KEY");
        if (isValid) {
          console.log(` ✅ [OK] ${item.key} (Valid PEM Key)`);
        } else {
          console.log(` ⚠️ [INVALID] ${item.key} (Format PEM tidak valid)`);
          hasError = true;
          missingErrors.push(`${item.key} (Format PEM tidak valid)`);
        }
      } else if (item.key === "TELEGRAM_ENCRYPTION_KEY") {
        const clean = rawVal.trim().replace(/^["']|["']$/g, "");
        const buf = Buffer.from(clean, "base64");
        if (buf.length === 32) {
          console.log(` ✅ [OK] ${item.key} (Valid 32-byte Base64 Key)`);
        } else {
          console.log(` ⚠️ [INVALID] ${item.key} (Harus 32 bytes base64)`);
          hasError = true;
          missingErrors.push(`${item.key} (Harus 32 bytes base64)`);
        }
      } else {
        const preview = item.client
          ? rawVal.slice(0, 10) + "..."
          : rawVal.length > 8
          ? rawVal.slice(0, 4) + "••••" + rawVal.slice(-4)
          : "••••";
        console.log(` ✅ [OK] ${item.key} = ${preview}`);
      }
    }
  }

  console.log("--------------------------------------------------------");
  console.log(` ⚙️  DEFAULT_CURRENCY: ${process.env.DEFAULT_CURRENCY || "IDR (default)"}`);
  console.log(` ⚙️  SESSION_COOKIE_MAX_AGE_DAYS: ${process.env.SESSION_COOKIE_MAX_AGE_DAYS || "14 (default)"}`);
  console.log("========================================================\n");

  if (hasError && isBuild) {
    throw new Error(
      `[BUILD FAILED] Environment variables belum lengkap!\n\n` +
      `Variabel berikut wajib ditambahkan di .env.local atau Vercel Dashboard Settings -> Environment Variables:\n` +
      missingErrors.map((e) => `  - ${e}`).join("\n") +
      `\n\nSetelah menambahkan di Vercel, lakukan Redeploy agar variabel aktif.`
    );
  }

  return parsed;
}
