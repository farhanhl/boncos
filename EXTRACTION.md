# EXTRACTION — Gambar → Data Pengeluaran (tanpa AI)

## Tujuan & Batasan
Mengubah gambar (struk, nota, bukti transfer, screenshot e-wallet/m-banking) menjadi `nama`, `nominal`, `tanggal`, dan saran kategori memakai **OCR + parser berbasis aturan**.
- **Tidak ada AI/LLM sama sekali**: tidak ada panggilan API model, tidak ada API key AI.
- **Seluruhnya berjalan di browser user.** Gambar tidak pernah diunggah ke server mana pun, tidak disimpan, dan tidak dicatat di log.
- Hasil selalu melewati **review user** sebelum disimpan. Parser harus jujur soal ketidakpastian: lebih baik mengosongkan field dan menandainya "Cek lagi" daripada menebak.
- Target: screenshot dan struk cetak yang rapi terbaca baik; foto buram, struk pudar, dan tulisan tangan **di luar target** dan jatuh ke review/isi manual.

## Pipeline
```
[File] → validasi (tipe, ≤ 10 MB)
  → preprocess (orientasi EXIF, resize, grayscale, kontras)           lib/extract/preprocess.ts
  → OCR Tesseract.js di Web Worker (lang: ind+eng)                    lib/extract/ocr.ts
  → normalisasi teks + deteksi jenis dokumen                          lib/extract/parse/normalize.ts
  → ekstraksi field: nominal, tanggal, nama, kategori                 lib/extract/parse/*
  → hitung confidence + status                                        lib/extract/index.ts
  → ExtractionResult → form review
(jika confidence rendah: pass ke-2 dengan preprocessing berbeda, ambil hasil terbaik; maksimal 2 pass)
```

## Setup Tesseract.js
- Paket: `tesseract.js`. Di-import **dinamis** (`import()`) hanya saat tab "Foto struk" dibuka, supaya bundle utama tidak membengkak.
- **Self-host** file worker, core (WASM), dan data bahasa `ind` + `eng` di `public/tesseract/`, lalu arahkan lewat opsi `workerPath`, `corePath`, `langPath` pada `createWorker`. Nama dan lokasi file mengikuti versi `tesseract.js` yang terpasang (lihat dokumentasinya). Alasan: tidak bergantung CDN pihak ketiga dan tidak ada permintaan keluar saat membaca struk.
- Bandingkan varian model bahasa "fast" dan "best" di test set; pilih berdasarkan akurasi vs ukuran unduhan.
- **Worker singleton**: dibuat sekali, dipakai ulang, di-`terminate()` setelah idle ±60 detik untuk membebaskan memori. Proses satu gambar pada satu waktu (batch = antrean berurutan).
- Pertama kali, data bahasa diunduh lalu di-cache browser; UI menampilkan status "Menyiapkan pembaca struk (cukup sekali)".
- Jika memakai Content-Security-Policy, izinkan `worker-src blob:` dan eksekusi WebAssembly.
- Atur `tessedit_pageseg_mode` (uji PSM 4 vs 6 di test set; default awal 6 untuk struk, 4 untuk screenshot).
- Abstraksikan di balik interface agar mesin OCR bisa diganti tanpa menyentuh parser:
```ts
interface OcrEngine {
  recognize(image: ImageBitmap | Blob, opts?: { psm?: number }): Promise<OcrOutput>;
  dispose(): Promise<void>;
}
type OcrOutput = {
  text: string;
  lines: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[];
};
```
Tinggi bounding box baris dipakai sebagai petunjuk "seberapa menonjol" sebuah teks (nominal besar di screenshot e-wallet).

