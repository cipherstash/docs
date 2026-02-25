"use client";

import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Suspense,
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

const PostHogContext = createContext<typeof posthog | null>(null);

export function usePostHog() {
  return useContext(PostHogContext);
}

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

function PostHogInit() {
  useEffect(() => {
    if (!POSTHOG_KEY || !POSTHOG_HOST) return;

    posthog.init(POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: POSTHOG_HOST,
      capture_pageview: false, // we track manually for SPA nav
      capture_pageleave: true,
      cross_subdomain_cookie: true,
      persistence: "localStorage+cookie",
    });

    // Identify with __backend_id cookie if present
    const backendId = document.cookie
      .split("; ")
      .find((c) => c.startsWith("__backend_id="))
      ?.split("=")[1];

    if (backendId) {
      posthog.identify(backendId);
    }
  }, []);

  return null;
}

function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) {
        url += `?${search}`;
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  if (!POSTHOG_KEY || !POSTHOG_HOST) {
    return <>{children}</>;
  }

  return (
    <PostHogContext.Provider value={posthog}>
      <PostHogInit />
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </PostHogContext.Provider>
  );
}
