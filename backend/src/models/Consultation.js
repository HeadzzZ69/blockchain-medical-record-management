const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
  {
    consultationId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => "CON-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
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
    hospitalWallet: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    patientName: {
      type: String,
      default: "",
    },
    doctorName: {
      type: String,
      default: "",
    },
    hospitalName: {
      type: String,
      default: "",
    },
    consultationDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    symptoms: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },
    diagnosis: {
      type: String,
      required: true,
      default: "Clinical Assessment",
    },
    clinicalNotes: {
      type: String,
      default: "",
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["completed", "in-progress", "scheduled"],
      default: "completed",
    },
  },
  { timestamps: true }
);

consultationSchema.pre("validate", function (next) {
  if (this.patientWallet) this.patientWallet = this.patientWallet.toLowerCase();
  if (this.doctorWallet) this.doctorWallet = this.doctorWallet.toLowerCase();
  if (this.hospitalWallet) this.hospitalWallet = this.hospitalWallet.toLowerCase();
  next();
});

module.exports = mongoose.model("Consultation", consultationSchema);
