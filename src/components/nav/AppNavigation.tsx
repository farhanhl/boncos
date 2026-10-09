"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PiHouseBold,
  PiReceiptBold,
  PiCameraBold,
  PiTagBold,
  PiGearBold,
  PiSignOutBold,
  PiFileCodeBold,
} from "react-icons/pi";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { SessionRefresher } from "@/components/auth/SessionRefresher";

interface AppNavigationProps {
  userDisplayName?: string;
}

export function AppNavigation({ userDisplayName }: AppNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const auth = getClientAuth();
      await signOut(auth);
      if (typeof window !== "undefined") {
        localStorage.removeItem("boncos_last_session_refresh");
      }
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Beranda", icon: PiHouseBold },
    { href: "/expenses", label: "Daftar", icon: PiReceiptBold },
    { href: "/settings/categories", label: "Kategori", icon: PiTagBold },
    { href: "/settings/notifications", label: "Atur", icon: PiGearBold },
  ];

  return (
    <>
      <SessionRefresher />
      {/* Desktop Left Rail (>= 1024px) */}
      <aside className="hidden lg:flex flex-col w-60 bg-kertas border-r-2 border-tinta fixed inset-y-0 left-0 p-5 z-30">
        <div className="flex items-center gap-2 mb-8">
          <span className="font-display text-3xl text-tinta tracking-tight">
            Boncos
          </span>
          <span className="bg-kuning text-karbon text-xs font-bold px-2 py-0.5 rounded-full border-2 border-karbon -rotate-3">
            v1.0
          </span>
        </div>

        {/* Primary CTA: Baca struk */}
        <Link
          href="/expenses/new?tab=scan"
          className="bg-kuning text-karbon font-bold border-2 border-karbon rounded-md shadow-hard min-h-11 px-4 mb-6 flex items-center justify-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-100"
        >
          <PiCameraBold className="text-xl text-karbon" />
          <span className="text-karbon">Baca Struk</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : item.href === "/settings/notifications"
                ? pathname.startsWith("/settings") && !pathname.startsWith("/settings/categories")
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-bold border-2 transition-colors ${
                  isActive
                    ? "bg-kuning text-karbon border-karbon shadow-hard-sm"
                    : "border-transparent text-tinta hover:bg-karbon/50"
                }`}
              >
                <Icon className={`text-xl ${isActive ? "text-karbon" : "text-tinta"}`} />
                <span className={isActive ? "text-karbon" : "text-tinta"}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Developer Swagger Docs link */}
        <div className="pt-2 mb-2">
          <Link
            href="/docs"
            className="flex items-center gap-2 text-xs font-bold text-tinta-pudar hover:text-tinta px-3 py-2 rounded-md hover:bg-karbon/40 transition-colors"
          >
            <PiFileCodeBold className="text-base" />
            <span>Swagger API Docs</span>
          </Link>
        </div>

        {/* User profile & Logout */}
        <div className="pt-4 border-t-2 border-dashed border-tinta/30 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs text-tinta-pudar font-semibold">Login sebagai</p>
            <p className="text-sm font-bold text-tinta truncate">
              {userDisplayName || "Kamu"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-2 border-2 border-tinta rounded-md hover:bg-stempel hover:text-white transition-colors cursor-pointer"
          >
            <PiSignOutBold className="text-lg" />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-kertas border-t-2 border-tinta h-16 px-4 z-40 flex items-center justify-around">
        {/* Beranda */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center p-1 rounded-md ${
            pathname === "/dashboard" ? "text-pulpen font-bold" : "text-tinta"
          }`}
        >
          <PiHouseBold className="text-2xl" />
          <span className="text-[11px] font-bold">Beranda</span>
        </Link>

        {/* Daftar */}
        <Link
          href="/expenses"
          className={`flex flex-col items-center justify-center p-1 rounded-md ${
            pathname.startsWith("/expenses") && !pathname.startsWith("/expenses/new")
              ? "text-pulpen font-bold"
              : "text-tinta"
          }`}
        >
          <PiReceiptBold className="text-2xl" />
          <span className="text-[11px] font-bold">Daftar</span>
        </Link>

        {/* Floating Scan CTA */}
        <div className="-mt-8">
          <Link
            href="/expenses/new?tab=scan"
            aria-label="Baca Struk"
            className="w-14 h-14 rounded-full bg-kuning border-2 border-karbon shadow-hard flex items-center justify-center active:translate-y-1 active:shadow-none transition-transform"
          >
            <PiCameraBold className="text-2xl text-karbon" />
          </Link>
        </div>

        {/* Kategori */}
        <Link
          href="/settings/categories"
          className={`flex flex-col items-center justify-center p-1 rounded-md ${
            pathname.startsWith("/settings/categories")
              ? "text-pulpen font-bold"
              : "text-tinta"
          }`}
        >
          <PiTagBold className="text-2xl" />
          <span className="text-[11px] font-bold">Kategori</span>
        </Link>

        {/* Atur */}
        <Link
          href="/settings/notifications"
          className={`flex flex-col items-center justify-center p-1 rounded-md ${
            pathname.startsWith("/settings") && !pathname.startsWith("/settings/categories")
              ? "text-pulpen font-bold"
              : "text-tinta"
          }`}
        >
          <PiGearBold className="text-2xl" />
          <span className="text-[11px] font-bold">Atur</span>
        </Link>
      </nav>
    </>
  );
}
