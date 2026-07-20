import { createMDX } from "fumadocs-mdx/next";
import { v2Redirects } from "./v2-redirects.mjs";

const withMDX = createMDX();

// V2 IA migration (CIP-3325): the full legacy→v2 redirect map is gated so the
// preview site serves BOTH trees while sections migrate (legacy at /stack, v2
// at the root). Flip on at merge; once content/stack is deleted the map
// becomes unconditional (CIP-3335). Coverage is enforced by
// `bun run validate-redirects` regardless of the flag.
const enableV2Redirects = process.env.ENABLE_V2_REDIRECTS === "1";

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
      // === v2 IA rename: Concepts section → How It Works ===
      // The section was renamed after the /concepts URLs went live on the
      // preview tree; point the old paths at the new slug. Temporary (307)
      // until the v2 IA is canonical.
      {
        source: "/concepts/:path*",
        destination: "/how-it-works/:path*",
        permanent: false,
      },
      {
        source: "/concepts",
        destination: "/how-it-works",
        permanent: false,
      },
      // The How It Works section has no landing page of its own; send the
      // section root to its first page.
      {
        source: "/how-it-works",
        destination: "/how-it-works/why-field-encryption-fails",
        permanent: false,
      },
      ...(enableV2Redirects ? v2Redirects : []),
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
        destination: "/stack/reference/comparisons/aws-kms",
        permanent: true,
      },
      // === Comparisons consolidation: flat pages → /reference/comparisons/ ===
      {
        source: "/stack/reference/aws-kms-comparison",
        destination: "/stack/reference/comparisons/aws-kms",
        permanent: true,
      },
      {
        source: "/stack/reference/fhe-comparison",
        destination: "/stack/reference/comparisons/fhe",
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
        destination: "/stack/reference/what-is-cipherstash",
        permanent: false,
      },
      {
        source: "/what-is-cipherstash",
        destination: "/stack/reference/what-is-cipherstash",
        permanent: false,
      },
      {
        source: "/getting-started/supported-solutions",
        destination: "/stack/reference/supported-solutions",
        permanent: false,
      },
      {
        source: "/getting-started",
        destination: "/stack",
        permanent: false,
      },
      {
        // Protect SDK lives in the encryption section.
        source: "/protect-js/getting-started",
        destination: "/stack/cipherstash/encryption",
        permanent: true,
      },
      {
        source: "/reference/protect-js",
        destination: "/stack/cipherstash/encryption",
        permanent: true,
      },
      {
        source: "/devops/proxy",
        destination: "/stack/cipherstash/proxy",
        permanent: true,
      },
      {
        source: "/proxy/how-to/aws-ecs",
        destination: "/stack/deploy/aws-ecs",
        permanent: true,
      },
      // NOTE(v2): the AI-citation redirect "/reference/eql" →
      // "/stack/reference/eql" was removed here — its source collides with
      // the v2 IA's /reference/eql page, which now serves that traffic
      // directly (CIP-3325).
      {
        source: "/platform/workspaces/key-sets",
        destination: "/stack/cipherstash/kms/keysets",
        permanent: false,
      },
      // ZeroKMS section was renamed to kms — catch-all covers disaster-recovery etc.
      {
        source: "/platform/zerokms/:path*",
        destination: "/stack/cipherstash/kms/:path*",
        permanent: false,
      },
      {
        source: "/platform/zerokms",
        destination: "/stack/cipherstash/kms",
        permanent: false,
      },
      // === Pre-publish placeholder for the v2 docs restructure ===
      // The v2 branch will host the Supabase docs at /docs/integrations/supabase,
      // but that branch isn't published yet. Until it ships, temporarily (307)
      // point the future URL at the current Supabase overview page so external
      // links to it resolve. Remove this once v2 owns /integrations/supabase.
      {
        source: "/integrations/supabase",
        destination: "/stack/cipherstash/supabase",
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
