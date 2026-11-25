const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--------------------------------------------------");
  console.log("Deploying MedicalRecordAccess smart contract...");

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
