import { RootProvider } from "fumadocs-ui/provider/next";
import { PostHogProvider } from "@/lib/posthog/provider";
import "./global.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
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
