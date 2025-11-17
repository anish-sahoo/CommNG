import type { CollapsibleCardProps } from "@/components/expanding-card";
import CollapsibleCard from "@/components/expanding-card";
import { TitleShell } from "@/components/layouts/title-shell";
import LinkedCard from "@/components/linked-card";

// MentorshipDashboard placeholder lives at the URL mentees/mentors will eventually use once matching flows are implemented.
export default function MentorshipDashboard() {
  // Populate mentor information if this user has an active mentor
  const mentorInformation: CollapsibleCardProps = {
    name: "",
    rank: "",
    job: "",
    location: "",
    information: "",
    contact: "",
  };

  // Populate mentee information if this user has an active mentee
  const menteeInformation: CollapsibleCardProps = {
    name: "",
    rank: "",
    job: "",
    location: "",
    information: "",
    contact: "",
  };

  // Mentorship resources
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
          <div className="mb-10">
            <h1 className="text-2xl text-header font-semibold mb-5">
              Your Mentor
            </h1>
            <CollapsibleCard {...mentorInformation}></CollapsibleCard>
          </div>
          <div>
            <h1 className="text-2xl text-header font-semibold mb-5">
              Your Mentee
            </h1>
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
