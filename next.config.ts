import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Header dasar agar aplikasi nyaman dipasang sebagai PWA
  async headers() {
    return [
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
    ];
  },
};

export default nextConfig;
