#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
const { startMcpServer } = require("../dist/src/mcp/server.js");

startMcpServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
