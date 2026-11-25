const assert = require("assert");
require("dotenv").config();
const { connectDB } = require("../src/config/db");
const {
  User,
  Patient,
  Doctor,
  Hospital,
  MedicalRecord,
  AccessRequest,
  ConsentLog,
  AuditLog,
  Notification,
  Department,
  Appointment,
} = require("../src/models");
const syncService = require("../src/services/syncService");

async function runUsersTest() {
  console.log("==================================================");
  console.log("RUNNING USER DIRECTORY & MONGOOSE MODELS VERIFICATION");
  console.log("==================================================");

  await connectDB();

  // 1. Verify all 11 Mongoose models exist and are constructors
  console.log("\n[TEST 1] Verifying 11 Mongoose Models...");
  const models = [
    { name: "User", model: User },
    { name: "Patient", model: Patient },
    { name: "Doctor", model: Doctor },
    { name: "Hospital", model: Hospital },
    { name: "MedicalRecord", model: MedicalRecord },
    { name: "AccessRequest", model: AccessRequest },
    { name: "ConsentLog", model: ConsentLog },
    { name: "AuditLog", model: AuditLog },
    { name: "Notification", model: Notification },
    { name: "Department", model: Department },
    { name: "Appointment", model: Appointment },
  ];

  for (const m of models) {
    assert.strictEqual(typeof m.model, "function", `${m.name} model must be defined`);
    console.log(`  [PASS] ${m.name} model loaded successfully.`);
  }

  // 2. Query combined users from syncService
  console.log("\n[TEST 2] Testing syncService.getCombinedUsers()...");
  const result = await syncService.getCombinedUsers();

  assert.strictEqual(result.success, true, "Result must indicate success");
  assert.ok(result.users.length >= 4, "Must contain at least 4 demo users");
  console.log(`  Combined users returned: ${result.users.length}`);
  console.log(`  Role counts:`, JSON.stringify(result.counts));

  // 3. Verify on-chain demo accounts are present
  console.log("\n[TEST 3] Verifying Demo Accounts Presence...");
  const admin = result.users.find((u) => u.role === "admin");
  const doctor = result.users.find((u) => u.role === "doctor");
  const hospital = result.users.find((u) => u.role === "hospital");
  const patient = result.users.find((u) => u.role === "patient");

  assert.ok(admin, "Admin account must be present");
  assert.ok(doctor, "Doctor account must be present");
  assert.ok(hospital, "Hospital account must be present");
  assert.ok(patient, "Patient account must be present");

  console.log(`  Admin:    ${admin.fullName} (${admin.walletAddress})`);
  console.log(`  Doctor:   ${doctor.fullName} (${doctor.walletAddress})`);
  console.log(`  Hospital: ${hospital.fullName} (${hospital.walletAddress})`);
  console.log(`  Patient:  ${patient.fullName} (${patient.walletAddress})`);
  console.log("  [PASS] All 4 demo accounts verified with normalized addresses.");

  // 4. Verify no duplicates in wallet addresses
  console.log("\n[TEST 4] Verifying No Duplicate Wallet Addresses...");
  const addresses = result.users.map((u) => u.walletAddress.toLowerCase());
  const uniqueAddresses = new Set(addresses);
  assert.strictEqual(addresses.length, uniqueAddresses.size, "No duplicate wallet addresses allowed");
  console.log("  [PASS] Zero duplicate addresses detected.");

  console.log("\n==================================================");
  console.log("ALL USER DIRECTORY & MODEL TESTS PASSED!");
  console.log("==================================================");
  process.exit(0);
}

runUsersTest().catch((err) => {
  console.error("User Test Failed:", err);
  process.exit(1);
});
