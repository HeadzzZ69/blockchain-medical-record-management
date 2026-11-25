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
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
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
      required: true,
    },
    encryptedFileName: {
      type: String,
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
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

// Backward compatibility hooks between recordTitle/fileName and recordType/category
medicalRecordSchema.pre("save", function (next) {
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
  next();
});

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
