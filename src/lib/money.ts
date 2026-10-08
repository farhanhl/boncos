/**
 * Utility functions for handling Indonesian Rupiah money format.
 * In accordance with AGENTS.md rule 2: Money is ALWAYS integer, never float.
 */

/**
 * Formats an integer rupiah value into display string.
 * Example: 25000 -> "Rp 25.000"
 */
export function formatRupiah(amount: number): string {
  if (!Number.isFinite(amount)) return "Rp 0";
  const intAmount = Math.round(amount);
  const formatted = Math.abs(intAmount).toLocaleString("id-ID");
  const prefix = intAmount < 0 ? "-Rp " : "Rp ";
  return `${prefix}${formatted}`;
}

/**
 * Compact format for badges or chart labels (as in DESIGN.md: 900rb, 450rb, 1,5jt).
 */
export function formatRupiahCompact(amount: number): string {
  if (!Number.isFinite(amount)) return "0";
  const abs = Math.abs(Math.round(amount));

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(1).replace(".", ",");
    return `${val.endsWith(",0") ? val.slice(0, -2) : val}M`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace(".", ",");
    return `${val.endsWith(",0") ? val.slice(0, -2) : val}jt`;
  }
  if (abs >= 1_000) {
    const val = (abs / 1_000).toFixed(0);
    return `${val}rb`;
  }
  return abs.toString();
}

/**
 * Parses user input formatted with thousands dots into integer rupiah.
 * Example: "25.000" -> 25000, "Rp 150.000" -> 150000
 */
export function parseRupiahInput(value: string): number {
  if (!value) return 0;
  // Remove non-numeric characters except digits
  const clean = value.replace(/[^0-9]/g, "");
  if (!clean) return 0;
  const num = parseInt(clean, 10);
  return Number.isSafeInteger(num) ? num : 0;
}

/**
 * Checks whether an amount is a valid, safe integer rupiah.
 */
export function isValidMoney(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 1_000_000_000;
}
