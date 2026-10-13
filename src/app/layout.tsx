import type { Metadata } from "next";
import { Bagel_Fat_One, Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

const bagelFatOne = Bagel_Fat_One({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["500", "600", "700", "800"],
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://boncos.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Boncos — Catat Pengeluaran Otomatis via Scan Struk & E-Wallet",
    template: "%s | Boncos",
  },
  description:
    "Aplikasi pencatatan keuangan pribadi dengan ekstraksi struk belanja dan bukti transfer m-banking/e-wallet otomatis langsung di browser tanpa AI. 100% privasi terjaga, gambar tidak pernah diunggah ke server, dan terintegrasi notifikasi Telegram.",
  keywords: [
    "catat pengeluaran",
    "pencatatan keuangan",
    "scan struk",
    "ocr struk belanja",
    "ekstraksi bukti transfer",
    "aplikasi keuangan pribadi",
    "expense tracker indonesia",
    "privacy-first expense manager",
    "tesseract ocr browser",
    "bca mobile",
    "livin mandiri",
    "shopeepay",
    "gopay",
    "seabank",
    "qris",
    "notifikasi telegram keuangan",
    "boncos",
  ],
  authors: [{ name: "Boncos Team", url: baseUrl }],
  creator: "Boncos",
  publisher: "Boncos",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Boncos",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Boncos",
    title: "Boncos — Catat Pengeluaran Otomatis via Scan Struk & E-Wallet",
    description:
      "Ekstraksi struk fisik & screenshot e-wallet instan langsung di browsermu tanpa AI. Foto struk tidak pernah dikirim ke server. Privasi 100% aman.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boncos — Catat Pengeluaran Otomatis via Scan Struk & E-Wallet",
    description:
      "Aplikasi keuangan tanpa ribet. Scan struk & e-wallet instan di browser, aman tanpa kirim gambar ke server.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${baseUrl}/#webapp`,
      "name": "Boncos",
      "url": baseUrl,
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "All modern web browsers",
      "browserRequirements": "Requires JavaScript, Canvas and WebAssembly support",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "IDR",
      },
      "description":
        "Aplikasi pencatatan keuangan pribadi dengan ekstraksi struk belanja dan bukti transfer bank/e-wallet otomatis langsung di browser tanpa AI dan tanpa upload gambar ke server.",
      "featureList": [
        "Ekstraksi Struk Belanja Otomatis (Tesseract OCR di Browser)",
        "Dukungan Bukti Transfer & E-Wallet (BCA, Mandiri, ShopeePay, GoPay, SeaBank, QRIS)",
        "100% Client-Side Privacy: Gambar tidak disimpan atau dikirim ke server",
        "Notifikasi Instan via Bot Telegram Terenkripsi",
        "Dashboard Analisis Pengeluaran & Grafik Bulanan",
        "Ekspor Laporan Transaksi ke CSV",
        "Dokumentasi API Terbuka & Integrasi OpenAPI 3.0",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${baseUrl}/#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Apakah Boncos menyimpan atau mengunggah foto struk saya?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Tidak. Pemrosesan OCR berlangsung sepenuhnya di browser lokal perangkat Anda menggunakan Tesseract.js WASM. Foto struk tidak pernah diunggah ke server Boncos, Firebase Storage, maupun cloud pihak ketiga.",
          },
        },
        {
          "@type": "Question",
          "name": "Bagaimana cara Boncos mengekstrak nama dan nominal tanpa AI?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Boncos menggunakan engine OCR Tesseract.js di browser yang dipadukan dengan parser aturan deterministik murni. Pendekatan ini cepat, bebas halusinasi, menjaga privasi 100%, dan tanpa biaya langganan API model AI.",
          },
        },
        {
          "@type": "Question",
          "name": "Struk dan bukti pembayaran apa saja yang didukung oleh Boncos?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Boncos mendukung struk kasir ritel fisik (Indomaret, Alfamart, SPBU Pertamina, restoran/kafe), bukti transfer bank (BCA Mobile, myBCA, Livin' by Mandiri, SeaBank), e-wallet (ShopeePay, GoPay, OVO, DANA), pembayaran QRIS, serta tagihan PLN.",
          },
        },
        {
          "@type": "Question",
          "name": "Apakah Boncos mendukung integrasi notifikasi Telegram?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ya. Anda dapat menghubungkan bot Telegram pribadi Anda dengan token terenkripsi AES-256-GCM untuk menerima ringkasan otomatis setiap kali ada pengeluaran baru yang dicatat.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${bagelFatOne.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
