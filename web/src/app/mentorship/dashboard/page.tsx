"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { mentorshipResources } from "@/app/mentorship/dashboard/resources";
import type { CollapsibleCardProps } from "@/components/expanding-card";
import CollapsibleCard from "@/components/expanding-card";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import LinkedCard from "@/components/linked-card";
import ListView, {
  type MenteeListViewItem,
  type MentorListViewItem,
} from "@/components/list-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTRPC } from "@/lib/trpc";

type DashboardMentor = {
  userId: string;
  name?: string | null;
  rank?: string | null;
  location?: string | null;
  personalInterests?: string | string[] | null;
  careerAdvice?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  imageFileId?: string | null;
  preferredMeetingFormat?: string | null;
  hoursPerMonthCommitment?: number | null;
  detailedPosition?: string | null;
  positionType?: string | null;
};

type DashboardMentee = {
  userId: string;
  name?: string | null;
  rank?: string | null;
  location?: string | null;
  personalInterests?: string | string[] | null;
  learningGoals?: string | null;
  preferredMeetingFormat?: string | null;
  hoursPerMonthCommitment?: number | null;
  hopeToGainResponses?: string[] | null;
  roleModelInspiration?: string | null;
  detailedPosition?: string | null;
  positionType?: string | null;
};

type MentorRecommendation = {
  mentor: DashboardMentor;
  status: "active" | "pending" | "suggested";
};

type PendingMentorshipRequest = {
  matchId: number;
  mentee: DashboardMentee;
};

