# DESIGN — Nota Kalcer

Panduan visual & UX untuk aplikasi pencatatan keuangan. Dibaca bersama `AGENTS.md`. UI memakai **Flowbite React** di atas Tailwind CSS; semua gaya di bawah diterapkan lewat theme Flowbite + token Tailwind, bukan CSS ad-hoc per halaman.

## 1. Konsep

**Nota warung ketemu stiker laptop.**
Aplikasi ini mencatat jajan, parkir, dan token listrik, jadi dunianya adalah nota kontan: pulpen biru, kertas karbon biru muda, cap stempel merah, tinta kuning stabilo. Dibungkus dengan sensibilitas Gen Z Indonesia: stiker, tape, sablon distro, tulisan bak truk. Rasanya ramai tapi angkanya tetap jelas dibaca.

Audiens: anak muda yang mencatat uang dari HP, sering sambil antre atau nongkrong. Tugas utama: **foto struk → angka kebaca → simpan, kurang dari 10 detik.**

**Satu hal yang harus diingat orang:** kartu **"Nota bulan ini"** di dashboard (nota sungguhan dengan tepi bergerigi, daftar jajan, dan total besar) plus **cap "TERSIMPAN"** yang menghantam layar saat menyimpan. Di luar dua momen itu, UI dibuat tenang dan disiplin: flat, berbingkai tinta, tanpa dekorasi tambahan.

### Kenapa palet ini (bukan krem + terakota, bukan hitam + hijau neon)
Warnanya diambil dari benda nyata: tinta pulpen nota (biru), kertas karbon (biru muda), stempel LUNAS (merah), stabilo (kuning). Teks dan garis memakai **biru tinta tua**, bukan hitam, supaya terasa seperti ditulis tangan di nota.

## 2. Prinsip
1. **Angka adalah bintangnya.** Nominal selalu paling kontras, rata kanan, `tabular-nums`. Kalcer ada di bingkai dan copy, bukan di angka.
2. **Struktur = informasi.** Garis putus-putus memisahkan baris nota, bingkai tebal menandai yang bisa diketuk, bayangan keras hanya untuk elemen interaktif dan hero. Tidak ada garis atau label dekoratif.
3. **Radius punya arti.** Kontrol (tombol, input) `6px`; kartu biasa `10px`; nota `0` dengan tepi bergerigi; stiker/badge `full`. Jangan satu radius untuk semuanya.
4. **Boros warna, hemat efek.** Warna solid dan datar. Tanpa gradien, blur, glow, atau bayangan lembut.
5. **Gerak menjawab aksi.** Gerak hanya muncul sebagai respons ketukan user atau saat menunggu hasil baca. Tidak ada animasi masuk di tiap section.
6. **Lucu di tempat yang aman.** Gaya bahasa santai di judul, empty state, dan toast. Tombol, label field, error, dan konfirmasi uang tetap lugas.

## 3. Token

### 3.1 Warna (Palet Midnight Navy & Kertas Krem)
| Token | Hex | Peran |
|-------|-----|-------|
| `karbon` | `#010736` | Latar halaman utama (Deep Midnight Navy, solid) |
| `kertas` | `#0D1C42` | Permukaan kontainer & kartu umum (Dark Navy) |
| `kertas-nota` | `#FCF1D0` | Permukaan khusus kartu nota struk & highlight (Vintage Cream Paper) |
| `tinta` | `#FCF1D0` | Teks utama UI & heading (Krem kontras tinggi) |
| `tinta-dark` | `#010736` | Tinta teks gelap di atas nota kertas krem |
| `tinta-pudar` | `#8CA0D0` | Teks sekunder, placeholder |
| `pulpen` | `#22396F` | Aksi utama, tombol primer, border aksen |
| `kuning` | `#FCF1D0` | Stabilo / highlight nota ("cek lagi", tab aktif) |
| `kresek` | `#FF7EB6` | Aksen stiker |
| `cendol` | `#2BD67B` | Sukses, toggle aktif |
| `stempel` | `#E63946` | Bahaya, hapus, cap stempel "TERSIMPAN" / "lebih boncos" |
| `langit` | `#6EC6FF` | Info, aksen grafik |
| `bayangan` | `#00031A` | Bayangan keras (hard shadow) |

