/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");

const child = spawn(process.execPath, ["bin/cli.js"], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
});

let output = "";
let initialized = false;

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

child.stdout.on("data", (chunk) => {
  output += chunk.toString();
  const lines = output.split("\n");
  output = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    const message = JSON.parse(line);

    if (message.id === 1) {
      send({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      });
      send({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      });
    }

    if (message.id === 2 && message.result?.tools) {
      const names = message.result.tools.map((tool) => tool.name);
      console.log(`TOOLS=${names.join(",")}`);
      initialized = true;
      child.kill();
    }
  }
});

child.stderr.on("data", (chunk) => process.stderr.write(chunk));

child.on("close", (code) => {
  if (!initialized) {
    console.error("Smoke test failed.");
    process.exit(code ?? 1);
  }
  process.exit(0);
});

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "smoke", version: "1.0.0" },
  },
});

setTimeout(() => {
  child.kill();
  process.exit(1);
}, 10_000);
