import { Suspense } from "react";
import { NewExpenseTabs } from "@/components/expenses/NewExpenseTabs";

export const metadata = {
  title: "Catat Pengeluaran Baru — Boncos",
};

export default function NewExpensePage() {
  return (
    <main>
      <Suspense fallback={<div className="text-center font-bold text-tinta">Memuat...</div>}>
        <NewExpenseTabs />
      </Suspense>
    </main>
  );
}