Warna kategori (selalu dengan teks/ikon kontras): `food #FF9F45`, `transport #6EC6FF`, `shopping #FF7EB6`, `bills #B9C0FF`, `entertainment #FFD23F`, `health #2BD67B`, `education #C8E36B`, `transfer #818CF8`, `other #D9DBF0`. Kategori custom memilih dari set ini.

### 3.3 Tipografi
- **Display: Bagel Fat One** (Google Fonts, satu bobot). Hanya untuk judul halaman, total besar di nota, dan teks cap. Besar saja, tidak pernah untuk paragraf.
- **Teks: Plus Jakarta Sans** (Google Fonts, bobot 500/600/700/800). Dirancang di Jakarta, enak dibaca di layar kecil.
- Muat lewat `next/font/google` (`display: 'swap'`, subset `latin`), expose sebagai `--font-display` dan `--font-body`.
- **Sentence case** di mana-mana. Tidak ada label HURUF BESAR (kecuali teks cap stempel), tidak ada eyebrow kecil di atas judul.
- Angka uang: `font-variant-numeric: tabular-nums`, bobot 700, rata kanan.

| Peran | Mobile / Desktop | Font & bobot |
|-------|------------------|--------------|
| Total nota | 44/48 / 64/64 | Display |
| h1 | 30/34 / 40/44 | Display |
| h2 | 22/28 / 26/32 | Teks 800 |
| h3 | 18/24 | Teks 700 |
| Body | 16/24 (bobot 500) | Teks |
| Kecil | 14/20 | Teks 500 |
| Caption | 12/16 (minimum) | Teks 600 |
Panjang baris ≤ 65 karakter. Letter-spacing display `-0.01em`.

### 3.4 Bentuk, bayangan, jarak
- Garis: `2px solid tinta` untuk semua kontrol dan kartu; `3px` untuk cap stempel.
- Bayangan keras (tanpa blur): `shadow-hard` = `4px 4px 0 0 var(--bayangan)`, `shadow-hard-sm` = `2px 2px 0 0`, `shadow-hard-lg` = `6px 6px 0 0`. Hanya untuk: tombol, kartu yang bisa diketuk, nota hero, modal, toast. Baris daftar dan kartu statis **tanpa** bayangan.
- Jarak basis 4px. Padding halaman 16px (mobile), 32px (desktop). Target ketuk minimum 44×44px.
- Lebar konten maksimum 1120px; teks panjang 65ch.

### 3.5 Implementasi token
`src/app/globals.css`
```css
:root {
  --karbon: #DCEBFF;  --kertas: #FFFFFF;
  --tinta: #17196B;   --tinta-pudar: #55589C;
  --pulpen: #2E3CFF;  --kuning: #FFD23F;  --kresek: #FF7EB6;
  --cendol: #2BD67B;  --stempel: #D7261E; --langit: #6EC6FF;
  --bayangan: var(--tinta);
  --fokus: var(--tinta);
}
@media (prefers-color-scheme: dark) {
  :root {
    --karbon: #0E1140;  --kertas: #171B63;
    --tinta: #F4F2FF;   --tinta-pudar: #B3B7FF;
    --bayangan: #FF7EB6; --fokus: #FFD23F;
  }
}
body { background: var(--karbon); color: var(--tinta); font-family: var(--font-body), system-ui, sans-serif; }
```
Daftarkan token sebagai warna Tailwind (`bg-karbon`, `text-tinta`, `border-tinta`, `bg-pulpen`, dst.) dan bayangan `shadow-hard*`. Tailwind v4: lewat blok `@theme`; Tailwind v3: lewat `theme.extend` di `tailwind.config`. Override Flowbite ditaruh di satu file `src/lib/flowbite-theme.ts` memakai API theme Flowbite React versi yang terpasang (mis. `createTheme`); jangan mengubah file di `node_modules`.

## 4. Resep komponen (override Flowbite)

