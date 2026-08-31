// @ts-check
import { MarkdownPageEvent } from "typedoc-plugin-markdown";

/**
 * Shorten the "Defined in:" link labels to a bare filename.
 *
 * TypeDoc labels each source link with the file's path relative to the
 * entry-point base — "../execution/envelope-bigint.ts:27",
 * "eql/v3/column.ts:41". The href is a correct absolute GitHub URL, but the
 * label reads as a relative path, and anything that keeps link text while
 * dropping the href resolves it against the page URL:
 *
 *   /docs/integrations/prisma/api-reference/operation-types
 *   + ../execution/envelope-bigint.ts:27
 *   = /docs/integrations/prisma/execution/envelope-bigint.ts:27
 *
 * That exact path, line number included, showed up 46 times in the
 * public-docs 404 logs over 4.5 days — agents reading the reference and
 * following the label as if it were a link. A bare "envelope-bigint.ts:27"
 * has no path shape to resolve, and reads better as anchor text either way.
 * The href is untouched, so the link still lands on the right line on GitHub.
 *
 * Labels that are already a bare filename are left alone.
 *
 * @param {import('typedoc').Application} app
 */
export function load(app) {
  app.renderer.on(
    MarkdownPageEvent.END,
    /** @param {import('typedoc-plugin-markdown').MarkdownPageEvent<any>} page */
    (page) => {
      if (!page.contents) return;
      // A markdown link whose label is a path ending in a source file, with an
      // optional :line suffix. Requiring the extension keeps this off ordinary
      // links; requiring a "/" in the label keeps it off already-bare names.
      page.contents = page.contents.replace(
        /\[([^\]\s]*\/[^\]\s/]+\.[cm]?[jt]sx?(?::\d+)?)\]\((https?:\/\/[^)\s]+)\)/g,
        (_match, label, href) =>
          `[${label.slice(label.lastIndexOf("/") + 1)}](${href})`,
      );
    },
  );
}
