"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { PiCameraBold, PiPencilSimpleBold } from "react-icons/pi";
import { ExpenseForm } from "./ExpenseForm";
import { ScanFlow } from "./ScanFlow";

interface NewExpenseTabsProps {
  scanComponent?: React.ReactNode;
}

export function NewExpenseTabs({ scanComponent }: NewExpenseTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") === "manual" ? "manual" : "scan";

  const setTab = (tab: "scan" | "manual") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Segmented Control Tabs (DESIGN.md 4 & 6) */}
      <div className="bg-kertas border-2 border-tinta rounded-md p-1 flex shadow-hard">
        <button
          type="button"
          onClick={() => setTab("scan")}
          className={`flex-1 py-2.5 px-4 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "scan"
              ? "bg-kuning text-karbon border-2 border-karbon shadow-hard-sm"
              : "text-tinta hover:bg-karbon/40"
          }`}
        >
          <PiCameraBold className={`text-xl ${activeTab === "scan" ? "text-karbon" : "text-tinta"}`} />
          <span className={activeTab === "scan" ? "text-karbon" : "text-tinta"}>Foto Struk</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("manual")}
          className={`flex-1 py-2.5 px-4 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "manual"
              ? "bg-kuning text-karbon border-2 border-karbon shadow-hard-sm"
              : "text-tinta hover:bg-karbon/40"
          }`}
        >
          <PiPencilSimpleBold className={`text-xl ${activeTab === "manual" ? "text-karbon" : "text-tinta"}`} />
          <span className={activeTab === "manual" ? "text-karbon" : "text-tinta"}>Isi Manual</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "scan" ? (
        scanComponent || <ScanFlow />
      ) : (
        <ExpenseForm sourceDefault="manual" />
      )}
    </div>
  );
}
