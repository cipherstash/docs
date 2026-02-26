import {
  ArrowRight,
  BookOpen,
  Database,
  ExternalLinkIcon,
  FileText,
  KeyRound,
  LayoutDashboard,
  Lock,
  Server,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";

const products = [
  {
    title: "Encryption",
    description:
      "Field-level encryption with searchable queries. Encrypt data at the application level while preserving the ability to search, sort, and filter.",
    href: "/docs/encryption",
    icon: Lock,
    badge: "Core",
  },
  {
    title: "Secrets",
    description:
      "End-to-end encrypted secret storage and management. Store API keys, credentials, and sensitive configuration securely.",
    href: "/docs/secrets",
    icon: Server,
  },
  {
    title: "ZeroKMS",
    description:
      "Key management backed by AWS KMS. Manage encryption keysets with zero-knowledge architecture.",
    href: "/docs/kms",
    icon: KeyRound,
  },
  {
    title: "Proxy",
    description:
      "Transparent, searchable encryption for your existing PostgreSQL database.",
    href: "/docs/proxy",
    icon: Database,
  },
  {
    title: "Platform",
    description: "Learn more about concepts and how the platform works.",
    href: "/docs/platform",
    icon: LayoutDashboard,
  },
  {
    title: "Reference",
    description:
      "Reference documentation for the CipherStash Stack. Learn about the Encryption SDK, Secrets API, and more.",
    href: "/docs/reference",
    icon: BookOpen,
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden border-b border-fd-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-fd-primary)/0.15,transparent)]" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-6 py-12 text-center md:px-12">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-fd-foreground md:text-5xl lg:text-6xl">
            The data security stack
            <br />
            <span className="text-fd-primary">designed for devs</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-fd-muted-foreground md:text-xl">
            CipherStash provides field-level encryption, key management, and
            secret storage with a TypeScript SDK that keeps your data queryable.
          </p>
          <div className="mt-8 w-full max-w-xs">
            <DynamicCodeBlock
              lang="bash"
              code="npm install @cipherstash/stack"
            />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/docs/encryption"
              className="inline-flex items-center justify-center gap-2 rounded py-2 px-4 text-sm font-medium text-white focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary bg-linear-to-br from-(--color-fd-primary-gradient-from) to-fd-primary hover:saturate-200 hover:from-(--color-fd-primary-gradient-from)/90 hover:to-fd-primary/90 transition-colors"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/docs/platform"
              className="inline-flex items-center justify-center gap-2 rounded py-2 px-4 text-sm font-medium focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-fd-primary/30 border border-fd-primary/70 text-fd-foreground hover:border-fd-primary transition-colors"
            >
              Learn about the platform
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-12 md:py-28">
        <div className="mb-12 max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-fd-foreground md:text-3xl">
            Documentation
          </h2>
          <p className="mt-3 text-fd-muted-foreground">
            Everything you need to integrate encryption, manage secrets, and
            secure your data infrastructure.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.title}
              href={product.href}
              className="group relative flex flex-col rounded-xl border border-fd-border bg-fd-card p-6 transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border border-fd-border bg-fd-background text-fd-primary">
                  <product.icon className="size-5" />
                </div>
                <h3 className="font-semibold text-fd-foreground">
                  {product.title}
                </h3>
                {product.badge && (
                  <span className="rounded-full bg-fd-primary/10 px-2 py-0.5 text-[10px] font-medium text-fd-primary">
                    {product.badge}
                  </span>
                )}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-fd-muted-foreground">
                {product.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-fd-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explore docs
                <ArrowRight className="size-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI/LLM */}
      <section className="border-t border-fd-border bg-fd-card/50">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-12 md:py-28">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-fd-primary/10 text-fd-primary">
              <FileText className="size-6" />
            </div>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-fd-foreground md:text-3xl">
              AI-ready documentation
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">
              Every page is available as clean markdown. Use our docs with
              ChatGPT, Claude, Cursor, or any LLM — or fetch{" "}
              <code className="rounded bg-fd-muted px-1.5 py-0.5 text-xs font-mono">
                llms.txt
              </code>{" "}
              for the full index.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/llms.txt"
                className="inline-flex items-center justify-center gap-2 rounded py-2 px-4 text-sm font-medium focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-fd-primary/30 border border-fd-primary/70 text-fd-foreground hover:border-fd-primary transition-colors"
              >
                <FileText className="size-4" />
                llms.txt
              </Link>
              <Link
                href="/llms-full.txt"
                className="inline-flex items-center justify-center gap-2 rounded py-2 px-4 text-sm font-medium focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-fd-primary/30 border border-fd-primary/70 text-fd-foreground hover:border-fd-primary transition-colors"
              >
                <FileText className="size-4" />
                llms-full.txt
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-fd-border">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 py-20 text-center md:px-12 md:py-28">
          <h2 className="text-2xl font-bold tracking-tight text-fd-foreground md:text-3xl">
            Start leveraging the Stack
          </h2>
          <p className="mt-3 max-w-md text-fd-muted-foreground">
            Get started with the CipherStash Stack in under 5 minutes. Install
            the package and start encrypting your data.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="https://dashboard.cipherstash.com/sign-up"
              className="inline-flex items-center justify-center gap-2 rounded py-2 px-4 text-sm font-medium text-white focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary bg-linear-to-br from-(--color-fd-primary-gradient-from) to-fd-primary hover:saturate-200 hover:from-(--color-fd-primary-gradient-from)/90 hover:to-fd-primary/90 transition-colors"
            >
              Create an account
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="https://github.com/cipherstash/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded py-2 px-4 text-sm font-medium focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-fd-primary/30 border border-fd-primary/70 text-fd-foreground hover:border-fd-primary transition-colors"
            >
              Docs on GitHub
              <ExternalLinkIcon className="size-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
