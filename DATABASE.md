# DATABASE (Firebase: Firestore + Auth)

## Prinsip
- **Firestore** untuk data, **Firebase Auth** untuk login. **Tidak ada Cloud Storage**: gambar tidak pernah disimpan (hanya dibaca sekali oleh AI lalu dibuang).
- Semua akses data dilakukan **dari server** (Server Actions / Route Handler) memakai **Firebase Admin SDK**. Klien tidak membaca/menulis Firestore langsung. Security Rules dipasang **deny all** sebagai lapisan pengaman tambahan.
- Admin SDK mem-bypass Security Rules, jadi **isolasi antar-user dijamin oleh kode**: setiap query wajib di-scope ke `users/{uid}`, dan `uid` hanya boleh berasal dari session cookie terverifikasi (bukan input klien).

## Struktur Firestore
```
users/{uid}
  displayName, email, currency ('IDR'), createdAt

users/{uid}/expenses/{expenseId}
  name: string
  name_lower: string               // untuk pencarian prefix sederhana
  amount: number                   // integer, satuan terkecil mata uang (IDR = rupiah penuh)
  currency: string                 // 'IDR'
  expense_date: string             // 'YYYY-MM-DD'
  month: string                    // 'YYYY-MM' (denormalisasi untuk query bulanan)
  category_id: string | null       // slug kategori default ('food') atau id dokumen kategori custom
  note: string | null
  source: 'manual' | 'ai'
  ai_confidence: number | null     // 0–1
  created_at: Timestamp
  updated_at: Timestamp

users/{uid}/categories/{categoryId}   // hanya kategori custom milik user
  name, icon, color, created_at

users/{uid}/settings/telegram         // satu dokumen, opsional
  enabled: boolean                 // default false
  chat_id: string                  // '@namachannel' atau id numerik (mis. '-1001234567890')
  bot_token_enc: string            // token terenkripsi AES-256-GCM (format "iv:tag:ciphertext", base64)
  bot_token_hint: string           // 4 karakter terakhir token, untuk tampilan "••••abcd"
  updated_at: Timestamp

users/{uid}/extractionLogs/{logId}    // ditulis server saja
  status: 'success' | 'not_expense' | 'error'
  latency_ms: number
  created_at: Timestamp
  // JANGAN simpan isi gambar atau hasil ekstraksi di log

rateLimits/{uid_hourBucket}           // ditulis server saja (transaksi increment)
  count: number
  expires_at: Timestamp               // aktifkan TTL policy pada field ini
```

### Kategori default
Tidak disimpan di Firestore; konstanta di `src/lib/categories.ts` dengan id slug:
`food` (Makanan & Minuman), `transport` (Transportasi), `shopping` (Belanja), `bills` (Tagihan), `entertainment` (Hiburan), `health` (Kesehatan), `education` (Pendidikan), `other` (Lainnya).
Kategori custom disimpan di `users/{uid}/categories`. `category_suggestion` dari AI dipetakan ke slug ini.

## Tipe Data
- `amount` = **number integer**. Firestore menyimpan angka sebagai double (aman sampai 2^53), cukup untuk IDR. Validasi `Number.isSafeInteger(amount) && amount > 0` di server.
- Tanggal transaksi sebagai string `YYYY-MM-DD` (urut & bebas masalah zona waktu); `created_at`/`updated_at` sebagai `Timestamp` via `FieldValue.serverTimestamp()`.

## Indeks
Composite index (definisikan di `firebase/firestore.indexes.json`):
- `expenses`: `category_id ASC, expense_date DESC`
- `expenses`: `month ASC, expense_date DESC`
Range tanggal: `where('expense_date','>=',from).where('expense_date','<=',to).orderBy('expense_date','desc')`.

## Agregasi Dashboard
- Total bulan ini / bulan lalu: aggregation query `sum('amount')` pada `where('month','==','YYYY-MM')`.
- Breakdown per kategori: ambil dokumen bulan tersebut lalu kelompokkan di server.
- Opsional v2: dokumen ringkasan `users/{uid}/summaries/{YYYY-MM}` yang diperbarui dalam transaksi.

## Pencarian
Firestore tidak punya full-text search. v1: prefix search pada `name_lower` (`>= q` dan `<= q + '\uf8ff'`). Full-text → v2.

## Keamanan Bot Token Telegram
- Dienkripsi di server dengan AES-256-GCM memakai `TELEGRAM_ENCRYPTION_KEY` (env, 32 byte base64) sebelum ditulis ke Firestore.
- **Tidak pernah** dikirim kembali ke klien; klien hanya menerima `enabled`, `chat_id`, dan `bot_token_hint`.
- Tidak boleh muncul di log.

## Security Rules (default deny; akses lewat Admin SDK)
`firebase/firestore.rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
> Alternatif jika kelak ingin akses langsung dari klien: buka `users/{uid}/**` dengan `request.auth.uid == uid` **kecuali** `settings/telegram` dan `extractionLogs` (tetap server-only), dan validasi bentuk field. Itu mengubah arsitektur; perbarui `ARCHITECTURE.md` lebih dulu.

## Penghapusan
- `deleteExpense`: hapus dokumen saja (tidak ada berkas terkait).
- Hapus akun: `recursiveDelete` pada `users/{uid}` lalu hapus user di Firebase Auth.

## Aturan Perubahan Struktur
Firestore schemaless: setiap perubahan bentuk dokumen harus (1) diperbarui di dokumen ini, (2) diperbarui di skema Zod, (3) disertai skrip migrasi di `scripts/migrations/` bila data lama terpengaruh.
