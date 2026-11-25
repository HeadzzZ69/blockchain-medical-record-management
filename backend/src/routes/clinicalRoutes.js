const express = require("express");
const router = express.Router();
const clinicalController = require("../controllers/clinicalController");

// Prescriptions
router.get("/prescriptions", clinicalController.getPrescriptions);
router.post("/prescriptions", clinicalController.createPrescription);

// Lab Reports
router.get("/lab-reports", clinicalController.getLabReports);
router.post("/lab-reports", clinicalController.createLabReport);

// Consultations
router.get("/consultations", clinicalController.getConsultations);
router.post("/consultations", clinicalController.createConsultation);

// Aggregated Clinical Summaries
router.get("/summary/:patientWallet", clinicalController.getPatientClinicalSummary);
router.get("/doctor-stats/:doctorWallet", clinicalController.getDoctorClinicalSummary);
router.get("/hospital-stats/:hospitalWallet", clinicalController.getHospitalClinicalSummary);

module.exports = router;
