# Retrievability rules, and a proposal for enforcing them

An SEO consultant's read of these docs in August 2026: *"Excellent docs: built
to be read by a developer, not retrieved by a model."*

The mechanical half of that — agents literally could not fetch pages — has been
worked through: absolute URLs in `llms.txt`, source URLs in `llms-full.txt`, 77
redirects off the pre-V2 URL tree, the `.md` suffix rewrite, working internal
links in the markdown views. Those were bugs, and bugs stay fixed.

The editorial half does not stay fixed. It regresses one page at a time, and
nothing currently notices.

This document defines what "retrievable" means here concretely enough to check,
and proposes `scripts/validate-retrievability.ts` to check it.

## Why it regresses

Retrieval does not match a query against a page. It matches against a **chunk** —
a section, a few hundred tokens, lifted out of the document that gave it
context. Everything the surrounding page supplied is gone: the H1, the
breadcrumb, the sidebar, the paragraph before.

So a section headed `## How it works`, on a page titled `Overview`, in a folder
called Concepts, names its subject exactly nowhere. It is a perfectly good
heading for someone reading the page top to bottom, and close to useless for
retrieval. That single pattern is the whole finding, and it is invisible to a
human reviewer precisely because they are reading the page top to bottom.

## What is mechanically checkable

There is no off-the-shelf linter for this. But most of what was measured is
shape, and shape is checkable.

Measured against `content/docs` on `main` (90 hand-written pages; generated
`api-reference` trees excluded):

| Signal | Today |
| --- | --- |
| Headings (H2–H4) | 624 |
| Bare generic headings (`How it works`, `Examples`, `Overview`, …) | 26 |
| Question-shaped headings | 6 |
| Chunks naming no product entity in their first 600 characters | 65 |
| Orphan back-references (`as shown above`, `the previous section`) | 0 |
| Frontmatter descriptions absent or outside 110–158 characters | 49 |

## The rules

### 1. A heading names its own subject

Flags H2–H4 whose text, lowercased and stripped, is a bare label from a
denylist: `how it works`, `overview`, `examples`, `errors`, `configuration`,
`usage`, `the problem`, `limitations`, and so on. Also flags a heading opening
with a pronoun that has no antecedent inside its own chunk.

Navigation boilerplate is allowlisted and left alone — `Related`, `Next steps`,
`Before you start`, `In this section`, `Prerequisites`. Those headings are
structural furniture, they are not trying to be retrieved, and renaming them
would make pages read worse for no gain.

**Enforce as a hard failure.** 26 occurrences today, all of them fixable by
writing a better heading, and the two open PRs that name headings bring that to
zero.

### 2. A chunk names an entity

Flags a section whose first ~600 characters mention no product noun —
CipherStash, EQL, ZeroKMS, CTS, keyset, lock context, encrypted column,
Supabase, Prisma, Drizzle, Postgres.

65 occurrences, and this is the rule with real false positives: a section can
legitimately be pure prose that inherits its subject from two paragraphs up.

**Enforce as a ratcheting baseline**, not a hard failure. Commit the current
count; fail only when it goes up. The number comes down when someone is editing
that page anyway, and never silently grows.

### 3. No orphan back-references

Flags `as shown above`, `as described above`, `the previous section`, `see
above`, `described earlier`. In a chunk, "above" is nothing.

**Hard failure.** Zero today; keeping zero costs nothing.

### 4. Frontmatter descriptions are present and useful

`description` is the one-line summary that goes into `llms.txt` and into search
results, and it is the only text some agents ever see about a page. Flags
missing descriptions and lengths outside 110–158 characters — the range a
previous SEO pass already normalised 52 pages into, which nothing currently
holds.

49 pages are off-spec today, but many are section index stubs that carry a
short nav description deliberately. **Ratcheting baseline**, with index pages
excluded from the tree exempted outright.

### 5. The markdown views emit no root-relative link

Renders what `/docs/<path>.mdx` actually returns and asserts no `](/…)` link
survives it.

This rule exists because `validate-links.ts` cannot catch that class of defect
and should not be changed to try. It resolves links against the collections as
the app serves them (`content/docs` at `baseUrl: ""`), so `/reference/auth/clients`
is a correct link to a real page — and it actively *rejects* the absolute form,
on the grounds that Next's basePath prepends `/docs` and a `/docs` prefix would
resolve to `/docs/docs/…`. Both of those judgements are right for the HTML
rendering.

There are two renderings. The HTML page has a basePath and a browser to resolve
against. The markdown view is a flat file read from an origin, where that
context is gone and the same link resolves to `cipherstash.com/reference/auth/clients`
— a 404, on every internal link in every page body and in all 3 MB of
`llms-full.txt`. `getLLMText` now absolutises on the way out, so pages keep
authoring the root-relative form the source checker enforces.

The lesson generalises past this one bug: a source-level check validates one
rendering. Anything that reshapes content on the way out needs its output
asserted, not its input.

**Hard failure.** It is an invariant of the route, not a matter of degree.

## How it runs

Beside the validators that already exist, in the same style, wired into the
same place:

```
"validate-retrievability": "tsx scripts/validate-retrievability.ts",
"prebuild": "… && bun run validate-links && bun run validate-redirects && bun run validate-retrievability"
```

`scripts/validate-links.ts`, `validate-content-api.ts`, `validate-mermaid.ts`
and `validate-v2-redirects.ts` all follow this shape: read `content/`, print a
one-line verdict on success, print every failure with `file:line` and exit 1.
This one adds a baseline file, `scripts/fixtures/retrievability-baseline.json`,
holding the per-rule counts for the ratcheting rules, and `--update-baseline`
to move it.

Generated trees are skipped, the same way `validate-content-api.ts` already
skips them. Where a generated page breaks a rule the fix belongs in its
generator, not in a suppression — the same argument that took
`generate-cli-docs.ts` from `## Examples` to `## stash init examples`.

## What this deliberately does not do

These rules are proxies. They check that a chunk *carries* its subject, not
that it *answers* anything. A page can pass every rule here and still be
unretrievable because it explains a mechanism nobody would search for.

The real test is a retrieval eval: a fixed set of questions a developer or
their agent would actually ask, run against the live docs, checking whether the
right page comes back in the top few results. That is a heavier thing to build
and to maintain, and it is worth building once the mechanical rules stop
finding anything. Starting there instead would mean hand-tuning an eval harness
against 26 headings a regex can find today.

## Rollout

1. Rules 1, 3 and 5 as hard failures. They are at or near zero once the open
   heading and markdown-view PRs land, so they start green and stay green.
2. Rules 2 and 4 recorded as a baseline in the same PR, failing only on
   increase.
3. Revisit after a quarter of real content changes: whether the baselines have
   actually come down, and whether rule 2's false-positive rate is low enough
   to promote it to a hard failure.

## Related

- **CIP-3339** — AI-agent readiness. This is the enforcement arm of that
  issue's content rules, and of its "negative capability statements" bullet.
- **CIP-3337** — Docs correctness CI. Same gate, different axis: that one asks
  whether the docs are *true*, this one asks whether they can be *found*.
