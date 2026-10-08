"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "./UploadDropzone";
import { ReviewForm } from "./ReviewForm";
import type { ExtractionResult } from "@/lib/extract/types";

export function ScanFlow() {
  const router = useRouter();
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSuccess = (result: ExtractionResult, file: File) => {
    setExtractedData(result);
    setImageFile(file);
  };

  const handleCancel = () => {
    setExtractedData(null);
    setImageFile(null);
  };

  const handleFallbackManual = () => {
    router.replace("?tab=manual");
  };

  if (extractedData && imageFile) {
    return (
      <ReviewForm
        extraction={extractedData}
        imageFile={imageFile}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <UploadDropzone
      onExtractionSuccess={handleSuccess}
      onFallbackManual={handleFallbackManual}
    />
  );
}
