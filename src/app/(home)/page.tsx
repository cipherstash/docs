import {
  ArrowRight,
  BookOpen,
  Code,
  Database,
  ExternalLinkIcon,
  FileText,
  KeyRound,
  Lock,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  DrizzleLogo,
  DynamoDBLogo,
  SupabaseLogo,
} from "@/components/integration-logos";

const monoClass = "font-[family-name:var(--font-fira-code)] tracking-[-0.02em]";
const eyebrowClass =
  "font-[family-name:var(--font-fira-code)] text-[10px] font-medium tracking-[0.16em] uppercase text-fd-primary";

const products = [
  {
    title: "Encryption",
    description:
      "Searchable field-level encryption. Range queries, exact match, and free-text search over ciphertext. Sub-millisecond overhead.",
    href: "/stack/cipherstash/encryption",
    icon: Lock,
  },
  {
    title: "ZeroKMS",
    description:
      "The key management layer. Unique key per value, derived on demand, never stored. 100x faster than AWS KMS.",
    href: "/stack/cipherstash/kms",
    icon: KeyRound,
  },
  {
    title: "Proxy",
    description:
      "Transparent searchable encryption for existing PostgreSQL databases. Zero application code changes.",
    href: "/stack/cipherstash/proxy",
    icon: Database,
  },
];

const integrations: {
  title: string;
  description: string;
  href: string;
  logo: ComponentType<{ className?: string }>;
}[] = [
  {
    title: "Supabase",
    description: "Field-level encryption for your Supabase project.",
    href: "/stack/cipherstash/supabase",
    logo: SupabaseLogo,
  },
  {
    title: "Drizzle ORM",
    description: "Encrypted column types and query operators for Drizzle.",
    href: "/stack/cipherstash/encryption/drizzle",
    logo: DrizzleLogo,
  },
  {
    title: "DynamoDB",
    description:
      "Encrypted DynamoDB attributes with searchable equality lookups.",
    href: "/stack/cipherstash/encryption/dynamodb",
    logo: DynamoDBLogo,
  },
];

