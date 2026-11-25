const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MedicalRecordAccess Smart Contract", function () {
  let contract;
  let admin, doctor, hospital, patient, unauthorized;

  const RECORD_ID_1 = "REC-1001";
  const FILE_HASH_1 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const CATEGORY_1 = "Cardiology Report";

  beforeEach(async function () {
    [admin, doctor, hospital, patient, unauthorized] = await ethers.getSigners();

    const MedicalRecordAccess = await ethers.getContractFactory("MedicalRecordAccess");
    contract = await MedicalRecordAccess.deploy();
    await contract.waitForDeployment();
  });

  describe("1. Deployment & Roles Initialization", function () {
    it("Should set deployer as Admin", async function () {
      expect(await contract.admin()).to.equal(admin.address);
      const user = await contract.getUser(admin.address);
      expect(user.role).to.equal(4); // Role.ADMIN
      expect(user.isActive).to.be.true;
    });
  });

  describe("2. User Registration", function () {
    it("Should allow a patient to self-register and emit UserRegistered event", async function () {
      await expect(contract.connect(patient).registerPatient("John Doe"))
        .to.emit(contract, "UserRegistered")
        .withArgs(patient.address, 1, "John Doe", (val) => val > 0);

      const user = await contract.getUser(patient.address);
      expect(user.role).to.equal(1); // Role.PATIENT
      expect(user.name).to.equal("John Doe");

      const patients = await contract.getRegisteredPatients();
      expect(patients).to.include(patient.address);
    });

    it("Should reject self-registration if name is empty", async function () {
      await expect(
        contract.connect(patient).registerPatient("")
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should reject duplicate registration for the same address", async function () {
      await contract.connect(patient).registerPatient("John Doe");
      await expect(
        contract.connect(patient).registerPatient("John Doe Again")
      ).to.be.revertedWith("Address already registered");
    });

    it("Should allow admin to register a doctor", async function () {
      await expect(contract.connect(admin).registerDoctor(doctor.address, "Dr. Alice Smith"))
        .to.emit(contract, "UserRegistered")
        .withArgs(doctor.address, 2, "Dr. Alice Smith", (val) => val > 0);

      const user = await contract.getUser(doctor.address);
      expect(user.role).to.equal(2); // Role.DOCTOR
      expect(user.name).to.equal("Dr. Alice Smith");

      const doctors = await contract.getRegisteredDoctors();
      expect(doctors).to.include(doctor.address);
    });

    it("Should allow admin to register a hospital", async function () {
      await expect(contract.connect(admin).registerHospital(hospital.address, "Metro General Hospital"))
        .to.emit(contract, "UserRegistered")
        .withArgs(hospital.address, 3, "Metro General Hospital", (val) => val > 0);

      const user = await contract.getUser(hospital.address);
      expect(user.role).to.equal(3); // Role.HOSPITAL
      expect(user.name).to.equal("Metro General Hospital");

      const hospitals = await contract.getRegisteredHospitals();
      expect(hospitals).to.include(hospital.address);
    });

    it("Should prevent non-admin from registering doctor or hospital", async function () {
      await expect(
        contract.connect(unauthorized).registerDoctor(doctor.address, "Dr. Fake")
      ).to.be.revertedWith("Only admin can perform this action");

      await expect(
        contract.connect(unauthorized).registerHospital(hospital.address, "Fake Hospital")
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("3. Medical Record Registration", function () {
    beforeEach(async function () {
      await contract.connect(patient).registerPatient("John Doe");
    });

    it("Should allow a registered patient to add a medical record reference", async function () {
      await expect(
        contract.connect(patient).addRecord(RECORD_ID_1, FILE_HASH_1, CATEGORY_1)
      )
        .to.emit(contract, "RecordAdded")
        .withArgs(patient.address, RECORD_ID_1, FILE_HASH_1, CATEGORY_1, (v) => v > 0);

      const rec = await contract.getRecord(RECORD_ID_1);
      expect(rec.recordId).to.equal(RECORD_ID_1);
      expect(rec.patient).to.equal(patient.address);
      expect(rec.fileHash).to.equal(FILE_HASH_1);
      expect(rec.category).to.equal(CATEGORY_1);
      expect(rec.exists).to.be.true;

      const ids = await contract.getPatientRecordIds(patient.address);
      expect(ids).to.include(RECORD_ID_1);
    });

    it("Should prevent non-patients from adding records", async function () {
      await expect(
        contract.connect(unauthorized).addRecord(RECORD_ID_1, FILE_HASH_1, CATEGORY_1)
      ).to.be.revertedWith("Only registered patients can perform this action");
    });

    it("Should prevent duplicate record IDs", async function () {
      await contract.connect(patient).addRecord(RECORD_ID_1, FILE_HASH_1, CATEGORY_1);
      await expect(
        contract.connect(patient).addRecord(RECORD_ID_1, FILE_HASH_1, CATEGORY_1)
      ).to.be.revertedWith("Record ID already exists");
    });
  });

  describe("4. Access Control (Grant, Verify, Revoke)", function () {
    beforeEach(async function () {
      await contract.connect(patient).registerPatient("John Doe");
      await contract.connect(admin).registerDoctor(doctor.address, "Dr. Alice Smith");
      await contract.connect(admin).registerHospital(hospital.address, "Metro Hospital");
      await contract.connect(patient).addRecord(RECORD_ID_1, FILE_HASH_1, CATEGORY_1);
    });

    it("Patient always has access to their own record", async function () {
      const hasAccess = await contract.hasValidAccess(patient.address, patient.address, RECORD_ID_1);
      expect(hasAccess).to.be.true;
    });

    it("Doctor should NOT have access before grant", async function () {
      const hasAccess = await contract.hasValidAccess(patient.address, doctor.address, RECORD_ID_1);
      expect(hasAccess).to.be.false;
    });

    it("Should allow patient to grant access with expiry to a doctor", async function () {
      const latestTime = await time.latest();
      const expiry = latestTime + 3600; // 1 hour from now

      await expect(
        contract.connect(patient).grantAccess(doctor.address, RECORD_ID_1, expiry)
      )
        .to.emit(contract, "AccessGranted")
        .withArgs(patient.address, doctor.address, RECORD_ID_1, expiry, (v) => v > 0);

      const hasAccess = await contract.hasValidAccess(patient.address, doctor.address, RECORD_ID_1);
      expect(hasAccess).to.be.true;

      const perm = await contract.getAccessPermission(patient.address, doctor.address, RECORD_ID_1);
      expect(perm.isGranted).to.be.true;
      expect(perm.expiryTimestamp).to.equal(expiry);
    });

    it("Should reject granting access to non-doctor / non-hospital", async function () {
      await expect(
        contract.connect(patient).grantAccess(unauthorized.address, RECORD_ID_1, 0)
      ).to.be.revertedWith("Requester must be a registered doctor or hospital");
    });

    it("Should reject granting access if not record owner", async function () {
      await expect(
        contract.connect(doctor).grantAccess(doctor.address, RECORD_ID_1, 0)
      ).to.be.revertedWith("You are not the owner of this record");
    });

    it("Should invalidate access after permission has expired", async function () {
      const latestTime = await time.latest();
      const expiry = latestTime + 100; // expires in 100 seconds

      await contract.connect(patient).grantAccess(doctor.address, RECORD_ID_1, expiry);
      expect(await contract.hasValidAccess(patient.address, doctor.address, RECORD_ID_1)).to.be.true;

      // Fast forward time past expiry
      await time.increase(101);

      expect(await contract.hasValidAccess(patient.address, doctor.address, RECORD_ID_1)).to.be.false;
    });

    it("Should allow patient to revoke access immediately", async function () {
      await contract.connect(patient).grantAccess(doctor.address, RECORD_ID_1, 0);
      expect(await contract.hasValidAccess(patient.address, doctor.address, RECORD_ID_1)).to.be.true;

      await expect(
        contract.connect(patient).revokeAccess(doctor.address, RECORD_ID_1)
      )
        .to.emit(contract, "AccessRevoked")
        .withArgs(patient.address, doctor.address, RECORD_ID_1, (v) => v > 0);

      expect(await contract.hasValidAccess(patient.address, doctor.address, RECORD_ID_1)).to.be.false;
    });

    it("Should allow authorized doctor to log access audit event", async function () {
      await contract.connect(patient).grantAccess(doctor.address, RECORD_ID_1, 0);

      await expect(
        contract.connect(doctor).logRecordAccess(patient.address, RECORD_ID_1)
      )
        .to.emit(contract, "RecordAccessed")
        .withArgs(patient.address, doctor.address, RECORD_ID_1, (v) => v > 0);
    });

    it("Should revert logRecordAccess if doctor has no access", async function () {
      await expect(
        contract.connect(doctor).logRecordAccess(patient.address, RECORD_ID_1)
      ).to.be.revertedWith("Caller does not have valid access permission");
    });
  });
});
