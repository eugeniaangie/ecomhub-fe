import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/integrations",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/integrations/shopee",
        destination: "/settings/integration/shopee",
        permanent: true,
      },
      {
        source: "/sales/shopee",
        destination: "/sales/shopee/orders",
        permanent: true,
      },
      {
        source: "/sales/returns",
        destination: "/sales/shopee/returns",
        permanent: true,
      },
      {
        source: "/sales/ads",
        destination: "/sales/shopee/ads",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
