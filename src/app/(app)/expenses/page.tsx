import { listExpenses } from "@/actions/expenses";
import { ExpenseList } from "@/components/expenses/ExpenseList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Jajan — Boncos",
};

export default async function ExpensesPage() {
  const result = await listExpenses({ limit: 50 });
  const expenses = result.ok && result.data ? result.data.expenses : [];

  return (
    <main>
      <ExpenseList initialExpenses={expenses} />
    </main>
  );
}
