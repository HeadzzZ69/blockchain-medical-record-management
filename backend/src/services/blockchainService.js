const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

class BlockchainService {
  constructor() {
    this.rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.contract = null;
    this.contractInfo = null;
    this.initContract();
  }

  initContract() {
    try {
      const contractInfoPath = path.join(__dirname, "..", "config", "contractInfo.json");
      if (fs.existsSync(contractInfoPath)) {
        this.contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, "utf8"));
        this.contract = new ethers.Contract(
          this.contractInfo.contractAddress,
          this.contractInfo.abi,
          this.provider
        );
        console.log("BlockchainService: Initialized contract at", this.contractInfo.contractAddress);
      } else {
        console.warn("BlockchainService: contractInfo.json not found yet. Deploy contract first.");
      }
    } catch (err) {
      console.warn("BlockchainService: Error loading contract info:", err.message);
    }
  }

  getContract() {
    if (!this.contract) {
      this.initContract();
    }
    return this.contract;
  }

  /**
   * Verify if a requester has valid on-chain access to a record
   */
  async verifyRecordAccess(patientWallet, requesterWallet, recordId) {
    const contract = this.getContract();
    if (!contract) {
      console.warn("Contract not loaded; falling back to strict denial");
      return false;
    }

    try {
      const hasAccess = await contract.hasValidAccess(patientWallet, requesterWallet, recordId);
      return Boolean(hasAccess);
    } catch (err) {
      console.error("Error verifying access on blockchain:", err.message);
      return false;
    }
  }

  /**
   * Get user role registered on-chain
   */
  async getOnChainUser(walletAddress) {
    const contract = this.getContract();
    if (!contract) return null;

    try {
      const user = await contract.getUser(walletAddress);
      // Role enum: 0: NONE, 1: PATIENT, 2: DOCTOR, 3: HOSPITAL, 4: ADMIN
      const roles = ["none", "patient", "doctor", "hospital", "admin"];
      return {
        role: roles[Number(user[0])] || "none",
        name: user[1],
        isActive: user[2],
        registeredAt: Number(user[3]),
      };
    } catch (err) {
      console.error("Error getting user from blockchain:", err.message);
      return null;
    }
  }

  /**
   * Enumerate all registered users from the smart contract
   */
  async getAllOnChainUsers() {
    const contract = this.getContract();
    if (!contract) return [];

    try {
      const roles = ["none", "patient", "doctor", "hospital", "admin"];
      const addressMap = new Map();

      // 1. Fetch Admin address
      try {
        const adminAddress = await contract.admin();
        if (adminAddress && adminAddress !== ethers.ZeroAddress) {
          addressMap.set(adminAddress.toLowerCase(), {
            walletAddress: adminAddress.toLowerCase(),
            role: "admin",
            name: "System Administrator",
            isActive: true,
            registeredAt: Math.floor(Date.now() / 1000),
          });
        }
      } catch (e) {
        console.warn("BlockchainService: Could not query contract.admin():", e.message);
      }

      // 2. Fetch list getters
      try {
        const [patients, doctors, hospitals] = await Promise.all([
          contract.getRegisteredPatients().catch(() => []),
          contract.getRegisteredDoctors().catch(() => []),
          contract.getRegisteredHospitals().catch(() => []),
        ]);

        for (const addr of (patients || [])) {
          if (addr && addr !== ethers.ZeroAddress) {
            addressMap.set(addr.toLowerCase(), { walletAddress: addr.toLowerCase(), role: "patient" });
          }
        }
        for (const addr of (doctors || [])) {
          if (addr && addr !== ethers.ZeroAddress) {
            addressMap.set(addr.toLowerCase(), { walletAddress: addr.toLowerCase(), role: "doctor" });
          }
        }
        for (const addr of (hospitals || [])) {
          if (addr && addr !== ethers.ZeroAddress) {
            addressMap.set(addr.toLowerCase(), { walletAddress: addr.toLowerCase(), role: "hospital" });
          }
        }
      } catch (e) {
        console.warn("BlockchainService: Could not query role lists:", e.message);
      }

      // 3. Query UserRegistered events
      try {
        const regFilter = contract.filters.UserRegistered();
        const events = await contract.queryFilter(regFilter, 0, "latest");
        for (const ev of events) {
          const userAddr = (ev.args[0] || "").toLowerCase();
          const roleIndex = Number(ev.args[1]);
          const roleName = roles[roleIndex] || "none";
          const userName = ev.args[2] || "";
          const timestamp = Number(ev.args[3]);

          if (userAddr && userAddr !== ethers.ZeroAddress.toLowerCase()) {
            addressMap.set(userAddr, {
              walletAddress: userAddr,
              role: roleName,
              name: userName,
              isActive: true,
              registeredAt: timestamp,
            });
          }
        }
      } catch (e) {
        console.warn("BlockchainService: Could not query UserRegistered events:", e.message);
      }

      // 4. Enrich details with getUser for each address
      const usersList = [];
      for (const [walletAddress, partial] of addressMap.entries()) {
        try {
          const onChain = await contract.getUser(walletAddress);
          const roleIdx = Number(onChain[0]);
          const role = roles[roleIdx] || partial.role || "none";
          if (role !== "none") {
            usersList.push({
              walletAddress,
              role,
              name: onChain[1] || partial.name || "Registered User",
              isActive: onChain[2] !== undefined ? onChain[2] : true,
              registeredAt: Number(onChain[3]) || partial.registeredAt || Math.floor(Date.now() / 1000),
            });
          }
        } catch (err) {
          if (partial.role && partial.role !== "none") {
            usersList.push({
              walletAddress,
              role: partial.role,
              name: partial.name || "Registered User",
              isActive: true,
              registeredAt: partial.registeredAt || Math.floor(Date.now() / 1000),
            });
          }
        }
      }

      return usersList;
    } catch (err) {
      console.error("Error in getAllOnChainUsers:", err.message);
      return [];
    }
  }

  /**
   * Query all blockchain audit events from the smart contract
   */
  async getAuditEvents() {
    const contract = this.getContract();
    if (!contract) return [];

    try {
      // Query filter for all events
      const filter = contract.filters;
      const [registeredEvents, recordAddedEvents, accessGrantedEvents, accessRevokedEvents, recordAccessedEvents] =
        await Promise.all([
          contract.queryFilter(contract.filters.UserRegistered(), 0, "latest"),
          contract.queryFilter(contract.filters.RecordAdded(), 0, "latest"),
          contract.queryFilter(contract.filters.AccessGranted(), 0, "latest"),
          contract.queryFilter(contract.filters.AccessRevoked(), 0, "latest"),
          contract.queryFilter(contract.filters.RecordAccessed(), 0, "latest"),
        ]);

      const formatted = [];

      registeredEvents.forEach((ev) => {
        const roles = ["None", "Patient", "Doctor", "Hospital", "Admin"];
        formatted.push({
          type: "UserRegistered",
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          actor: ev.args[0],
          role: roles[Number(ev.args[1])],
          name: ev.args[2],
          timestamp: Number(ev.args[3]) * 1000,
        });
      });

      recordAddedEvents.forEach((ev) => {
        formatted.push({
          type: "RecordAdded",
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          patient: ev.args[0],
          recordId: ev.args[1],
          fileHash: ev.args[2],
          category: ev.args[3],
          timestamp: Number(ev.args[4]) * 1000,
        });
      });

      accessGrantedEvents.forEach((ev) => {
        formatted.push({
          type: "AccessGranted",
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          patient: ev.args[0],
          requester: ev.args[1],
          recordId: ev.args[2],
          expiryTimestamp: Number(ev.args[3]) * 1000,
          timestamp: Number(ev.args[4]) * 1000,
        });
      });

      accessRevokedEvents.forEach((ev) => {
        formatted.push({
          type: "AccessRevoked",
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          patient: ev.args[0],
          requester: ev.args[1],
          recordId: ev.args[2],
          timestamp: Number(ev.args[3]) * 1000,
        });
      });

      recordAccessedEvents.forEach((ev) => {
        formatted.push({
          type: "RecordAccessed",
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          patient: ev.args[0],
          accessor: ev.args[1],
          recordId: ev.args[2],
          timestamp: Number(ev.args[3]) * 1000,
        });
      });

      // Sort descending by timestamp / block
      formatted.sort((a, b) => b.timestamp - a.timestamp);
      return formatted;
    } catch (err) {
      console.error("Error querying blockchain events:", err.message);
      return [];
    }
  }
}

module.exports = new BlockchainService();
