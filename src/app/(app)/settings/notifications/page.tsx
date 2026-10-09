import { getTelegramSettings } from "@/actions/notifications";
import { TelegramSettingsForm } from "@/components/settings/TelegramSettingsForm";
import { SettingsSubnav } from "@/components/settings/SettingsSubnav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifikasi Telegram — Boncos",
};

export default async function TelegramSettingsPage() {
  const res = await getTelegramSettings();
  const settings = res.ok && res.data ? res.data : null;

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

      <TelegramSettingsForm initialSettings={settings} />
    </main>
  );
}
