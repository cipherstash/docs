import { createMDX } from "fumadocs-mdx/next";
import { v2Redirects } from "./v2-redirects.mjs";

const withMDX = createMDX();

// V2 IA migration (CIP-3325): the full legacy→v2 redirect map is gated so the
// preview site serves BOTH trees while sections migrate (legacy at /stack, v2
// at the root). Flip on at merge; once content/stack is deleted the map
// becomes unconditional (CIP-3335). Coverage is enforced by
// `bun run validate-redirects` regardless of the flag.
const enableV2Redirects = process.env.ENABLE_V2_REDIRECTS === "1";

// Migrated legacy sections redirect as soon as their replacements are
// complete, without waiting for the root-level v2 IA cutover. The two legacy
// landing pages remain available until ENABLE_V2_REDIRECTS is flipped.
const enabledV2RedirectPrefixes = [
  "/stack/quickstart",
  "/stack/cipherstash/postgres",
  "/stack/cipherstash/supabase",
  "/stack/cipherstash/encryption",
  "/stack/cipherstash/kms",
  "/stack/cipherstash/proxy",
  "/stack/cipherstash/cli",
  "/stack/deploy",
  "/stack/reference",
];

function isEnabledV2Redirect(source) {
  return enabledV2RedirectPrefixes.some(
    (prefix) => source === prefix || source.startsWith(`${prefix}/`),
  );
}

