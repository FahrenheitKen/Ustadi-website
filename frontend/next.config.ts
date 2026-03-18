import type { NextConfig } from "next";

// Parse API URL to extract hostname, port, and protocol for image patterns
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
const parsed = new URL(apiOrigin);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: parsed.protocol.replace(":", "") as "http" | "https",
        hostname: parsed.hostname,
        port: parsed.port || "",
        pathname: "/storage/**",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
