import { listCustomCategories } from "@/actions/categories";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { SettingsSubnav } from "@/components/settings/SettingsSubnav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kelola Kategori — Boncos",
};

export default async function CategoriesSettingsPage() {
  const res = await listCustomCategories();
  const customCategories = res.ok && res.data ? res.data : [];

  return (
    <main className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center sm:text-left">
        <h1 className="font-display text-3xl md:text-4xl text-tinta">
          Pengaturan
        </h1>
        <p className="text-sm text-tinta-pudar mt-1">
          Kelola kategori, bot notifikasi, dan kode unik integrasi webhook scan.
        </p>
      </div>

      <SettingsSubnav />

      <CategoryManager customCategories={customCategories} />
    </main>
  );
}
