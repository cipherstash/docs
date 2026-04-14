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

### Styling

Fumadocs UI theme with custom purple primary color (`hsl(269, 70%, 45%)`). Dark mode uses pure black background. CSS variables prefixed with `--color-fd-*` in `src/app/global.css`.

## Formatting

Biome handles both linting and formatting. 2-space indentation. Biome organizes imports automatically. Run `bun run format` before committing.

## Required Skills

Always use the following agent skills when working in this repository. These skills contain the canonical API references and must be consulted to ensure documentation accuracy.

### CipherStash Product Skills

Use these skills whenever writing or editing documentation about the corresponding product area. They contain the complete, up-to-date API surface, code examples, and type signatures.

| Skill | Use when editing docs in |
|---|---|
| `encryption` | `content/docs/encryption/` — Schema definition, encrypt/decrypt, searchable encryption, bulk operations, identity-aware encryption, error handling, migration |
| `secrets` | `content/docs/secrets/` — Secrets SDK (`set`/`get`/`getMany`/`list`/`delete`), `stash` CLI usage, environment isolation |
| `drizzle` | `content/docs/encryption/drizzle.mdx` — `encryptedType` column, `extractEncryptionSchema`, `createEncryptionOperators`, encrypted query operators, batched and/or, EQL migrations |
| `supabase` | `content/docs/encryption/supabase.mdx` — `encryptedSupabase` wrapper, transparent encrypt/decrypt on insert/update/select, query filters (eq, like, gt, in, or, match), identity-aware encryption |
| `dynamodb` | `content/docs/encryption/dynamodb.mdx` — `encryptedDynamoDB` helper, `__source`/`__hmac` attribute naming, encrypted partition/sort keys, bulk operations, audit logging |

### Documentation Update Skill

Use the `update-docs` skill whenever:
- Creating new documentation pages
- Updating existing documentation based on code changes
- Reviewing documentation completeness for a PR
- Scaffolding docs for a new feature

The `update-docs` skill enforces the following workflow:

1. **Analyze changes** — Diff the branch to identify affected files
2. **Map to docs** — Use the code-to-docs mapping to find which MDX files need updates
3. **Review each doc** — Walk through updates with user confirmation before editing
4. **Validate** — Run `bun run lint` to check formatting
5. **Commit** — Stage documentation changes

#### Documentation Validation Checklist

Before committing documentation changes, verify:

- Frontmatter has `title` and `description`
- Code blocks have `filename` attribute
- TypeScript examples come first, with `switcher` and a JS variant where appropriate
- Props/options tables are properly formatted
- Notes use the `> **Good to know**:` callout pattern
- `bun run lint` passes
