const Appointment = require("../models/Appointment");

async function getAppointments(req, res) {
  try {
    const { patientWallet, doctorWallet, hospitalWallet } = req.query;
    const filter = {};
    if (patientWallet) filter.patientWallet = patientWallet.toLowerCase();
    if (doctorWallet) filter.doctorWallet = doctorWallet.toLowerCase();
    if (hospitalWallet) filter.hospitalWallet = hospitalWallet.toLowerCase();

    const appointments = await Appointment.find(filter).sort({ appointmentDate: -1, createdAt: -1 }).lean();
    return res.json({ appointments });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function createAppointment(req, res) {
  try {
    const { patientWallet, doctorWallet, hospitalWallet, appointmentDate, appointmentTime, reason, notes } = req.body;
    if (!patientWallet || !doctorWallet || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: "patientWallet, doctorWallet, appointmentDate, and appointmentTime are required" });
    }

    const appointment = new Appointment({
      patientWallet: patientWallet.toLowerCase(),
      doctorWallet: doctorWallet.toLowerCase(),
      hospitalWallet: hospitalWallet ? hospitalWallet.toLowerCase() : null,
      appointmentDate,
      appointmentTime,
      reason: reason || "General Consultation",
      notes: notes || "",
      status: "scheduled",
    });

    await appointment.save();
    return res.status(201).json({ success: true, appointment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (notes) update.notes = notes;

    const apt = await Appointment.findByIdAndUpdate(id, update, { new: true });
    return res.json({ success: true, appointment: apt });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
};
