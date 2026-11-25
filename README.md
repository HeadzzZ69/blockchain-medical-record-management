# 🏥 Blockchain-Based Electronic Medical Record Access Management

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-Ethereum_Dev-FFF100?logo=ethereum)](https://hardhat.org/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535a0)](https://docs.ethers.org/v6/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A patient-controlled Electronic Medical Record (EMR) Access Management platform developed as an undergraduate academic mini-project for the subject **Blockchain Network Technology**.

The system implements a **zero-trust hybrid architecture**: patient access consent, practitioner credentials, and immutable audit trails are enforced on the Ethereum blockchain via Solidity smart contracts, while sensitive medical files and diagnostic reports are encrypted with **AES-256-GCM** and stored off-chain.

---

## 📋 Table of Contents
- [1. Project Introduction](#1-project-introduction)
- [2. Problem Statement](#2-problem-statement)
- [3. Project Objectives](#3-project-objectives)
- [4. Core Features](#4-core-features)
- [5. Technologies Used](#5-technologies-used)
- [6. System Architecture](#6-system-architecture)
- [7. Project Folder Structure](#7-project-folder-structure)
- [8. Smart Contract Description](#8-smart-contract-description)
- [9. MongoDB Database Architecture](#9-mongodb-database-architecture)
- [10. Demo Wallet Accounts](#10-demo-wallet-accounts)
- [11. Environment Variable Configuration](#11-environment-variable-configuration)
- [12. Installation Instructions](#12-installation-instructions)
- [13. How to Run the Project](#13-how-to-run-the-project)
- [14. MetaMask Setup Guide](#14-metamask-setup-guide)
- [15. Step-by-Step Demonstration Walkthrough](#15-step-by-step-demonstration-walkthrough)
- [16. Screenshots & UI Walkthrough](#16-screenshots--ui-walkthrough)
- [17. Security Considerations](#17-security-considerations)
- [18. Future Enhancements](#18-future-enhancements)
- [19. Contributors](#19-contributors)

---

## 1. Project Introduction

In traditional healthcare infrastructure, electronic health records are fragmented across proprietary hospital servers and clinical databases. Patients have virtually zero visibility or control over who accesses their confidential health records, creating severe risks of data snooping, unauthorized commercial sharing, and ransomware disruption.

**MedVault** solves this crisis by leveraging Ethereum smart contracts to grant patients absolute sovereignty over their healthcare records. Patients decide precisely which doctors or hospital departments can access which diagnostic files, specify exact time-bound expirations, and immediately revoke access with a cryptographic blockchain transaction.

---

## 2. Problem Statement

1. **Centralized Data Silos:** Centralized healthcare databases represent single points of failure vulnerable to unauthorized access and cyberattacks.
2. **Lack of Patient Consent:** Patients cannot dynamically grant, restrict, or audit access to specific clinical reports.
3. **Absence of Immediate Revocation:** Once medical files are emailed or uploaded to traditional portals, access cannot be verifiably revoked.
4. **Opaque Access Logs:** Internal database logs can be deleted or altered by administrators, preventing verifiable auditing of unauthorized access.
5. **Blockchain Storage Limitations:** Storing multi-megabyte diagnostic scans (X-rays, MRIs, PDFs) directly on-chain is cost-prohibitive and violates healthcare privacy laws (HIPAA/GDPR).

---

## 3. Project Objectives

- **Patient-Centric Access Control:** Enable patients to grant, modify, and revoke access to specific medical records through MetaMask transactions.
- **Off-Chain Confidentiality:** Encrypt medical documents off-chain using **AES-256-GCM**; store only cryptographic **SHA-256** checksums on the blockchain.
- **On-Chain Enforcement:** Ensure the backend decrypts and streams a medical file only if the smart contract returns active consent (`hasValidAccess == true`).
- **Time-Bound Permissions:** Support granular permission lifetimes with automatic expiration timestamps.
- **Immutable Audit Logging:** Emit Solidity events (`UserRegistered`, `RecordAdded`, `AccessGranted`, `AccessRevoked`, `RecordAccessed`) to create an unalterable compliance trail.

---

## 4. Core Features

### 👤 Patient Role
- **Dashboard Overview:** Live metrics for total records, authorized doctors, active permissions, and recent blockchain events.
- **Record Management:** Upload PDF, JPG, and PNG documents. Backend encrypts files with AES-256-GCM, generates SHA-256 hashes, and anchors cryptographic references on-chain.
- **Consent Management:** Browse registered doctors and hospitals, select individual records to share, configure expiration periods, and sign consent on-chain.
- **Instant Revocation:** Terminate doctor or hospital access with a single MetaMask transaction.
- **Access Request Handling:** Review, approve, or reject incoming clinical consultation requests.
- **Audit History:** Full chronological timeline of on-chain consent lifecycle events with verifiable transaction hashes.

### 🩺 Doctor Role
- **Practitioner Portal:** View list of verified patients who have granted active consent.
- **Accessible Records:** Search patient wallet addresses, view authorized medical files, and download decrypted records.
- **Access Requests:** Request permission from any registered patient for specific medical records with clinical justifications.
- **Access Auditing:** Every record view or download logs a `RecordAccessed` event on the blockchain.

### 🏥 Hospital Role
- **Institutional Overview:** Monitor affiliated doctors, departmental records, and authorized patients.
- **Departmental Records:** Access patient records authorized for the facility.
- **Facility Verification:** Display smart contract verification status and administrative licensing credentials.

### 🛡️ Administrator Role
- **User Directory:** Synchronized registry combining on-chain accounts and off-chain clinical profiles with real-time role filtering and search.
- **Practitioner Registration:** Register and verify licensed doctors and accredited healthcare institutions directly onto the smart contract.
- **Global Audit Trail:** Full observatory monitoring all blockchain transactions, gas consumption, and network activities.

---

## 5. Technologies Used

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React.js 18 & Vite 5 | Fast Single Page Application (SPA) |
| **Styling** | Tailwind CSS | Modern medical UI with responsive layouts |
| **Icons** | Lucide React | Clean, accessible SVG iconography |
| **Smart Contract** | Solidity (`^0.8.24`) | Ethereum access management contract |
| **Blockchain Suite** | Hardhat | Local Ethereum testnet (Chain ID 31337) |
| **Web3 Library** | Ethers.js v6 | Provider, Signer, Contract instances, and event filters |
| **Wallet** | MetaMask | EIP-1193 browser wallet for transaction signing |
| **Backend API** | Node.js & Express.js | REST API, file streaming, and smart contract verification |
| **Database** | MongoDB & Mongoose | Off-chain metadata, profiles, and notifications |
| **Embedded DB** | MongoMemoryServer | Built-in zero-config in-memory database fallback |
| **Encryption** | AES-256-GCM & SHA-256 | Authenticated file encryption and data integrity verification |

---

## 6. System Architecture

```
                                  +---------------------------------------+
                                  |         React 18 Frontend (Vite)      |
                                  |  - Role-based Routing (React Router)  |
                                  |  - Web3Context (Ethers.js v6)         |
                                  |  - MetaMask Wallet Integration        |
                                  +-------------------+-------------------+
                                                      |
                                 +--------------------+--------------------+
                                 |                                         |
                       MetaMask Transactions                     REST API + JWT Auth
                                 v                                         v
                 +-------------------------------+       +------------------------------------+
                 |   Hardhat Ethereum Blockchain |       |        Express.js Backend          |
                 |     MedicalRecordAccess.sol   |       |  - EIP-712 / Nonce Verification    |
                 |  - Role Verification          |<------+  - AES-256-GCM Encrypt / Decrypt   |
                 |  - SHA-256 Hash Anchoring     |verify |  - SHA-256 Tamper Verification     |
                 |  - Dynamic Consent Management |Access |  - On-Chain Permission Verifier    |
                 |  - Immutable Event Logs       |       +-----------------+------------------+
                 +-------------------------------+                         |
                                                                           v
                                                         +------------------------------------+
                                                         |          Off-Chain Storage         |
                                                         |  - Encrypted Files (uploads/)      |
                                                         |  - MongoDB (11 Collections)        |
                                                         +------------------------------------+
```

---

## 7. Project Folder Structure

```
blockchain-medical-record-management/
│
├── blockchain/                         # Ethereum Smart Contract Environment
│   ├── contracts/
│   │   └── MedicalRecordAccess.sol     # Core Solidity Smart Contract
│   ├── scripts/
│   │   ├── deploy.js                   # Deployment & demo seeding script
│   │   └── run-node.js                 # Supervisor node runner
│   ├── test/
│   │   └── MedicalRecordAccess.test.js # 19 automated Hardhat unit tests
│   ├── hardhat.config.js               # Network and compiler configuration
│   ├── deployedAddress.json            # Deployment address and ABI
│   └── package.json
│
├── backend/                            # Express REST API & Off-Chain Service
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                   # MongoDB & MongoMemoryServer connector
│   │   │   └── contractInfo.json       # Auto-synced ABI and contract address
│   │   ├── controllers/                # Auth, Records, Users, Access, Audit
│   │   ├── middleware/                 # JWT Auth, Multer upload
│   │   ├── models/                     # 11 Mongoose Schemas (User, Patient, Doctor...)
│   │   ├── routes/                     # REST API endpoints
│   │   ├── services/
│   │   │   ├── blockchainService.js    # Smart contract query service
│   │   │   └── syncService.js          # On-chain to MongoDB synchronization
│   │   ├── utils/
│   │   │   ├── crypto.js               # AES-256-GCM encryption & SHA-256 hashing
│   │   │   └── seedData.js             # Initial database seeder
│   │   └── server.js                   # Application server entry point
│   ├── test/
│   │   ├── crypto.test.js              # AES-256-GCM cryptographic integrity test
│   │   ├── e2e.test.js                 # 7-scenario end-to-end integration test
│   │   └── users.test.js               # User directory & 11 models verification
│   ├── uploads/                        # Off-chain encrypted document directory
│   ├── .env.example                    # Environment template
│   └── package.json
│
├── frontend/                           # React + Vite Web Application
│   ├── src/
│   │   ├── components/                 # Navbar, Sidebar, DashboardLayout, Modal
│   │   ├── context/
│   │   │   └── Web3Context.jsx         # Wallet state, account switching & contract
│   │   ├── contracts/
│   │   │   └── contractInfo.json       # Auto-synced ABI & contract address
│   │   ├── dashboards/
│   │   │   ├── patient/                # Patient portal views
│   │   │   ├── doctor/                 # Doctor portal views
│   │   │   ├── hospital/               # Hospital portal views
│   │   │   └── admin/                  # System admin portal views
│   │   ├── pages/                      # Landing, About, ConnectWallet, Register
│   │   ├── services/                   # Axios API service
│   │   ├── App.jsx                     # Route architecture
│   │   └── main.jsx
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── scripts/                            # Operational utilities
│   └── launcher-utils.js
├── START-ALL.bat                       # One-click automated project starter
├── STOP-ALL.bat                        # One-click clean process stopper
├── START-GUIDE.md                      # Operational & demonstration guide
├── .gitignore                          # Comprehensive exclusion rules
├── package.json                        # Root workspace scripts
└── README.md                           # Project documentation
```

---

## 8. Smart Contract Description

The Solidity contract `MedicalRecordAccess.sol` runs on the local Ethereum network. It defines role hierarchies, permission mapping keys, and emitted lifecycle events.

### Key Roles
```solidity
enum Role { NONE, PATIENT, DOCTOR, HOSPITAL, ADMIN }
```

### Core Functions
- `registerPatient(string memory _name)`: Self-registration for patients.
- `registerDoctor(address _doctor, string memory _name)`: Admin registers a licensed practitioner.
- `registerHospital(address _hospital, string memory _name)`: Admin registers an accredited facility.
- `addRecord(string memory _recordId, string memory _fileHash, string memory _category)`: Anchors SHA-256 document hash on-chain.
- `grantAccess(address _requester, string memory _recordId, uint256 _expiryTimestamp)`: Grants consent with optional expiration.
- `revokeAccess(address _requester, string memory _recordId)`: Revokes previously granted consent immediately.
- `hasValidAccess(address _patient, address _requester, string memory _recordId)`: Pure view function used by backend to authorize decryptions.
- `logRecordAccess(address _patient, string memory _recordId)`: Logs record viewing by authorized practitioners.

### Events Emitted
```solidity
event UserRegistered(address indexed userAddress, uint8 indexed role, string name, uint256 timestamp);
event RecordAdded(address indexed patient, string recordId, string fileHash, string category, uint256 timestamp);
event AccessGranted(address indexed patient, address indexed requester, string recordId, uint256 expiryTimestamp, uint256 timestamp);
event AccessRevoked(address indexed patient, address indexed requester, string recordId, uint256 timestamp);
event RecordAccessed(address indexed patient, address indexed accessor, string recordId, uint256 timestamp);
```

---

## 9. MongoDB Database Architecture

The backend database maintains metadata, clinical profiles, and notifications across **11 Mongoose collections**:

1. **`Users`**: Core account registry (`walletAddress`, `fullName`, `email`, `phone`, `role`, `accountStatus`, `isVerified`, `registrationDate`).
2. **`Patients`**: Clinical details (`patientId`, `dateOfBirth`, `gender`, `bloodGroup`, `address`, `emergencyContact`, `allergies`, `existingConditions`).
3. **`Doctors`**: Medical practitioner credentials (`doctorId`, `specialization`, `medicalLicenseNumber`, `qualification`, `experience`, `hospitalName`, `verificationStatus`).
4. **`Hospitals`**: Healthcare facility details (`hospitalId`, `hospitalName`, `registrationNumber`, `address`, `department`, `verificationStatus`).
5. **`MedicalRecords`**: Encrypted document metadata (`recordId`, `patientWallet`, `recordTitle`, `recordType`, `fileHash`, `encryptedFileReference`, `encryptionIv`, `encryptionTag`, `mimeType`, `fileSize`, `uploadDate`, `accessStatus`).
6. **`AccessRequests`**: Consultation requests (`requestId`, `patientWallet`, `doctorWallet`, `hospitalWallet`, `requestedPermissions`, `requestReason`, `approvalStatus`, `expiryDate`).
7. **`ConsentLogs`**: Audit trail of consent transactions (`patientWallet`, `authorizedWallet`, `recordId`, `permissions`, `grantedAt`, `expiresAt`, `revokedAt`, `transactionHash`, `status`).
8. **`AuditLogs`**: Security and access event logs (`actorWallet`, `actorRole`, `actionType`, `targetWallet`, `recordId`, `ipAddress`, `status`, `timestamp`).
9. **`Notifications`**: Real-time user alerts (`recipientWallet`, `senderWallet`, `title`, `message`, `type`, `isRead`, `timestamp`).
10. **`Departments`**: Hospital clinical divisions (`departmentId`, `hospitalWallet`, `departmentName`, `description`, `doctors`, `status`).
11. **`Appointments`**: Clinical appointment schedule (`appointmentId`, `patientWallet`, `doctorWallet`, `appointmentDate`, `appointmentTime`, `reason`, `status`).

---

## 10. Demo Wallet Accounts

The local Hardhat development blockchain initializes pre-funded demo accounts for testing:

| Role in Project | Account Index | Public Wallet Address | Dashboard |
| :--- | :--- | :--- | :--- |
| **System Admin** | Account #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `/admin` |
| **Doctor (Dr. Sarah)** | Account #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `/doctor` |
| **Hospital (Apollo)** | Account #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `/hospital` |
| **Patient (Robert)** | Account #3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `/patient` |

> [!NOTE]
> For demonstration and local testing with MetaMask on `http://127.0.0.1:8545`, import the standard Hardhat development private keys provided in [START-GUIDE.md](file:///c:/Users/Shreyank/Desktop/BCT/START-GUIDE.md). These accounts are exclusively for local offline evaluation.

---

## 11. Environment Variable Configuration

Create `.env` files in each sub-package using the provided `.env.example` templates:

### Backend `.env` (`backend/.env`)
```ini
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/emr_blockchain
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_KEY=your_64_character_hex_encryption_key_here
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
```

### Frontend `.env` (`frontend/.env`)
```ini
VITE_API_URL=http://localhost:5000/api
VITE_BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337
```

---

## 12. Installation Instructions

### Prerequisites
- **Node.js** (v18, v20, or v22)
- **Git**
- **MetaMask Extension** installed in Chrome, Brave, or Edge

### Clone Repository & Install Dependencies
```bash
git clone https://github.com/shreyanck/blockchain-medical-record-management.git
cd blockchain-medical-record-management

# Install Blockchain dependencies
cd blockchain && npm install

# Install Backend dependencies
cd ../backend && npm install

# Install Frontend dependencies
cd ../frontend && npm install

# Return to root directory
cd ..
```

---

## 13. How to Run the Project

### Method A: The One-Click Starter (Recommended for Windows)
Double-click **`START-ALL.bat`** in the project root:
1. Automatically verifies dependencies and environment configurations.
2. Starts the local Hardhat blockchain on port `8545`.
3. Compiles and deploys `MedicalRecordAccess.sol`.
4. Synchronizes contract ABI and address with frontend and backend.
5. Starts the Express backend on port `5000`.
6. Starts the Vite frontend on port `5173`.
7. Automatically launches your default web browser to the homepage.

To cleanly terminate all running processes, double-click **`STOP-ALL.bat`**.

---

### Method B: Manual 3-Terminal Execution

#### Terminal 1: Hardhat Node
```bash
cd blockchain
npx hardhat node
```

#### Terminal 2: Deploy Contract & Start Backend
```bash
# Deploy contract
cd blockchain
npx hardhat run scripts/deploy.js --network localhost

# Start backend server
cd ../backend
npm run dev
```

#### Terminal 3: Vite Frontend
```bash
cd frontend
npm run dev
```
Visit **`http://localhost:5173`** in your browser.

---

## 14. MetaMask Setup Guide

1. Open the MetaMask extension.
2. Click the Network selector -> **Add a network manually**:
   - **Network Name:** `Hardhat Localhost`
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Click **Save** and switch to `Hardhat Localhost`.
4. Import Account #0, #1, #2, and #3 to test each role.

---

## 15. Step-by-Step Demonstration Walkthrough

1. **System Administrator View:** Connect with Account #0 (`0xf39F...`). View all registered users, verified clinical profiles, and real-time blockchain sync.
2. **Patient Uploads Record:** Switch to Account #3 (`0x90F7...`). Go to **Upload Record**, choose a test PDF/image, and confirm the transaction in MetaMask. The file is AES-encrypted off-chain, and its SHA-256 hash is anchored on-chain.
3. **Doctor Verification Denial:** Switch to Account #1 (`0x7099...`). Go to **Patient Records** and search for Account #3's wallet. Zero records appear because consent has not been granted.
4. **Doctor Requests Access:** Navigate to **Request Access**, input the patient wallet and reason, and submit the request.
5. **Patient Grants Consent:** Switch back to Account #3 (`0x90F7...`). Approve the request under **Access Requests** or **Manage Access**, set a 7-day expiration, and confirm the MetaMask transaction.
6. **Doctor Decrypts Record:** Switch to Account #1 (`0x7099...`). The record now appears! Click **Download Decrypted**. The backend queries `hasValidAccess` on-chain, confirms consent, and decrypts the file.
7. **Patient Revokes Consent:** Switch to Account #3 (`0x90F7...`). Navigate to **Revoke Access** and click **Revoke**. Confirm the transaction. Doctor's access is immediately revoked.
8. **Audit Trail Verification:** View **Audit History** to demonstrate immutable on-chain event logs with transaction hashes.

---

## 16. Screenshots & UI Walkthrough

| Screen | Description |
| :--- | :--- |
| **Landing Page** | Sovereign medical record access portal with Web3 wallet authentication |
| **Patient Dashboard** | Medical record overview, active permissions, and pending clinical requests |
| **Manage Access** | Multi-record consent granting with custom expiration timestamps |
| **Doctor Portal** | Authorized patient browsing and secure document viewing |
| **Admin Console** | Complete directory of registered users with on-chain verification badges |
| **Global Audit** | Real-time smart contract transaction and event monitoring |

---

## 17. Security Considerations

- **Zero Medical Data on Blockchain:** Neither private patient details, cleartext diagnoses, nor encryption keys are ever written to the blockchain.
- **AES-256-GCM Encryption:** Off-chain files are encrypted using Galois/Counter Mode (GCM), providing authenticated encryption that prevents unauthorized tampering.
- **Cryptographic Tamper-Proof Verification:** Document integrity is checked via SHA-256 before encryption and validated upon decryption.
- **On-Chain Authorization Verification:** The backend strictly queries the smart contract before decrypting any document.
- **Wallet Nonce Challenge:** Session tokens are authenticated through EIP-1193 signed challenges.

---

## 18. Future Enhancements

- **IPFS / Decentralized Storage:** Replace server disk storage with decentralized IPFS/Filecoin pinning.
- **Zero-Knowledge Proofs (ZKP):** Implement zk-SNARKs for selective disclosure (e.g., proving blood group without revealing clinical notes).
- **Client-Side Key Derivation:** Use Web3 wallet public-key encryption (ECIES) so the server never handles decryption keys.

---

## 19. Contributors

- **Author / Developer:** Shreyank ([@shreyanck](https://github.com/shreyanck))
- **Course:** Blockchain Network Technology
- **Institution:** College of Engineering
- **Project Type:** Academic Mini-Project

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
