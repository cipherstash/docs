#!/usr/bin/env tsx
/**
 * Mermaid diagram gate.
 *
 * A malformed diagram does not fail the build: Mermaid parses in the browser,
 * and `src/components/mermaid.tsx` catches the error so a bad chart can't blank
 * the page. The failure mode is therefore silent, and a diagram that renders as
 * nothing looks identical to a diagram nobody noticed was missing.
 *
 * So parse every ```mermaid fence at build time instead. Mermaid needs a DOM to
 * initialize, which jsdom provides.
 *
 * Run via `bun run validate-mermaid`; wired into prebuild.
 */
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const CONTENT_DIRS = ["content/docs", "content/stack"];

function collectFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(full));
    else if (/\.mdx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

type Block = { file: string; line: number; chart: string };

function collectBlocks(file: string): Block[] {
  const source = fs.readFileSync(file, "utf8");
  const blocks: Block[] = [];
  const pattern = /^```mermaid[^\n]*\n([\s\S]*?)^```/gm;

  for (const match of source.matchAll(pattern)) {
    const line = source.slice(0, match.index).split("\n").length;
    blocks.push({ file, line, chart: match[1] });
  }
  return blocks;
}

async function main() {
  const root = process.cwd();
  const blocks = CONTENT_DIRS.flatMap((dir) =>
    collectFiles(path.join(root, dir)).flatMap(collectBlocks),
  );

  if (blocks.length === 0) {
    console.log("✓ no mermaid diagrams to validate");
    return;
  }

  // Mermaid reaches for browser globals at import time and during parse.
  // `navigator` is a getter-only property on Node's globalThis, so assign via
  // defineProperty rather than `=`.
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  for (const name of ["window", "document", "navigator"] as const) {
    Object.defineProperty(globalThis, name, {
      value: name === "window" ? dom.window : dom.window[name],
      configurable: true,
      writable: true,
    });
  }

  const mermaid = (await import("mermaid")).default;
  mermaid.initialize({ startOnLoad: false });

  const failures: { block: Block; message: string }[] = [];

  for (const block of blocks) {
    try {
      await mermaid.parse(block.chart);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ block, message: message.split("\n")[0] });
    }
  }

  if (failures.length > 0) {
    console.error(`✗ ${failures.length} invalid mermaid diagram(s):\n`);
    for (const { block, message } of failures) {
      const relative = path.relative(root, block.file);
      console.error(`  ${relative}:${block.line}`);
      console.error(`    ${message}\n`);
    }
    process.exit(1);
  }

  console.log(`✓ all ${blocks.length} mermaid diagram(s) parse`);
}

main().catch((error) => {
  console.error("✗ mermaid validation failed to run:", error);
  process.exit(1);
});
