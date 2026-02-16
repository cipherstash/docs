# Security Policy

CipherStash takes the security of our software, infrastructure, and customers extremely seriously.  
This document describes the security posture, reporting process, and guidelines for the `docs` repository and associated packages.

---

## Security Guidelines for Contributors

To maintain a strong security posture, contributors MUST:

### ⚙️ Follow cryptographic safety rules
- Do **not** modify cryptographic primitives without prior discussion 
- Avoid introducing new crypto dependencies without prior discussion  
- Never check in test keys, secrets, or example credentials  

### 🛡 Coding & dependency hygiene
- Avoid adding dependencies unless necessary 
- Keep dependencies updated and vetted  
- Use TypeScript for all new code  
- Ensure all code paths that handle keys or encrypted data include type-safe boundaries  

### 🔍 Testing & review
- Submit PRs with tests covering edge cases and misuse-resistant behaviour  
- Flag any changes involving key derivation, key wrapping, AAD, or encryption modes for mandatory security review  
- Do not merge PRs that downgrade security controls or introduce unsafe defaults

---

## Questions?

For general questions about CipherStash security practices (not security incidents), contact:

📧 **support@cipherstash.com**

For vulnerability disclosures:

📧 **security@cipherstash.com**

---

Thank you for helping keep the CipherStash ecosystem secure.
