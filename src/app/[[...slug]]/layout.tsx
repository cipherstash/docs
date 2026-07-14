import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { getV2PageTree } from "@/lib/source";

// Layout for the V2 IA tree (content/docs), served from the site root —
// including the /docs landing page (content/docs/index.mdx), which renders
// inside the same navigation shell as every other page. Static routes
// (/stack, /api, /og, …) take precedence over this segment as usual.
export default function Layout({ children }: LayoutProps<"/[[...slug]]">) {
  return (
    <DocsLayout tree={getV2PageTree()} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
