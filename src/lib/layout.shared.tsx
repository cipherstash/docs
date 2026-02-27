import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

export const gitConfig = {
  user: "cipherstash",
  repo: "docs",
  branch: "main",
};

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/docs/images/logo.png"
        alt="CipherStash"
        width={24}
        height={24}
      />
      <span className="text-base font-medium text-fd-foreground">Docs</span>
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
