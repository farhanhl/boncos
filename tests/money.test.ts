import { describe, it, expect } from "vitest";
import {
  formatRupiah,
  formatRupiahCompact,
  parseRupiahInput,
  isValidMoney,
} from "@/lib/money";

describe("Money Utility (lib/money.ts)", () => {
  describe("formatRupiah", () => {
    it("formats integer amounts with standard ID locale dots", () => {
      expect(formatRupiah(25000)).toBe("Rp 25.000");
      expect(formatRupiah(1250000)).toBe("Rp 1.250.000");
      expect(formatRupiah(0)).toBe("Rp 0");
      expect(formatRupiah(500)).toBe("Rp 500");
    });

    it("formats negative amounts safely", () => {
      expect(formatRupiah(-25000)).toBe("-Rp 25.000");
    });
  });

  describe("formatRupiahCompact", () => {
    it("formats amounts into Indonesian compact abbreviations", () => {
      expect(formatRupiahCompact(900000)).toBe("900rb");
      expect(formatRupiahCompact(450000)).toBe("450rb");
      expect(formatRupiahCompact(1500000)).toBe("1,5jt");
      expect(formatRupiahCompact(2000000)).toBe("2jt");
    });
  });

  describe("parseRupiahInput", () => {
    it("extracts integer rupiah from formatted input", () => {
      expect(parseRupiahInput("25.000")).toBe(25000);
      expect(parseRupiahInput("Rp 1.500.000")).toBe(1500000);
      expect(parseRupiahInput("")).toBe(0);
      expect(parseRupiahInput("abc")).toBe(0);
    });
  });

  describe("isValidMoney", () => {
    it("validates positive safe integers within limit", () => {
      expect(isValidMoney(25000)).toBe(true);
      expect(isValidMoney(100)).toBe(true);
      expect(isValidMoney(0)).toBe(false);
      expect(isValidMoney(-500)).toBe(false);
      expect(isValidMoney(25.5)).toBe(false);
      expect(isValidMoney(2_000_000_000)).toBe(false); // exceeds 1 billion limit
    });
  });
});
