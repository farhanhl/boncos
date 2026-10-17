import { listExpenses } from "@/actions/expenses";
import { listCustomCategories } from "@/actions/categories";
import { ExpenseList } from "@/components/expenses/ExpenseList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Pengeluaran — Boncos",
};

export default async function ExpensesPage() {
  const [result, catRes] = await Promise.all([
    listExpenses({ limit: 50 }),
    listCustomCategories(),
  ]);
  const expenses = result.ok && result.data ? result.data.expenses : [];
  const customCategories = catRes.ok && catRes.data ? catRes.data : [];

  return (
    <main>
      <ExpenseList initialExpenses={expenses} customCategories={customCategories} />
    </main>
  );
}
