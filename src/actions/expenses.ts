"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { FieldValue, AggregateField } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import { userCol } from "@/lib/firebase/admin";
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ListExpensesInput,
  type ExpenseRecord,
} from "@/types/expense";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function findPotentialDuplicate(
  uid: string,
  data: { name: string; amount: number; expense_date: string }
): Promise<ExpenseRecord | null> {
  const querySnap = await userCol(uid, "expenses")
    .where("expense_date", "==", data.expense_date)
    .where("amount", "==", data.amount)
    .limit(10)
    .get();

  if (querySnap.empty) {
    return null;
  }

  const targetName = data.name.trim().toLowerCase();

  // 1. Check exact or partial name match
  for (const doc of querySnap.docs) {
    const d = doc.data();
    const docName = (d.name_lower || d.name || "").toLowerCase().trim();
    if (docName === targetName || docName.includes(targetName) || targetName.includes(docName)) {
      return {
        id: doc.id,
        name: d.name,
        name_lower: d.name_lower || docName,
        amount: d.amount,
        currency: d.currency || "IDR",
        expense_date: d.expense_date,
        month: d.month || d.expense_date.slice(0, 7),
        category_id: d.category_id || null,
        note: d.note || null,
        source: d.source || "manual",
        extraction_confidence: d.extraction_confidence ?? null,
        created_at: d.created_at?.toDate ? d.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: d.updated_at?.toDate ? d.updated_at.toDate().toISOString() : new Date().toISOString(),
      };
    }
  }

  // 2. If same date and exact amount, return the record as potential duplicate
  const firstDoc = querySnap.docs[0];
  if (firstDoc) {
    const d = firstDoc.data();
    return {
      id: firstDoc.id,
      name: d.name,
      name_lower: d.name_lower || d.name.toLowerCase(),
      amount: d.amount,
      currency: d.currency || "IDR",
      expense_date: d.expense_date,
      month: d.month || d.expense_date.slice(0, 7),
      category_id: d.category_id || null,
      note: d.note || null,
      source: d.source || "manual",
      extraction_confidence: d.extraction_confidence ?? null,
      created_at: d.created_at?.toDate ? d.created_at.toDate().toISOString() : new Date().toISOString(),
      updated_at: d.updated_at?.toDate ? d.updated_at.toDate().toISOString() : new Date().toISOString(),
    };
  }

  return null;
}

export async function checkDuplicateExpense(data: {
  name: string;
  amount: number;
  expense_date: string;
}): Promise<ActionResult<{ isDuplicate: boolean; duplicate?: ExpenseRecord }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." };
    }

    const duplicate = await findPotentialDuplicate(user.uid, data);
    return {
      ok: true,
      data: {
        isDuplicate: Boolean(duplicate),
        duplicate: duplicate || undefined,
      },
    };
  } catch {
    return { ok: false, error: "SERVER_ERROR", message: "Gagal memeriksa duplikasi pengeluaran." };
  }
}

export async function createExpense(
  rawInput: CreateExpenseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." };
    }

    const parsed = createExpenseSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        error: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message || "Data pengeluaran tidak valid.",
      };
    }

    const {
      name,
      amount,
      currency,
      expense_date,
      category_id,
      note,
      source,
      scan_method,
      extraction_confidence,
      allow_duplicate,
    } = parsed.data;

    if (!allow_duplicate) {
      const duplicate = await findPotentialDuplicate(user.uid, { name, amount, expense_date });
      if (duplicate) {
        return {
          ok: false,
          error: "DUPLICATE_EXPENSE",
          message: `Pengeluaran serupa "${duplicate.name}" (Rp ${duplicate.amount.toLocaleString("id-ID")}) sudah pernah dicatat pada tanggal ${duplicate.expense_date}.`,
          data: { id: duplicate.id },
        };
      }
    }

    const month = expense_date.slice(0, 7); // 'YYYY-MM'
    const name_lower = name.toLowerCase();

    const expensesRef = userCol(user.uid, "expenses");
    const docRef = expensesRef.doc();

    const method = scan_method || (source === "manual" ? "manual" : "ocr");

    const expenseData = {
      name,
      name_lower,
      amount,
      currency: currency || "IDR",
      expense_date,
      month,
      category_id: category_id || null,
      note: note || null,
      source,
      scan_method: method,
      extraction_confidence: source === "scan" ? extraction_confidence ?? null : null,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    await docRef.set(expenseData);

    // Schedule telegram notification best-effort using after()
    after(async () => {
      try {
        const { sendTelegramNotificationForExpense } = await import("@/lib/telegram");
        await sendTelegramNotificationForExpense(user.uid, {
          name,
          amount,
          expense_date,
          category_id: category_id || null,
          source,
          method,
        });
      } catch {
        // Best effort: never throws or fails createExpense
      }
    });


    revalidatePath("/expenses");
    revalidatePath("/dashboard");

    return { ok: true, data: { id: docRef.id } };
  } catch {
    return {
      ok: false,
      error: "SERVER_ERROR",
      message: "Gagal menyimpan pengeluaran. Silakan coba lagi.",
    };
  }
}