## Preprocessing (`preprocess.ts`, Canvas API, tanpa library berat)
1. Decode dengan koreksi orientasi EXIF (`createImageBitmap(file, { imageOrientation: 'from-image' })`). Hasil re-encode otomatis membuang EXIF/lokasi.
2. Skala: sisi terpanjang dibatasi ±2000px; jika lebar < 1000px, perbesar ×2 (teks setinggi ≥ 25px lebih mudah dibaca OCR).
3. Grayscale + normalisasi kontras (regangkan histogram).
4. **Pass 2 (hanya bila confidence pass 1 rendah):** binarisasi adaptif (mis. Sauvola/Bradley) untuk foto kertas thermal. Screenshot bersih tidak perlu binarisasi.
5. Pilih hasil dengan skor lebih tinggi (`extraction_confidence`, lalu `ocr_confidence`).
Deskew (luruskan foto miring) bukan bagian v1; catat sebagai peningkatan.

## Output
```ts
type CategorySlug = 'food'|'transport'|'shopping'|'bills'|'entertainment'|'health'|'education'|'other';
type Field<T> = { value: T | null; confidence: number /* 0–1 */; rule: string /* id aturan, untuk debug */ };

type ExtractionResult = {
  status: 'ok' | 'partial' | 'empty';
  doc_type: 'receipt' | 'ewallet' | 'bank_transfer' | 'unknown';
  name: Field<string>;
  amount: Field<number>;             // integer rupiah
  expense_date: Field<string>;       // 'YYYY-MM-DD'
  category_suggestion: Field<CategorySlug>;
  extraction_confidence: number;     // 0.6*amount + 0.2*date + 0.2*name (null dihitung 0)
  ocr_confidence: number;            // rata-rata confidence baris OCR
  warnings: string[];                // mis. 'Tanggal lebih dari setahun lalu'
  raw_text: string;                  // hanya di memori klien (debug); tidak dikirim/disimpan
};
```
Kode error (klien): `INVALID_FILE`, `OCR_FAILED` (worker/WASM/data bahasa gagal dimuat), `NO_TEXT` (< 10 karakter alfanumerik terbaca), `NOT_AN_EXPENSE` (teks terbaca tapi tidak ada nominal dan tidak ada kata kunci transaksi).
`status`: `ok` jika nominal, tanggal, nama terisi dengan confidence ≥ 0,7; `partial` jika nominal ada tapi field lain kosong/ragu; `empty` jika tidak ada nominal (form tetap dibuka, semua field "Cek lagi").

## Parser (fungsi murni, tanpa I/O, semuanya diuji unit)

### 1. Normalisasi
- Pisahkan per baris; buat salinan huruf besar untuk pencocokan kata kunci (nilai asli dipertahankan untuk nama).
- Seragamkan penanda mata uang: `Rp`, `Rp.`, `RP`, `IDR`, `Rp:` → `Rp`.
- Perbaiki salah baca OCR **hanya pada token yang berpola angka bersepar ribuan** (mis. `2O.OOO`, `1O0.000`): `O/o→0`, `I/l/|→1`, `S→5`, `B→8`. Jangan menyentuh kata biasa.
- Hapus spasi di dalam angka berpola ribuan (`25 000` → `25.000`) bila ada tepat tiga digit setelah spasi.

### 2. `parseMoney(token) → integer | null`
| Input | Hasil |
|-------|-------|
| `Rp 25.000` · `Rp25.000,-` · `25.000,00` · `25,000.00` · `25,000` · `25000` | 25000 |
| `1.250.000` | 1250000 |
| `25rb` · `25 rb` · `25k` · `25 ribu` | 25000 |
| `1,5jt` · `1.5jt` · `1,5 juta` | 1500000 |
| `Rp 12.5` (bukan integer rupiah) | null |
| `Rp 0` · di bawah batas minimum | null |
Aturan pemisah: separator yang diikuti **tepat 3 digit** = pemisah ribuan; separator terakhir yang diikuti **1–2 digit** pada angka berpola ribuan = desimal (dibuang jika `,00`/`.00`; selain itu → null). Batas wajar: minimal Rp 100, maksimal Rp 1.000.000.000 (konfigurasi di satu konstanta).

