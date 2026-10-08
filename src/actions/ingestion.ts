"use server";

import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import { getAdminDb, userCol } from "@/lib/firebase/admin";

export interface IngestionKeyData {
  key: string;
  created_at?: string;
}

export async function getUserIngestionKey(): Promise<{
  ok: boolean;
  data?: IngestionKeyData;
  message?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, message: "Silakan masuk terlebih dahulu." };
    }

    const docRef = userCol(user.uid, "settings").doc("ingestion");
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data?.key) {
        return {
          ok: true,
          data: {
            key: data.key,
            created_at: data.created_at?.toDate?.()?.toISOString?.() || undefined,
          },
        };
      }
    }

    // Auto-generate key if not exists yet
    const newKey = `bnc_${crypto.randomBytes(16).toString("hex")}`;
    const db = getAdminDb();

    const batch = db.batch();
    batch.set(docRef, {
      key: newKey,
      created_at: FieldValue.serverTimestamp(),
    });
    batch.set(db.collection("api_keys").doc(newKey), {
      uid: user.uid,
      created_at: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return {
      ok: true,
      data: {
        key: newKey,
      },
    };
  } catch {
    return { ok: false, message: "Gagal memuat kode unik pengguna." };
  }
}

export async function regenerateUserIngestionKey(): Promise<{
  ok: boolean;
  data?: IngestionKeyData;
  message?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, message: "Silakan masuk terlebih dahulu." };
    }

    const docRef = userCol(user.uid, "settings").doc("ingestion");
    const existing = await docRef.get();
    const oldKey = existing.data()?.key;

    const newKey = `bnc_${crypto.randomBytes(16).toString("hex")}`;
    const db = getAdminDb();
    const batch = db.batch();

    if (oldKey) {
      batch.delete(db.collection("api_keys").doc(oldKey));
    }

    batch.set(docRef, {
      key: newKey,
      created_at: FieldValue.serverTimestamp(),
    });

    batch.set(db.collection("api_keys").doc(newKey), {
      uid: user.uid,
      created_at: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return {
      ok: true,
      data: {
        key: newKey,
      },
      message: "Kode unik berhasil diperbarui.",
    };
  } catch {
    return { ok: false, message: "Gagal memperbarui kode unik pengguna." };
  }
}

/**
 * Server-only helper to look up a user by ingestion key.
 */
export async function getUidByIngestionKey(key: string): Promise<string | null> {
  if (!key || typeof key !== "string" || !key.trim()) return null;
  try {
    const db = getAdminDb();
    const keyDoc = await db.collection("api_keys").doc(key.trim()).get();
    if (!keyDoc.exists) return null;
    const data = keyDoc.data();
    return (data?.uid as string) || null;
  } catch {
    return null;
  }
}
