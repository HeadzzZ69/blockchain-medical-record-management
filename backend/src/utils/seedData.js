const fs = require("fs");
const path = require("path");
const {
  User,
  Patient,
  Doctor,
  Hospital,
  Department,
  MedicalRecord,
  Prescription,
  LabReport,
  Consultation,
  Appointment,
  AccessRequest,
  AuditLog,
  ConsentLog,
  Notification,
} = require("../models");
const { encryptBuffer, calculateSHA256 } = require("./crypto");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// Standard Hardhat demo wallets
const WALLETS = {
  admin: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  doctor1: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", // Dr. Sarah Jenkins (Cardiology)
  doctor2: "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f", // Dr. Alexander Patel (Neurology)
  doctor3: "0xa0ee7a142d267c1f36714e4a8f75612f20a79720", // Dr. Elena Rostova (Orthopedics)
  doctor4: "0xbcd4042de499d14e55001ccbb24a551f3a9ee40e", // Dr. David Kim (Oncology)
  doctor5: "0x71be63f3384f5fb98995898a86b02fb2426c5788", // Dr. Rachel Green (Pediatrics)
  hospital1: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", // Apollo Multi-Specialty Hospital
  hospital2: "0xfabb0ac9d68b0b445fb7357272ff202c5651694a", // Metro General Hospital
  hospital3: "0x1cbd3e2b9ac1322096542107574a7b2a036556d8", // St. Jude Research Center
  patient1: "0x90f79bf6eb2c4f870365e785982e1f101e93b906", // Robert Miller
  patient2: "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65", // Emily Davis
  patient3: "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc", // Michael Chang
  patient4: "0x976ea74026e72cd55542b04746643c1149d39b32", // Sophia Rodriguez
  patient5: "0x14dc79964da2c08b23698b3d3cc7ca32193d9955", // James Wilson
};