### 3. Nominal (`amount`)
Kandidat dikumpulkan lalu dipilih berurutan:
1. **Kata kunci total kuat** (confidence 0,9): `GRAND TOTAL`, `TOTAL BAYAR`, `TOTAL PEMBAYARAN`, `TOTAL TAGIHAN`, `TOTAL BELANJA`, `JUMLAH BAYAR`, `AMOUNT DUE`, dan `TOTAL` polos. Ambil angka paling kanan di baris itu; jika baris tidak punya angka, ambil dari baris berikutnya.
   **Abaikan** baris yang mengandung: `SUBTOTAL`, `SUB TOTAL`, `TOTAL ITEM`, `TOTAL QTY`, `TOTAL DISKON`, `TOTAL HEMAT`, `PPN`, `PAJAK`, `SERVICE`, `DISKON`, `KEMBALI`, `KEMBALIAN`, `CHANGE`, serta baris `TUNAI`/`CASH`/`BAYAR`/`DIBAYAR` yang berdiri sendiri (itu uang yang diserahkan, bukan total).
2. **Cross-check tunai − kembali:** jika ada `TUNAI` dan `KEMBALI`, hitung `tunai − kembali`. Cocok dengan kandidat tier 1 → confidence 0,95. Jika tier 1 kosong, pakai nilai turunan ini (0,8).
3. **Screenshot e-wallet/bank** (0,85): kata kunci `NOMINAL`, `JUMLAH TRANSFER`, `NOMINAL TRANSFER`, `TOTAL TRANSAKSI`, `JUMLAH`, `TOTAL`, atau baris berawalan `Rp` dengan **bounding box tertinggi** di separuh atas gambar.
4. **Cadangan** (0,5): angka berawalan `Rp` terbesar yang bukan di baris tunai/kembali; jika tidak ada, angka berseparator ribuan terbesar. Tambahkan warning "Nominal ditebak dari angka terbesar".
5. Tidak ada kandidat valid → `null`.
Jika beberapa kandidat tier yang sama berbeda nilai, pilih yang paling dekat dengan bagian bawah (struk) atau bagian atas (screenshot) dan turunkan confidence 0,15.

### 4. Tanggal (`expense_date`)
Pola, berurutan (ambil yang pertama valid, selain baris berkata kunci bukan-tanggal-transaksi: `EXPIRED`, `KADALUARSA`, `JATUH TEMPO`, `BERLAKU`, `VALID`):
1. ISO `2026-10-08` / `2026/10/08`.
2. Numerik `dd/mm/yyyy`, `dd-mm-yy`, `dd.mm.yyyy`. Default **DD/MM**; jika angka kedua > 12 dan pertama ≤ 12, tukar (format MM/DD). Tahun 2 digit → 20xx.
3. Nama bulan: `8 Okt 2026`, `08 OCT 2026`, `8 Agustus 2026`. Peta bulan: JAN/JANUARI, FEB/FEBRUARI/PEB, MAR/MARET, APR/APRIL, MEI/MAY, JUN/JUNI, JUL/JULI, AGU/AGT/AGUSTUS/AUG, SEP/SEPT/SEPTEMBER, OKT/OKTOBER/OCT, NOV/NOVEMBER/NOP, DES/DESEMBER/DEC.
Validasi: tanggal harus nyata (`31/02` → null); **lebih dari besok dari hari ini → null**; lebih dari 365 hari lalu → nilai dipertahankan, confidence 0,4, warning.
Confidence: 0,9 bila ada label (`TANGGAL`, `TGL`, `DATE`, `WAKTU`) atau jam di sebelahnya; 0,75 bila hanya pola tanggal; tidak ada → `null` (form default hari ini, ditandai "Cek lagi").

### 5. Jenis dokumen (`doc_type`)
- `bank_transfer`/`ewallet`: ada kata seperti `TRANSAKSI BERHASIL`, `TRANSFER BERHASIL`, `PEMBAYARAN BERHASIL`, `BUKTI TRANSFER`, `BUKTI PEMBAYARAN`, `QRIS`, `NO. REFERENSI`, `ID TRANSAKSI`, atau nama aplikasi/bank (GoPay, OVO, DANA, ShopeePay, LinkAja, BCA, BRI, BNI, Mandiri, BSI, Jago, SeaBank).
- `receipt`: ada `TOTAL` bersama baris item atau `KASIR`/`NO STRUK`/`NPWP`.
- selain itu `unknown`. Jenis dokumen menentukan strategi nama dan nominal di atas.

