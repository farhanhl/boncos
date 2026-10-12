"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PiTargetBold, PiPencilSimpleBold, PiCheckBold, PiXBold } from "react-icons/pi";
import { formatRupiah } from "@/lib/money";
import { saveMonthlyBudget } from "@/actions/dashboard";

interface BudgetProgressCardProps {
  currentTotal: number;
  initialBudget: number;
}

export function BudgetProgressCard({
  currentTotal,
  initialBudget,
}: BudgetProgressCardProps) {
  const router = useRouter();
  const [budget, setBudget] = useState<number>(initialBudget);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>(
    initialBudget > 0 ? initialBudget.toString() : ""
  );
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const percentage = budget > 0 ? Math.round((currentTotal / budget) * 100) : 0;
  const barWidth = Math.min(100, Math.max(0, percentage));
  const remaining = budget - currentTotal;

  // Status evaluasi
  let statusBadge = {
    text: "Belum Ada Target",
    className: "bg-kuning text-karbon border-karbon",
  };

  let barColor = "bg-cendol";

  if (budget > 0) {
    if (percentage >= 100) {
      statusBadge = {
        text: "Kantong Jebol!",
        className: "bg-stempel text-white border-white",
      };
      barColor = "bg-stempel";
    } else if (percentage >= 75) {
      statusBadge = {
        text: "Siaga Boncos",
        className: "bg-kuning text-karbon border-karbon",
      };
      barColor = "bg-kuning";
    } else {
      statusBadge = {
        text: "Masih Aman",
        className: "bg-cendol text-karbon border-karbon",
      };
      barColor = "bg-cendol";
    }
  }

  const handleSave = () => {
    setErrorMsg("");
    const parsed = parseInt(inputVal.replace(/\D/g, ""), 10);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg("Masukkan nominal target yang valid.");
      return;
    }

    startTransition(async () => {
      const res = await saveMonthlyBudget(parsed);
      if (res.ok) {
        setBudget(parsed);
        setIsEditing(false);
        router.refresh();
      } else {
        setErrorMsg(res.message);
      }
    });
  };

  return (
    <div className="bg-kertas border-2 border-tinta rounded-[10px] p-5 shadow-hard space-y-4 text-tinta">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-tinta/30 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-kuning text-karbon flex items-center justify-center font-bold border border-karbon shrink-0">
            <PiTargetBold className="text-base" />
          </div>
          <h3 className="font-display text-lg sm:text-xl text-tinta">
            Target Anggaran
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-hard-sm ${statusBadge.className}`}
          >
            {statusBadge.text}
          </span>
          {!isEditing && (
            <button
              onClick={() => {
                setInputVal(budget > 0 ? budget.toString() : "");
                setIsEditing(true);
              }}
              className="p-1.5 rounded-md border-2 border-tinta bg-pulpen text-white hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              title="Ubah batas anggaran"
            >
              <PiPencilSimpleBold className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Edit Inline */}
      {isEditing ? (
        <div className="p-3 bg-karbon/50 border-2 border-tinta/40 rounded-md space-y-2.5">
          <label className="block text-xs font-bold text-tinta-pudar">
            Tentukan batas jajan bulananmu (Rp):
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-tinta-pudar">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={
                  inputVal
                    ? parseInt(inputVal.replace(/\D/g, ""), 10).toLocaleString("id-ID")
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setInputVal(raw);
                }}
                placeholder="2.000.000"
                className="w-full pl-10 pr-3 py-1.5 bg-kertas border-2 border-tinta rounded-md text-sm font-bold text-tinta tabular-nums focus:ring-0 focus:shadow-[2px_2px_0_0_var(--pulpen)]"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-cendol text-karbon font-bold text-xs rounded-md border-2 border-karbon shadow-hard-sm hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50"
            >
              <PiCheckBold className="text-sm" />
              <span>{isPending ? "..." : "Simpan"}</span>
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setErrorMsg("");
              }}
              disabled={isPending}
              className="p-1.5 bg-kertas text-tinta font-bold text-xs rounded-md border-2 border-tinta hover:bg-karbon cursor-pointer"
            >
              <PiXBold className="text-sm" />
            </button>
          </div>
          {errorMsg && (
            <p className="text-xs text-stempel font-semibold">{errorMsg}</p>
          )}
        </div>
      ) : budget === 0 ? (
        /* Empty State Budget */
        <div className="py-2 flex items-center justify-between text-xs text-tinta-pudar">
          <span>Kamu belum menentukan target pengeluaran bulan ini.</span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-kuning underline hover:text-white transition-colors cursor-pointer"
          >
            Pasang Target →
          </button>
        </div>
      ) : (
        /* Stats & Progress Bar */
        <div className="space-y-3">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-tinta-pudar">
              Terpakai:{" "}
              <strong className="text-tinta text-sm font-bold tabular-nums">
                {formatRupiah(currentTotal)}
              </strong>{" "}
              dari {formatRupiah(budget)}
            </span>
            <span className="font-display text-base text-tinta tabular-nums">
              {percentage}%
            </span>
          </div>

          {/* Progress Track */}
          <div className="h-6 w-full bg-karbon/50 rounded-md border-2 border-tinta/40 overflow-hidden relative flex items-center">
            <div
              style={{ width: `${barWidth}%` }}
              className={`h-full ${barColor} border-r-2 border-tinta transition-all duration-500 flex items-center justify-end px-2`}
            >
              {barWidth > 15 && (
                <span className="text-[10px] font-bold text-karbon tabular-nums">
                  {percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Sisa & Keterangan */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-tinta-pudar font-semibold">
              {remaining >= 0 ? (
                <>
                  Sisa anggaran:{" "}
                  <strong className="text-cendol tabular-nums font-bold">
                    {formatRupiah(remaining)}
                  </strong>
                </>
              ) : (
                <>
                  Melebihi target:{" "}
                  <strong className="text-stempel tabular-nums font-bold">
                    {formatRupiah(Math.abs(remaining))}
                  </strong>
                </>
              )}
            </span>
            <span className="text-[11px] text-tinta-pudar/70">
              {remaining >= 0 ? "Tetap jaga pengeluaranmu!" : "Kurangi jajan dulu ya!"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