export async function updateExpense(
  rawInput: UpdateExpenseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." };
    }

    const parsed = updateExpenseSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        error: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message || "Data pengeluaran tidak valid.",
      };
    }

    const { id, ...updates } = parsed.data;
    const docRef = userCol(user.uid, "expenses").doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return { ok: false, error: "NOT_FOUND", message: "Pengeluaran tidak ditemukan." };
    }

    const payload: Record<string, unknown> = {
      updated_at: FieldValue.serverTimestamp(),
    };

    if (updates.name !== undefined) {
      payload.name = updates.name;
      payload.name_lower = updates.name.toLowerCase();
    }
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.expense_date !== undefined) {
      payload.expense_date = updates.expense_date;
      payload.month = updates.expense_date.slice(0, 7);
    }
    if (updates.category_id !== undefined) payload.category_id = updates.category_id;
    if (updates.note !== undefined) payload.note = updates.note;

    await docRef.update(payload);

    revalidatePath("/expenses");
    revalidatePath("/dashboard");

    return { ok: true, data: { id } };
  } catch {
    return {
      ok: false,
      error: "SERVER_ERROR",
      message: "Gagal memperbarui pengeluaran.",
    };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." };
    }

    if (!id) {
      return { ok: false, error: "INVALID_INPUT", message: "ID pengeluaran tidak valid." };
    }

    const docRef = userCol(user.uid, "expenses").doc(id);
    await docRef.delete();

    revalidatePath("/expenses");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "SERVER_ERROR",
      message: "Gagal menghapus pengeluaran.",
    };
  }
}

export async function listExpenses(
  rawInput: ListExpensesInput = {}
): Promise<
  ActionResult<{
    expenses: ExpenseRecord[];
    totalAmount?: number;
    totalCount?: number;
    nextCursor?: string;
  }>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." };
    }

    const parsed = listExpensesSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, error: "INVALID_INPUT", message: "Parameter filter tidak valid." };
    }

    const { from, to, category_id, q, limit } = parsed.data;
    let baseQuery: FirebaseFirestore.Query = userCol(user.uid, "expenses");

    if (category_id) {
      baseQuery = baseQuery.where("category_id", "==", category_id);
    }

    if (from && to) {
      baseQuery = baseQuery
        .where("expense_date", ">=", from)
        .where("expense_date", "<=", to);
    } else if (from) {
      baseQuery = baseQuery.where("expense_date", ">=", from);
    } else if (to) {
      baseQuery = baseQuery.where("expense_date", "<=", to);
    }

    // Execute aggregation query on baseQuery (before ordering and limit) for 100% accurate totals & counts
    let aggPromise: Promise<FirebaseFirestore.AggregateQuerySnapshot<{
      totalAmount: FirebaseFirestore.AggregateField<number>;
      totalCount: FirebaseFirestore.AggregateField<number>;
    }>> | null = null;

    try {
      if (typeof baseQuery.aggregate === "function") {
        aggPromise = baseQuery.aggregate({
          totalAmount: AggregateField.sum("amount"),
          totalCount: AggregateField.count(),
        }).get();
      }
    } catch {
      aggPromise = null;
    }

    const listQuery = baseQuery.orderBy("expense_date", "desc").limit(limit);

    const [aggregateSnap, snapshot] = await Promise.all([
      aggPromise ? aggPromise.catch(() => null) : Promise.resolve(null),
      listQuery.get(),
    ]);

    let records: ExpenseRecord[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        name_lower: d.name_lower || d.name?.toLowerCase(),
        amount: d.amount,
        currency: d.currency || "IDR",
        expense_date: d.expense_date,
        month: d.month || d.expense_date?.slice(0, 7),
        category_id: d.category_id || null,
        note: d.note || null,
        source: d.source || "manual",
        extraction_confidence: d.extraction_confidence ?? null,
        created_at: d.created_at?.toDate ? d.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: d.updated_at?.toDate ? d.updated_at.toDate().toISOString() : new Date().toISOString(),
      };
    });

    // Sort by expense_date DESC, then created_at DESC for consistent ordering
    records.sort((a, b) => {
      const dateComp = b.expense_date.localeCompare(a.expense_date);
      if (dateComp !== 0) return dateComp;
      return (b.created_at || "").localeCompare(a.created_at || "");
    });

    let totalAmount = 0;
    let totalCount = 0;

    if (aggregateSnap && typeof aggregateSnap.data === "function") {
      const aggData = aggregateSnap.data();
      totalAmount = Math.round(aggData.totalAmount ?? 0);
      totalCount = aggData.totalCount ?? 0;
    } else {
      totalAmount = records.reduce((acc, curr) => acc + curr.amount, 0);
      totalCount = records.length;
    }

    // In-memory prefix filter if q provided (v1 prefix search)
    if (q && q.trim()) {
      const qLower = q.trim().toLowerCase();
      records = records.filter((r) => r.name_lower.includes(qLower));
      totalAmount = records.reduce((acc, curr) => acc + curr.amount, 0);
      totalCount = records.length;
    }

    return {
      ok: true,
      data: {
        expenses: records,
        totalAmount,
        totalCount,
      },
    };
  } catch {
    return {
      ok: false,
      error: "SERVER_ERROR",
      message: "Gagal memuat daftar pengeluaran.",
    };
  }
}

export async function getExpenseById(id: string): Promise<ActionResult<ExpenseRecord>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, error: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." };
    }

    const doc = await userCol(user.uid, "expenses").doc(id).get();
    if (!doc.exists) {
      return { ok: false, error: "NOT_FOUND", message: "Pengeluaran tidak ditemukan." };
    }

    const d = doc.data()!;
    return {
      ok: true,
      data: {
        id: doc.id,
        name: d.name,
        name_lower: d.name_lower,
        amount: d.amount,
        currency: d.currency || "IDR",
        expense_date: d.expense_date,
        month: d.month,
        category_id: d.category_id || null,
        note: d.note || null,
        source: d.source || "manual",
        extraction_confidence: d.extraction_confidence ?? null,
        created_at: d.created_at?.toDate ? d.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: d.updated_at?.toDate ? d.updated_at.toDate().toISOString() : new Date().toISOString(),
      },
    };
  } catch {
    return {
      ok: false,
      error: "SERVER_ERROR",
      message: "Gagal memuat data pengeluaran.",
    };
  }
}
