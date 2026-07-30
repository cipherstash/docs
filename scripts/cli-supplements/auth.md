## Switching workspaces

`stash` 1.0.0 keeps one active device-session profile at
`~/.cipherstash/auth.json`. To switch workspaces, run `npx stash auth login`
again and complete authorization for the target workspace. The new login
replaces the active session.

`stash init` reuses the active session when it is still valid, so switch
workspaces before running `init`. There is no separate profile manager or
workspace-switch command in `stash` 1.0.0.
