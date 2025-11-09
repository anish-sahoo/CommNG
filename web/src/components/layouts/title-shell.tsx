import Link from "next/link";
import type { ReactNode } from "react";
import { icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const ArrowLeftIcon = icons.arrowLeft;
type LinkHref = Parameters<typeof Link>[0]["href"];

export type TitleShellProps = {
  title?: ReactNode;
  actions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
  backHref?: LinkHref | string;
  backAriaLabel?: string;
};

export function TitleShell({
  title,
  actions,
  sidebar,
  children,
  className,
  backHref,
  backAriaLabel,
}: TitleShellProps) {
  const hasSidebar = Boolean(sidebar);
  const renderTitleContent = () => {
    if (!title) {
      return null;
    }
    if (typeof title === "string") {
      return (
        <span className="flex items-center text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
          {title}
        </span>
      );
    }
    return title;
  };

  const normalizedBackHref =
    typeof backHref === "string" ? (backHref as LinkHref) : (backHref ?? null);

  const headerTitle = normalizedBackHref ? (
    <div className="flex items-center gap-3 sm:gap-4">
      <Link
        href={normalizedBackHref}
        className="inline-flex h-12 w-12 items-center justify-center text-accent transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-14 sm:w-14"
        aria-label={backAriaLabel ?? "Go back"}
      >
        <ArrowLeftIcon className="h-7 w-7 sm:h-8 sm:w-8" />
      </Link>
      {renderTitleContent()}
    </div>
  ) : (
    renderTitleContent()
  );

  return (
    <div className={cn("flex h-full w-full", className)}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 overflow-x-hidden md:min-h-[calc(100vh-6rem)]">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-background px-1 py-3 backdrop-blur sm:gap-4 sm:px-0 sm:py-4">
          {headerTitle}
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

export default TitleShell;
