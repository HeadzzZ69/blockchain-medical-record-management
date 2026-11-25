const express = require("express");
const router = express.Router();
const recordController = require("../controllers/recordController");
const { verifyToken, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Upload encrypted file (Patient only)
router.post("/upload", verifyToken, requireRole(["patient"]), upload.single("file"), recordController.uploadRecord);

// Confirm on-chain registration transaction
router.post("/confirm", verifyToken, requireRole(["patient"]), recordController.confirmRecordOnChain);

// Get records (Patient gets their own, Doctor/Hospital gets authorized subset)
router.get("/patient/:patientWallet?", verifyToken, recordController.getPatientRecords);

// Download and decrypt record (checks smart contract permissions!)
router.get("/download/:recordId", verifyToken, recordController.downloadRecord);

// Delete record (Patient only)
router.delete("/:recordId", verifyToken, requireRole(["patient"]), recordController.deleteRecord);

module.exports = router;
