"use client";

import { useState } from "react";
import {
  PiKeyBold,
  PiXBold,
  PiCheckCircleBold,
  PiXCircleBold,
  PiWarningCircleBold,
  PiArrowsClockwiseBold,
  PiShieldCheckBold,
} from "react-icons/pi";

interface EnvItem {
  key: string;
  name: string;
  scope: "client" | "server";
  required: boolean;
  exists: boolean;
  status: "OK" | "MISSING" | "INVALID";
  preview: string;
  details?: string;
}

interface EnvResponse {
  ok: boolean;
  allRequiredOk: boolean;
  environment: string;
  timestamp: string;
  items: EnvItem[];
}

export function EnvCheckModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnvResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/env-status", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Server mengembalikan status ${res.status}`);
      }
      const json: EnvResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat status environment");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!data) {
      fetchEnvStatus();
    }
  };

  return (
    <>
      {/* Floating Trigger Button di Kanan Bawah */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Cek status environment variables"
        className="fixed bottom-4 right-4 z-40 bg-kertas border-2 border-tinta shadow-hard hover:shadow-hard-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none rounded-lg px-3 py-1.5 text-xs font-bold text-tinta flex items-center gap-1.5 transition-all cursor-pointer"
      >
        <PiKeyBold className="text-sm text-pulpen" />
        <span>Cek Key & Env</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-karbon/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-kertas border-2 border-tinta rounded-xl shadow-hard-lg max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-tinta bg-kartu">
              <div className="flex items-center gap-2">
                <PiShieldCheckBold className="text-xl text-pulpen" />
                <h2 className="font-display text-lg text-tinta">Status Environment Variables</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md border-2 border-tinta bg-kertas hover:bg-stabilo text-tinta transition-colors"
                aria-label="Tutup"
              >
                <PiXBold className="text-base" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {loading && (
                <div className="py-8 text-center text-tinta flex flex-col items-center justify-center gap-2">
                  <PiArrowsClockwiseBold className="text-2xl animate-spin text-pulpen" />
                  <p className="text-sm font-semibold">Memeriksa variabel yang terbaca di server...</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-stempel/10 border-2 border-stempel rounded-lg text-stempel text-xs font-semibold">
                  Gagal memuat status: {error}
                </div>
              )}

              {data && !loading && (
                <>
                  {/* Status Banner */}
                  <div
                    className={`p-3 rounded-lg border-2 flex items-center gap-2.5 text-xs font-bold ${
                      data.allRequiredOk
                        ? "bg-hijau/20 border-hijau text-tinta"
                        : "bg-stempel/15 border-stempel text-tinta"
                    }`}
                  >
                    {data.allRequiredOk ? (
                      <PiCheckCircleBold className="text-lg text-hijau shrink-0" />
                    ) : (
                      <PiWarningCircleBold className="text-lg text-stempel shrink-0" />
                    )}
                    <div>
                      <p className="font-bold">
                        {data.allRequiredOk
                          ? "Semua key penting berhasil terbaca!"
                          : "Beberapa key penting belum lengkap / tidak valid."}
                      </p>
                      <p className="text-[11px] text-tinta-pudar font-normal mt-0.5">
                        Lingkungan: <span className="font-mono font-semibold text-tinta">{data.environment}</span> • Waktu: {new Date(data.timestamp).toLocaleTimeString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-tinta/10 border-2 border-tinta rounded-lg bg-kertas overflow-hidden">
                    {data.items.map((item) => (
                      <div key={item.key} className="p-2.5 flex items-start justify-between gap-3 hover:bg-kartu/40 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-tinta break-all">
                              {item.key}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded border border-tinta/30 bg-kartu text-tinta-pudar font-semibold">
                              {item.scope}
                            </span>
                          </div>
                          <p className="text-[11px] text-tinta-pudar mt-0.5">{item.name}</p>
                          <p className="text-[11px] font-mono mt-1 text-tinta bg-kartu px-2 py-0.5 rounded border border-tinta/20 inline-block">
                            {item.preview}
                          </p>
                          {item.details && (
                            <p className="text-[11px] text-stempel font-semibold mt-1">
                              ⚠️ {item.details}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 pt-0.5">
                          {item.status === "OK" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-hijau/20 text-tinta border border-hijau">
                              <PiCheckCircleBold className="text-hijau" /> OK
                            </span>
                          ) : item.status === "INVALID" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-stabilo/30 text-tinta border border-tinta">
                              <PiWarningCircleBold className="text-tinta" /> INVALID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-stempel/20 text-stempel border border-stempel">
                              <PiXCircleBold className="text-stempel" /> MISSING
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t-2 border-tinta bg-kartu flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={fetchEnvStatus}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-bold text-tinta bg-kertas border-2 border-tinta rounded-md shadow-hard hover:shadow-hard-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <PiArrowsClockwiseBold className={`text-sm ${loading ? "animate-spin" : ""}`} />
                <span>Segarkan Data</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-tinta border-2 border-tinta rounded-md hover:bg-tinta/90 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
