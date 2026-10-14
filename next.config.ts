import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Recipe photos live in the public Supabase Storage bucket.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/webp"],
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
