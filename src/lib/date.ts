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
