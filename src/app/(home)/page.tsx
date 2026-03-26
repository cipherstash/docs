import {
  ArrowRight,
  BookOpen,
  Code,
  Database,
  ExternalLinkIcon,
  FileText,
  KeyRound,
  LayoutDashboard,
  Lock,
  Search,
  Server,
  ShieldCheck,
  Terminal,
  WrenchIcon,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  DrizzleLogo,
  DynamoDBLogo,
  SupabaseLogo,
} from "@/components/integration-logos";

const products = [
  {
    title: "Encryption",
    description:
      "Field-level encryption with searchable queries. Encrypt data at the application level while preserving the ability to search, sort, and filter.",
    href: "/stack/encryption",
    icon: Lock,
    image: "/images/encryption.svg",
  },
  {
    title: "Secrets",
    description:
      "End-to-end encrypted secret storage and management. Store API keys, credentials, and sensitive configuration securely.",
    href: "/stack/secrets",
    icon: Server,
    image: "/images/secrets.svg",
  },
  {
    title: "ZeroKMS",
    description:
      "Key management backed by AWS KMS. Manage encryption keysets with zero-knowledge architecture.",
    href: "/stack/kms",
    icon: KeyRound,
    image: "/images/zerokms.svg",
  },
  {
    title: "Proxy",
    description:
      "Transparent, searchable encryption for your existing PostgreSQL database. No application code changes required.",
    href: "/stack/proxy",
    icon: Database,
    image: "/images/proxy.svg",
  },
];

const integrations: {
  title: string;
  description: string;
  href: string;
  logo: ComponentType<{ className?: string }>;
}[] = [
  {
    title: "Drizzle ORM",
    description: "Encrypted column types and query operators for Drizzle.",
    href: "/stack/encryption/drizzle",
    logo: DrizzleLogo,
  },
  {
    title: "Supabase",
    description:
      "Transparent encryption for your Supabase project using the Supabase JS SDK.",
    href: "/stack/encryption/supabase",
    logo: SupabaseLogo,
  },
  {
    title: "DynamoDB",
    description:
      "Encrypted DynamoDB attributes with searchable equality lookups.",
    href: "/stack/encryption/dynamodb",
    logo: DynamoDBLogo,
  },
];

const resources = [
  {
    title: "Platform",
    description: "Organizations, compliance, and billing",
    href: "/stack/platform",
    icon: LayoutDashboard,
  },
  {
    title: "API Reference",
    description: "Full SDK and API reference docs",
    href: "/stack/reference",
    icon: Code,
  },
  {
    title: "Secrets CLI",
    description: "Manage secrets from the terminal with the stash CLI",
    href: "/stack/secrets/cli",
    icon: Terminal,
  },
  {
    title: "Use Cases",
    description: "Common patterns and real-world examples",
    href: "/stack/platform/use-cases",
    icon: BookOpen,
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-fd-border">
        <div className="mx-auto w-full max-w-[1200px] px-6 pt-24 pb-16 md:px-12 md:pt-32 md:pb-20">
          <h1 className="text-3xl font-bold tracking-tight text-fd-foreground md:text-5xl">
            CipherStash Docs
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-fd-muted-foreground">
            Field-level encryption, query over encrypted data, type-safe APIs,
            and zero-knowledge by design. CipherStash isn't just a generic
            security tool, it's your data's guard dog.
          </p>

          {/* Getting started cards */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <Link
              href="/stack/guides/getting-started"
              className="group flex items-center gap-4 rounded-lg border border-fd-border bg-fd-card p-4 transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
                <Zap className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-fd-foreground">
                  Getting Started
                </p>
                <p className="text-sm text-fd-muted-foreground">
                  Install the SDK and encrypt your first value in under 5
                  minutes.
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0 text-fd-muted-foreground transition-colors group-hover:text-fd-primary" />
            </Link>
            <Link
              href="/stack/platform"
              className="group flex items-center gap-4 rounded-lg border border-fd-border bg-fd-card p-4 transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-fd-foreground">
                  Platform Overview
                </p>
                <p className="text-sm text-fd-muted-foreground">
                  Understand zero-knowledge architecture and how the platform
                  works.
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0 text-fd-muted-foreground transition-colors group-hover:text-fd-primary" />
            </Link>
            <Link
              href="/stack/platform/searchable-encryption"
              className="group flex items-center gap-4 rounded-lg border border-fd-border bg-fd-card p-4 transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
                <Search className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-fd-foreground">
                  Searchable encryption
                </p>
                <p className="text-sm text-fd-muted-foreground">
                  Equality, free text, range, ordering, and JSON queries. Your
                  usual PostgreSQL ops, but the data's encrypted.
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0 text-fd-muted-foreground transition-colors group-hover:text-fd-primary" />
            </Link>
            <Link
              href="/stack/encryption/forge"
              className="group flex items-center gap-4 rounded-lg border border-fd-border bg-fd-card p-4 transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
                <WrenchIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-fd-foreground">Forge</p>
                <p className="text-sm text-fd-muted-foreground">
                  The sidekick that sets up the database bits so searchable
                  encryption just works.
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0 text-fd-muted-foreground transition-colors group-hover:text-fd-primary" />
            </Link>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-12 md:py-24">
        <h2 className="text-xl font-semibold tracking-tight text-fd-foreground md:text-2xl">
          The Stack
        </h2>
        <p className="mt-2 text-fd-muted-foreground">
          Everything you need to encrypt, stash secrets, and keep keys in check,
          no duct tape required.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {products.map((product) => (
            <Link
              key={product.title}
              href={product.href}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              {/* Image placeholder */}
              <div className="flex h-36 items-center justify-center border-b border-fd-border bg-fd-muted/30">
                <product.icon className="size-12 text-fd-muted-foreground/40" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2">
                  <product.icon className="size-4 text-fd-primary" />
                  <h3 className="font-semibold text-fd-foreground">
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
          <h2 className="text-xl font-semibold tracking-tight text-fd-foreground md:text-2xl">
            Integrations
          </h2>
          <p className="mt-2 text-fd-muted-foreground">
            Drop-in encryption for the databases and ORMs you already use.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {integrations.map((integration) => (
              <Link
                key={integration.title}
                href={integration.href}
                className="group flex flex-col items-center rounded-xl border border-fd-border bg-fd-card p-6 text-center transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
              >
                <div className="flex size-24 items-center justify-center">
                  <integration.logo className="h-12 w-auto" />
                </div>
                <h3 className="mt-4 font-semibold text-fd-foreground">
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

      {/* Additional Resources */}
      <section className="border-t border-fd-border">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-12 md:py-24">
          <h2 className="text-xl font-semibold tracking-tight text-fd-foreground md:text-2xl">
            Additional Resources
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="group flex items-start gap-3 rounded-lg border border-fd-border bg-fd-card p-4 transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
              >
                <resource.icon className="mt-0.5 size-5 shrink-0 text-fd-muted-foreground group-hover:text-fd-primary" />
                <div>
                  <p className="font-medium text-fd-foreground">
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
          <div className="flex size-10 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
            <FileText className="size-5" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-fd-foreground md:text-2xl">
            AI-ready documentation
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-fd-muted-foreground">
            Every page is clean markdown. Feed it to ChatGPT, Claude, Cursor, or
            your favorite LLM, they'll feel right at home.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/llms.txt"
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              <FileText className="size-4" />
              llms.txt
            </Link>
            <Link
              href="/llms-full.txt"
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              <FileText className="size-4" />
              llms-full.txt
            </Link>
            <a
              href="https://github.com/cipherstash/stack"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
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
