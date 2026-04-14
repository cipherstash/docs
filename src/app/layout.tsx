import { RootProvider } from "fumadocs-ui/provider/next";
import { PostHogProvider } from "@/lib/posthog/provider";
import "./global.css";
import { Inter, Fira_Code } from "next/font/google";

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
