import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Masuk — Boncos",
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
