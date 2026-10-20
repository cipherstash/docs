# CipherStash Documentation

Documentation for [CipherStash](https://cipherstash.com) — searchable encryption, secrets management, and key management for TypeScript applications.

## Development

```bash
bun install
bun dev
```

Open [http://localhost:3001/docs](http://localhost:3001/docs) to view the docs.

## Commands

- `bun dev` — Start the dev server
- `bun run build` — Production build
- `bun run lint` — Run Biome lint check
- `bun run format` — Run Biome format

## Search (CIP-3350)

Search uses Orama 3.1.18 with a custom tokenizer and the current Fumadocs MDX
collection. Standalone code fences are indexed alongside their rendered heading
anchors; navigation cards are excluded. Dots and underscores normalize to the
same namespace separator, identifier suffixes and camelCase parts are searchable,
and prefix matches precede one-character typo fallback. SQL `text_eq` stays
distinct from SDK `TextEq`.

Titles and headings carry more weight than fenced code, followed by prose.
Results show each page once, at its best matching anchor. The first three remain
in relevance order; additional results group by documentation section. The page
type filter uses frontmatter (`reference`, `guide`, `concept`, `tutorial`).
The legacy `/stack` collection was retired in #116 and must remain excluded.

The index is built once per server instance from the deployed MDX exports.
There is no separately persisted search index or crawler refresh. Responses
are not cached and include `X-Search-Revision` (content digest) and
`X-Search-Pages` for deployment verification.

The dialog sends `docs_search` after a query settles for 700 ms (or immediately
on selection), `docs_search_zero_results` for successful empty searches, and
`docs_search_result_selected` on navigation. Properties include `query`,
`page_type`, the displayed `result_count`, and `search_revision`; selections
include `result_url` and position. Repeated query/filter combinations are
deduplicated within one dialog session. Failed and cancelled requests do not
count as content gaps. PostHog must be configured as in `.env.example`.

Validate against a running production build or a PR preview:

```bash
bun run test:search
bun run build
bunx --no-install next start -p 3001
# In another terminal:
bun run validate-search
bunx --no-install playwright install chromium
bun run test:search:browser
# Or use the preview URL, including /docs:
bun run validate-search https://PREVIEW_HOST/docs
SEARCH_BASE_URL=https://PREVIEW_HOST/docs bun run test:search:browser
```

To include analytics assertions locally, build with
`NEXT_PUBLIC_POSTHOG_KEY=phc_search_test` and
`NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`, then run browser tests with
`SEARCH_ANALYTICS_TEST=1`. Browser tests intercept all PostHog ingest requests
and simulate a normal browser for capture; no test events reach PostHog.
The Docs search CI workflow runs these checks against a full production build.

**Engine decision:** retain Orama. The installed engine supports the tokenizer,
field weights, filters and typo fallback we need, keeps preview indexes tied to
their deployments, and avoids sending the full index to every browser.
[Algolia DocSearch](https://docsearch.algolia.com/docs/who-can-apply/) remains a
fallback if relevance or operational needs outgrow this implementation. Its
application requires an Algolia account and domain-owner verification; no
application is submitted or crawler configured by this change. AI answers remain
out of scope.

## Contributing

We welcome contributions. Open an issue with the `documentation` tag or submit a pull request.

## Security

See [SECURITY.md](SECURITY.md) for security policies and reporting process.

## License

See [LICENSE](LICENSE.md) for license information.
