const AccessRequest = require("../models/AccessRequest");
const MedicalRecord = require("../models/MedicalRecord");
const AuditLog = require("../models/AuditLog");
const blockchainService = require("../services/blockchainService");

/**
 * 1. Doctor/Hospital submits an access request to a patient
 */
async function createAccessRequest(req, res) {
  try {
    const { patientWallet, recordIds, purpose } = req.body;
    const requesterWallet = req.user.walletAddress.toLowerCase();
    const cleanPatient = patientWallet.toLowerCase();

    if (!patientWallet || !recordIds || recordIds.length === 0) {
      return res.status(400).json({ message: "patientWallet and recordIds are required" });
    }

    const request = new AccessRequest({
      patientWallet: cleanPatient,
      requesterWallet,
      requesterName: req.user.name || "Practitioner",
      requesterRole: req.user.role,
      recordIds,
      purpose: purpose || "Medical assessment and treatment",
      status: "pending",
    });

    await request.save();

    await AuditLog.create({
      actorWallet: requesterWallet,
      patientWallet: cleanPatient,
      action: "REQUEST_ACCESS",
      details: `${req.user.name || requesterWallet} requested access to records: ${recordIds.join(", ")}`,
    });

    return res.status(201).json({ message: "Access request submitted", request });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * 2. Get incoming access requests for patient
 */
async function getPatientRequests(req, res) {
  try {
    const patientWallet = req.user.walletAddress.toLowerCase();
    const requests = await AccessRequest.find({ patientWallet }).sort({ requestDate: -1 });
    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * 3. Get outgoing access requests sent by doctor/hospital
 */
async function getRequesterRequests(req, res) {
  try {
    const requesterWallet = req.user.walletAddress.toLowerCase();
    const requests = await AccessRequest.find({ requesterWallet }).sort({ requestDate: -1 });
    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * 4. Update request status (e.g. Approved with tx hash or Rejected)
 */
async function updateRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, transactionHash } = req.body;
    const patientWallet = req.user.walletAddress.toLowerCase();

    const request = await AccessRequest.findOne({ _id: id, patientWallet });
    if (!request) {
      return res.status(404).json({ message: "Request not found or unauthorized" });
    }

    request.status = status;
    request.responseDate = new Date();
    if (transactionHash) request.transactionHash = transactionHash;
    await request.save();

    await AuditLog.create({
      actorWallet: patientWallet,
      patientWallet,
      action: status === "approved" ? "GRANT_ACCESS" : "REVOKE_ACCESS",
      transactionHash: transactionHash || "",
      details: `Access request ${id} ${status} by patient`,
    });

    return res.json({ message: `Access request ${status}`, request });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * 5. Verify live blockchain permission for specific record
 */
async function verifyPermission(req, res) {
  try {
    const { patientWallet, requesterWallet, recordId } = req.query;
    if (!patientWallet || !requesterWallet || !recordId) {
      return res.status(400).json({ message: "Missing required query parameters" });
    }

    const hasAccess = await blockchainService.verifyRecordAccess(
      patientWallet.toLowerCase(),
      requesterWallet.toLowerCase(),
      recordId
    );

    return res.json({ hasAccess });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createAccessRequest,
  getPatientRequests,
  getRequesterRequests,
  updateRequestStatus,
  verifyPermission,
};