### 6. Nama (`name`)
- **E-wallet/bank:** nilai di sebelah label `Penerima`, `Ke`, `Tujuan`, `Merchant`, `Nama Merchant`, `Dibayar ke`, `Pembayaran ke` (pada baris yang sama setelah pemisah, atau baris berikutnya). Transfer antar-orang diberi awalan "Transfer ke ". Confidence 0,85.
- **Struk:** 1–5 baris teratas; pilih baris pertama yang panjang ≥ 3, rasio huruf ≥ 0,6, dan **bukan** alamat/telepon (`JL`, `JALAN`, `NO.`, `TELP`, `TLP`, `HP`, `WA`, `NPWP`, `KEL.`, `KEC.`, `KOTA`, `RT`, `RW`, ≥ 9 digit berturut) dan bukan kata generik (`STRUK`, `NOTA`, `RECEIPT`, `INVOICE`, `FAKTUR`, `KASIR`, `SELAMAT DATANG`, `TERIMA KASIH`). Confidence 0,65, atau 0,85 bila cocok dengan kamus merchant (Indomaret, Alfamart, dst.).
- Rapikan menjadi Title Case ("WARUNG BU TINI" → "Warung Bu Tini"), maksimal 60 karakter. Tidak ketemu → `null`.

### 7. Kategori (`category_suggestion`)
Kamus kata kunci di `lib/extract/category-keywords.ts` (mudah diedit, satu file). Cocokkan terhadap seluruh teks (huruf besar, batas kata); kategori dengan kecocokan terbanyak menang, seri → `null`. Contoh awal:
| Slug | Kata kunci |
|------|-----------|
| `food` | WARUNG, RESTO, RESTORAN, CAFE, KOPI, COFFEE, BAKSO, AYAM, NASI, MIE, SATE, BAKERY, ROTI, KFC, SOLARIA |
| `transport` | GRAB, GOJEK, GO-JEK, MAXIM, INDRIVER, TRANSJAKARTA, KAI, PARKIR, TOL, PERTAMINA, SHELL, BENSIN, SPBU, BLUEBIRD |
| `shopping` | INDOMARET, ALFAMART, ALFAMIDI, SUPERINDO, HYPERMART, TOKOPEDIA, SHOPEE, LAZADA |
| `bills` | PLN, TOKEN LISTRIK, PDAM, INDIHOME, TELKOM, BPJS, PULSA, PAKET DATA, TAGIHAN |
| `entertainment` | CGV, XXI, CINEPOLIS, NETFLIX, SPOTIFY, STEAM, BIOSKOP, TIKET |
| `health` | APOTEK, K24, KIMIA FARMA, GUARDIAN, KLINIK, RUMAH SAKIT, DOKTER |
| `education` | BUKU, GRAMEDIA, KURSUS, UKT, SPP, FOTOKOPI, FOTO KOPI, ATK |
Confidence kategori tidak memicu "Cek lagi" (hanya saran); user bebas mengganti.

### 8. Status
Ikuti definisi di bagian Output. Jika semua kandidat nominal ditolak dan teks ≥ 10 karakter tanpa kata kunci transaksi → error `NOT_AN_EXPENSE`.

## Contoh
**Struk toko** (OCR):
```
INDOMARET POINT
JL. MERDEKA NO 12 JAKARTA
08/10/2026 14:32 KASIR 03
AQUA 600ML      2  8.000
ROTI TAWAR      1 16.500
SUBTOTAL            24.500
TOTAL               24.500
TUNAI               50.000
KEMBALI             25.500
```
→ nama "Indomaret Point" (header + kamus, 0,85), nominal 24500 (kata kunci `TOTAL` + cross-check tunai−kembali, 0,95), tanggal 2026-10-08 (ada jam, 0,9), kategori `shopping`. `600ML` tidak dianggap uang (tanpa pemisah ribuan, bukan berawalan `Rp`).

