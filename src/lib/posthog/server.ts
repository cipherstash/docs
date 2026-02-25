import { PostHog } from "posthog-node";

let client: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) return null;

  if (!client) {
    client = new PostHog(key, { host });
  }

  return client;
}
