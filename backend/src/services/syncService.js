const { User, Patient, Doctor, Hospital } = require("../models");
const blockchainService = require("./blockchainService");

class SyncService {
  /**
   * Synchronize on-chain registered users with MongoDB.
   * Ensures that every wallet registered in the smart contract has a MongoDB User
   * and role-specific record (Patient/Doctor/Hospital), without creating duplicates.
   */
  async syncOnChainUsers() {
    let blockchainConnected = true;
    let onChainUsers = [];

    try {
      onChainUsers = await blockchainService.getAllOnChainUsers();
    } catch (err) {
      console.warn("SyncService: Could not fetch users from blockchain:", err.message);
      blockchainConnected = false;
      return { success: false, blockchainConnected, error: err.message, syncedCount: 0 };
    }

    if (!onChainUsers || onChainUsers.length === 0) {
      return { success: true, blockchainConnected, syncedCount: 0, users: [] };
    }

    const synced = [];

    for (const ocUser of onChainUsers) {
      try {
        const cleanWallet = (ocUser.walletAddress || "").toLowerCase();
        if (!cleanWallet) continue;

        const role = (ocUser.role || "patient").toLowerCase();
        const displayName = ocUser.name || (role === "admin" ? "System Administrator" : "User " + cleanWallet.slice(0, 6));
        const regDate = ocUser.registeredAt ? new Date(ocUser.registeredAt * 1000) : new Date();

        // 1. Upsert User document
        let userDoc = await User.findOne({ walletAddress: cleanWallet });
        if (!userDoc) {
          userDoc = new User({
            walletAddress: cleanWallet,
            fullName: displayName,
            name: displayName,
            role: role,
            accountStatus: ocUser.isActive !== false ? "active" : "inactive",
            isVerified: true,
            isVerifiedOnChain: true,
            registrationDate: regDate,
            email: `${cleanWallet.slice(2, 8)}@medvault.network`,
          });
          await userDoc.save();
        } else {
          let updated = false;
          if (!userDoc.isVerifiedOnChain) {
            userDoc.isVerifiedOnChain = true;
            userDoc.isVerified = true;
            updated = true;
          }
          if (userDoc.role !== role) {
            userDoc.role = role;
            updated = true;
          }
          if (!userDoc.fullName && displayName) {
            userDoc.fullName = displayName;
            userDoc.name = displayName;
            updated = true;
          }
          if (updated) await userDoc.save();
        }

        // 2. Ensure role-specific collection record exists
        if (role === "patient") {
          let patientDoc = await Patient.findOne({ walletAddress: cleanWallet });
          if (!patientDoc) {
            patientDoc = new Patient({
              patientId: "PAT-" + cleanWallet.slice(2, 8).toUpperCase(),
              walletAddress: cleanWallet,
              fullName: displayName,
              userRef: userDoc._id,
              dateOfBirth: "1995-05-15",
              gender: "Other",
              bloodGroup: "O+",
              address: "Local Network Node",
              emergencyContact: "Emergency Services",
            });
            await patientDoc.save();
          }
        } else if (role === "doctor") {
          let doctorDoc = await Doctor.findOne({ walletAddress: cleanWallet });
          if (!doctorDoc) {
            doctorDoc = new Doctor({
              doctorId: "DOC-" + cleanWallet.slice(2, 8).toUpperCase(),
              walletAddress: cleanWallet,
              fullName: displayName,
              specialization: userDoc.specialization || "General Medicine",
              medicalLicenseNumber: userDoc.licenseNumber || "MED-" + cleanWallet.slice(2, 8).toUpperCase(),
              qualification: "MBBS, MD",
              experience: 8,
              hospitalName: userDoc.hospitalName || "Apollo Multi-Specialty Hospital",
              verificationStatus: "verified",
              userRef: userDoc._id,
            });
            await doctorDoc.save();
          }
        } else if (role === "hospital") {
          let hospitalDoc = await Hospital.findOne({ walletAddress: cleanWallet });
          if (!hospitalDoc) {
            hospitalDoc = new Hospital({
              hospitalId: "HOSP-" + cleanWallet.slice(2, 8).toUpperCase(),
              walletAddress: cleanWallet,
              hospitalName: displayName,
              registrationNumber: "REG-" + cleanWallet.slice(2, 8).toUpperCase(),
              address: "Healthcare Innovation Parkway",
              verificationStatus: "verified",
              userRef: userDoc._id,
            });
            await hospitalDoc.save();
          }
        }

        synced.push({
          walletAddress: cleanWallet,
          name: displayName,
          role,
          isVerifiedOnChain: true,
        });
      } catch (userErr) {
        console.warn(`SyncService: Error syncing user ${ocUser.walletAddress}:`, userErr.message);
      }
    }

    return {
      success: true,
      blockchainConnected,
      syncedCount: synced.length,
      users: synced,
    };
  }

