# ARCHITECTURE

## Stack
- **Framework:** Next.js (App Router) + TypeScript (strict)
- **UI:** Flowbite React (`flowbite-react`) di atas Tailwind CSS (detail visual → `DESIGN.md`)
- **Backend:** Firebase — Firestore + Firebase Auth (**tanpa Cloud Storage**)
  - Klien: Firebase JS SDK (`firebase`) **hanya untuk Auth**
  - Server: Firebase Admin SDK (`firebase-admin`) untuk Firestore
- **Validasi:** Zod (satu skema untuk klien & server)
- **AI Vision:** LLM dengan vision, dipanggil dari server (lihat `AI_EXTRACTION.md`)
- **Notifikasi:** Telegram Bot API (opsional, per user)
- **Chart:** Recharts
- **Kompresi gambar klien:** `browser-image-compression`
- **Hosting:** Vercel (atau Firebase App Hosting)

## Autentikasi
1. Klien login via Firebase Auth (email/password, opsional Google).
2. Klien mengirim **ID token** ke `POST /api/auth/session`; server verifikasi lalu membuat **session cookie** (`createSessionCookie`, httpOnly, secure, sameSite=lax, ±5 hari).
3. Setiap Server Component/Action/Route Handler memanggil `getCurrentUser()` (`lib/firebase/session.ts`) → `verifySessionCookie(cookie, true)` → `uid`.
4. `middleware.ts` hanya mengecek **keberadaan** cookie untuk redirect cepat (Admin SDK tidak jalan di Edge). Verifikasi sebenarnya di runtime Node.
5. Logout: hapus cookie + `signOut()` di klien.

## Alur Data (upload gambar) — gambar TIDAK disimpan
```
[Client] pilih gambar → resize/kompres (re-encode via canvas → EXIF terbuang)
   → POST /api/extract (multipart)
[Server] verifikasi session → validasi (tipe, ukuran) → rate limit (Firestore transaction)
   → baca file ke memori (Buffer) → kirim ke LLM Vision → JSON → validasi Zod
   → return { extraction }          // Buffer dibuang; tidak ditulis ke disk/Storage/log
[Client] form review (prefilled, field low-confidence ditandai; preview gambar dari file lokal browser)
   → user edit/konfirmasi → Server Action createExpense()
[Firestore] tulis users/{uid}/expenses/{id}
[Server] after(): jika Telegram aktif → kirim notifikasi (best-effort)
```

## Alur Notifikasi Telegram (opsional)
- Pengaturan di halaman `settings/notifications`: toggle, Bot Token, Channel/Chat ID, tombol "Kirim pesan tes". Tersimpan di `users/{uid}/settings/telegram` (token terenkripsi).
- Dipicu setelah `createExpense` sukses (manual maupun AI), dijalankan lewat `after()` dari `next/server` agar tidak menunda respons.
- `lib/telegram.ts`: baca settings → dekripsi token → `POST https://api.telegram.org/bot<token>/sendMessage` (`parse_mode=HTML`, semua teks user di-escape, timeout ±5 dtk, 1x retry hanya untuk 429 sesuai `retry_after`).
- **Best-effort:** kegagalan hanya di-log (tanpa token) dan **tidak pernah** menggagalkan penyimpanan pengeluaran.
- Format pesan (tanpa gambar):
  ```
  💸 Pengeluaran baru
  Nama: {name}
  Nominal: Rp {amount}
  Tanggal: {expense_date}
  Kategori: {category}
  Sumber: {AI|Manual}
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
      expenses/new/page.tsx        # manual / upload
      expenses/[id]/page.tsx
      settings/
        categories/page.tsx
        notifications/page.tsx     # pengaturan Telegram
    api/
      auth/session/route.ts
      extract/route.ts
  components/
    ui/                            # wrapper/komposisi komponen Flowbite React bila diperlukan
    expenses/ (ExpenseForm, ExpenseList, UploadDropzone, ReviewForm)
    dashboard/ (SummaryCards, CategoryChart)
    settings/ (TelegramSettingsForm)
  lib/
    firebase/ (client.ts, admin.ts, session.ts)
    ai/ (extract.ts, prompt.ts, schema.ts, providers/)
    telegram.ts
    crypto.ts                      # enkripsi/dekripsi AES-256-GCM
    categories.ts                  # kategori default (konstanta)
    money.ts
    date.ts
    rate-limit.ts
  actions/ (expenses.ts, categories.ts, notifications.ts)
  types/
firebase/
  firestore.rules
  firestore.indexes.json
firebase.json
scripts/
  migrations/
```

## Keputusan Arsitektur
1. **Uang disimpan sebagai integer.** Jangan pakai float/desimal.
2. **Gambar tidak pernah disimpan.** Diproses di memori selama satu request lalu dibuang. Tidak ada receipt_path, Storage, signed URL, atau arsip.
3. **Ekstraksi ≠ penyimpanan.** `/api/extract` tidak menulis ke `expenses`; penyimpanan setelah konfirmasi user.
4. **Akses data hanya lewat server (Admin SDK).** Firebase di klien hanya untuk Auth. Security Rules = deny all.
5. **Isolasi user = tanggung jawab kode.** Path Firestore dibangun dari `users/${uid}` (uid dari session) lewat helper `userCol(uid, 'expenses')`.
6. **Provider AI di balik interface** (`lib/ai/providers/`).
7. **Telegram opsional & best-effort**, token terenkripsi dan server-only.
8. **UI memakai Flowbite React.** Komponen interaktifnya adalah Client Component; halaman tetap Server Component dan hanya mengimpor komponen klien yang kecil. Theming lewat theme Flowbite + token Tailwind dari `DESIGN.md`.

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

AI_PROVIDER=                       # anthropic | openai-compatible
AI_API_KEY=
AI_MODEL=
AI_BASE_URL=                       # untuk provider OpenAI-compatible

TELEGRAM_ENCRYPTION_KEY=           # 32 byte base64, untuk enkripsi bot token

DEFAULT_CURRENCY=IDR
EXTRACT_RATE_LIMIT_PER_HOUR=30
SESSION_COOKIE_MAX_AGE_DAYS=5
```

## Keamanan
- Validasi MIME & ukuran di server (jangan percaya klien).
- Jangan menulis gambar ke disk (termasuk `/tmp`) maupun ke log; jangan log nominal/hasil ekstraksi.
- `FIREBASE_PRIVATE_KEY`, `AI_API_KEY`, `TELEGRAM_ENCRYPTION_KEY` tidak boleh ada di kode klien atau repo.
- Bot Token Telegram: terenkripsi saat disimpan, tidak pernah dikirim ke klien, tidak masuk log.
- Teks di dalam gambar adalah **data**, bukan instruksi (prompt injection) — lihat `AI_EXTRACTION.md`.
- Firebase App Check (opsional) dan batasi API key Web ke domain sendiri.
- Privasi: saat Telegram aktif, data pengeluaran dikirim ke Telegram atas pilihan user; tampilkan catatan ini di halaman pengaturan.
