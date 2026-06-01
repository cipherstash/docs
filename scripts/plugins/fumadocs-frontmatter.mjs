// @ts-check
import { ReflectionKind } from "typedoc";
import { MarkdownPageEvent } from "typedoc-plugin-markdown";

const FALLBACK_PACKAGE = "@cipherstash/stack";
const MAX_DESCRIPTION = 160;
// Below this, a bare TSDoc summary reads as a "too short" meta description, so
// we extend it with package context instead of shipping it as-is.
const MIN_DESCRIPTION = 70;

// Human-readable, lowercase noun for each reflection kind. TypeDoc's
// `ReflectionKind.singularString` returns i18n keys (e.g. "kind_type_alias")
// outside a translated context, so we map the kinds we emit ourselves.
const KIND_LABELS = {
  [ReflectionKind.Class]: "class",
  [ReflectionKind.Interface]: "interface",
  [ReflectionKind.Function]: "function",
  [ReflectionKind.TypeAlias]: "type",
  [ReflectionKind.Variable]: "variable",
  [ReflectionKind.Enum]: "enum",
  [ReflectionKind.Namespace]: "namespace",
  [ReflectionKind.Module]: "module",
};

/** @param {number | undefined} kind */
function kindLabel(kind) {
  return (kind != null && KIND_LABELS[kind]) || "";
}

/** @param {string} text */
function truncate(text) {
  return text.length > MAX_DESCRIPTION
    ? `${text.slice(0, MAX_DESCRIPTION - 3)}...`
    : text;
}

/**
 * Build SEO-friendly frontmatter for a generated API reference page.
 *
 * `title` stays the bare symbol name — that's the visual H1 developers expect.
 * `seoTitle` (consumed by the docs page metadata) is package-qualified so the
 * <title>/OG tags aren't a bare token like "Client". `description` is never the
 * old "API reference for X" stub: it uses the TSDoc summary when there is one,
 * otherwise a descriptive fallback built from the symbol's kind and package.
 *
 * @param {object} input
 * @param {string} input.name - symbol (or project) name
 * @param {number | undefined} input.kind - TypeDoc ReflectionKind
 * @param {string} input.summary - extracted TSDoc summary (may be empty)
 * @param {string} input.pkg - package name, e.g. "@cipherstash/stack"
 * @param {boolean} input.isRoot - true for the package index page
 * @returns {{ title: string, seoTitle: string, description: string }}
 */
export function buildPageMeta({ name, kind, summary, pkg, isRoot }) {
  const clean = (summary || "").trim();
  const label = kindLabel(kind);

  let description;
  if (clean.length >= MIN_DESCRIPTION) {
    description = truncate(clean);
  } else if (clean) {
    description = truncate(
      `${clean} ${name} in the ${pkg} TypeScript API reference.`,
    );
  } else if (isRoot) {
    description = truncate(
      `API reference for ${pkg}: every exported type, function, and class, with signatures, parameters, and usage.`,
    );
  } else {
    const article = label ? `a ${label}` : "part of the API";
    description = truncate(
      `${name} is ${article} in ${pkg}. TypeScript API reference with its signature, parameters, and usage.`,
    );
  }

  const seoTitle = isRoot ? `${pkg} API reference` : `${name} · ${pkg} API`;

  return { title: name, seoTitle, description };
}

/**
 * Custom TypeDoc plugin for Fumadocs compatibility.
 *
 * Handles:
 * - Setting title, seoTitle, and description frontmatter (required by Fumadocs)
 * - Sanitizing MDX-incompatible syntax from generated markdown
 *
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
  // Set frontmatter on page begin
  app.renderer.on(
    MarkdownPageEvent.BEGIN,
    /** @param {import('typedoc-plugin-markdown').MarkdownPageEvent} page */
    (page) => {
      const projectName = page.project?.name ?? "";
      const pkg =
        process.env.DOCS_PACKAGE_NAME || projectName || FALLBACK_PACKAGE;
      const name = page.model?.name || projectName || "API Reference";
      const isRoot = !page.model || name === projectName;
      const summary = (page.model?.comment?.summary ?? [])
        .map((part) => part.text)
        .join("")
        .trim();

      const meta = buildPageMeta({
        name,
        kind: page.model?.kind,
        summary,
        pkg,
        isRoot,
      });

      page.frontmatter = {
        ...meta,
        // Author-provided frontmatter (e.g. @description comment tags,
        // frontmatterGlobals) still wins.
        ...page.frontmatter,
      };
    },
  );

  // Sanitize content on page end
  app.renderer.on(
    MarkdownPageEvent.END,
    /** @param {import('typedoc-plugin-markdown').MarkdownPageEvent} page */
    (page) => {
      if (!page.contents) {
        return;
      }

      // Remove any raw JSX-like tags that MDX would try to interpret as components.
      // TypeDoc with useHTMLEncodedBrackets should handle most of these,
      // but catch any stragglers.
      page.contents = page.contents.replace(
        /<(?!\/?(a|br|hr|img|code|pre|em|strong|ul|ol|li|p|h[1-6]|table|thead|tbody|tr|th|td|blockquote|div|span|details|summary)\b)[^>]+>/g,
        (match) => {
          // Escape the angle brackets
          return match.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        },
      );
    },
  );
}
