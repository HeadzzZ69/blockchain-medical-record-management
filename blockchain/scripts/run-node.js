const cp = require("child_process");

function startNode() {
  console.log("Starting Hardhat node supervisor...");
  const child = cp.spawn("npx.cmd hardhat node", {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code, signal) => {
    console.log(`Hardhat node process exited with code ${code}. Auto-restarting node...`);
    setTimeout(startNode, 1500);
  });
}

startNode();
