# API & SERVER ACTIONS

Semua endpoint (kecuali `/api/auth/session`) memerlukan session cookie valid. `uid` selalu dari session, **bukan** dari input. Respons error seragam: `{ ok: false, error: CODE, message }`.

> **Ekstraksi gambar tidak punya endpoint.** OCR dan parsing berjalan di browser (lihat `EXTRACTION.md`); gambar dan teks hasil OCR tidak pernah dikirim ke server. Server hanya menerima data final yang sudah direview user lewat `createExpense`.

## Route Handler

### `POST /api/auth/session`
- Body: `{ idToken }` → verifikasi → set session cookie. `DELETE` menghapus cookie.

## Server Actions (`src/actions/`)

| Action | Input | Keterangan |
|--------|-------|------------|
| `createExpense` | `{ name, amount, currency, expense_date, category_id?, note?, source: 'manual'\|'scan', extraction_confidence? }` | Validasi Zod; `extraction_confidence` hanya diterima bila `source = 'scan'` (0–1); isi `month`, `name_lower`, timestamp di server. Setelah sukses, jadwalkan `notifyTelegram()` via `after()` |
| `updateExpense` | `{ id, ...fields }` | Hanya dokumen di bawah `users/{uid}` |
| `deleteExpense` | `{ id }` | Hapus dokumen |
| `listExpenses` | `{ from?, to?, category_id?, q?, cursor?, limit? }` | Pagination `startAfter`; `q` = prefix search nama |
| `getDashboardSummary` | `{ month: 'YYYY-MM' }` | Total (aggregation `sum`), bulan lalu, breakdown kategori |
| `createCategory` / `updateCategory` / `deleteCategory` | | Hanya kategori custom |
| `getTelegramSettings` | — | Mengembalikan `{ enabled, chat_id, bot_token_hint }`, **tanpa token** |
| `saveTelegramSettings` | `{ enabled, chat_id, bot_token? }` | `bot_token` opsional saat update (kosong = pertahankan token lama). Validasi `chat_id` (`/^-?\d+$/` atau `/^@[A-Za-z0-9_]{5,}$/`) dan token via `getMe`; enkripsi sebelum simpan |
| `sendTelegramTest` | — | Kirim pesan tes ke channel; kembalikan sukses/gagal beserta alasan ramah (mis. "bot belum jadi admin channel") |
| `deleteTelegramSettings` | — | Hapus dokumen settings (token ikut terhapus) |

## Aturan
- Validasi input dengan Zod di setiap action; panggil `revalidatePath` setelah mutasi.
- Server memvalidasi ulang semua nilai (nominal integer > 0, tanggal valid), tidak mempercayai hasil ekstraksi dari klien.
- Jangan mengembalikan stack trace atau token ke klien.
- `notifyTelegram()` tidak boleh melempar error ke pemanggil; tangkap, log tanpa data sensitif, selesai.
