import { notFound } from "next/navigation";
import { getExpenseById } from "@/actions/expenses";
import { listCustomCategories } from "@/actions/categories";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ubah Pengeluaran — Boncos",
};

interface EditExpensePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const { id } = await params;
  const [res, catRes] = await Promise.all([
    getExpenseById(id),
    listCustomCategories(),
  ]);

  if (!res.ok || !res.data) {
    notFound();
  }

  const customCategories = catRes.ok && catRes.data ? catRes.data : [];

  return (
    <main>
      <ExpenseForm initialData={res.data} customCategories={customCategories} />
    </main>
  );
}
