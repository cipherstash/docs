"use client";

import type { CodeBlockProps } from "fumadocs-ui/components/codeblock";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "fumadocs-ui/components/ui/tabs";
import {
  ChevronDown,
  ExternalLink,
  Laptop,
  LayoutDashboard,
  Terminal,
} from "lucide-react";
import { useId, useState } from "react";
import { TrackedCodeBlock } from "@/components/code-block";
import { cipherstashDark, cipherstashLight } from "@/lib/shiki-themes";

const ENVIRONMENT_VARIABLES = `CS_WORKSPACE_CRN=crn:<region>.<provider>:<workspace-id>
CS_CLIENT_ID=<uuid>
CS_CLIENT_KEY=<hex>
CS_CLIENT_ACCESS_KEY=CSAK...`;

const options = [
  {
    value: "developer-profile",
    title: "Developer profile",
    useFor: "Local development",
    icon: Laptop,
    command: "npx stash auth login",
    action: null,
    description:
      "The native Stack client uses the developer profile automatically.",
  },
  {
    value: "stash-env",
    title: "stash env",
    useFor: "CI and Deployment",
    icon: Terminal,
    command: "npx stash env --name <app-env>",
    action: null,
    description:
      "Creates a client and prints the four variables below. The access key is shown once.",
  },
  {
    value: "dashboard",
    title: "Dashboard",
    useFor: "CI and Deployment",
    icon: LayoutDashboard,
    command: null,
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

type CredentialOptionValue = (typeof options)[number]["value"];

function TrackedBashCodeBlock(props: CodeBlockProps) {
  return (
    <TrackedCodeBlock
      {...props}
      data-language="bash"
      className={`my-0 ${props.className ?? ""}`}
    />
  );
}

function DeploymentEnvironmentVariables() {
  return (
    <div className="mt-5 border-t pt-4">
      <p className="text-sm font-medium text-fd-foreground">
        Deployment environment variables
      </p>
      <p className="my-2 text-xs text-fd-muted-foreground">
        Both deployment methods produce the same values.
        <br />
        Treat <code>CS_CLIENT_KEY</code> and <code>CS_CLIENT_ACCESS_KEY</code>{" "}
        as secrets.
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
  );
}

/**
 * The canonical credential-source chooser for integration and deployment
 * guides. Keep the discovery order and environment-variable names aligned
 * with the Stack authentication skill.
 */
export function CipherStashCredentials() {
  const selectId = useId();
  const [selectedOption, setSelectedOption] = useState<CredentialOptionValue>(
    options[0].value,
  );

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

      <Tabs
        value={selectedOption}
        onValueChange={(value) =>
          setSelectedOption(value as CredentialOptionValue)
        }
        className="my-0 gap-0 overflow-visible rounded-none border-0 bg-transparent"
      >
        <div className="border-b p-4 md:hidden">
          <label htmlFor={selectId} className="sr-only">
            Credential source
          </label>
          <div className="relative">
            <select
              id={selectId}
              value={selectedOption}
              onChange={(event) =>
                setSelectedOption(event.target.value as CredentialOptionValue)
              }
              className="w-full appearance-none rounded-lg border bg-fd-background px-3 py-2.5 pe-10 text-sm font-medium text-fd-foreground shadow-sm outline-none transition-colors focus:border-fd-primary focus:ring-2 focus:ring-fd-primary/20"
            >
              {options.map(({ value, title, useFor }) => (
                <option key={value} value={value}>
                  {title} — {useFor}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>

        <TabsList className="hidden grid-cols-3 border-b md:grid">
          {options.map(({ value, title, useFor, icon: Icon }, index) => (
            <TabsTrigger
              key={value}
              value={value}
              className="group inline-flex w-full items-center justify-start gap-2 border-b-2 border-transparent px-5 py-4 text-left text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground data-[state=active]:border-fd-primary data-[state=active]:bg-fd-primary/5 data-[state=active]:text-fd-foreground"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fd-primary/10 text-fd-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">
                  {index + 1}. {title}
                </span>
                <span className="mt-0.5 block text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">
                  {useFor}
                </span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {options.map(({ value, command, action, description }) => (
          <TabsContent
            key={value}
            value={value}
            className="rounded-none bg-transparent p-5 outline-none"
          >
            {command ? (
              <>
                <p className="mb-2 text-sm text-fd-foreground">Run:</p>
                <DynamicCodeBlock
                  lang="bash"
                  code={command}
                  options={{
                    themes: {
                      light: cipherstashLight,
                      dark: cipherstashDark,
                    },
                    components: { pre: TrackedBashCodeBlock },
                  }}
                />
              </>
            ) : (
              <p className="text-sm leading-relaxed text-fd-foreground">
                {action}
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-fd-muted-foreground">
              {description}
            </p>
            {value !== "developer-profile" && (
              <DeploymentEnvironmentVariables />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
