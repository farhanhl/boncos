import { describe, it, expect, beforeAll } from "vitest";
import { encryptText, decryptText } from "@/lib/crypto";

describe("Crypto Module (AES-256-GCM)", () => {
  beforeAll(() => {
    // 32 bytes base64 test key
    process.env.TELEGRAM_ENCRYPTION_KEY = "bFm3KkmvjU4sv2EEnFxPSw51Jdp53Cp4lTukOGKlAWQ=";
  });

  it("successfully encrypts and decrypts a telegram bot token", () => {
    const rawToken = "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_12345678";
    const encrypted = encryptText(rawToken);

    expect(encrypted).not.toBe(rawToken);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(rawToken);
  });

  it("produces distinct ciphertexts for identical plaintext due to random IV", () => {
    const secret = "test-token-value";
    const enc1 = encryptText(secret);
    const enc2 = encryptText(secret);

    expect(enc1).not.toBe(enc2);
    expect(decryptText(enc1)).toBe(secret);
    expect(decryptText(enc2)).toBe(secret);
  });

  it("throws an error when decrypting tampered payload", () => {
    const rawToken = "secret-token";
    const encrypted = encryptText(rawToken);
    const parts = encrypted.split(":");
    // Tamper with the ciphertext
    const tampered = `${parts[0]}:${parts[1]}:dGFtcGVyZWQ=`;

    expect(() => decryptText(tampered)).toThrow();
  });
});
