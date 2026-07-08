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
- **Moving a page** = move the file into `content/docs`, update its facets,
  fix inbound links, confirm its `v2-redirects.mjs` entry, tick it here.

## URL conventions

Lowercase, hyphens, no trailing slashes, no version numbers in paths.
Integrations are **flat** (no category segment). Error pages (future, miette)
live at `/docs/errors/<code>` — permanent, never restructured (CIP-3338).

---

## Content model — two axes

The migration checklist below tracks _what_ moves; this section fixes _where
things go and why_, so placement stops being re-litigated per PR.

### Terms

- **Mode** — what the reader is trying to do. The four Diátaxis kinds
  (tutorial, how-to, reference, explanation), plus our three audience doors
  (integrations, solutions, security) which serve the same placement role.
  A page has exactly one mode; the mode decides its sidebar home.
- **Component** — a layer of the product stack, drawn from the `components`
  facet enum: `encryption` (Stack SDK), `platform` (CTS + ZeroKMS), `eql`,
  `proxy`, `cli`. A page can touch several components at once.
- **Facet** — structured frontmatter that classifies a page along one axis
  (`type`, `components`, `audience`, `integration`). Queryable; never shown
  raw to users; independent of nav position.
- **Hub** — a per-component page at `/components/<component>` that gathers
  every page tagged with that component. A generated view, not a subtree.
  Not every component has a hub: hubs are for _layers_ of the stack
  (`encryption`, `platform`, `eql`, `proxy`). `cli` is a component but a
  cross-cutting tool, not a layer, so it has no hub.
- **Locator** — the one hand-written paragraph (plus mini stack diagram) at the
  top of a hub, orienting the reader: what the component is, what sits above and
  below it. Prose, nothing else.

### The rule

**The sidebar is organized only by mode. The by-component view lives only on the hubs.**

CipherStash is a dependency stack, not a set of independent product pillars:
integrations sit on the Stack SDK and Proxy, both consume EQL, and EQL sits on
the Platform (CTS + ZeroKMS). That is a graph. A sidebar is a tree. So we split
the two axes rather than forcing the graph into the tree.

- **Mode axis (the tree).** Every page has exactly one home, chosen by _what the
  reader is doing_: Diátaxis mode (`get-started`, `guides`, `reference`,
  `concepts`) plus three audience doors (`integrations`, `solutions`,
  `security`). The sidebar is built from `meta.json` and nothing else.
- **Component axis (the graph).** Which layers a page touches is the `components`
  facet — never a sidebar section. The dependency graph is expressed by facets
  and surfaced by hub pages, so a shared layer like EQL is documented once and
  referenced everywhere.

Why the pillar layouts (Supabase, Clerk, GitHub) don't transfer: those are
feature-pillar products whose parts are independent, so each pillar can be its
own subtree. Our parts are layers in a dependency stack — a shared layer has no
single natural parent, so it cannot be a tree node without duplication.

### Placement test

Two questions, in this order, for every page:

1. _Which mode is this?_ → decides the folder (its one sidebar home).
2. _Which components does it touch?_ → sets the `components` facet.

Never the reverse. If you are tempted to file a page _under_ a component, that is
the signal to file it by mode and tag the component instead.

### Invariants

- The sidebar tree is `meta.json` only. Facets never affect nav position
  (already asserted by the schema comment in `source.config.ts`).
- A page appears in exactly one place in the tree. Cross-cutting reuse happens
  through links and hubs, never by duplicating a page under a second parent.
- Shared mechanics have exactly one canonical page; every other page links,
  never restates. This generalises the existing EQL rule (mechanics live in
  `/reference/eql/core-concepts`; category pages link to it) to every component.
- Each component has exactly one hub at `/components/<component>`. A hub is a
  facet-driven _view_: it links to canonical pages and owns no mechanics.
- `/get-started/what-is-cipherstash` renders the components map; its nodes link
  to the hubs. The hubs are the _only_ component-first surface, and they hold no
  primary content — so they do not recreate the legacy component-first tree
  (the old `root: true` Encryption/KMS/Proxy/Platform tabs).

#### A note on hub URLs

