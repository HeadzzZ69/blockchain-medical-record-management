const fs = require("fs");
const path = require("path");
const MedicalRecord = require("../models/MedicalRecord");
const AuditLog = require("../models/AuditLog");
const AccessRequest = require("../models/AccessRequest");
const { encryptBuffer, decryptBuffer, calculateSHA256 } = require("../utils/crypto");
const blockchainService = require("../services/blockchainService");

const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * 1. Upload medical record (Patient only)
 * - Hashes file with SHA-256
 * - Encrypts with AES-256-GCM
 * - Stores encrypted blob locally
 * - Returns record metadata and SHA-256 hash so patient can register on blockchain
 */
async function uploadRecord(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded. Please select a PDF, JPG, or PNG report." });
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const category = req.body.category || req.body.recordType || "General Record";
    const description = req.body.description || "";
    const recordTitle = req.body.recordTitle || req.body.title || req.file.originalname;
    const patientWallet = req.user.walletAddress.toLowerCase();

    // 1. Calculate SHA-256 of original file buffer
    const fileHash = calculateSHA256(req.file.buffer);

    // 2. Encrypt buffer using AES-256-GCM
    const { encrypted, iv, authTag } = encryptBuffer(req.file.buffer);

    // 3. Save encrypted file to disk with unique name
    const recordId = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const encryptedFileName = `${recordId}.enc`;
    const encryptedFilePath = path.join(UPLOADS_DIR, encryptedFileName);
    fs.writeFileSync(encryptedFilePath, encrypted);

    // 4. Save metadata in MongoDB with complete cross-compatible field mapping
    const record = new MedicalRecord({
      recordId,
      patientWallet,
      uploaderWallet: patientWallet,
      recordTitle,
      fileName: req.file.originalname,
      recordType: category,
      category,
      description,
      encryptedFileName,
      encryptedFileReference: encryptedFileName,
      iv,
      encryptionIv: iv,
      authTag,
      encryptionTag: authTag,
      fileHash,
      fileType: req.file.mimetype,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadDate: new Date(),
      accessStatus: "active",
      isOnChainRegistered: false,
    });

    await record.save();

    console.log(`[UploadRecord] Record created successfully: ${recordId} for patient ${patientWallet}`);

    return res.status(201).json({
      message: "Record encrypted and stored off-chain successfully.",
      record: {
        recordId: record.recordId,
        recordTitle: record.recordTitle,
        fileName: record.fileName,
        fileType: record.fileType,
        mimeType: record.mimeType,
        fileSize: record.fileSize,
        fileHash: record.fileHash,
        category: record.category,
        description: record.description,
        uploadDate: record.uploadDate,
      },
    });
  } catch (error) {
    console.error("Error in uploadRecord:", error);
    return res.status(500).json({
      message: "Failed to upload and encrypt record",
      error: error.message,
    });
  }
}

/**
 * 2. Confirm record on-chain transaction
 */
