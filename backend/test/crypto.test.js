const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { encryptBuffer, decryptBuffer, calculateSHA256 } = require("../src/utils/crypto");

console.log("--------------------------------------------------");
console.log("Running Backend Cryptographic Security & Integration Tests...");

// Test 1: SHA-256 calculation
const sampleMedicalFileContent = Buffer.from(
  "PATIENT CONFIDENTIAL MEDICAL RECORD\nDiagnosis: Hypertension Grade 1\nPrescription: Lisinopril 10mg once daily\nDoctor: Dr. Sarah Jenkins\nDate: 2026-11-24",
  "utf8"
);
const hash = calculateSHA256(sampleMedicalFileContent);
console.log("1. Original Medical Document SHA-256:", hash);
assert.strictEqual(typeof hash, "string");
assert.strictEqual(hash.length, 64);
console.log("   [PASS] SHA-256 Hash is valid 64-character hex string.");

// Test 2: AES-256-GCM Encryption
const { encrypted, iv, authTag } = encryptBuffer(sampleMedicalFileContent);
console.log("2. Encrypted Document with AES-256-GCM:");
console.log("   Ciphertext bytes:", encrypted.length);
console.log("   IV (16 bytes hex):", iv);
console.log("   Auth Tag (16 bytes hex):", authTag);
assert.notDeepStrictEqual(encrypted, sampleMedicalFileContent);
console.log("   [PASS] Ciphertext is strictly different from plaintext.");

// Test 3: AES-256-GCM Decryption
const decrypted = decryptBuffer(encrypted, iv, authTag);
assert.strictEqual(decrypted.toString("utf8"), sampleMedicalFileContent.toString("utf8"));
console.log("3. [PASS] Decrypted content matches original plaintext perfectly.");

// Test 4: Tamper-resistance of AES-256-GCM
console.log("4. Testing Tamper Resistance (Ciphertext Modification Attack)...");
let tamperedEncrypted = Buffer.from(encrypted);
tamperedEncrypted[0] ^= 0xff; // Flip bits in ciphertext

assert.throws(
  () => {
    decryptBuffer(tamperedEncrypted, iv, authTag);
  },
  /Unsupported state or unable to authenticate data/,
  "Tampered ciphertext should fail authentication!"
);
console.log("   [PASS] Tampered ciphertext was detected and rejected by GCM auth tag!");

console.log("--------------------------------------------------");
console.log("All Backend Cryptography & Integrity Tests Passed!");
console.log("--------------------------------------------------");
