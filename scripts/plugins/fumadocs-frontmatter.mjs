// @ts-check
import { MarkdownPageEvent } from "typedoc-plugin-markdown";

/**
 * Custom TypeDoc plugin for Fumadocs compatibility.
 *
 * Handles:
 * - Setting title and description frontmatter (required by Fumadocs)
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
      const title = page.model?.name || page.project?.name || "API Reference";

      // Build a description from the model comment if available
      let description = `API reference for ${title}`;
      if (page.model?.comment?.summary) {
        const summaryText = page.model.comment.summary
          .map((part) => part.text)
          .join("")
          .trim();
        if (summaryText) {
          // Truncate to a reasonable description length
          description =
            summaryText.length > 160
              ? `${summaryText.slice(0, 157)}...`
              : summaryText;
        }
      }

      page.frontmatter = {
        title,
        description,
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
