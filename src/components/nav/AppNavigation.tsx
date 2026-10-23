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

  const isItemActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/expenses") {
      return pathname.startsWith("/expenses") && !pathname.startsWith("/expenses/new");
    }
    if (href === "/settings/categories") {
      return pathname.startsWith("/settings/categories");
    }
    if (href === "/settings/notifications") {
      return pathname.startsWith("/settings") && !pathname.startsWith("/settings/categories");
    }
    return pathname.startsWith(href);
  };

  const renderMobileNavItem = (item: (typeof navItems)[number]) => {
    const isActive = isItemActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex flex-col items-center justify-center py-1 px-3 min-w-[56px] transition-colors ${isActive
          ? "text-tinta font-bold"
          : "text-tinta-pudar hover:text-tinta font-medium"
          }`}
      >
        <Icon className={`text-2xl transition-transform ${isActive ? "scale-105" : ""}`} />
        <span className="text-[11px] leading-tight mt-0.5">
          {item.label}
        </span>
        <span
          className={`w-5 h-[3px] rounded-full mt-1 transition-all duration-150 ${isActive ? "bg-kuning scale-x-100 opacity-100" : "bg-transparent scale-x-0 opacity-0"
            }`}
          aria-hidden="true"
        />
      </Link>
    );
  };

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
        {/* Navigation Links */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-bold border-2 transition-colors ${isActive
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
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-kertas border-t-2 border-tinta h-16 px-2 sm:px-4 z-40 flex items-center justify-around">
        {navItems.slice(0, 2).map(renderMobileNavItem)}

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

        {navItems.slice(2).map(renderMobileNavItem)}
      </nav>
    </>
  );
}
