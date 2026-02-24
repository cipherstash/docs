import {
  ArrowRight,
  BookOpen,
  Database,
  FileText,
  Fingerprint,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  Search,
  Server,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";

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
      "Transparent, searchable encryption for your existing PostgreSQL database. No application code changes required.",
    href: "/docs/proxy",
    icon: Database,
  },
  {
    title: "Platform",
    description:
      "Workspaces, organizations, access keys, and compliance. Understand how CipherStash components work together.",
    href: "/docs/platform",
    icon: LayoutDashboard,
  },
  {
    title: "Concepts",
    description:
      "How CipherStash encryption works under the hood. Learn about searchable encryption, security architecture, and more.",
    href: "/docs/concepts",
    icon: BookOpen,
  },
];

const features = [
  {
    icon: Search,
    title: "Searchable Encryption",
    description:
      "Query encrypted data with equality, range, free-text, and JSON searches — without decrypting.",
  },
  {
    icon: Fingerprint,
    title: "Identity-Aware",
    description:
      "Bind encryption to user identity with LockContext. Data is only accessible to authorized users.",
  },
  {
    icon: Globe,
    title: "Multi-Database Support",
    description:
      "Works with PostgreSQL, DynamoDB, and Supabase. Integrates with Drizzle ORM out of the box.",
  },
  {
    icon: Zap,
    title: "Zero-Knowledge KMS",
    description:
      "Keys are managed through AWS KMS with a zero-knowledge architecture. CipherStash never sees your keys.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Ready",
    description:
      "Meet data protection requirements for GDPR, HIPAA, PCI-DSS, and Australian Privacy Act.",
  },
  {
    icon: Terminal,
    title: "Developer-First",
    description:
      "TypeScript SDK with full type safety. Define schemas, encrypt fields, and query data with a clean API.",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-fd-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-fd-primary)/0.15,transparent)]" />
        <div className="relative mx-auto max-w-[1200px] px-6 py-24 md:px-12 md:py-32 lg:py-40">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-fd-primary/30 bg-fd-primary/5 px-4 py-1.5 text-xs font-medium text-fd-primary">
            <ShieldCheck className="size-3.5" />
            Application-level encryption for modern apps
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-fd-foreground md:text-5xl lg:text-6xl">
            Encrypt your data.
            <br />
            <span className="text-fd-primary">Keep it searchable.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-fd-muted-foreground md:text-xl">
            CipherStash provides field-level encryption, key management, and
            secret storage — with a TypeScript SDK that keeps your data
            queryable.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/docs/encryption"
              className="inline-flex items-center gap-2 rounded-full bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/docs/concepts"
              className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-secondary px-6 py-3 text-sm font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent"
            >
              How It Works
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

      {/* Code Example */}
      <section className="border-y border-fd-border bg-fd-card/50">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-12 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-fd-foreground md:text-3xl">
                Encrypt in minutes,
                <br />
                not months
              </h2>
              <p className="mt-4 text-fd-muted-foreground">
                Define a schema, encrypt your fields, and query encrypted data —
                all with a clean TypeScript API. No cryptography expertise
                required.
              </p>
              <Link
                href="/docs/encryption/getting-started"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-fd-primary hover:underline"
              >
                Follow the quickstart
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-background">
              <div className="flex items-center gap-2 border-b border-fd-border px-4 py-3">
                <div className="size-3 rounded-full bg-fd-muted" />
                <div className="size-3 rounded-full bg-fd-muted" />
                <div className="size-3 rounded-full bg-fd-muted" />
                <span className="ml-2 text-xs text-fd-muted-foreground">
                  schema.ts
                </span>
              </div>
              <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
                <code>
                  <span className="text-fd-muted-foreground">
                    {"// Define your encrypted schema\n"}
                  </span>
                  <span className="text-fd-primary">{"const"}</span>
                  {" schema = "}
                  <span className="text-fd-primary">{"defineSchema"}</span>
                  {"({\n"}
                  {"  tables: {\n"}
                  {"    users: {\n"}
                  {"      email: "}
                  <span className="text-fd-primary">{"encryptedText"}</span>
                  {"({\n"}
                  {"        searchable: "}
                  <span className="text-fd-primary">{"true"}</span>
                  {",\n"}
                  {"      }),\n"}
                  {"      ssn: "}
                  <span className="text-fd-primary">{"encryptedText"}</span>
                  {"(),\n"}
                  {"    },\n"}
                  {"  },\n"}
                  {"});\n\n"}
                  <span className="text-fd-muted-foreground">
                    {"// Encrypt and store\n"}
                  </span>
                  <span className="text-fd-primary">{"await"}</span>
                  {" encrypt({\n"}
                  {'  table: "users",\n'}
                  {'  email: "user@example.com",\n'}
                  {'  ssn: "123-45-6789",\n'}
                  {"});\n\n"}
                  <span className="text-fd-muted-foreground">
                    {"// Query encrypted data\n"}
                  </span>
                  <span className="text-fd-primary">{"await"}</span>
                  {" query({\n"}
                  {'  table: "users",\n'}
                  {"  where: { email: { "}
                  <span className="text-fd-primary">{"match"}</span>
                  {': "user@" } },\n'}
                  {"});"}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-12 md:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-fd-foreground md:text-3xl">
            Built for real-world encryption
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">
            Not just encryption at rest. CipherStash lets you work with
            encrypted data as if it were plaintext.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
                <feature.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-fd-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-fd-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
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
                className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-background px-5 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
              >
                <FileText className="size-4" />
                llms.txt
              </Link>
              <Link
                href="/llms-full.txt"
                className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-background px-5 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
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
            Ready to encrypt your data?
          </h2>
          <p className="mt-3 max-w-md text-fd-muted-foreground">
            Get started with the Encryption SDK in under 5 minutes. Install the
            package and encrypt your first field.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/docs/encryption/getting-started"
              className="inline-flex items-center gap-2 rounded-full bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
            >
              Start building
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="https://github.com/cipherstash/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-secondary px-6 py-3 text-sm font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
