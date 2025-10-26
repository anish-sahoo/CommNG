import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChannelShellProps = {
  title?: ReactNode;
  actions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ChannelShell({
  title,
  actions,
  sidebar,
  children,
  className,
}: ChannelShellProps) {
  const hasSidebar = Boolean(sidebar);

  return (
    <div className={cn("flex h-full w-full", className)}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 overflow-x-hidden md:min-h-[calc(100vh-6rem)]">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-background px-1 py-3 backdrop-blur sm:gap-4 sm:px-0 sm:py-4">
          {title ? (
            typeof title === "string" ? (
              <h1 className="text-header font-semibold text-secondary">
                {title}
              </h1>
            ) : (
              title
            )
          ) : null}
          {actions ? (
            <div className="flex items-center gap-3">{actions}</div>
          ) : null}
        </header>

        <div
          className={cn(
            "flex flex-1 gap-6",
            hasSidebar ? "flex-col lg:flex-row" : "flex-col",
          )}
        >
          {hasSidebar ? (
            <aside className="lg:w-64 xl:w-72">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                {sidebar}
              </div>
            </aside>
          ) : null}

          <main className="flex-1 pb-10 md:overflow-y-auto md:pr-1 md:pb-12 md:max-h-[calc(100vh-12rem)]">
            <div className="flex flex-col gap-6 pb-12 pt-2">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default ChannelShell;