async function seedComprehensiveDemoData(force = false) {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const existingUsers = await User.countDocuments();
    const existingRecords = await MedicalRecord.countDocuments();
    if (existingUsers >= 14 && existingRecords >= 15 && !force) {
      console.log(`[Seed] Demo data already populated (${existingUsers} users, ${existingRecords} records). Skipping.`);
      return;
    }

    console.log("[Seed] Starting comprehensive realistic demo data population...");

    // 1. Seed Users (1 Admin, 5 Doctors, 3 Hospitals, 5 Patients)
    const users = [
      {
        walletAddress: WALLETS.admin,
        fullName: "System Administrator",
        name: "System Administrator",
        email: "admin@medvault.network",
        phone: "+1 (555) 010-0001",
        role: "admin",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      // Doctors
      {
        walletAddress: WALLETS.doctor1,
        fullName: "Dr. Sarah Jenkins",
        name: "Dr. Sarah Jenkins",
        email: "dr.sarah@apollo.org",
        phone: "+1 (555) 010-0002",
        role: "doctor",
        specialization: "Cardiology",
        hospitalName: "Apollo Multi-Specialty Hospital",
        licenseNumber: "MED-CARD-2026-081",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      {
        walletAddress: WALLETS.doctor2,
        fullName: "Dr. Alexander Patel",
        name: "Dr. Alexander Patel",
        email: "dr.patel@metrohealth.org",
        phone: "+1 (555) 010-0003",
        role: "doctor",
        specialization: "Neurology",
        hospitalName: "Metro General Hospital",
        licenseNumber: "MED-NEUR-2026-114",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      {
        walletAddress: WALLETS.doctor3,
        fullName: "Dr. Elena Rostova",
        name: "Dr. Elena Rostova",
        email: "dr.rostova@apollo.org",
        phone: "+1 (555) 010-0004",
        role: "doctor",
        specialization: "Orthopedics",
        hospitalName: "Apollo Multi-Specialty Hospital",
        licenseNumber: "MED-ORTH-2026-302",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      {
        walletAddress: WALLETS.doctor4,
        fullName: "Dr. David Kim",
        name: "Dr. David Kim",
        email: "dr.kim@stjude-health.org",
        phone: "+1 (555) 010-0005",
        role: "doctor",
        specialization: "Oncology",
        hospitalName: "St. Jude Research Center",
        licenseNumber: "MED-ONCO-2026-445",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      {
        walletAddress: WALLETS.doctor5,
        fullName: "Dr. Rachel Green",
        name: "Dr. Rachel Green",
        email: "dr.green@metrohealth.org",
        phone: "+1 (555) 010-0006",
        role: "doctor",
        specialization: "Pediatrics",
        hospitalName: "Metro General Hospital",
        licenseNumber: "MED-PED-2026-512",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      // Hospitals
      {
        walletAddress: WALLETS.hospital1,
        fullName: "Apollo Multi-Specialty Hospital",
        name: "Apollo Multi-Specialty Hospital",
        email: "contact@apollo.org",
        phone: "+1 (555) 020-0001",
        role: "hospital",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      {
        walletAddress: WALLETS.hospital2,
        fullName: "Metro General Hospital",
        name: "Metro General Hospital",
        email: "info@metrohealth.org",
        phone: "+1 (555) 020-0002",
        role: "hospital",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      {
        walletAddress: WALLETS.hospital3,
        fullName: "St. Jude Research Center",
        name: "St. Jude Research Center",
        email: "admin@stjude-health.org",
        phone: "+1 (555) 020-0003",
        role: "hospital",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      // Patients
      {
        walletAddress: WALLETS.patient1,
        fullName: "Robert Miller",
        name: "Robert Miller",
        email: "robert.miller@gmail.com",
        phone: "+1 (555) 030-0001",
        role: "patient",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      {
        walletAddress: WALLETS.patient2,
        fullName: "Emily Davis",
        name: "Emily Davis",
        email: "emily.davis@outlook.com",
        phone: "+1 (555) 030-0002",
        role: "patient",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      {
        walletAddress: WALLETS.patient3,
        fullName: "Michael Chang",
        name: "Michael Chang",
        email: "michael.chang@yahoo.com",
        phone: "+1 (555) 030-0003",
        role: "patient",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      {
        walletAddress: WALLETS.patient4,
        fullName: "Sophia Rodriguez",
        name: "Sophia Rodriguez",
        email: "sophia.rodriguez@icloud.com",
        phone: "+1 (555) 030-0004",
        role: "patient",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
      {
        walletAddress: WALLETS.patient5,
        fullName: "James Wilson",
        name: "James Wilson",
        email: "james.wilson@gmail.com",
        phone: "+1 (555) 030-0005",
        role: "patient",
        isVerifiedOnChain: true,
        accountStatus: "active",
      },
    ];

    for (const u of users) {
      await User.findOneAndUpdate({ walletAddress: u.walletAddress }, u, { upsert: true, new: true });
    }

    // 2. Seed Doctor model records
    const doctorsData = [
      {
        doctorId: "DOC-2026-001",
        walletAddress: WALLETS.doctor1,
        fullName: "Dr. Sarah Jenkins",
        specialization: "Cardiology",
        medicalLicenseNumber: "MED-CARD-2026-081",
        qualification: "MBBS, MD (Cardiology), FACC",
        experience: "12 Years",
        hospitalName: "Apollo Multi-Specialty Hospital",
        email: "dr.sarah@apollo.org",
        phone: "+1 (555) 010-0002",
        verificationStatus: "verified",
      },
      {
        doctorId: "DOC-2026-002",
        walletAddress: WALLETS.doctor2,
        fullName: "Dr. Alexander Patel",
        specialization: "Neurology",
        medicalLicenseNumber: "MED-NEUR-2026-114",
        qualification: "MBBS, DM (Neurology)",
        experience: "15 Years",
        hospitalName: "Metro General Hospital",
        email: "dr.patel@metrohealth.org",
        phone: "+1 (555) 010-0003",
        verificationStatus: "verified",
      },
      {
        doctorId: "DOC-2026-003",
        walletAddress: WALLETS.doctor3,
        fullName: "Dr. Elena Rostova",
        specialization: "Orthopedics",
        medicalLicenseNumber: "MED-ORTH-2026-302",
        qualification: "MBBS, MS (Orthopedics), FRCS",
        experience: "9 Years",
        hospitalName: "Apollo Multi-Specialty Hospital",
        email: "dr.rostova@apollo.org",
        phone: "+1 (555) 010-0004",
        verificationStatus: "verified",
      },
      {
        doctorId: "DOC-2026-004",
        walletAddress: WALLETS.doctor4,
        fullName: "Dr. David Kim",
        specialization: "Oncology",
        medicalLicenseNumber: "MED-ONCO-2026-445",
        qualification: "MD, PhD (Medical Oncology)",
        experience: "14 Years",
        hospitalName: "St. Jude Research Center",
        email: "dr.kim@stjude-health.org",
        phone: "+1 (555) 010-0005",
        verificationStatus: "verified",
      },
      {
        doctorId: "DOC-2026-005",
        walletAddress: WALLETS.doctor5,
        fullName: "Dr. Rachel Green",
        specialization: "Pediatrics",
        medicalLicenseNumber: "MED-PED-2026-512",
        qualification: "MBBS, DCH, MD (Pediatrics)",
        experience: "8 Years",
        hospitalName: "Metro General Hospital",
        email: "dr.green@metrohealth.org",
        phone: "+1 (555) 010-0006",
        verificationStatus: "verified",
      },
    ];

    for (const d of doctorsData) {
      await Doctor.findOneAndUpdate({ walletAddress: d.walletAddress }, d, { upsert: true, new: true });
    }

    // 3. Seed Hospital model records
    const hospitalsData = [
      {
        hospitalId: "HOSP-2026-001",
        walletAddress: WALLETS.hospital1,
        hospitalName: "Apollo Multi-Specialty Hospital",
        registrationNumber: "REG-HOSP-APOLLO-9021",
        address: "742 Evergreen Terrace, Medical District, Springfield",
        email: "contact@apollo.org",
        phone: "+1 (555) 020-0001",
        department: ["Cardiology", "Orthopedics", "Emergency Care", "Radiology", "General Medicine"],
        verificationStatus: "verified",
      },
      {
        hospitalId: "HOSP-2026-002",
        walletAddress: WALLETS.hospital2,
        hospitalName: "Metro General Hospital",
        registrationNumber: "REG-HOSP-METRO-4182",
        address: "100 Grand Concourse, Metro Center, New York",
        email: "info@metrohealth.org",
        phone: "+1 (555) 020-0002",
        department: ["Neurology", "Pediatrics", "Internal Medicine", "Oncology"],
        verificationStatus: "verified",
      },
      {
        hospitalId: "HOSP-2026-003",
        walletAddress: WALLETS.hospital3,
        hospitalName: "St. Jude Research Center",
        registrationNumber: "REG-HOSP-STJUDE-7719",
        address: "262 Danny Thomas Place, Memphis, TN",
        email: "admin@stjude-health.org",
        phone: "+1 (555) 020-0003",
        department: ["Oncology", "Hematology", "Immunology", "Clinical Research"],
        verificationStatus: "verified",
      },
    ];

    for (const h of hospitalsData) {
      await Hospital.findOneAndUpdate({ walletAddress: h.walletAddress }, h, { upsert: true, new: true });
    }

    // 4. Seed Departments
    const departmentsData = [
      {
        departmentId: "DEPT-CARD-01",
        hospitalWallet: WALLETS.hospital1,
        departmentName: "Cardiology & Vascular Surgery",
        description: "Comprehensive cardiac diagnostics, stress testing, catheterization, and post-op care.",
        headDoctorWallet: WALLETS.doctor1,
        doctors: [WALLETS.doctor1],
        status: "active",
      },
      {
        departmentId: "DEPT-ORTH-01",
        hospitalWallet: WALLETS.hospital1,
        departmentName: "Orthopedic Surgery & Rehabilitation",
        description: "Joint replacements, sports injury management, trauma reconstruction, and spinal therapies.",
        headDoctorWallet: WALLETS.doctor3,
        doctors: [WALLETS.doctor3],
        status: "active",
      },
      {
        departmentId: "DEPT-NEUR-01",
        hospitalWallet: WALLETS.hospital2,
        departmentName: "Neurology & Neurosciences",
        description: "Advanced EEG diagnostics, neurovascular care, migraine clinic, and seizure management.",
        headDoctorWallet: WALLETS.doctor2,
        doctors: [WALLETS.doctor2],
        status: "active",
      },
      {
        departmentId: "DEPT-PED-01",
        hospitalWallet: WALLETS.hospital2,
        departmentName: "Pediatrics & Child Wellness",
        description: "Newborn screening, pediatric vaccinations, growth monitoring, and adolescent medicine.",
        headDoctorWallet: WALLETS.doctor5,
        doctors: [WALLETS.doctor5],
        status: "active",
      },
      {
        departmentId: "DEPT-ONCO-01",
        hospitalWallet: WALLETS.hospital3,
        departmentName: "Comprehensive Oncology & Cellular Therapy",
        description: "Precision chemotherapy regimens, immunotherapy trials, and multidisciplinary tumor board reviews.",
        headDoctorWallet: WALLETS.doctor4,
        doctors: [WALLETS.doctor4],
        status: "active",
      },
    ];

    for (const dept of departmentsData) {
      await Department.findOneAndUpdate({ departmentId: dept.departmentId }, dept, { upsert: true, new: true });
    }

    // 5. Seed Patients
    const patientsData = [
      {
        patientId: "PAT-2026-001",
        walletAddress: WALLETS.patient1,
        fullName: "Robert Miller",
        dateOfBirth: "1988-06-14",
        gender: "Male",
        bloodGroup: "O+",
        address: "452 Maple Avenue, Springfield",
        phone: "+1 (555) 030-0001",
        email: "robert.miller@gmail.com",
        emergencyContact: {
          name: "Jessica Miller",
          phone: "+1 (555) 030-9988",
          relation: "Spouse",
        },
        allergies: ["Penicillin", "Sulfa drugs"],
        existingConditions: ["Hypertension (Grade 1)", "Mild Asthma"],
        medicalHistory: [
          {
            condition: "Essential Hypertension",
            diagnosedDate: "2021-03-10",
            status: "Managed",
            notes: "Stable on daily Telmisartan 40mg. Regular BP checks normal.",
          },
          {
            condition: "Seasonal Bronchospasm",
            diagnosedDate: "2019-11-04",
            status: "Mild",
            notes: "Inhaler PRN during seasonal pollen spikes.",
          },
        ],
      },
      {
        patientId: "PAT-2026-002",
        walletAddress: WALLETS.patient2,
        fullName: "Emily Davis",
        dateOfBirth: "1994-09-22",
        gender: "Female",
        bloodGroup: "A+",
        address: "789 Pine Ridge Rd, Metro District",
        phone: "+1 (555) 030-0002",
        email: "emily.davis@outlook.com",
        emergencyContact: {
          name: "Mark Davis",
          phone: "+1 (555) 030-8877",
          relation: "Brother",
        },
        allergies: ["Aspirin", "NSAIDs"],
        existingConditions: ["Migraine with Aura", "Hypothyroidism"],
        medicalHistory: [
          {
            condition: "Chronic Migraine",
            diagnosedDate: "2022-01-15",
            status: "Active",
            notes: "Managed with Topiramate and lifestyle adjustments.",
          },
        ],
      },
      {
        patientId: "PAT-2026-003",
        walletAddress: WALLETS.patient3,
        fullName: "Michael Chang",
        dateOfBirth: "1982-12-03",
        gender: "Male",
        bloodGroup: "B+",
        address: "124 Silicon Parkway, Tech Hub",
        phone: "+1 (555) 030-0003",
        email: "michael.chang@yahoo.com",
        emergencyContact: {
          name: "Grace Chang",
          phone: "+1 (555) 030-7766",
          relation: "Spouse",
        },
        allergies: ["Latex"],
        existingConditions: ["Type 2 Diabetes Mellitus", "Dyslipidemia"],
        medicalHistory: [
          {
            condition: "Type 2 Diabetes",
            diagnosedDate: "2018-08-20",
            status: "Well-controlled",
            notes: "HbA1c maintained under 6.5% with Metformin 500mg BID.",
          },
        ],
      },
      {
        patientId: "PAT-2026-004",
        walletAddress: WALLETS.patient4,
        fullName: "Sophia Rodriguez",
        dateOfBirth: "1997-04-18",
        gender: "Female",
        bloodGroup: "AB-",
        address: "88 Sunrise Boulevard, Sunnyvale",
        phone: "+1 (555) 030-0004",
        email: "sophia.rodriguez@icloud.com",
        emergencyContact: {
          name: "Carlos Rodriguez",
          phone: "+1 (555) 030-6655",
          relation: "Father",
        },
        allergies: ["Peanuts", "Shellfish"],
        existingConditions: ["ACL Reconstruction Post-Op"],
        medicalHistory: [
          {
            condition: "Right Knee Anterior Cruciate Ligament Tear",
            diagnosedDate: "2024-05-12",
            status: "Rehabilitating",
            notes: "Successful arthroscopic repair performed at Apollo Hospital.",
          },
        ],
      },
      {
        patientId: "PAT-2026-005",
        walletAddress: WALLETS.patient5,
        fullName: "James Wilson",
        dateOfBirth: "1975-10-30",
        gender: "Male",
        bloodGroup: "O-",
        address: "33 Riverbend Crescent, Memphis",
        phone: "+1 (555) 030-0005",
        email: "james.wilson@gmail.com",
        emergencyContact: {
          name: "Linda Wilson",
          phone: "+1 (555) 030-5544",
          relation: "Spouse",
        },
        allergies: ["None known"],
        existingConditions: ["Stage 1 Lymphoma (In Remission)"],
        medicalHistory: [
          {
            condition: "Hodgkin Lymphoma",
            diagnosedDate: "2023-02-14",
            status: "In Complete Remission",
            notes: "Finished 6 cycles ABVD therapy at St. Jude; surveillance scans clear.",
          },
        ],
      },
    ];

    for (const pat of patientsData) {
      await Patient.findOneAndUpdate({ walletAddress: pat.walletAddress }, pat, { upsert: true, new: true });
    }

    // 6. Generate 16 Real Encrypted Medical Records and Write Files into backend/uploads
    const recordsManifest = [
      // Patient 1 (Robert Miller) Records - 6 records
      {
        recordId: "REC-2026-001",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Comprehensive 12-Lead Electrocardiogram (ECG)",
        fileName: "robert_miller_12lead_ecg_report.pdf",
        recordType: "Cardiology Report",
        category: "Cardiology",
        description: "Resting 12-lead ECG analysis showing normal sinus rhythm at 72 bpm, normal PR and QT intervals, no ischemic ST changes.",
        content: `CLINICAL ELECTROCARDIOGRAM REPORT
Patient: Robert Miller (DOB: 1988-06-14)
Attending Physician: Dr. Sarah Jenkins (Cardiology)
Hospital: Apollo Multi-Specialty Hospital
Date: 2026-02-15
Heart Rate: 72 bpm | PR Interval: 160 ms | QRS Duration: 88 ms | QTc: 412 ms
Rhythm: Regular sinus rhythm. Axis normal.
Conclusion: Normal 12-lead baseline electrocardiogram. No evidence of hypertrophy or acute ischemia.`,
      },
      {
        recordId: "REC-2026-002",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Transthoracic Echocardiogram (Echo) Study",
        fileName: "robert_miller_echocardiogram_evaluation.pdf",
        recordType: "Diagnostic Imaging",
        category: "Cardiology",
        description: "2D and Doppler echo revealing normal left ventricular systolic function with LVEF 62%, normal wall motion, and trace mitral regurgitation.",
        content: `ECHOCARDIOGRAPHY INVESTIGATION SUMMARY
Facility: Apollo Cardiovascular Institute
Patient: Robert Miller
LVEF: 62% | Left Atrium: 3.4 cm | Interventricular Septum: 1.0 cm
Aortic Root: Normal caliber | Mitral Valve: Structurally normal, trivial physiological regurgitation
Impression: Normal global LV systolic function. Preserved diastolic compliance. No pericardial effusion.`,
      },
      {
        recordId: "REC-2026-003",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Lipid Profile & Atherogenic Risk Panel",
        fileName: "robert_miller_advanced_lipid_panel.pdf",
        recordType: "Laboratory Report",
        category: "Pathology",
        description: "Fasting lipid panel: Total Cholesterol 185 mg/dL, HDL 54 mg/dL, LDL 108 mg/dL, Triglycerides 115 mg/dL.",
        content: `METABOLIC LAB TEST REPORT
Laboratory: Apollo Pathology Central Lab
Test: Comprehensive Lipid Panel (Fasting 12 hours)
Total Cholesterol: 185 mg/dL (Ref: < 200)
HDL Cholesterol: 54 mg/dL (Ref: > 40)
LDL Cholesterol: 108 mg/dL (Optimal < 100, Near-optimal 100-129)
Triglycerides: 115 mg/dL (Ref: < 150)
Atherogenic Ratio: 3.4 (Low Cardiovascular Risk)`,
      },
      {
        recordId: "REC-2026-004",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Chest X-Ray PA View Radiology Report",
        fileName: "robert_miller_chest_radiograph.pdf",
        recordType: "Radiology",
        category: "Radiology",
        description: "Posteroanterior projection chest X-ray displaying clear bilateral lung fields, sharp costophrenic angles, and normal cardiothoracic ratio.",
        content: `DEPARTMENT OF RADIOLOGY & IMAGING
Patient: Robert Miller
Study: Digital Radiography Chest PA
Findings: Bilateral lung parenchymal aeration is symmetrical. No consolidations, pleural effusions, or pneumothorax.
Cardiomediastinal contour is within normal limits (CTR < 0.50).
Impression: Clear radiograph of chest without acute focal cardiopulmonary abnormalities.`,
      },
      {
        recordId: "REC-2026-005",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Cardiovascular Risk Assessment & Exercise Stress Test",
        fileName: "robert_miller_tmt_stress_protocol.pdf",
        recordType: "Clinical Summary",
        category: "Cardiology",
        description: "Bruce protocol treadmill stress test completed to Stage 4 (10.2 METs). Negative for exercise-induced myocardial ischemia.",
        content: `EXERCISE TREADMILL TEST (TMT)
Target Heart Rate: 164 bpm (Achieved: 158 bpm, 96% of max predicted)
Protocol: Standard Bruce (Duration: 10 mins 12 secs)
Workload: 10.2 METs
Result: Normal hemodynamics and blood pressure response to workload. No diagnostic ST segment depressions.`,
      },
      {
        recordId: "REC-2026-006",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Complete Blood Count & Metabolic Panel",
        fileName: "robert_miller_cbc_metabolic.pdf",
        recordType: "Laboratory Report",
        category: "Pathology",
        description: "Complete blood count with differential: Hemoglobin 14.8 g/dL, WBC 6,400/uL, Platelets 240,000/uL, Creatinine 0.9 mg/dL.",
        content: `CLINICAL HEMATOLOGY PANEL
Patient: Robert Miller
Hemoglobin: 14.8 g/dL | RBC: 5.1 x10^6/uL | HCT: 44.2%
WBC Count: 6,400 /uL (Neutrophils 62%, Lymphocytes 30%, Monocytes 6%, Eosinophils 2%)
Platelet Count: 240,000 /uL
Serum Creatinine: 0.9 mg/dL | eGFR: > 90 mL/min/1.73m2`,
      },

      // Patient 2 (Emily Davis) Records - 3 records
      {
        recordId: "REC-2026-007",
        patientWallet: WALLETS.patient2,
        doctorWallet: WALLETS.doctor2,
        hospitalWallet: WALLETS.hospital2,
        recordTitle: "High-Resolution Brain MRI with Contrast",
        fileName: "emily_davis_brain_mri_scan.pdf",
        recordType: "Radiology",
        category: "Neurology",
        description: "3.0 Tesla MRI of the brain showing no acute infarction, intracranial hemorrhage, or space-occupying lesions. Normal ventricular configuration.",
        content: `NEURORADIOLOGY IMAGING CONSULTATION
Patient: Emily Davis | Ordering Physician: Dr. Alexander Patel
Study: Brain Magnetic Resonance Imaging (T1, T2, FLAIR, DWI)
Observation: No structural cortical abnormalities. Symmetrical white matter signals without demyelinating plaques.
Ventricular system and basal cisterns intact.
Conclusion: Structurally normal brain MRI. Headaches consistent with episodic migraine with aura.`,
      },
      {
        recordId: "REC-2026-008",
        patientWallet: WALLETS.patient2,
        doctorWallet: WALLETS.doctor2,
        hospitalWallet: WALLETS.hospital2,
        recordTitle: "Routine 32-Channel Video EEG Recording",
        fileName: "emily_davis_eeg_neurophysiology.pdf",
        recordType: "Diagnostic Report",
        category: "Neurology",
        description: "Standard wakefulness and photic stimulation EEG revealing well-organized 10 Hz posterior alpha background without epileptiform spikes.",
        content: `CLINICAL NEUROPHYSIOLOGY REPORT
Patient: Emily Davis
Procedure: 32-Channel Digital Electroencephalogram
Background: Symmetrical 9.5-10 Hz alpha activity in occipital leads, attenuating with eye opening.
Hyperventilation: Mild symmetric slowing without paroxysmal epileptiform discharges.
Impression: Normal interictal EEG recording.`,
      },
      {
        recordId: "REC-2026-009",
        patientWallet: WALLETS.patient2,
        doctorWallet: WALLETS.doctor2,
        hospitalWallet: WALLETS.hospital2,
        recordTitle: "Comprehensive Thyroid Function Panel",
        fileName: "emily_davis_thyroid_hormone_panel.pdf",
        recordType: "Laboratory Report",
        category: "Endocrinology",
        description: "TSH 2.1 mIU/L, Free T4 1.3 ng/dL, Free T3 3.2 pg/mL, anti-TPO antibodies negative.",
        content: `ENDOCRINE HORMONE EVALUATION
Patient: Emily Davis
TSH (Ultrasensitive): 2.10 mIU/L (Normal 0.45 - 4.50)
Free Thyroxine (FT4): 1.32 ng/dL (Normal 0.82 - 1.77)
Free Triiodothyronine (FT3): 3.20 pg/mL (Normal 2.0 - 4.4)
Assessment: Euthyroid state maintained. Dosage of levothyroxine is therapeutic.`,
      },

      // Patient 3 (Michael Chang) Records - 3 records
      {
        recordId: "REC-2026-010",
        patientWallet: WALLETS.patient3,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Continuous Glucose Monitoring (CGM) 14-Day Audit",
        fileName: "michael_chang_cgm_ambulatory_glucose.pdf",
        recordType: "Diagnostic Report",
        category: "Endocrinology",
        description: "14-day CGM ambulatory glucose profile showing 84% Time in Range (70-180 mg/dL), GMI 6.3%, CV 28%.",
        content: `AMBULATORY GLUCOSE PROFILE (AGP)
Patient: Michael Chang
Sensor Active: 99.4% of 14 days
Time in Range (70-180 mg/dL): 84% (Target > 70%)
Time Below Range (<70 mg/dL): 1.2% (Target < 4%)
Glucose Management Indicator (GMI): 6.3% | Mean Glucose: 132 mg/dL
Assessment: Excellent glycemic control with minimal hypoglycemia vulnerability.`,
      },
      {
        recordId: "REC-2026-011",
        patientWallet: WALLETS.patient3,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Glycated Hemoglobin (HbA1c) & Renal Biomarkers",
        fileName: "michael_chang_glycated_hba1c_renal.pdf",
        recordType: "Laboratory Report",
        category: "Pathology",
        description: "HbA1c 6.4%, eGFR 98 mL/min, Urine Albumin-to-Creatinine Ratio (uACR) 14 mg/g (normal normoalbuminuria).",
        content: `DIABETIC SURVEILLANCE LABORATORY PANEL
Patient: Michael Chang
HbA1c: 6.4% (Standard DCCT aligned)
Estimated Average Glucose: 137 mg/dL
Urinary Microalbumin/Creatinine Ratio: 14 mg/g (Ref < 30)
Impression: Well-managed type 2 diabetes with no clinical signs of nephropathy.`,
      },
      {
        recordId: "REC-2026-012",
        patientWallet: WALLETS.patient3,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Carotid Artery Doppler Ultrasound",
        fileName: "michael_chang_carotid_doppler_duplex.pdf",
        recordType: "Diagnostic Imaging",
        category: "Cardiology",
        description: "Bilateral carotid duplex ultrasound demonstrating normal intimal-medial thickness, patent lumens, no hemodynamically significant stenosis.",
        content: `CAROTID ARTERY ULTRASOUND DUPLEX
Patient: Michael Chang
Right ICA Peak Systolic Velocity: 68 cm/s (Stenosis 0-19%)
Left ICA Peak Systolic Velocity: 72 cm/s (Stenosis 0-19%)
Vertebral Arteries: Antegrade flow bilaterally.
Impression: Normal carotid vasculature with no hemodynamically limiting atherosclerotic plaques.`,
      },

      // Patient 4 (Sophia Rodriguez) Records - 2 records
      {
        recordId: "REC-2026-013",
        patientWallet: WALLETS.patient4,
        doctorWallet: WALLETS.doctor3,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Right Knee Post-Surgical MRI Assessment",
        fileName: "sophia_rodriguez_knee_mri_postop.pdf",
        recordType: "Radiology",
        category: "Orthopedics",
        description: "Post-op MRI showing intact autograft ACL with excellent incorporation, minimal joint effusion, and healed meniscal repair.",
        content: `ORTHOPEDIC SURGICAL FOLLOW-UP SCAN
Patient: Sophia Rodriguez | Surgeon: Dr. Elena Rostova
Study: Right Knee MRI 6-Months Post ACL Reconstruction
Findings: The bone-patellar tendon-bone graft is intact and continuous. Bioabsorbable interference screws in anatomic position.
Medial and lateral collateral ligaments intact.
Conclusion: Robust graft healing and excellent mechanical stability. Cleared for sport-specific agility drills.`,
      },
      {
        recordId: "REC-2026-014",
        patientWallet: WALLETS.patient4,
        doctorWallet: WALLETS.doctor3,
        hospitalWallet: WALLETS.hospital1,
        recordTitle: "Physical Therapy & Functional Movement Screen",
        fileName: "sophia_rodriguez_pt_rehab_evaluation.pdf",
        recordType: "Clinical Summary",
        category: "Physical Therapy",
        description: "Isokinetic dynamometry demonstrates 92% quadriceps symmetry index, full active range of motion (0-140 degrees), negative Lachman test.",
        content: `PHYSICAL REHABILITATION DISCHARGE SCREEN
Patient: Sophia Rodriguez
Active ROM: Extension 0 deg / Flexion 140 deg (Matches contralateral limb)
Limb Symmetry Index (LSI): Single Leg Hop 94%, Triple Hop 91%
Lachman Test: Negative | Anterior Drawer: Negative | Pivot Shift: Negative
Recommendation: Gradual return to non-contact team athletic training.`,
      },

      // Patient 5 (James Wilson) Records - 2 records
      {
        recordId: "REC-2026-015",
        patientWallet: WALLETS.patient5,
        doctorWallet: WALLETS.doctor4,
        hospitalWallet: WALLETS.hospital3,
        recordTitle: "Whole-Body 18F-FDG PET-CT Surveillance Scan",
        fileName: "james_wilson_whole_body_petct.pdf",
        recordType: "Radiology",
        category: "Oncology",
        description: "Follow-up PET-CT scan demonstrates complete metabolic remission of lymphoma with Deauville Score 1 (no FDG-avid lymphadenopathy).",
        content: `NUCLEAR MEDICINE PET-CT STUDY
Facility: St. Jude Oncology & Research Center
Patient: James Wilson | Oncologist: Dr. David Kim
Radiopharmaceutical: 18F-Fluorodeoxyglucose (FDG) 310 MBq
Findings: Physiological biodistribution in brain, myocardium, liver, and urinary tract.
No pathologic hypermetabolic nodal masses in cervical, mediastinal, axillary, or abdominopelvic stations.
Conclusion: Deauville Score 1. Complete metabolic response maintained.`,
      },
      {
        recordId: "REC-2026-016",
        patientWallet: WALLETS.patient5,
        doctorWallet: WALLETS.doctor4,
        hospitalWallet: WALLETS.hospital3,
        recordTitle: "Immunophenotyping & Flow Cytometry Panel",
        fileName: "james_wilson_flow_cytometry_immuno.pdf",
        recordType: "Laboratory Report",
        category: "Hematology",
        description: "Peripheral blood flow cytometry confirms normal CD4/CD8 ratio, polytypic B-cells, and zero clonal immunophenotypic abnormalities.",
        content: `FLOW CYTOMETRY CELLULAR IMMUNOPHENOTYPING
Patient: James Wilson
Total Leukocytes: 7,200 /uL | Lymphocyte Subset: 28%
CD3+ T-Cells: 74% | CD4+ Helper: 48% | CD8+ Cytotoxic: 24% | CD4/CD8 Ratio: 2.0
Kappa/Lambda Ratio: 1.4 (Normal polyclonal light chain expression)
Impression: No aberrant lymphoid populations detected.`,
      },
    ];

    for (const rec of recordsManifest) {
      const buffer = Buffer.from(rec.content, "utf8");
      const { encrypted, iv, authTag } = encryptBuffer(buffer);
      const fileHash = calculateSHA256(buffer);
      const encFileName = `${rec.recordId}.enc`;
      const encFilePath = path.join(UPLOADS_DIR, encFileName);

      fs.writeFileSync(encFilePath, encrypted);

      await MedicalRecord.findOneAndUpdate(
        { recordId: rec.recordId },
        {
          recordId: rec.recordId,
          patientWallet: rec.patientWallet,
          uploaderWallet: rec.patientWallet,
          doctorWallet: rec.doctorWallet,
          hospitalWallet: rec.hospitalWallet,
          recordTitle: rec.recordTitle,
          fileName: rec.fileName,
          recordType: rec.recordType,
          category: rec.category,
          description: rec.description,
          encryptedFileReference: encFileName,
          encryptedFileName: encFileName,
          iv: iv,
          authTag: authTag,
          encryptionIv: iv,
          encryptionTag: authTag,
          fileHash: "0x" + fileHash,
          fileType: "application/pdf",
          mimeType: "application/pdf",
          fileSize: buffer.length,
          accessStatus: "active",
          isOnChainRegistered: true,
          uploadDate: new Date(Date.now() - Math.floor(Math.random() * 30 + 1) * 86400000),
        },
        { upsert: true, new: true }
      );
    }

    // 7. Seed Prescriptions (Part of the new clinical model)
    const prescriptionsData = [
      {
        prescriptionId: "RX-2026-001",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        doctorName: "Dr. Sarah Jenkins",
        hospitalName: "Apollo Multi-Specialty Hospital",
        diagnosis: "Essential Hypertension (Grade 1)",
        medications: [
          {
            name: "Telmisartan",
            dosage: "40 mg",
            frequency: "Once daily in the morning",
            duration: "90 days",
            instructions: "Take with or without food. Monitor blood pressure weekly.",
          },
          {
            name: "Amlodipine Besylate",
            dosage: "5 mg",
            frequency: "Once daily at bedtime",
            duration: "90 days",
            instructions: "Take before sleep. Report any ankle edema.",
          },
        ],
        issueDate: new Date("2026-02-10"),
        expiryDate: new Date("2026-05-10"),
        status: "active",
        notes: "Target resting blood pressure below 125/80 mmHg. Maintain low-sodium DASH diet.",
      },
      {
        prescriptionId: "RX-2026-002",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        doctorName: "Dr. Sarah Jenkins",
        hospitalName: "Apollo Multi-Specialty Hospital",
        diagnosis: "Dyslipidemia Prophylaxis",
        medications: [
          {
            name: "Atorvastatin Calcium",
            dosage: "20 mg",
            frequency: "Once daily at bedtime",
            duration: "60 days",
            instructions: "Take in the evening with water. Avoid grapefruit juice.",
          },
        ],
        issueDate: new Date("2026-01-20"),
        expiryDate: new Date("2026-03-20"),
        status: "active",
        notes: "Lipid profile re-check scheduled at 8 weeks.",
      },
      {
        prescriptionId: "RX-2026-003",
        patientWallet: WALLETS.patient2,
        doctorWallet: WALLETS.doctor2,
        doctorName: "Dr. Alexander Patel",
        hospitalName: "Metro General Hospital",
        diagnosis: "Migraine Prophylaxis & Acute Management",
        medications: [
          {
            name: "Topiramate",
            dosage: "50 mg",
            frequency: "Twice daily",
            duration: "90 days",
            instructions: "Titrate dose slowly. Ensure adequate hydration.",
          },
          {
            name: "Sumatriptan Succinate",
            dosage: "50 mg",
            frequency: "PRN at onset of headache aura",
            duration: "As needed (Max 2 doses / 24h)",
            instructions: "Take immediately when visual aura begins.",
          },
        ],
        issueDate: new Date("2026-02-01"),
        expiryDate: new Date("2026-05-01"),
        status: "active",
        notes: "Maintain headache diary recording frequency and food triggers.",
      },
      {
        prescriptionId: "RX-2026-004",
        patientWallet: WALLETS.patient3,
        doctorWallet: WALLETS.doctor1,
        doctorName: "Dr. Sarah Jenkins",
        hospitalName: "Apollo Multi-Specialty Hospital",
        diagnosis: "Type 2 Diabetes Mellitus Glycemic Optimization",
        medications: [
          {
            name: "Metformin Hydrochloride Extended-Release",
            dosage: "1000 mg",
            frequency: "Once daily with dinner",
            duration: "120 days",
            instructions: "Swallow whole with meals to minimize gastrointestinal discomfort.",
          },
          {
            name: "Empagliflozin",
            dosage: "10 mg",
            frequency: "Once daily in morning",
            duration: "120 days",
            instructions: "Drink plenty of water throughout the day.",
          },
        ],
        issueDate: new Date("2026-01-15"),
        expiryDate: new Date("2026-05-15"),
        status: "active",
        notes: "Quarterly HbA1c target: < 6.5%.",
      },
    ];

    for (const rx of prescriptionsData) {
      await Prescription.findOneAndUpdate({ prescriptionId: rx.prescriptionId }, rx, { upsert: true, new: true });
    }

    // 8. Seed Lab Reports
    const labReportsData = [
      {
        reportId: "LAB-2026-001",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        testName: "Comprehensive Metabolic & Lipid Health Profile",
        category: "Biochemistry",
        testDate: new Date("2026-02-12"),
        results: [
          { parameter: "Fasting Blood Sugar", value: "92", unit: "mg/dL", normalRange: "70 - 99", flag: "normal" },
          { parameter: "Total Cholesterol", value: "185", unit: "mg/dL", normalRange: "< 200", flag: "normal" },
          { parameter: "HDL Cholesterol", value: "54", unit: "mg/dL", normalRange: "> 40", flag: "normal" },
          { parameter: "LDL Cholesterol", value: "108", unit: "mg/dL", normalRange: "< 100", flag: "borderline" },
          { parameter: "Triglycerides", value: "115", unit: "mg/dL", normalRange: "< 150", flag: "normal" },
          { parameter: "Serum Creatinine", value: "0.92", unit: "mg/dL", normalRange: "0.7 - 1.3", flag: "normal" },
          { parameter: "Serum Potassium", value: "4.3", unit: "mEq/L", normalRange: "3.5 - 5.0", flag: "normal" },
        ],
        summary: "Normal fasting glucose, renal function, and electrolytes. Mild borderline LDL managed with lifestyle modifications.",
        status: "completed",
        recordRef: "REC-2026-003",
      },
      {
        reportId: "LAB-2026-002",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        testName: "Routine Complete Hemogram (CBC with ESR)",
        category: "Hematology",
        testDate: new Date("2026-02-12"),
        results: [
          { parameter: "Hemoglobin", value: "14.8", unit: "g/dL", normalRange: "13.5 - 17.5", flag: "normal" },
          { parameter: "Total Leukocyte Count", value: "6,400", unit: "/uL", normalRange: "4,000 - 11,000", flag: "normal" },
          { parameter: "Platelet Count", value: "240,000", unit: "/uL", normalRange: "150,000 - 450,000", flag: "normal" },
          { parameter: "ESR (1st Hour)", value: "8", unit: "mm/hr", normalRange: "0 - 15", flag: "normal" },
        ],
        summary: "Optimal blood counts with no cytopenias or signs of active systemic inflammation.",
        status: "completed",
        recordRef: "REC-2026-006",
      },
      {
        reportId: "LAB-2026-003",
        patientWallet: WALLETS.patient2,
        doctorWallet: WALLETS.doctor2,
        hospitalWallet: WALLETS.hospital2,
        testName: "Complete Neuroendocrine & Thyroid Screening",
        category: "Endocrinology",
        testDate: new Date("2026-01-25"),
        results: [
          { parameter: "Serum TSH", value: "2.10", unit: "mIU/L", normalRange: "0.45 - 4.50", flag: "normal" },
          { parameter: "Free T4", value: "1.32", unit: "ng/dL", normalRange: "0.82 - 1.77", flag: "normal" },
          { parameter: "Serum Magnesium", value: "2.2", unit: "mg/dL", normalRange: "1.7 - 2.4", flag: "normal" },
          { parameter: "Vitamin B12", value: "540", unit: "pg/mL", normalRange: "200 - 900", flag: "normal" },
        ],
        summary: "Normal neurochemical and hormonal parameters. Magnesium and B12 stores are adequate.",
        status: "completed",
        recordRef: "REC-2026-009",
      },
    ];

    for (const lab of labReportsData) {
      await LabReport.findOneAndUpdate({ reportId: lab.reportId }, lab, { upsert: true, new: true });
    }

    // 9. Seed Consultations
    const consultationsData = [
      {
        consultationId: "CON-2026-001",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        patientName: "Robert Miller",
        doctorName: "Dr. Sarah Jenkins",
        hospitalName: "Apollo Multi-Specialty Hospital",
        consultationDate: new Date("2026-02-15"),
        symptoms: ["Mild occasional palpitation during intense workouts", "Routine cardiovascular review"],
        diagnosis: "Grade 1 Essential Hypertension with excellent therapeutic control; physiological sinus tachycardia on exertion",
        clinicalNotes: "Patient presents for 6-month cardiovascular checkup. Rest BP 122/78 mmHg. Heart sounds S1/S2 present, no murmurs. ECG and 2D Echo fully reviewed on blockchain. Prescribed continued Telmisartan 40mg daily.",
        followUpDate: new Date("2026-08-15"),
        status: "completed",
      },
      {
        consultationId: "CON-2026-002",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        patientName: "Robert Miller",
        doctorName: "Dr. Sarah Jenkins",
        hospitalName: "Apollo Multi-Specialty Hospital",
        consultationDate: new Date("2025-08-14"),
        symptoms: ["Elevated clinic blood pressure during annual physical (142/90 mmHg)"],
        diagnosis: "Newly diagnosed Essential Hypertension",
        clinicalNotes: "Initiated low-dose antihypertensive therapy and lifestyle counseling. Recommended 24-hour ambulatory blood pressure monitoring.",
        followUpDate: new Date("2025-11-14"),
        status: "completed",
      },
      {
        consultationId: "CON-2026-003",
        patientWallet: WALLETS.patient2,
        doctorWallet: WALLETS.doctor2,
        hospitalWallet: WALLETS.hospital2,
        patientName: "Emily Davis",
        doctorName: "Dr. Alexander Patel",
        hospitalName: "Metro General Hospital",
        consultationDate: new Date("2026-02-01"),
        symptoms: ["Bilateral throbbing headache preceded by scintillating scotoma 2-3 times per month"],
        diagnosis: "Migraine with typical aura (ICD-10 G43.1)",
        clinicalNotes: "Neurological examination cranial nerves II-XII intact. Brain MRI showed no structural anomalies. Started prophylactic Topiramate.",
        followUpDate: new Date("2026-05-01"),
        status: "completed",
      },
      {
        consultationId: "CON-2026-004",
        patientWallet: WALLETS.patient4,
        doctorWallet: WALLETS.doctor3,
        hospitalWallet: WALLETS.hospital1,
        patientName: "Sophia Rodriguez",
        doctorName: "Dr. Elena Rostova",
        hospitalName: "Apollo Multi-Specialty Hospital",
        consultationDate: new Date("2026-01-20"),
        symptoms: ["Post-ACL reconstruction rehabilitation milestone evaluation"],
        diagnosis: "Status post right knee arthroscopic ACL reconstruction",
        clinicalNotes: "Full knee extension achieved. Graft integration confirmed on MRI. Cleared for straight-line running.",
        followUpDate: new Date("2026-04-20"),
        status: "completed",
      },
    ];

    for (const con of consultationsData) {
      await Consultation.findOneAndUpdate({ consultationId: con.consultationId }, con, { upsert: true, new: true });
    }

    // 10. Seed Appointments (11 realistic appointments)
    const appointmentsData = [
      {
        appointmentId: "APT-2026-001",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        appointmentDate: "2026-03-15",
        appointmentTime: "10:30 AM",
        reason: "Cardiology Routine Follow-up & BP Monitoring",
        status: "confirmed",
        notes: "Bring home blood pressure log for the past 4 weeks.",
      },
      {
        appointmentId: "APT-2026-002",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor3,
        hospitalWallet: WALLETS.hospital1,
        appointmentDate: "2026-03-22",
        appointmentTime: "02:00 PM",
        reason: "Orthopedic Ergonomic & Posture Consultation",
        status: "scheduled",
        notes: "Evaluating mild lower lumbar stiffness during desk work.",
      },
      {
        appointmentId: "APT-2026-003",
        patientWallet: WALLETS.patient2,
        doctorWallet: WALLETS.doctor2,
        hospitalWallet: WALLETS.hospital2,
        appointmentDate: "2026-03-18",
        appointmentTime: "11:00 AM",
        reason: "Neurology Follow-up & Topiramate Review",
        status: "confirmed",
        notes: "Review headache tracker entries and check serum bicarbonate levels.",
      },
      {
        appointmentId: "APT-2026-004",
        patientWallet: WALLETS.patient3,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        appointmentDate: "2026-03-10",
        appointmentTime: "09:15 AM",
        reason: "Comprehensive Diabetic Cardiovascular Screening",
        status: "confirmed",
        notes: "Fasting lipid panel and urine microalbumin results to be analyzed.",
      },
      {
        appointmentId: "APT-2026-005",
        patientWallet: WALLETS.patient4,
        doctorWallet: WALLETS.doctor3,
        hospitalWallet: WALLETS.hospital1,
        appointmentDate: "2026-03-25",
        appointmentTime: "03:30 PM",
        reason: "ACL Rehab Stage 3 Functional Hop Testing",
        status: "scheduled",
        notes: "Wear athletic footwear for biomechanical agility assessment.",
      },
      {
        appointmentId: "APT-2026-006",
        patientWallet: WALLETS.patient5,
        doctorWallet: WALLETS.doctor4,
        hospitalWallet: WALLETS.hospital3,
        appointmentDate: "2026-04-05",
        appointmentTime: "01:45 PM",
        reason: "Surveillance Oncology Consultation & Lab Evaluation",
        status: "scheduled",
        notes: "Review routine interval CBC and LDH markers.",
      },
      {
        appointmentId: "APT-2026-007",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        appointmentDate: "2026-02-15",
        appointmentTime: "10:00 AM",
        reason: "Cardiology Semi-Annual Consultation",
        status: "completed",
        notes: "Successfully performed ECG and updated medication regimen.",
      },
      {
        appointmentId: "APT-2026-008",
        patientWallet: WALLETS.patient2,
        doctorWallet: WALLETS.doctor2,
        hospitalWallet: WALLETS.hospital2,
        appointmentDate: "2026-02-01",
        appointmentTime: "11:30 AM",
        reason: "Initial Neurological Assessment",
        status: "completed",
        notes: "Ordered Brain MRI and started Topiramate.",
      },
      {
        appointmentId: "APT-2026-009",
        patientWallet: WALLETS.patient4,
        doctorWallet: WALLETS.doctor3,
        hospitalWallet: WALLETS.hospital1,
        appointmentDate: "2026-01-20",
        appointmentTime: "02:30 PM",
        reason: "6-Month Post-Operative Knee Review",
        status: "completed",
        notes: "MRI showed full graft integration.",
      },
      {
        appointmentId: "APT-2026-010",
        patientWallet: WALLETS.patient3,
        doctorWallet: WALLETS.doctor5,
        hospitalWallet: WALLETS.hospital2,
        appointmentDate: "2026-03-30",
        appointmentTime: "04:00 PM",
        reason: "Family Wellness & Pediatric Nutrition Guidance",
        status: "scheduled",
        notes: "General pediatric consultation for dependents.",
      },
      {
        appointmentId: "APT-2026-011",
        patientWallet: WALLETS.patient5,
        doctorWallet: WALLETS.doctor4,
        hospitalWallet: WALLETS.hospital3,
        appointmentDate: "2026-01-10",
        appointmentTime: "10:00 AM",
        reason: "Post-PET/CT Scan Consultation",
        status: "completed",
        notes: "Confirmed Deauville 1 complete remission.",
      },
    ];

    for (const apt of appointmentsData) {
      await Appointment.findOneAndUpdate({ appointmentId: apt.appointmentId }, apt, { upsert: true, new: true });
    }

    // 11. Seed Access Requests (9 requests: approved, pending, rejected)
    const accessRequestsData = [
      {
        requestId: "REQ-2026-001",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        requesterWallet: WALLETS.doctor1,
        requesterName: "Dr. Sarah Jenkins",
        requesterRole: "doctor",
        recordId: "REC-2026-001",
        recordIds: ["REC-2026-001", "REC-2026-002", "REC-2026-003"],
        requestedPermissions: ["READ", "DECRYPT"],
        purpose: "Cardiovascular diagnosis and 12-lead ECG analysis prior to clinical examination.",
        accessDurationHours: 72,
        status: "approved",
        approvedAt: new Date(Date.now() - 2 * 86400000),
        expiresAt: new Date(Date.now() + 5 * 86400000),
      },
      {
        requestId: "REQ-2026-002",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor3,
        hospitalWallet: WALLETS.hospital1,
        requesterWallet: WALLETS.doctor3,
        requesterName: "Dr. Elena Rostova",
        requesterRole: "doctor",
        recordId: "REC-2026-004",
        recordIds: ["REC-2026-004"],
        requestedPermissions: ["READ"],
        purpose: "Pre-assessment of spinal posture and musculoskeletal alignment.",
        accessDurationHours: 48,
        status: "pending",
        expiresAt: new Date(Date.now() + 2 * 86400000),
      },
      {
        requestId: "REQ-2026-003",
        patientWallet: WALLETS.patient1,
        doctorWallet: "",
        hospitalWallet: WALLETS.hospital1,
        requesterWallet: WALLETS.hospital1,
        requesterName: "Apollo Multi-Specialty Hospital",
        requesterRole: "hospital",
        recordId: "REC-2026-001",
        recordIds: ["REC-2026-001", "REC-2026-002", "REC-2026-003", "REC-2026-004"],
        requestedPermissions: ["READ", "DECRYPT"],
        purpose: "Institutional inpatient admission emergency registry preparation.",
        accessDurationHours: 168,
        status: "approved",
        approvedAt: new Date(Date.now() - 4 * 86400000),
        expiresAt: new Date(Date.now() + 10 * 86400000),
      },
      {
        requestId: "REQ-2026-004",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor2,
        hospitalWallet: WALLETS.hospital2,
        requesterWallet: WALLETS.doctor2,
        requesterName: "Dr. Alexander Patel",
        requesterRole: "doctor",
        recordId: "REC-2026-005",
        recordIds: ["REC-2026-005"],
        requestedPermissions: ["READ"],
        purpose: "Cross-specialty neurological and autonomic stress investigation.",
        accessDurationHours: 24,
        status: "rejected",
        responseReason: "Access request deemed unnecessary by patient; consult redirected to cardiologist.",
      },
      {
        requestId: "REQ-2026-005",
        patientWallet: WALLETS.patient2,
        doctorWallet: WALLETS.doctor2,
        hospitalWallet: WALLETS.hospital2,
        requesterWallet: WALLETS.doctor2,
        requesterName: "Dr. Alexander Patel",
        requesterRole: "doctor",
        recordId: "REC-2026-007",
        recordIds: ["REC-2026-007", "REC-2026-008", "REC-2026-009"],
        requestedPermissions: ["READ", "DECRYPT"],
        purpose: "Neuro-imaging review and EEG analysis for migraine treatment planning.",
        accessDurationHours: 96,
        status: "approved",
        approvedAt: new Date(Date.now() - 1 * 86400000),
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
      {
        requestId: "REQ-2026-006",
        patientWallet: WALLETS.patient3,
        doctorWallet: WALLETS.doctor1,
        hospitalWallet: WALLETS.hospital1,
        requesterWallet: WALLETS.doctor1,
        requesterName: "Dr. Sarah Jenkins",
        requesterRole: "doctor",
        recordId: "REC-2026-010",
        recordIds: ["REC-2026-010", "REC-2026-011"],
        requestedPermissions: ["READ", "DECRYPT"],
        purpose: "Diabetic vascular assessment and ambulatory glucose profiling.",
        accessDurationHours: 72,
        status: "approved",
        approvedAt: new Date(Date.now() - 3 * 86400000),
        expiresAt: new Date(Date.now() + 4 * 86400000),
      },
      {
        requestId: "REQ-2026-007",
        patientWallet: WALLETS.patient4,
        doctorWallet: WALLETS.doctor3,
        hospitalWallet: WALLETS.hospital1,
        requesterWallet: WALLETS.doctor3,
        requesterName: "Dr. Elena Rostova",
        requesterRole: "doctor",
        recordId: "REC-2026-013",
        recordIds: ["REC-2026-013", "REC-2026-014"],
        requestedPermissions: ["READ", "DECRYPT"],
        purpose: "Orthopedic post-operative graft verification and physical rehabilitation clearance.",
        accessDurationHours: 120,
        status: "approved",
        approvedAt: new Date(Date.now() - 5 * 86400000),
        expiresAt: new Date(Date.now() + 6 * 86400000),
      },
      {
        requestId: "REQ-2026-008",
        patientWallet: WALLETS.patient5,
        doctorWallet: WALLETS.doctor4,
        hospitalWallet: WALLETS.hospital3,
        requesterWallet: WALLETS.doctor4,
        requesterName: "Dr. David Kim",
        requesterRole: "doctor",
        recordId: "REC-2026-015",
        recordIds: ["REC-2026-015", "REC-2026-016"],
        requestedPermissions: ["READ", "DECRYPT"],
        purpose: "Oncology surveillance scan verification and flow cytometry check.",
        accessDurationHours: 72,
        status: "approved",
        approvedAt: new Date(Date.now() - 2 * 86400000),
        expiresAt: new Date(Date.now() + 8 * 86400000),
      },
      {
        requestId: "REQ-2026-009",
        patientWallet: WALLETS.patient1,
        doctorWallet: WALLETS.doctor5,
        hospitalWallet: WALLETS.hospital2,
        requesterWallet: WALLETS.doctor5,
        requesterName: "Dr. Rachel Green",
        requesterRole: "doctor",
        recordId: "REC-2026-001",
        recordIds: ["REC-2026-001"],
        requestedPermissions: ["READ"],
        purpose: "Pediatric familial health screening and hereditary risk factor assessment.",
        accessDurationHours: 48,
        status: "pending",
        expiresAt: new Date(Date.now() + 2 * 86400000),
      },
    ];

    for (const req of accessRequestsData) {
      await AccessRequest.findOneAndUpdate({ requestId: req.requestId }, req, { upsert: true, new: true });
    }

    // 12. Seed Consent Logs
    const consentLogsData = [
      {
        patientWallet: WALLETS.patient1,
        authorizedWallet: WALLETS.doctor1,
        recordId: "REC-2026-001",
        permissions: ["view", "download"],
        expiresAt: new Date(Date.now() + 5 * 86400000),
        transactionHash: "0x4a82b9cf2711d51a94ef88e7b1c3125e88aa09bbf45145b23d90f23d1158a101",
        status: "active",
      },
      {
        patientWallet: WALLETS.patient1,
        authorizedWallet: WALLETS.doctor1,
        recordId: "REC-2026-002",
        permissions: ["view", "download"],
        expiresAt: new Date(Date.now() + 5 * 86400000),
        transactionHash: "0x5b93c8df3822e62b05fa99f8c2d4236f99bb10ccf56256c34e01a34e2269b202",
        status: "active",
      },
      {
        patientWallet: WALLETS.patient1,
        authorizedWallet: WALLETS.hospital1,
        recordId: "REC-2026-001",
        permissions: ["view", "download"],
        expiresAt: new Date(Date.now() + 10 * 86400000),
        transactionHash: "0x6ca4d7ef4933f73c16ab00a9d3e53470aacb21ddf67367d45f12b45f3370c303",
        status: "active",
      },
    ];

    for (const log of consentLogsData) {
      await ConsentLog.create(log);
    }

    // 13. Seed Audit Logs (12 logs: uploads, grants, revokes, accesses)
    const auditLogsData = [
      {
        actorWallet: WALLETS.patient1,
        actorRole: "patient",
        action: "UPLOAD",
        targetWallet: WALLETS.patient1,
        patientWallet: WALLETS.patient1,
        recordId: "REC-2026-001",
        details: "Encrypted 12-lead ECG report uploaded and anchored on-chain with SHA-256 hash.",
        transactionHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
        timestamp: new Date(Date.now() - 10 * 86400000),
      },
      {
        actorWallet: WALLETS.patient1,
        actorRole: "patient",
        action: "UPLOAD",
        targetWallet: WALLETS.patient1,
        patientWallet: WALLETS.patient1,
        recordId: "REC-2026-002",
        details: "Encrypted Echocardiogram imaging file uploaded and indexed.",
        transactionHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
        timestamp: new Date(Date.now() - 9 * 86400000),
      },
      {
        actorWallet: WALLETS.doctor1,
        actorRole: "doctor",
        action: "REQUEST_ACCESS",
        targetWallet: WALLETS.patient1,
        patientWallet: WALLETS.patient1,
        recordId: "REC-2026-001",
        details: "Dr. Sarah Jenkins submitted consent request for cardiovascular diagnostics.",
        transactionHash: "0x3333333333333333333333333333333333333333333333333333333333333333",
        timestamp: new Date(Date.now() - 8 * 86400000),
      },
      {
        actorWallet: WALLETS.patient1,
        actorRole: "patient",
        action: "GRANT_ACCESS",
        targetWallet: WALLETS.doctor1,
        patientWallet: WALLETS.patient1,
        recordId: "REC-2026-001",
        details: "Patient Robert Miller granted READ & DECRYPT permissions to Dr. Sarah Jenkins.",
        transactionHash: "0x4444444444444444444444444444444444444444444444444444444444444444",
        timestamp: new Date(Date.now() - 7 * 86400000),
      },
      {
        actorWallet: WALLETS.doctor1,
        actorRole: "doctor",
        action: "ACCESS_RECORD",
        targetWallet: WALLETS.patient1,
        patientWallet: WALLETS.patient1,
        recordId: "REC-2026-001",
        details: "Dr. Sarah Jenkins decrypted and viewed ECG report with verified on-chain consent.",
        transactionHash: "0x5555555555555555555555555555555555555555555555555555555555555555",
        timestamp: new Date(Date.now() - 6 * 86400000),
      },
      {
        actorWallet: WALLETS.hospital1,
        actorRole: "hospital",
        action: "REQUEST_ACCESS",
        targetWallet: WALLETS.patient1,
        patientWallet: WALLETS.patient1,
        recordId: "REC-2026-001",
        details: "Apollo Multi-Specialty Hospital submitted institutional records authorization request.",
        transactionHash: "0x6666666666666666666666666666666666666666666666666666666666666666",
        timestamp: new Date(Date.now() - 5 * 86400000),
      },
      {
        actorWallet: WALLETS.patient1,
        actorRole: "patient",
        action: "GRANT_ACCESS",
        targetWallet: WALLETS.hospital1,
        patientWallet: WALLETS.patient1,
        recordId: "REC-2026-001",
        details: "Patient Robert Miller approved Apollo Multi-Specialty Hospital institutional access.",
        transactionHash: "0x7777777777777777777777777777777777777777777777777777777777777777",
        timestamp: new Date(Date.now() - 4 * 86400000),
      },
      {
        actorWallet: WALLETS.doctor2,
        actorRole: "doctor",
        action: "REQUEST_ACCESS",
        targetWallet: WALLETS.patient1,
        patientWallet: WALLETS.patient1,
        recordId: "REC-2026-005",
        details: "Dr. Alexander Patel requested access to exercise stress test records.",
        transactionHash: "0x8888888888888888888888888888888888888888888888888888888888888888",
        timestamp: new Date(Date.now() - 3 * 86400000),
      },
      {
        actorWallet: WALLETS.patient1,
        actorRole: "patient",
        action: "REVOKE_ACCESS",
        targetWallet: WALLETS.doctor2,
        patientWallet: WALLETS.patient1,
        recordId: "REC-2026-005",
        details: "Patient Robert Miller rejected access request from Dr. Alexander Patel.",
        transactionHash: "0x9999999999999999999999999999999999999999999999999999999999999999",
        timestamp: new Date(Date.now() - 2 * 86400000),
      },
      {
        actorWallet: WALLETS.patient2,
        actorRole: "patient",
        action: "UPLOAD",
        targetWallet: WALLETS.patient2,
        patientWallet: WALLETS.patient2,
        recordId: "REC-2026-007",
        details: "Patient Emily Davis uploaded Brain MRI scan.",
        transactionHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        timestamp: new Date(Date.now() - 5 * 86400000),
      },
      {
        actorWallet: WALLETS.patient2,
        actorRole: "patient",
        action: "GRANT_ACCESS",
        targetWallet: WALLETS.doctor2,
        patientWallet: WALLETS.patient2,
        recordId: "REC-2026-007",
        details: "Emily Davis granted Dr. Alexander Patel permission to decrypt MRI files.",
        transactionHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        timestamp: new Date(Date.now() - 4 * 86400000),
      },
      {
        actorWallet: WALLETS.doctor2,
        actorRole: "doctor",
        action: "ACCESS_RECORD",
        targetWallet: WALLETS.patient2,
        patientWallet: WALLETS.patient2,
        recordId: "REC-2026-007",
        details: "Dr. Alexander Patel inspected brain MRI scan for migraine diagnosis.",
        transactionHash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        timestamp: new Date(Date.now() - 3 * 86400000),
      },
    ];

    for (const a of auditLogsData) {
      await AuditLog.create(a);
    }

    // 14. Seed Notifications (12 notifications for Patient, Doctor, and Hospital)
    const notificationsData = [
      {
        recipientWallet: WALLETS.patient1,
        senderWallet: WALLETS.doctor1,
        title: "Access Request Approved",
        message: "Dr. Sarah Jenkins was granted access to your 12-Lead ECG Report.",
        type: "access_granted",
        isRead: false,
        timestamp: new Date(Date.now() - 7 * 86400000),
      },
      {
        recipientWallet: WALLETS.patient1,
        senderWallet: WALLETS.doctor3,
        title: "New Access Request Pending",
        message: "Dr. Elena Rostova has requested access to your Chest X-Ray report.",
        type: "access_request",
        isRead: false,
        timestamp: new Date(Date.now() - 1 * 86400000),
      },
      {
        recipientWallet: WALLETS.patient1,
        senderWallet: WALLETS.hospital1,
        title: "Upcoming Appointment Confirmed",
        message: "Your appointment with Dr. Sarah Jenkins is scheduled for March 15, 2026 at 10:30 AM.",
        type: "system",
        isRead: true,
        timestamp: new Date(Date.now() - 2 * 86400000),
      },
      {
        recipientWallet: WALLETS.doctor1,
        senderWallet: WALLETS.patient1,
        title: "Patient Consent Granted",
        message: "Robert Miller granted you access to REC-2026-001 (ECG Report).",
        type: "access_granted",
        isRead: true,
        timestamp: new Date(Date.now() - 7 * 86400000),
      },
      {
        recipientWallet: WALLETS.doctor1,
        senderWallet: WALLETS.patient3,
        title: "Patient Consent Granted",
        message: "Michael Chang granted you access to REC-2026-010 (CGM Report).",
        type: "access_granted",
        isRead: false,
        timestamp: new Date(Date.now() - 3 * 86400000),
      },
      {
        recipientWallet: WALLETS.doctor1,
        senderWallet: null,
        title: "New Appointment Scheduled",
        message: "Robert Miller booked a consultation for March 15, 2026 at 10:30 AM.",
        type: "system",
        isRead: false,
        timestamp: new Date(Date.now() - 1 * 86400000),
      },
      {
        recipientWallet: WALLETS.hospital1,
        senderWallet: WALLETS.patient1,
        title: "Institutional Access Granted",
        message: "Robert Miller authorized Apollo Multi-Specialty Hospital to access medical records.",
        type: "access_granted",
        isRead: false,
        timestamp: new Date(Date.now() - 4 * 86400000),
      },
      {
        recipientWallet: WALLETS.hospital1,
        senderWallet: null,
        title: "Physician Credential Verification",
        message: "Dr. Sarah Jenkins and Dr. Elena Rostova on-chain verifications are active.",
        type: "verification",
        isRead: true,
        timestamp: new Date(Date.now() - 10 * 86400000),
      },
    ];

    for (const notif of notificationsData) {
      await Notification.create(notif);
    }

    console.log(`[Seed] Comprehensive demo data seeded successfully:
- 14 Users (Admin, 5 Doctors, 3 Hospitals, 5 Patients)
- 5 Departments
- 16 Encrypted Medical Records with real ciphertext on disk in backend/uploads
- 4 Active Prescriptions
- 3 Detailed Lab Reports
- 4 Clinical Consultations
- 11 Interconnected Appointments
- 9 Access Requests
- 12 Tamper-Evident Audit Logs
- 8 System Notifications`);
  } catch (err) {
    console.error("[Seed] Error during demo data seeding:", err);
  }
}

module.exports = {
  seedComprehensiveDemoData,
  seedInitialUsers: seedComprehensiveDemoData,
};
