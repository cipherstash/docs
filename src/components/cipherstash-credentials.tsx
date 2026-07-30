import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { ExternalLink, Laptop, LayoutDashboard, Terminal } from "lucide-react";

const ENVIRONMENT_VARIABLES = `CS_WORKSPACE_CRN=crn:<region>.<provider>:<workspace-id>
CS_CLIENT_ID=<uuid>
CS_CLIENT_KEY=<hex>
CS_CLIENT_ACCESS_KEY=CSAK...`;

const options = [
  {
    title: "Developer profile",
    useFor: "Local development",
    icon: Laptop,
    content: (
      <>
        Run <code>npx stash auth login</code>. The native Stack client finds the
        resulting developer profile automatically, so you do not need
        environment variables on your development machine.
      </>
    ),
  },
  {
    title: "stash env",
    useFor: "CI and deployed environments",
    icon: Terminal,
    content: (
      <>
        Run <code>npx stash env --name &lt;app-env&gt;</code> while logged in.
        It creates a client and prints the four environment variables below. The
        access key is shown only once.
      </>
    ),
  },
  {
    title: "Dashboard",
    useFor: "CI and deployed environments",
    icon: LayoutDashboard,
    content: (
      <>
        Open your{" "}
        <a
          href="https://dashboard.cipherstash.com/workspaces/_"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          CipherStash workspace
          <ExternalLink
            className="ms-1 inline size-3"
            aria-label="Opens in a new tab"
          />
        </a>{" "}
        and create deployment credentials there. Add the resulting values to
        your platform&apos;s secret store.
      </>
    ),
  },
] as const;

/**
 * The canonical credential-source chooser for integration and deployment
 * guides. Keep the discovery order and environment-variable names aligned
 * with the Stack authentication skill.
 */
export function CipherStashCredentials() {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border bg-fd-card">
      <div className="border-b px-5 py-4">
        <h3 className="font-semibold text-fd-foreground">
          Choose a credential source
        </h3>
        <p className="mt-1 text-sm text-fd-muted-foreground">
          Use the developer profile locally. For CI or a deployed application,
          create a separate credential set with the CLI or Dashboard.
        </p>
      </div>

      <ol className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
        {options.map(({ title, useFor, icon: Icon, content }, index) => (
          <li key={title} className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fd-secondary text-fd-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium text-fd-foreground">
                  {index + 1}. {title}
                </p>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">
                  {useFor}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground [&_code]:text-fd-foreground">
              {content}
            </p>
          </li>
        ))}
      </ol>

      <div className="border-t px-5 py-4">
        <p className="text-sm font-medium text-fd-foreground">
          Deployment environment variables
        </p>
        <p className="mt-1 text-sm text-fd-muted-foreground">
          Both deployment methods produce the same values. Treat{" "}
          <code>CS_CLIENT_KEY</code> and <code>CS_CLIENT_ACCESS_KEY</code> as
          secrets.
        </p>
        <CodeBlock title=".env" className="mb-0">
          <Pre className="px-4">
            <code>{ENVIRONMENT_VARIABLES}</code>
          </Pre>
        </CodeBlock>
      </div>
    </div>
  );
}
