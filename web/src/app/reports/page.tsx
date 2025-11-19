"use client";

import type { AppRouter } from "@server/trpc/app_router";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import SearchBar from "@/components/search-bar";
import { ReportsTable } from "@/components/table-view";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRoles } from "@/hooks/useUserRoles";
import { authClient } from "@/lib/auth-client";
import { hasAnyRole, hasRole } from "@/lib/rbac";
import { useTRPCClient } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import type { RoleKey } from "@/types/roles";

type ReportRecord =
  inferRouterOutputs<AppRouter>["reports"]["getReports"][number];

const STATUS_ORDER: ReportRecord["status"][] = [
  "Pending",
  "Assigned",
  "Resolved",
];

const SORT_OPTIONS = [
  { id: "date-desc", label: "Newest first" },
  { id: "date-asc", label: "Oldest first" },
  { id: "title-asc", label: "Title A-Z" },
  { id: "title-desc", label: "Title Z-A" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["id"];

function toISODate(value?: string | Date | null) {
  const fallback = new Date();
  if (!value) return fallback.toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? fallback.toISOString()
    : parsed.toISOString();
}

const AddIcon = icons.add;
const SortIcon = icons.sort;

const REPORTING_READ_ROLE = "reporting:read" as RoleKey;
const REPORTING_ADMIN_ROLES: RoleKey[] = [
  "reporting:admin" as RoleKey,
  "reporting:assign" as RoleKey,
];

export default function ReportsPage() {
  const trpcClient = useTRPCClient();
  const { data: sessionData } = authClient.useSession();
  const userId = sessionData?.user?.id ?? null;
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const statusCarouselRef = useRef<HTMLDivElement | null>(null);
  const {
    roles,
    isLoading: rolesLoading,
    isError: rolesRequestFailed,
    refetch: refetchRoles,
  } = useUserRoles();

  const normalizedRoles = useMemo<RoleKey[]>(() => {
    return Array.isArray(roles) ? (roles as RoleKey[]) : [];
  }, [roles]);

  const hasReportingRead = useMemo(() => {
    if (!roles) return false;
    return hasRole(normalizedRoles, REPORTING_READ_ROLE);
  }, [roles, normalizedRoles]);

  const isReportsAdmin = useMemo(() => {
    if (!roles) return false;
    return hasAnyRole(normalizedRoles, REPORTING_ADMIN_ROLES);
  }, [roles, normalizedRoles]);

  const reportsQuery = useQuery({
    queryKey: ["reports", userId],
    enabled: Boolean(userId && hasReportingRead),
    queryFn: async () => {
      if (!userId) return [];
      const response = await trpcClient.reports.getReports.mutate({
        name: userId,
      });
      return Array.isArray(response) ? response : [];
    },
    refetchOnWindowFocus: false,
  });

  const reports = useMemo<ReportRecord[]>(() => {
    if (!Array.isArray(reportsQuery.data)) {
      return [];
    }
    return reportsQuery.data;
  }, [reportsQuery.data]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredReports = useMemo(() => {
    if (!normalizedSearch) return reports;
    return reports.filter((report) => {
      const haystack = [
        report.title,
        report.description,
        report.status,
        report.category ?? "",
        report.assignedTo ?? "",
      ]
        .filter(Boolean)
        .map((entry) => entry.toLowerCase());
      return haystack.some((entry) => entry.includes(normalizedSearch));
    });
  }, [reports, normalizedSearch]);

  const sortedReports = useMemo(() => {
    const reportsToSort = [...filteredReports];
    const getTimestamp = (record: ReportRecord) => {
      const value =
        record.createdAt ?? record.updatedAt ?? record.resolvedAt ?? null;
      if (!value) {
        return 0;
      }
      return new Date(value).getTime();
    };

    reportsToSort.sort((left, right) => {
      switch (sortOption) {
        case "date-asc":
          return getTimestamp(left) - getTimestamp(right);
        case "title-asc":
          return left.title.localeCompare(right.title);
        case "title-desc":
          return right.title.localeCompare(left.title);
        default:
          return getTimestamp(right) - getTimestamp(left);
      }
    });

    return reportsToSort;
  }, [filteredReports, sortOption]);

  const tableItems = useMemo(
    () =>
      sortedReports.map((report) => ({
        id: report.reportId,
        title: report.title,
        summary: report.description,
        status: report.status,
        dateCreated: toISODate(report.createdAt),
        comments:
          report.attachments && report.attachments.length > 0
            ? `${report.attachments.length} attachment${
                report.attachments.length === 1 ? "" : "s"
              }`
            : undefined,
        issuedTo: report.assignedTo ?? undefined,
      })),
    [sortedReports],
  );

  const activeSortLabel = useMemo(() => {
    return (
      SORT_OPTIONS.find((option) => option.id === sortOption)?.label ??
      SORT_OPTIONS[0]?.label ??
      "Newest first"
    );
  }, [sortOption]);

  const statusSummary = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      count: reports.filter((report) => report.status === status).length,
    }));
  }, [reports]);

  const [carouselState, setCarouselState] = useState({
    index: 0,
    atStart: true,
    atEnd: statusSummary.length <= 1,
  });

  useEffect(() => {
    const container = statusCarouselRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth - 1;
      const nextIndex = Math.round(scrollLeft / Math.max(clientWidth, 1));
      setCarouselState({
        index: Math.min(
          Math.max(nextIndex, 0),
          Math.max(statusSummary.length - 1, 0),
        ),
        atStart: scrollLeft <= 1,
        atEnd: scrollLeft >= maxScroll,
      });
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [statusSummary.length]);

  useEffect(() => {
    const container = statusCarouselRef.current;
    if (!container) return;
    container.scrollTo({ left: 0 });
    setCarouselState({
      index: 0,
      atStart: true,
      atEnd: statusSummary.length <= 1,
    });
  }, [statusSummary.length]);

  const isLoading = reportsQuery.isLoading || reportsQuery.isFetching;
  const hasError = reportsQuery.isError;

  const heading = (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1 sm:flex-1">
          <h1 className="hidden text-[1.75rem] font-semibold leading-tight text-secondary sm:block sm:text-[2.25rem]">
            Reports
          </h1>
        </div>
        <SearchBar
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search reports"
          className="w-full"
          containerClassName="w-full sm:max-w-sm"
        />
      </div>
    </div>
  );

  const headerActions = !userId ? null : (
    <>
      <Button
        type="button"
        asChild
        variant="outline"
        size="icon"
        className="rounded-full border border-border text-primary transition hover:bg-primary hover:text-background sm:hidden"
        aria-label="Create a new report"
      >
        <Link href="/reports/new">
          <AddIcon className="h-5 w-5" aria-hidden="true" />
        </Link>
      </Button>
      <Button
        type="button"
        asChild
        variant="outline"
        className="hidden items-center gap-2 border-border text-primary transition hover:bg-primary hover:text-background sm:inline-flex"
      >
        <Link href="/reports/new">
          <AddIcon className="h-5 w-5" aria-hidden="true" />
          <span className="font-normal">New Report</span>
        </Link>
      </Button>
    </>
  );

  return (
    <TitleShell title={heading} actions={headerActions} scrollableContent>
      {!userId ? (
        <section className="rounded-2xl border border-border bg-card p-6 text-secondary shadow-sm">
          Sign in to view and manage your reports.
        </section>
      ) : rolesRequestFailed ? (
        <section className="rounded-2xl border border-border bg-card p-6 text-secondary shadow-sm">
          <p className="text-sm">
            We couldn&apos;t verify your permissions just yet.
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-primary underline"
            onClick={() => refetchRoles()}
          >
            Try again
          </button>
        </section>
      ) : rolesLoading ? (
        <section className="rounded-2xl border border-border bg-card p-6 text-secondary shadow-sm">
          Checking your permissions…
        </section>
      ) : !hasReportingRead ? (
        <section className="rounded-2xl border border-border bg-card p-6 text-secondary shadow-sm">
          You don&apos;t have permission to view reports yet. Reach out to an
          administrator if you believe this is an error.
        </section>
      ) : (
        <>
          {isReportsAdmin ? (
            <section className="relative sm:static">
              <div
                id="report-status-carousel"
                ref={statusCarouselRef}
                className="flex gap-4 overflow-x-auto px-4 pb-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none"
              >
                {statusSummary.map((summary) => (
                  <article
                    key={summary.status}
                    className="w-full min-w-full shrink-0 snap-center rounded-2xl border border-border bg-card px-4 py-4 shadow-sm sm:min-w-0 sm:snap-none"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-secondary/70">
                      {summary.status}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-secondary">
                      {summary.count}
                    </p>
                  </article>
                ))}
              </div>
              {statusSummary.length > 1 ? (
                <div className="mt-3 flex items-center justify-center gap-2 sm:hidden">
                  {statusSummary.map((summary, index) => (
                    <span
                      key={`${summary.status}-indicator`}
                      aria-hidden="true"
                      className={cn(
                        "h-1 rounded-full transition-all",
                        index === carouselState.index
                          ? "w-8 bg-primary"
                          : "w-4 bg-border",
                      )}
                    />
                  ))}
                  <span className="sr-only">
                    Viewing summary {carouselState.index + 1} of{" "}
                    {statusSummary.length}
                  </span>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-secondary/70">
                Showing {tableItems.length}{" "}
                {tableItems.length === 1 ? "report" : "reports"}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-primary transition hover:border-primary hover:bg-primary hover:text-background"
                    aria-label="Change report sort order"
                  >
                    <SortIcon
                      className="h-4 w-4 rotate-90"
                      aria-hidden="true"
                    />
                    <span>{activeSortLabel}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-xl border border-border bg-card p-2 text-secondary shadow-xl"
                >
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                        sortOption === option.id
                          ? "text-primary"
                          : "text-secondary hover:text-primary",
                      )}
                      onSelect={(event) => {
                        event.preventDefault();
                        setSortOption(option.id);
                      }}
                    >
                      {sortOption === option.id ? (
                        <icons.done
                          className="h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>{option.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {hasError ? (
              <div className="mb-4 rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
                Failed to load reports.{" "}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => reportsQuery.refetch()}
                >
                  Try again
                </button>
              </div>
            ) : null}

            {isLoading ? (
              <p className="text-sm text-secondary">Loading reports…</p>
            ) : (
              <>
                <ReportsTable items={tableItems} isAdmin={isReportsAdmin} />
                {tableItems.length === 0 ? (
                  <p className="mt-4 text-sm text-secondary">
                    No reports match your filters yet.
                  </p>
                ) : null}
              </>
            )}
          </section>
        </>
      )}
    </TitleShell>
  );
}
