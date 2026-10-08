# ARCHITECTURE

## Stack
- **Framework:** Next.js (App Router) + TypeScript (strict)
- **UI:** Flowbite React (`flowbite-react`) di atas Tailwind CSS (detail visual → `DESIGN.md`)
- **Backend:** Firebase — Firestore + Firebase Auth (**tanpa Cloud Storage**)
  - Klien: Firebase JS SDK (`firebase`) **hanya untuk Auth**
  - Server: Firebase Admin SDK (`firebase-admin`) untuk Firestore
- **Ekstraksi gambar (tanpa AI):** `tesseract.js` (OCR di Web Worker, di browser) + parser aturan TypeScript (lihat `EXTRACTION.md`)
- **Validasi:** Zod (satu skema untuk klien & server)
- **Notifikasi:** Telegram Bot API (opsional, per user)
- **Chart:** Recharts
- **Hosting:** Vercel (atau Firebase App Hosting)

## Autentikasi
1. Klien login via Firebase Auth (email/password, opsional Google).
2. Klien mengirim **ID token** ke `POST /api/auth/session`; server verifikasi lalu membuat **session cookie** (`createSessionCookie`, httpOnly, secure, sameSite=lax, ±5 hari).
3. Setiap Server Component/Action/Route Handler memanggil `getCurrentUser()` (`lib/firebase/session.ts`) → `verifySessionCookie(cookie, true)` → `uid`.
4. `middleware.ts` hanya mengecek **keberadaan** cookie untuk redirect cepat (Admin SDK tidak jalan di Edge). Verifikasi sebenarnya di runtime Node.
5. Logout: hapus cookie + `signOut()` di klien.

## Alur Data (upload gambar) — semuanya di browser
```
[Client] pilih gambar → validasi (tipe, ≤ 10 MB)
   → preprocess (EXIF, resize, grayscale, kontras; pass ke-2 bila perlu)
   → OCR Tesseract.js (Web Worker, aset di-host sendiri)
   → parser aturan → ExtractionResult
   → form review (field ragu ditandai; preview dari file lokal)
   → user konfirmasi → Server Action createExpense()   // hanya data final, tanpa gambar/teks OCR
[Firestore] tulis users/{uid}/expenses/{id}
[Server] after(): jika Telegram aktif → kirim notifikasi (best-effort)
```
Tidak ada endpoint ekstraksi, tidak ada rate limit server, dan tidak ada log ekstraksi: gambar tidak pernah meninggalkan perangkat.

## Alur Notifikasi Telegram (opsional)
- Pengaturan di halaman `settings/notifications`: toggle, Bot Token, Channel/Chat ID, tombol "Kirim pesan tes". Tersimpan di `users/{uid}/settings/telegram` (token terenkripsi).
- Dipicu setelah `createExpense` sukses (manual maupun scan), dijalankan lewat `after()` dari `next/server` agar tidak menunda respons.
- `lib/telegram.ts`: baca settings → dekripsi token → `POST https://api.telegram.org/bot<token>/sendMessage` (`parse_mode=HTML`, semua teks user di-escape, timeout ±5 dtk, 1x retry hanya untuk 429 sesuai `retry_after`).
- **Best-effort:** kegagalan hanya di-log (tanpa token) dan **tidak pernah** menggagalkan penyimpanan pengeluaran.
- Format pesan (tanpa gambar):
  ```
  💸 Pengeluaran baru
  Nama: {name}
  Nominal: Rp {amount}
  Tanggal: {expense_date}
  Kategori: {category}
  Sumber: {Scan struk|Manual}
  ```
- Agar bot bisa posting ke **channel**, bot harus ditambahkan sebagai admin channel dengan izin kirim pesan.

## Struktur Folder
```
src/
  app/
    (auth)/login, register
    (app)/
      dashboard/page.tsx
      expenses/page.tsx            # list + filter
      expenses/new/page.tsx        # manual / scan
      expenses/[id]/page.tsx
      settings/
        categories/page.tsx
        notifications/page.tsx     # pengaturan Telegram
    api/
      auth/session/route.ts
  components/
    ui/                            # wrapper/komposisi komponen Flowbite React bila diperlukan
    expenses/ (ExpenseForm, ExpenseList, UploadDropzone, ReviewForm)
    dashboard/ (SummaryCards, CategoryChart)
    settings/ (TelegramSettingsForm)
  lib/
    firebase/ (client.ts, admin.ts, session.ts)
    extract/                       # OCR + parser (lihat EXTRACTION.md)
    telegram.ts
    crypto.ts                      # enkripsi/dekripsi AES-256-GCM
    categories.ts                  # kategori default (konstanta)
    money.ts
    date.ts
  actions/ (expenses.ts, categories.ts, notifications.ts)
  types/
public/
  tesseract/                       # worker, core WASM, data bahasa ind+eng (self-host)
firebase/
  firestore.rules
  firestore.indexes.json
firebase.json
tests/
  extract/, fixtures/
scripts/
  eval-extract.ts
  migrations/
```

## Keputusan Arsitektur
1. **Uang disimpan sebagai integer.** Jangan pakai float/desimal.
2. **Tanpa AI.** Ekstraksi = OCR + aturan. Tidak ada SDK/API key/panggilan LLM di mana pun.
3. **Ekstraksi di klien.** Gambar dan teks OCR tidak pernah dikirim ke server; server hanya menerima data final hasil review.
4. **Gambar tidak pernah disimpan.** Diproses di memori browser lalu dibuang. Tidak ada Storage, signed URL, atau arsip.
5. **Ekstraksi ≠ penyimpanan.** Hasil ekstraksi hanya mengisi form; penyimpanan setelah konfirmasi user. Server memvalidasi ulang semuanya.
6. **Akses data hanya lewat server (Admin SDK).** Firebase di klien hanya untuk Auth. Security Rules = deny all.
7. **Isolasi user = tanggung jawab kode.** Path Firestore dibangun dari `users/${uid}` (uid dari session) lewat helper `userCol(uid, 'expenses')`.
8. **Mesin OCR di balik interface `OcrEngine`**, parser berupa fungsi murni yang diuji tanpa gambar.
9. **Telegram opsional & best-effort**, token terenkripsi dan server-only.
10. **UI memakai Flowbite React.** Komponen interaktifnya adalah Client Component; halaman tetap Server Component dan hanya mengimpor komponen klien yang kecil.

## Environment Variables
```
# Klien (aman dipublikasikan)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Server only
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=              # ganti \n literal menjadi newline saat dibaca

TELEGRAM_ENCRYPTION_KEY=           # 32 byte base64, untuk enkripsi bot token

DEFAULT_CURRENCY=IDR
SESSION_COOKIE_MAX_AGE_DAYS=5
```

## Keamanan & Privasi
- Gambar dan teks OCR hanya ada di memori browser; tidak ada unggahan, tidak ada log. Aset OCR di-host sendiri sehingga tidak ada permintaan ke CDN pihak ketiga saat membaca struk.
- Validasi MIME & ukuran di klien untuk UX, dan server tetap memvalidasi data final.
- `FIREBASE_PRIVATE_KEY` dan `TELEGRAM_ENCRYPTION_KEY` tidak boleh ada di kode klien atau repo.
- Bot Token Telegram: terenkripsi saat disimpan, tidak pernah dikirim ke klien, tidak masuk log.
- Jangan commit gambar struk nyata yang berisi data pribadi; fixture harus dianonimkan.
- Firebase App Check (opsional) dan batasi API key Web ke domain sendiri.
- Saat Telegram aktif, data pengeluaran dikirim ke Telegram atas pilihan user; tampilkan catatan ini di halaman pengaturan.
