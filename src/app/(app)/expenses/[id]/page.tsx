import { notFound } from "next/navigation";
import { getExpenseById } from "@/actions/expenses";
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
  const res = await getExpenseById(id);

  if (!res.ok || !res.data) {
    notFound();
  }

  return (
    <main>
      <ExpenseForm initialData={res.data} />
    </main>
  );
}
