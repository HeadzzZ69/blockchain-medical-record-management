const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: () => `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      index: true,
    },
    patientWallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    doctorWallet: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
      index: true,
    },
    hospitalWallet: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
      index: true,
    },
    requesterWallet: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    requesterName: {
      type: String,
      default: "",
    },
    requesterRole: {
      type: String,
      enum: ["doctor", "hospital"],
      default: "doctor",
    },
    recordId: {
      type: String,
      default: "",
      index: true,
    },
    recordIds: [
      {
        type: String,
      },
    ],
    requestedPermissions: {
      type: [String],
      enum: ["view", "download", "consultation"],
      default: ["view", "download"],
    },
    purpose: {
      type: String,
      default: "Consultation and Treatment",
    },
    requestDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    expiryDate: {
      type: Date,
    },
    responseDate: {
      type: Date,
    },
    transactionHash: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Backward compatibility hooks
accessRequestSchema.pre("save", function (next) {
  if (this.approvalStatus && !this.status) this.status = this.approvalStatus;
  if (this.status && !this.approvalStatus) this.approvalStatus = this.status;

  if (this.requesterWallet) {
    if (this.requesterRole === "doctor" && !this.doctorWallet) {
      this.doctorWallet = this.requesterWallet;
    } else if (this.requesterRole === "hospital" && !this.hospitalWallet) {
      this.hospitalWallet = this.requesterWallet;
    }
  } else {
    this.requesterWallet = this.doctorWallet || this.hospitalWallet || "";
  }

  if (this.recordId && (!this.recordIds || this.recordIds.length === 0)) {
    this.recordIds = [this.recordId];
  } else if (this.recordIds && this.recordIds.length > 0 && !this.recordId) {
    this.recordId = this.recordIds[0];
  }

  next();
});

module.exports = mongoose.model("AccessRequest", accessRequestSchema);
