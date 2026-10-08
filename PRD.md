# PRD — Aplikasi Pencatatan Keuangan dengan Input Gambar

## 1. Ringkasan
Web app (Next.js) untuk mencatat pengeluaran. User bisa input manual **atau mengunggah gambar** (struk, bukti transfer, screenshot e-wallet/m-banking, nota). Sistem membaca gambar dengan **OCR + aturan parsing, tanpa AI**, seluruhnya di browser, lalu mengisi otomatis: **nama pengeluaran, nominal, tanggal** (+ saran kategori). User mereview, lalu menyimpan. Gambar hanya dibaca sekali dan **tidak disimpan maupun dikirim ke server**. Opsional: setiap pencatatan baru dapat dikirim ke channel Telegram (diatur di halaman pengaturan).

## 2. Tujuan
- Mencatat pengeluaran dalam < 15 detik dari sebuah foto/screenshot.
- Akurasi ekstraksi memadai untuk dokumen yang rapi, dan **selalu ada langkah review** sebelum data disimpan.
- Privasi kuat: gambar tidak pernah meninggalkan perangkat user.
- Ringkasan pengeluaran per hari/bulan/kategori.

## 3. Non-Goals (v1)
- Pencatatan pemasukan / multi-akun / konversi multi-mata uang.
- Integrasi langsung ke bank.
- Aplikasi mobile native (cukup responsive web/PWA).
- Penyimpanan/arsip gambar struk.
- Ekstraksi berbasis AI/LLM atau OCR cloud.
- Membaca tulisan tangan secara andal (jatuh ke isi manual).

## 4. Persona
Individu yang ingin mencatat pengeluaran harian dengan usaha minimal, terutama dari HP.

## 5. User Stories
| ID | Sebagai user, saya ingin... | Prioritas |
|----|------------------------------|-----------|
| US-1 | Login/daftar dengan email | P0 |
| US-2 | Upload gambar (pilih file, kamera, drag & drop, paste) | P0 |
| US-3 | Sistem mengekstrak nama, nominal, tanggal dari gambar (OCR di browser) | P0 |
| US-4 | Mereview & mengedit hasil ekstraksi sebelum disimpan | P0 |
| US-5 | Input pengeluaran manual | P0 |
| US-6 | Melihat daftar pengeluaran + filter (tanggal, kategori) | P0 |
| US-7 | Edit & hapus pengeluaran | P0 |
| US-8 | Menerima notifikasi di channel Telegram saat ada pencatatan baru (opsional, diatur di pengaturan) | P1 |
| US-9 | Dashboard ringkasan (total bulan ini, per kategori, tren) | P1 |
| US-10 | Kelola kategori sendiri | P1 |
| US-11 | Upload banyak gambar sekaligus (batch, diproses berurutan) | P2 |
| US-12 | Export CSV | P2 |

## 6. Functional Requirements

### 6.1 Upload & Ekstraksi (tanpa AI)
- Format: JPG, PNG, WEBP (HEIC bila browser mendukung/dikonversi di klien). Maks 10 MB.
- Seluruh proses di browser: preprocessing gambar → OCR (Tesseract.js, bahasa Indonesia + Inggris) → parser aturan. Detail di `EXTRACTION.md`.
- Hasil ekstraksi: `name`, `amount`, `expense_date`, `category_suggestion`, masing-masing dengan confidence, plus status (`ok`/`partial`/`empty`).
- Gambar **tidak disimpan** dan **tidak dikirim ke server**. Preview di form review berasal dari file lokal di browser.
- Jika tidak ada teks yang terbaca atau gambar bukan bukti pengeluaran → pesan jelas, tawarkan input manual.
- Field kosong atau confidence < 0,7 ditandai "Cek lagi"; user wajib melengkapi.
- Format angka Indonesia harus dipahami: `Rp 25.000`, `25.000,00`, `25,000.00`, `25rb`, `1,5jt`.
- Tanggal ambigu (mis. 03/04/2026) diasumsikan DD/MM/YYYY. Jika tanggal tidak ada → default hari ini, ditandai "Cek lagi".
- Pertama kali, data bahasa OCR diunduh lalu di-cache; UI menjelaskan prosesnya.

### 6.2 Pengeluaran (CRUD)
Field: nama, nominal (integer rupiah), tanggal, kategori, catatan (opsional), sumber (`manual` | `scan`), confidence ekstraksi (opsional, hanya untuk `scan`).

### 6.3 Dashboard
Total bulan ini, perbandingan bulan lalu, breakdown kategori (chart), 10 transaksi terakhir.

### 6.4 Notifikasi Telegram (opsional)
- Halaman Pengaturan → Notifikasi: toggle aktif/nonaktif, input Bot Token, input Channel/Chat ID, tombol "Kirim pesan tes".
- Default **nonaktif**. Saat aktif, setiap pengeluaran baru yang berhasil disimpan (manual maupun scan) mengirim pesan ke channel: nama, nominal, tanggal, kategori, sumber. Gambar tidak ikut dikirim.
- Kegagalan kirim Telegram tidak boleh menggagalkan penyimpanan pengeluaran.
- Bot Token disimpan terenkripsi dan tidak pernah ditampilkan penuh kembali ke klien.
- Halaman pengaturan menampilkan catatan bahwa data pengeluaran akan dikirim ke Telegram.

## 7. Non-Functional Requirements
- Mobile-first, responsive.
- Waktu ekstraksi ≤ 10 detik per gambar di HP kelas menengah (setelah data bahasa termuat).
- Gambar tidak pernah disimpan maupun diunggah; diproses hanya di memori browser. Data pengeluaran hanya bisa diakses pemiliknya (akses lewat server + Security Rules deny-all).
- Tidak ada panggilan ke layanan AI/LLM atau OCR pihak ketiga; aset OCR di-host sendiri.
- Bundle utama tidak boleh membengkak: modul OCR dimuat dinamis saat dibutuhkan.

## 8. Acceptance Criteria (inti)
- [ ] Screenshot e-wallet/m-banking dan struk cetak yang rapi → form terisi nama, total, tanggal benar sesuai target di `EXTRACTION.md`.
- [ ] Gambar tanpa teks/bukan struk → ditolak dengan pesan ramah dan opsi isi manual.
- [ ] Data tidak tersimpan sebelum user menekan "Simpan".
- [ ] User A tidak bisa melihat data user B.
- [ ] Nominal tersimpan sebagai integer, tanpa error floating point.
- [ ] Panel Network browser menunjukkan **tidak ada** unggahan gambar atau panggilan ke domain AI/OCR eksternal saat ekstraksi.
- [ ] Dengan Telegram aktif, pencatatan baru memicu pesan ke channel; jika Telegram gagal, pengeluaran tetap tersimpan.
- [ ] Bot Token tidak pernah muncul di respons ke klien.

## 9. Metrik Sukses
- Nominal benar tanpa edit: ≥ 90% untuk screenshot/e-receipt, ≥ 75% untuk foto struk cetak (target awal, direvisi setelah evaluasi).
- Waktu rata-rata dari upload ke simpan < 20 detik.

## 10. Open Questions
- Dukungan HEIC (perlu konversi di klien?).
- Varian model bahasa Tesseract (fast vs best) dan mode segmentasi halaman terbaik, ditentukan lewat evaluasi.
- Apakah perlu deskew (meluruskan foto miring) di v1 atau v2?
