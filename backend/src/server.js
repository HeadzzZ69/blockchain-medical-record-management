require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const recordRoutes = require("./routes/recordRoutes");
const userRoutes = require("./routes/userRoutes");
const accessRoutes = require("./routes/accessRoutes");
const auditRoutes = require("./routes/auditRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const syncService = require("./services/syncService");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "EMR Blockchain Access Management API",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/users", userRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/appointments", appointmentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Start Server after connecting to Database
const { seedInitialUsers } = require("./utils/seedData");

async function startServer() {
  await connectDB();
  await seedInitialUsers();
  try {
    console.log("Synchronizing on-chain users with MongoDB...");
    const syncRes = await syncService.syncOnChainUsers();
    console.log(`On-chain sync complete: ${syncRes.syncedCount || 0} users synced (blockchain connected: ${syncRes.blockchainConnected})`);
  } catch (syncErr) {
    console.warn("Initial on-chain user sync skipped:", syncErr.message);
  }
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`EMR Blockchain API Server running on port ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

startServer();
