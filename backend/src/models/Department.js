const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    departmentId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => "DEPT-" + Date.now().toString(36).toUpperCase(),
    },
    hospitalWallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    departmentName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    headDoctorWallet: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    doctors: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.pre("save", function (next) {
  if (this.hospitalWallet) this.hospitalWallet = this.hospitalWallet.toLowerCase();
  if (this.headDoctorWallet) this.headDoctorWallet = this.headDoctorWallet.toLowerCase();
  if (this.doctors && this.doctors.length > 0) {
    this.doctors = this.doctors.map((d) => (typeof d === "string" ? d.toLowerCase() : d));
  }
  next();
});

module.exports = mongoose.model("Department", departmentSchema);
