import type { Metadata } from "next";
import Link from "next/link";
import { PiArrowLeftBold, PiFileCodeBold } from "react-icons/pi";
import { SwaggerViewer } from "@/components/docs/SwaggerViewer";

export const metadata: Metadata = {
  title: "API Documentation (Swagger) — Boncos",
  description: "Dokumentasi interaktif OpenAPI & Swagger UI untuk Boncos API & Server Actions.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#010736] text-[#FCF1D0]">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-50 bg-[#0D1C42] border-b-2 border-[#FCF1D0] px-4 md:px-8 py-3.5 shadow-[0_4px_0_0_#00031A] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22396F] text-white font-bold text-xs rounded-md border-2 border-[#FCF1D0] shadow-[2px_2px_0_0_#00031A] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <PiArrowLeftBold className="text-sm" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="h-4 w-[2px] bg-[#FCF1D0]/30 hidden sm:block" />
          <h1 className="font-display text-xl md:text-2xl text-[#FCF1D0]">
            Boncos API Docs
          </h1>
          <span className="text-[11px] font-bold bg-[#FCF1D0] text-[#010736] px-2 py-0.5 rounded-full border border-[#010736]">
            OpenAPI 3.0
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/openapi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FCF1D0] text-[#010736] font-bold text-xs rounded-md border-2 border-[#010736] shadow-[2px_2px_0_0_#00031A] hover:bg-[#FFD23F] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <PiFileCodeBold className="text-sm" />
            <span>Unduh JSON</span>
          </a>
        </div>
      </header>

      {/* Main Container with Swagger UI */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Info Card */}
        <div className="mb-6 p-4 rounded-[10px] bg-[#0D1C42] border-2 border-[#FCF1D0] shadow-[4px_4px_0_0_#00031A]">
          <h2 className="font-display text-lg text-[#FCF1D0] mb-1">
            Panduan Integrasi & Kontrak Layanan
          </h2>
          <p className="text-xs md:text-sm text-[#8CA0D0] leading-relaxed">
            Halaman ini mendokumentasikan seluruh spesifikasi endpoint dan Server Actions yang berjalan di Boncos.
            Ekstraksi OCR berjalan 100% di browser pengguna tanpa AI, dan sesi diautentikasi lewat cookie HTTP-only terverifikasi.
          </p>
        </div>

        {/* Swagger UI Component */}
        <SwaggerViewer />
      </main>
    </div>
  );
}
