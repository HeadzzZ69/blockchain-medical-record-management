const crypto = require("crypto");

/**
 * AES-256-GCM encryption/decryption utilities for off-chain file storage.
 * In AES-GCM:
 * - Ciphertext provides confidentiality.
 * - Authentication Tag provides integrity & authenticity.
 * - Initialization Vector (IV) is unique per encryption.
 */

// 32-byte key
function getEncryptionKey() {
  const keyHex = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a buffer using AES-256-GCM
 * @param {Buffer} buffer 
 * @returns {{ encrypted: Buffer, iv: string, authTag: string }}
 */
function encryptBuffer(buffer) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16); // 16 bytes IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

/**
 * Decrypt a buffer using AES-256-GCM
 * @param {Buffer} encryptedBuffer 
 * @param {string} ivHex 
 * @param {string} authTagHex 
 * @returns {Buffer}
 */
function decryptBuffer(encryptedBuffer, ivHex, authTagHex) {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted;
}

/**
 * Calculate SHA-256 hash of a buffer
 * @param {Buffer} buffer 
 * @returns {string} 0x prefixed hex string for easy blockchain comparison
 */
function calculateSHA256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

module.exports = {
  encryptBuffer,
  decryptBuffer,
  calculateSHA256,
};
