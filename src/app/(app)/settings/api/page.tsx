import { headers } from "next/headers";
import { getUserIngestionKey } from "@/actions/ingestion";
import { getTelegramSettings } from "@/actions/notifications";
import { ApiKeyManager } from "@/components/settings/ApiKeyManager";
import { SettingsSubnav } from "@/components/settings/SettingsSubnav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kode Unik & Webhook Scan — Boncos",
};

export default async function ApiSettingsPage() {
  const [keyRes, telegramRes, headersList] = await Promise.all([
    getUserIngestionKey(),
    getTelegramSettings(),
    headers(),
  ]);

  const keyData = keyRes.ok && keyRes.data ? keyRes.data : null;
  const telegramEnabled = Boolean(telegramRes.ok && telegramRes.data?.enabled);

  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  return (
    <main className="space-y-6 max-w-2xl mx-auto w-full min-w-0">
      <div className="text-center sm:text-left">
        <h1 className="font-display text-3xl md:text-4xl text-tinta">
          Pengaturan
        </h1>
        <p className="text-sm text-tinta-pudar mt-1">
          Kelola kategori, bot notifikasi, dan kode unik integrasi webhook scan.
        </p>
      </div>

      <SettingsSubnav />

      <ApiKeyManager
        initialKeyData={keyData}
        telegramEnabled={telegramEnabled}
        baseUrl={baseUrl}
      />
    </main>
  );
}
