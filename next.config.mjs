import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  basePath: "/docs",
  reactStrictMode: true,
  async redirects() {
    return [
      // === 4-section consolidation: product sections under /cipherstash/ ===
      {
        source: "/stack/encryption/:path*",
        destination: "/stack/cipherstash/encryption/:path*",
        permanent: true,
      },
      {
        source: "/stack/encryption",
        destination: "/stack/cipherstash/encryption",
        permanent: true,
      },
      {
        source: "/stack/secrets/:path*",
        destination: "/stack/cipherstash/secrets/:path*",
        permanent: true,
      },
      {
        source: "/stack/secrets",
        destination: "/stack/cipherstash/secrets",
        permanent: true,
      },
      {
        source: "/stack/proxy/:path*",
        destination: "/stack/cipherstash/proxy/:path*",
        permanent: true,
      },
      {
        source: "/stack/proxy",
        destination: "/stack/cipherstash/proxy",
        permanent: true,
      },
      {
        source: "/stack/kms/:path*",
        destination: "/stack/cipherstash/kms/:path*",
        permanent: true,
      },
      {
        source: "/stack/kms",
        destination: "/stack/cipherstash/kms",
        permanent: true,
      },
      // understand/ → reference/
      {
        source: "/stack/understand/:path*",
        destination: "/stack/reference/:path*",
        permanent: true,
      },
      {
        source: "/stack/understand",
        destination: "/stack/reference",
        permanent: true,
      },
      // Old URLs without /stack/ prefix
      {
        source: "/encryption/:path*",
        destination: "/stack/cipherstash/encryption/:path*",
        permanent: false,
      },
      // === Earlier restructure redirects: guides/ → new locations ===
      {
        source: "/stack/guides/getting-started",
        destination: "/stack/quickstart",
        permanent: true,
      },
      {
        source: "/stack/guides/going-to-production",
        destination: "/stack/deploy/going-to-production",
        permanent: true,
      },
      {
        source: "/stack/guides/team-onboarding",
        destination: "/stack/deploy/team-onboarding",
        permanent: true,
      },
      {
        source: "/stack/guides/planning-guide",
        destination: "/stack/reference/planning-guide",
        permanent: true,
      },
      {
        source: "/stack/guides/agent-skills",
        destination: "/stack/reference/agent-skills",
        permanent: true,
      },
      {
        source: "/stack/guides/supported-solutions",
        destination: "/stack/reference/supported-solutions",
        permanent: true,
      },
      {
        source: "/stack/guides",
        destination: "/stack/quickstart",
        permanent: true,
      },
      // === Restructure redirects: platform/ → new locations ===
      {
        source: "/stack/platform/what-is-cipherstash",
        destination: "/stack/reference/what-is-cipherstash",
        permanent: true,
      },
      {
        source: "/stack/platform/security-architecture",
        destination: "/stack/reference/security-architecture",
        permanent: true,
      },
      {
        source: "/stack/platform/searchable-encryption",
        destination: "/stack/cipherstash/encryption/searchable-encryption",
        permanent: true,
      },
      {
        source: "/stack/platform/supported-queries",
        destination: "/stack/cipherstash/encryption/searchable-encryption",
        permanent: true,
      },
      {
        source: "/stack/platform/cipher-cell",
        destination: "/stack/reference/cipher-cell",
        permanent: true,
      },
      {
        source: "/stack/platform/eql",
        destination: "/stack/reference/eql-guide",
        permanent: true,
      },
      {
        source: "/stack/platform/aws-kms-comparison",
        destination: "/stack/reference/aws-kms-comparison",
        permanent: true,
      },
      {
        source: "/stack/platform/compliance",
        destination: "/stack/reference/compliance",
        permanent: true,
      },
      {
        source: "/stack/platform/glossary",
        destination: "/stack/reference/glossary",
        permanent: true,
      },
      {
        source: "/stack/platform/members",
        destination: "/stack/reference/members",
        permanent: true,
      },
      {
        source: "/stack/platform/billing",
        destination: "/stack/reference/billing",
        permanent: true,
      },
      {
        source: "/stack/platform/use-cases/:path*",
        destination: "/stack/reference/use-cases/:path*",
        permanent: true,
      },
      {
        source: "/stack/platform/:path*",
        destination: "/stack/reference/:path*",
        permanent: true,
      },
      // === Restructure redirects: encryption/ moved pages ===
      {
        source: "/stack/encryption/getting-started",
        destination: "/stack/quickstart",
        permanent: true,
      },
      {
        source: "/stack/encryption/bundling",
        destination: "/stack/deploy/bundling",
        permanent: true,
      },
      {
        source: "/stack/encryption/sst",
        destination: "/stack/deploy/sst",
        permanent: true,
      },
      {
        source: "/stack/encryption/testing",
        destination: "/stack/deploy/testing",
        permanent: true,
      },
      {
        source: "/stack/encryption/troubleshooting",
        destination: "/stack/deploy/troubleshooting",
        permanent: true,
      },
      {
        source: "/stack/encryption/error-handling",
        destination: "/stack/reference/error-handling",
        permanent: true,
      },
      {
        source: "/stack/encryption/migration",
        destination: "/stack/reference/migration",
        permanent: true,
      },
      // === Restructure redirects: proxy/ moved pages ===
      {
        source: "/stack/proxy/aws-ecs",
        destination: "/stack/deploy/aws-ecs",
        permanent: true,
      },
      {
        source: "/stack/proxy/errors",
        destination: "/stack/reference/proxy-errors",
        permanent: true,
      },
      {
        source: "/stack/proxy/reference",
        destination: "/stack/reference/proxy-reference",
        permanent: true,
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
