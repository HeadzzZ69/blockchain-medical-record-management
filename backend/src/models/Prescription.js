const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => "RX-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
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
      required: true,
      lowercase: true,
      trim: true,
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
    hospitalWallet: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, default: "" },
        frequency: { type: String, default: "Once daily" },
        duration: { type: String, default: "7 days" },
        instructions: { type: String, default: "Take after meals" },
      },
    ],
    issueDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiryDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    status: {
      type: String,
      enum: ["active", "completed", "discontinued"],
      default: "active",
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

prescriptionSchema.pre("validate", function (next) {
  if (this.patientWallet) this.patientWallet = this.patientWallet.toLowerCase();
  if (this.doctorWallet) this.doctorWallet = this.doctorWallet.toLowerCase();
  if (this.hospitalWallet) this.hospitalWallet = this.hospitalWallet.toLowerCase();
  next();
});

module.exports = mongoose.model("Prescription", prescriptionSchema);
