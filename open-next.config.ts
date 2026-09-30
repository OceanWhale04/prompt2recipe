import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const openNextConfig = {
  ...defineCloudflareConfig({}),
  buildCommand: "pnpm build:next",
};

export default openNextConfig;
