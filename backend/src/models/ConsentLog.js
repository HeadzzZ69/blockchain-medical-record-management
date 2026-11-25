const mongoose = require("mongoose");

const consentLogSchema = new mongoose.Schema(
  {
    patientWallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    authorizedWallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    recordId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    permissions: {
      type: [String],
      default: ["view", "download"],
    },
    grantedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    transactionHash: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ConsentLog", consentLogSchema);
