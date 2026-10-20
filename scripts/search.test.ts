import assert from "node:assert/strict";
import { test } from "node:test";
import { createDocsSearch, type SearchPage } from "../src/lib/search/engine";
import { groupResults } from "../src/lib/search/shared";
import { tokenize } from "../src/lib/search/tokenizer";

function page(
  url: string,
  heading: string,
  contents: string[],
  type: SearchPage["pageType"] = "reference",
): SearchPage {
  return {
    url,
    title: url.split("/").at(-1) ?? url,
    pageType: type,
    structuredData: {
      headings: [{ id: "anchor", content: heading }],
      contents: contents.map((content) => ({ heading: "anchor", content })),
    },
  };
}

test("identifier normalization preserves qualified queries and indexes suffixes", () => {
  const indexed = tokenize(
    "public.eql_v3_text_eq encryptedSupabaseV3 CS_CLIENT_KEY",
    undefined,
    "code",
  );
  for (const query of [
    "text_eq",
    "eql_v3.text",
    "encryptedSupabase",
    "supabase",
    "CS_CLIENT_KEY",
    "client_key",
  ]) {
    const [token] = tokenize(query);
    assert(
      indexed.some((term) => term.startsWith(token)),
      query,
    );
  }
  assert.deepEqual(tokenize("LIKE"), ["like"]);
  assert.deepEqual(tokenize("text_eq"), ["text_eq"]);
  assert.deepEqual(tokenize("eql_v3.text_eq"), ["eql_v3_text_eq"]);
});

test("headings rank over fences, then prose; distinct pages retain matching anchors", async () => {
  const search = await createDocsSearch([
    page("/reference/prose", "Overview", ["magic_symbol"]),
    page("/reference/code", "Overview", ["```ts\nmagic_symbol()\n```"]),
    page("/reference/heading", "magic_symbol", ["Usage"]),
  ]);
  const results = await search.query("magic_symbol");
  assert.deepEqual(
    results.map((r) => r.url),
    [
      "/reference/heading#anchor",
      "/reference/code#anchor",
      "/reference/prose#anchor",
    ],
  );
});

test("partial identifiers, camelCase, typo fallback, facets and zero results", async () => {
  const search = await createDocsSearch([
    page("/reference/eql/text", "Types", [
      "```sql\npublic.eql_v3_text_eq\neql_v3.ord_term_ore(col)\n```",
    ]),
    page(
      "/integrations/supabase/auth",
      "Supabase Auth",
      ["```ts\nencryptedSupabase()\n```"],
      "guide",
    ),
    page("/stack/legacy", "RetiredOnly", ["old docs"]),
  ]);
  for (const query of ["text_eq", "eql_v3.text", "ord_term", "ord_term_ore"]) {
    assert.equal(
      (await search.query(query))[0]?.url,
      "/reference/eql/text#anchor",
    );
  }
  for (const query of [
    "encryptedSupabase",
    "encryptedsupabase",
    "encryptedSupabse",
    "supabase auth",
  ]) {
    assert.equal(
      (await search.query(query))[0]?.url,
      "/integrations/supabase/auth#anchor",
    );
  }
  assert.equal(
    (await search.query("encryptedSupabase", "reference")).length,
    0,
  );
  assert.equal((await search.query("encryptedSupabase", "guide")).length, 1);
  for (const query of [
    "",
    "   ",
    "!!!",
    "zzzzunfindable",
    "RetiredOnly",
    "supabase zzzzunfindable",
  ]) {
    assert.deepEqual(await search.query(query), [], query);
  }
});

test("all query terms must match across fields and a deploy changes the revision", async () => {
  const old = page("/integrations/supabase", "Authentication", ["original"]);
  const search = await createDocsSearch([old]);
  assert.equal((await search.query("supabase auth")).length, 1);
  assert.equal((await search.query("supabase zzzmissing")).length, 0);
  const updated = await createDocsSearch([
    page(old.url, "Authentication", ["newdeploysymbol"]),
  ]);
  assert.notEqual(search.revision, updated.revision);
  assert.equal((await search.query("newdeploysymbol")).length, 0);
  assert.equal((await updated.query("newdeploysymbol")).length, 1);
});

test("grouping keeps the top three in relevance order", async () => {
  const search = await createDocsSearch(
    Array.from({ length: 6 }, (_, i) =>
      page(`/reference/${i}`, "sharedsymbol", []),
    ),
  );
  const results = await search.query("sharedsymbol");
  const groups = groupResults(results);
  assert.deepEqual(groups[0].items, results.slice(0, 3));
  assert.equal(groups.flatMap((group) => group.items).length, results.length);
});

test("code excerpts preserve SQL operators and escape sequences", async () => {
  const search = await createDocsSearch([
    page("/reference/example", "Example", [
      "```sql\nSELECT * FROM users WHERE id = $1;\n```",
    ]),
  ]);
  assert.match(
    (await search.query("SELECT"))[0].excerpt,
    /SELECT \* FROM users/,
  );
});
