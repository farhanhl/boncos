"use client";

import { useEffect } from "react";
import { PiWarningBold } from "react-icons/pi";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Technical log only in dev console without personal data (AGENTS.md)
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-8 shadow-hard max-w-md w-full">
        <div className="w-12 h-12 bg-stempel/10 border-2 border-stempel rounded-full flex items-center justify-center mx-auto mb-4">
          <PiWarningBold className="text-2xl text-stempel" />
        </div>

        <h2 className="font-display text-2xl text-tinta mb-2">
          Terjadi Kesalahan
        </h2>
        <p className="text-sm text-tinta-pudar mb-6">
          Halaman gagal memuat data. Kamu bisa mencoba memuat ulang halaman ini.
        </p>

        <button
          onClick={() => reset()}
          className="bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] w-full cursor-pointer"
        >
          Muat Ulang Halaman
        </button>
      </div>
    </div>
  );
}
