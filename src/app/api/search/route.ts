import { createDocsSearch } from "@/lib/search/engine";
import { isPageType, MAX_QUERY_LENGTH } from "@/lib/search/shared";
import { v2source } from "@/lib/source";

// One index per server instance, built from this deployment's MDX exports.
// No persisted/crawler index can carry removed pages across deployments.
let index: ReturnType<typeof createDocsSearch> | undefined;
function getIndex() {
  index ??= createDocsSearch(
    v2source.getPages().map((page) => ({
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      pageType: page.data.type,
      structuredData: page.data.structuredData,
    })),
  ).catch((error) => {
    index = undefined;
    throw error;
  });
  return index;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("query") ?? "";
  const type = params.get("type") ?? "";
  if (query.length > MAX_QUERY_LENGTH || (type && !isPageType(type))) {
    return Response.json(
      { error: "Invalid search query or page type" },
      { status: 400 },
    );
  }
  const search = await getIndex();
  return Response.json(
    await search.query(query, isPageType(type) ? type : undefined),
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Search-Revision": search.revision,
        "X-Search-Pages": String(search.pageCount),
      },
    },
  );
}
