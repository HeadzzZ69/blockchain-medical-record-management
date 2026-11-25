const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    medicalLicenseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      default: "MBBS, MD",
    },
    experience: {
      type: String,
      default: "5+ Years",
    },
    hospitalName: {
      type: String,
      default: "",
      index: true,
    },
    email: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    verificationStatus: {
      type: String,
      enum: ["verified", "pending", "rejected"],
      default: "verified",
      index: true,
    },
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