Hubs live at the top-level path `/components/<component>` for a short, memorable
front door, but are anchored in the sidebar under Get started (Fumadocs takes
nav position from `meta.json` independently of the URL). If you would rather the
URL mirror the nav, use `/get-started/components/<component>` instead — either
works; pick one and add it to `v2-redirects.mjs`.

### Sidebar

Mode-first, seven top-level sections. `compare` is folded into `concepts` (each
comparison already belongs to a door: aws-kms and vault are security-review
material, fhe and rls-and-tde are concepts). Component hubs are anchored under
Get started, not given their own top-level tab.

```
Get started
├─ What is CipherStash        mental model · components map · audience router
├─ Quickstart
├─ Choose your stack          platform × ORM × auth matrix
├─ Examples
└─ Components                  ← hub views (facet-driven, link-only)
   ├─ Stack SDK
   ├─ Proxy
   ├─ EQL                      (shared)
   └─ Platform (CTS + ZeroKMS)
Integrations                  flat; category grid on the index
├─ Supabase (Database · Auth · Dashboard)
├─ Drizzle · Prisma · Next.js · TypeScript
├─ Clerk · Auth0 · Okta
├─ AWS (RDS/Aurora · DynamoDB)
└─ Serverless · Docker
Concepts
├─ Privacy-first design
├─ Application-level encryption
├─ Searchable encryption      canonical leakage model
├─ EQL                        typed-column model
├─ Key management
├─ Identity-aware encryption
├─ Threat modelling
└─ Compare                    aws-kms · fhe · rls-and-tde · hashicorp-vault
Guides
├─ Development     local setup · schema design · testing & CI · onboarding
├─ Migration       encrypt existing data · adopt incrementally · key rotation
├─ Deployment      production · serverless & bundling · proxy deployment
└─ Troubleshooting query performance · runtime errors · cli · proxy
Security
├─ Architecture               one reconciled ZeroKMS story
├─ ZeroKMS · CTS · Stack SDK · Proxy
├─ Threat scenarios
├─ Availability · Audit logging · Key ownership
└─ Compliance     HIPAA · SOC 2 · GDPR
Solutions
└─ Protecting PII · Healthcare/HIPAA · AI & RAG · Data residency · Provable access
Reference
├─ EQL            core-concepts · numbers · dates · text · json · … · joins
├─ Stack SDK      client · schema · encrypt-decrypt · supabase · drizzle-operators · errors
├─ Auth           lock-contexts · cts-tokens · oidc · access-keys
├─ CLI · Proxy · Workspace
└─ Benchmarks · Agent skills · Glossary
```

### Hub pages

One per component, at `/components/<component>`. Same template every time:

1. **Locator** — one paragraph plus the stack diagram with this layer
   highlighted: what it is, what it sits on, what sits on it.
2. **Start here** — the one or two canonical entry pages.
3. **By mode** — grouped links (Concepts · Guides · Reference · Security ·
   Integrations that use it). Every entry links to its canonical mode-home.
4. Nothing else. No mechanics, no examples that live elsewhere.

The "By mode" lists are generated, not hand-maintained: filter
`source.getPages()` to pages whose `components` facet includes this component,
then group by `type`. "Integrations that use it" is the subset whose frontmatter
also carries an `integration` block. This is why the facet earns its keep — the
hubs cost nothing to maintain once a page is correctly tagged.

**Tagging rule — `eql` is conditional, not automatic.** Stack encrypts values
in three modes: general-purpose (a value in your app), Postgres columns, and
non-Postgres stores like DynamoDB. Only the Postgres path involves EQL. So tag
`eql` only when the page is actually about queryable-in-Postgres ciphertext.
General-purpose and DynamoDB pages are `components: [encryption, platform]` with
_no_ `eql` — DynamoDB (`encryptedDynamoDB`) is the canonical no-EQL example and
the reason "Stack depends on EQL" is wrong. EQL is the Postgres searchability
layer, not a layer every Stack page sits on.

#### Stack SDK — `/components/stack-sdk`  (facet: `encryption`)

- Locator: the TypeScript SDK; encrypt and decrypt values in your app. Sits on
  the Platform. Add EQL when the data lives in Postgres and you want the
  ciphertext queryable there — but Stack also encrypts general-purpose values
  and non-Postgres stores (e.g. DynamoDB) with no EQL at all.
