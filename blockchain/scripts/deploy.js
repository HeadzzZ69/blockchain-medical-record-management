const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--------------------------------------------------");
  console.log("Deploying MedicalRecordAccess smart contract to local network...");

  const [deployer, testDoctor, testHospital, testPatient] = await hre.ethers.getSigners();
  console.log("Deployer / Admin Address:", deployer.address);

  const MedicalRecordAccess = await hre.ethers.getContractFactory("MedicalRecordAccess");
  const contract = await MedicalRecordAccess.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(">>> MedicalRecordAccess deployed successfully to:", contractAddress);

  // Pre-seed default demo accounts for smooth faculty evaluation
  if (testDoctor) {
    console.log("Pre-registering Demo Doctor:", testDoctor.address);
    const txDoc = await contract.registerDoctor(testDoctor.address, "Dr. Sarah Jenkins (Cardiology)");
    await txDoc.wait();
  }

  if (testHospital) {
    console.log("Pre-registering Demo Hospital:", testHospital.address);
    const txHosp = await contract.registerHospital(testHospital.address, "Apollo Multi-Specialty Hospital");
    await txHosp.wait();
  }

  if (testPatient) {
    console.log("Pre-registering Demo Patient:", testPatient.address);
    const txPat = await contract.connect(testPatient).registerPatient("Robert Miller");
    await txPat.wait();

    console.log("Pre-registering default medical records on-chain for Demo Patient 1...");
    const demoRecords = [
      {
        id: "REC-2026-001",
        hash: "0x7398c30cb05d15071ea2ad172b51198ebeb2fd183d574e5f91ff2c9167eab585",
        cat: "Cardiology",
      },
      {
        id: "REC-2026-002",
        hash: "0x8409d41dc16e26182fb3be2209fce70a3db9fd194e6f02ff3d81a81bc26fbc96",
        cat: "Cardiology",
      },
      {
        id: "REC-2026-003",
        hash: "0x9510e52ed27f37293ac4cf3310ad081b4ec00e2a5f7013004e92b92cd370cd07",
        cat: "Pathology",
      },
      {
        id: "REC-2026-004",
        hash: "0xa621f63fe380483a4bd5d04421be192c5fd11f3b608124115fa3ca3de481de18",
        cat: "Radiology",
      },
      {
        id: "REC-2026-005",
        hash: "0xb7320740f491594b5ce6e15532cf2a3d60e2204c7192352260b4db4ef592ef29",
        cat: "Cardiology",
      },
      {
        id: "REC-2026-006",
        hash: "0xc843185105a2605c6df7f26643d03b4e71f3315d82a3463371c5ec5f06a3f03a",
        cat: "Pathology",
      },
    ];

    for (const rec of demoRecords) {
      const txRec = await contract.connect(testPatient).addRecord(rec.id, rec.hash, rec.cat);
      await txRec.wait();
      console.log(`   - Anchored on-chain: ${rec.id} (${rec.cat})`);
    }

    // Pre-grant access for REC-2026-001 to Doctor and Hospital for demonstration
    const expiry = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
    if (testDoctor) {
      const txGrantDoc = await contract.connect(testPatient).grantAccess(testDoctor.address, "REC-2026-001", expiry);
      await txGrantDoc.wait();
      console.log("   - Pre-granted REC-2026-001 to Doctor 1 on smart contract.");
    }

    if (testHospital) {
      const txGrantHosp = await contract.connect(testPatient).grantAccess(testHospital.address, "REC-2026-001", expiry);
      await txGrantHosp.wait();
      console.log("   - Pre-granted REC-2026-001 to Hospital 1 on smart contract.");
    }
  }

  // Get contract artifact ABI
  const artifact = await hre.artifacts.readArtifact("MedicalRecordAccess");

  const deploymentData = {
    contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    adminAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    demoAccounts: {
      admin: deployer.address,
      doctor: testDoctor ? testDoctor.address : null,
      hospital: testHospital ? testHospital.address : null,
      patient: testPatient ? testPatient.address : null,
    },
    abi: artifact.abi,
  };

  // Export to blockchain directory
  const blockchainExportPath = path.join(__dirname, "..", "deployedAddress.json");
  fs.writeFileSync(blockchainExportPath, JSON.stringify(deploymentData, null, 2));
  console.log("Saved deployment info to:", blockchainExportPath);

  // Export to backend config
  const backendConfigDir = path.join(__dirname, "..", "..", "backend", "src", "config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }
  const backendExportPath = path.join(backendConfigDir, "contractInfo.json");
  fs.writeFileSync(backendExportPath, JSON.stringify(deploymentData, null, 2));
  console.log("Saved deployment info to:", backendExportPath);

  // Export to frontend contracts
  const frontendConfigDir = path.join(__dirname, "..", "..", "frontend", "src", "contracts");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  const frontendExportPath = path.join(frontendConfigDir, "contractInfo.json");
  fs.writeFileSync(frontendExportPath, JSON.stringify(deploymentData, null, 2));
  console.log("Saved deployment info to:", frontendExportPath);

  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
