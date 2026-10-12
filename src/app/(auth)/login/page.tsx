import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Masuk ke Akun Anda",
  description:
    "Masuk ke aplikasi Boncos untuk mulai mencatat pengeluaran harian dan memindai struk belanja secara instan.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Masuk ke Boncos — Catat Pengeluaran Tanpa Ribet",
    description:
      "Masuk untuk mengelola keuangan pribadi, scan struk belanja, dan melihat laporan pengeluaran Anda.",
    url: "/login",
  },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-karbon relative">
      <Suspense fallback={<div className="text-center font-bold text-tinta">Memuat...</div>}>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
