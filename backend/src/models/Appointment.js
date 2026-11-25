const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => "APT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
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
      default: null,
    },
    appointmentDate: {
      type: String,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: "General Consultation",
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled", "rescheduled"],
      default: "scheduled",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.pre("save", function (next) {
  if (this.patientWallet) this.patientWallet = this.patientWallet.toLowerCase();
  if (this.doctorWallet) this.doctorWallet = this.doctorWallet.toLowerCase();
  if (this.hospitalWallet) this.hospitalWallet = this.hospitalWallet.toLowerCase();
  next();
});

module.exports = mongoose.model("Appointment", appointmentSchema);
