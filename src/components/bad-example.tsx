import { CircleX } from "lucide-react";

interface BadExampleProps {
  /** Short label for the header strip. */
  label?: string;
  /** Verbatim error the example produces, rendered as a footer. */
  error?: string;
  /** The example itself (a fenced code block). */
  children: React.ReactNode;
}

/**
 * A code example that does NOT work, styled so a reader skimming the page can
 * never mistake it for one that does — the failure mode of showing broken SQL
 * in the same grey box as the fix.
 *
 * Modelled on rustdoc's `compile_fail` blocks: red frame, an explicit label,
 * and (optionally) the verbatim error underneath. The example keeps the site's
 * syntax highlighting and copy button, because a reader reproducing the failure
 * is a legitimate thing to want.
 */
export function BadExample({
  label = "Doesn't work",
  error,
  children,
}: BadExampleProps) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-red-500/40 bg-red-500/[0.04]">
      <div className="flex items-center gap-1.5 border-b border-red-500/30 bg-red-500/10 px-3 py-1.5">
        <CircleX
          className="size-3.5 shrink-0 text-red-700 dark:text-red-400"
          aria-hidden="true"
        />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
          {label}
        </span>
      </div>

      <div className="p-3 [&>*]:!my-0">{children}</div>

      {error ? (
        <p className="border-t border-red-500/20 px-3 py-2 font-mono text-xs leading-relaxed text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