const resources = [
  {
    title: "What is CipherStash?",
    description: "DLAC, threat model, how it works",
    href: "/stack/reference/what-is-cipherstash",
    icon: ShieldCheck,
  },
  {
    title: "API Reference",
    description: "SDK and API reference docs",
    href: "/stack/reference",
    icon: Code,
  },
  {
    title: "Agent Skills",
    description: "CipherStash knowledge for your AI coding agent",
    href: "/stack/reference/agent-skills",
    icon: Zap,
  },
  {
    title: "Use Cases",
    description: "AI/RAG, compliance, data residency",
    href: "/stack/reference/use-cases",
    icon: BookOpen,
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-fd-border">
        <div className="mx-auto w-full max-w-[1200px] px-6 pt-24 pb-16 md:px-12 md:pt-32 md:pb-20">
          <p className={eyebrowClass}>DLAC / DATA LEVEL ACCESS CONTROL</p>
          <h1
            className={`mt-4 text-3xl font-medium text-fd-foreground md:text-5xl ${monoClass}`}
          >
            CipherStash Docs
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-fd-muted-foreground">
            Searchable field-level encryption. Identity-bound keys.
            Cryptographic audit trails. Built into your existing Postgres stack.
          </p>

          {/* Getting started cards */}
          <div className="mt-10 grid gap-px bg-fd-border sm:grid-cols-2 border border-fd-border rounded-[2px] overflow-hidden">
            {[
              {
                href: "/stack/quickstart",
                icon: Zap,
                title: "Quickstart",
                desc: "Encrypt your first fields in 15 minutes.",
              },
              {
                href: "/stack/cipherstash/supabase",
                icon: Database,
                title: "Supabase",
                desc: "Field-level encryption for Supabase.",
              },
              {
                href: "/stack/cipherstash/encryption/searchable-encryption",
                icon: Search,
                title: "Searchable encryption",
                desc: "Equality, free text, range, ordering, and JSON queries over ciphertext.",
              },
              {
                href: "/stack/reference/agent-skills",
                icon: Zap,
                title: "Agent Skills",
                desc: "CipherStash knowledge for Cursor, Copilot, Claude Code.",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group flex items-center gap-4 bg-fd-background p-5 transition-colors hover:bg-fd-accent/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[2px] bg-fd-primary/10 text-fd-primary">
                  <card.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`font-medium text-fd-foreground text-[15px] ${monoClass}`}
                  >
                    {card.title}
                  </p>
                  <p className="text-sm text-fd-muted-foreground">
                    {card.desc}
                  </p>
                </div>
                <ArrowRight className="ml-auto size-4 shrink-0 text-fd-muted-foreground transition-colors group-hover:text-fd-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-12 md:py-24">
        <p className={eyebrowClass}>§ 01 / THE STACK</p>
        <h2
          className={`mt-3 text-xl font-medium text-fd-foreground md:text-2xl ${monoClass}`}
        >
          The Stack
        </h2>
        <p className="mt-2 text-fd-muted-foreground">
          Encryption, key management, and proxy.
        </p>

        <div className="mt-8 grid gap-px bg-fd-border sm:grid-cols-3 border border-fd-border rounded-[2px] overflow-hidden">
          {products.map((product) => (
            <Link
              key={product.title}
              href={product.href}
              className="group relative flex flex-col overflow-hidden bg-fd-background transition-colors hover:bg-fd-accent/50"
            >
              <div className="flex h-32 items-center justify-center border-b border-fd-border bg-fd-muted/20">
                <product.icon className="size-10 text-fd-muted-foreground/30" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2">
                  <product.icon className="size-4 text-fd-primary" />
                  <h3 className={`font-medium text-fd-foreground ${monoClass}`}>
                    {product.title}
                  </h3>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-fd-muted-foreground">
                  {product.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="border-t border-fd-border">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-12 md:py-24">
          <p className={eyebrowClass}>§ 02 / INTEGRATIONS</p>
          <h2
            className={`mt-3 text-xl font-medium text-fd-foreground md:text-2xl ${monoClass}`}
          >
            Integrations
          </h2>
          <p className="mt-2 text-fd-muted-foreground">
            Drop-in encryption for the databases and ORMs you already use.
          </p>

          <div className="mt-8 grid gap-px bg-fd-border sm:grid-cols-3 border border-fd-border rounded-[2px] overflow-hidden">
            {integrations.map((integration) => (
              <Link
                key={integration.title}
                href={integration.href}
                className="group flex flex-col items-center bg-fd-background p-6 text-center transition-colors hover:bg-fd-accent/50"
              >
                <div className="flex size-24 items-center justify-center">
                  <integration.logo className="h-12 w-auto" />
                </div>
                <h3
                  className={`mt-4 font-medium text-fd-foreground ${monoClass}`}
                >
                  {integration.title}
                </h3>
                <p className="mt-1 text-sm text-fd-muted-foreground">
                  {integration.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="border-t border-fd-border">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-12 md:py-24">
          <p className={eyebrowClass}>§ 03 / RESOURCES</p>
          <h2
            className={`mt-3 text-xl font-medium text-fd-foreground md:text-2xl ${monoClass}`}
          >
            Resources
          </h2>

          <div className="mt-8 grid gap-px bg-fd-border sm:grid-cols-2 lg:grid-cols-4 border border-fd-border rounded-[2px] overflow-hidden">
            {resources.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="group flex items-start gap-3 bg-fd-background p-4 transition-colors hover:bg-fd-accent/50"
              >
                <resource.icon className="mt-0.5 size-5 shrink-0 text-fd-muted-foreground group-hover:text-fd-primary" />
                <div>
                  <p
                    className={`font-medium text-fd-foreground text-[14px] ${monoClass}`}
                  >
                    {resource.title}
                  </p>
                  <p className="mt-0.5 text-sm text-fd-muted-foreground">
                    {resource.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI/LLM + CTA footer */}
      <section className="border-t border-fd-border bg-fd-card/50">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 py-16 text-center md:px-12 md:py-20">
          <div className="flex size-10 items-center justify-center rounded-[2px] bg-fd-primary/10 text-fd-primary">
            <FileText className="size-5" />
          </div>
          <h2
            className={`mt-4 text-xl font-medium text-fd-foreground md:text-2xl ${monoClass}`}
          >
            AI-ready documentation
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-fd-muted-foreground">
            Every page is clean markdown. Feed it to your LLM.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/llms.txt"
              className="inline-flex items-center gap-2 rounded-[2px] border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              <FileText className="size-4" />
              llms.txt
            </Link>
            <Link
              href="/llms-full.txt"
              className="inline-flex items-center gap-2 rounded-[2px] border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              <FileText className="size-4" />
              llms-full.txt
            </Link>
            <a
              href="https://github.com/cipherstash/stack"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[2px] border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              <ExternalLinkIcon className="size-4" />
              GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
