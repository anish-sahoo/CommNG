"use client";

import { useQuery } from "@tanstack/react-query";
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

// MentorshipDashboard shows a basic view of the user's mentorship state using real backend data.
export default function MentorshipDashboard() {
  const trpc = useTRPC();
  const { data, isLoading, isError, error } = useQuery(
    trpc.mentorship.getMentorshipData.queryOptions(),
  );

  const hasMentorProfile = Boolean(data?.mentor?.profile);
  const hasMenteeProfile = Boolean(data?.mentee?.profile);

  const renderYourMentor = () => {
    // Loading state
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

    // Error state
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

    // User hasn't completed mentee application
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

    // User has active mentors
    if (data?.mentee?.activeMentors && data.mentee.activeMentors.length > 0) {
      const matchedMentors: CollapsibleCardProps[] =
        data.mentee.activeMentors.map((item: any) => ({
          name: item.name,
          rank: item.rank,
          location: item.location,
          personalInterests: item.mentor.personalInterests || "",
          information: item.mentor.hopeToGainResponses || "",
          email: item.email,
          phone: item.phone,
        }));

      return (
        <div className="flex flex-col gap-4">
          {matchedMentors.map((mentor: CollapsibleCardProps) => (
            <CollapsibleCard key={mentor.name} {...mentor} />
          ))}
        </div>
      );
    }

    // User doesn't have mentor recommendations yet
    if (data?.mentee?.activeMentors && data.mentee.activeMentors.length === 0) {
      return (
        <Card className="flex flex-col items-center">
          <div className="font-medium italic">
            No mentor suggestions available at this time.
          </div>
        </Card>
      );
    }

    // User has mentor recommendations
    if (
      data?.mentee?.mentorRecommendations &&
      data.mentee.mentorRecommendations.length > 0
    ) {
      const suggestedMentors: MentorListViewItem[] =
        data?.mentee?.mentorRecommendations.map((item: any) => ({
          id: item.mentor.userId,
          name: item.mentor.name,
          rank: item.mentor.rank,
          personalInterests: item.mentor.personalInterests || "",
          whyInterested: item.mentor.whyInterested || "",
          careerAdvice: item.mentor.careerAdvice || "",
          meetingFormat: item.preferredMeetingFormat || "",
          expectedCommitment: item.hoursPerMonthCommitment || "",
          hasRequested: item.hasRequested,
        }));

      const renderSuggestedMentorRowOptions = (
        _mentorInformation: MentorListViewItem,
      ) => {
        const requested = true;
        return (
          // TODO: Implement send request functionality
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
                {mentor.expectedCommitment} hours/month
              </p>
            </div>
            {mentor.personalInterests &&
              mentor.personalInterests.length > 0 && (
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
        <ListView
          title="Suggested Mentors"
          items={suggestedMentors}
          rowOptions={renderSuggestedMentorRowOptions}
          modalContent={renderSuggestedMentorModal}
        />
      );
    }
  };

  const renderYourMentee = () => {
    // Loading state
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

    // Error state
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

    // User hasn't completed mentor application
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

    // User doesn't have mentee requests yet
    if (data?.mentor?.activeMentees && data.mentor.activeMentees.length === 0) {
      return (
        <Card className="flex flex-col items-center">
          <div className="font-medium italic">
            No mentee requests available at this time.
          </div>
        </Card>
      );
    }

    // User has mentee requests
    const AcceptIcon = icons.done;
    const RejectIcon = icons.clear;

    const pendingRequests: MenteeListViewItem[] = data?.mentor?.activeMentees
      ? data?.mentor?.activeMentees
          .filter((mentee: any) => mentee.status === "pending")
          .map((item: any) => ({
            id: item.userId,
            name: item.name,
            rank: item.rank,
            learningGoals: item.learningGoals,
            personalInterests: item.personalInterests,
            roleModelInspiration: item.roleModelInspiration,
            preferredMeetingFormat: item.preferredMeetingFormat,
            hoursPerMonthCommitment: item.hoursPerMonthCommitment,
          }))
      : [];

    const renderMenteeRequestModal = (mentee: MenteeListViewItem) => {
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
              <p className="font-semibold">{mentee.personalInterests}</p>
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

    const renderMenteeRequestRowOptions = () => {
      return (
        <div className="flex items-center gap-2">
          {/* TODO: connect with BE matching service */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-primary hover:bg-primary group"
          >
            <AcceptIcon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
          </Button>
          {/* TODO: connect with BE matching service */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-accent"
          >
            <RejectIcon className="h-5 w-5 text-accent" />
          </Button>
        </div>
      );
    };

    if (pendingRequests && pendingRequests.length > 0) {
      <ListView
        title="Pending Requests"
        items={pendingRequests}
        modalContent={renderMenteeRequestModal}
        rowOptions={renderMenteeRequestRowOptions}
      />;
    }

    // User has active mentees
    if (data?.mentor?.activeMentees && data.mentor.activeMentees.length > 0) {
      const matchedMentees: CollapsibleCardProps[] =
        data.mentor.activeMentees.map((item: any) => ({
          name: item.name,
          rank: item.rank,
          location: item.location,
          personalInterests: item.mentee.personalInterests || "",
          information: item.mentee.goals || "",
          email: item.email,
          phone: item.phone,
        }));

      return (
        <div className="flex flex-col gap-4">
          {matchedMentees.map((mentee: CollapsibleCardProps) => (
            <CollapsibleCard key={mentee.name} {...mentee} />
          ))}
        </div>
      );
    }
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
