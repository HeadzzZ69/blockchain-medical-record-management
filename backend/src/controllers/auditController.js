const AuditLog = require("../models/AuditLog");
const blockchainService = require("../services/blockchainService");

/**
 * Get audit logs:
 * Fetches tamper-proof on-chain Solidity events from smart contract
 * merged with application event metadata.
 */
async function getAuditLogs(req, res) {
  try {
    const [blockchainEvents, dbLogs] = await Promise.all([
      blockchainService.getAuditEvents(),
      AuditLog.find().sort({ timestamp: -1 }).limit(100),
    ]);

    return res.json({
      blockchainEvents,
      databaseLogs: dbLogs,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getAuditLogs,
};
