\"use client\";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc";

// MentorshipDashboard shows a basic view of the user's mentorship state using real backend data.
export default function MentorshipDashboard() {
  const trpc = useTRPC();
  const { data, isLoading, isError, error } =
    trpc.mentors.getMentorshipData.useQuery();

  const hasMentorProfile = Boolean(data?.mentor);
  const hasMenteeProfile = Boolean(data?.mentee);

  const acceptedMatchesCount = useMemo(
    () => data?.matches.filter((m) => m.status === "accepted").length ?? 0,
    [data],
  );

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
          Your Mentorship
        </h1>
        <p className="text-secondary">Loading your mentorship information…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
          Your Mentorship
        </h1>
        <div className="rounded-3xl border-3 border-dashed border-red-500 bg-card px-8 py-12 shadow-sm sm:px-12">
          <p className="text-lg text-secondary pb-4 sm:text-xl">
            We couldn&apos;t load your mentorship information.
          </p>
          <p className="text-sm text-red-600 mb-4">
            {error?.message ?? "Please try again later."}
          </p>
          <Link href="/mentorship">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="inline-flex items-center gap-1"
            >
              Back to Mentorship
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
        Your Mentorship
      </h1>
      <div className="rounded-3xl border-3 border-primary bg-card px-8 py-12 shadow-sm sm:px-12 text-left space-y-4">
        <p className="text-lg text-secondary sm:text-xl">
          This page shows a basic summary of your mentorship status using data
          from your mentor/mentee applications.
        </p>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-primary">
            Your Profiles
          </h2>
          <ul className="list-disc list-inside text-sm text-secondary space-y-1">
            <li>
              Mentor profile:{" "}
              <span className="font-semibold">
                {hasMentorProfile ? "Created" : "Not created"}
              </span>
            </li>
            <li>
              Mentee profile:{" "}
              <span className="font-semibold">
                {hasMenteeProfile ? "Created" : "Not created"}
              </span>
            </li>
          </ul>

          <div className="mt-3 flex flex-wrap gap-2">
            {!hasMentorProfile && (
              <Link href="/mentorship/apply/mentor">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center gap-1"
                >
                  Apply to be a Mentor
                </Button>
              </Link>
            )}
            {!hasMenteeProfile && (
              <Link href="/mentorship/apply/mentee">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center gap-1"
                >
                  Apply to be a Mentee
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-primary">Matches</h2>
          <p className="text-sm text-secondary">
            Accepted matches:{" "}
            <span className="font-semibold">{acceptedMatchesCount}</span>
          </p>
        </div>

        <div className="pt-4">
          <Link href="/mentorship">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="inline-flex items-center gap-1"
            >
              Back to Mentorship
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
