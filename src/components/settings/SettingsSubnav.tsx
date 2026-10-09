"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiTagBold, PiTelegramLogoBold, PiKeyBold } from "react-icons/pi";

export function SettingsSubnav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/settings/categories",
      label: "Kategori",
      icon: PiTagBold,
    },
    {
      href: "/settings/notifications",
      label: "Notifikasi Telegram",
      icon: PiTelegramLogoBold,
    },
    {
      href: "/settings/api",
      label: "Kode Unik & Scan API",
      icon: PiKeyBold,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b-2 border-dashed border-tinta/30 pb-4 mb-6 w-full min-w-0">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm border-2 transition-all duration-150 ${
              active
                ? "bg-kuning text-karbon border-tinta shadow-hard -translate-y-0.5"
                : "bg-kertas text-tinta-pudar border-tinta/40 hover:text-tinta hover:border-tinta hover:bg-tinta/5"
            }`}
          >
            <Icon className="text-base" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
