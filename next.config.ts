import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The desktop browser uses 127.0.0.1. The preview the user clicks in
  // is a *.agent.cvm.dev host; without this, Next serves HTML but blocks
  // the client JavaScript, so buttons and sliders never run.
  allowedDevOrigins: ["127.0.0.1", "*.agent.cvm.dev"],
  devIndicators: false,
};

export default nextConfig;
