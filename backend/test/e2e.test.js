const http = require("http");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { ethers } = require("ethers");
const { calculateSHA256 } = require("../src/utils/crypto");

const RPC_URL = "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Contract info
const contractInfo = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/config/contractInfo.json"), "utf8")
);

async function runE2ETest() {
  console.log("==================================================");
  console.log("STARTING END-TO-END BLOCKCHAIN EMR INTEGRATION TEST");
  console.log("==================================================");

  // Signers from Hardhat node
  const adminSigner = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider
  );
  const doctorSigner = new ethers.Wallet(
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    provider
  );
  const patientSigner = new ethers.Wallet(
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    provider
  );

  console.log("Admin Address:  ", adminSigner.address);
  console.log("Doctor Address: ", doctorSigner.address);
  console.log("Patient Address:", patientSigner.address);

  const contract = new ethers.Contract(contractInfo.contractAddress, contractInfo.abi, provider);

  // 1. Verify User Roles on Blockchain
  console.log("\n[TEST 1] Verifying On-Chain User Roles...");
  const adminRole = await contract.getUser(adminSigner.address);
  const doctorRole = await contract.getUser(doctorSigner.address);
  const patientRole = await contract.getUser(patientSigner.address);

  console.log(`  Admin Role:   ${adminRole[0]} (${adminRole[1]})`);
  console.log(`  Doctor Role:  ${doctorRole[0]} (${doctorRole[1]})`);
  console.log(`  Patient Role: ${patientRole[0]} (${patientRole[1]})`);

  assert.strictEqual(Number(adminRole[0]), 4, "Deployer must be ADMIN");
  assert.strictEqual(Number(doctorRole[0]), 2, "Doctor must be DOCTOR");
  assert.strictEqual(Number(patientRole[0]), 1, "Patient must be PATIENT");
  console.log("  [PASS] All on-chain roles verified.");

  // Helper to send tx with fresh nonce
  async function sendTx(signer, method, ...args) {
    const nonce = await provider.getTransactionCount(signer.address, "pending");
    const tx = await contract.connect(signer)[method](...args, { nonce });
    return await tx.wait();
  }

  // 2. Patient registers medical record on-chain
  console.log("\n[TEST 2] Patient Registers Record on-chain...");
  const recordId = `REC-TEST-${Date.now()}`;
  const dummyFileContent = Buffer.from(
    "PATIENT HEALTH SUMMARY\nPatient: Robert Miller\nBlood Group: O+\nAllergies: Penicillin",
    "utf8"
  );
  const fileHash = calculateSHA256(dummyFileContent);
  const category = "Health Summary";

  const receipt = await sendTx(patientSigner, "addRecord", recordId, fileHash, category);
  console.log("  Transaction Hash:", receipt.hash);

  const recordOnChain = await contract.getRecord(recordId);
  assert.strictEqual(recordOnChain.recordId, recordId);
  assert.strictEqual(recordOnChain.patient, patientSigner.address);
  assert.strictEqual(recordOnChain.fileHash, fileHash);
  console.log("  [PASS] Record anchored with SHA-256 on blockchain.");

  // 3. Verify Doctor has NO access before permission is granted
  console.log("\n[TEST 3] Verifying Doctor has NO access before consent...");
  const hasAccessBefore = await contract.hasValidAccess(
    patientSigner.address,
    doctorSigner.address,
    recordId
  );
  assert.strictEqual(hasAccessBefore, false, "Doctor must not have access before grant");
  console.log("  [PASS] hasValidAccess correctly returned false.");

  // 4. Patient Grants Access to Doctor on-chain
  console.log("\n[TEST 4] Patient Grants Access to Doctor with Expiry...");
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  await sendTx(patientSigner, "grantAccess", doctorSigner.address, recordId, expiry);

  const hasAccessAfter = await contract.hasValidAccess(
    patientSigner.address,
    doctorSigner.address,
    recordId
  );
  assert.strictEqual(hasAccessAfter, true, "Doctor must have access after grant");
  console.log("  [PASS] hasValidAccess correctly returned true.");

  // 5. Authorized Doctor Logs Access on-chain
  console.log("\n[TEST 5] Doctor Logs Record Access...");
  await sendTx(doctorSigner, "logRecordAccess", patientSigner.address, recordId);
  console.log("  [PASS] Doctor successfully logged access event on-chain.");

  // 6. Patient Revokes Access on-chain
  console.log("\n[TEST 6] Patient Revokes Access...");
  await sendTx(patientSigner, "revokeAccess", doctorSigner.address, recordId);

  const hasAccessAfterRevoke = await contract.hasValidAccess(
    patientSigner.address,
    doctorSigner.address,
    recordId
  );
  assert.strictEqual(hasAccessAfterRevoke, false, "Doctor must NOT have access after revocation");
  console.log("  [PASS] hasValidAccess correctly returned false after revocation.");

  // 7. Verify Blockchain Audit Logs
  console.log("\n[TEST 7] Querying All Blockchain Audit Events...");
  const filter = contract.filters.RecordAccessed();
  const accessEvents = await contract.queryFilter(filter, 0, "latest");
  assert.ok(accessEvents.length > 0, "Should have at least 1 RecordAccessed event");
  console.log(`  Found ${accessEvents.length} RecordAccessed events on-chain.`);
  console.log("  [PASS] Blockchain audit log query successful.");

  console.log("\n==================================================");
  console.log("ALL 7 END-TO-END WORKFLOW INTEGRATION TESTS PASSED!");
  console.log("==================================================");
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
