"use client";

import Link from "next/link";
import type { CollapsibleCardProps } from "@/components/expanding-card";
import CollapsibleCard from "@/components/expanding-card";
import { TitleShell } from "@/components/layouts/title-shell";
import LinkedCard from "@/components/linked-card";
import ListView, {
  type MenteeListViewItem,
  type MentorListViewItem,
} from "@/components/list-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// MentorshipDashboard placeholder lives at the URL mentees/mentors will eventually use once matching flows are implemented.
export default function MentorshipDashboard() {
  // Your Mentor section
  const mentorInformation: CollapsibleCardProps = {
    name: "Catherine Murray",
    rank: "E-7",
    job: "Director of HR",
    location: "Boston, MA",
    information: "",
    contact: "",
  };

  const suggestedMentors: MentorListViewItem[] = [
    {
      id: "catherine",
      name: "Catherine Murray",
      rank: "E-7",
      role: "Director of Human Resources",
      personalInterests: ["Reading", "Hiking", "Traveling"],
      meetingFormat: "Virtual",
      expectedCommitment: 3,
    },
    {
      id: "larry",
      name: "Larry Keefe",
      rank: "O-8",
      role: "Adjutant General",
      careerAdvice:
        "Focus on building strong relationships and continuously developing your skills.",
      meetingFormat: "In-Person",
      expectedCommitment: 4,
    },
  ];

  const renderMentorModalContent = (mentor: MentorListViewItem) => {
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

  // Your Mentee section
  const menteeRequests: MenteeListViewItem[] = [
    {
      id: "seth",
      name: "Seth Rivera",
      rank: "E-4",
      role: "Communications Specialist",
      importantRoleModel: "My older brother who served in the Navy.",
      meetingFormat: "Virtual",
      expectedCommitment: 2,
    },
    {
      id: "maya",
      name: "Maya Chen",
      rank: "E-2",
      role: "Medical Technician",
      personalInterests: ["Photography", "Traveling"],
      meetingFormat: "In-Person",
      expectedCommitment: 2,
    },
  ];

  const renderMenteeModalContent = (mentee: MenteeListViewItem) => {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-secondary/70">
            Meeting Format
          </p>
          <p className="font-semibold">{mentee.meetingFormat}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-secondary/70">
            Expected Commitment
          </p>
          <p className="font-semibold">
            {mentee.expectedCommitment} hours/month
          </p>
        </div>
        {mentee.personalInterests && mentee.personalInterests.length > 0 && (
          <div>
            <p className="text-sm font-medium text-secondary/70">
              Personal Interests
            </p>
            <p className="font-semibold">
              {mentee.personalInterests.join(", ")}
            </p>
          </div>
        )}
        {mentee.importantRoleModel && (
          <div>
            <p className="text-sm font-medium text-secondary/70">
              Important Role Model
            </p>
            <p className="font-semibold">{mentee.importantRoleModel}</p>
          </div>
        )}
      </div>
    );
  };

  const menteeInformation: CollapsibleCardProps = {
    name: "Brandon Johnson",
    rank: "E-1",
    job: "Doordash Driver",
    location: "Hadley, MA",
    information:
      "I’m eager to learn from those who’ve walked the path before me, so I can grow faster and avoid mistakes along the way.",
    contact: "617-222-3333",
  };

  // Resources section
  type MentorshipResource = {
    title: string;
    author: string;
    link: string;
  };

  const mentorshipResources: MentorshipResource[] = [
    {
      title: "How To Be An Effective Mentor In The Workplace",
      author: "Nonprofit Leadership Center",
      link: "https://nlctb.org/tips/how-to-be-an-effective-mentor-in-the-workplace/?gad_source=1&gad_campaignid=22040389112&gbraid=0AAAAADqZMoQyGygempDuZQ3t6e06EqA1I#gad_source_1",
    },
    {
      title: "How To Be A Great Mentor",
      author: "Carla Harris",
      link: "https://www.youtube.com/watch?v=F_n4vT1giwU",
    },
    {
      title: "How To Ask Someone To Be Your Mentor",
      author: "Heidi Holmes, Mentorloop",
      link: "https://mentorloop.com/blog/ask-someone-to-be-your-mentor/#elementor-toc__heading-anchor-5",
    },
    {
      title: "How To Find A Mentor And Grow Toward Your Goals",
      author: "Coursera",
      link: "https://www.coursera.org/articles/how-to-find-a-mentor",
    },
    {
      title:
        "Mentoring for the First Time? 14 Tips to Start off on the Right Foot",
      author: "Forbes",
      link: "https://www.forbes.com/councils/forbescoachescouncil/2020/03/24/mentoring-for-the-first-time-14-tips-to-start-off-on-the-right-foot/",
    },
  ];

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
      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col">
          {/* Mentor information section */}
          <div className="mb-10">
            <h1 className="text-2xl text-header font-semibold mb-5">
              Your Mentor
            </h1>

            {/* User hasn't completed mentee application. */}
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

            {/* User hasn't been matched with a mentor. */}
            <ListView
              title="Pending Requests"
              items={menteeRequests}
              modalContent={renderMenteeModalContent}
            />

            {/* User has been matched with a mentor. */}
            <CollapsibleCard {...mentorInformation}></CollapsibleCard>
          </div>

          {/* Mentee information section */}
          <div>
            <h1 className="text-2xl text-header font-semibold mb-5">
              Your Mentee
            </h1>

            {/* User hasn't completed mentor application. */}
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

            {/* User hasn't been matched with a mentor. */}
            <ListView
              title="Suggested Mentors"
              items={suggestedMentors}
              modalContent={renderMentorModalContent}
            />

            {/* User has been matched with a mentee. */}
            <CollapsibleCard {...menteeInformation}></CollapsibleCard>
          </div>
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
