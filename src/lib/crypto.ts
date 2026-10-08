import "server-only";
import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM

function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.TELEGRAM_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error("TELEGRAM_ENCRYPTION_KEY is not defined in environment variables");
  }
  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== 32) {
    throw new Error("TELEGRAM_ENCRYPTION_KEY must be a 32-byte base64 string");
  }
  return key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: "iv:authTag:ciphertext" (all base64)
 */
export function encryptText(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypts an AES-256-GCM formatted string "iv:authTag:ciphertext".
 */
export function decryptText(encryptedPayload: string): string {
  const key = getEncryptionKey();
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }

  const [ivStr, tagStr, cipherStr] = parts;
  if (!ivStr || !tagStr || !cipherStr) {
    throw new Error("Corrupted encrypted payload");
  }

  const iv = Buffer.from(ivStr, "base64");
  const tag = Buffer.from(tagStr, "base64");
  const ciphertext = Buffer.from(cipherStr, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