| Komponen | Resep |
|----------|-------|
| **Button primer** | `bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5` · hover: geser `-1px,-1px` dan `shadow-hard-lg` · active: geser `4px,4px` dan `shadow-none` (terasa "ditekan") · transisi 100ms hanya pada `transform, box-shadow` |
| **Button varian** | Sekunder: `bg-kertas text-tinta`. Sorot (aksi utama di layar upload): `bg-kuning text-tinta`. Bahaya: `bg-stempel text-white`. Teks: tanpa bingkai, garis bawah 2px `tinta`. Satu tombol primer per layar |
| **Input, Select, Textarea, Datepicker** | `bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 placeholder:text-tinta-pudar focus:ring-0` · fokus: `shadow-[3px_3px_0_0_var(--pulpen)]` (bukan ring biru bawaan) · error: border dan bayangan `stempel` + pesan di bawah dengan ikon. Label selalu di atas field, teks 14px/700 |
| **Nominal (field uang)** | Prefix `Rp` menempel di kiri field, input rata kanan, bobot 700, `inputmode="numeric"`, pemisah ribuan titik saat mengetik |
| **Card biasa** | `bg-kertas border-2 border-tinta rounded-[10px]`, tanpa bayangan. Kartu yang bisa diketuk menambah `shadow-hard` + perilaku tekan seperti tombol |
| **Badge kategori (stiker)** | `inline-flex gap-1.5 border-2 border-tinta rounded-full px-3 py-1 text-sm font-semibold` + warna kategori + ikon. Tidak pernah hanya warna |
| **Toggle** | Trek `border-2 border-tinta`, mati `kertas`, hidup `cendol`; kenop `tinta` |
| **Tabs** | Dipakai sebagai segmented control ("Foto struk" / "Isi manual"): wadah `border-2`, segmen aktif `bg-kuning`, tanpa garis bawah |
| **Modal** | `bg-kertas border-2 shadow-hard-lg rounded-[10px]`; backdrop `tinta` 60% **tanpa blur**. Judul h2, tombol aksi di kanan bawah, tombol batal di kirinya |
| **Toast** | Stiker kecil di atas bottom nav: `border-2 shadow-hard-sm`, latar `cendol` (sukses), `kuning` (info/peringatan), `stempel` (gagal, teks putih). Hilang otomatis 4 detik, bisa ditutup |
| **Tooltip** | `bg-kuning border-2 border-tinta text-tinta` |
| **Daftar pengeluaran** | Baris (bukan tabel) di mobile dan desktop: ikon kategori di kiri, nama + tanggal, nominal rata kanan. Pemisah `border-b-2 border-dashed border-tinta/30` seperti garis sobek nota. Tanpa kartu per baris |
| **Pagination** | Tidak dipakai; tombol sekunder "Muat lebih banyak" (cursor) |
| **Spinner** | Bukan spinner bawaan. Tombol loading: label diganti ("Menyimpan…") + kotak `tinta` kecil berputar bertahap (`steps(4)`). Menunggu baca struk: lihat 5.4 |

## 5. Pola khusus

### 5.1 Nota (hero dashboard)
Kartu putih `border-2` (tanpa bingkai bawah), berisi 3–4 baris pengeluaran terbesar bulan ini dengan pemisah putus-putus, lalu **total** dalam Display. Tepi bawah bergerigi seperti sobekan nota, digambar dengan strip SVG yang diulang (bukan `mask`, supaya garis tinta tetap terlihat):
```html
<!-- tile 24x10, diulang horizontal, tinggi 10px, menempel di bawah kartu -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="10" viewBox="0 0 24 10">
  <path d="M0 0H24L12 9Z" fill="#FFFFFF"/>
  <path d="M0 0L12 9L24 0" fill="none" stroke="#17196B" stroke-width="2"/>
</svg>
```
(Di mode gelap `fill` mengikuti `--kertas`, `stroke` mengikuti `--tinta`; pakai `currentColor`/CSS variable saat dijadikan komponen.) Perbandingan bulan lalu tampil sebagai stempel kecil miring `-3°` di pojok total: "Lebih boncos Rp X" (`stempel`) atau "Lebih hemat Rp X" (`cendol`).

### 5.2 Stiker dan tape
Dekorasi dibatasi: **maksimal 2 stiker dan 1 tape per layar.** Hanya boleh miring (`-3°` sampai `3°`) di stiker, tape, dan cap. Form, input, dan teks bacaan **tidak pernah miring.** Tape (strip `kuning` semi-solid 60×18px, miring `-4°`) dipakai di pojok preview gambar struk.

### 5.3 Cap "TERSIMPAN" (momen utama kedua)
Setelah pengeluaran tersimpan: cap bingkai `3px stempel`, teks Display `stempel`, miring `-8°`, muncul di atas kartu nota dari skala `1.6 → 1` dalam 140ms dengan overshoot `cubic-bezier(.3,1.6,.5,1)`, bertahan 700ms, lalu hilang. Hanya sekali per simpan. Dengan `prefers-reduced-motion`: ganti dengan toast biasa.

