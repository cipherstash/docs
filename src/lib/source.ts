import { docs, v2docs } from "fumadocs-mdx:collections/server";
import { type InferPageType, loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { createElement } from "react";
import { SupabaseIcon } from "@/components/icons/supabase";

const customIcons: Record<string, () => React.ReactElement> = {
  Supabase: () => createElement(SupabaseIcon, { width: 16, height: 16 }),
};

function resolveIcon(icon: string | undefined) {
  if (!icon) return undefined;
  if (icon in customIcons) return customIcons[icon]();
  const LucideIcon = icons[icon as keyof typeof icons];
  if (LucideIcon) return createElement(LucideIcon);
  return undefined;
}

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/stack",
  source: docs.toFumadocsSource(),
  icon: resolveIcon,
});

// V2 IA tree (CIP-3325): content/docs served from the site root, e.g.
// /docs/get-started/quickstart. Lives alongside the legacy `source` during
// the migration; the legacy loader and /stack routes are deleted at the end.
export const v2source = loader({
  baseUrl: "/",
  source: v2docs.toFumadocsSource(),
  icon: resolveIcon,
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/stack/${segments.join("/")}`,
  };
}

export async function getLLMText(
  page: InferPageType<typeof source> | InferPageType<typeof v2source>,
) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

${processed}`;
}
