import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Daftar Akun Baru",
  description:
    "Buat akun Boncos gratis sekarang. Mulai catat pengeluaran keuangan pribadi dengan OCR struk instan di browser dan notifikasi Telegram.",
  alternates: {
    canonical: "/register",
  },
  openGraph: {
    title: "Daftar Akun Boncos — Mulai Catat Keuangan Tanpa Ribet",
    description:
      "Daftar gratis dan nikmati kemudahan mencatat pengeluaran via scan struk instan tanpa upload gambar ke server.",
    url: "/register",
  },
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-karbon">
      <Suspense fallback={<div className="text-center font-bold text-tinta">Memuat...</div>}>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
