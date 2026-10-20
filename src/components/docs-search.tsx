"use client";

import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  FileText,
  Hash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePostHog } from "@/lib/posthog/provider";
import {
  type DocsSearchResult,
  groupResults,
  MAX_QUERY_LENGTH,
  type PageType,
  pageTypes,
} from "@/lib/search/shared";

interface SearchResponse {
  key: string;
  results: DocsSearchResult[];
  error?: boolean;
  revision?: string;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return text;
  const pattern = new RegExp(
    `(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "ig",
  );
  return text.split(pattern).map((part, i) =>
    i % 2 ? (
      <mark
        key={`${i}-${part}`}
        className="bg-transparent font-semibold text-fd-primary"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function DocsSearchDialog(props: SharedProps) {
  const [query, setQuery] = useState("");
  const [pageType, setPageType] = useState<PageType | "">("");
  const [response, setResponse] = useState<SearchResponse>();
  const [retry, setRetry] = useState(0);
  const [activeId, setActiveId] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const router = useRouter();
  const posthog = usePostHog();
  const term = query.trim();
  const key = `${retry}:${pageType}:${term}`;
  const current = response?.key === key ? response : undefined;
  const loading = props.open && !!term && !current;
  const results = useMemo(() => current?.results ?? [], [current]);
  const groups = useMemo(() => groupResults(results), [results]);
  const ordered = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );
  const active = ordered.find((result) => result.id === activeId) ?? ordered[0];
  const optionId = (result: DocsSearchResult) =>
    `${listId}-${ordered.indexOf(result)}`;
  const tracked = useRef(new Set<string>());

  useEffect(() => {
    if (!props.open || !term) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ query: term });
        if (pageType) params.set("type", pageType);
        const res = await fetch(`/docs/api/search?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Search returned ${res.status}`);
        const results: DocsSearchResult[] = await res.json();
        if (!controller.signal.aborted) {
          setActiveId(undefined);
          setResponse({
            key,
            results,
            revision: res.headers.get("X-Search-Revision") ?? undefined,
          });
        }
      } catch {
        if (!controller.signal.aborted)
          setResponse({ key, results: [], error: true });
      }
    }, 100);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [props.open, term, pageType, key]);

  // Wait for a settled query, not every keystroke. Cancel on edits, closing,
  // errors and aborted requests; none of those represents a content gap.
  useEffect(() => {
    if (!props.open || !term || !current || current.error || !posthog) return;
    const timer = setTimeout(() => track(current), 700);
    return () => clearTimeout(timer);

    function track(result: SearchResponse) {
      if (tracked.current.has(result.key)) return;
      tracked.current.add(result.key);
      const properties = {
        query: term,
        page_type: pageType || "all",
        result_count: result.results.length,
        search_revision: result.revision,
      };
      posthog?.capture("docs_search", properties);
      if (!result.results.length)
        posthog?.capture("docs_search_zero_results", properties);
    }
  }, [props.open, term, pageType, current, posthog]);

  useEffect(() => {
    if (!props.open) {
      tracked.current.clear();
      setResponse(undefined);
    }
  }, [props.open]);

  useEffect(() => {
    if (active)
      document
        .getElementById(`${listId}-${ordered.indexOf(active)}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, listId, ordered]);

  function select(result: DocsSearchResult) {
    // A quick Enter may precede the settled-query timer.
    if (!tracked.current.has(key)) {
      tracked.current.add(key);
      posthog?.capture("docs_search", {
        query: term,
        page_type: pageType || "all",
        result_count: results.length,
        search_revision: current?.revision,
      });
    }
    posthog?.capture("docs_search_result_selected", {
      query: term,
      page_type: pageType || "all",
      result_url: result.url,
      position: ordered.indexOf(result) + 1,
      search_revision: current?.revision,
    });
    props.onOpenChange(false);
    router.push(result.url);
  }

  function navigate(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || !ordered.length) return;
    const index = active ? ordered.indexOf(active) : 0;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveId(
        ordered[(index + direction + ordered.length) % ordered.length].id,
      );
    } else if (event.key === "Enter" && active) {
      event.preventDefault();
      select(active);
    }
  }

  function suggest(value: string) {
    setQuery(value);
    input.current?.focus();
  }

  return (
    <SearchDialog
      {...props}
      search={query}
      onSearchChange={setQuery}
      isLoading={loading}
    >
      <SearchDialogOverlay />
      <SearchDialogContent
        className="max-w-2xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          input.current?.focus();
        }}
      >
        <SearchDialogHeader className="gap-3 px-4 py-4">
          <SearchDialogIcon />
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={navigate}
            maxLength={MAX_QUERY_LENGTH}
            role="combobox"
            aria-label="Search documentation"
            aria-autocomplete="list"
            aria-expanded={props.open}
            aria-controls={listId}
            aria-activedescendant={active ? optionId(active) : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search docs, API names, or SQL…"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-fd-muted-foreground"
          />
          <SearchDialogClose aria-label="Close search" />
        </SearchDialogHeader>
        <fieldset className="flex flex-wrap gap-1.5 px-4 py-3">
          <legend className="sr-only">Filter by page type</legend>
          {(["", ...pageTypes] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={pageType === type}
              onClick={() => {
                setPageType(type);
                input.current?.focus();
              }}
              className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-colors focus-visible:outline-2 focus-visible:outline-fd-primary ${pageType === type ? "border-fd-primary/40 bg-fd-primary/10 text-fd-primary" : "border-transparent text-fd-muted-foreground hover:bg-fd-accent"}`}
            >
              {type || "All types"}
            </button>
          ))}
        </fieldset>
        <div className="max-h-[min(460px,55dvh)] overflow-y-auto overscroll-contain p-2">
          {!term && (
            <div className="px-3 py-8 text-center text-sm text-fd-muted-foreground">
              <p>Find an API name, a SQL operator, or your next step.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  "text_eq",
                  "ord_term",
                  "encryptedSupabase",
                  "supabase auth",
                ].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => suggest(value)}
                    className="rounded-md border px-2 py-1 font-mono text-xs hover:bg-fd-accent"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loading && (
            <output className="px-3 py-8 text-center text-sm text-fd-muted-foreground">
              Searching…
            </output>
          )}
          {current?.error && (
            <div role="alert" className="px-3 py-8 text-center text-sm">
              <p>Search couldn’t load. Please try again.</p>
              <button
                type="button"
                className="mt-3 rounded-md border px-3 py-1"
                onClick={() => {
                  setResponse(undefined);
                  setRetry((v) => v + 1);
                }}
              >
                Retry
              </button>
            </div>
          )}
          {!!term && current && !current.error && !results.length && (
            <div className="px-3 py-8 text-center text-sm text-fd-muted-foreground">
              <p>No results for “{term}”.</p>
              <p className="mt-2">
                Try a shorter identifier
                {pageType ? " or choose All types" : " or a different term"}.
              </p>
            </div>
          )}
          <div
            id={listId}
            role="listbox"
            aria-label="Search results"
            aria-busy={loading}
          >
            {groups.map(({ label, items }, groupIndex) => (
              <fieldset
                key={label}
                aria-labelledby={`${listId}-group-${groupIndex}`}
              >
                <p
                  id={`${listId}-group-${groupIndex}`}
                  className="px-3 pb-1 pt-3 text-xs font-semibold text-fd-muted-foreground"
                >
                  {label}
                </p>
                {items.map((result) => (
                  <button
                    key={result.id}
                    id={optionId(result)}
                    type="button"
                    role="option"
                    aria-selected={active?.id === result.id}
                    tabIndex={-1}
                    onPointerMove={() => setActiveId(result.id)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(result)}
                    className={`flex w-full gap-3 rounded-lg px-3 py-3 text-left ${active?.id === result.id ? "bg-fd-accent text-fd-accent-foreground" : ""}`}
                  >
                    <span className="mt-1 text-fd-muted-foreground">
                      {result.heading ? (
                        <Hash size={16} />
                      ) : (
                        <FileText size={16} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex gap-2 text-xs text-fd-muted-foreground">
                        <span>{result.section}</span>
                        <span aria-hidden="true">/</span>
                        <span className="capitalize">
                          {result.pageType || "Docs"}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm font-medium">
                        <Highlight text={result.title} query={term} />
                        {result.heading && (
                          <>
                            {" "}
                            <span className="text-fd-muted-foreground">›</span>{" "}
                            <Highlight text={result.heading} query={term} />
                          </>
                        )}
                      </span>
                      {result.excerpt && (
                        <span className="mt-1 line-clamp-2 block break-words text-xs leading-relaxed text-fd-muted-foreground">
                          <Highlight text={result.excerpt} query={term} />
                        </span>
                      )}
                    </span>
                    {active?.id === result.id && (
                      <CornerDownLeft
                        size={14}
                        className="mt-1 shrink-0 text-fd-muted-foreground"
                      />
                    )}
                  </button>
                ))}
              </fieldset>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 bg-fd-secondary/50 px-4 py-3 text-xs text-fd-muted-foreground">
          <output aria-live="polite">
            {current && !current.error && term
              ? `${results.length} page${results.length === 1 ? "" : "s"} found`
              : "Search documentation"}
          </output>
          <span className="flex items-center gap-1" aria-hidden="true">
            <ArrowUp size={12} />
            <ArrowDown size={12} /> Navigate{" "}
            <CornerDownLeft size={12} className="ml-2" /> Open
          </span>
        </div>
      </SearchDialogContent>
    </SearchDialog>
  );
}