- Start here: Quickstart · Reference → Stack SDK (client + configuration)
- Concepts: application-level encryption · searchable encryption · identity-aware encryption
- Guides: schema design · encrypt existing data · testing & CI · serverless & bundling
- Reference: `/reference/stack/*` (schema · encrypt-decrypt · supabase · drizzle-operators · errors)
- Security: `/security/stack-sdk`
- Integrations (auto): Supabase · Drizzle · Prisma · DynamoDB · Next.js …

#### Proxy — `/components/proxy`  (facet: `proxy`)

- Locator: the no-app-changes path; sits in front of Postgres and speaks EQL for you.
- Start here: Reference → Proxy (configuration) · Guides → Proxy deployment
- Concepts: application-level encryption · searchable encryption
- Guides: proxy deployment · going to production
- Reference: `/reference/proxy/*` (configuration · message-flow · multitenant · errors)
- Security: `/security/proxy`
- Integrations (auto): AWS RDS/Aurora · Docker
- See also: EQL hub (shared dependency)

#### EQL — `/components/eql`  (facet: `eql`)  ← the shared spine

- Locator: the Postgres searchability layer. Makes ciphertext queryable in
  Postgres by declaring an encrypted column's capability in the schema. The
  Proxy always speaks EQL; the Stack SDK uses it only on its Postgres path (not
  for general-purpose or DynamoDB encryption).
- Start here: Reference → EQL (install) · EQL core-concepts
- Concepts: EQL (typed-column model) · searchable encryption (leakage model)
- Reference: the whole `/reference/eql/*` tree
- Guides: troubleshooting → query performance
- Consumed by: Proxy hub (always) · Stack SDK hub (Postgres path only)
- Anti-drift: mechanics live in `/reference/eql/core-concepts`; this hub links only.

#### Platform — `/components/platform`  (facet: see vocab note)  ← the foundation

- Locator: the base everything relies on — key management (ZeroKMS) and identity-bound access (CTS).
- Start here: Security → Architecture · Concepts → Key management
- Concepts: key management · identity-aware encryption
- Reference: `/reference/auth/*` (lock-contexts · cts-tokens · oidc · access-keys)
- Security: architecture · zerokms · cts · availability · audit logging · key ownership
- Integrations (auto): Clerk · Auth0 · Okta

### Worked example: how auth fits

Auth is the concern most likely to feel like it needs its own section — it spans
the SDK, the Proxy, local dev, the Platform, and every auth provider. It doesn't
get one. It's the case that shows the model absorbing a cross-cutting concern
without bending: auth isn't a _layer_, it's a concern that shows up _on_ layers,
so it lives as facets and links, never as a tree section or a hub.

"Auth" names several distinct things. Keep them separate:

| Thing | What it is | `components` | Canonical home |
|---|---|---|---|
| CTS | Identity service in the Platform | `platform` | `/security/cts`, `/reference/auth/*` |
| `@cipherstash/auth` | Stack package (identity-aware encryption) | `[encryption, platform]` | `/reference/stack/auth` |
| Proxy stack-auth | How auth works inside the Proxy | `[proxy, platform]` | `/reference/proxy/*`, `/security/proxy` |
| Next.js adapter | Framework integration | `[encryption, platform]` | `/integrations/nextjs` |
| Clerk / Auth0 / Okta | Auth-provider integrations | `[platform]` | `/integrations/*` (`category: auth-provider`) |

None of these is filed under an "auth" section, because there isn't one. Each is
filed by _mode_ (service → Security/Reference, package → Reference, providers →
Integrations) and tagged by _component_. The through-line is reassembled by
queries, not by a subtree:

- The Platform hub gathers all of it — everything above carries `platform`.
- Faceted search on `integration.category: auth-provider` gives the providers.
- `/concepts/identity-aware-encryption` is the one explanatory page that ties the
  concept together in prose; everything else links to it (anti-drift rule).

Naming caution: `/reference/auth/*` means the CTS _service_; the `@cipherstash/auth`
_package_ lives at `/reference/stack/auth`. Two different things both called
"auth" — keep the paths distinct so contributors don't merge them.

