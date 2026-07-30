import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { ExternalLink, Laptop, LayoutDashboard, Terminal } from "lucide-react";
import { cipherstashDark, cipherstashLight } from "@/lib/shiki-themes";

const ENVIRONMENT_VARIABLES = `CS_WORKSPACE_CRN=crn:<region>.<provider>:<workspace-id>
CS_CLIENT_ID=<uuid>
CS_CLIENT_KEY=<hex>
CS_CLIENT_ACCESS_KEY=CSAK...`;

const options = [
  {
    title: "Developer profile",
    useFor: "Local development",
    icon: Laptop,
    action: (
      <>
        Run <code>npx stash auth login</code>.
      </>
    ),
    description:
      "The native Stack client uses the developer profile automatically.",
  },
  {
    title: "stash env",
    useFor: "CI and Deployment",
    icon: Terminal,
    action: (
      <>
        Run <code>npx stash env --name &lt;app-env&gt;</code>.
      </>
    ),
    description:
      "Creates a client and prints the four variables below. The access key is shown once.",
  },
  {
    title: "Dashboard",
    useFor: "CI and Deployment",
    icon: LayoutDashboard,
    action: (
      <>
        Open your{" "}
        <a
          href="https://dashboard.cipherstash.com/workspaces/_"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-fd-foreground underline decoration-fd-primary decoration-[1.5px] underline-offset-[3.5px] transition-opacity hover:opacity-80"
        >
          CipherStash workspace
          <ExternalLink
            className="ms-1 inline size-3"
            aria-label="Opens in a new tab"
          />
        </a>{" "}
        and create deployment credentials.
      </>
    ),
    description: "Save the values in your platform’s secret store.",
  },
] as const;

/**
 * The canonical credential-source chooser for integration and deployment
 * guides. Keep the discovery order and environment-variable names aligned
 * with the Stack authentication skill.
 */
export function CipherStashCredentials() {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-t-2 border-t-fd-primary bg-fd-card">
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
        {options.map(
          ({ title, useFor, icon: Icon, action, description }, index) => (
            <li key={title} className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fd-primary/10 text-fd-primary">
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
              <p className="mt-3 text-sm leading-relaxed text-fd-foreground">
                {action}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">
                {description}
              </p>
            </li>
          ),
        )}
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
        <DynamicCodeBlock
          lang="dotenv"
          code={ENVIRONMENT_VARIABLES}
          codeblock={{ title: ".env", className: "mb-0" }}
          options={{
            themes: { light: cipherstashLight, dark: cipherstashDark },
          }}
        />
      </div>
    </div>
  );
}
