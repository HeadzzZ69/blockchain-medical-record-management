const express = require("express");
const router = express.Router();
const accessController = require("../controllers/accessController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Doctor/Hospital requests access
router.post("/", verifyToken, requireRole(["doctor", "hospital"]), accessController.createAccessRequest);

// Patient views incoming requests
router.get("/patient", verifyToken, requireRole(["patient"]), accessController.getPatientRequests);

// Requester views their sent requests
router.get("/requester", verifyToken, requireRole(["doctor", "hospital"]), accessController.getRequesterRequests);

// Patient approves or rejects request
router.patch("/:id", verifyToken, requireRole(["patient"]), accessController.updateRequestStatus);

// Live blockchain permission query
router.get("/verify-permission", accessController.verifyPermission);

module.exports = router;