The `components` facet enum is `[encryption, platform, eql, proxy, cli]`
(collapsing the former `auth` and `zerokms` into a single `platform`, matching
the product story "Platform = CTS + ZeroKMS"). This maps 1:1 onto the hubs:
`encryption` → Stack SDK, `platform`, `eql`, `proxy`.

Two notes:

- The `encryption` facet value and its hub title **Stack SDK** differ on
  purpose — the facet names the capability, the hub names the product. Document
  once, move on.
- Collapsing `auth`/`zerokms` into `platform` means you can't isolate the
  CTS/identity pages by facet query anymore — a `platform` query returns all of
  Platform. That distinction still lives in nav location (`/security/cts` vs
  `/security/zerokms`) and in `integration.category: auth-provider` for the
  Clerk/Auth0/Okta pages, so it isn't lost — it just isn't on the `components`
  axis.

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

Folded into Concepts (see the sidebar spec above): the comparison pages live at
`/concepts/compare/*`, not a top-level `/compare` tab. `/stack/reference/comparisons`
and the old `/compare/*` paths redirect there (`v2-redirects.mjs`).

- [x] Section scaffold 🚧 (moved under `concepts/`)
- [ ] `/concepts/compare/aws-kms` (port)
- [ ] `/concepts/compare/fhe` (port)
- [ ] `/concepts/compare/zerokms-vs-hsm` (ZeroKMS vs hardware security modules)
- [ ] `/concepts/compare/rls-and-tde` (new — expand the Supabase-listing RLS contrast)
- [ ] `/concepts/compare/hashicorp-vault` (in flight on `docs/vault-comparison` branch — land there or here, then port)

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
- **EQL (v3 rewrite — CIP-3326; Tailwind-shaped: install → core concepts → type
  categories → indexes → query patterns). Anti-drift rule: shared mechanics
  (typed operands, blockers, envelope, variant model, ORE-equality) live ONLY in
  core-concepts — category/query pages link, never restate:**
- [x] `/reference/eql` — install (single SQL file, permissions split, dbdev, Docker)
- [x] `/reference/eql/core-concepts` — variant model, payload anatomy (absorbs
      cipher-cell), typed-operand rule, fail-loud blockers, term leakage pointer
- [x] `/reference/eql/numbers` — int*/float*/numeric
- [x] `/reference/eql/dates-and-times` — date/timestamp (same traits as numbers,
      distinct semantics)
- [x] `/reference/eql/text` — all six text variants; owns the no-LIKE treatment
- [x] `/reference/eql/json` — ste_vec + sv payload shape + containment/path queries
- [x] `/reference/eql/booleans` — storage-only variants (bool has only that one)
- [x] `/reference/eql/indexes` — functional indexes on extractors; Supabase-compatible
- [x] `/reference/eql/filtering` — =, IN, ranges, token match, containment
- [x] `/reference/eql/sorting` — ORDER BY, extractor sort-key form, pagination
- [x] `/reference/eql/grouping-and-aggregates` — GROUP BY/DISTINCT, min/max, no SUM/AVG
- [x] `/reference/eql/joins` — equijoins, the same-keyset constraint
- [ ] ⛔ `/reference/eql/query-performance` — port the EQL repo performance guide once
      rewritten for v3 upstream (v3 branch folded it into database-indexes.md; verify
      nothing from the v2 guide on main was lost) — see CIP-3351
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
- [x] `/reference/benchmarks` — listing numbers + methodology (CIP-3334)
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
- [ ] ⛔ EQL 3.0.0 release alignment (CIP-3352, blocks CIP-3335) — the EQL reference
      documents the release as decided, ahead of the eql_v3 branch: payload `v: 3`,
      OPE SEM specifier, Docker tag `:17-3.0.0`, `version()` output, schema files.
      Each must land upstream or be walked back in the docs before merge
- [ ] Flip `ENABLE_V2_REDIRECTS=1`, delete `content/stack` + `/stack` routes + legacy loader (CIP-3335)
- [ ] Consistency sweep + Supabase listing v3 revision (CIP-3335)
