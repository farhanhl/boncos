import type { Field } from "../types";
import type { NormalizedLine } from "./normalize";

const IGNORE_DATE_KEYWORDS = [
  "EXPIRED",
  "KADALUARSA",
  "JATUH TEMPO",
  "BERLAKU",
  "VALID",
];

const DATE_LABEL_KEYWORDS = ["TANGGAL", "TGL", "DATE", "WAKTU", "TIME"];

const MONTH_MAP: Record<string, number> = {
  JAN: 1,
  JANUARI: 1,
  JANUARY: 1,
  FEB: 2,
  FEBRUARI: 2,
  FEBRUARY: 2,
  PEB: 2,
  MAR: 3,
  MARET: 3,
  MARCH: 3,
  APR: 4,
  APRIL: 4,
  MEI: 5,
  MAY: 5,
  JUN: 6,
  JUNI: 6,
  JUNE: 6,
  JUL: 7,
  JULI: 7,
  JULY: 7,
  AGU: 8,
  AGT: 8,
  AGUSTUS: 8,
  AUG: 8,
  AUGUST: 8,
  SEP: 9,
  SEPT: 9,
  SEPTEMBER: 9,
  OKT: 10,
  OKTOBER: 10,
  OCT: 10,
  OCTOBER: 10,
  NOV: 11,
  NOVEMBER: 11,
  NOP: 11,
  DES: 12,
  DESEMBER: 12,
  DEC: 12,
  DECEMBER: 12,
};

export function extractDate(
  lines: NormalizedLine[]
): { field: Field<string>; warning?: string } {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  for (const line of lines) {
    const upper = line.upper;
    if (IGNORE_DATE_KEYWORDS.some((kw) => upper.includes(kw))) {
      continue;
    }

    const hasLabel = DATE_LABEL_KEYWORDS.some((kw) => upper.includes(kw));
    const hasTime = /\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(upper);

    // 1. Check Named Month: "8 Okt 2026", "08 OCT 2026", "8 Agustus 2026", "08-Oct-2026"
    const monthNamesPattern = Object.keys(MONTH_MAP).join("|");
    const namedRegex = new RegExp(
      `\\b(\\d{1,2})[\\s\\-\\./]+(${monthNamesPattern})[\\s\\-\\./]+(\\d{2,4})\\b`,
      "i"
    );
    const namedMatch = line.normalized.match(namedRegex);
    if (namedMatch && namedMatch[1] && namedMatch[2] && namedMatch[3]) {
      const d = parseInt(namedMatch[1], 10);
      const mName = namedMatch[2].toUpperCase();
      const m = MONTH_MAP[mName];
      let y = parseInt(namedMatch[3], 10);
      if (y < 100) y += 2000;

      if (m && isValidDate(y, m, d)) {
        const parsedDate = new Date(Date.UTC(y, m - 1, d));
        if (parsedDate <= tomorrow) {
          const dateStr = formatDateIso(y, m, d);
          const isOld = parsedDate < oneYearAgo;
          return {
            field: {
              value: dateStr,
              confidence: isOld ? 0.4 : hasLabel || hasTime ? 0.9 : 0.8,
              rule: "named_month",
            },
            warning: isOld ? "Tanggal lebih dari setahun lalu" : undefined,
          };
        }
      }
    }

    // 2. Check ISO: "2026-10-08", "2026/10/08"
    const isoMatch = line.normalized.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/);
    if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10);
      const d = parseInt(isoMatch[3], 10);

      if (isValidDate(y, m, d)) {
        const parsedDate = new Date(Date.UTC(y, m - 1, d));
        if (parsedDate <= tomorrow) {
          const dateStr = formatDateIso(y, m, d);
          const isOld = parsedDate < oneYearAgo;
          return {
            field: {
              value: dateStr,
              confidence: isOld ? 0.4 : hasLabel || hasTime ? 0.9 : 0.75,
              rule: "iso_date",
            },
            warning: isOld ? "Tanggal lebih dari setahun lalu" : undefined,
          };
        }
      }
    }

    // 3. Check Numeric: "08/10/2026", "08-10-26", "8.10.2026"
    const numMatch = line.normalized.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
    if (numMatch && numMatch[1] && numMatch[2] && numMatch[3]) {
      const part1 = parseInt(numMatch[1], 10);
      const part2 = parseInt(numMatch[2], 10);
      let y = parseInt(numMatch[3], 10);
      if (y < 100) y += 2000;

      // Default DD/MM; if second > 12 and first <= 12, swap (MM/DD)
      let d = part1;
      let m = part2;
      if (part2 > 12 && part1 <= 12) {
        m = part1;
        d = part2;
      }

      if (m >= 1 && m <= 12 && isValidDate(y, m, d)) {
        const parsedDate = new Date(Date.UTC(y, m - 1, d));
        if (parsedDate <= tomorrow) {
          const dateStr = formatDateIso(y, m, d);
          const isOld = parsedDate < oneYearAgo;
          return {
            field: {
              value: dateStr,
              confidence: isOld ? 0.4 : hasLabel || hasTime ? 0.9 : 0.75,
              rule: "numeric_date",
            },
            warning: isOld ? "Tanggal lebih dari setahun lalu" : undefined,
          };
        }
      }
    }
  }

  // Not found: return null
  return {
    field: {
      value: null,
      confidence: 0,
      rule: "no_date_found",
    },
  };
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

function formatDateIso(year: number, month: number, day: number): string {
  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${mm}-${dd}`;
}
