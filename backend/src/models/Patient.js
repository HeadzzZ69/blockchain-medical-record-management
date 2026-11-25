const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: {
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
    dateOfBirth: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "Other",
    },
    bloodGroup: {
      type: String,
      default: "O+",
    },
    address: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    emergencyContact: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ name: "Emergency Services", phone: "+1 (555) 911-0199", relation: "Local Emergency" }),
    },
    allergies: {
      type: [String],
      default: [],
    },
    existingConditions: {
      type: [String],
      default: [],
    },
    medicalHistory: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

patientSchema.pre("validate", function (next) {
  if (this.walletAddress) this.walletAddress = this.walletAddress.toLowerCase();
  next();
});

module.exports = mongoose.model("Patient", patientSchema);
