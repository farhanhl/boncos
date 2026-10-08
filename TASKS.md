# TASKS — Roadmap Implementasi

Kerjakan berurutan. Centang setelah selesai dan lolos acceptance check di tiap fase. Baca `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md` sebelum mulai.

## Fase 0 — Setup
- [ ] Init Next.js (App Router, TypeScript strict, Tailwind, ESLint)
- [ ] Install Flowbite React (`flowbite-react`; ikuti panduan instalasi Next.js + Tailwind di dokumentasi resminya), Zod, `firebase`, `firebase-admin`, Recharts
- [ ] Terapkan token warna/tipografi dari `DESIGN.md` ke theme Flowbite & konfigurasi Tailwind; siapkan dark mode jika `DESIGN.md` memintanya
- [ ] Buat project Firebase: aktifkan Auth (email/password) dan Firestore; buat service account (**Storage tidak dipakai**)
- [ ] `.env.local` + `.env.example` (lihat `ARCHITECTURE.md`)
- [ ] `lib/firebase/client.ts` (Auth saja) & `lib/firebase/admin.ts` (singleton, Firestore)

## Fase 1 — Auth & Fondasi Data
- [ ] `/api/auth/session` + `getCurrentUser()` + `middleware.ts`
- [ ] Halaman login/register, proteksi route `(app)`
- [ ] Deploy `firestore.rules` (deny all) + `firestore.indexes.json`
- [ ] Helper `userCol(uid, name)`
- ✅ Cek: tanpa session → redirect; user A tidak bisa membaca data user B lewat action apa pun

## Fase 2 — CRUD Manual
- [ ] `lib/money.ts` + unit test, `lib/categories.ts`
- [ ] Server actions expenses
- [ ] Halaman list + filter, form tambah/edit, hapus
- ✅ Cek: nominal tersimpan integer, tampil `Rp 25.000`; composite index tidak error

## Fase 3 — Ekstraksi Gambar (inti)
- [ ] `UploadDropzone` (pilih/kamera/drag/paste) + kompres klien
- [ ] `lib/ai/*` (schema, prompt, provider, pipeline — proses di memori)
- [ ] `POST /api/extract` + rate limit (Firestore transaction) + log (tanpa data gambar)
- [ ] `ReviewForm`: highlight field low-confidence + preview dari file lokal (`createObjectURL`)
- [ ] Simpan → `createExpense` dengan `source='ai'`
- ✅ Cek: test set akurasi nominal ≥ 85%; tidak ada berkas gambar tertulis di disk/Storage/DB

## Fase 4 — Notifikasi Telegram (opsional)
- [ ] `lib/crypto.ts` (AES-256-GCM) + unit test enkripsi/dekripsi
- [ ] `lib/telegram.ts` (kirim pesan, escape HTML, timeout, handle 429)
- [ ] Actions `get/save/sendTest/deleteTelegramSettings`
- [ ] Halaman `settings/notifications` (toggle, token, chat id, tombol tes, catatan privasi)
- [ ] Hubungkan ke `createExpense` lewat `after()`
- ✅ Cek: token tidak pernah ada di respons/log; Telegram gagal → pengeluaran tetap tersimpan; nonaktif → tidak ada pesan

## Fase 5 — Dashboard
- [ ] Summary cards (aggregation `sum`), chart kategori, transaksi terakhir
- [ ] Kelola kategori custom

## Fase 6 — Polish
- [ ] Loading/empty/error states di semua halaman
- [ ] TTL policy untuk `rateLimits.expires_at`
- [ ] PWA manifest (opsional), optimasi mobile
- [ ] Batch upload, export CSV (P2)
- [ ] Deploy (Vercel) + env produksi

## Definition of Done (per task)
Lolos `tsc --noEmit`, `eslint`, test terkait, dan tidak melanggar aturan di `AGENTS.md`.
