import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminApp, userCol, getAdminDb } from "../src/lib/firebase/admin";

async function main() {
  getAdminApp();
  const auth = getAuth();
  const db = getAdminDb();

  console.log("=== SEED KATEGORI DEFAULT 'JAJAN' KE FIREBASE ===");

  // 1. Simpan di root collection 'categories/jajan'
  await db.collection("categories").doc("jajan").set(
    {
      id: "jajan",
      name: "Jajan",
      icon: "PiCookieBold",
      color: "#FFB020",
      is_default: true,
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log("✅ Berhasil menyimpan kategori 'jajan' di root collection 'categories'");

  // 2. Iterasi semua pengguna Firebase Auth untuk menambahkan subcollection users/{uid}/categories/jajan
  try {
    const listUsers = await auth.listUsers();
    console.log(`Ditemukan ${listUsers.users.length} pengguna terdaftar di Firebase Auth.`);

    for (const user of listUsers.users) {
      const uid = user.uid;
      const catRef = userCol(uid, "categories").doc("jajan");
      await catRef.set(
        {
          name: "Jajan",
          icon: "PiCookieBold",
          color: "#FFB020",
          is_default: true,
          created_at: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`  ✅ Kategori 'jajan' ditambahkan untuk user: ${user.email || uid}`);
    }
  } catch (err) {
    console.warn("Catatan: Tidak dapat melist user Auth (mungkin karena quota/limitasi koneksi):", err);
  }

  console.log("\nSelesai! Kategori default 'Jajan' telah dikonfigurasi di Firebase.");
}

main().catch((err) => {
  console.error("Gagal melakukan seed kategori ke Firebase:", err);
  process.exit(1);
});