async function confirmRecordOnChain(req, res) {
  try {
    const { recordId, transactionHash } = req.body;
    const patientWallet = req.user.walletAddress.toLowerCase();

    const record = await MedicalRecord.findOne({ recordId, patientWallet });
    if (!record) {
      return res.status(404).json({ message: "Record not found or not owned by caller" });
    }

    record.transactionHash = transactionHash;
    record.isOnChainRegistered = true;
    await record.save();

    await AuditLog.create({
      actorWallet: patientWallet,
      patientWallet,
      recordId,
      action: "UPLOAD",
      transactionHash,
      details: `Registered record ${recordId} (${record.fileName}) on blockchain`,
    });

    return res.json({ message: "Record blockchain confirmation saved", record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * 3. Retrieve patient records
 * - If caller is patient, returns their records
 * - If caller is doctor/hospital, returns authorized records for specified patient
 */
async function getPatientRecords(req, res) {
  try {
    const callerWallet = req.user.walletAddress.toLowerCase();
    const targetPatientWallet = (req.params.patientWallet || callerWallet).toLowerCase();

    const allPatientRecords = await MedicalRecord.find({ patientWallet: targetPatientWallet }).sort({ uploadDate: -1 });

    if (callerWallet === targetPatientWallet) {
      return res.json({ records: allPatientRecords });
    }

    // If caller is a doctor or hospital, verify access for each record
    const accessibleRecords = [];
    for (const record of allPatientRecords) {
      let hasAccess = false;
      try {
        hasAccess = await blockchainService.verifyRecordAccess(
          targetPatientWallet,
          callerWallet,
          record.recordId
        );
      } catch (err) {
        hasAccess = false;
      }

      if (!hasAccess) {
        const approvedReq = await AccessRequest.findOne({
          patientWallet: targetPatientWallet,
          $or: [{ requesterWallet: callerWallet }, { doctorWallet: callerWallet }, { hospitalWallet: callerWallet }],
          $or: [{ recordId: record.recordId }, { recordIds: record.recordId }],
          status: "approved",
          expiresAt: { $gt: new Date() },
        });
        if (approvedReq) hasAccess = true;
      }

      if (hasAccess) {
        accessibleRecords.push(record);
      }
    }

    return res.json({ records: accessibleRecords });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * 4. Download and Decrypt Medical Record
 * CRITICAL SECURITY REQUIREMENT:
 * - Verify requester against smart contract!
 * - If permission is valid, read encrypted file from disk, decrypt using AES-256-GCM, and stream to client.
 * - If permission revoked/expired/not granted: return 403 Forbidden!
 */
async function downloadRecord(req, res) {
  try {
    const { recordId } = req.params;
    const callerWallet = req.user.walletAddress.toLowerCase();

    const record = await MedicalRecord.findOne({ recordId });
    if (!record) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    const patientWallet = record.patientWallet.toLowerCase();

    // Check permission:
    // If caller is patient, they have direct ownership access
    let isAuthorized = callerWallet === patientWallet;

    if (!isAuthorized) {
      // Must verify on the blockchain smart contract!
      try {
        isAuthorized = await blockchainService.verifyRecordAccess(patientWallet, callerWallet, recordId);
      } catch (err) {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      const approvedReq = await AccessRequest.findOne({
        patientWallet,
        $or: [{ requesterWallet: callerWallet }, { doctorWallet: callerWallet }, { hospitalWallet: callerWallet }],
        $or: [{ recordId: record.recordId }, { recordIds: record.recordId }],
        status: "approved",
        expiresAt: { $gt: new Date() },
      });
      if (approvedReq) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message: "Access Denied: You do not possess valid, unexpired blockchain authorization for this record.",
      });
    }

    // Read encrypted file
    const targetFileName = record.encryptedFileName || record.encryptedFileReference || `${record.recordId}.enc`;
    const encryptedFilePath = path.join(UPLOADS_DIR, targetFileName);
    if (!fs.existsSync(encryptedFilePath)) {
      console.warn(`[DownloadRecord] Encrypted file not found on disk at: ${encryptedFilePath}`);
      return res.status(404).json({ message: "Encrypted file artifact not found on server storage" });
    }

    const encryptedData = fs.readFileSync(encryptedFilePath);

    // Decrypt AES-256-GCM
    const iv = record.iv || record.encryptionIv;
    const authTag = record.authTag || record.encryptionTag;
    const decryptedBuffer = decryptBuffer(encryptedData, iv, authTag);

    // Audit log
    await AuditLog.create({
      actorWallet: callerWallet,
      patientWallet,
      recordId,
      action: "ACCESS_RECORD",
      details: `${req.user.name || callerWallet} decrypted and accessed ${record.fileName || record.recordTitle}`,
    });

    // Send decrypted file
    res.setHeader("Content-Type", record.fileType || record.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${record.fileName || record.recordTitle || 'medical_document.pdf'}"`);
    return res.send(decryptedBuffer);
  } catch (error) {
    console.error("Error in downloadRecord:", error);
    return res.status(500).json({ message: "Decryption or download error", error: error.message });
  }
}

/**
 * 5. Delete record (Patient only)
 */
async function deleteRecord(req, res) {
  try {
    const { recordId } = req.params;
    const patientWallet = req.user.walletAddress.toLowerCase();

    const record = await MedicalRecord.findOne({ recordId, patientWallet });
    if (!record) {
      return res.status(404).json({ message: "Record not found or caller is not owner" });
    }

    const encryptedFilePath = path.join(UPLOADS_DIR, record.encryptedFileName);
    if (fs.existsSync(encryptedFilePath)) {
      fs.unlinkSync(encryptedFilePath);
    }

    await MedicalRecord.deleteOne({ recordId });
    return res.json({ message: "Record removed from off-chain storage" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  uploadRecord,
  confirmRecordOnChain,
  getPatientRecords,
  downloadRecord,
  deleteRecord,
};