### 5.4 Menunggu baca struk ("mesin cetak")
Selama OCR berjalan di browser, tampilkan nota kosong dengan tiga baris placeholder (Nama, Nominal, Tanggal) yang "tercetak" satu per satu (reveal atas→bawah, jeda 250ms, berulang sampai hasil siap). Teks status di `aria-live="polite"`: "Lagi baca struknya". Saat hasil tiba, baris terisi nilai asli. Dengan reduced motion: tiga bar statis. Saat data bahasa OCR dimuat pertama kali (bisa beberapa detik), ganti teks status menjadi "Menyiapkan pembaca struk, cukup sekali".

### 5.5 Dropzone
Area `border-2 border-dashed border-tinta bg-kertas rounded-[10px]`, tinggi min 200px. Isi: judul "Spill struknya di sini", satu baris petunjuk, dan tombol sorot (kuning) "Pilih foto". Ikon kamera di mobile membuka kamera langsung. Saat file diseret di atas area: latar berubah `kuning`. Satu coretan tangan (SVG panah melengkung, garis `tinta` 3px) boleh menunjuk ke tombol; itu satu-satunya ilustrasi di layar.

### 5.6 Review hasil baca
Field dengan nilai kosong atau `confidence < 0.7`: **stabilo kuning** di balik label (`bg-kuning` penuh pada teks label, seperti disorot spidol) + stiker kecil "Cek lagi" di kanan label. Field yang yakin tampil biasa. Tombol "Simpan pengeluaran" aktif hanya jika nama, nominal, dan tanggal terisi. Preview gambar dari file lokal browser (`createObjectURL`), bertape; ketuk untuk memperbesar.

### 5.7 Grafik (Recharts)
Batang tebal (horizontal untuk kategori), warna solid kategori, `stroke` tinta 2px, tanpa radius, tanpa gradien, tanpa grid atau grid putus-putus `tinta/20`. Label di bagan memakai font teks 12–14px. Tooltip kustom (bukan kotak putih bawaan): gaya tooltip di tabel komponen. Tiap batang memuat ikon + nama kategori, tidak bergantung warna saja.

### 5.8 Pengaturan Telegram
Kartu biasa dengan toggle di judul. Di bawahnya: catatan privasi (kotak `kuning` dengan ikon info) bahwa nama, nominal, tanggal, dan kategori akan dikirim ke Telegram. Field "Bot token" (tipe password, menampilkan `••••` + 4 karakter terakhir bila sudah tersimpan, tidak pernah menampilkan token penuh) dan "Channel atau chat ID". Tombol primer "Simpan pengaturan", tombol sekunder "Kirim pesan tes". Hasil tes muncul sebagai toast dan juga teks inline di bawah tombol.

## 6. Layout & layar

**Navigasi.** Mobile: bottom bar 4 item (Beranda, Daftar, Kategori, Atur) dengan tombol tengah yang naik setengah ke atas: **"Baca struk"** (kuning, bingkai, bayangan keras, ikon kamera). Desktop (≥ 1024px): rail kiri 240px dengan item yang sama dan tombol "Baca struk" di atas rail. Item aktif: latar `kuning` + bingkai.

**Dashboard (mobile)**
```
┌─────────────────────────────┐
│ Halo, {nama}            [⚙] │
│ ┌─ Nota bulan ini ────────┐ │
│ │ Token listrik   100.000 │ │
│ │ Kopi susu aren   54.000 │ │
│ │ Es teh jumbo     12.000 │ │
│ │ - - - - - - - - - - - - │ │
│ │ Total       Rp 2.450.000│ │   Display besar, rata kiri
│ │            (stempel -3°)│ │
│ └/\/\/\/\/\/\/\/\/\/\/\/\┘ │
│ Per kategori                │
│ [▇▇▇▇▇▇▇ Makanan   900rb ]  │
│ [▇▇▇▇ Transport    450rb ]  │
│ Terakhir                    │
│ (ikon) Warung Bu Tini  45rb │
│ - - - - - - - - - - - - - - │
│ [Beranda][Daftar](📷)[Kat][Atur]
└─────────────────────────────┘
```
Rata kiri untuk semua teks. Desktop: nota di kolom kiri (≈ 5/12), kategori + terakhir di kolom kanan; tinggi kolom tidak dipaksa sama.

