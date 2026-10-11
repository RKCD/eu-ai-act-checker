import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Agendi süsteemiprompt loetakse failist serveris – jälgi seda ka buildis.
  outputFileTracingIncludes: { "/api/agent": ["./prompts/**/*"] },
};

export default nextConfig;
