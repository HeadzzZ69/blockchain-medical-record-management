# 🚀 MedVault: One-Click Startup & Operation Guide

This guide explains how to start, demonstrate, and stop the **Blockchain-Based Electronic Medical Record Access Management** system using the automated one-click launcher scripts.

---

## 1. Quick Start (The One-Click Method)

To run the entire system (Blockchain, Smart Contracts, Backend API, and React Frontend):

1. Navigate to the project root directory (`c:\Users\Shreyank\Desktop\BCT\`).
2. Double-click **`START-ALL.bat`**.
3. The launcher will automatically:
   - Perform system pre-flight checks (Node.js, npm, dependencies, environment files).
   - Check MongoDB status (connecting to local MongoDB or initializing the embedded zero-config fallback).
   - Launch the local Hardhat blockchain node in its own terminal.
   - Wait until the blockchain is responsive on `http://127.0.0.1:8545`.
   - Compile `MedicalRecordAccess.sol` and deploy it to the local blockchain network.
   - Synchronize the deployed contract address and ABI with both frontend and backend configurations.
   - Launch the Express backend API in its own terminal.
   - Verify backend health check at `http://localhost:5000/api/health`.
   - Launch the Vite React frontend development server in its own terminal.
   - Wait until `http://localhost:5173` is ready and automatically open your default web browser to the homepage.

---

## 2. Stopping the Project

When you are finished demonstrating or working on the project:

1. Double-click **`STOP-ALL.bat`** in the project root directory.
2. It will:
   - Identify and terminate the active processes running on:
     - Port **5173** (Vite Frontend Server)
     - Port **5000** (Express Backend Server)
     - Port **8545** (Hardhat Blockchain Node)
   - Safely close the dedicated terminal windows.
   - Preserve all unrelated processes on your computer.

---

## 3. Required Software

Before running for the first time, ensure you have:

| Software | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | v18, v20, or v24 | JavaScript runtime for contracts, backend, and frontend |
| **MetaMask** | Chrome / Brave / Edge extension | Web3 wallet for signing consent and transactions |
| **MongoDB (Optional)** | v6.0+ | Local database service (if not installed, the backend automatically uses its built-in in-memory fallback) |

---

## 4. First-Time Setup Instructions

If you just cloned or extracted the project on a new PC, run the following in PowerShell once:

```powershell
# From the project root (c:\Users\Shreyank\Desktop\BCT):
cd blockchain && npm install
cd ..\backend && npm install
cd ..\frontend && npm install
cd ..
```

*(Note: `START-ALL.bat` also automatically detects if `node_modules` are missing and will install them for you).*

---

## 5. MongoDB Configuration

The application is engineered with **Zero-Config Standalone Execution**:

- **Local MongoDB Service:** If you have MongoDB installed and running on `localhost:27017`, the backend automatically connects to it.
- **MongoDB Atlas:** If you configure a cloud URI in `backend/.env` (e.g., `mongodb+srv://...`), `START-ALL.bat` detects the cloud host and skips local service checks.
- **Zero-Setup Fallback (No MongoDB Installed):** If MongoDB is not installed or the local service is stopped, the backend automatically starts an embedded, in-memory MongoDB server (`mongodb-memory-server`). The project works immediately on any college lab computer or faculty laptop without manual database configuration.

---

## 6. MetaMask Configuration (Local Hardhat Network)

To interact with the smart contract from the frontend:

### A. Add Hardhat Localhost Network to MetaMask
1. Open the MetaMask extension in your browser.
2. Click the network selector in the top-left and click **Add network** -> **Add a network manually**.
3. Enter these exact values:
   - **Network name:** `Hardhat Localhost`
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency symbol:** `ETH`
4. Click **Save** and switch to `Hardhat Localhost`.

### B. Import Pre-Funded Demo Accounts
Each account starts with 10,000 test ETH on the local chain. In MetaMask, click:  
**Account dropdown -> Add account or hardware wallet -> Import account -> Paste Private Key**:

| Role in Project | Wallet Address | Private Key |
| :--- | :--- | :--- |
| **Admin (Deployer)** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Doctor (Dr. Sarah)** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Hospital (Apollo)** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Patient (Robert)** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |

---

## 7. How to Restart the Project

If you ever need to reset or restart the project:

1. Double-click **`STOP-ALL.bat`** to cleanly close all running services.
2. Double-click **`START-ALL.bat`**.
3. It will re-deploy the smart contract fresh, re-seed the test accounts, and reopen the browser.

---

## 8. Troubleshooting & What to do if Startup Fails

### Problem 1: Port conflict (Port 8545, 5000, or 5173 is already in use)
- **Solution:** Run `STOP-ALL.bat`. It will force-release all three ports. Then run `START-ALL.bat` again.

### Problem 2: MetaMask shows "Nonce too high" or transaction error
- **Cause:** When you restart the local blockchain, the block counter resets to 0, but MetaMask remembers past transaction counts.
- **Solution:** In MetaMask, click **Settings -> Advanced -> Clear activity tab data** (or *Reset Account* in older versions). This clears the cached transaction history without losing your account.

### Problem 3: Backend says "Contract not deployed yet"
- **Solution:** Run `START-ALL.bat` or run `cd blockchain && npx hardhat run scripts/deploy.js --network localhost`. This updates `backend/src/config/contractInfo.json` with the deployed address.

### Problem 4: Browser doesn't open automatically
- **Solution:** Open your browser manually and visit:
  - Frontend Website: **`http://localhost:5173`**
  - Backend Health: **`http://localhost:5000/api/health`**
  - Blockchain RPC: **`http://127.0.0.1:8545`**

---

## 9. Summary of Active Ports

| Service | Host & Port | Purpose |
| :--- | :--- | :--- |
| **Vite Frontend** | `http://localhost:5173` | React web application |
| **Express Backend** | `http://localhost:5000` | REST API, AES encryption, contract caller |
| **Hardhat Node** | `http://127.0.0.1:8545` | Ethereum JSON-RPC local blockchain |
| **MongoDB** | `127.0.0.1:27017` | Document database (or embedded memory server) |

---

## 10. Database Architecture & On-Chain Synchronization

The platform utilizes a hybrid architecture:
- **Authoritative On-Chain Ledger (Solidity Smart Contract):** Enforces patient consent, manages role registrations (`patient`, `doctor`, `hospital`, `admin`), cryptographically anchors record hashes (SHA-256), and immutably logs access requests, grants, revocations, and audit trails.
- **Off-Chain Application Database (MongoDB & Mongoose):** Holds metadata, AES-256-GCM encrypted document blobs, clinical profiles, and system notifications across 11 collections.

### The 11 Mongoose Collections:
1. **Users:** Core account registry (`walletAddress`, `fullName`, `email`, `role`, `accountStatus`, `isVerified`, `registrationDate`).
2. **Patients:** Clinical record profile (`patientId`, `dateOfBirth`, `gender`, `bloodGroup`, `address`, `emergencyContact`, `allergies`, `existingConditions`).
3. **Doctors:** Verified medical practitioner credentials (`doctorId`, `specialization`, `medicalLicenseNumber`, `qualification`, `experience`, `hospitalName`, `verificationStatus`).
4. **Hospitals:** Institutional healthcare facilities (`hospitalId`, `hospitalName`, `registrationNumber`, `address`, `verificationStatus`).
5. **MedicalRecords:** Encrypted medical documents (`recordId`, `recordTitle`, `fileHash`, `encryptedFileReference`, `encryptionIv`, `encryptionTag`, `mimeType`, `fileSize`, `uploadDate`, `accessStatus`).
6. **AccessRequests:** Consent requests submitted by doctors/hospitals (`requestId`, `patientWallet`, `doctorWallet`, `requestedPermissions`, `requestReason`, `approvalStatus`, `expiryDate`).
7. **ConsentLogs:** On-chain consent audit trails (`patientWallet`, `authorizedWallet`, `recordId`, `permissions`, `grantedAt`, `expiresAt`, `revokedAt`, `transactionHash`, `status`).
8. **AuditLogs:** Security and compliance ledger (`actorWallet`, `actorRole`, `actionType`, `targetWallet`, `recordId`, `ipAddress`, `status`, `timestamp`).
9. **Notifications:** Real-time user event notifications (`recipientWallet`, `senderWallet`, `title`, `message`, `type`, `isRead`, `timestamp`).
10. **Departments:** Hospital medical divisions (`departmentId`, `hospitalWallet`, `departmentName`, `description`, `doctors`, `status`).
11. **Appointments:** Clinical consultation schedule (`appointmentId`, `patientWallet`, `doctorWallet`, `appointmentDate`, `appointmentTime`, `reason`, `status`).

### On-Chain Synchronization Service (`syncService.js`):
- Automatically triggered on server boot and accessible via `GET /api/users`.
- Queries `admin()`, `getRegisteredPatients()`, `getRegisteredDoctors()`, and `getRegisteredHospitals()` directly from the deployed contract.
- Reconciles addresses and guarantees that newly deployed on-chain accounts immediately appear in the Admin Dashboard with full profile details.

---

## 11. Automated Verification & Testing Commands

To run all automated test suites across smart contracts, cryptography, database models, and end-to-end workflows:

```powershell
# 1. Run Smart Contract Unit Tests (19 tests)
cd blockchain
npx hardhat test

# 2. Run Cryptographic & AES-256-GCM Integrity Tests
cd ..\backend
node test/crypto.test.js

# 3. Run End-to-End Blockchain Access Control Workflow Tests (7 scenarios)
node test/e2e.test.js

# 4. Run User Directory & 11 Collections Synchronization Test
node test/users.test.js

# 5. Verify Frontend Production Build
cd ..\frontend
npm run build
```
