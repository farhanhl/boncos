# TASKS — Roadmap Implementasi

Kerjakan berurutan. Centang setelah selesai dan lolos acceptance check di tiap fase. Baca `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `EXTRACTION.md` sebelum mulai.

## Fase 0 — Setup
- [x] Init Next.js (App Router, TypeScript strict, Tailwind, ESLint)
- [x] Install Flowbite React (`flowbite-react`; ikuti panduan instalasi Next.js + Tailwind di dokumentasi resminya), Zod, `firebase`, `firebase-admin`, Recharts, `tesseract.js`, dan test runner (mis. Vitest)
- [x] Terapkan token warna/tipografi dari `DESIGN.md` ke theme Flowbite & konfigurasi Tailwind; siapkan dark mode jika `DESIGN.md` memintanya
- [x] Buat project Firebase: aktifkan Auth (email/password) dan Firestore; buat service account (**Storage tidak dipakai**)
- [x] `.env.local` + `.env.example` (lihat `ARCHITECTURE.md`)
- [x] `lib/firebase/client.ts` (Auth saja) & `lib/firebase/admin.ts` (singleton, Firestore)

## Fase 1 — Auth & Fondasi Data
- [x] `/api/auth/session` + `getCurrentUser()` + `middleware.ts`
- [x] Halaman login/register, proteksi route `(app)`
- [x] Deploy `firestore.rules` (deny all) + `firestore.indexes.json`
- [x] Helper `userCol(uid, name)`
- [x] ✅ Cek: tanpa session → redirect; user A tidak bisa membaca data user B lewat action apa pun

## Fase 2 — CRUD Manual
- [x] `lib/money.ts` + unit test, `lib/categories.ts`
- [x] Server actions expenses
- [x] Halaman list + filter, form tambah/edit, hapus
- [x] ✅ Cek: nominal tersimpan integer, tampil `Rp 25.000`; composite index tidak error

## Fase 3 — Ekstraksi tanpa AI (inti)
Kerjakan **parser dulu** (murni, mudah diuji), baru OCR dan UI.
- [x] `lib/extract/parse/*`: `money`, `date`, `amount` (tier 1–4 + cross-check), `name`, `category`, `doc-type`, `confidence` + unit test sesuai `EXTRACTION.md`
- [x] Fixture teks OCR (`tests/fixtures/ocr-text/`) + test per contoh di `EXTRACTION.md`
- [x] `lib/extract/preprocess.ts` (EXIF, resize, grayscale, kontras, binarisasi adaptif untuk pass ke-2)
- [x] `lib/extract/ocr.ts`: Tesseract.js worker singleton, import dinamis, aset self-host di `public/tesseract/`, CSP
- [x] `extractFromImage()` (`lib/extract/index.ts`) menggabungkan pipeline + pass ke-2 + status/kode error
- [x] Fixture gambar dianonimkan (`tests/fixtures/receipts/`) + `scripts/eval-extract.ts`
- [x] `UploadDropzone` (pilih/kamera/drag/paste) + animasi menunggu + status `aria-live`
- [x] `ReviewForm`: highlight "Cek lagi" + preview dari file lokal (`createObjectURL`)
- [x] Simpan → `createExpense` dengan `source='scan'` + `extraction_confidence`
- [x] ✅ Cek: semua unit test hijau; eval mencapai target awal (nominal ≥ 90% screenshot/e-receipt, ≥ 75% foto struk cetak); panel Network tidak menunjukkan unggahan gambar atau panggilan ke domain eksternal

## Fase 4 — Notifikasi Telegram (opsional)
- [x] `lib/crypto.ts` (AES-256-GCM) + unit test enkripsi/dekripsi
- [x] `lib/telegram.ts` (kirim pesan, escape HTML, timeout, handle 429)
- [x] Actions `get/save/sendTest/deleteTelegramSettings`
- [x] Halaman `settings/notifications` (toggle, token, chat id, tombol tes, catatan privasi)
- [x] Hubungkan ke `createExpense` lewat `after()`
- [x] ✅ Cek: token tidak pernah ada di respons/log; Telegram gagal → pengeluaran tetap tersimpan; nonaktif → tidak ada pesan

## Fase 5 — Dashboard
- [x] Summary cards (aggregation `sum`), chart kategori, transaksi terakhir
- [x] Kelola kategori custom

## Fase 6 — Polish
- [x] Loading/empty/error states di semua halaman (sesuai `DESIGN.md` bagian 5 dan 7)
- [x] Audit UI terhadap `DESIGN.md` bagian 10, 11, dan 13
- [x] Tuning ekstraksi dari hasil eval: varian model bahasa, mode segmentasi, kamus kategori
- [x] Self-host & cache data bahasa OCR di `public/tesseract/`
- [x] Export CSV (P2) di halaman daftar pengeluaran
- [ ] Deploy (Vercel) + env produksi

## Definition of Done (per task)
Lolos `tsc --noEmit`, `eslint`, test terkait, dan tidak melanggar aturan di `AGENTS.md`.
