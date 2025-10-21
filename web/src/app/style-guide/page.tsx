import { iconCatalog } from "@/components/icons";

const typographyScale = [
  {
    name: "Title",
    className: "text-title",
    description:
      "Primary page titles. Semibold on desktop (48px) and mobile (32px).",
    sample: "The quick brown fox jumps over the lazy dog.",
  },
  {
    name: "Header",
    className: "text-header",
    description: "Section headers, cards, and key UI labels.",
    sample: "Heading level content stays strong and clear.",
  },
  {
    name: "Subheader",
    className: "text-subheader",
    description: "Form labels, button text, and secondary headings.",
    sample: "Supporting copy that balances emphasis and clarity.",
  },
  {
    name: "Body",
    className: "text-body",
    description: "Long-form content and body copy.",
    sample: "Body text ensures comfortable reading across breakpoints.",
  },
];

const palette = [
  {
    name: "Background",
    token: "background",
    hex: "#F7F7F7",
    swatchClass: "bg-background border border-neutral/60",
    textClass: "text-secondary",
    usage: "Page background and neutral surfaces.",
  },
  {
    name: "Primary",
    token: "primary",
    hex: "#283396",
    swatchClass: "bg-primary border border-primary/60",
    textClass: "text-secondary",
    usage: "Brand accents, primary buttons, links.",
  },
  {
    name: "Secondary",
    token: "secondary",
    hex: "#222121",
    swatchClass: "bg-secondary border border-secondary/60",
    textClass: "text-secondary",
    usage: "High-contrast text and iconography.",
  },
  {
    name: "Accent",
    token: "accent",
    hex: "#DDA139",
    swatchClass: "bg-accent border border-accent/60",
    textClass: "text-secondary",
    usage: "Highlights, charts, notices.",
  },
  {
    name: "Neutral",
    token: "neutral",
    hex: "#CDCDCD",
    swatchClass: "bg-neutral border border-neutral/60",
    textClass: "text-secondary",
    usage: "Borders, dividers, disabled states.",
  },
];

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-background pb-16 pt-12 text-secondary">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center lg:text-left">
          <p className="text-lg uppercase tracking-[0.2em] text-primary">
            CommNG Design System
          </p>
          <h1 className="text-title text-secondary">Style Guide</h1>
          <p className="text-body text-secondary/80">
            Snapshot of our typography scale and core color palette. Combine
            these tokens with Tailwind utilities to compose brand-consistent
            interfaces quickly.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.4fr,1fr]">
          <section className="space-y-6">
            <h2 className="text-header text-secondary">Typography</h2>
            <p className="text-subheader text-secondary/80">
              All type styles use Open Sans via `text-*` utility classes.
            </p>
            <div className="space-y-6">
              {typographyScale.map(
                ({ name, className, description, sample }) => (
                  <div
                    key={name}
                    className="rounded-2xl border border-neutral/50 bg-white/70 p-6 shadow-sm backdrop-blur-sm"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">
                      {name}
                    </p>
                    <p className={`${className} mt-2 text-secondary`}>
                      {sample}
                    </p>
                    <p className="mt-3 text-body text-secondary/70">
                      {description}
                    </p>
                    <code className="mt-4 inline-block rounded bg-neutral/30 px-2 py-1 text-xs text-secondary">
                      className="{className}"
                    </code>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-header text-secondary">Colors</h2>
            <p className="text-subheader text-secondary/80">
              Palette tokens exposed via `bg-{"token"}` and `text-{"token"}`
              utilities.
            </p>
            <div className="space-y-4">
              {palette.map(
                ({ name, token, hex, swatchClass, textClass, usage }) => (
                  <div
                    key={name}
                    className="flex items-center gap-4 rounded-2xl border border-neutral/50 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
                  >
                    <span
                      className={`h-14 w-14 shrink-0 rounded-xl ${swatchClass}`}
                    />
                    <div className="flex flex-1 flex-col">
                      <span className={`text-subheader ${textClass}`}>
                        {name}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-neutral">
                        {hex}
                      </span>
                      <p className="mt-2 text-body text-secondary/70">
                        {usage}
                      </p>
                    </div>
                    <code className="text-xs text-neutral">bg-{token}</code>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>

        <section className="space-y-6">
          <h2 className="text-header text-secondary">Icons</h2>
          <p className="text-subheader text-secondary/80">
            @heroicons icons mapped to our Figma set. Import them from
            <code className="mx-2 rounded bg-neutral/30 px-2 py-0.5 text-xs text-secondary">
              @/components/icons
            </code>
            and render them as needed.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {iconCatalog.map(({ name, icon: Icon, usage, token }) => (
              <div
                key={token}
                className="flex flex-col justify-between rounded-2xl border border-neutral/50 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-subheader text-secondary">{name}</span>
                  <Icon className="h-8 w-8 text-accent" />
                </div>
                <p className="mt-3 text-body text-secondary/70">{usage}</p>
                <code className="mt-4 inline-block rounded bg-neutral/30 px-2 py-1 text-xs text-secondary">
                  {token}
                </code>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
