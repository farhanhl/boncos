import { Suspense } from "react";
import { listCustomCategories } from "@/actions/categories";
import { NewExpenseTabs } from "@/components/expenses/NewExpenseTabs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catat Pengeluaran Baru — Boncos",
};

export default async function NewExpensePage() {
  const catRes = await listCustomCategories();
  const customCategories = catRes.ok && catRes.data ? catRes.data : [];

  return (
    <main>
      <Suspense fallback={<div className="text-center font-bold text-tinta">Memuat...</div>}>
        <NewExpenseTabs customCategories={customCategories} />
      </Suspense>
    </main>
  );
}
