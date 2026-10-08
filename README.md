# 🧾 BONCOS — Nota Kalcer

<div align="center">

**Aplikasi pencatatan keuangan sat-set buat anak muda yang capek boncos.**  
*Foto struk ➔ angka kebaca ➔ cap simpan, kurang dari 10 detik.*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tesseract.js](https://img.shields.io/badge/OCR-Zero_AI_%2F_Offline-brightgreen?style=for-the-badge)](https://tesseract.projectnaptha.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Admin_%26_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Neobrutalism-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[Fitur](#-fitur-unggulan) • [Filosofi Desain](#-filosofi-desain-nota-kalcer) • [Privasi](#-privasi-struk-fotomu-urusanmu) • [Instalasi](#-cara-jalanin-di-lokal) • [Tech Stack](#-dapur-pacu)

---

</div>

## 💥 Kenapa Boncos?

Pernah nggak abis nongkrong atau belanja bulanan, niat mau nyatet pengeluaran tapi mager setengah mati gara-gara harus ngetik nominal, pilih tanggal, cari kategori satu per satu? Ujung-ujungnya struk numpuk di dompet sampe tintanya pudar, dan pas cek saldo... *lah, boncos lagi.*

**Boncos** hadir dengan pendekatan praktis:
1. **Sat-Set:** Cukup jepret atau upload foto struk/screenshot mutasi.
2. **Nol AI:** Ekstraksi pakai OCR murni di browser (Tesseract.js) + aturan pola khas struk Indonesia. Nggak ada token OpenAI/Gemini, gratis selamanya, tanpa mikir biaya server.
3. **Privasi 100%:** Gambar dan teks OCR mentah **cuma diproses di browsermu**. Nggak pernah diunggah ke Firebase Storage, server, atau di-log di mana pun!

---

## ✨ Fitur Unggulan

| Fitur | Deskripsi |
| :--- | :--- |
| ⚡ **Scan Struk Kilat** | Deteksi nominal, tanggal, nama merchant, dan subtotal/diskon secara presisi tanpa model LLM. |
| 💸 **Dukungan Mutasi & Transfer** | Screenshot m-Transfer BCA, myBCA, Livin', BRImo, SeaBank, GoPay, dan ShopeePay langsung otomatis disarankan ke kategori **Transfer**. |
| 🏷️ **Saran Kategori Otomatis** | Heuristik pintar mengenali merchant lokal: Indomaret, Alfamart, SPBU Pertamina, Kopi Nako, Mie Gacoan, HokBen, PLN, BPJS, dll. |
| 📝 **Nota Bulan Ini** | Kartu nota bergerigi ala warung kelontong di dashboard dengan cap stempel stiker "TERSIMPAN" / "LUNAS". |
| 📊 **Breakdown Pengeluaran** | Visualisasi kategori dengan palet stiker distro & chart donat yang ramah mata. |
| ✈️ **Alert Telegram (Opsional)** | Kirim notifikasi ringkasan otomatis ke bot Telegram pribadimu setiap kali pengeluaran berhasil disimpan. Token bot dienkripsi aman (AES-256-GCM). |
| 📥 **Export CSV** | Mau analisa lebih dalam di Excel atau Google Sheets? Sekali klik langsung terunduh. |
| 📖 **Swagger / OpenAPI 3.0** | Dokumentasi API dan Server Action interaktif di `/docs` lengkap dengan skema data Zod. |

---

## 🎨 Filosofi Desain: "Nota Kalcer"

> *"Nota warung ketemu stiker laptop."*

Desain Boncos terinspirasi dari benda nyata sehari-hari: **kertas karbon biru muda, tinta pulpen nota, cap stempel merah lunas, dan stabilo kuning stabilo**. Dibungkus estetika neobrutalisme Gen Z Indonesia:

- **Midnight Navy (`#010736`) & Kertas Krem (`#FCF1D0`):** Kontras tajam, teks selalu tegas, ramah di mata siang maupun malam.
- **Angka Adalah Bintangnya:** Nominal selalu rata kanan, `tabular-nums`, bobot tebal.
- **Cap Stempel & Highlight Tape:** Efek visual stempel `TERSIMPAN` yang menghantam layar saat sukses mencatat dan highlight kuning `"Cek lagi"` untuk data yang butuh konfirmasi.
- **Micro-Copy Santai:** Bahasa lugas, akrab, tapi angka uang tetap presisi sampai digit rupiah terakhir.

---

## 🛡️ Privasi: Struk Fotomu, Urusanmu!

Kami sangat serius soal privasi keuanganmu:
- 🚫 **Gambar tidak pernah diunggah:** Tidak ada Firebase Storage, tidak ada S3, tidak ada folder upload server.
- 🚫 **Teks mentah OCR tidak disimpan:** Teks hasil scan diproses di memori RAM browser, lalu langsung dibuang setelah kamu konfirmasi review.
- 🔒 **Data tersimpan rahasia:** Database Firestore hanya menyimpan data final yang kamu setujui (Nama, Nominal, Tanggal, Kategori, Catatan).
- 🔑 **Bot Token Terenkripsi:** Token Telegram dienkripsi dengan AES-256-GCM sebelum masuk ke Firestore dan tidak pernah diekspos ke klien.

---

## 🛠️ Dapur Pacu

- **Core:** [Next.js 15 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Flowbite React](https://flowbite-react.com/)
- **OCR Engine:** [Tesseract.js v7](https://tesseract.projectnaptha.com/) (Self-hosted WASM & Language Data di `/public/tesseract/`)
- **Database & Auth:** [Firebase Admin SDK](https://firebase.google.com/) + Firebase Auth (Session Cookie terverifikasi)
- **Validasi:** [Zod](https://zod.dev/)
- **Testing:** [Vitest](https://vitest.dev/) (Unit test, Auth isolation, & Parser evaluation)

---

## 🚀 Cara Jalanin di Lokal

### 1. Prasyarat
- [Node.js](https://nodejs.org/) v20+ atau v22+
- Akun Firebase (dengan Firestore Database & Firebase Authentication aktif)

### 2. Clone Repository
```bash
git clone https://github.com/farhanhl/boncos.git
cd boncos
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Konfigurasi Environment Variable
Salin template konfigurasi:
```bash
cp .env.example .env.local
```
Lalu isi kredensial di `.env.local`:
```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server Only)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Telegram Bot Token Encryption (32-byte hex / 64 karakter)
TELEGRAM_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 5. Jalankan Server Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pengujian & Evaluasi Ekstraksi

Boncos dilengkapi test suite komprehensif untuk memastikan akurasi parser dan isolasi data pengguna:

```bash
# Menjalankan seluruh unit test (Vitest)
npm test

# Menjalankan evaluasi akurasi ekstraksi offline (9 fixtures struk & mutasi)
npm run eval:extract

# Pengecekan tipe data TypeScript
npx tsc --noEmit
```

---

<div align="center">

Dibuat dengan ☕, 🍜, dan rasa benci melihat dompet boncos.  
**© 2026 Boncos — Nota Kalcer.**

</div>
