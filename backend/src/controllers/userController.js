const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const AuditLog = require("../models/AuditLog");
const blockchainService = require("../services/blockchainService");
const syncService = require("../services/syncService");

/**
 * Register or update user profile
 */
async function registerUser(req, res) {
  try {
    const { walletAddress, name, fullName, email, phone, role, specialization, hospitalName, licenseNumber } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ message: "walletAddress is required" });
    }
    const cleanWallet = walletAddress.toLowerCase();
    const displayName = fullName || name || "User " + cleanWallet.slice(0, 6);

    let user = await User.findOne({ walletAddress: cleanWallet });
    if (!user) {
      user = new User({
        walletAddress: cleanWallet,
        fullName: displayName,
        name: displayName,
        email: email || "",
        phone: phone || "",
        role: role || "patient",
        specialization: specialization || "",
        hospitalName: hospitalName || "",
        licenseNumber: licenseNumber || "",
        isVerified: true,
      });
    } else {
      user.fullName = displayName || user.fullName;
      user.name = displayName || user.name;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (role) user.role = role;
      if (specialization) user.specialization = specialization;
      if (hospitalName) user.hospitalName = hospitalName;
      if (licenseNumber) user.licenseNumber = licenseNumber;
    }

    // Check on-chain status
    const onChain = await blockchainService.getOnChainUser(cleanWallet);
    if (onChain && onChain.role !== "none") {
      user.role = onChain.role;
      user.isVerifiedOnChain = true;
      user.isVerified = true;
    }

    await user.save();

    // Create role-specific record if needed
    if (user.role === "patient") {
      await Patient.findOneAndUpdate(
        { walletAddress: cleanWallet },
        {
          fullName: displayName,
          walletAddress: cleanWallet,
          userRef: user._id,
        },
        { upsert: true, new: true }
      );
    } else if (user.role === "doctor") {
      await Doctor.findOneAndUpdate(
        { walletAddress: cleanWallet },
        {
          fullName: displayName,
          walletAddress: cleanWallet,
          specialization: specialization || user.specialization || "General Medicine",
          medicalLicenseNumber: licenseNumber || user.licenseNumber || "MED-" + cleanWallet.slice(2, 8).toUpperCase(),
          hospitalName: hospitalName || user.hospitalName || "Apollo Multi-Specialty Hospital",
          verificationStatus: "verified",
          userRef: user._id,
        },
        { upsert: true, new: true }
      );
    } else if (user.role === "hospital") {
      await Hospital.findOneAndUpdate(
        { walletAddress: cleanWallet },
        {
          hospitalName: displayName,
          walletAddress: cleanWallet,
          verificationStatus: "verified",
          userRef: user._id,
        },
        { upsert: true, new: true }
      );
    }

    await AuditLog.create({
      actorWallet: cleanWallet,
      action: "REGISTER",
      details: `Profile registered/updated for ${user.fullName} (${user.role})`,
    });

    return res.status(200).json({ message: "User registered successfully", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * List registered doctors (both DB and on-chain verified)
 */
async function getDoctors(req, res) {
  try {
    const doctors = await Doctor.find().lean();
    if (doctors.length > 0) {
      return res.json({ doctors });
    }
    const userDoctors = await User.find({ role: "doctor" }).select("-nonce").lean();
    return res.json({ doctors: userDoctors });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * List registered hospitals
 */
async function getHospitals(req, res) {
  try {
    const hospitals = await Hospital.find().lean();
    if (hospitals.length > 0) {
      return res.json({ hospitals });
    }
    const userHospitals = await User.find({ role: "hospital" }).select("-nonce").lean();
    return res.json({ hospitals: userHospitals });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * List all users combining blockchain and MongoDB (Admin and Directory view)
 */
async function getAllUsers(req, res) {
  try {
    const data = await syncService.getCombinedUsers();
    return res.json(data);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    // Even if an unexpected error occurs, fall back to whatever MongoDB has
    try {
      const fallbackUsers = await User.find().select("-nonce").lean();
      return res.status(200).json({
        success: true,
        blockchainConnected: false,
        counts: {
          total: fallbackUsers.length,
          patients: fallbackUsers.filter((u) => u.role === "patient").length,
          doctors: fallbackUsers.filter((u) => u.role === "doctor").length,
          hospitals: fallbackUsers.filter((u) => u.role === "hospital").length,
          admins: fallbackUsers.filter((u) => u.role === "admin").length,
          verified: fallbackUsers.length,
        },
        users: fallbackUsers,
        message: "Fallback from local database due to sync error: " + error.message,
      });
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve user directory: " + error.message,
        users: [],
      });
    }
  }
}

/**
 * Get single user profile
 */
async function getUserProfile(req, res) {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const user = await User.findOne({ walletAddress }).select("-nonce").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    let profile = null;
    if (user.role === "patient") {
      profile = await Patient.findOne({ walletAddress }).lean();
    } else if (user.role === "doctor") {
      profile = await Doctor.findOne({ walletAddress }).lean();
    } else if (user.role === "hospital") {
      profile = await Hospital.findOne({ walletAddress }).lean();
    }

    const onChain = await blockchainService.getOnChainUser(walletAddress);
    return res.json({
      user,
      profile,
      onChainStatus: onChain,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  registerUser,
  getDoctors,
  getHospitals,
  getAllUsers,
  getUserProfile,
};
