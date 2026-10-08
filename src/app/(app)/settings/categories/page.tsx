import { listCustomCategories } from "@/actions/categories";
import { CategoryManager } from "@/components/settings/CategoryManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kelola Kategori — Boncos",
};

export default async function CategoriesSettingsPage() {
  const res = await listCustomCategories();
  const customCategories = res.ok && res.data ? res.data : [];

  return (
    <main className="space-y-6">
      <div className="text-center sm:text-left max-w-2xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl text-tinta">
          Kelola Kategori
        </h1>
        <p className="text-sm text-tinta-pudar mt-1">
          Daftar kategori pengeluaran untuk mengelompokkan catatan jajanmu.
        </p>
      </div>

      <CategoryManager customCategories={customCategories} />
    </main>
  );
}
