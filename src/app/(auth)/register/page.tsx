import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Daftar — Boncos",
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
