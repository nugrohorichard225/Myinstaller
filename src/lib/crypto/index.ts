import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Get encryption key from environment.
 * In production, use a proper key management service.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error("ENCRYPTION_KEY must be set and at least 32 characters");
  }
  // Derive a proper 32-byte key using SHA-256
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a plaintext string.
 * Returns a base64 string: IV + AuthTag + Ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  // Combine IV + AuthTag + Ciphertext
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]);

  return combined.toString("base64");
}

/**
 * Decrypt a previously encrypted string.
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encrypted, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Generate a masked preview of a credential (e.g., "ssh-r****ey")
 */
export function maskCredential(value: string, type: "password" | "key"): string {
  if (type === "password") {
    if (value.length <= 4) return "****";
    return value.slice(0, 2) + "****" + value.slice(-2);
  }
  // For SSH keys, show the type prefix
  const parts = value.split(" ");
  if (parts.length >= 2) {
    return parts[0] + " ****" + (parts[1].slice(-8) || "");
  }
  return "****" + value.slice(-8);
}

/**
 * Generate a random access key code.
 */
export function generateAccessKeyCode(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString("hex").toUpperCase());
  }
  return segments.join("-");
}

/**
 * Generate a secure random token.
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Compute SHA-256 checksum of content.
 */
export function computeChecksum(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// TODO: In production, integrate with a proper secrets manager (e.g., HashiCorp Vault, AWS KMS)
// The current implementation uses AES-256-GCM with a static key from environment variables.
// This is adequate for development and small self-hosted deployments but should be hardened
// for high-security environments.
