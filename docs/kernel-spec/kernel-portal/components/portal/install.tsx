"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Section } from "./section"

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
        <span className="font-mono text-xs text-muted-foreground">{lang}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 font-mono text-xs"
          onClick={() => {
            navigator.clipboard?.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1400)
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

const cli = `# add the Kernel theme to your project
npx shadcn@latest add https://tweakcn.com/r/themes/cmof9c9uz000204la2vq54eiw`

const usage = `<Button className="bg-primary text-primary-foreground">
  Deploy
</Button>

<Card className="bg-card text-card-foreground border-border">
  …
</Card>`

const vars = `:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.2128 0.0209 162.2254);
  --primary: oklch(0.5364 0.1457 150.5842);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9758 0.0163 121.7629);
  --accent: oklch(0.9758 0.0163 121.7629);
  --destructive: oklch(0.5227 0.2063 25.8499);
  --muted: oklch(0.9612 0 0);
  --border: oklch(0.8957 0.0025 165.0685);
  --ring: oklch(0.5364 0.1457 150.5842);
  --radius: 0.5rem;
}`

export function InstallSection() {
  return (
    <Section
      id="install"
      eyebrow="Get started"
      title="Install & usage"
      lead="Add Kernel to any shadcn/ui project with a single command, then reference tokens by their semantic names."
    >
      <div className="space-y-6">
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">1 · Add the theme</h4>
          <CodeBlock lang="terminal" code={cli} />
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">2 · Use the tokens</h4>
          <CodeBlock lang="tsx" code={usage} />
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">3 · CSS variables (light)</h4>
          <CodeBlock lang="globals.css" code={vars} />
        </div>
      </div>
    </Section>
  )
}
