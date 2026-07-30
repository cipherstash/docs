import { Callout } from "fumadocs-ui/components/callout";
import Link from "next/link";
import { EQL_VERSION } from "@/lib/eql-version";

/**
 * Version banner for the EQL v3 reference. Shows the EQL release the docs were
 * generated/validated against — sourced from the release manifest's own version
 * (written to `@/lib/eql-version` by generate-eql-api-docs.ts at build time) —
 * and links to the retained EQL v2 reference for readers on the older
 * generation.
 */
export function EqlVersion() {
  return (
    <Callout title="EQL version" type="info">
      This reference is generated and validated against{" "}
      <strong>EQL {EQL_VERSION}</strong>. Running EQL 2.x? See the{" "}
      <Link href="/reference/eql/v2">EQL v2 reference</Link>.
    </Callout>
  );
}
