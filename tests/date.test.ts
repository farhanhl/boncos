import { describe, it, expect } from "vitest";
import { formatDate, toIsoDateString, formatTime } from "@/lib/date";

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

  describe("formatTime", () => {
    it("formats Date objects into HH:mm", () => {
      const d = new Date(2026, 9, 18, 14, 5);
      expect(formatTime(d)).toBe("14:05");
    });

    it("handles null, undefined, and empty string safely", () => {
      expect(formatTime("")).toBe("");
      expect(formatTime(null)).toBe("");
      expect(formatTime(undefined)).toBe("");
      expect(formatTime("invalid-date")).toBe("");
    });
  });
});

