const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    patientWallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    uploaderWallet: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
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
    recordTitle: {
      type: String,
      trim: true,
      default: function () {
        return this.fileName || "Medical Record";
      },
    },
    fileName: {
      type: String,
      trim: true,
      default: "medical_document.pdf",
    },
    recordType: {
      type: String,
      default: "General Record",
      index: true,
    },
    category: {
      type: String,
      default: "General Record",
    },
    description: {
      type: String,
      default: "",
    },
    encryptedFileReference: {
      type: String,
      default: function () {
        return this.encryptedFileName || `${this.recordId}.enc`;
      },
    },
    encryptedFileName: {
      type: String,
      default: function () {
        return this.encryptedFileReference || `${this.recordId}.enc`;
      },
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
    encryptionIv: {
      type: String,
      default: function () {
        return this.iv;
      },
    },
    encryptionTag: {
      type: String,
      default: function () {
        return this.authTag;
      },
    },
    fileHash: {
      type: String,
      required: true,
      index: true,
    },
    fileType: {
      type: String,
      default: "application/octet-stream",
    },
    mimeType: {
      type: String,
      default: function () {
        return this.fileType || "application/octet-stream";
      },
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    accessStatus: {
      type: String,
      enum: ["active", "archived", "revoked"],
      default: "active",
      index: true,
    },
    transactionHash: {
      type: String,
      default: "",
    },
    isOnChainRegistered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Pre-validation compatibility hooks
medicalRecordSchema.pre("validate", function (next) {
  if (this.patientWallet) this.patientWallet = this.patientWallet.toLowerCase();
  if (this.doctorWallet) this.doctorWallet = this.doctorWallet.toLowerCase();
  if (this.hospitalWallet) this.hospitalWallet = this.hospitalWallet.toLowerCase();
  if (this.uploaderWallet) this.uploaderWallet = this.uploaderWallet.toLowerCase();
  if (!this.uploaderWallet && this.patientWallet) this.uploaderWallet = this.patientWallet;

  if (this.recordTitle && !this.fileName) this.fileName = this.recordTitle;
  if (this.fileName && !this.recordTitle) this.recordTitle = this.fileName;

  if (this.recordType && !this.category) this.category = this.recordType;
  if (this.category && !this.recordType) this.recordType = this.category;

  if (this.encryptedFileReference && !this.encryptedFileName) {
    this.encryptedFileName = this.encryptedFileReference;
  }
  if (this.encryptedFileName && !this.encryptedFileReference) {
    this.encryptedFileReference = this.encryptedFileName;
  }

  if (this.iv && !this.encryptionIv) this.encryptionIv = this.iv;
  if (this.encryptionIv && !this.iv) this.iv = this.encryptionIv;

  if (this.authTag && !this.encryptionTag) this.encryptionTag = this.authTag;
  if (this.encryptionTag && !this.authTag) this.authTag = this.encryptionTag;

  if (this.fileType && !this.mimeType) this.mimeType = this.fileType;
  if (this.mimeType && !this.fileType) this.fileType = this.mimeType;

  next();
});

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
