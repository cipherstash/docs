import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  basePath: "/docs",
  reactStrictMode: true,
  async redirects() {
    return [
      // Old URLs without /stack/ prefix
      {
        source: "/encryption/:path*",
        destination: "/stack/encryption/:path*",
        permanent: false,
      },
      {
        source: "/platform/:path*",
        destination: "/stack/platform/:path*",
        permanent: false,
      },
      // Old nested supported-queries paths
      {
        source: "/stack/platform/searchable-encryption/supported-queries/:path*",
        destination: "/stack/platform/supported-queries",
        permanent: false,
      },
      // Reference section index → latest
      {
        source: "/stack/reference/stack",
        destination: "/stack/reference/stack/latest",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/stack/:path*.mdx",
          destination: "/llms.mdx/stack/:path*",
        },
      ],
      afterFiles: [
        {
          source: "/ingest/static/:path*",
          destination: "https://us-assets.i.posthog.com/static/:path*",
        },
        {
          source: "/ingest/decide",
          destination: "https://us.i.posthog.com/decide",
        },
        {
          source: "/ingest/:path*",
          destination: "https://us.i.posthog.com/:path*",
        },
      ],
      fallback: [],
    };
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default withMDX(config);