**Tambah pengeluaran:** segmented control "Foto struk" / "Isi manual". Tab foto: dropzone → (menunggu 5.4) → review 5.6. Mobile: preview kecil (tinggi 160px) di atas form. Desktop: preview kiri, form kanan.

**Daftar:** filter di atas (rentang tanggal, kategori, kolom cari nama), baris 4.x, "Muat lebih banyak". **Detail/edit:** form yang sama dengan review, tanpa preview.
**Pengaturan:** Kategori (daftar + tambah, pemilih warna dari set kategori dan ikon), Notifikasi (5.8).
**Login/daftar:** satu kartu di tengah halaman dengan judul Display, form, tombol primer. Tanpa ilustrasi hero.

## 7. Copy & suara

Bahasa Indonesia santai, pakai "kamu", sentence case, kata kerja aktif. Aplikasi tidak memakai "aku" dan tidak minta maaf.
- **Tombol** lugas dan konsisten sepanjang alur: "Baca struk", "Simpan pengeluaran", "Hapus", "Batal", "Simpan pengaturan", "Kirim pesan tes". Nama aksi sama di tombol, toast, dan cap ("Simpan" → "Pengeluaran tersimpan" → cap "TERSIMPAN").
- **Plesetan boleh** di judul, empty state, dan toast sukses; **maksimal satu frasa gaul per layar.** Kosakata yang boleh: jajan, boncos, hemat, tanggal tua, spill, receh, aman. Jangan memakai tren sesaat yang cepat basi.
- **Error** menyebut apa yang terjadi dan apa yang bisa dilakukan, tanpa bercanda dan tanpa maaf.

| Konteks | Teks |
|---------|------|
| Judul dashboard | Nota bulan ini |
| Empty state daftar | Belum ada jajan yang tercatat. Foto struk pertamamu atau isi manual. |
| Dropzone | Judul: Spill struknya di sini. Petunjuk (baris terpisah): Tarik file, pilih dari galeri, atau tempel (Ctrl+V). JPG, PNG, WEBP, maksimal 10 MB. |
| Menunggu | Lagi baca struknya |
| Hasil baca | Kebaca! Cek dulu sebelum disimpan. |
| Field ragu | Cek lagi |
| Bukan struk (`NOT_AN_EXPENSE`) | Ini sepertinya bukan struk atau bukti bayar. Coba foto lain atau isi manual. |
| Tidak ada teks (`NO_TEXT`) | Tidak ada tulisan yang terbaca. Coba foto yang lebih terang, lurus, dan lebih dekat, atau isi manual. |
| Pembaca gagal dimuat (`OCR_FAILED`) | Pembaca struk gagal dimuat. Muat ulang halaman atau isi manual. |
| Pertama kali | Menyiapkan pembaca struk, cukup sekali. |
| File salah (`INVALID_FILE`) | File ini tidak bisa dipakai. Pakai JPG, PNG, atau WEBP di bawah 10 MB. |
| Toast simpan | Pengeluaran tersimpan: {nama}, Rp {nominal}. |
| Konfirmasi hapus | **Hapus pengeluaran ini?** {nama}, Rp {nominal}, {tanggal} akan hilang dan tidak bisa dikembalikan. [Hapus] [Batal] |
| Banding bulan lalu | Lebih boncos Rp {x} dari bulan lalu / Lebih hemat Rp {x} dari bulan lalu / Sama persis dengan bulan lalu |
| Telegram judul | Kirim ke Telegram |
| Telegram deskripsi | Tiap ada pengeluaran baru, bot mengirim ringkasannya ke channel kamu. Data yang dikirim: nama, nominal, tanggal, kategori. |
| Telegram bantuan | Bot harus jadi admin channel dengan izin kirim pesan. |
| Telegram tes | Berhasil: Pesan tes terkirim. Cek channel kamu. / Gagal: Pesan tes gagal. Bot belum jadi admin channel. |
| Login | Masuk dulu biar catatanmu aman. |

## 8. Gerak
Anggaran gerak: **tekan tombol** (100ms), **cap TERSIMPAN** (5.3), **mesin cetak** (5.4), **toast masuk** (180ms, geser naik 8px + fade). Selain itu tidak ada animasi: tidak ada fade-slide-up di section, tidak ada hover transition di tiap kartu, tidak ada animasi angka menghitung naik. Semua dimatikan atau disederhanakan di bawah `prefers-reduced-motion: reduce`.