  /**
   * Retrieve all users, combining blockchain and MongoDB profile metadata.
   */
  async getCombinedUsers() {
    let blockchainConnected = true;

    // First attempt on-chain sync
    try {
      const syncResult = await this.syncOnChainUsers();
      blockchainConnected = syncResult.blockchainConnected !== false;
    } catch (e) {
      console.warn("SyncService: On-chain sync encountered an issue, proceeding with DB:", e.message);
      blockchainConnected = false;
    }

    // Query all MongoDB users
    const mongoUsers = await User.find().sort({ registrationDate: -1, createdAt: -1 }).select("-nonce").lean();

    // Query supplementary profiles in parallel
    const [patients, doctors, hospitals] = await Promise.all([
      Patient.find().lean().catch(() => []),
      Doctor.find().lean().catch(() => []),
      Hospital.find().lean().catch(() => []),
    ]);

    const patientMap = new Map(patients.map((p) => [p.walletAddress.toLowerCase(), p]));
    const doctorMap = new Map(doctors.map((d) => [d.walletAddress.toLowerCase(), d]));
    const hospitalMap = new Map(hospitals.map((h) => [h.walletAddress.toLowerCase(), h]));

    // Combine into unified response objects
    const combined = mongoUsers.map((u) => {
      const w = u.walletAddress.toLowerCase();
      const patientInfo = patientMap.get(w);
      const doctorInfo = doctorMap.get(w);
      const hospitalInfo = hospitalMap.get(w);

      const name = u.fullName || u.name || (patientInfo && patientInfo.fullName) || (doctorInfo && doctorInfo.fullName) || (hospitalInfo && hospitalInfo.hospitalName) || "Registered User";

      return {
        _id: u._id,
        walletAddress: w,
        fullName: name,
        name: name, // for backward compatibility
        email: u.email || "",
        phone: u.phone || "",
        role: u.role || "patient",
        profileImage: u.profileImage || null,
        accountStatus: u.accountStatus || "active",
        isVerified: u.isVerified !== undefined ? u.isVerified : true,
        isVerifiedOnChain: u.isVerifiedOnChain !== undefined ? u.isVerifiedOnChain : true,
        registrationDate: u.registrationDate || u.createdAt || new Date(),
        specialization: (doctorInfo && doctorInfo.specialization) || u.specialization || "",
        hospitalName: (doctorInfo && doctorInfo.hospitalName) || (hospitalInfo && hospitalInfo.hospitalName) || u.hospitalName || "",
        licenseNumber: (doctorInfo && doctorInfo.medicalLicenseNumber) || u.licenseNumber || "",
        patientProfile: patientInfo || null,
        doctorProfile: doctorInfo || null,
        hospitalProfile: hospitalInfo || null,
      };
    });

    // Compute role metrics
    const counts = {
      total: combined.length,
      patients: combined.filter((u) => u.role === "patient").length,
      doctors: combined.filter((u) => u.role === "doctor").length,
      hospitals: combined.filter((u) => u.role === "hospital").length,
      admins: combined.filter((u) => u.role === "admin").length,
      verified: combined.filter((u) => u.isVerified || u.isVerifiedOnChain).length,
    };

    return {
      success: true,
      blockchainConnected,
      counts,
      users: combined,
    };
  }
}

module.exports = new SyncService();
