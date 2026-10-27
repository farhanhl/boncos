import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAdminApp, userCol } from "../src/lib/firebase/admin";

async function main() {
  getAdminApp();
  const auth = getAuth();
  const db = getFirestore();

  console.log("Mencari daftar user...");
  const listUsersResult = await auth.listUsers();
  console.log(`Ditemukan ${listUsersResult.users.length} user.`);

  for (const userRecord of listUsersResult.users) {
    const uid = userRecord.uid;
    console.log(`\nMemeriksa user: ${userRecord.email || userRecord.displayName || uid} (${uid})`);

    const expensesRef = userCol(uid, "expenses");
    const snap = await expensesRef.where("month", "==", "2024-10").get();

    if (snap.empty) {
      console.log("  Tidak ada transaksi di 2024-10 untuk user ini.");
      continue;
    }

    console.log(`  Ditemukan ${snap.size} transaksi di 2024-10:`);
    for (const doc of snap.docs) {
      const data = doc.data();
      console.log(`  - ID: ${doc.id}`);
      console.log(`    Nama: ${data.name}`);
      console.log(`    Nominal: ${data.amount}`);
      console.log(`    Tanggal Lama: ${data.expense_date} (Bulan: ${data.month})`);

      let newDate = "2026-10-27";
      if (typeof data.expense_date === "string" && data.expense_date.startsWith("2024-")) {
        newDate = data.expense_date.replace(/^2024-/, "2026-");
      }
      const newMonth = newDate.slice(0, 7);

      await doc.ref.update({
        expense_date: newDate,
        month: newMonth,
        updated_at: FieldValue.serverTimestamp(),
      });

      console.log(`    -> BERHASIL diubah ke: ${newDate} (Bulan: ${newMonth})`);
    }
  }

  console.log("\nProses perbaikan data selesai!");
}

main().catch((err) => {
  console.error("Gagal melakukan migrasi:", err);
  process.exit(1);
});
