const assert = require("assert");
const fs = require("fs");
const path = require("path");
const http = require("http");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { connectDB } = require("../src/config/db");
const { seedComprehensiveDemoData } = require("../src/utils/seedData");
const { decryptBuffer, calculateSHA256 } = require("../src/utils/crypto");
const { MedicalRecord, User, AccessRequest } = require("../src/models");
const { JWT_SECRET } = require("../src/middleware/auth");

const express = require("express");
const cors = require("cors");
const recordRoutes = require("../src/routes/recordRoutes");

async function runUploadTests() {
  console.log("==================================================");
  console.log("RUNNING MEDICAL RECORD UPLOAD & ENCRYPTION VERIFICATION");
  console.log("==================================================");

  await connectDB();
  await seedComprehensiveDemoData(false);

  // Setup Express test app on ephemeral port
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api/records", recordRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = "http://127.0.0.1:5099/api/records";

  console.log("Test HTTP Server running on", baseUrl);

  try {
    // 1. Upload a simulated medical PDF report
    console.log("\n[TEST 1] Uploading a simulated medical document (multipart/form-data)...");
    const testPatientWallet = "0x90f79bf6eb2c4f870365e785982e1f101e93b906";
    const patientToken = jwt.sign({ walletAddress: testPatientWallet }, JWT_SECRET, { expiresIn: "1h" });

    const originalDocumentContent = "CONFIDENTIAL PATIENT CLINICAL DATA - EMR DEMO REPORT\nPatient: Robert Miller\nBP: 120/80\nECG: Normal sinus rhythm\nAuthorized by MedVault Network.";
    const originalBuffer = Buffer.from(originalDocumentContent, "utf8");
    const expectedHash = calculateSHA256(originalBuffer);

    const formData = new FormData();
    const fileBlob = new Blob([originalBuffer], { type: "application/pdf" });
    formData.append("file", fileBlob, "clinical_test_report.pdf");
    formData.append("recordTitle", "Clinical Test Report");
    formData.append("category", "Cardiology");
    formData.append("description", "Automated E2E upload test verification file.");

    const uploadRes = await fetch(`${baseUrl}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${patientToken}`,
      },
      body: formData,
    });

    assert.strictEqual(uploadRes.status, 201, `Upload should return HTTP 201 Created (Got ${uploadRes.status})`);
    const uploadData = await uploadRes.json();
    console.log("   [PASS] Upload HTTP 201 received. Record ID:", uploadData.record.recordId);
    assert.ok(uploadData.record.recordId.startsWith("REC-"), "Record ID should start with REC-");
    assert.strictEqual(uploadData.record.fileHash, expectedHash, "SHA-256 hash must match original file buffer");
    console.log("   [PASS] SHA-256 integrity hash matched:", uploadData.record.fileHash);

    // 2. Verify encrypted file on disk
    console.log("\n[TEST 2] Verifying AES-256-GCM ciphertext on disk in backend/uploads...");
    const uploadedRecordId = uploadData.record.recordId;
    const encFilePath = path.join(__dirname, "..", "uploads", `${uploadedRecordId}.enc`);
    assert.ok(fs.existsSync(encFilePath), `Encrypted file must exist at ${encFilePath}`);
    const ciphertext = fs.readFileSync(encFilePath);
    assert.notDeepStrictEqual(ciphertext, originalBuffer, "Disk file must be encrypted ciphertext, NOT plaintext!");
    console.log("   [PASS] Ciphertext file verified on server disk. Size:", ciphertext.length, "bytes.");

    // 3. Verify Decryption
    console.log("\n[TEST 3] Verifying cryptographic decryption against database IV and Auth Tag...");
    const recordDoc = await MedicalRecord.findOne({ recordId: uploadedRecordId });
    assert.ok(recordDoc, "MedicalRecord document must exist in MongoDB");
    const decryptedBuffer = decryptBuffer(ciphertext, recordDoc.iv, recordDoc.authTag);
    assert.strictEqual(decryptedBuffer.toString("utf8"), originalDocumentContent, "Decrypted text must match original input text");
    console.log("   [PASS] AES-256-GCM Decryption succeeded. Decrypted plaintext matches original content perfectly!");

    // 4. Verify Download as Owner Patient
    console.log("\n[TEST 4] Testing GET /api/records/download/:recordId as record owner...");
    const downloadRes = await fetch(`${baseUrl}/download/${uploadedRecordId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${patientToken}`,
      },
    });
    assert.strictEqual(downloadRes.status, 200, `Download should return 200 OK (Got ${downloadRes.status})`);
    const downloadedText = await downloadRes.text();
    assert.strictEqual(downloadedText, originalDocumentContent, "Downloaded content must be decrypted correctly");
    console.log("   [PASS] Owner download verified. HTTP 200 OK with decrypted stream.");

    // 5. Verify Unauthorized Download Rejection
    console.log("\n[TEST 5] Testing download rejection for unauthorized stranger wallet...");
    const unauthorizedWallet = "0x000000000000000000000000000000000000dead";
    // Create unauthorized user in DB so token verifies
    await User.findOneAndUpdate(
      { walletAddress: unauthorizedWallet },
      { walletAddress: unauthorizedWallet, fullName: "Unauthorized Person", role: "patient" },
      { upsert: true }
    );
    const unauthorizedToken = jwt.sign({ walletAddress: unauthorizedWallet }, JWT_SECRET, { expiresIn: "1h" });

    const unauthorizedRes = await fetch(`${baseUrl}/download/${uploadedRecordId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${unauthorizedToken}`,
      },
    });
    assert.strictEqual(unauthorizedRes.status, 403, `Unauthorized download should return 403 Forbidden (Got ${unauthorizedRes.status})`);
    console.log("   [PASS] Unauthorized access attempt blocked with HTTP 403 Forbidden!");

    console.log("\n==================================================");
    console.log("ALL MEDICAL RECORD UPLOAD & CRYPTO TESTS PASSED!");
    console.log("==================================================");
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
}

runUploadTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
