import type { FaqEntry } from "./index";

/**
 * Product-wide FAQ answers that are not specific to any one integration.
 * Import the entries you need into an integration overview page and mix them
 * with integration-specific `FaqEntry` objects authored inline.
 */

export const faqPrivacy: FaqEntry = {
  title: "Can CipherStash ever see my data, or my encryption keys?",
  answer: (
    <>
      No, never. Encryption and decryption occur in your application, and keys
      are derived in your environment. Plaintext and keys never leave your
      control and never reach CipherStash.
    </>
  ),
};

export const faqScaling: FaqEntry = {
  title: "How well does it scale?",
  answer: (
    <>
      Latency stays flat as data grows: exact-match lookups hold at ~0.1 ms and
      range queries at ~0.5 ms, from 10k to 10M rows on the{" "}
      <a
        href="https://github.com/cipherstash/benches"
        target="_blank"
        rel="noreferrer"
      >
        cipherstash/benches
      </a>{" "}
      suite.
    </>
  ),
};

export const faqKms: FaqEntry = {
  title: "Do I need to run a KMS or key vault?",
  answer: (
    <>
      No. Key management is built in through ZeroKMS. If you want to control the
      root key, Bring Your Own Key (BYOK) lets you root it in your own KMS.
    </>
  ),
};

export const faqRlsVsEncryption: FaqEntry = {
  title: "I already use Row Level Security. Do I need this?",
  answer: (
    <>
      RLS and CipherStash do different things, and they work best together. RLS
      controls which rows someone can see, but the data itself is still
      unencrypted, so if RLS is bypassed (a leaked key, a wrong policy, a
      compromised database) the plaintext is exposed. CipherStash encrypts the
      data and stores the keys separately, so even if someone gets around RLS,
      the data stays safe. Use RLS to control access, and CipherStash to keep
      the data protected.
    </>
  ),
};

export const faqFreeTier: FaqEntry = {
  title: "Is there a free tier?",
  answer: (
    <>
      Yes, a free developer tier, so you can build encryption in from day one.
    </>
  ),
};
