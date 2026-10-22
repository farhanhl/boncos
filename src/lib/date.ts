/**
 * Utility functions for date formatting in Boncos.
 * Standard format for user-facing date across the project is strictly 'dd/mm/yyyy'.
 */

/**
 * Formats a date string (ISO 'YYYY-MM-DD' or timestamp) or Date object into 'dd/mm/yyyy'.
 * Example: '2026-10-14' -> '14/10/2026'
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";

  if (typeof date === "string") {
    // Check if it's already in dd/mm/yyyy format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }

    // Standard YYYY-MM-DD format
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${d}/${m}/${y}`;
    }

    // Fallback: try parsing as Date
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, "0");
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const year = parsed.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return date;
  }

  if (date instanceof Date && !isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return "";
}

/**
 * Converts a Date object to local 'YYYY-MM-DD' string for internal storage / input[type="date"].
 */
export function toIsoDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const INDONESIAN_MONTHS_LONG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const INDONESIAN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export interface FormatDateIndonesianOptions {
  withDay?: boolean;
  monthFormat?: "short" | "long";
}

/**
 * Formats a date into human-readable Indonesian representation.
 * Example: '2026-10-15' -> 'Kamis, 15 Oktober 2026' or 'Kamis, 15 Okt 2026'
 */
export function formatDateIndonesian(
  date: string | Date | null | undefined,
  options: FormatDateIndonesianOptions = { withDay: true, monthFormat: "long" }
): string {
  if (!date) return "";

  let y: number;
  let m: number;
  let d: number;
  let dayOfWeek: number;

  if (typeof date === "string") {
    const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      y = parseInt(isoMatch[1], 10);
      m = parseInt(isoMatch[2], 10) - 1;
      d = parseInt(isoMatch[3], 10);
      const utcDate = new Date(Date.UTC(y, m, d));
      dayOfWeek = utcDate.getUTCDay();
    } else {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) return date;
      y = parsed.getFullYear();
      m = parsed.getMonth();
      d = parsed.getDate();
      dayOfWeek = parsed.getDay();
    }
  } else if (date instanceof Date && !isNaN(date.getTime())) {
    y = date.getFullYear();
    m = date.getMonth();
    d = date.getDate();
    dayOfWeek = date.getDay();
  } else {
    return "";
  }

  const monthName =
    options.monthFormat === "short"
      ? INDONESIAN_MONTHS_SHORT[m] || ""
      : INDONESIAN_MONTHS_LONG[m] || "";

  const dayName = INDONESIAN_DAYS[dayOfWeek] || "";

  if (options.withDay && dayName) {
    return `${dayName}, ${d} ${monthName} ${y}`;
  }

  return `${d} ${monthName} ${y}`;
}

/**
 * Formats an ISO timestamp string or Date object into 'HH:mm' (local time).
 * Example: '2026-10-18T14:05:00.000Z' -> '14:05' (in local timezone)
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const parsed = date instanceof Date ? date : new Date(date);
  if (isNaN(parsed.getTime())) return "";
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
