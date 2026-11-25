const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "hospital", "admin"],
      required: true,
      index: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    accountStatus: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerifiedOnChain: {
      type: Boolean,
      default: false,
    },
    specialization: {
      type: String,
      default: "",
    },
    hospitalName: {
      type: String,
      default: "",
    },
    licenseNumber: {
      type: String,
      default: "",
    },
    nonce: {
      type: String,
      default: () => Math.floor(Math.random() * 1000000).toString(),
    },
  },
  { timestamps: true }
);

// Pre-save hook to ensure fullName and name are always in sync
userSchema.pre("save", function (next) {
  if (this.fullName && !this.name) {
    this.name = this.fullName;
  } else if (this.name && !this.fullName) {
    this.fullName = this.name;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
