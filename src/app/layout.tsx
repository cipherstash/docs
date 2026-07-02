import { RootProvider } from "fumadocs-ui/provider/next";
import { PostHogProvider } from "@/lib/posthog/provider";
import "./global.css";
import type { Metadata } from "next";
import { Fira_Code, Inter } from "next/font/google";

// Site-wide title template so every page gets a descriptive, branded
// <title>. Per-page metadata returns a bare title (e.g. "Keysets") which
// this template expands to "Keysets | CipherStash Docs".
// NOTE: intentionally no `metadataBase` — the OG image URLs rely on Vercel's
// inferred deployment origin (docs.cipherstash.com); overriding the base
// would break them. Canonical/og:url are set as absolute URLs per page.
export const metadata: Metadata = {
  title: {
    template: "%s | CipherStash Docs",
    default: "CipherStash Docs",
  },
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${firaCode.variable} ${inter.className}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <PostHogProvider>
          <RootProvider
            search={{
              options: {
                api: "/docs/api/search",
              },
            }}
          >
            {children}
          </RootProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
