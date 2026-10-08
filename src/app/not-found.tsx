import Link from "next/link";
import { PiHouseBold } from "react-icons/pi";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-karbon flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-8 shadow-hard max-w-md w-full">
        <span className="font-display text-6xl text-stempel block mb-2">404</span>
        <h2 className="font-display text-2xl text-tinta mb-2">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm text-tinta-pudar mb-6">
          Halaman yang kamu tuju tidak ada atau sudah dipindahkan.
        </p>

        <Link
          href="/dashboard"
          className="bg-pulpen text-white font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-5 flex items-center justify-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] w-full"
        >
          <PiHouseBold className="text-xl" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}
