## How authentication works

`stash auth login` runs the OAuth 2.0 **device authorization flow**:

1. You pick a **region** for your CipherStash workspace.
2. The CLI opens your browser to a verification URL (and prints it, so it also
   works over SSH or in a headless/agent environment) where you approve the
   request.
3. Meanwhile the CLI polls CipherStash until you approve, then receives a
   short-lived access token (it reports the token's expiry).
4. Your device is **bound to the workspace's default keyset**, so later commands
   (`stash eql install`, `stash db push`, …) authenticate without a fresh login.

<Callout title="Good to know">
Login is device- and workspace-scoped. Authenticating from a new machine, or for a different workspace, re-runs the device flow.
</Callout>

{/* TODO(verify with product): profiles, multiple workspaces, and switching
between them (where they're stored and how they're selected) belong here, or
in a linked CLI concept page. The CLI currently exposes only `auth login`;
confirm the profile / workspace-switching surface before documenting it. */}
