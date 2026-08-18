/**
 * "Last updated" stamp for a docs page, from the last commit that touched its
 * source file (see the last-modified plugin in source.config.ts).
 *
 * Rendered on the server rather than with Fumadocs' `PageLastUpdate`, which
 * fills the date in a `useEffect` to dodge locale mismatches — that keeps the
 * date out of the server-rendered HTML, so it is invisible to crawlers and to
 * anyone reading with JS off, and pops in after paint for everyone else. A
 * freshness signal is worth having in the markup.
 *
 * Rendering a date on the server only stays hydration-safe if the output does
 * not depend on where it runs, so both the locale and the time zone are pinned
 * rather than inherited from the host. `<time>` carries the machine-readable
 * value alongside the human one.
 */
const FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function LastUpdated({ date }: { date: Date }) {
  return (
    <p className="ms-auto text-sm text-fd-muted-foreground">
      Last updated{" "}
      <time dateTime={date.toISOString()}>{FORMATTER.format(date)}</time>
    </p>
  );
}
