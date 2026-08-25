import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // Phase 5 (Product Images): Server Actions default to a 1MB body limit,
  // which the plain product mutations never approached but a multi-photo
  // upload (MAX_FILES_PER_UPLOAD × MAX_IMAGE_SIZE_BYTES in
  // src/domain/product-image.ts — 5 × 10MB) would hit immediately. Raised
  // just above that worst case; the domain constants remain the real,
  // single-source-of-truth limits — this is only a server-side backstop.
  experimental: {
    serverActions: {
      bodySizeLimit: "55mb",
    },
  },
};

export default nextConfig;
