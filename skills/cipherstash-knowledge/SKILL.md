---
name: cipherstash-knowledge
description: Navigate and understand CipherStash documentation. Provides a complete map of all documentation resources for encryption, secrets management, key management, database proxy, and platform features. Use when working with CipherStash products, integrating @cipherstash/stack, or looking for CipherStash API references, guides, or conceptual explanations. Covers the Encryption SDK, Secrets API, ZeroKMS, CipherStash Proxy, Drizzle ORM integration, Supabase integration, DynamoDB integration, EQL (Encrypt Query Language), and platform administration.
metadata:
  author: cipherstash
  version: "2.0"
---

# CipherStash Documentation Knowledge

This skill helps you navigate the CipherStash documentation to find the right resources for any task. All documentation is available at [cipherstash.com/docs](https://cipherstash.com/docs).

CipherStash provides field-level encryption you can query without decryption, with cryptographically verifiable audit trails and key management backed by AWS KMS.

## Documentation Structure

The docs are organized into six main sections plus resource pages. Use this map to find the right starting point.

### Encryption (`/docs/stack/encryption`)

Field-level encryption with searchable queries using `@cipherstash/stack`.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/stack/encryption` | Understanding what CipherStash Encryption offers |
| Getting started | `/docs/stack/encryption/getting-started` | First-time setup, installing the SDK, encrypting a first value |
| Configuration | `/docs/stack/encryption/configuration` | Setting environment variables, TOML config, or programmatic config |
| Schema definition | `/docs/stack/encryption/schema` | Defining which columns to encrypt, query types, nested objects |
| Encrypt and decrypt | `/docs/stack/encryption/encrypt-decrypt` | Encrypting/decrypting single values, models, or bulk operations |
| Searchable encryption | `/docs/stack/encryption/searchable-encryption` | Running equality, free-text, range, or JSON queries on encrypted data |
| Identity-aware encryption | `/docs/stack/encryption/identity` | Tying encryption to a user's JWT, row-level access control |
| Storing encrypted data | `/docs/stack/encryption/storing-data` | Persisting encrypted data in PostgreSQL or other databases |
| Drizzle ORM | `/docs/stack/encryption/drizzle` | Using CipherStash with Drizzle ORM, encrypted column types and operators |
| Supabase | `/docs/stack/encryption/supabase` | Using `encryptedSupabase` wrapper for transparent encrypt/decrypt |
| DynamoDB | `/docs/stack/encryption/dynamodb` | Using `encryptedDynamoDB` helper, `__source`/`__hmac` attributes |
| Bundling | `/docs/stack/encryption/bundling` | Configuring webpack, esbuild, Next.js builds with `@cipherstash/stack` |
| SST | `/docs/stack/encryption/sst` | Deploying with SST and serverless functions |
| Testing | `/docs/stack/encryption/testing` | Testing applications that use encryption |
| Troubleshooting | `/docs/stack/encryption/troubleshooting` | Diagnosing common issues |
| Error handling | `/docs/stack/encryption/error-handling` | The `Result` pattern used across the SDK |
| Migration guide | `/docs/stack/encryption/migration` | Migrating from `@cipherstash/protect` to `@cipherstash/stack` |

### CipherStash Forge (`/docs/stack/encryption/forge`)

Dev-time CLI (`@cipherstash/stack-forge`) for database setup, EQL installation, and schema management. Installed as a devDependency.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/stack/encryption/forge` | Understanding Forge and its role alongside `@cipherstash/stack` |
| Interactive setup (init) | `/docs/stack/encryption/forge/init` | Using `npx @cipherstash/stack init` to generate schemas and client |
| Setup, install, and upgrade | `/docs/stack/encryption/forge/install` | Using `npx stash-forge setup` (interactive) or `npx stash-forge install` (non-interactive) to install EQL |
| Schema validation | `/docs/stack/encryption/forge/validate` | Checking encryption schemas for misconfigurations |
| Push and status | `/docs/stack/encryption/forge/push` | Pushing schemas to the database (CipherStash Proxy only) |
| Programmatic API | `/docs/stack/encryption/forge/api` | Using `EQLInstaller`, `loadStashConfig`, `loadBundledEqlSql` as a library |
| Troubleshooting | `/docs/stack/encryption/forge/troubleshooting` | Diagnosing common Forge and EQL errors |

**Two-step setup flow:**

1. `npx @cipherstash/stack init` — Chooses DB connection method, builds encryption schema, generates client file, installs `@cipherstash/stack-forge`
2. `npx stash-forge setup` — Auto-detects client, asks for DB URL, generates `stash.config.ts`, detects Postgres provider (Supabase/Neon/AWS RDS/etc.), installs EQL

### Secrets (`/docs/stack/secrets`)

End-to-end encrypted secret storage and management.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/stack/secrets` | Understanding CipherStash Secrets capabilities |
| Getting started | `/docs/stack/secrets/getting-started` | Storing and retrieving a first encrypted secret |
| Concepts | `/docs/stack/secrets/concepts` | Understanding workspaces, environments, clients, API keys |
| SDK reference | `/docs/stack/secrets/sdk` | Programmatic API: `set`, `get`, `getMany`, `list`, `delete` |
| CLI reference | `/docs/stack/secrets/cli` | Terminal-based secret management with the `stash` CLI |

### KMS — ZeroKMS (`/docs/stack/kms`)

Key management backed by AWS KMS.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/stack/kms` | Understanding ZeroKMS architecture |
| Configuration | `/docs/stack/kms/configuration` | Setting up ZeroKMS credentials and options |
| Access keys | `/docs/stack/kms/access-keys` | Creating and managing programmatic access keys |
| Clients | `/docs/stack/kms/clients` | Managing clients used by SDKs and Proxy |
| Keysets | `/docs/stack/kms/keysets` | Multi-tenant key isolation |
| Regions | `/docs/stack/kms/regions` | Understanding regional ZeroKMS deployment |
| CTS | `/docs/stack/kms/cts` | CipherStash Token Service for authentication and identity federation |
| Disaster recovery | `/docs/stack/kms/disaster-recovery` | Data protection and disaster recovery capabilities |

### Proxy (`/docs/stack/proxy`)

Transparent, searchable encryption for existing PostgreSQL databases.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/stack/proxy` | Understanding CipherStash Proxy capabilities |
| Getting started | `/docs/stack/proxy/getting-started` | Setting up Proxy in local development |
| Configuration | `/docs/stack/proxy/configuration` | Docker setup, environment variables, database schema |
| Multitenant operation | `/docs/stack/proxy/multitenant` | Keyset scoping for cryptographic tenant isolation |
| Searchable JSON | `/docs/stack/proxy/searchable-json` | JSONB functions and operators for encrypted data |
| Encrypt tool | `/docs/stack/proxy/encrypt-tool` | CLI tool to encrypt existing data in your database |
| Audit features | `/docs/stack/proxy/audit` | Statement fingerprinting, SQL redaction, record reconciliation |
| AWS ECS deployment | `/docs/stack/proxy/aws-ecs` | Deploying Proxy to AWS ECS with Fargate |
| Reference | `/docs/stack/proxy/reference` | All config options, CLI flags, Prometheus metrics |
| Errors | `/docs/stack/proxy/errors` | Complete error reference with troubleshooting steps |
| Troubleshooting | `/docs/stack/proxy/troubleshooting` | ZeroKMS debugging, slow statement logging, performance |

### Platform (`/docs/stack/platform`)

Dashboard, workspaces, organization management, and core concepts.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/stack/platform` | Understanding the CipherStash platform |
| What is CipherStash? | `/docs/stack/platform/what-is-cipherstash` | High-level product explanation |
| Security architecture | `/docs/stack/platform/security-architecture` | Cryptographic primitives, key hierarchy, trust model |
| Searchable encryption (concepts) | `/docs/stack/platform/searchable-encryption` | Theory and architecture of querying encrypted data |
| The CipherCell | `/docs/stack/platform/cipher-cell` | The encrypted data format with searchable metadata |
| Supported queries | `/docs/stack/platform/supported-queries` | Index types and query operations on encrypted data |
| EQL | `/docs/stack/platform/eql` | Encrypt Query Language: PostgreSQL types, operators, functions |
| CipherStash vs AWS KMS | `/docs/stack/platform/aws-kms-comparison` | Side-by-side comparison for application-level encryption |
| Members | `/docs/stack/platform/members` | Managing organization members and workspace memberships |
| Compliance | `/docs/stack/platform/compliance` | GDPR, HIPAA, PCI-DSS, data residency, audit capabilities |
| Billing | `/docs/stack/platform/billing` | Plans, usage limits, workspace billing |

### Reference (`/docs/stack/reference`)

Auto-generated API reference documentation.

| Page | URL | Use when |
|------|-----|----------|
| API Reference index | `/docs/stack/reference` | Finding the right API reference page |
| EQL API Reference | `/docs/stack/reference/eql` | Complete EQL PostgreSQL extension reference |
| `@cipherstash/stack` | `/docs/stack/reference/stack/latest` | Full SDK reference |

#### SDK Reference Modules (`/docs/stack/reference/stack/latest/...`)

| Module | Key exports | Use when |
|--------|-------------|----------|
| `client` | Client initialization | Setting up the CipherStash client |
| `encryption` | `EncryptionClient` class | Core encrypt/decrypt operations |
| `schema` | `encryptedTable`, `encryptedColumn`, `encryptedField`, type aliases (`InferEncrypted`, `InferPlaintext`, `CastAs`) | Defining encryption schemas |
| `identity` | `LockContext` class, `IdentifyOptions` | Identity-aware encryption, row-level access |
| `drizzle` | `encryptedType`, `createEncryptionOperators`, `extractEncryptionSchema` | Drizzle ORM integration |
| `supabase` | `encryptedSupabase`, `EncryptedQueryBuilder` | Supabase integration |
| `dynamodb` | `encryptedDynamoDB`, `EncryptedDynamoDBInstance` | DynamoDB integration |
| `secrets` | `Secrets` class, request/response types | Secrets API |
| `types-public` | `Encrypted`, `Decrypted`, `EncryptedValue`, bulk types | Shared type definitions |

### Resource Pages

| Page | URL | Use when |
|------|-----|----------|
| Glossary | `/docs/stack/glossary` | Looking up CipherStash-specific terms |
| Planning guide | `/docs/stack/planning-guide` | Technical planning for adopting CipherStash |
| Supported solutions | `/docs/stack/supported-solutions` | Checking integration options, supported databases, performance |
| Use cases | `/docs/stack/use-cases` | Real-world application scenarios |
| AI and RAG pipelines | `/docs/stack/use-cases/ai-rag` | Encrypting data in AI/RAG pipelines |
| Regulatory compliance | `/docs/stack/use-cases/compliance` | GDPR, HIPAA, PCI-DSS compliance patterns |
| Data residency | `/docs/stack/use-cases/data-residency` | Cross-border data access, regional key deployment |
| Provable access control | `/docs/stack/use-cases/provable-access` | Cryptographic proof-based access with Lock Contexts |

## Onboarding Flows

Use these step-by-step flows when helping a user get started with a CipherStash product. Each flow lists the steps in order with the relevant doc pages.

### Encryption SDK (TypeScript)

The recommended path for teams building TypeScript applications with field-level encryption.

| Step | What to do | Doc page |
|------|-----------|----------|
| 1. **Sign up** | Create a CipherStash account | [cipherstash.com/signup](https://dashboard.cipherstash.com/sign-up) |
| 2. **Init project** | `npx @cipherstash/stack init` — choose DB method, build schema, generate client | `/docs/stack/encryption/forge/init` |
| 3. **Add credentials** | Save `CS_WORKSPACE_CRN`, `CS_CLIENT_ID`, `CS_CLIENT_KEY`, `CS_CLIENT_ACCESS_KEY` to `.env` | `/docs/stack/encryption/configuration` |
| 4. **Set up database** | `npx stash-forge setup` — generates `stash.config.ts`, detects provider, installs EQL | `/docs/stack/encryption/forge/install` |
| 5. **Encrypt data** | Use `client.encrypt()` or `client.encryptModel()` to encrypt values | `/docs/stack/encryption/encrypt-decrypt` |
| 6. **Store in DB** | Insert encrypted payloads into PostgreSQL (or any JSONB-capable DB) | `/docs/stack/encryption/storing-data` |
| 7. **Query encrypted data** | Use `encryptQuery()` for searchable queries on encrypted columns | `/docs/stack/encryption/searchable-encryption` |

**Integration-specific paths after step 4:**

| Integration | Next step | Doc page |
|-------------|-----------|----------|
| Drizzle ORM | Define `encryptedType` columns, use `createEncryptionOperators` | `/docs/stack/encryption/drizzle` |
| Supabase | Wrap client with `encryptedSupabase`, use `.eq()` / `.like()` etc. | `/docs/stack/encryption/supabase` |
| DynamoDB | Use `encryptedDynamoDB` helper for PutItem/GetItem | `/docs/stack/encryption/dynamodb` |
| Raw SQL | Use `pg` client with parameterized queries | `/docs/stack/encryption/storing-data` |

**Production readiness:**

| Step | Doc page |
|------|----------|
| Configure bundler (webpack/esbuild/Next.js) | `/docs/stack/encryption/bundling` |
| Set up multi-tenant keysets | `/docs/stack/kms/keysets` |
| Add identity-aware encryption | `/docs/stack/encryption/identity` |
| Deploy with SST | `/docs/stack/encryption/sst` |

### Secrets

The path for storing and retrieving end-to-end encrypted secrets (API keys, DB URLs, etc.).

| Step | What to do | Doc page |
|------|-----------|----------|
| 1. **Sign up** | Create a CipherStash account | [cipherstash.com/signup](https://dashboard.cipherstash.com/sign-up) |
| 2. **Create workspace** | Set up a workspace in the dashboard | `/docs/stack/secrets/getting-started` |
| 3. **Create environment** | Create production/staging/dev environments (each gets its own keyset) | `/docs/stack/secrets/concepts` |
| 4. **Create client + API key** | Generate client credentials and API key in the dashboard | `/docs/stack/secrets/getting-started` |
| 5. **Add credentials** | Save `CS_WORKSPACE_CRN`, `CS_CLIENT_ID`, `CS_CLIENT_KEY`, `CS_CLIENT_ACCESS_KEY` to `.env` | `/docs/stack/secrets/getting-started` |
| 6. **Install SDK** | `npm install @cipherstash/stack` | `/docs/stack/secrets/getting-started` |
| 7. **Store a secret** | `await secrets.set("DATABASE_URL", "postgres://...")` | `/docs/stack/secrets/sdk` |
| 8. **Retrieve a secret** | `await secrets.get("DATABASE_URL")` | `/docs/stack/secrets/sdk` |

**CLI alternative (no code):**

```
npx stash secrets set --name DATABASE_URL --value "postgres://..." --environment production
npx stash secrets get --name DATABASE_URL --environment production
```

See `/docs/stack/secrets/cli` for all CLI commands.

### CipherStash Proxy

The path for adding transparent encryption to an existing PostgreSQL database with zero code changes.

| Step | What to do | Doc page |
|------|-----------|----------|
| 1. **Sign up** | Create a CipherStash account | [cipherstash.com/signup](https://dashboard.cipherstash.com/sign-up) |
| 2. **Get credentials** | Generate secrets from the dashboard onboarding (Step 2 → "Generate secrets") | `/docs/stack/proxy/getting-started` |
| 3. **Add Proxy container** | Add `cipherstash/proxy:latest` to your `docker-compose.yml` (port 6432) | `/docs/stack/proxy/configuration` |
| 4. **Configure env vars** | Set `CS_WORKSPACE_CRN`, `CS_CLIENT_ID`, `CS_CLIENT_KEY`, `CS_CLIENT_ACCESS_KEY`, and database connection vars | `/docs/stack/proxy/configuration` |
| 5. **Install EQL** | Install the EQL extension in your PostgreSQL database | `/docs/stack/platform/eql` |
| 6. **Define encrypted columns** | Create tables with `eql_v2_encrypted` columns and push encryption config | `/docs/stack/proxy/configuration` |
| 7. **Connect via Proxy** | Point your app at Proxy (port 6432) instead of PostgreSQL directly | `/docs/stack/proxy/getting-started` |
| 8. **Query as normal** | INSERT/SELECT/UPDATE/WHERE — Proxy encrypts and decrypts transparently | `/docs/stack/proxy/getting-started` |

**Production deployment:**

| Step | Doc page |
|------|----------|
| Deploy to AWS ECS with Fargate | `/docs/stack/proxy/aws-ecs` |
| Set up multi-tenant keysets | `/docs/stack/proxy/multitenant` |
| Enable audit features | `/docs/stack/proxy/audit` |
| Use the encrypt tool for existing data | `/docs/stack/proxy/encrypt-tool` |

### ZeroKMS

ZeroKMS is not typically onboarded standalone — it's the underlying key management layer used by Encryption, Secrets, and Proxy. However, there are key configuration tasks:

| Task | What to do | Doc page |
|------|-----------|----------|
| **Understand the architecture** | Learn how unique-key-per-value works with AWS KMS backing | `/docs/stack/kms` |
| **Configure credentials** | Set up `CS_*` env vars for ZeroKMS access | `/docs/stack/kms/configuration` |
| **Create access keys** | Generate programmatic access keys for services | `/docs/stack/kms/access-keys` |
| **Manage clients** | Create and manage clients used by SDKs and Proxy | `/docs/stack/kms/clients` |
| **Set up keysets** | Create keysets for multi-tenant or environment isolation | `/docs/stack/kms/keysets` |
| **Configure regions** | Understand regional deployment options | `/docs/stack/kms/regions` |
| **Set up CTS** | Configure the CipherStash Token Service for identity federation | `/docs/stack/kms/cts` |
| **Plan disaster recovery** | Understand key recovery and outage behavior | `/docs/stack/kms/disaster-recovery` |

### Choosing the right product

| Scenario | Product | Start here |
|----------|---------|------------|
| Building a new TypeScript app with encrypted fields | Encryption SDK | `/docs/stack/encryption/getting-started` |
| Adding encryption to an existing PostgreSQL app with zero code changes | CipherStash Proxy | `/docs/stack/proxy/getting-started` |
| Storing API keys, DB URLs, or other secrets securely | Secrets | `/docs/stack/secrets/getting-started` |
| Using Drizzle ORM with encrypted columns | Encryption SDK + Drizzle | `/docs/stack/encryption/drizzle` |
| Using Supabase with encrypted columns | Encryption SDK + Supabase | `/docs/stack/encryption/supabase` |
| Using DynamoDB with encrypted attributes | Encryption SDK + DynamoDB | `/docs/stack/encryption/dynamodb` |
| Need multi-tenant key isolation | ZeroKMS Keysets | `/docs/stack/kms/keysets` |
| Need identity-based access control on encrypted data | Encryption SDK + Lock Contexts | `/docs/stack/encryption/identity` |

## How to Find the Right Documentation

### By task

| Task | Start here |
|------|------------|
| **First time using CipherStash** | `/docs/stack/encryption/getting-started` |
| **Initialize a new project** | `/docs/stack/encryption/forge/init` (`npx @cipherstash/stack init`) |
| **Set up database and install EQL** | `/docs/stack/encryption/forge/install` (`npx stash-forge setup`) |
| **Add encryption to an existing app** | `/docs/stack/encryption/getting-started` then `/docs/stack/encryption/schema` |
| **Query encrypted data** | `/docs/stack/encryption/searchable-encryption` |
| **Use with Drizzle ORM** | `/docs/stack/encryption/drizzle` |
| **Use with Supabase** | `/docs/stack/encryption/supabase` |
| **Use with DynamoDB** | `/docs/stack/encryption/dynamodb` |
| **Store secrets (API keys, DB URLs)** | `/docs/stack/secrets/getting-started` |
| **Manage secrets from CLI** | `/docs/stack/secrets/cli` |
| **Set up transparent DB encryption** | `/docs/stack/proxy/getting-started` |
| **Deploy Proxy to AWS** | `/docs/stack/proxy/aws-ecs` |
| **Understand the security model** | `/docs/stack/platform/security-architecture` |
| **Compare with AWS KMS** | `/docs/stack/platform/aws-kms-comparison` |
| **Plan a CipherStash adoption** | `/docs/stack/planning-guide` |
| **Check compliance requirements** | `/docs/stack/platform/compliance` or `/docs/stack/use-cases/compliance` |
| **Look up an API method** | `/docs/stack/reference/stack/latest` |
| **Write EQL queries** | `/docs/stack/platform/eql` or `/docs/stack/reference/eql` |
| **Configure for production** | `/docs/stack/encryption/configuration` then `/docs/stack/encryption/bundling` |
| **Troubleshoot an issue** | `/docs/stack/encryption/troubleshooting` |
| **Handle errors** | `/docs/stack/encryption/error-handling` |
| **Set up multi-tenant encryption** | `/docs/stack/kms/keysets` |
| **Implement identity-aware encryption** | `/docs/stack/encryption/identity` |
| **Migrate from @cipherstash/protect** | `/docs/stack/encryption/migration` |

### By product

| Product | Package / CLI | Docs |
|---------|---------------|------|
| Encryption SDK | `@cipherstash/stack` | `/docs/stack/encryption` |
| CipherStash Forge | `@cipherstash/stack-forge` (`stash-forge` CLI) | `/docs/stack/encryption/forge` |
| Stash CLI (init, secrets) | `@cipherstash/stack` (`stash` CLI) | `/docs/stack/encryption/forge/init`, `/docs/stack/secrets/cli` |
| Drizzle integration | `@cipherstash/stack/drizzle` | `/docs/stack/encryption/drizzle` |
| Supabase integration | `@cipherstash/stack/supabase` | `/docs/stack/encryption/supabase` |
| DynamoDB integration | `@cipherstash/stack/dynamodb` | `/docs/stack/encryption/dynamodb` |
| Secrets SDK | `@cipherstash/stack/secrets` | `/docs/stack/secrets` |
| ZeroKMS | Key management service | `/docs/stack/kms` |
| CipherStash Proxy | PostgreSQL proxy | `/docs/stack/proxy` |
| EQL | PostgreSQL extension | `/docs/stack/platform/eql`, `/docs/stack/reference/eql` |

## Fetching Documentation Content

All documentation pages are available as processed markdown for LLM consumption:

- **Individual page**: `https://cipherstash.com/docs/stack/{path}.mdx` (e.g., `https://cipherstash.com/docs/stack/encryption/getting-started.mdx`)
- **Full index**: `https://cipherstash.com/docs/llms.txt` — title and description for every page
- **Full content**: `https://cipherstash.com/docs/llms-full.txt` — all pages concatenated as markdown

Use the `.mdx` URL pattern when you need the full content of a specific documentation page.

## Key Concepts

- **CipherCell**: The encrypted data format — a JSONB column containing ciphertext plus encrypted search indexes.
- **EQL (Encrypt Query Language)**: PostgreSQL types and functions for querying CipherCells without decryption.
- **ZeroKMS**: CipherStash's key management service, backed by AWS KMS. Every value gets a unique encryption key.
- **Lock Context**: Identity-aware encryption that ties decryption to a specific user's JWT token.
- **Keyset**: A named collection of encryption keys for multi-tenant isolation.
- **Result pattern**: The SDK uses `{ data, error }` results instead of throwing exceptions.
- **Searchable encryption**: Encrypted indexes (unique, match, ore, ste_vec) that enable querying without decryption.
- **CTS (CipherStash Token Service)**: Authentication service that federates identity providers with ZeroKMS.
