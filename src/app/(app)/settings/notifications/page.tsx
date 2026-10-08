import { getTelegramSettings } from "@/actions/notifications";
import { TelegramSettingsForm } from "@/components/settings/TelegramSettingsForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifikasi Telegram — Boncos",
};

export default async function TelegramSettingsPage() {
  const res = await getTelegramSettings();
  const settings = res.ok && res.data ? res.data : null;

  return (
    <main className="space-y-6">
      <div className="text-center sm:text-left max-w-xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl text-tinta">
          Pengaturan Notifikasi
        </h1>
        <p className="text-sm text-tinta-pudar mt-1">
          Hubungkan catatan pengeluaranmu ke bot channel Telegram secara otomatis.
        </p>
      </div>

      <TelegramSettingsForm initialSettings={settings} />
    </main>
  );
}
