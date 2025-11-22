import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

type Report = {
  id: string;
  title: string;
  summary: string;
  status: string;
  dateCreated: string;
  comments?: string;
  issuedTo?: string;
};

type ReportsTableProps = {
  items?: Report[];
  isAdmin?: boolean;
};

// mock reports
const fallbackReports: Report[] = [
  {
    id: "cafe",
    title: "More vegetarian options",
    summary:
      "I feel like my cafeteria options are limited. It would be nice to have more vegetarian / vegan options.",
    status: "Assigned",
    dateCreated: "10/13/2025",
    comments: "I forgot to mention the gluten-free options earlier.",
    issuedTo: "Community Services",
  },
  {
    id: "mentorship",
    title: "Haven't been assigned a mentor",
    summary:
      "I've requested a few different mentors but I still haven't received confirmation on who I'm paired with.",
    status: "Resolved",
    dateCreated: "09/28/2025",
    comments: "Appreciate the quick resolution once this was flagged.",
    issuedTo: "Mentorship Office",
  },
  {
    id: "inactive-mentor",
    title: "My mentor hasn't been active lately",
    summary:
      "My mentor hasn't replied to any messages in the last few weeks. I'm not sure if they're still participating.",
    status: "In Progress",
    dateCreated: "10/05/2025",
    comments:
      "Support team reached out to confirm mentor availability - waiting for update.",
    issuedTo: "Support Services",
  },
  {
    id: "group-chat",
    title: "Group chat feature not showing all messages",
    summary:
      "Some messages in our mentorship group chat disappear after refreshing the page.",
    status: "Assigned",
    dateCreated: "10/17/2025",
    comments:
      "Engineering team is investigating message sync issues between sessions.",
    issuedTo: "Engineering",
  },
  {
    id: "feedback-form",
    title: "Feedback form doesn't submit",
    summary:
      "When I try to give end-of-session feedback, the form gets stuck on 'Submitting...' and never completes.",
    status: "Assigned",
    dateCreated: "10/19/2025",
    comments:
      "Seems to affect only Safari users - bug ticket created and assigned.",
    issuedTo: "Product Team",
  },
  {
    id: "profile-update",
    title: "Unable to update my bio or skills section",
    summary:
      "Every time I save changes to my profile, it says 'Update successful' but the information doesn't actually change.",
    status: "Resolved",
    dateCreated: "09/30/2025",
    comments:
      "Issue fixed in version 1.0.6 - please refresh your browser cache.",
    issuedTo: "Platform Operations",
  },
];

export function ReportsTable({
  items = fallbackReports,
  isAdmin = false,
}: ReportsTableProps) {
  const router = useRouter(); // 
  const reports = items;
  const lastColumnLabel = "Issued To";
  const fillerRowKeys = Array.from(
    { length: Math.max(0, 4 - reports.length) },
    (_, index) => `empty-row-${index}`,
  );

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-2xl border border-neutral/30 [&_[data-slot=table-container]]:overflow-x-auto md:[&_[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[720px] md:min-w-full table-auto md:table-fixed [&_td]:px-6 [&_th]:px-6">
          <TableHeader className="bg-primary-dark text-background [&_tr]:border-transparent">
            <TableRow className="bg-transparent">
              <TableHead className="md:w-[50%] rounded-tl-2xl py-3 text-sm font-semibold uppercase tracking-wide text-background">
                Overview
              </TableHead>
              <TableHead className="md:w-[18%] py-3 text-sm font-semibold uppercase tracking-wide text-background">
                Date Created
              </TableHead>
              <TableHead className="md:w-[16%] py-3 text-sm font-semibold uppercase tracking-wide text-text-background">
                Status
              </TableHead>
              {isAdmin ? (
                <TableHead className="md:w-[16%] rounded-tr-2xl py-3 text-sm font-semibold uppercase tracking-wide text-background">
                  {lastColumnLabel}
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-background text-secondary [&_tr]:last:border-b-0">
            {reports.map((report) => (
              <TableRow 
              key={report.id}
              onClick={() => router.push(`/reports/${report.id}/edit`)}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <TableCell className="md:w-[50%] whitespace-normal py-4 align-top">
                  <p className="text-base font-semibold text-secondary">
                    {report.title}
                  </p>
                  <p className="mt-1 text-sm text-secondary font-normal">
                    {report.summary}
                  </p>
                </TableCell>
                <TableCell className="md:w-[18%] py-4 align-top text-sm font-semibold">
                  {new Date(report.dateCreated).toISOString().slice(0, 10)}
                </TableCell>
                <TableCell className="md:w-[16%] py-4 align-top text-sm font-semibold">
                  {report.status}
                </TableCell>
                {isAdmin ? (
                  <TableCell className="md:w-[16%] whitespace-normal py-4 align-top">
                    <div className="pr-8 text-sm font-semibold text-secondary">
                      <span className="block whitespace-normal leading-snug hyphens-auto md:hyphens-auto md:whitespace-pre-wrap md:break-normal">
                        {report.issuedTo ?? "Unassigned"}
                      </span>
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {fillerRowKeys.map((key) => (
              <TableRow key={key} className="h-16">
                <TableCell colSpan={isAdmin ? 4 : 3} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