// MentorshipDashboard shows a view of the user's mentorship status using real backend data.
export default function MentorshipDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery(
    trpc.mentorship.getMentorshipData.queryOptions(),
  );

  const hasMentorProfile = Boolean(data?.mentor?.profile);
  const hasMenteeProfile = Boolean(data?.mentee?.profile);

  const mentorshipQueryKey = trpc.mentorship.getMentorshipData.queryKey();

  const handleSendRequest = useMutation(
    trpc.mentorship.requestMentorship.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mentorshipQueryKey });
      },
    }),
  );

  const acceptRequest = useMutation(
    trpc.mentorship.acceptMentorshipRequest.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mentorshipQueryKey });
      },
    }),
  );

  const rejectRequest = useMutation(
    trpc.mentorship.declineMentorshipRequest.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mentorshipQueryKey });
      },
    }),
  );

  const renderYourMentor = () => {
    if (isLoading) {
      return (
        <div>
          <Card className="flex flex-col items-center">
            <div className="font-medium italic text-center px-6 py-4">
              Loading...
            </div>
          </Card>
        </div>
      );
    }

    if (isError) {
      return (
        <div>
          <Card className="flex flex-col items-center">
            <div className="rounded-3xl border-3 border-dashed border-red-500 bg-card px-8 py-12 shadow-sm sm:px-12">
              <p className="text-lg text-secondary pb-4 sm:text-xl">
                We couldn&apos;t load your mentor information. Try again later.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    if (!hasMenteeProfile) {
      return (
        <Card className="flex flex-col items-center">
          <div className="font-medium italic">
            You have not applied to be a mentee.
          </div>
          <Link href={"/mentorship/apply/mentee"}>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="inline-flex items-center gap-1"
            >
              <span>Apply to be a</span>
              <span className="font-semibold">Mentee</span>
            </Button>
          </Link>
        </Card>
      );
    }

    const activeMentors = data?.mentee?.activeMentors ?? [];
    const mentorRecommendations = data?.mentee?.mentorRecommendations ?? [];

    const matchedMentors: CollapsibleCardProps[] = activeMentors.map(
      (item: DashboardMentor) => ({
        name: item.name ?? "Unknown mentor",
        rank: item.rank ?? "Unknown rank",
        location: item.location ?? "Not provided",
        personalInterests: Array.isArray(item.personalInterests)
          ? item.personalInterests.join(", ")
          : (item.personalInterests ?? ""),
        information: item.careerAdvice || "",
        email: item.email ?? "Not provided",
        phone: item.phoneNumber ?? "Not provided",
        avatarSrc: item.imageFileId || "",
      }),
    );

    const suggestedMentors: MentorListViewItem[] = mentorRecommendations
      .filter((item: MentorRecommendation) => item.status !== "active")
      .map((item: MentorRecommendation) => {
        const personalInterests = Array.isArray(item.mentor.personalInterests)
          ? item.mentor.personalInterests
          : item.mentor.personalInterests
            ? item.mentor.personalInterests
                .split(",")
                .map((interest: string) => interest.trim())
                .filter(Boolean)
            : [];

        return {
          id: item.mentor.userId,
          name: item.mentor.name ?? "Unknown mentor",
          rank: item.mentor.rank ?? undefined,
          role: item.mentor.detailedPosition ?? item.mentor.positionType,
          personalInterests,
          careerAdvice: item.mentor.careerAdvice || "",
          meetingFormat:
            item.mentor.preferredMeetingFormat || "No preference listed",
          expectedCommitment: item.mentor.hoursPerMonthCommitment || 0,
          hasRequested: item.status === "pending",
        };
      })
      // Ensure uniqueness by mentor id to avoid duplicate keys in the list view
      .reduce((acc: MentorListViewItem[], mentor) => {
        if (!acc.some((existing) => existing.id === mentor.id)) {
          acc.push(mentor);
        }
        return acc;
      }, []);

    const renderSuggestedMentorRowOptions = (
      mentorInformation: MentorListViewItem,
    ) => {
      const requested = mentorInformation.hasRequested;
      return (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={`inline-flex items-center gap-1 disabled:opacity-100 ${
            requested
              ? "bg-primary text-white border-primary cursor-not-allowed hover:bg-primary"
              : ""
          }`}
          disabled={requested}
          onClick={() =>
            handleSendRequest.mutate({
              mentorUserId: mentorInformation.id,
            })
          }
        >
          {requested ? "Requested" : "Send Request"}
        </Button>
      );
    };

    const renderSuggestedMentorModal = (mentor: MentorListViewItem) => {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-secondary/70">
              Meeting Format
            </p>
            <p className="font-semibold">{mentor.meetingFormat}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary/70">
              Expected Commitment
            </p>
            <p className="font-semibold">
              {mentor.expectedCommitment
                ? `${mentor.expectedCommitment} hours/month`
                : "Not specified"}
            </p>
          </div>
          {mentor.personalInterests && mentor.personalInterests.length > 0 && (
            <div>
              <p className="text-sm font-medium text-secondary/70">
                Personal Interests
              </p>
              <p className="font-semibold">
                {mentor.personalInterests.join(", ")}
              </p>
            </div>
          )}
          {mentor.careerAdvice && (
            <div>
              <p className="text-sm font-medium text-secondary/70">
                Career Advice
              </p>
              <p className="font-semibold">{mentor.careerAdvice}</p>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-4">
        {matchedMentors.length > 0 && (
          <div className="flex flex-col gap-4">
            {matchedMentors.map((mentor: CollapsibleCardProps) => (
              <CollapsibleCard key={mentor.name} {...mentor} />
            ))}
          </div>
        )}
        {suggestedMentors.length > 0 ? (
          <ListView
            title="Suggested Mentors"
            items={suggestedMentors}
            rowOptions={renderSuggestedMentorRowOptions}
            modalContent={renderSuggestedMentorModal}
          />
        ) : (
          <Card className="flex flex-col items-center">
            <div className="font-medium italic text-center px-6 py-4">
              No mentor suggestions available at this time.
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderYourMentee = () => {
    if (isLoading) {
      return (
        <div>
          <Card className="flex flex-col items-center">
            <div className="font-medium italic text-center px-6 py-4">
              Loading...
            </div>
          </Card>
        </div>
      );
    }

    if (isError) {
      return (
        <div>
          <Card className="flex flex-col items-center">
            <div className="rounded-3xl border-3 border-dashed border-red-500 bg-card px-8 py-12 shadow-sm sm:px-12">
              <p className="text-lg text-secondary pb-4 sm:text-xl">
                We couldn&apos;t load your mentee information. Try again later.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    if (!hasMentorProfile) {
      return (
        <div>
          <Card className="flex flex-col items-center">
            <div className="font-medium italic">
              You have not applied to be a mentor.
            </div>
            <Link href={"/mentorship/apply/mentor"}>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="inline-flex items-center gap-1"
              >
                <span>Apply to be a</span>
                <span className="font-semibold">Mentor</span>
              </Button>
            </Link>
          </Card>
        </div>
      );
    }

    const AcceptIcon = icons.done;
    const RejectIcon = icons.clear;

    const pendingRequests: MenteeListViewItem[] =
      data?.mentor?.pendingRequests?.map((item: PendingMentorshipRequest) => {
        const personalInterests = Array.isArray(item.mentee.personalInterests)
          ? item.mentee.personalInterests
          : item.mentee.personalInterests
            ? item.mentee.personalInterests
                .split(",")
                .map((interest: string) => interest.trim())
                .filter(Boolean)
            : [];

        return {
          id: item.mentee.userId,
          name: item.mentee.name ?? "Unknown mentee",
          rank: item.mentee.rank,
          role: item.mentee.detailedPosition ?? item.mentee.positionType,
          learningGoals: item.mentee.learningGoals ?? undefined,
          personalInterests,
          hopeToGainResponses: item.mentee.hopeToGainResponses ?? undefined,
          roleModelInspiration: item.mentee.roleModelInspiration ?? undefined,
          preferredMeetingFormat:
            item.mentee.preferredMeetingFormat ?? undefined,
          hoursPerMonthCommitment:
            item.mentee.hoursPerMonthCommitment ?? undefined,
          matchId: item.matchId,
        };
      }) ?? [];

    const renderMenteeRequestModal = (mentee: MenteeListViewItem) => {
      const personalInterests = Array.isArray(mentee.personalInterests)
        ? mentee.personalInterests.join(", ")
        : mentee.personalInterests;

      return (
        <div className="space-y-4">
          {mentee.preferredMeetingFormat && (
            <div>
              <p className="text-sm font-medium text-secondary/70">
                What is your preferred meeting format?
              </p>
              <p className="font-semibold">{mentee.preferredMeetingFormat}</p>
            </div>
          )}
          {mentee.hoursPerMonthCommitment && (
            <div>
              <p className="text-sm font-medium text-secondary/70">
                What is your expected commitment?
              </p>
              <p className="font-semibold">
                {mentee.hoursPerMonthCommitment} hours/month
              </p>
            </div>
          )}
          {mentee.personalInterests && (
            <div>
              <p className="text-sm font-medium text-secondary/70">
                What are your personal interests?
              </p>
              <p className="font-semibold">{personalInterests}</p>
            </div>
          )}
          {mentee.roleModelInspiration && (
            <div>
              <p className="text-sm font-medium text-secondary/70">
                Who is a role model or inspiration for you?
              </p>
              <p className="font-semibold">{mentee.roleModelInspiration}</p>
            </div>
          )}
          {mentee.hopeToGainResponses &&
            mentee.hopeToGainResponses.length > 0 && (
              <div>
                <p className="text-sm font-medium text-secondary/70">
                  What do you hope to gain from the mentorship program?
                </p>
                <p className="font-semibold">{mentee.hopeToGainResponses}</p>
              </div>
            )}
        </div>
      );
    };

    const renderMenteeRequestRowOptions = (matchId: number) => {
      return (
        <div className="flex items-center gap-2">
          {/* TODO: check integration */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-primary hover:bg-primary group"
            onClick={() => acceptRequest.mutate({ matchId })}
          >
            <AcceptIcon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
          </Button>
          {/* TODO: check integration */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-accent"
            onClick={() => rejectRequest.mutate({ matchId })}
          >
            <RejectIcon className="h-5 w-5 text-accent" />
          </Button>
        </div>
      );
    };

    const matchedMentees: CollapsibleCardProps[] =
      data?.mentor?.activeMentees?.map((item: DashboardMentee) => ({
        name: item.name,
        rank: item.rank ?? "Unknown rank",
        location: item.location ?? "Not provided",
        personalInterests: Array.isArray(item.personalInterests)
          ? item.personalInterests.join(", ")
          : (item.personalInterests ?? ""),
        information: item.learningGoals || "",
        email: item.email ?? "Not provided",
        phone: item.phoneNumber ?? "Not provided",
      })) ?? [];

    if (!pendingRequests.length && !matchedMentees.length) {
      return (
        <Card className="flex flex-col items-center">
          <div className="font-medium italic">
            No mentee requests available at this time.
          </div>
        </Card>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {pendingRequests.length > 0 && (
          <ListView
            title="Pending Requests"
            items={pendingRequests}
            modalContent={renderMenteeRequestModal}
            rowOptions={(request) =>
              renderMenteeRequestRowOptions(request.matchId)
            }
          />
        )}

        {matchedMentees.length > 0 && (
          <div className="flex flex-col gap-4">
            {matchedMentees.map((mentee: CollapsibleCardProps) => (
              <CollapsibleCard key={mentee.name} {...mentee} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <TitleShell
      title={
        <div className="flex flex-col gap-2">
          <h1 className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Mentorship Dashboard
          </h1>
        </div>
      }
      scrollableContent={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col">
          <div className="mb-10">
            <h1 className="text-2xl text-header font-semibold mb-5">
              Your Mentor
            </h1>
            {renderYourMentor()}
          </div>
          <h1 className="text-2xl text-header font-semibold mb-5">
            Your Mentee
          </h1>
          {renderYourMentee()}
        </div>
        <div className="flex flex-col">
          <div className="text-2xl text-header font-semibold mb-5">
            Resources
          </div>
          <div className="flex flex-col gap-3">
            {mentorshipResources.map((resource) => (
              <LinkedCard href={resource.link} key={resource.link}>
                <div>
                  <h1>{resource.title}</h1>
                  <h2 className="font-medium italic">{resource.author}</h2>
                </div>
              </LinkedCard>
            ))}
          </div>
        </div>
      </div>
    </TitleShell>
  );
}
