import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const gitConfig = {
  user: "cipherstash",
  repo: "docs",
  branch: "main",
};

function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* biome-ignore lint/performance/noImgElement: static SVG logo; next/image gives no benefit for SVGs and would need extra config */}
      <img
        src="/docs/images/cipherstash-logo-dark.svg"
        alt="CipherStash"
        className="h-5 w-5 hidden dark:block"
      />
      {/* biome-ignore lint/performance/noImgElement: static SVG logo; next/image gives no benefit for SVGs and would need extra config */}
      <img
        src="/docs/images/cipherstash-logo-light.svg"
        alt="CipherStash"
        className="h-5 w-5 block dark:hidden"
      />
      <span
        className="text-[11px] font-medium tracking-[0.1em] uppercase text-fd-muted-foreground"
        style={{ fontFamily: "var(--font-fira-code), ui-monospace, monospace" }}
      >
        Docs
      </span>
    </div>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Logo />,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        type: "main",
        text: "Home",
        url: "https://cipherstash.com",
      },
    ],
  };
}