/** @type {import('next').NextConfig} */
const config = {
  basePath: "/docs",
  reactStrictMode: true,
  async redirects() {
    return [
      // The app lives under the /docs basePath, so the bare domain root
      // (e.g. on Vercel preview URLs) would otherwise 404. In production
      // "/" never reaches this app — cipherstash.com routes only /docs/*
      // here — so this only affects previews.
      {
        source: "/",
        destination: "/docs",
        basePath: false,
        permanent: false,
      },
      // Vanity URL for the new IA (safe to ship ungated: the path has no
      // legacy traffic). Temporary until the v2 quickstart is canonical.
      {
        source: "/quickstart",
        destination: "/get-started/quickstart",
        permanent: false,
      },
      // Concepts is a non-clickable sidebar group with no landing page.
      // Keep its direct URL useful without rendering a synthetic Overview.
      {
        source: "/concepts",
        destination: "/concepts/searchable-encryption",
        permanent: false,
      },
      // Guides is a non-clickable sidebar group with no landing page.
      // Keep its direct URL useful without rendering a synthetic Overview.
      {
        source: "/guides",
        destination: "/guides/deployment",
        permanent: false,
      },
      // Reference is a non-clickable sidebar group with no landing page.
      // Keep its direct URL useful without rendering a synthetic Overview.
      {
        source: "/reference",
        destination: "/reference/eql",
        permanent: false,
      },
      {
        source: "/integrations/prisma-next",
        destination: "/integrations/prisma",
        permanent: true,
      },
      ...v2Redirects.filter(
        ({ source }) => enableV2Redirects || isEnabledV2Redirect(source),
      ),
      // === 4-section consolidation: product sections under /cipherstash/ ===
      {
        source: "/stack/encryption/:path*",
        destination: "/reference/stack/:path*",
        permanent: true,
      },
      {
        source: "/stack/encryption",
        destination: "/reference/stack",
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
        destination: "/reference/proxy/:path*",
        permanent: true,
      },
      {
        source: "/stack/proxy",
        destination: "/reference/proxy",
        permanent: true,
      },
      {
        source: "/stack/kms/:path*",
        destination: "/concepts/key-management/:path*",
        permanent: true,
      },
      {
        source: "/stack/kms",
        destination: "/concepts/key-management",
        permanent: true,
      },
      // understand/ → reference/
      {
        source: "/stack/understand/:path*",
        destination: "/reference/eql/:path*",
        permanent: true,
      },
      {
        source: "/stack/understand",
        destination: "/reference/eql",
        permanent: true,
      },
      // Old URLs without /stack/ prefix
      {
        source: "/encryption/:path*",
        destination: "/reference/stack/:path*",
        permanent: false,
      },
      // === Earlier restructure redirects: guides/ → new locations ===
      {
        source: "/stack/guides/getting-started",
        destination: "/get-started/quickstart",
        permanent: true,
      },
      {
        source: "/stack/guides/going-to-production",
        destination: "/guides/deployment",
        permanent: true,
      },
      {
        source: "/stack/guides/team-onboarding",
        destination: "/guides/deployment",
        permanent: true,
      },
      {
        source: "/stack/guides/planning-guide",
        destination: "/get-started/choose-your-stack",
        permanent: true,
      },
      {
        source: "/stack/guides/agent-skills",
        destination: "/reference/agent-skills",
        permanent: true,
      },
      {
        source: "/stack/guides/supported-solutions",
        destination: "/integrations",
        permanent: true,
      },
      {
        source: "/stack/guides",
        destination: "/get-started/quickstart",
        permanent: true,
      },
      // === Restructure redirects: platform/ → new locations ===
      {
        source: "/stack/platform/what-is-cipherstash",
        destination: "/get-started/what-is-cipherstash",
        permanent: true,
      },
      {
        source: "/stack/platform/security-architecture",
        destination: "/security/cryptography",
        permanent: true,
      },
      {
        source: "/stack/platform/searchable-encryption",
        destination: "/concepts/searchable-encryption",
        permanent: true,
      },
      {
        source: "/stack/platform/supported-queries",
        destination: "/concepts/searchable-encryption",
        permanent: true,
      },
      {
        source: "/stack/platform/cipher-cell",
        destination: "/reference/eql/core-concepts",
        permanent: true,
      },
      {
        source: "/stack/platform/eql",
        destination: "/reference/eql",
        permanent: true,
      },
      {
        source: "/stack/platform/aws-kms-comparison",
        destination: "/concepts/compare/aws-kms",
        permanent: true,
      },
      // === Comparisons consolidation: flat pages → /reference/comparisons/ ===
      {
        source: "/stack/reference/aws-kms-comparison",
        destination: "/concepts/compare/aws-kms",
        permanent: true,
      },
      {
        source: "/stack/reference/fhe-comparison",
        destination: "/concepts/compare/fhe",
        permanent: true,
      },
      {
        source: "/stack/platform/compliance",
        destination: "/security/compliance",
        permanent: true,
      },
      {
        source: "/stack/platform/glossary",
        destination: "/reference/glossary",
        permanent: true,
      },
      {
        source: "/stack/platform/members",
        destination: "/reference/workspace/members",
        permanent: true,
      },
      {
        source: "/stack/platform/billing",
        destination: "/reference/workspace/billing",
        permanent: true,
      },
      {
        source: "/stack/platform/use-cases/:path*",
        destination: "/solutions/:path*",
        permanent: true,
      },
      {
        source: "/stack/platform/:path*",
        destination: "/reference/eql/:path*",
        permanent: true,
      },
      // === Restructure redirects: encryption/ moved pages ===
      {
        source: "/stack/encryption/getting-started",
        destination: "/get-started/quickstart",
        permanent: true,
      },
      {
        source: "/stack/encryption/bundling",
        destination: "/guides/deployment",
        permanent: true,
      },
      {
        source: "/stack/encryption/sst",
        destination: "/guides/deployment",
        permanent: true,
      },
      {
        source: "/stack/encryption/testing",
        destination: "/guides/deployment",
        permanent: true,
      },
      {
        source: "/stack/encryption/troubleshooting",
        destination: "/guides/deployment",
        permanent: true,
      },
      {
        source: "/stack/encryption/error-handling",
        destination: "/reference/stack/api-reference/errors",
        permanent: true,
      },
      {
        source: "/stack/encryption/migration",
        destination: "/reference/stack/usage",
        permanent: true,
      },
      // === Restructure redirects: proxy/ moved pages ===
      {
        source: "/stack/proxy/aws-ecs",
        destination: "/guides/deployment",
        permanent: true,
      },
      {
        source: "/stack/proxy/errors",
        destination: "/reference/proxy/errors",
        permanent: true,
      },
      {
        source: "/stack/proxy/reference",
        destination: "/reference/proxy/configuration",
        permanent: true,
      },
      // Legacy generated Stack reference → the V2 API reference
      {
        source: "/stack/reference/stack",
        destination: "/reference/stack/api-reference",
        permanent: false,
      },
      // === AI-cited URLs orphaned by the restructure ===
      // Recovered from ai-monitoring citation data (window 2026-05-12 → 2026-06-02):
      // these 12 paths are cited by AI search engines (OpenAI/Anthropic) but now 404,
      // discarding ~73 citations' worth of equity. Targets verified live 2026-06-02.
      // NOTE: sources/destinations omit the "/docs" basePath, per the file's convention.
      // Mixed permanence by design: paths whose mapping is settled and unlikely to be
      // reused (the protect-js / proxy / aws-ecs entries) are permanent (308) for SEO;
      // the rest are temporary (307) so those old paths stay free to repurpose later.
      {
        // Most-cited dead docs URL — 50 citations.
        source: "/getting-started/what-is-cipherstash",
        destination: "/get-started/what-is-cipherstash",
        permanent: false,
      },
      {
        source: "/what-is-cipherstash",
        destination: "/get-started/what-is-cipherstash",
        permanent: false,
      },
      {
        source: "/getting-started/supported-solutions",
        destination: "/integrations",
        permanent: false,
      },
      {
        source: "/getting-started",
        destination: "/",
        permanent: false,
      },
      {
        // Protect SDK lives in the encryption section.
        source: "/protect-js/getting-started",
        destination: "/reference/stack",
        permanent: true,
      },
      {
        source: "/reference/protect-js",
        destination: "/reference/stack",
        permanent: true,
      },
      {
        source: "/devops/proxy",
        destination: "/reference/proxy",
        permanent: true,
      },
      {
        source: "/proxy/how-to/aws-ecs",
        destination: "/guides/deployment",
        permanent: true,
      },
      // NOTE(v2): the AI-citation redirect "/reference/eql" →
      // "/stack/reference/eql" was removed here — its source collides with
      // the v2 IA's /reference/eql page, which now serves that traffic
      // directly (CIP-3325).
      {
        source: "/platform/workspaces/key-sets",
        destination: "/concepts/key-management",
        permanent: false,
      },
      // ZeroKMS section was renamed to kms — catch-all covers disaster-recovery etc.
      {
        source: "/platform/zerokms/:path*",
        destination: "/concepts/key-management/:path*",
        permanent: false,
      },
      {
        source: "/platform/zerokms",
        destination: "/concepts/key-management",
        permanent: false,
      },

      // === 404 recovery from the public-docs log export (2026-08-26 → 08-31) ===
      // Every distinct 404 in that window that has a live successor, reviewed
      // in REDIRECT-MAP-REVIEW.md. These are the URLs models memorised from the
      // Protect.js / ZeroKMS-era docs: an agent that "knows" CipherStash walks
      // straight into them. Permanent (308) unless a successor page is planned,
      // where 307 keeps the old path free to reclaim.
      //
      // Deliberately absent: /sdk/protect/go, /sdk/protect/php (SDKs on the way,
      // an honest 404 beats a redirect to the wrong language) and
      // /stack/cipherstash/secrets/* (secrets docs are gone pending a new version).

      // -- Landing pages and top-level strays --
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      // 307: the platform section is coming back.
      {
        source: "/platform",
        destination: "/",
        permanent: false,
      },
      {
        source: "/glossary",
        destination: "/reference/glossary",
        permanent: true,
      },
      {
        source: "/overview/quick-start",
        destination: "/get-started/quickstart",
        permanent: true,
      },
      {
        source: "/api",
        destination: "/reference",
        permanent: true,
      },
      // The FAQ belongs on the marketing site, not in docs.
      {
        source: "/faq",
        destination: "https://cipherstash.com/faq",
        permanent: true,
      },

      // -- Old onboarding tree --
      // step-3, step-4, next-steps, cipherstash-proxy: no 1:1 successors.
      {
        source: "/getting-started/:path*",
        destination: "/get-started",
        permanent: true,
      },

      // -- Old task tree (how-to/*) --
      {
        source: "/how-to/creating-clients",
        destination: "/reference/auth/clients",
        permanent: true,
      },
      {
        source: "/how-to/deleting-access-keys",
        destination: "/reference/auth/access-keys",
        permanent: true,
      },
      {
        source: "/how-to/customer-hosting",
        destination: "/reference/auth/oidc-configuration",
        permanent: true,
      },
      // Provider-specific setup pages (auth0, okta) folded into OIDC config.
      {
        source: "/how-to/customer-hosting/:path*",
        destination: "/reference/auth/oidc-configuration",
        permanent: true,
      },
      // Datasets became keysets.
      {
        source: "/how-to/creating-datasets",
        destination: "/concepts/key-management",
        permanent: true,
      },
      {
        source: "/how-to/encryption-migrations",
        destination: "/guides/migration",
        permanent: true,
      },
      {
        source: "/how-to/kubernetes-deployment",
        destination: "/guides/deployment",
        permanent: true,
      },
      {
        source: "/how-to/passthrough-context",
        destination: "/solutions/provable-access",
        permanent: true,
      },
      // 307: a local development guide is planned.
      {
        source: "/how-to/local-development",
        destination: "/get-started/quickstart",
        permanent: false,
      },
      {
        source: "/how-to",
        destination: "/guides",
        permanent: true,
      },
      // Catch-all: keep last in this group.
      {
        source: "/how-to/:path*",
        destination: "/guides",
        permanent: true,
      },

      // -- CTS and ZeroKMS service trees --
      {
        source: "/cts",
        destination: "/concepts/auth",
        permanent: true,
      },
      {
        source: "/cts/:path*",
        destination: "/concepts/auth",
        permanent: true,
      },
      {
        source: "/zerokms",
        destination: "/concepts/key-management",
        permanent: true,
      },
      {
        source: "/zerokms/:path*",
        destination: "/concepts/key-management",
        permanent: true,
      },

      // -- Concepts and architecture --
      {
        source: "/concepts/audit",
        destination: "/concepts/access-analytics",
        permanent: true,
      },
      {
        source: "/concepts/identify",
        destination: "/concepts/auth",
        permanent: true,
      },
      {
        source: "/concepts/database-proxy",
        destination: "/reference/proxy",
        permanent: true,
      },
      // Singular-'concept' tree; hit by Bing.
      {
        source: "/concept/database-proxy",
        destination: "/reference/proxy",
        permanent: true,
      },
      {
        source: "/concept/end-to-end-identity",
        destination: "/solutions/provable-access",
        permanent: true,
      },
      {
        source: "/concepts/zero-trust-key-management",
        destination: "/concepts/key-management",
        permanent: true,
      },
      // 307: a replacement page is planned.
      {
        source: "/concepts/what-is-sensitive-data",
        destination: "/concepts",
        permanent: false,
      },
      {
        source: "/searchable-encryption",
        destination: "/concepts/searchable-encryption",
        permanent: true,
      },
      {
        source: "/architecture",
        destination: "/security",
        permanent: true,
      },
      // trust-model, components, availability.
      {
        source: "/architecture/:path*",
        destination: "/security",
        permanent: true,
      },

      // -- Pages moved by this change --
      {
        source: "/security/cts",
        destination: "/concepts/auth",
        permanent: true,
      },
      {
        source: "/security/audit-logging",
        destination: "/concepts/access-analytics",
        permanent: true,
      },

      // -- Old proxy tree --
      {
        source: "/proxy",
        destination: "/reference/proxy",
        permanent: true,
      },
      {
        source: "/proxy/about",
        destination: "/reference/proxy",
        permanent: true,
      },
      // 307: a proxy quickstart is planned.
      {
        source: "/proxy/getting-started",
        destination: "/reference/proxy",
        permanent: false,
      },
      {
        source: "/proxy/how-to/supabase",
        destination: "/integrations/supabase",
        permanent: true,
      },
      {
        source: "/proxy/reference/migrator",
        destination: "/guides/migration",
        permanent: true,
      },
      // Catch-all: keep last in this group.
      {
        source: "/proxy/:path*",
        destination: "/reference/proxy",
        permanent: true,
      },

      // -- Protect.js naming era --
      {
        source: "/protect-js",
        destination: "/reference/stack",
        permanent: true,
      },
      {
        source: "/protectjs/about",
        destination: "/reference/stack",
        permanent: true,
      },
      {
        source: "/protect/sdk/js",
        destination: "/reference/stack",
        permanent: true,
      },
      {
        source: "/guides/protect-js",
        destination: "/get-started/quickstart",
        permanent: true,
      },
      {
        source: "/sdk",
        destination: "/reference/stack",
        permanent: true,
      },
      {
        source: "/sdk/protect-js",
        destination: "/reference/stack",
        permanent: true,
      },
      {
        source: "/sdk/protect/nodejs",
        destination: "/reference/stack",
        permanent: true,
      },
      {
        source: "/sdk/how-to",
        destination: "/reference/stack",
        permanent: true,
      },
      {
        source: "/sdk/how-to/cli",
        destination: "/reference/cli",
        permanent: true,
      },
      {
        source: "/sdk/reference",
        destination: "/reference/stack",
        permanent: true,
      },
      {
        source: "/sdk/reference/cli",
        destination: "/reference/cli",
        permanent: true,
      },

      // -- Generated API reference (typedoc) --
      {
        source: "/reference/protectjs",
        destination: "/reference/stack/api-reference",
        permanent: true,
      },
      // latest/, v8.4.0/, v9.6.0/ symbol pages have no successors.
      {
        source: "/reference/protect-js/:path*",
        destination: "/reference/stack/api-reference",
        permanent: true,
      },
      {
        source: "/reference/protectjs/:path*",
        destination: "/reference/stack/api-reference",
        permanent: true,
      },

      // -- Reference strays --
      {
        source: "/reference/dynamodb",
        destination: "/integrations/aws/dynamodb",
        permanent: true,
      },
      {
        source: "/dynamodb/reference",
        destination: "/integrations/aws/dynamodb",
        permanent: true,
      },
      {
        source: "/databases/dynamodb",
        destination: "/integrations/aws/dynamodb",
        permanent: true,
      },
      {
        source: "/reference/data-access-events",
        destination: "/concepts/access-analytics",
        permanent: true,
      },
      {
        source: "/reference/dataset-configurations",
        destination: "/concepts/key-management",
        permanent: true,
      },
      {
        source: "/reference/index-types",
        destination: "/reference/eql/indexes",
        permanent: true,
      },
      // 307: /reference/proxy/auth is planned.
      {
        source: "/reference/proxy-identity",
        destination: "/reference/proxy",
        permanent: false,
      },
      {
        source: "/reference/proxy-ops",
        destination: "/reference/proxy",
        permanent: true,
      },
      {
        source: "/reference/regions",
        destination: "/solutions/data-residency",
        permanent: true,
      },
      {
        source: "/reference/limitations",
        destination: "/reference",
        permanent: true,
      },
      {
        source: "/reference/faq",
        destination: "https://cipherstash.com/faq",
        permanent: true,
      },
      // Tandem is the old name for Proxy.
      {
        source: "/reference/tandem-configuration",
        destination: "/reference/proxy/configuration",
        permanent: true,
      },

      // -- Integrations --
      // 307: RDS and Aurora pages are planned.
      {
        source: "/integrations/aws",
        destination: "/integrations/aws/dynamodb",
        permanent: false,
      },
      {
        source: "/integrations/schema",
        destination: "/reference/stack/api-reference/schema",
        permanent: true,
      },
      {
        source: "/integrations/supabase/index",
        destination: "/integrations/supabase",
        permanent: true,
      },
      {
        source: "/integrations/prisma/db",
        destination: "/integrations/prisma",
        permanent: true,
      },

      // -- stack/* paths v2-redirects.mjs does not cover --
      // 307: organizations are distinct from workspaces; own pages planned.
      {
        source: "/stack/reference/organizations",
        destination: "/reference/workspace",
        permanent: false,
      },
      {
        source: "/stack/reference/organizations/members",
        destination: "/reference/workspace/members",
        permanent: true,
      },
      {
        source: "/stack/use-cases",
        destination: "/solutions",
        permanent: true,
      },
      {
        source: "/stack/use-cases/:path*",
        destination: "/solutions/:path*",
        permanent: true,
      },
      {
        source: "/stack/searchable-encryption",
        destination: "/concepts/searchable-encryption",
        permanent: true,
      },
      {
        source: "/stack/planning-guide",
        destination: "/get-started/choose-your-stack",
        permanent: true,
      },
      {
        source: "/stack/cipherstash/forge/api",
        destination: "/reference/cli",
        permanent: true,
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
        // Raw-markdown mirror for the v2 tree (Cloudflare/agents fetch
        // <page>.mdx). Listed after the /stack rule so legacy paths keep
        // resolving to the legacy collection.
        {
          source: "/:path*.mdx",
          destination: "/llms.mdx/v2/:path*",
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
