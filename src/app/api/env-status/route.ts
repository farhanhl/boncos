import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface EnvStatusItem {
  key: string;
  name: string;
  scope: "client" | "server";
  required: boolean;
  exists: boolean;
  status: "OK" | "MISSING" | "INVALID";
  preview: string;
  details?: string;
}

export async function GET() {
  const items: EnvStatusItem[] = [];

  // 1. NEXT_PUBLIC_FIREBASE_API_KEY
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  items.push({
    key: "NEXT_PUBLIC_FIREBASE_API_KEY",
    name: "Firebase Client API Key",
    scope: "client",
    required: true,
    exists: Boolean(apiKey),
    status: apiKey ? "OK" : "MISSING",
    preview: apiKey ? `${apiKey.slice(0, 8)}••••` : "Tidak ada",
  });

  // 2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  items.push({
    key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    name: "Firebase Client Auth Domain",
    scope: "client",
    required: true,
    exists: Boolean(authDomain),
    status: authDomain ? "OK" : "MISSING",
    preview: authDomain || "Tidak ada",
  });

  // 3. NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const pubProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  items.push({
    key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    name: "Firebase Client Project ID",
    scope: "client",
    required: true,
    exists: Boolean(pubProjectId),
    status: pubProjectId ? "OK" : "MISSING",
    preview: pubProjectId || "Tidak ada",
  });

  // 4. NEXT_PUBLIC_FIREBASE_APP_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();
  items.push({
    key: "NEXT_PUBLIC_FIREBASE_APP_ID",
    name: "Firebase Client App ID",
    scope: "client",
    required: true,
    exists: Boolean(appId),
    status: appId ? "OK" : "MISSING",
    preview: appId ? `${appId.slice(0, 10)}••••` : "Tidak ada",
  });

  // 5. FIREBASE_PROJECT_ID
  const srvProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
  items.push({
    key: "FIREBASE_PROJECT_ID",
    name: "Firebase Admin Project ID",
    scope: "server",
    required: true,
    exists: Boolean(srvProjectId),
    status: srvProjectId ? "OK" : "MISSING",
    preview: srvProjectId || "Tidak ada",
  });

  // 6. FIREBASE_CLIENT_EMAIL
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()?.replace(/^["']|["']$/g, "");
  const isEmailValid = Boolean(clientEmail && clientEmail.includes("@") && clientEmail.includes("."));
  items.push({
    key: "FIREBASE_CLIENT_EMAIL",
    name: "Firebase Admin Client Email",
    scope: "server",
    required: true,
    exists: Boolean(clientEmail),
    status: !clientEmail ? "MISSING" : isEmailValid ? "OK" : "INVALID",
    preview: clientEmail ? `${clientEmail.slice(0, 15)}••••@••••` : "Tidak ada",
    details: clientEmail && !isEmailValid ? "Format email tidak valid" : undefined,
  });

  // 7. FIREBASE_PRIVATE_KEY
  const rawPk = process.env.FIREBASE_PRIVATE_KEY;
  let pkStatus: "OK" | "MISSING" | "INVALID" = "MISSING";
  let pkDetails: string | undefined;
  let pkPreview = "Tidak ada";

  if (rawPk && rawPk.trim()) {
    const cleanPk = rawPk.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
    const hasHeader = cleanPk.includes("BEGIN PRIVATE KEY") || cleanPk.includes("BEGIN RSA PRIVATE KEY");
    const hasFooter = cleanPk.includes("END PRIVATE KEY") || cleanPk.includes("END RSA PRIVATE KEY");

    if (hasHeader && hasFooter) {
      pkStatus = "OK";
      pkPreview = `Valid PEM Key (${cleanPk.length} karakter)`;
    } else {
      pkStatus = "INVALID";
      pkPreview = `Header/Footer PEM tidak lengkap (${cleanPk.length} karakter)`;
      pkDetails = "Harus diawali -----BEGIN PRIVATE KEY----- dan diakhiri -----END PRIVATE KEY-----";
    }
  }

  items.push({
    key: "FIREBASE_PRIVATE_KEY",
    name: "Firebase Admin RSA Private Key",
    scope: "server",
    required: true,
    exists: Boolean(rawPk && rawPk.trim()),
    status: pkStatus,
    preview: pkPreview,
    details: pkDetails,
  });

  // 8. TELEGRAM_ENCRYPTION_KEY
  const rawTgKey = process.env.TELEGRAM_ENCRYPTION_KEY?.trim()?.replace(/^["']|["']$/g, "");
  let tgStatus: "OK" | "MISSING" | "INVALID" = "MISSING";
  let tgDetails: string | undefined;
  let tgPreview = "Tidak ada";

  if (rawTgKey) {
    try {
      const buf = Buffer.from(rawTgKey, "base64");
      if (buf.length === 32) {
        tgStatus = "OK";
        tgPreview = "Valid 32-byte Base64 Key";
      } else {
        tgStatus = "INVALID";
        tgPreview = `Panjang buffer ${buf.length} bytes (harus 32)`;
        tgDetails = "Kunci harus tepat 32 bytes di-encode Base64";
      }
    } catch {
      tgStatus = "INVALID";
      tgPreview = "Format Base64 rusak";
    }
  }

  items.push({
    key: "TELEGRAM_ENCRYPTION_KEY",
    name: "Telegram Encryption Key (AES-256)",
    scope: "server",
    required: true,
    exists: Boolean(rawTgKey),
    status: tgStatus,
    preview: tgPreview,
    details: tgDetails,
  });

  // 9. Optional
  const currency = process.env.DEFAULT_CURRENCY || "IDR";
  items.push({
    key: "DEFAULT_CURRENCY",
    name: "Mata Uang Default",
    scope: "server",
    required: false,
    exists: Boolean(process.env.DEFAULT_CURRENCY),
    status: "OK",
    preview: currency,
  });

  // 10. Live Initialization Test for Firebase Admin SDK
  let adminTestStatus: "OK" | "MISSING" | "INVALID" = "OK";
  let adminTestPreview = "Sedang diuji...";
  let adminTestDetails: string | undefined;

  try {
    const { getAdminApp, getAdminAuth, lastInitError } = await import("@/lib/firebase/admin");
    const app = getAdminApp();
    const auth = getAdminAuth();
    const hasCred = Boolean(app.options.credential);
    if (app && auth && hasCred) {
      adminTestStatus = "OK";
      adminTestPreview = `Berhasil Inisialisasi (Project: ${app.options.projectId}, Kredensial Valid)`;
    } else if (app && !hasCred) {
      adminTestStatus = "INVALID";
      adminTestPreview = `Fallback Tanpa Kredensial (Project: ${app.options.projectId})`;
      adminTestDetails = lastInitError || "initializeApp gagal memuat cert({ clientEmail, privateKey }). Kunci privat atau email service account tidak dapat diproses.";
    } else {
      adminTestStatus = "INVALID";
      adminTestPreview = "App atau Auth bernilai null/undefined";
    }
  } catch (err) {
    adminTestStatus = "INVALID";
    adminTestPreview = "Gagal Inisialisasi Firebase Admin";
    adminTestDetails = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  items.push({
    key: "FIREBASE_ADMIN_INIT_TEST",
    name: "Uji Koneksi Firebase Admin SDK",
    scope: "server",
    required: true,
    exists: true,
    status: adminTestStatus,
    preview: adminTestPreview,
    details: adminTestDetails,
  });

  const allRequiredOk = items.every((i) => !i.required || i.status === "OK");

  return NextResponse.json({
    ok: true,
    allRequiredOk,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    items,
  });
}
