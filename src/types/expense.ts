import { z } from "zod";

export const createExpenseSchema = z.object({
  name: z.string().trim().min(1, "Nama pengeluaran wajib diisi").max(100, "Nama maksimal 100 karakter"),
  amount: z
    .number()
    .int("Nominal harus berupa bilangan bulat")
    .positive("Nominal harus lebih dari 0")
    .max(1_000_000_000, "Nominal melebihi batas maksimal Rp 1.000.000.000"),
  currency: z.string().default("IDR"),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  category_id: z.string().nullable().optional(),
  note: z.string().trim().max(300, "Catatan maksimal 300 karakter").nullable().optional(),
  source: z.enum(["manual", "scan"]),
  extraction_confidence: z.number().min(0).max(1).nullable().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: z.string().min(1, "ID pengeluaran wajib diisi"),
});

export const listExpensesSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category_id: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesInput = z.input<typeof listExpensesSchema>;

export interface ExpenseRecord {
  id: string;
  name: string;
  name_lower: string;
  amount: number;
  currency: string;
  expense_date: string;
  month: string;
  category_id: string | null;
  note: string | null;
  source: "manual" | "scan";
  extraction_confidence: number | null;
  created_at: string; // ISO string for client
  updated_at: string;
}
