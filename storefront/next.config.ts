import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // фото товаров пока живут на CDN Shopify (до переноса в своё хранилище)
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
