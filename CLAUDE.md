# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CipherStash documentation site (docs-v2). A Next.js 16 app using [Fumadocs](https://fumadocs.dev) for documentation, Tailwind CSS v4, and React 19.

## Commands

```bash
bun dev               # Start dev server (http://localhost:3000)
bun run build         # Production build
bun run lint          # Biome lint check
bun run format        # Biome format (auto-fix)
bun run types:check   # Generate MDX types + TypeScript check
```

There are no tests in this project.

## Architecture

### Content Pipeline

Documentation lives in `content/docs/` as MDX files. Fumadocs MDX processes them via `source.config.ts`, which outputs generated types to `.source/` (gitignored). The content source is loaded in `src/lib/source.ts` using Fumadocs' `loader()` API with `baseUrl: '/docs'`.

Navigation ordering is controlled by `meta.json` files in each content directory. Each `meta.json` has a `pages` array that defines sidebar order. Sections with `"root": true` in their meta.json appear as top-level sidebar tabs (e.g., Encryption, Secrets, KMS, Proxy, Platform, Concepts).

### Route Structure

- `app/(home)/` — Landing page (redirects to `/docs`)
- `app/docs/[[...slug]]/` — All documentation pages, rendered from MDX via `source.getPage(slug)`
- `app/api/search/` — Orama-based search endpoint created from the content source
- `app/og/docs/[...slug]/` — OG image generation per doc page
- `app/llms.txt/` — LLM-friendly page index (title + description per page)
- `app/llms-full.txt/` — Full processed markdown of all pages concatenated
- `app/llms.mdx/docs/[[...slug]]/` — Individual page markdown (served via rewrite from `/docs/:path*.mdx`)

### Path Aliases

- `@/*` → `./src/*`
- `fumadocs-mdx:collections/*` → `.source/*` (auto-generated, do not edit)

### Custom MDX Components

Registered in `src/mdx-components.tsx`. Extends Fumadocs defaults with `Steps` and `Step` components. The `a` tag uses `createRelativeLink` to resolve relative MDX file links.

### AI/LLM Features

Each doc page has a "Copy Markdown" button and an "Open" popover (GitHub, ChatGPT, Claude, Cursor, Scira AI) implemented in `src/components/ai/page-actions.tsx`. These use the `.mdx` rewrite URL to fetch processed markdown.

### Shared Layout Config

`src/lib/layout.shared.tsx` exports `gitConfig` (user, repo, branch) and `baseOptions()` used by both the docs layout and individual page links (GitHub edit URLs, etc.).

## Content Conventions

### Frontmatter

Every MDX file requires `title` and `description`:

```yaml
---
title: Getting started
description: Install the SDK and encrypt your first value in under 5 minutes
---
```

### Code Blocks

- Always include `filename` attribute for code examples
- Use `bash` language without filename for terminal commands
- Use `highlight={1,3-5}` for line highlighting
- Fumadocs `Steps`/`Step` components are available for step-by-step guides

#### Copy analytics

Every code block's copy button emits a PostHog `code_copied` event (see
`src/components/code-block.tsx` and the Shiki transformer in `source.config.ts`).
Blocks marked as CTAs also emit `cta_viewed` once when scrolled into view, giving
a per-page `cta_viewed` → `code_copied` (is_cta: true) funnel.
`page_path` and `language` are captured automatically; add optional fence
metadata to enrich the event:

- `example-id="install-drizzle"` — stable slug for the block. When omitted, a
  fallback is derived from the filename/language plus the block's position.
- `cta` — marks the block as a call-to-action (sets `is_cta: true`). Use
  `cta="false"` to opt a block out.
- `cta-type="install"` — categorizes the CTA (`install`, `quickstart`,
  `signup`). Implies `cta`, so a block with a `cta-type` is treated as a CTA
  even without the bare `cta` flag.

Quote attribute values (`example-id="…"`); bare flags (`cta`) need no value.

```` ```bash cta cta-type="install" example-id="install-drizzle" ````
mark install commands and other CTAs so they can be tracked distinctly.

### Styling

Fumadocs UI theme with custom purple primary color (`hsl(269, 70%, 45%)`). Dark mode uses pure black background. CSS variables prefixed with `--color-fd-*` in `src/app/global.css`.

## Formatting

Biome handles both linting and formatting. 2-space indentation. Biome organizes imports automatically. Run `bun run format` before committing.
