#!/usr/bin/env tsx
/**
 * Downloads the pinned EQL release manifest used by the current API reference.
 *
 * Extracts eql-manifest.json from the release docs tarball.
 * generate-eql-api-docs.ts renders the current pages from this manifest.
 *
 * The release is PINNED. `generate-eql-api-docs.ts` then runs a STRICT drift
 * check of the hand-written reference against this release's manifest, so an
 * unpinned "latest release" meant any upstream EQL publish could turn the docs
 * build red with no commit in this repo — which is exactly what
 * eql-3.0.0-alpha.4 did when it replaced `eql_v3.ore_cllw`.
 *
 * To upgrade: bump EQL_RELEASE_TAG, run `bun run build`, and fix whatever the
 * drift check reports. That makes an EQL upgrade a deliberate, reviewable
 * commit rather than an ambush on whoever has a PR open.
 *
 * `EQL_RELEASE_TAG=eql-3.0.0 bun run generate-docs:eql` overrides it for a
 * one-off check against a different release.
 */
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * The EQL release the docs are written against.
 *
 * 3.0.x is still moving: 3.0.1 renamed the encrypted-JSON domains and replaced
 * the text fuzzy-match operator, 3.0.3 guarded the empty-bloom needle, and
 * 3.0.4 fixed the manifest extraction that had been dropping
 * `eql_v3.grouped_value` and `public.eql_v3_json` from the catalog entirely
 * (cipherstash/encrypt-query-language#427). Each bump is a deliberate commit
 * that fixes whatever the drift check reports.
 */
const EQL_RELEASE_TAG = process.env.EQL_RELEASE_TAG ?? "eql-3.0.4";

const GITHUB_RELEASE_DOWNLOAD =
  "https://github.com/cipherstash/encrypt-query-language/releases/download";
const TEMP_DIR = ".tmp-eql";
// Where the machine-readable manifest is surfaced for the v2 API-reference
// generator (scripts/generate-eql-api-docs.ts). Gitignored; best-effort.
const RELEASE_MANIFEST = path.join(process.cwd(), ".eql-manifest.release.json");

/**
 * Check if a tarball URL exists (returns HTTP 200)
 */
function checkTarballExists(url: string): boolean {
  try {
    const result = execSync(
      `curl -sIL "${url}" | grep -E "^HTTP" | tail -n 1`,
      { encoding: "utf8" },
    );
    return result.includes("200");
  } catch {
    return false;
  }
}

/**
 * Resolve the docs tarball for the pinned release.
 */
async function getPinnedRelease(): Promise<{
  tag: string;
  tarballUrl: string;
}> {
  const tag = EQL_RELEASE_TAG;
  const tarballUrl = `${GITHUB_RELEASE_DOWNLOAD}/${tag}/eql-docs-${tag}.tar.gz`;

  console.log(`Using pinned EQL release: ${tag}`);
  if (!checkTarballExists(tarballUrl)) {
    throw new Error(
      `No docs tarball for pinned EQL release "${tag}".\n` +
        `  Expected: ${tarballUrl}\n` +
        "  Update EQL_RELEASE_TAG in scripts/generate-eql-docs.ts, or set the\n" +
        "  EQL_RELEASE_TAG environment variable to a release that ships one.",
    );
  }

  return { tag, tarballUrl };
}

/**
 * Download and extract the documentation tarball
 */
async function downloadAndExtractDocs(
  tarballUrl: string,
  tag: string,
): Promise<string> {
  const tempPath = path.join(process.cwd(), TEMP_DIR);
  await fs.mkdir(tempPath, { recursive: true });

  const tarballPath = path.join(tempPath, `eql-docs-${tag}.tar.gz`);

  console.log(`Downloading docs from ${tarballUrl}...`);
  execSync(`curl -sL -o "${tarballPath}" "${tarballUrl}"`, {
    stdio: "inherit",
  });

  console.log("Extracting tarball...");
  execSync(`tar -xzf "${tarballPath}" -C "${tempPath}"`, {
    stdio: "inherit",
  });

  return tempPath;
}

async function main() {
  console.log("=".repeat(60));
  console.log("EQL release manifest download");
  console.log("=".repeat(60));

  const { tag, tarballUrl } = await getPinnedRelease();

  const extractPath = await downloadAndExtractDocs(tarballUrl, tag);

  // Surface the machine-readable manifest for the v2 API-reference generator.
  // Only releases packaged with the manifest carry it; older ones don't, so
  // this is best-effort and the generator falls back to the committed sample.
  const manifestSrc = path.join(extractPath, "json", "eql-manifest.json");
  try {
    // The pinned tag is the authoritative version, so always stamp it rather
    // than trusting the manifest's own field. EQL's release workflow derives
    // that field from a tag input that can arrive empty, in which case
    // `json.sh` silently falls back to `"DEV"` — which eql-3.0.4 shipped, and
    // which would otherwise surface as "EQL DEV" in the banner on every
    // reference page. Report a disagreement rather than papering over it: a
    // manifest stamped with a DIFFERENT release is a packaging mix-up worth
    // seeing, not a cosmetic default.
    const manifest = JSON.parse(await fs.readFile(manifestSrc, "utf8"));
    const expected = tag.replace(/^eql-/, "");
    if (manifest.version && manifest.version !== "DEV") {
      if (manifest.version !== expected) {
        console.warn(
          `⚠ ${tag} ships a manifest stamped "${manifest.version}", not "${expected}". Using the pinned tag; check the release.`,
        );
      }
    }
    manifest.version = expected;
    await fs.writeFile(RELEASE_MANIFEST, JSON.stringify(manifest, null, 2));
    console.log(
      `✓ Extracted eql-manifest.json → ${path.basename(RELEASE_MANIFEST)} (version: ${manifest.version})`,
    );
  } catch {
    await fs.rm(RELEASE_MANIFEST, { force: true }); // clear any stale cache
    console.log(
      "• No eql-manifest.json in this release; API reference uses the sample.",
    );
  }

  // Clean up
  console.log("Cleaning up...");
  await fs.rm(extractPath, { recursive: true, force: true });

  console.log(`\n${"=".repeat(60)}`);
  console.log("EQL release manifest download complete.");
  console.log(`  Version: ${tag}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
