import { describe, it, expect } from "vitest";
import { parseReceiptText, isExpenseDocument, isDisqualifiedDocument } from "@/lib/extract/parse";
import { parseMoney, findMoneyTokens } from "@/lib/extract/parse/money";
import { normalizeOcrText } from "@/lib/extract/parse/normalize";

describe("Extraction Parser Tests (EXTRACTION.md)", () => {
  describe("parseMoney table", () => {
    it("handles all required money formats from EXTRACTION.md table", () => {
      expect(parseMoney("Rp 25.000")).toBe(25000);
      expect(parseMoney("Rp25.000,-")).toBe(25000);
      expect(parseMoney("25.000,00")).toBe(25000);
      expect(parseMoney("25,000.00")).toBe(25000);
      expect(parseMoney("25,000")).toBe(25000);
      expect(parseMoney("25000")).toBe(25000);
      expect(parseMoney("1.250.000")).toBe(1250000);
      expect(parseMoney("25rb")).toBe(25000);
      expect(parseMoney("25 rb")).toBe(25000);
      expect(parseMoney("25k")).toBe(25000);
      expect(parseMoney("25 ribu")).toBe(25000);
      expect(parseMoney("1,5jt")).toBe(1500000);
      expect(parseMoney("1.5jt")).toBe(1500000);
      expect(parseMoney("1,5 juta")).toBe(1500000);
    });

    it("rejects non-integer decimal cents and 0", () => {
      expect(parseMoney("Rp 12.5")).toBe(null);
      expect(parseMoney("Rp 0")).toBe(null);
      expect(parseMoney("50")).toBe(null); // below MIN_MONEY 100
    });
  });

  describe("Normalization & OCR error fixes", () => {
    it("fixes OCR misreads in tokens with thousands separators", () => {
      const lines = normalizeOcrText("TOTAL 2O.OOO");
      expect(lines[0]?.normalized).toBe("TOTAL 20.000");

      const lines2 = normalizeOcrText("TOTAL 1O0.000");
      expect(lines2[0]?.normalized).toBe("TOTAL 100.000");
    });

    it("fixes space inside thousands group", () => {
      const lines = normalizeOcrText("TOTAL 25 000");
      expect(lines[0]?.normalized).toBe("TOTAL 25.000");
    });
  });

  describe("Example 1: Struk Toko (Indomaret Point)", () => {
    const rawReceipt = `
INDOMARET POINT
JL. MERDEKA NO 12 JAKARTA
08/10/2026 14:32 KASIR 03
AQUA 600ML      2  8.000
ROTI TAWAR      1 16.500
SUBTOTAL            24.500
TOTAL               24.500
TUNAI               50.000
KEMBALI             25.500
    `.trim();

    it("correctly extracts all fields from retail receipt example", () => {
      const result = parseReceiptText(rawReceipt);

      expect(result.status).toBe("ok");
      expect(result.doc_type).toBe("receipt");
      expect(result.name.value).toBe("Indomaret Point");
      expect(result.name.confidence).toBeGreaterThanOrEqual(0.7);

      expect(result.amount.value).toBe(24500);
      expect(result.amount.confidence).toBe(0.95); // boosted by tunai - kembali match!

      expect(result.expense_date.value).toBe("2026-10-08");
      expect(result.expense_date.confidence).toBeGreaterThanOrEqual(0.85);

      expect(result.category_suggestion.value).toBe("shopping");
      expect(result.extraction_confidence).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe("Example 2: Screenshot E-Wallet (Kopi Susu Tetangga)", () => {
    const rawEwallet = `
Pembayaran Berhasil
Rp 18.500
Ke        Kopi Susu Tetangga
Waktu     8 Okt 2026, 09:14
    `.trim();

    it("correctly extracts all fields from e-wallet screenshot example", () => {
      const result = parseReceiptText(rawEwallet);

      expect(result.status).toBe("ok");
      expect(result.doc_type).toBe("ewallet");
      expect(result.name.value).toBe("Kopi Susu Tetangga");
      expect(result.name.confidence).toBe(0.85);

      expect(result.amount.value).toBe(18500);
      expect(result.amount.confidence).toBeGreaterThanOrEqual(0.8);

      expect(result.expense_date.value).toBe("2026-10-08");
      expect(result.category_suggestion.value).toBe("food");
      expect(result.extraction_confidence).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe("Example 3: Subtotal and discount lines are ignored for total", () => {
    const textWithDiscount = `
CAFE SENJA
TANGGAL 01/10/2026
KOPI LATTE 30.000
SUBTOTAL 30.000
TOTAL DISKON 10.000
TOTAL BAYAR 20.000
TUNAI 50.000
KEMBALIAN 30.000
    `.trim();

    it("extracts 20000 instead of subtotal or discount", () => {
      const result = parseReceiptText(textWithDiscount);
      expect(result.amount.value).toBe(20000);
      expect(result.name.value).toBe("Cafe Senja");
      expect(result.category_suggestion.value).toBe("food");
    });
  });

  describe("Category Suggestion Enhancements", () => {
    it("suggests 'transfer' for bank transfer screenshot", () => {
      const rawTransfer = `
m-Transfer:
BERHASIL
13/09/2026 23:15:05
Ke 0660803173
JOHN DOE
Rp 27.500,00
      `.trim();
      const result = parseReceiptText(rawTransfer);
      expect(result.category_suggestion.value).toBe("transfer");
      expect(result.doc_type).toBe("bank_transfer");
    });

    it("suggests 'transfer' for ewallet kirim uang transfer", () => {
      const rawEwalletTrf = `
Rp50.000
Ditransfer ke Jane Doe
BCA 5771741844
Tanggal 13 Sep 2026
Total Rp50.000
      `.trim();
      const result = parseReceiptText(rawEwalletTrf);
      expect(result.category_suggestion.value).toBe("transfer");
    });

    it("suggests 'transport' for ride-hailing / bbm", () => {
      const rawOjol = `
GOJEK
GORIDE
10/10/2026
TOTAL RP 15.000
      `.trim();
      const result = parseReceiptText(rawOjol);
      expect(result.category_suggestion.value).toBe("transport");
    });

    it("suggests 'bills' for token listrik PLN without confusing with transfer", () => {
      const rawPln = `
STRUK PEMBELIAN LISTRIK PRABAYAR
PLN PREPAID
TOTAL BAYAR RP. 102.500
TANGGAL 02/10/2026
      `.trim();
      const result = parseReceiptText(rawPln);
      expect(result.category_suggestion.value).toBe("bills");
    });
  });

  describe("Validation: Non-receipt and Non-payment Documents", () => {
    it("identifies KTP (Identity Card) as disqualified non-expense document", () => {
      const rawKtp = `
PROVINSI DKI JAKARTA
JAKARTA TIMUR
NIK : 3175020101900001
NAMA : BUDI SANTOSO
TEMPAT/TGL LAHIR : JAKARTA, 01-01-1990
GOL. DARAH : O
ALAMAT : JL. MAWAR NO. 12
RT/RW : 001/002
AGAMA : ISLAM
STATUS PERKAWINAN: KAWIN
PEKERJAAN : KARYAWAN SWASTA
      `.trim();

      const lines = normalizeOcrText(rawKtp);
      expect(isDisqualifiedDocument(lines)).toBe(true);

      const parsed = parseReceiptText(rawKtp);
      expect(parsed.doc_type).toBe("unknown");
      expect(parsed.amount.value).toBe(null);
      expect(isExpenseDocument(lines, parsed.doc_type, parsed)).toBe(false);
    });

    it("identifies SIM (Driving License) as disqualified non-expense document", () => {
      const rawSim = `
KEPOLISIAN NEGARA REPUBLIK INDONESIA
SURAT IZIN MENGEMUDI
DRIVING LICENSE
SIM A
1234-5678-901234
NAMA : JANE DOE
ALAMAT : JL. SUDIRMAN NO. 45
BERLAKU S/D : 01-01-2028
      `.trim();

      const lines = normalizeOcrText(rawSim);
      expect(isDisqualifiedDocument(lines)).toBe(true);

      const parsed = parseReceiptText(rawSim);
      expect(isExpenseDocument(lines, parsed.doc_type, parsed)).toBe(false);
    });

    it("identifies academic diploma / certificates as non-expense document", () => {
      const rawIjazah = `
KEMENTERIAN PENDIDIKAN DAN KEBUDAYAAN
IJAZAH
SEKOLAH MENENGAH ATAS
DIBERIKAN KEPADA: AHMAD FAUZI
NOMOR IJAZAH: DN-01/M-SMA/20/0012345
      `.trim();

      const lines = normalizeOcrText(rawIjazah);
      expect(isDisqualifiedDocument(lines)).toBe(true);

      const parsed = parseReceiptText(rawIjazah);
      expect(isExpenseDocument(lines, parsed.doc_type, parsed)).toBe(false);
    });

    it("rejects arbitrary textbook / article without financial context", () => {
      const rawArticle = `
BAB 1: PENDAHULUAN
Latar Belakang Penelitian
Pada tahun 2024, populasi dunia diperkirakan mencapai 8.000.000.000 jiwa.
Berdasarkan sensus terbaru, total 1.500 peserta mengikuti kegiatan ilmiah di kampus.
      `.trim();

      const lines = normalizeOcrText(rawArticle);
      expect(isDisqualifiedDocument(lines)).toBe(false);

      const parsed = parseReceiptText(rawArticle);
      expect(parsed.doc_type).toBe("unknown");
      expect(isExpenseDocument(lines, parsed.doc_type, parsed)).toBe(false);
    });

    it("does not treat numbers followed by units (orang, peserta, halaman) as money tokens", () => {
      const line = "Total 500 orang hadir dalam 100 halaman dokumen";
      const tokens = findMoneyTokens(line);
      expect(tokens).toEqual([]);
    });

    it("rejects casual chat screenshot as non-expense", () => {
      const rawChat = `
Halo bro lagi dimana?
Nanti malam kita kumpul jam 7 di kafe biasa ya.
Jangan lupa kabari kalau sudah jalan.
      `.trim();

      const lines = normalizeOcrText(rawChat);
      const parsed = parseReceiptText(rawChat);
      expect(parsed.doc_type).toBe("unknown");
      expect(parsed.amount.value).toBe(null);
      expect(isExpenseDocument(lines, parsed.doc_type, parsed)).toBe(false);
    });

    it("approves genuine retail receipt as expense document", () => {
      const rawReceipt = `
INDOMARET
JL. SUDIRMAN KASIR 01
AQUA 600ML 4.000
TOTAL 4.000
TUNAI 10.000
KEMBALI 6.000
      `.trim();

      const lines = normalizeOcrText(rawReceipt);
      const parsed = parseReceiptText(rawReceipt);
      expect(parsed.doc_type).toBe("receipt");
      expect(parsed.amount.value).toBe(4000);
      expect(isExpenseDocument(lines, parsed.doc_type, parsed)).toBe(true);
    });

    it("approves genuine ewallet screenshot as expense document", () => {
      const rawEwallet = `
Pembayaran Berhasil
Rp 25.000
Ke Warung Makan
Waktu 09 Okt 2026
      `.trim();

      const lines = normalizeOcrText(rawEwallet);
      const parsed = parseReceiptText(rawEwallet);
      expect(parsed.doc_type).toBe("ewallet");
      expect(parsed.amount.value).toBe(25000);
      expect(isExpenseDocument(lines, parsed.doc_type, parsed)).toBe(true);
    });
  });
});
