#!/usr/bin/env tsx
/**
 * Resolves whether a newer EQL release is available for the pinned minor.
 *
 * The EQL release is PINNED in `generate-eql-docs.ts` on purpose — see the
 * header there. This script does not change that: it only reports (and with
 * `--apply`, stages) the bump, so the upgrade still lands as a reviewable
 * commit whose drift check has already run.
 *
 * Scope is deliberately the pinned MINOR. Patch releases in this project are
 * not additive-only — 3.0.1 removed `eql_v3.contains`, added `eql_v3.matches`,
 * and renamed the whole encrypted-JSON domain surface — so even a patch bump
 * has to go through review. A newer minor or major is reported but never
 * proposed, because those carry migration work beyond a pin change.
 *
 * Usage:
 *   tsx scripts/check-eql-pin.ts            # report only, exit 0
 *   tsx scripts/check-eql-pin.ts --apply    # also rewrite the pin
 */
import fs from "node:fs";
import path from "node:path";

const PIN_FILE = path.join(process.cwd(), "scripts/generate-eql-docs.ts");
// Matches the pin's fallback literal, leaving the env-var override intact.
const PIN_RE =
  /(EQL_RELEASE_TAG\s*=\s*process\.env\.EQL_RELEASE_TAG\s*\?\?\s*")(eql-[^"]+)(")/;
const RELEASES_API =
  "https://api.github.com/repos/cipherstash/encrypt-query-language/releases";
// Stable EQL SQL releases only. Excludes the sibling tags cut by the same
// release (`eql-bindings-v3.0.3`, `@cipherstash/eql@3.0.3`) and prereleases
// like `eql-3.0.0-alpha.4`, which must never be proposed automatically.
const TAG_RE = /^eql-(\d+)\.(\d+)\.(\d+)$/;

interface Version {
  tag: string;
  major: number;
  minor: number;
  patch: number;
}

function parseTag(tag: string): Version | null {
  const m = TAG_RE.exec(tag);
  if (!m) return null;
  return {
    tag,
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
  };
}

function compare(a: Version, b: Version): number {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

function readPin(): Version {
  const source = fs.readFileSync(PIN_FILE, "utf8");
  const m = PIN_RE.exec(source);
  if (!m) {
    throw new Error(
      `Could not find the EQL_RELEASE_TAG pin in ${PIN_FILE}. ` +
        "If the declaration was reformatted, update PIN_RE in this script.",
    );
  }
  const version = parseTag(m[2]);
  if (!version) {
    throw new Error(
      `Pinned tag "${m[2]}" is not a stable eql-X.Y.Z release; refusing to compare.`,
    );
  }
  return version;
}

async function fetchReleases(): Promise<Version[]> {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
  };
  // Authenticated in CI purely for the rate limit; the repo is public.
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;

  const found: Version[] = [];
  // Each EQL release cuts three tags, so paginate rather than assume one page
  // covers enough history.
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${RELEASES_API}?per_page=100&page=${page}`, {
      headers,
    });
    if (!res.ok) {
      throw new Error(
        `GitHub releases API returned ${res.status} ${res.statusText}`,
      );
    }
    const batch = (await res.json()) as {
      tag_name: string;
      draft: boolean;
      prerelease: boolean;
    }[];
    if (!batch.length) break;
    for (const r of batch) {
      if (r.draft || r.prerelease) continue;
      const v = parseTag(r.tag_name);
      if (v) found.push(v);
    }
    if (batch.length < 100) break;
  }
  return found.sort(compare);
}

function emit(name: string, value: string): void {
  const out = process.env.GITHUB_OUTPUT;
  if (out) fs.appendFileSync(out, `${name}=${value}\n`);
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const pinned = readPin();
  const releases = await fetchReleases();

  if (!releases.length) {
    throw new Error(
      "No stable eql-X.Y.Z releases found — refusing to proceed.",
    );
  }

  const sameMinor = releases.filter(
    (r) => r.major === pinned.major && r.minor === pinned.minor,
  );
  const latestPatch = sameMinor[sameMinor.length - 1];
  const latestOverall = releases[releases.length - 1];

  console.log(`Pinned:              ${pinned.tag}`);
  console.log(
    `Latest in ${pinned.major}.${pinned.minor}.x:      ${latestPatch?.tag ?? "(none)"}`,
  );
  console.log(`Latest overall:      ${latestOverall.tag}`);

  // A newer minor/major is surfaced but never proposed: it means migration
  // work, not a pin bump, and deciding when to take it is a human call.
  const newerLine =
    compare(latestOverall, latestPatch ?? pinned) > 0
      ? `${latestOverall.tag} is available but is a minor/major bump — not proposed automatically.`
      : "";
  if (newerLine) console.log(`\nNote: ${newerLine}`);
  emit("newer_minor", newerLine);

  if (!latestPatch || compare(latestPatch, pinned) <= 0) {
    console.log("\n✓ Pin is current for this minor. Nothing to do.");
    emit("bump", "false");
    return;
  }

  console.log(`\n→ Patch bump available: ${pinned.tag} → ${latestPatch.tag}`);
  emit("bump", "true");
  emit("from", pinned.tag);
  emit("to", latestPatch.tag);

  if (apply) {
    const source = fs.readFileSync(PIN_FILE, "utf8");
    fs.writeFileSync(
      PIN_FILE,
      source.replace(PIN_RE, `$1${latestPatch.tag}$3`),
    );
    console.log(`  Applied to ${path.relative(process.cwd(), PIN_FILE)}`);
  }
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
