"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PiCameraBold, PiUploadSimpleBold, PiWarningBold } from "react-icons/pi";
import { extractFromImage, ExtractionError } from "@/lib/extract";
import type { ExtractionResult } from "@/lib/extract/types";

interface UploadDropzoneProps {
  onExtractionSuccess: (result: ExtractionResult, imageFile: File) => void;
  onFallbackManual: () => void;
}

export function UploadDropzone({
  onExtractionSuccess,
  onFallbackManual,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Lagi baca struknya");
  const [progressStep, setProgressStep] = useState(0);
  const [errorInfo, setErrorInfo] = useState<{ title: string; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = useCallback(
    async (file: File) => {
      setErrorInfo(null);
      setIsProcessing(true);
      setStatusText("Lagi baca struknya");

      try {
        const result = await extractFromImage(file, (status) => {
          if (status.includes("loading") || status.includes("init")) {
            setStatusText("Menyiapkan pembaca struk, cukup sekali");
          } else if (status.includes("recognizing")) {
            setStatusText("Lagi baca struknya");
          }
        });

        setIsProcessing(false);
        onExtractionSuccess(result, file);
      } catch (err) {
        setIsProcessing(false);
        console.error("[UploadDropzone] Error scanning receipt:", err);
        if (err instanceof ExtractionError) {
          const title =
            err.code === "NOT_AN_EXPENSE"
              ? "Bukan Struk atau Bukti Bayar"
              : err.code === "NO_TEXT"
              ? "Teks Tidak Terbaca"
              : err.code === "INVALID_FILE"
              ? "File Tidak Sesuai"
              : "Gagal Membaca";
          setErrorInfo({ title, message: err.message });
        } else {
          setErrorInfo({
            title: "Gagal Membaca",
            message:
              err instanceof Error
                ? `Pembaca struk gagal: ${err.message}`
                : "Pembaca struk gagal memproses gambar. Coba lagi atau isi manual.",
          });
        }
      }
    },
    [onExtractionSuccess]
  );

  // Animation for "mesin cetak" waiting state (DESIGN.md 5.4)
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setProgressStep((prev) => (prev + 1) % 4);
    }, 350);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Support Ctrl+V paste from clipboard (DESIGN.md 5.5)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleProcessFile(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleProcessFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      handleProcessFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleProcessFile(files[0]);
    }
  };

  if (isProcessing) {
    return (
      <div className="bg-kertas border-2 border-tinta rounded-[10px] p-8 shadow-hard text-center min-h-[260px] flex flex-col items-center justify-center">
        {/* Mesin Cetak Waiting Graphic (DESIGN.md 5.4) */}
        <div className="w-64 bg-kertas border-2 border-tinta rounded-t-md p-4 mb-4 shadow-hard-sm">
          <div className="text-xs font-bold text-tinta-pudar text-left mb-3 uppercase tracking-wider">
            Mencetak nota...
          </div>
          <div className="space-y-2.5">
            <div
              className={`h-3 rounded border border-tinta transition-all duration-200 ${
                progressStep >= 1 ? "bg-tinta/80 w-3/4" : "bg-karbon/50 w-1/3"
              }`}
            />
            <div
              className={`h-3 rounded border border-tinta transition-all duration-200 ${
                progressStep >= 2 ? "bg-tinta/80 w-1/2" : "bg-karbon/50 w-1/4"
              }`}
            />
            <div
              className={`h-3 rounded border border-tinta transition-all duration-200 ${
                progressStep >= 3 ? "bg-kuning w-2/3" : "bg-karbon/50 w-1/2"
              }`}
            />
          </div>
        </div>

        <div aria-live="polite" className="font-bold text-base text-tinta">
          {statusText}…
        </div>
        <p className="text-xs text-tinta-pudar mt-1">
          Diproses langsung di perambanmu tanpa kirim gambar ke server.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorInfo && (
        <div className="p-4 bg-stempel/10 border-2 border-stempel rounded-[10px] text-tinta flex items-start gap-3">
          <PiWarningBold className="text-2xl text-stempel shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-bold text-stempel mb-1">{errorInfo.title}</p>
            <p>{errorInfo.message}</p>
            <button
              onClick={onFallbackManual}
              className="mt-2 text-xs font-bold text-pulpen underline cursor-pointer"
            >
              Isi manual saja →
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Dropzone Area (DESIGN.md 5.5) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed border-tinta rounded-[10px] min-h-[220px] p-6 flex flex-col items-center justify-center text-center transition-colors ${
          isDragging ? "bg-kuning" : "bg-kertas"
        }`}
      >
        <h3 className="font-display text-2xl text-tinta mb-1">
          Spill struknya di sini
        </h3>
        <p className="text-xs text-tinta-pudar max-w-sm mb-5">
          Tarik file, pilih dari galeri, atau tempel (Ctrl+V). JPG, PNG, WEBP, maksimal 10 MB.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {/* Tombol sorot (kuning) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-kuning text-karbon font-bold border-2 border-karbon rounded-md shadow-hard min-h-11 px-5 flex items-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] cursor-pointer"
          >
            <PiUploadSimpleBold className="text-lg text-karbon" />
            <span className="text-karbon">Pilih Foto</span>
          </button>

          {/* Kamera langsung untuk mobile */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="bg-kertas text-tinta font-bold border-2 border-tinta rounded-md shadow-hard min-h-11 px-4 flex items-center gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] cursor-pointer"
          >
            <PiCameraBold className="text-lg" />
            <span>Buka Kamera</span>
          </button>
        </div>
      </div>
    </div>
  );
}
