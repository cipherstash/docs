import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { getPostHogClient } from "@/lib/posthog/server";

export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (request.method !== "GET") {
    return NextResponse.next();
  }

  // Never track API requests
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Get or generate __backend_id
  let backendId = request.cookies.get("__backend_id")?.value ?? null;
  if (!backendId) {
    backendId = `backend-${crypto.randomUUID()}`;
  }

  // Track backend_view event via PostHog (non-blocking)
  event.waitUntil(
    (async () => {
      const posthog = getPostHogClient();
      if (!posthog) return;

      try {
        posthog.capture({
          distinctId: backendId as string,
          event: "backend_view",
          properties: {
            $current_url: request.nextUrl.href,
            $referrer: request.headers.get("referer") ?? "",
            $browser: request.headers.get("user-agent") ?? "",
            $ip: request.headers.get("x-forwarded-for") ?? "",
            backendId,
          },
        });
        await posthog.flush();
      } catch (error) {
        console.error("Error tracking PostHog event:", error);
      }
    })(),
  );

  // Set cookie scoped to .cipherstash.com for cross-domain tracking
  if (!request.cookies.get("__backend_id")) {
    response.cookies.set("__backend_id", backendId, {
      domain: ".cipherstash.com",
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: false,
      secure: true,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|ingest|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
