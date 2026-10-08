# PRD — Aplikasi Pencatatan Keuangan dengan Input Gambar

## 1. Ringkasan
Web app (Next.js) untuk mencatat pengeluaran. User bisa input manual **atau mengunggah gambar** (struk, bukti transfer, screenshot e-wallet/m-banking, nota). Sistem membaca gambar dengan AI Vision lalu mengisi otomatis: **nama pengeluaran, nominal, tanggal** (+ saran kategori). User mereview, lalu menyimpan. Gambar hanya dibaca sekali untuk ekstraksi dan **tidak disimpan** di mana pun. Opsional: setiap pencatatan baru dapat dikirim ke channel Telegram (diatur di halaman pengaturan).

## 2. Tujuan
- Mencatat pengeluaran dalam < 10 detik dari sebuah foto.
- Akurasi ekstraksi tinggi, dan selalu ada langkah review sebelum data disimpan.
- Ringkasan pengeluaran per hari/bulan/kategori.

## 3. Non-Goals (v1)
- Pencatatan pemasukan / multi-akun / multi-mata uang konversi.
- Integrasi langsung ke bank.
- Aplikasi mobile native (cukup responsive web/PWA).
- Penyimpanan/arsip gambar struk (gambar diproses sekali lalu dibuang).

## 4. Persona
Individu yang ingin mencatat pengeluaran harian dengan usaha minimal, terutama dari HP.

## 5. User Stories
| ID | Sebagai user, saya ingin... | Prioritas |
|----|------------------------------|-----------|
| US-1 | Login/daftar dengan email | P0 |
| US-2 | Upload gambar (pilih file, kamera, drag & drop, paste) | P0 |
| US-3 | Sistem mengekstrak nama, nominal, tanggal dari gambar | P0 |
| US-4 | Mereview & mengedit hasil ekstraksi sebelum disimpan | P0 |
| US-5 | Input pengeluaran manual | P0 |
| US-6 | Melihat daftar pengeluaran + filter (tanggal, kategori) | P0 |
| US-7 | Edit & hapus pengeluaran | P0 |
| US-8 | Menerima notifikasi di channel Telegram saat ada pencatatan baru (opsional, diatur di pengaturan) | P1 |
| US-9 | Dashboard ringkasan (total bulan ini, per kategori, tren) | P1 |
| US-10 | Kelola kategori sendiri | P1 |
| US-11 | Upload banyak gambar sekaligus (batch) | P2 |
| US-12 | Export CSV | P2 |

## 6. Functional Requirements

### 6.1 Upload & Ekstraksi
- Format: JPG, PNG, WEBP, HEIC (konversi di klien jika perlu). Maks 10 MB.
- Kompres/resize di klien (sisi terpanjang ≤ 1600px) sebelum upload.
- Gambar **tidak disimpan** (tidak ke Storage, disk, maupun database). Hanya dibaca sekali oleh AI lalu dibuang; preview di form review berasal dari file lokal di browser.
- Hasil ekstraksi: `name`, `amount`, `currency`, `expense_date`, `category_suggestion`, `confidence`, `is_expense`.
- Jika `is_expense = false` (bukan struk/bukti pengeluaran) → tampilkan pesan jelas, tawarkan input manual.
- Jika `confidence` rendah atau field null → field ditandai kuning, user wajib melengkapi.
- Format angka Indonesia harus dipahami: `Rp 25.000`, `25.000,00`, `25rb`, `1,5jt`.
- Tanggal ambigu (mis. 03/04/2026) diasumsikan format **DD/MM/YYYY**. Jika tanggal tidak ada → default hari ini, ditandai "perlu dicek".

### 6.2 Pengeluaran (CRUD)
Field: nama, nominal (integer, satuan terkecil mata uang), tanggal, kategori, catatan (opsional), sumber (`manual` | `ai`).

### 6.3 Dashboard
Total bulan ini, perbandingan bulan lalu, breakdown kategori (chart), 10 transaksi terakhir.

### 6.4 Notifikasi Telegram (opsional)
- Halaman Pengaturan → Notifikasi: toggle aktif/nonaktif, input Bot Token, input Channel/Chat ID, tombol "Kirim pesan tes".
- Default **nonaktif**. Saat aktif, setiap pengeluaran baru yang berhasil disimpan (manual maupun AI) mengirim pesan ke channel: nama, nominal, tanggal, kategori, sumber. Gambar tidak ikut dikirim.
- Kegagalan kirim Telegram tidak boleh menggagalkan penyimpanan pengeluaran.
- Bot Token disimpan terenkripsi dan tidak pernah ditampilkan penuh kembali ke klien.
- Halaman pengaturan menampilkan catatan bahwa data pengeluaran akan dikirim ke Telegram.

## 7. Non-Functional Requirements
- Mobile-first, responsive.
- Waktu ekstraksi p95 < 8 detik.
- Gambar tidak pernah disimpan; hanya diproses di memori server selama permintaan ekstraksi. Data pengeluaran hanya bisa diakses pemiliknya (akses lewat server + Security Rules deny-all).
- API key AI hanya di server, tidak pernah ke klien.
- Rate limit ekstraksi per user (mis. 30/jam) untuk menjaga biaya.

## 8. Acceptance Criteria (inti)
- [ ] Upload struk minimarket → form terisi nama toko, total, tanggal benar.
- [ ] Upload gambar non-struk (mis. foto kucing) → ditolak dengan pesan ramah.
- [ ] Data tidak tersimpan sebelum user menekan "Simpan".
- [ ] User A tidak bisa melihat data/gambar user B.
- [ ] Nominal tersimpan sebagai integer, tanpa error floating point.
- [ ] Setelah ekstraksi, tidak ada berkas gambar yang tersimpan di Storage/disk/database.
- [ ] Dengan Telegram aktif, pencatatan baru memicu pesan ke channel; jika Telegram gagal, pengeluaran tetap tersimpan.
- [ ] Bot Token tidak pernah muncul di respons ke klien.

## 9. Metrik Sukses
- % ekstraksi yang diterima user tanpa edit nominal ≥ 85%.
- Waktu rata-rata dari upload ke simpan < 15 detik.

## 10. Open Questions
- Provider AI Vision yang dipakai (lihat `AI_EXTRACTION.md`).
- Apakah perlu mendukung struk dengan banyak item (line items) di v2?
