const mongoose = require("mongoose");
let memServer = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/emr_blockchain";

  try {
    // Attempt connecting to local MongoDB with short timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log("Connected to MongoDB at:", uri);
  } catch (err) {
    console.warn("Could not connect to external MongoDB instance:", err.message);
    console.log("Starting embedded MongoMemoryServer for standalone zero-config execution...");

    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      memServer = await MongoMemoryServer.create();
      const memUri = memServer.getUri();
      await mongoose.connect(memUri);
      console.log("Connected to in-memory MongoDB at:", memUri);
    } catch (memErr) {
      console.error("Failed to start in-memory MongoDB:", memErr.message);
      process.exit(1);
    }
  }
}

module.exports = { connectDB };
