import type { NextConfig } from "next";
const imagesHost = process.env.NEXT_PUBLIC_IMAGES_HOST;

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    remotePatterns: imagesHost
      ? [
          {
            protocol: "https",
            hostname: imagesHost,
            pathname: "/storage/v1/object/public/product-images/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
