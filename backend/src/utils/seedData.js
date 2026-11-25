const User = require("../models/User");

async function seedInitialUsers() {
  try {
    const existingCount = await User.countDocuments();
    if (existingCount > 0) return;

    console.log("Seeding initial demo users matching local blockchain network...");

    const users = [
      {
        walletAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        name: "System Administrator",
        email: "admin@medvault.network",
        role: "admin",
        isVerifiedOnChain: true,
      },
      {
        walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        name: "Dr. Sarah Jenkins",
        email: "dr.sarah@apollo.org",
        role: "doctor",
        specialization: "Cardiology",
        hospitalName: "Apollo Multi-Specialty Hospital",
        licenseNumber: "MED-CARD-2026-081",
        isVerifiedOnChain: true,
      },
      {
        walletAddress: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
        name: "Apollo Multi-Specialty Hospital",
        email: "contact@apollo.org",
        role: "hospital",
        isVerifiedOnChain: true,
      },
      {
        walletAddress: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
        name: "Robert Miller",
        email: "robert.miller@gmail.com",
        role: "patient",
        isVerifiedOnChain: true,
      },
    ];

    await User.insertMany(users);
    console.log("Demo users seeded successfully for effortless faculty demonstration!");
  } catch (err) {
    console.warn("Could not seed demo users:", err.message);
  }
}

module.exports = { seedInitialUsers };
