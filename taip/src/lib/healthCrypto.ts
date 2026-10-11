import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Terviseandmete krüpteerimine (AES-256-GCM) rakenduse tasemel.
 * Võti: TAIP_HEALTH_KEY (base64, 32 baiti). Arenduses tuletatakse fikseeritud võti.
 */
function key(): Buffer {
  const raw = process.env.TAIP_HEALTH_KEY;
  if (raw) {
    const k = Buffer.from(raw, "base64");
    if (k.length !== 32) throw new Error("TAIP_HEALTH_KEY peab olema 32 baiti (base64)");
    return k;
  }
  if (process.env.NODE_ENV === "production") throw new Error("TAIP_HEALTH_KEY puudub");
  return createHash("sha256").update("taip-dev-only-health-key").digest();
}

export function encryptHealth(data: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptHealth<T = unknown>(payload: string): T {
  const buf = Buffer.from(payload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8")) as T;
}
