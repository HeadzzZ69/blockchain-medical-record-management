const mongoose = require("mongoose");

const labReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => "LAB-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
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
    doctorName: {
      type: String,
      default: "",
    },
    hospitalName: {
      type: String,
      default: "",
    },
    testName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["Blood Test", "Radiology", "Pathology", "Biochemistry", "Microbiology", "Cardiology", "General"],
      default: "General",
      index: true,
    },
    testDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    results: [
      {
        parameter: { type: String, required: true },
        value: { type: String, required: true },
        unit: { type: String, default: "" },
        referenceRange: { type: String, default: "" },
        status: { type: String, enum: ["normal", "high", "low", "abnormal"], default: "normal" },
      },
    ],
    summary: {
      type: String,
      default: "Normal clinical findings within reference limits.",
    },
    status: {
      type: String,
      enum: ["completed", "pending", "reviewed"],
      default: "completed",
    },
    fileHash: {
      type: String,
      default: "",
    },
    recordRef: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

labReportSchema.pre("validate", function (next) {
  if (this.patientWallet) this.patientWallet = this.patientWallet.toLowerCase();
  if (this.doctorWallet) this.doctorWallet = this.doctorWallet.toLowerCase();
  if (this.hospitalWallet) this.hospitalWallet = this.hospitalWallet.toLowerCase();
  next();
});

module.exports = mongoose.model("LabReport", labReportSchema);
