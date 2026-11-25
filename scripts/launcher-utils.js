const http = require("http");
const net = require("net");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");

const command = process.argv[2];

if (!command) {
  console.log("Usage: node launcher-utils.js <command> [args]");
  process.exit(1);
}

// 1. Wait for HTTP URL to respond
if (command === "wait-url") {
  const targetUrl = process.argv[3];
  const timeoutSec = parseInt(process.argv[4] || "30", 10);
  if (!targetUrl) {
    console.error("Missing URL");
    process.exit(1);
  }

  const startTime = Date.now();
  const maxWaitMs = timeoutSec * 1000;

  function tryConnect() {
    const req = http.get(targetUrl, (res) => {
      // Any response means the server is up and listening
      console.log(`[OK] ${targetUrl} responded with HTTP ${res.statusCode}`);
      process.exit(0);
    });

    req.on("error", (err) => {
      if (Date.now() - startTime > maxWaitMs) {
        console.error(`[ERROR] Timeout waiting for ${targetUrl} after ${timeoutSec}s (${err.message})`);
        process.exit(1);
      }
      setTimeout(tryConnect, 500);
    });

    req.setTimeout(2000, () => {
      req.destroy();
    });
  }

  tryConnect();
}

// 2. Test if TCP port is open / listening
else if (command === "is-port-open") {
  const port = parseInt(process.argv[3], 10);
  if (!port) {
    console.error("Missing port");
    process.exit(1);
  }

  const client = new net.Socket();
  client.setTimeout(1000);

  client.connect(port, "127.0.0.1", () => {
    client.destroy();
    console.log(`PORT_OPEN`);
    process.exit(0);
  });

  client.on("error", () => {
    client.destroy();
    console.log(`PORT_CLOSED`);
    process.exit(1);
  });

  client.on("timeout", () => {
    client.destroy();
    console.log(`PORT_CLOSED`);
    process.exit(1);
  });
}

// 3. Check MongoDB status
else if (command === "check-mongo") {
  const envPath = path.join(ROOT_DIR, "backend", ".env");
  let mongoUri = "mongodb://127.0.0.1:27017/emr_blockchain";

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    const match = content.match(/MONGODB_URI=(.*)/);
    if (match && match[1]) {
      mongoUri = match[1].trim();
    }
  }

  const isAtlas = mongoUri.includes("mongodb+srv://") || (!mongoUri.includes("localhost") && !mongoUri.includes("127.0.0.1"));

  if (isAtlas) {
    console.log("[INFO] MongoDB URI points to a cloud/remote instance (Atlas). Skipping local service checks.");
    process.exit(0);
  }

  // Check local port 27017
  const client = new net.Socket();
  client.setTimeout(1500);

  client.connect(27017, "127.0.0.1", () => {
    client.destroy();
    console.log("[OK] Local MongoDB is active and accepting connections on port 27017.");
    process.exit(0);
  });

  client.on("error", () => {
    client.destroy();
    // Attempt starting local Windows service if available
    try {
      console.log("[INFO] Port 27017 is not responding. Checking for MongoDB Windows service...");
      const startOut = cp.execSync("net start MongoDB", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
      console.log("[OK] Successfully started local MongoDB Windows service.");
      process.exit(0);
    } catch (e) {
      console.log("[INFO] Local MongoDB service is not running or not installed as a Windows service.");
      console.log("[INFO] MedVault backend will automatically use its built-in In-Memory MongoDB (MongoMemoryServer).");
      process.exit(0);
    }
  });

  client.on("timeout", () => {
    client.destroy();
    console.log("[INFO] Connection to MongoDB port 27017 timed out.");
    console.log("[INFO] MedVault backend will automatically use its built-in In-Memory MongoDB (MongoMemoryServer).");
    process.exit(0);
  });
}

// 4. Kill processes listening on specified ports
else if (command === "kill-ports") {
  const targetPorts = process.argv.slice(3).map((p) => p.trim());
  if (targetPorts.length === 0) {
    console.log("No ports specified to kill.");
    process.exit(0);
  }

  try {
    const output = cp.execSync("netstat -ano -p tcp", { encoding: "utf8" });
    const lines = output.split("\n");
    const pidsToKill = new Set();

    for (const line of lines) {
      if (!line.includes("LISTENING")) continue;
      for (const port of targetPorts) {
        if (line.includes(`:${port} `) || line.includes(`:${port}\t`) || line.includes(`:${port}\r`)) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0" && pid !== process.pid.toString()) {
            pidsToKill.add({ port, pid });
          }
        }
      }
    }

    if (pidsToKill.size === 0) {
      console.log(`[INFO] No active processes found on ports: ${targetPorts.join(", ")}`);
    } else {
      for (const item of pidsToKill) {
        try {
          console.log(`[STOP] Terminating process on port ${item.port} (PID: ${item.pid})...`);
          cp.execSync(`taskkill /F /PID ${item.pid}`, { stdio: "ignore" });
        } catch (killErr) {
          // Process might have already exited
        }
      }
    }

    // Also close CMD windows with specific titles
    const windowTitles = [
      "MedVault - Blockchain Node*",
      "MedVault - Backend Server*",
      "MedVault - Frontend Server*",
    ];

    for (const title of windowTitles) {
      try {
        cp.execSync(`taskkill /F /FI "WINDOWTITLE eq ${title}"`, { stdio: "ignore" });
      } catch (e) {
        // Window already closed
      }
    }

    console.log("[OK] Project services stopped cleanly.");
    process.exit(0);
  } catch (err) {
    console.error(`[ERROR] Failed to terminate ports: ${err.message}`);
    process.exit(1);
  }
}

// 5. Get deployed contract address
else if (command === "get-contract-address") {
  const deployedPath = path.join(ROOT_DIR, "blockchain", "deployedAddress.json");
  const backendPath = path.join(ROOT_DIR, "backend", "src", "config", "contractInfo.json");
  const frontendPath = path.join(ROOT_DIR, "frontend", "src", "contracts", "contractInfo.json");

  let address = "Not Deployed Yet";

  if (fs.existsSync(deployedPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
      if (data.contractAddress) address = data.contractAddress;
    } catch {}
  } else if (fs.existsSync(backendPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(backendPath, "utf8"));
      if (data.contractAddress) address = data.contractAddress;
    } catch {}
  }

  console.log(address);
  process.exit(0);
}

else {
  console.error("Unknown command:", command);
  process.exit(1);
}