## 9. Ikon & ilustrasi
- Ikon: **Phosphor bold** via `react-icons/pi` (satu keluarga saja), 20–24px, ikut warna `tinta`.
- Emoji tidak dipakai sebagai ikon UI atau bullet. Emoji hanya boleh jika user sendiri memilihnya untuk kategori custom.
- Ilustrasi: hanya coretan garis tebal buatan sendiri (SVG, `stroke tinta 3px`, ujung bulat) untuk empty state dan dropzone, maksimal satu per layar. Tidak memakai ilustrasi stok, orang 3D, atau maskot.

## 10. Aksesibilitas (batas bawah, wajib)
- Kontras sesuai 3.1; teks di atas warna aksen selalu `tinta` kecuali putih di `pulpen`/`stempel`.
- Fokus keyboard terlihat di semua elemen interaktif: `outline: 3px solid var(--fokus); outline-offset: 3px`. Tidak boleh `outline: none` tanpa pengganti.
- Informasi tidak hanya lewat warna: kategori selalu ikon + nama, status selalu ikon + teks.
- Target ketuk ≥ 44px, jarak antar-target ≥ 8px.
- Nominal memakai `tabular-nums`; kolom angka rata kanan; format `Rp 25.000` konsisten lewat `lib/money.ts`.
- Perubahan status (membaca struk, tersimpan, error) diumumkan lewat `aria-live`.
- Rotasi hanya dekoratif (`aria-hidden`), tidak mengubah urutan baca.
- Hormati `prefers-reduced-motion` dan `prefers-color-scheme`.

## 11. Dilarang (anti-template)
Agen dan developer wajib memeriksa daftar ini sebelum menutup task UI:
- Gradien, glassmorphism/blur, glow neon, atau bayangan lembut (`shadow-md`, `shadow-lg` bawaan Tailwind/Flowbite).
- Warna ungu/indigo-ke-biru, latar krem + terakota, atau latar hitam + hijau neon.
- Satu radius (`rounded-2xl`) di semua elemen; deretan kartu identik berisi ikon-dalam-lingkaran + judul + deskripsi.
- Label HURUF BESAR kecil di atas judul, penanda bernomor `01/02/03` untuk konten yang bukan urutan, string meta dengan titik tengah (`A · B · C`), tanda panah `→` di akhir tombol/link, label gaya `KATA — fragmen`.
- Menekankan hanya satu kata di judul dengan warna atau miring.
- Emoji sebagai ikon atau bullet, ✨ di mana-mana, ilustrasi stok.
- Animasi fade-slide-up di tiap section atau hover-lift di semua kartu.
- Data contoh generik (John Doe, Lorem ipsum, "Product 1", "Rp 100.000" berulang). Pakai data di bagian 12.
- Warna bawaan Flowbite/Tailwind (biru `blue-700`, abu `gray-*`) yang lolos tanpa dipetakan ke token.
- Gaya gaul di pesan error atau konfirmasi yang menyangkut uang.

## 12. Data contoh (untuk mock, seed, dan test)
Nama: Warung Bu Tini (45.000), Es teh jumbo (12.000), Kopi susu gula aren (24.000), Parkir motor (3.000), Token listrik (100.000), Ojol ke kantor (18.500), Fotokopi tugas (6.000), Bensin (35.000), Langganan streaming (54.000), Obat batuk (22.500), Tiket bioskop (50.000), Cukur rambut (30.000).
Tanggal pakai format `8 Okt 2026`; nominal `Rp 45.000`.

## 13. Definition of Done untuk UI
- [ ] Hanya memakai token dan komponen Flowbite yang sudah di-theme; tidak ada warna/bayangan bawaan yang lolos.
- [ ] Lolos semua poin bagian 10 dan 11.
- [ ] Diuji di lebar 360px dan 1280px; tidak ada scroll horizontal.
- [ ] Maksimal 2 stiker + 1 tape per layar; hanya satu tombol primer per layar.
- [ ] Copy sesuai bagian 7 (tombol lugas, plesetan terbatas).
- [ ] `prefers-reduced-motion` dan keyboard-only sudah dicoba.