**Screenshot e-wallet** (OCR):
```
Pembayaran Berhasil
Rp 18.500
Ke        Kopi Susu Tetangga
Waktu     8 Okt 2026, 09:14
```
→ `doc_type: ewallet`; nama "Kopi Susu Tetangga" (label `Ke`, 0,85), nominal 18500 (baris `Rp` tertinggi di atas, 0,85), tanggal 2026-10-08 (label `Waktu`, 0,9), kategori `food`.

## Struktur Kode
```
src/lib/extract/
  index.ts                 # extractFromImage(file): Promise<ExtractionResult>
  ocr.ts                   # OcrEngine (Tesseract.js, worker singleton)
  preprocess.ts
  types.ts
  category-keywords.ts
  parse/
    normalize.ts
    money.ts               # parseMoney, findMoneyTokens
    amount.ts              # pilih total (tier 1–4, cross-check)
    date.ts
    name.ts
    category.ts
    doc-type.ts
    confidence.ts
public/tesseract/          # worker, core WASM, data bahasa (self-host)
tests/
  extract/*.test.ts        # unit test parser (input: teks OCR, tanpa gambar)
  fixtures/ocr-text/       # teks OCR + expected.json
  fixtures/receipts/       # gambar uji (dianonimkan) + expected.json
scripts/eval-extract.ts    # jalankan OCR+parser di Node atas fixtures, cetak akurasi per field
```

## Integrasi UI
- `UploadDropzone` memanggil `extractFromImage(file)` di klien; tampilkan animasi "mesin cetak" (lihat `DESIGN.md` 5.4) dan teks status di `aria-live`.
- `ReviewForm` menerima `ExtractionResult`: field `null` atau `confidence < 0,7` ditandai "Cek lagi". Preview gambar dari `URL.createObjectURL(file)`, di-`revoke` setelah simpan/batal.
- Saat disimpan: `source = 'scan'`, `extraction_confidence` ikut dikirim ke `createExpense`. `raw_text` dan gambar **tidak** ikut dikirim.

## Pengujian & Evaluasi
1. **Unit test parser** (utama): seluruh tabel `parseMoney`, pola tanggal, pemilihan total (termasuk baris yang harus diabaikan), pemilihan nama, kategori. Input berupa teks OCR, sehingga cepat dan deterministik.
2. **Fixture gambar** (±30–40, dianonimkan, jangan commit data pribadi nyata): struk minimarket, restoran dengan pajak/service, struk SPBU, bukti transfer m-banking, screenshot GoPay/OVO/DANA/ShopeePay, e-receipt ojol, nota tulis tangan, gambar buram/miring, gambar non-struk. Tiap gambar punya `expected.json` (nominal, tanggal, nama).
3. **`scripts/eval-extract.ts`** menjalankan OCR + parser atas semua fixture dan melaporkan akurasi: nominal (exact), tanggal (exact), nama (kemiripan).
4. **Target awal (revisi setelah ada angka nyata):** nominal benar ≥ 90% untuk screenshot/e-receipt, ≥ 75% untuk foto struk cetak. Tulisan tangan tidak ditargetkan.
5. **Alur perbaikan bug:** temukan gagal baca → simpan teks OCR-nya (dianonimkan) sebagai fixture → tulis test yang gagal → ubah aturan → test hijau → jalankan eval untuk memastikan tidak ada regresi.

## Batasan yang Diketahui
- Foto miring, buram, atau kertas thermal pudar sering gagal; user diarahkan ke review/isi manual.
- Struk dengan banyak diskon/promo bisa membingungkan pemilihan total; cross-check tunai−kembali membantu tetapi tidak selalu ada.
- Aturan bersifat heuristik dan perlu dirawat: kamus merchant/kategori dan pola total akan bertambah seiring pemakaian.
- Performa tergantung perangkat; target ≤ 10 detik per gambar di HP kelas menengah setelah model bahasa termuat.
