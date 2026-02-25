---
name: cipherstash-knowledge
description: Navigate and understand CipherStash documentation. Provides a complete map of all documentation resources for encryption, secrets management, key management, database proxy, and platform features. Use when working with CipherStash products, integrating @cipherstash/stack, or looking for CipherStash API references, guides, or conceptual explanations. Covers the Encryption SDK, Secrets API, ZeroKMS, CipherStash Proxy, Drizzle ORM integration, Supabase integration, DynamoDB integration, EQL (Encrypt Query Language), and platform administration.
metadata:
  author: cipherstash
  version: "1.0"
---

# CipherStash Documentation Knowledge

This skill helps you navigate the CipherStash documentation to find the right resources for any task. All documentation is available at [cipherstash.com/docs](https://cipherstash.com/docs).

CipherStash provides field-level encryption you can query without decryption, with cryptographically verifiable audit trails and key management backed by AWS KMS.

## Documentation Structure

The docs are organized into six main sections plus resource pages. Use this map to find the right starting point.

### Encryption (`/docs/encryption`)

Field-level encryption with searchable queries using `@cipherstash/stack`.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/encryption` | Understanding what CipherStash Encryption offers |
| Getting started | `/docs/encryption/getting-started` | First-time setup, installing the SDK, encrypting a first value |
| Configuration | `/docs/encryption/configuration` | Setting environment variables, TOML config, or programmatic config |
| Schema definition | `/docs/encryption/schema` | Defining which columns to encrypt, query types, nested objects |
| Encrypt and decrypt | `/docs/encryption/encrypt-decrypt` | Encrypting/decrypting single values, models, or bulk operations |
| Searchable encryption | `/docs/encryption/searchable-encryption` | Running equality, free-text, range, or JSON queries on encrypted data |
| Identity-aware encryption | `/docs/encryption/identity` | Tying encryption to a user's JWT, row-level access control |
| Storing encrypted data | `/docs/encryption/storing-data` | Persisting encrypted data in PostgreSQL or other databases |
| Drizzle ORM | `/docs/encryption/drizzle` | Using CipherStash with Drizzle ORM, encrypted column types and operators |
| Supabase | `/docs/encryption/supabase` | Using `encryptedSupabase` wrapper for transparent encrypt/decrypt |
| DynamoDB | `/docs/encryption/dynamodb` | Using `encryptedDynamoDB` helper, `__source`/`__hmac` attributes |
| Bundling | `/docs/encryption/bundling` | Configuring webpack, esbuild, Next.js builds with `@cipherstash/stack` |
| SST | `/docs/encryption/sst` | Deploying with SST and serverless functions |
| Testing | `/docs/encryption/testing` | Testing applications that use encryption |
| Troubleshooting | `/docs/encryption/troubleshooting` | Diagnosing common issues |
| Error handling | `/docs/encryption/error-handling` | The `Result` pattern used across the SDK |
| API reference | `/docs/encryption/api-reference` | Complete API surface for the Encryption SDK |
| Migration guide | `/docs/encryption/migration` | Migrating from `@cipherstash/protect` to `@cipherstash/stack` |

### Secrets (`/docs/secrets`)

End-to-end encrypted secret storage and management.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/secrets` | Understanding CipherStash Secrets capabilities |
| Getting started | `/docs/secrets/getting-started` | Storing and retrieving a first encrypted secret |
| Concepts | `/docs/secrets/concepts` | Understanding workspaces, environments, clients, API keys |
| SDK reference | `/docs/secrets/sdk` | Programmatic API: `set`, `get`, `getMany`, `list`, `delete` |
| CLI reference | `/docs/secrets/cli` | Terminal-based secret management with the `stash` CLI |

### KMS — ZeroKMS (`/docs/kms`)

Key management backed by AWS KMS.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/kms` | Understanding ZeroKMS architecture |
| Configuration | `/docs/kms/configuration` | Setting up ZeroKMS credentials and options |
| Access keys | `/docs/kms/access-keys` | Creating and managing programmatic access keys |
| Clients | `/docs/kms/clients` | Managing clients used by SDKs and Proxy |
| Keysets | `/docs/kms/keysets` | Multi-tenant key isolation |
| Regions | `/docs/kms/regions` | Understanding regional ZeroKMS deployment |
| CTS | `/docs/kms/cts` | CipherStash Token Service for authentication and identity federation |
| Disaster recovery | `/docs/kms/disaster-recovery` | Data protection and disaster recovery capabilities |

### Proxy (`/docs/proxy`)

Transparent, searchable encryption for existing PostgreSQL databases.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/proxy` | Understanding CipherStash Proxy capabilities |
| Getting started | `/docs/proxy/getting-started` | Setting up Proxy in local development |
| Configuration | `/docs/proxy/configuration` | Docker setup, environment variables, database schema |
| AWS ECS deployment | `/docs/proxy/aws-ecs` | Deploying Proxy to AWS ECS with Fargate |
| Audit features | `/docs/proxy/audit` | Statement fingerprinting, SQL redaction, record reconciliation |

### Platform (`/docs/platform`)

Dashboard, workspaces, organization management, and core concepts.

| Page | URL | Use when |
|------|-----|----------|
| Overview | `/docs/platform` | Understanding the CipherStash platform |
| What is CipherStash? | `/docs/platform/what-is-cipherstash` | High-level product explanation |
| Security architecture | `/docs/platform/security-architecture` | Cryptographic primitives, key hierarchy, trust model |
| Searchable encryption (concepts) | `/docs/platform/searchable-encryption` | Theory and architecture of querying encrypted data |
| The CipherCell | `/docs/platform/cipher-cell` | The encrypted data format with searchable metadata |
| Supported queries | `/docs/platform/supported-queries` | Index types and query operations on encrypted data |
| EQL | `/docs/platform/eql` | Encrypt Query Language: PostgreSQL types, operators, functions |
| CipherStash vs AWS KMS | `/docs/platform/aws-kms-comparison` | Side-by-side comparison for application-level encryption |
| Members | `/docs/platform/members` | Managing organization members and workspace memberships |
| Compliance | `/docs/platform/compliance` | GDPR, HIPAA, PCI-DSS, data residency, audit capabilities |
| Billing | `/docs/platform/billing` | Plans, usage limits, workspace billing |

### Reference (`/docs/reference`)

Auto-generated API reference documentation.

| Page | URL | Use when |
|------|-----|----------|
| API Reference index | `/docs/reference` | Finding the right API reference page |
| EQL API Reference | `/docs/reference/eql` | Complete EQL PostgreSQL extension reference (v2.2.1) |
| `@cipherstash/stack` | `/docs/reference/stack/latest` | Full SDK reference (v0.4.0) |

#### SDK Reference Modules (`/docs/reference/stack/latest/...`)

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
| Glossary | `/docs/glossary` | Looking up CipherStash-specific terms |
| Planning guide | `/docs/planning-guide` | Technical planning for adopting CipherStash |
| Supported solutions | `/docs/supported-solutions` | Checking integration options, supported databases, performance |
| Use cases | `/docs/use-cases` | Real-world application scenarios |
| AI and RAG pipelines | `/docs/use-cases/ai-rag` | Encrypting data in AI/RAG pipelines |
| Regulatory compliance | `/docs/use-cases/compliance` | GDPR, HIPAA, PCI-DSS compliance patterns |
| Data residency | `/docs/use-cases/data-residency` | Cross-border data access, regional key deployment |
| Provable access control | `/docs/use-cases/provable-access` | Cryptographic proof-based access with Lock Contexts |

## How to Find the Right Documentation

### By task

| Task | Start here |
|------|------------|
| **First time using CipherStash** | `/docs/encryption/getting-started` |
| **Add encryption to an existing app** | `/docs/encryption/getting-started` then `/docs/encryption/schema` |
| **Query encrypted data** | `/docs/encryption/searchable-encryption` |
| **Use with Drizzle ORM** | `/docs/encryption/drizzle` |
| **Use with Supabase** | `/docs/encryption/supabase` |
| **Use with DynamoDB** | `/docs/encryption/dynamodb` |
| **Store secrets (API keys, DB URLs)** | `/docs/secrets/getting-started` |
| **Manage secrets from CLI** | `/docs/secrets/cli` |
| **Set up transparent DB encryption** | `/docs/proxy/getting-started` |
| **Deploy Proxy to AWS** | `/docs/proxy/aws-ecs` |
| **Understand the security model** | `/docs/platform/security-architecture` |
| **Compare with AWS KMS** | `/docs/platform/aws-kms-comparison` |
| **Plan a CipherStash adoption** | `/docs/planning-guide` |
| **Check compliance requirements** | `/docs/platform/compliance` or `/docs/use-cases/compliance` |
| **Look up an API method** | `/docs/reference/stack/latest` |
| **Write EQL queries** | `/docs/platform/eql` or `/docs/reference/eql` |
| **Configure for production** | `/docs/encryption/configuration` then `/docs/encryption/bundling` |
| **Troubleshoot an issue** | `/docs/encryption/troubleshooting` |
| **Handle errors** | `/docs/encryption/error-handling` |
| **Set up multi-tenant encryption** | `/docs/kms/keysets` |
| **Implement identity-aware encryption** | `/docs/encryption/identity` |
| **Migrate from @cipherstash/protect** | `/docs/encryption/migration` |

### By product

| Product | Package | Docs |
|---------|---------|------|
| Encryption SDK | `@cipherstash/stack` | `/docs/encryption` |
| Drizzle integration | `@cipherstash/stack/drizzle` | `/docs/encryption/drizzle` |
| Supabase integration | `@cipherstash/stack/supabase` | `/docs/encryption/supabase` |
| DynamoDB integration | `@cipherstash/stack/dynamodb` | `/docs/encryption/dynamodb` |
| Secrets SDK | `@cipherstash/stack` | `/docs/secrets` |
| Secrets CLI | `stash` CLI | `/docs/secrets/cli` |
| ZeroKMS | Key management service | `/docs/kms` |
| CipherStash Proxy | PostgreSQL proxy | `/docs/proxy` |
| EQL | PostgreSQL extension | `/docs/platform/eql`, `/docs/reference/eql` |

## Fetching Documentation Content

All documentation pages are available as processed markdown for LLM consumption:

- **Individual page**: `https://cipherstash.com/docs/{path}.mdx` (e.g., `https://cipherstash.com/docs/encryption/getting-started.mdx`)
- **Full index**: `https://cipherstash.com/llms.txt` — title and description for every page
- **Full content**: `https://cipherstash.com/llms-full.txt` — all pages concatenated as markdown

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
