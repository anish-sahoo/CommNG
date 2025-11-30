"use client";

type Section = {
  id:
    | "mentorship-apply"
    | "mentorship-dashboard"
    | "mentorship-requests"
    | "mentorship-resources";
  title: string;
  content: React.ReactNode;
};

const mentorshipSections: Section[] = [
  {
    id: "mentorship-apply",
    title: "Apply as a mentor or mentee",
    content: (
      <ol className="list-decimal space-y-2 pl-5 text-sm text-secondary">
        <li>
          From the Mentorship page, choose{" "}
          <span className="font-semibold">Apply to be a Mentor</span> or{" "}
          <span className="font-semibold">Apply to be a Mentee</span>.
        </li>
        <li>
          Complete the onboarding form thoughtfully; plan 20–25 minutes to
          finish it in one sitting.
        </li>
        <li>
          Submit to create your profile. You will be routed to the Mentorship
          dashboard after completion.
        </li>
      </ol>
    ),
  },
  {
    id: "mentorship-dashboard",
    title: "Your dashboard and matches",
    content: (
      <ul className="list-disc space-y-2 pl-5 text-sm text-secondary">
        <li>
          The dashboard reflects your mentor and mentee profiles once submitted.
        </li>
        <li>
          Matches arrive over time; you can view contact info for your mentor or
          mentee to schedule conversations directly.
        </li>
      </ul>
    ),
  },
  {
    id: "mentorship-requests",
    title: "Handling mentee requests (mentors)",
    content: (
      <ul className="list-disc space-y-2 pl-5 text-sm text-secondary">
        <li>
          If you are a mentor, incoming mentee requests will show on your
          dashboard.
        </li>
        <li>Review the request details and choose to accept or decline.</li>
      </ul>
    ),
  },
  {
    id: "mentorship-resources",
    title: "Resources and support",
    content: (
      <ul className="list-disc space-y-2 pl-5 text-sm text-secondary">
        <li>
          Use the linked resources in the sidebar to prep for meetings and guide
          your conversations.
        </li>
        <li>
          Contact details for your mentor/mentee are visible so you can reach
          out and set up sessions.
        </li>
      </ul>
    ),
  },
];

export { mentorshipSections };
export type { Section as MentorshipSection };
