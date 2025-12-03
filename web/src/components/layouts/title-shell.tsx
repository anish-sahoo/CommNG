import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { icons } from "@/components/icons";
import { MobileNavTrigger } from "@/components/layouts/navigation-shell";
import { cn } from "@/lib/utils";

const ArrowLeftIcon = icons.arrowLeft;

export type TitleShellProps<T extends string> = {
  title?: ReactNode;
  actions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
  backHref?: Route<T> | null;
  backAriaLabel?: string;
  contentClassName?: string;
  pinnedContent?: ReactNode;
  scrollableContent?: boolean;
  onBackClick?: () => void;
};

export function TitleShell<T extends string>({
  title,
  actions,
  sidebar,
  children,
  className,
  backHref = null,
  backAriaLabel,
  contentClassName,
  pinnedContent,
  scrollableContent = true,
  onBackClick,
}: TitleShellProps<T>) {
  const hasSidebar = Boolean(sidebar);
  const renderTitleContent = () => {
    if (!title) {
      return null;
    }
    if (typeof title === "string") {
      return (
        <span className="flex items-center text-[clamp(1.4rem,5vw,1.75rem)] font-semibold leading-tight text-secondary truncate whitespace-nowrap md:text-[2.25rem]">
          {title}
        </span>
      );
    }
    return title;
  };

  const headerTitle = renderTitleContent();

  return (
    <div className={cn("flex h-full w-full", className)}>
      <div className="mx-auto flex w-full app-content-width flex-1 flex-col gap-6 overflow-x-hidden md:min-h-[calc(100vh-6rem)]">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border/70 bg-background px-1 py-3 backdrop-blur sm:gap-4 sm:px-0 sm:py-4">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <MobileNavTrigger />
              {backHref ? (
                onBackClick ? (
                  <button
                    type="button"
                    onClick={onBackClick}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-accent transition hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    aria-label={backAriaLabel ?? "Go back"}
                  >
                    <ArrowLeftIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                ) : (
                  <Link
                    href={backHref}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-accent transition hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    aria-label={backAriaLabel ?? "Go back"}
                  >
                    <ArrowLeftIcon className="h-6 w-6" aria-hidden="true" />
                  </Link>
                )
              ) : null}
              <div className="min-w-0 flex-1 ml-1">{headerTitle}</div>
            </div>
            {actions ? (
              <div className="flex flex-shrink-0 items-center gap-3">
                {actions}
              </div>
            ) : null}
          </div>
        </header>

        {pinnedContent ? (
          <div className="px-1 sm:px-0">{pinnedContent}</div>
        ) : null}

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

          <main
            className={cn(
              scrollableContent
                ? "flex-1 pb-10 md:max-h-[calc(100vh-12rem)] md:overflow-y-auto md:pr-1 md:pb-12"
                : "flex-1 pb-10",
              contentClassName,
            )}
          >
            <div className="flex flex-col gap-6 pb-12 pt-2">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default TitleShell;
