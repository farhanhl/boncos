"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import { userCol } from "@/lib/firebase/admin";

export interface CustomCategoryRecord {
  id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(30),
  icon: z.string().default("PiTagBold"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Format warna heksadesimal tidak valid"),
});

export async function listCustomCategories(): Promise<{
  ok: boolean;
  data?: CustomCategoryRecord[];
  message?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Silakan masuk terlebih dahulu." };

    const snap = await userCol(user.uid, "categories").orderBy("created_at", "asc").get();
    const categories: CustomCategoryRecord[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        icon: d.icon || "PiTagBold",
        color: d.color || "#FF9F45",
        created_at: d.created_at?.toDate ? d.created_at.toDate().toISOString() : new Date().toISOString(),
      };
    });

    return { ok: true, data: categories };
  } catch {
    return { ok: false, message: "Gagal memuat kategori custom." };
  }
}

export async function createCustomCategory(
  rawInput: z.infer<typeof categorySchema>
): Promise<{ ok: boolean; data?: { id: string }; message?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Silakan masuk terlebih dahulu." };

    const parsed = categorySchema.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message || "Input tidak valid" };
    }

    const docRef = userCol(user.uid, "categories").doc();
    await docRef.set({
      name: parsed.data.name,
      icon: parsed.data.icon,
      color: parsed.data.color,
      created_at: FieldValue.serverTimestamp(),
    });

    revalidatePath("/settings/categories");
    return { ok: true, data: { id: docRef.id }, message: "Kategori berhasil dibuat." };
  } catch {
    return { ok: false, message: "Gagal menambahkan kategori." };
  }
}

export async function deleteCustomCategory(id: string): Promise<{
  ok: boolean;
  message?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Silakan masuk terlebih dahulu." };

    await userCol(user.uid, "categories").doc(id).delete();
    revalidatePath("/settings/categories");
    return { ok: true, message: "Kategori berhasil dihapus." };
  } catch {
    return { ok: false, message: "Gagal menghapus kategori." };
  }
}
