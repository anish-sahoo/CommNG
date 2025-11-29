"use client";

import { useMemo } from "react";
import { icons } from "@/components/icons";
import { CueDisplay } from "../components/cue-display";

const AddIcon = icons.add;
const ReportsIcon = icons.reports;
const SearchIcon = icons.search;
const SortIcon = icons.sort;

type Section = {
  id: "reports-browse" | "reports-submit" | "reports-admin";
  title: string;
  content: React.ReactNode;
};

export function useReportSections() {
  const sections: Section[] = useMemo(
    () => [
      {
        id: "reports-browse",
        title: "Browse and filter",
        content: (
          <>
            <ul className="list-disc space-y-2 pl-5 text-sm text-secondary">
              <li>
                Use the <span className="font-semibold">Search reports</span>{" "}
                field to find titles, descriptions, or assignees.
              </li>
              <li>
                Sort by newest, oldest, or title with the{" "}
                <span className="font-semibold">Sort</span> menu in the upper
                right.
              </li>
              <li>
                Status chips show <span className="font-semibold">Pending</span>
                , <span className="font-semibold">Assigned</span>, or{" "}
                <span className="font-semibold">Resolved</span>; admins also see
                the assignee column.
              </li>
              <li>Click any report row to open and edit your submission directly.</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <CueDisplay
                leadingIcon={SearchIcon}
                buttonIcon={SearchIcon}
                buttonLabel="Search reports"
                buttonVariant="outline"
                buttonClassName="px-3"
              />
              <CueDisplay
                leadingIconClassName="rotate-90"
                leadingIcon={SortIcon}
                buttonIcon={SortIcon}
                buttonIconClassName="rotate-90"
                buttonLabel="Sort"
                buttonVariant="outline"
                buttonClassName="px-3"
              />
            </div>
          </>
        ),
      },
      {
        id: "reports-submit",
        title: "Submit a report",
        content: (
          <>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-secondary">
              <li>
                Select <span className="font-semibold">New Report</span> from
                the header.
              </li>
              <li>
                Choose a category, add a clear title and description, and attach
                files if needed (up to 10).
              </li>
              <li>
                Send the report; it will appear in the list immediately once
                saved.
              </li>
            </ol>
            <CueDisplay
              leadingIcon={ReportsIcon}
              buttonIcon={AddIcon}
              buttonLabel="New Report"
              buttonVariant="outline"
            />
          </>
        ),
      },
      {
        id: "reports-admin",
        title: "Admin & follow-up",
        content: (
          <ul className="list-disc space-y-2 pl-5 text-sm text-secondary">
            <li>
              Admins see the status carousel at the top of the page; swipe
              through on mobile to view counts by status.
            </li>
            <li>
              Use the assignee column to track ownership. If you do not see it,
              request <span className="font-semibold">reporting admin</span>{" "}
              access.
            </li>
            <li>
              Admins can open any report and assign it with the
              <span className="font-semibold"> Assign </span>
              dropdown; updates save immediately.
            </li>
            <li>
              If someone updates a report elsewhere (like reassigning it), your
              counts and table will refresh the next time you reload the page.
            </li>
          </ul>
        ),
      },
    ],
    [],
  );

  return sections;
}

export type { Section as ReportSection };
