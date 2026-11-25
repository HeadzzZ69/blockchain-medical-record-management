const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    actorRole: {
      type: String,
      default: "user",
      index: true,
    },
    action: {
      type: String,
      enum: [
        "REGISTER",
        "UPLOAD",
        "GRANT_ACCESS",
        "REVOKE_ACCESS",
        "ACCESS_RECORD",
        "LOGIN",
        "REQUEST_ACCESS",
        "UPDATE_PROFILE",
        "VERIFICATION",
      ],
      required: true,
      index: true,
    },
    targetWallet: {
      type: String,
      lowercase: true,
      default: "",
      index: true,
    },
    patientWallet: {
      type: String,
      lowercase: true,
      default: "",
    },
    recordId: {
      type: String,
      default: "",
      index: true,
    },
    transactionHash: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
    },
    details: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Backward compatibility: targetWallet <-> patientWallet
auditLogSchema.pre("save", function (next) {
  if (this.patientWallet && !this.targetWallet) this.targetWallet = this.patientWallet;
  if (this.targetWallet && !this.patientWallet) this.patientWallet = this.targetWallet;
  next();
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
