# Docs V2 — Information Architecture & migration checklist

Living checklist for the docs overhaul. Tracked in Linear under
[CIP-3307](https://linear.app/cipherstash/issue/CIP-3307); the full IA rationale
(design principles, audience doors, correctness strategy) lives in
`CipherStash docs IA v1.md` in the content repo. **Tick items here as they land
on the `v2` branch.** Legend: `[ ]` todo · `[x]` done · 🚧 stub exists · ⛔ blocked
on a product decision (see CIP-3307 checklist).

## How this branch works

- New IA lives in `content/docs`, served from the site root (`/docs/<section>/…`).
- The legacy tree (`content/stack`) is served alongside it at `/docs/stack/…`
  until every section migrates, then deleted (CIP-3335).
- The full legacy→v2 redirect map is `v2-redirects.mjs`, gated behind
  `ENABLE_V2_REDIRECTS=1` (flipped on at merge). `bun run validate-redirects`
  enforces that every legacy page has a mapping.
- Frontmatter facets (`type`, `components`, `audience`, `integration`,
  `verifiedAgainst`, `reviewBy`) are defined in `source.config.ts` (`v2docs`).
- **Moving a page = ** move the file into `content/docs`, update its facets,
  fix inbound links, confirm its `v2-redirects.mjs` entry, tick it here.

## URL conventions

Lowercase, hyphens, no trailing slashes, no version numbers in paths.
Integrations are **flat** (no category segment). Error pages (future, miette)
live at `/docs/errors/<code>` — permanent, never restructured (CIP-3338).

---

## Get started — CIP-3327

- [x] Section scaffold 🚧
- [ ] `/get-started/what-is-cipherstash` — mental model, components map, audience router
- [ ] `/get-started/quickstart` — rewritten on EQL v3 (fixes `cs_match_v1`, broken scaffold imports)
- [ ] `/get-started/choose-your-stack` — static matrix v1 (platform × ORM × auth)
- [ ] `/get-started/examples` — runnable example apps index
- [ ] `/docs` landing page 🚧 — now `content/docs/index.mdx` rendered inside the docs
      nav (the old standalone `(home)` route is deleted; recoverable from git history).
      CIP-3327 refines the content (what-is + audience router)

## Integrations — CIP-3328 (Supabase), CIP-3330 (auth), CIP-3336 (rest)

- [x] Section scaffold 🚧 (index + supabase stub with facet exemplar)
- [ ] `/integrations` index — category grid w/ setup badges
- [ ] `/integrations/supabase` — flagship tutorial (CIP-3328)
- [ ] `/integrations/supabase/database`
- [ ] `/integrations/supabase/auth`
- [ ] `/integrations/supabase/dashboard-experience` — Table Editor, expose eql schema
- [ ] ⛔ `/integrations/supabase/edge-functions` — pending Deno/FFI answer
- [ ] ⛔ `/integrations/supabase/realtime` — pending product verification
- [ ] `/integrations/drizzle` — merge the two divergent Drizzle pages
- [ ] `/integrations/prisma-next`
- [ ] `/integrations/aws/rds-aurora` — Proxy path
- [ ] `/integrations/aws/dynamodb`
- [ ] `/integrations/clerk`
- [ ] `/integrations/auth0` — end-to-end example (Clerk parity)
- [ ] `/integrations/okta` — end-to-end example (Clerk parity)
- [ ] `/integrations/nextjs`
- [ ] `/integrations/typescript` — thin router to Stack SDK reference
- [ ] `/integrations/serverless` — Vercel/Lambda, bundling, CS_CONFIG_PATH
- [ ] `/integrations/docker`
- [ ] ⛔ `/integrations/edge-workers` — pending Deno/workerd answer

## Concepts — CIP-3333 (searchable-encryption), others per section tickets

- [x] Section scaffold 🚧
- [ ] `/concepts/privacy-first-design`
- [ ] `/concepts/application-level-encryption` — vs TDE/pgcrypto/RLS
- [ ] `/concepts/searchable-encryption` — REWRITE with honest leakage model (canonical leakage page)
- [ ] `/concepts/eql` — the typed-column model (declare capability in the schema)
- [ ] `/concepts/key-management` — per-value keys, rotation, crypto-shredding
- [ ] `/concepts/identity-aware-encryption` — lock contexts, CTS (CIP-3330)
- [ ] `/concepts/threat-modelling`

## Comparisons — CIP-3333

- [x] Section scaffold 🚧
- [ ] `/compare/aws-kms` (port)
- [ ] `/compare/fhe` (port)
- [ ] `/compare/rls-and-tde` (new — expand the Supabase-listing RLS contrast)
- [ ] `/compare/hashicorp-vault` (in flight on `docs/vault-comparison` branch — land there or here, then port)

## Guides

- [x] Section scaffold 🚧 (development, migration, deployment, troubleshooting)
- [ ] `/guides/development/local-setup` — profiles, device auth, workspaces, keys
- [ ] `/guides/development/schema-design` — which encrypted type/variant per column (CIP-3327)
- [ ] `/guides/development/testing-and-ci` (port deploy/testing)
- [ ] `/guides/development/team-onboarding` (port)
- [ ] `/guides/migration/encrypt-existing-data` — the backfill guide, runnable (CIP-3329)
- [ ] ⛔ `/guides/migration/upgrading-from-eql-v2` — REQUIRED; mechanics pending product answer (CIP-3329)
- [ ] `/guides/migration/adopting-incrementally` (CIP-3329)
- [ ] `/guides/migration/key-rotation-operations`
- [ ] `/guides/deployment/going-to-production` (port)
- [ ] `/guides/deployment/serverless-and-bundling` (merge bundling + sst)
- [ ] `/guides/deployment/proxy-deployment` (merge proxy Docker + aws-ecs)
- [ ] `/guides/troubleshooting` index — symptom-based router
- [ ] `/guides/troubleshooting/query-performance` — seq-scan diagnosis, typed-operand gotcha
- [ ] `/guides/troubleshooting/runtime-errors`
- [ ] `/guides/troubleshooting/cli` (port)
- [ ] `/guides/troubleshooting/proxy` (port)

## Architecture & security — CIP-3331, CIP-3332 (compliance)

- [x] Section scaffold 🚧
- [ ] `/security/architecture` — ONE reconciled ZeroKMS mechanism story (kills the 3 conflicting accounts)
- [ ] `/security/zerokms`
- [ ] `/security/cts` — auth layer architecture (CIP-3330)
- [ ] `/security/stack-sdk`
- [ ] `/security/proxy`
- [ ] `/security/threat-scenarios`
- [ ] ⛔ `/security/availability-and-continuity` — DR (port) + SLA + exit story; pending SLA answer
- [ ] ⛔ `/security/audit-logging` — pending retention answer
- [ ] ⛔ `/security/key-ownership` — BYOK/self-hosted; pending product answer
- [ ] `/security/compliance` index — framework mapping (port, good)
- [ ] `/security/compliance/hipaa` — BAA scope, §164.312 mapping (CIP-3332)
- [ ] `/security/compliance/soc2` — verify Type II report exists
- [ ] `/security/compliance/gdpr`

## Solutions

- [x] Section scaffold 🚧
- [ ] `/solutions/protecting-pii` (new)
- [ ] `/solutions/healthcare-hipaa` (new; pairs with compliance/hipaa)
- [ ] `/solutions/ai-and-rag` (port use-cases/ai-rag)
- [ ] `/solutions/data-residency` (port)
- [ ] `/solutions/provable-access` (port)

## Reference

- [x] Section scaffold 🚧 (eql, stack, auth, cli, proxy, workspace)
- **EQL (v3 rewrite — CIP-3326):**
- [ ] `/reference/eql` — overview + install (single SQL file, permissions split, dbdev, Docker)
- [ ] `/reference/eql/types` — 10 scalar families × variants + `eql_v3.json`
- [ ] `/reference/eql/operators` — per-variant matrix incl. what RAISES; typed-operand rule
- [ ] `/reference/eql/indexes` — functional indexes on extractors; Supabase-compatible
- [ ] `/reference/eql/json` — ste_vec, path queries
- [ ] `/reference/eql/functions` — incl. aggregates (min/max only)
- [ ] `/reference/eql/payload-format` — v/i/c envelope, hm/ob/bf (absorbs cipher-cell)
- **Stack SDK:**
- [ ] `/reference/stack` — client + configuration (port encryption/* pages)
- [ ] `/reference/stack/schema`
- [ ] `/reference/stack/encrypt-decrypt` (+ bulk, models)
- [ ] `/reference/stack/supabase` — THE canonical `encryptedSupabase` page, ONE signature (CIP-3328)
- [ ] `/reference/stack/drizzle-operators`
- [ ] `/reference/stack/errors` — port error-handling; miette catalog later (CIP-3338)
- [ ] `/reference/stack/upgrading-from-protect` (retitled package-rename guide)
- **Auth (CIP-3330):**
- [ ] `/reference/auth/lock-contexts`
- [ ] `/reference/auth/cts-tokens`
- [ ] `/reference/auth/oidc-configuration`
- [ ] `/reference/auth/access-keys` (+ clients)
- **CLI / Proxy / Workspace:**
- [ ] `/reference/cli/*` (port 9 pages)
- [ ] `/reference/proxy/*` (configuration, message-flow, multitenant, errors)
- [ ] `/reference/workspace/billing` + `/members` + `/configuration`
- **Cross-cutting:**
- [ ] `/reference/benchmarks` — listing numbers + methodology (CIP-3334)
- [ ] `/reference/agent-skills` (port; expand per CIP-3339)
- [ ] `/reference/glossary` (port)
- [ ] Repoint `scripts/generate-docs.ts` TypeDoc output → `content/docs/reference/stack`

## Infrastructure / final pass

- [x] `v2` branch + this checklist
- [x] `v2docs` collection + facet schema (`source.config.ts`)
- [x] Root catch-all routes (`src/app/[...slug]`), llms.mdx mirror, sitemap/llms.txt include v2
- [x] `v2-redirects.mjs` (flag-gated) + `validate-redirects` gate in prebuild
- [x] `/quickstart` vanity redirect
- [ ] OG images for v2 pages (route only covers legacy tree)
- [ ] Correctness CI: snippet type-checking, SQL-vs-EQL-Docker, terminology lint (CIP-3337)
- [ ] llms.txt curation + Cloudflare AI crawl policy + md-degradation check (CIP-3339)
- [ ] Flip `ENABLE_V2_REDIRECTS=1`, delete `content/stack` + `/stack` routes + legacy loader (CIP-3335)
- [ ] Consistency sweep + Supabase listing v3 revision (CIP-3335)
