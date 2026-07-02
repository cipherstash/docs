import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { v2source } from "@/lib/source";

// Layout for the V2 IA tree (content/docs), served from the site root.
// A *required* catch-all (`[...slug]`, not `[[...slug]]`) so it never
// competes with the (home) route for "/". Static routes (/stack, /api,
// /og, …) take precedence over this segment as usual.
export default function Layout({ children }: LayoutProps<"/[...slug]">) {
  return (
    <DocsLayout tree={v2source.getPageTree()} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
