const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const blockchainService = require("../services/blockchainService");
const { JWT_SECRET } = require("../middleware/auth");

/**
 * Generate a nonce for a wallet to sign
 */
async function getNonce(req, res) {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    const cleanAddress = walletAddress.toLowerCase();
    let user = await User.findOne({ walletAddress: cleanAddress });

    const nonce = Math.floor(Math.random() * 1000000).toString();

    if (!user) {
      // Check if user is registered on-chain
      const onChain = await blockchainService.getOnChainUser(cleanAddress);
      user = new User({
        walletAddress: cleanAddress,
        name: onChain?.name || "Pending Registration",
        role: onChain?.role !== "none" ? onChain.role : "patient",
        nonce,
        isVerifiedOnChain: Boolean(onChain && onChain.role !== "none"),
      });
      await user.save();
    } else {
      user.nonce = nonce;
      await user.save();
    }

    const message = `Welcome to EMR Blockchain Access Management!\n\nPlease sign this one-time challenge to authenticate:\nNonce: ${nonce}\nWallet: ${cleanAddress}`;

    return res.json({
      nonce,
      message,
    });
  } catch (error) {
    console.error("Error in getNonce:", error);
    return res.status(500).json({ message: "Failed to generate authentication challenge" });
  }
}

/**
 * Verify wallet signature and return JWT
 */
async function verifySignature(req, res) {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ message: "walletAddress, signature, and message are required" });
    }

    const cleanAddress = walletAddress.toLowerCase();
    const user = await User.findOne({ walletAddress: cleanAddress });

    if (!user) {
      return res.status(404).json({ message: "User not found for this wallet address" });
    }

    // Recover address using ethers
    const recoveredAddress = ethers.verifyMessage(message, signature).toLowerCase();

    if (recoveredAddress !== cleanAddress) {
      return res.status(401).json({ message: "Signature verification failed: Address mismatch" });
    }

    // Check / Sync role from on-chain contract
    const onChain = await blockchainService.getOnChainUser(cleanAddress);
    if (onChain && onChain.role !== "none") {
      user.role = onChain.role;
      user.isVerifiedOnChain = true;
      if (onChain.name) user.name = onChain.name;
    }

    // Refresh nonce
    user.nonce = Math.floor(Math.random() * 1000000).toString();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      {
        walletAddress: user.walletAddress,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    await AuditLog.create({
      actorWallet: user.walletAddress,
      action: "LOGIN",
      details: `User logged in with role ${user.role}`,
    });

    return res.json({
      token,
      user: {
        walletAddress: user.walletAddress,
        name: user.name,
        role: user.role,
        email: user.email,
        specialization: user.specialization,
        hospitalName: user.hospitalName,
        isVerifiedOnChain: user.isVerifiedOnChain,
      },
    });
  } catch (error) {
    console.error("Error verifying signature:", error);
    return res.status(500).json({ message: "Failed to authenticate wallet signature" });
  }
}

/**
 * Get current authenticated user profile
 */
async function getMe(req, res) {
  try {
    const user = await User.findOne({ walletAddress: req.user.walletAddress.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Also fetch live on-chain status
    const onChain = await blockchainService.getOnChainUser(user.walletAddress);

    return res.json({
      user: {
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        role: onChain && onChain.role !== "none" ? onChain.role : user.role,
        specialization: user.specialization,
        hospitalName: user.hospitalName,
        isVerifiedOnChain: Boolean(onChain && onChain.role !== "none"),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Fast session sync for connected wallet
 */
async function syncSession(req, res) {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ message: "walletAddress is required" });
    }
    const cleanAddress = walletAddress.toLowerCase();

    // Check on-chain user status
    const onChain = await blockchainService.getOnChainUser(cleanAddress);
    let role = onChain && onChain.role !== "none" ? onChain.role : "patient";
    let name = onChain?.name || (role === "admin" ? "System Administrator" : `User ${cleanAddress.slice(0, 6)}`);

    let user = await User.findOne({ walletAddress: cleanAddress });
    if (!user) {
      user = new User({
        walletAddress: cleanAddress,
        name,
        fullName: name,
        role,
        isVerifiedOnChain: Boolean(onChain && onChain.role !== "none"),
        isVerified: true,
      });
      await user.save();
    } else {
      let updated = false;
      if (onChain && onChain.role !== "none" && user.role !== onChain.role) {
        user.role = onChain.role;
        user.isVerifiedOnChain = true;
        updated = true;
      }
      if (onChain?.name && !user.name) {
        user.name = onChain.name;
        user.fullName = onChain.name;
        updated = true;
      }
      if (updated) await user.save();
    }

    const token = jwt.sign(
      {
        walletAddress: user.walletAddress,
        role: user.role,
        name: user.name || user.fullName,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      token,
      user: {
        walletAddress: user.walletAddress,
        name: user.name || user.fullName,
        fullName: user.fullName || user.name,
        role: user.role,
        email: user.email || "",
        specialization: user.specialization || "",
        hospitalName: user.hospitalName || "",
        isVerifiedOnChain: Boolean(user.isVerifiedOnChain),
      },
    });
  } catch (error) {
    console.error("Error syncing session:", error);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getNonce,
  verifySignature,
  getMe,
  syncSession,
};
