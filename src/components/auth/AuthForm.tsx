"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { PiEyeBold, PiEyeSlashBold } from "react-icons/pi";
import { getClientAuth } from "@/lib/firebase/client";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const auth = getClientAuth();
      let idToken = "";

      if (mode === "register") {
        if (!name.trim()) {
          setErrorMessage("Nama panggilan wajib diisi");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateProfile(userCredential.user, { displayName: name.trim() });
        idToken = await userCredential.user.getIdToken();
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        idToken = await userCredential.user.getIdToken();
      }

      // Create session cookie via API
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Gagal membuat sesi login.");
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      if (errObj.code === "auth/invalid-credential" || errObj.code === "auth/wrong-password" || errObj.code === "auth/user-not-found") {
        setErrorMessage("Email atau password salah.");
      } else if (errObj.code === "auth/email-already-in-use") {
        setErrorMessage("Email sudah terdaftar. Silakan masuk.");
      } else if (errObj.code === "auth/weak-password") {
        setErrorMessage("Password minimal 6 karakter.");
      } else if (errObj.code === "auth/invalid-email") {
        setErrorMessage("Format email tidak valid.");
      } else if (errObj.code === "auth/configuration-not-found") {
        setErrorMessage("Layanan Authentication belum diaktifkan di Firebase Console. Silakan aktifkan metode Email/Password di tab Sign-in method.");
      } else {
        setErrorMessage(errObj.message || "Terjadi kesalahan saat masuk.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-kertas border-2 border-tinta rounded-[10px] p-6 shadow-hard-lg max-w-md w-full mx-auto">
      <h1 className="font-display text-3xl text-tinta text-center mb-1">
        {mode === "login" ? "Masuk ke Boncos" : "Bikin Akun Boncos"}
      </h1>
      <p className="text-tinta-pudar text-center text-sm mb-6">
        {mode === "login"
          ? "Masuk dulu biar catatanmu aman."
          : "Catat semua pengeluaranmu mulai sekarang."}
      </p>

      {errorMessage && (
        <div className="mb-4 p-3 bg-stempel/10 border-2 border-stempel rounded-md text-stempel text-sm font-semibold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "register" && (
          <div>
            <label
              htmlFor="name"
              className="font-bold text-sm text-tinta mb-1.5 block"
            >
              Nama Panggilan
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi"
              className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="font-bold text-sm text-tinta mb-1.5 block"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="font-bold text-sm text-tinta mb-1.5 block"
          >
            Password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="bg-kertas border-2 border-tinta rounded-md min-h-11 pl-3 pr-11 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute right-3 p-1 text-tinta-pudar hover:text-tinta focus:outline-none cursor-pointer transition-colors"
            >
              {showPassword ? (
                <PiEyeSlashBold className="text-xl" />
              ) : (
                <PiEyeBold className="text-xl" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100 w-full disabled:opacity-50 cursor-pointer"
        >
          {loading
            ? mode === "login"
              ? "Memproses…"
              : "Mendaftarkan…"
            : mode === "login"
              ? "Masuk"
              : "Daftar Sekarang"}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t-2 border-dashed border-tinta/30 text-center text-sm text-tinta-pudar">
        {mode === "login" ? (
          <>
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-kuning font-bold underline hover:text-white"
            >
              Daftar di sini
            </Link>
          </>
        ) : (
          <>
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-kuning font-bold underline hover:text-white"
            >
              Masuk di sini
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
