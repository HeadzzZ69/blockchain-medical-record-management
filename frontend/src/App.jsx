import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ConnectWalletPage from './pages/ConnectWalletPage';
import RegisterPage from './pages/RegisterPage';

// Patient Pages
import PatientDashboard from './dashboards/patient/PatientDashboard';
import MyRecords from './dashboards/patient/MyRecords';
import UploadRecord from './dashboards/patient/UploadRecord';
import ManageAccess from './dashboards/patient/ManageAccess';
import RevokeAccess from './dashboards/patient/RevokeAccess';
import AccessRequests from './dashboards/patient/AccessRequests';
import AccessHistory from './dashboards/patient/AccessHistory';
import Profile from './dashboards/patient/Profile';

// Doctor Pages
import DoctorDashboard from './dashboards/doctor/DoctorDashboard';
import MyPatients from './dashboards/doctor/MyPatients';
import PatientRecords from './dashboards/doctor/PatientRecords';
import RequestAccess from './dashboards/doctor/RequestAccess';
import DoctorAccessHistory from './dashboards/doctor/DoctorAccessHistory';
import DoctorProfile from './dashboards/doctor/DoctorProfile';

// Hospital Pages
import HospitalDashboard from './dashboards/hospital/HospitalDashboard';
import HospitalDoctors from './dashboards/hospital/HospitalDoctors';
import HospitalPatients from './dashboards/hospital/HospitalPatients';
import HospitalRecords from './dashboards/hospital/HospitalRecords';
import HospitalAccessHistory from './dashboards/hospital/HospitalAccessHistory';
import HospitalProfile from './dashboards/hospital/HospitalProfile';

// Admin Pages
import AdminDashboard from './dashboards/admin/AdminDashboard';
import RegisterDoctor from './dashboards/admin/RegisterDoctor';
import RegisterHospital from './dashboards/admin/RegisterHospital';
import ViewUsers from './dashboards/admin/ViewUsers';
import GlobalAudit from './dashboards/admin/GlobalAudit';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with standard Navbar */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-slate-50 flex flex-col">
              <Navbar />
              <LandingPage />
            </div>
          }
        />
        <Route
          path="/about"
          element={
            <div className="min-h-screen bg-slate-50 flex flex-col">
              <Navbar />
              <AboutPage />
            </div>
          }
        />
        <Route
          path="/connect"
          element={
            <div className="min-h-screen bg-slate-50 flex flex-col">
              <Navbar />
              <ConnectWalletPage />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="min-h-screen bg-slate-50 flex flex-col">
              <Navbar />
              <RegisterPage />
            </div>
          }
        />

        {/* Patient Dashboard Routes */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DashboardLayout role="patient">
                <PatientDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/records"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DashboardLayout role="patient">
                <MyRecords />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/upload"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DashboardLayout role="patient">
                <UploadRecord />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/manage-access"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DashboardLayout role="patient">
                <ManageAccess />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/revoke-access"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DashboardLayout role="patient">
                <RevokeAccess />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/requests"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DashboardLayout role="patient">
                <AccessRequests />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/history"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DashboardLayout role="patient">
                <AccessHistory />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DashboardLayout role="patient">
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Doctor Dashboard Routes */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DashboardLayout role="doctor">
                <DoctorDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DashboardLayout role="doctor">
                <MyPatients />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/records"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DashboardLayout role="doctor">
                <PatientRecords />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/request-access"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DashboardLayout role="doctor">
                <RequestAccess />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/history"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DashboardLayout role="doctor">
                <DoctorAccessHistory />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DashboardLayout role="doctor">
                <DoctorProfile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Hospital Dashboard Routes */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute allowedRoles={['hospital']}>
              <DashboardLayout role="hospital">
                <HospitalDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/doctors"
          element={
            <ProtectedRoute allowedRoles={['hospital']}>
              <DashboardLayout role="hospital">
                <HospitalDoctors />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/patients"
          element={
            <ProtectedRoute allowedRoles={['hospital']}>
              <DashboardLayout role="hospital">
                <HospitalPatients />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/records"
          element={
            <ProtectedRoute allowedRoles={['hospital']}>
              <DashboardLayout role="hospital">
                <HospitalRecords />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/history"
          element={
            <ProtectedRoute allowedRoles={['hospital']}>
              <DashboardLayout role="hospital">
                <HospitalAccessHistory />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/profile"
          element={
            <ProtectedRoute allowedRoles={['hospital']}>
              <DashboardLayout role="hospital">
                <HospitalProfile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout role="admin">
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/register-doctor"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout role="admin">
                <RegisterDoctor />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/register-hospital"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout role="admin">
                <RegisterHospital />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout role="admin">
                <ViewUsers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout role="admin">
                <GlobalAudit />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
