"use client";

import { useRef } from "react";
import { PiCalendarBlankBold, PiXBold } from "react-icons/pi";
import { formatDate } from "@/lib/date";

export interface DatePickerFieldProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  title?: string;
  required?: boolean;
  clearable?: boolean;
  className?: string;
}

export function DatePickerField({
  id,
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  title = "Pilih tanggal",
  required = false,
  clearable,
  className = "",
}: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const display = value ? formatDate(value) : "";
  const showClear = clearable !== undefined ? clearable : !required;

  return (
    <div
      onClick={() => {
        try {
          inputRef.current?.showPicker?.();
        } catch {
          // ignore if showPicker is unsupported
        }
      }}
      className={`relative min-w-0 bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 flex items-center justify-between gap-2 focus-within:shadow-[3px_3px_0_0_var(--pulpen)] cursor-pointer group ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 overflow-hidden pointer-events-none">
        <PiCalendarBlankBold className="text-tinta-pudar text-base shrink-0 group-hover:text-tinta transition-colors" />
        <span
          className={`text-sm truncate select-none ${
            display ? "text-tinta font-bold" : "text-tinta-pudar font-medium"
          }`}
        >
          {display || placeholder}
        </span>
      </div>

      {showClear && value ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          title="Hapus tanggal"
          aria-label="Hapus tanggal"
          className="relative z-10 p-1 text-tinta-pudar hover:text-stempel transition-colors cursor-pointer shrink-0"
        >
          <PiXBold className="text-xs" />
        </button>
      ) : null}

      <input
        ref={inputRef}
        id={id}
        type="date"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={title}
        aria-label={title}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
        style={{ colorScheme: "dark" }}
      />
    </div>
  );
}
