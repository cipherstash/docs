import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { isValidElement, type ReactNode } from "react";

export type FaqEntry = {
  title: string;
  answer: ReactNode;
};

/** Flatten a ReactNode to plain text for the FAQPage JSON-LD `text` field. */
function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(nodeToText).join("");
  }
  if (isValidElement(node)) {
    return nodeToText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

/**
 * Renders a list of FAQ entries as an accordion and emits FAQPage structured
 * data (JSON-LD) so the questions can surface as rich results in search.
 *
 * Compose `items` from the shared, product-wide entries in `./shared` plus any
 * integration-specific entries authored inline, keeping generic answers DRY.
 */
export function Faq({ items }: { items: FaqEntry[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: nodeToText(item.answer).replace(/\s+/g, " ").trim(),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD FAQPage structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Accordions type="single">
        {items.map((item) => (
          <Accordion key={item.title} title={item.title}>
            {item.answer}
          </Accordion>
        ))}
      </Accordions>
    </>
  );
}
