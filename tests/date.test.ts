import { describe, it, expect } from "vitest";
import { formatDate, toIsoDateString, formatDateIndonesian } from "@/lib/date";

describe("Date Utility (lib/date.ts)", () => {
  describe("formatDate", () => {
    it("formats ISO YYYY-MM-DD into dd/mm/yyyy", () => {
      expect(formatDate("2026-10-14")).toBe("14/10/2026");
      expect(formatDate("2026-01-05")).toBe("05/01/2026");
      expect(formatDate("2025-12-31")).toBe("31/12/2025");
    });

    it("leaves already formatted dd/mm/yyyy unchanged", () => {
      expect(formatDate("14/10/2026")).toBe("14/10/2026");
      expect(formatDate("01/01/2026")).toBe("01/01/2026");
    });

    it("formats full ISO timestamp strings into dd/mm/yyyy", () => {
      expect(formatDate("2026-10-14T08:30:00.000Z")).toBe("14/10/2026");
    });

    it("formats Date objects into dd/mm/yyyy", () => {
      const d = new Date(2026, 9, 14); // Note: month is 0-indexed in JS (9 = Oct)
      expect(formatDate(d)).toBe("14/10/2026");
    });

    it("handles null, undefined, and empty string safely", () => {
      expect(formatDate("")).toBe("");
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
    });
  });

  describe("toIsoDateString", () => {
    it("converts Date to YYYY-MM-DD local string", () => {
      const d = new Date(2026, 9, 14);
      expect(toIsoDateString(d)).toBe("2026-10-14");
    });
  });

  describe("formatDateIndonesian", () => {
    it("formats date with day name and long month by default", () => {
      // 2026-10-15 is Thursday (Kamis)
      expect(formatDateIndonesian("2026-10-15")).toBe("Kamis, 15 Oktober 2026");
      // 2026-10-14 is Wednesday (Rabu)
      expect(formatDateIndonesian("2026-10-14")).toBe("Rabu, 14 Oktober 2026");
      // 2026-01-01 is Thursday (Kamis)
      expect(formatDateIndonesian("2026-01-01")).toBe("Kamis, 1 Januari 2026");
    });

    it("formats date with short month when specified", () => {
      expect(
        formatDateIndonesian("2026-10-15", { withDay: true, monthFormat: "short" })
      ).toBe("Kamis, 15 Okt 2026");
    });

    it("formats date without day name when withDay is false", () => {
      expect(
        formatDateIndonesian("2026-10-15", { withDay: false, monthFormat: "long" })
      ).toBe("15 Oktober 2026");
      expect(
        formatDateIndonesian("2026-10-15", { withDay: false, monthFormat: "short" })
      ).toBe("15 Okt 2026");
    });

    it("handles null, undefined, or empty string gracefully", () => {
      expect(formatDateIndonesian("")).toBe("");
      expect(formatDateIndonesian(null)).toBe("");
      expect(formatDateIndonesian(undefined)).toBe("");
    });
  });
});
