"use client";

import { icons } from "@/components/icons";
import { CueDisplay } from "../components/cue-display";

type Section = {
  id: string;
  title: string;
  content: React.ReactNode;
};

const AddIcon = icons.add;
const AcknowledgeIcon = icons.done;
const AnnounceIcon = icons.announce;
const BellIcon = icons.bell;
const CommunicationsIcon = icons.communications;
const MenuIcon = icons.menu;

const onboardingSteps: Array<{
  title: string;
  description: React.ReactNode;
  cue?: React.ReactNode;
}> = [
  {
    title: "Open Communications",
    description: (
      <>
        Use the menu in the left rail and select{" "}
        <span className="font-semibold">Communications</span> to reach the
        channel overview and broadcasts.
      </>
    ),
    cue: (
      <CueDisplay
        leadingIcon={MenuIcon}
        buttonIcon={CommunicationsIcon}
        buttonLabel="Communications"
      />
    ),
  },
  {
    title: "Explore your channels",
    description: (
      <>
        Open <span className="font-semibold">My Channels</span> to see spaces
        you are already part of. Use{" "}
        <span className="font-semibold">All Channels</span> to browse and join
        new ones, then search or filter to find what you need. Some channels are
        read-only; request posting permission from the channel admin if you need
        to publish.
      </>
    ),
  },
  {
    title: "Open and read posts",
    description: (
      <>
        Open a channel to see recent updates and attachments. If you need
        posting access, contact the channel admin listed in the channel header.
      </>
    ),
  },
  {
    title: "Share updates",
    description: (
      <>
        Use the <span className="font-semibold">New Post</span> button in a
        channel to publish. Attach files, then post once each upload shows as
        complete.
      </>
    ),
    cue: (
      <CueDisplay
        leadingIcon={AddIcon}
        buttonIcon={AddIcon}
        buttonLabel="New Post"
      />
    ),
  },
];

const roleGuides: Array<{
  title: string;
  points: Array<{ id: string; content: React.ReactNode }>;
}> = [
  {
    title: "All Members",
    points: [
      {
        id: "all-members-browse",
        content: "Browse and search the channels assigned to you.",
      },
      {
        id: "all-members-read",
        content: "Read posts, open attachments, and follow links.",
      },
      {
        id: "all-members-react",
        content: "React to messages with emojis to acknowledge information.",
      },
      {
        id: "all-members-broadcast",
        content:
          "Open broadcasts from the bell icon and acknowledge alerts when prompted.",
      },
    ],
  },
  {
    title: "Channel Contributors",
    points: [
      { id: "contributors-all", content: "All member capabilities." },
      {
        id: "contributors-new-post",
        content: (
          <>
            Use the <span className="font-semibold">New Post</span> button
            inside a channel to publish updates.
          </>
        ),
      },
      {
        id: "contributors-attachments",
        content:
          "Attach up to 10 files per post. Wait for each file to show as uploaded before submitting.",
      },
    ],
  },
  {
    title: "Channel Admins",
    points: [
      { id: "admins-all", content: "All contributor capabilities." },
      {
        id: "admins-permissions",
        content:
          "Coordinate with platform admins to grant or remove posting access for your channel.",
      },
      {
        id: "admins-settings",
        content: (
          <>
            Use <span className="font-semibold">Channel Settings</span> to
            update the channel name, description, and notification defaults.
          </>
        ),
      },
    ],
  },
  {
    title: "Broadcast Managers",
    points: [
      { id: "managers-all", content: "All member capabilities." },
      {
        id: "managers-create",
        content: (
          <>
            Send alerts from <span className="font-semibold">Broadcasts</span>{" "}
            using the <span className="font-semibold">Broadcast</span> option in
            the create menu.
          </>
        ),
      },
      {
        id: "managers-delete",
        content: (
          <>
            Remove outdated alerts from the{" "}
            <span className="font-semibold">Active Broadcast</span> page once
            they expire or are no longer relevant.
          </>
        ),
      },
    ],
  },
];

const taskGuides: Array<{
  title: string;
  steps: Array<{ id: string; content: React.ReactNode }>;
  cue?: React.ReactNode;
  note?: React.ReactNode;
}> = [
  {
    title: "Browse a Channel",
    steps: [
      {
        id: "browse-nav",
        content:
          "Use the left rail to pick a channel or filter the overview with the search bar.",
      },
      {
        id: "browse-scroll",
        content:
          "Scroll through the message list. Click any attachment card to open it in a new tab.",
      },
      {
        id: "browse-react",
        content: (
          <>
            Add an emoji with{" "}
            <span className="font-semibold">Add Reaction</span> to confirm you
            have seen the update.
          </>
        ),
      },
    ],
  },
  {
    title: "Publish a Channel Post",
    steps: [
      {
        id: "publish-start",
        content: (
          <>
            Open the channel and select{" "}
            <span className="font-semibold">New Post</span>.
          </>
        ),
      },
      {
        id: "publish-compose",
        content: (
          <>
            Enter your message. Drag files into the upload area or use{" "}
            <span className="font-semibold">Browse</span> to select up to ten
            attachments.
          </>
        ),
      },
      {
        id: "publish-submit",
        content: (
          <>
            Wait until every file shows as{" "}
            <span className="font-semibold">Uploaded</span>, then choose{" "}
            <span className="font-semibold">Post</span>. You will return to the
            channel with your update at the top.
          </>
        ),
      },
    ],
    cue: (
      <CueDisplay
        leadingIcon={AddIcon}
        buttonIcon={AddIcon}
        buttonLabel="New Post"
      />
    ),
    note: "If you see a permission warning, request posting access from your channel admin.",
  },
  {
    title: "Review Broadcast Alerts",
    steps: [
      {
        id: "alerts-indicator",
        content:
          "When broadcasts are posted, a modal will appear with the relevant title and description.",
      },
      {
        id: "alerts-ack",
        content: (
          <>
            Read the alert details. Select{" "}
            <span className="font-semibold">Acknowledge</span> to dismiss and
            record acknowledgment.
          </>
        ),
      },
      {
        id: "alerts-review",
        content: (
          <>
            Re-open the broadcast list any time from the{" "}
            <span className="font-semibold">Broadcasts</span> bell icon if you
            need to reference instructions again.
          </>
        ),
      },
    ],
    cue: (
      <CueDisplay
        leadingIcon={AcknowledgeIcon}
        buttonLabel="Acknowledge"
        buttonVariant="outline"
      />
    ),
  },
  {
    title: "Send a Broadcast (Managers)",
    steps: [
      {
        id: "broadcast-open",
        content: (
          <>
            From the communications overview, open{" "}
            <span className="font-semibold">Broadcasts</span> or select{" "}
            <span className="font-semibold">Broadcast</span> from the create
            menu if you have permissions.
          </>
        ),
      },
      {
        id: "broadcast-compose",
        content:
          "Select a target group, add a clear subject line, and write the message body. Pick when the alert should expire.",
      },
      {
        id: "broadcast-send",
        content:
          "Submit the broadcast. The system instantly sends it to the selected audience and updates the active list for follow-up or deletion.",
      },
    ],
    cue: (
      <CueDisplay
        leadingIcon={AddIcon}
        buttonIcon={AddIcon}
        buttonLabel="New Broadcast"
      />
    ),
    note: "Only users with broadcast permissions will see the creation option.",
  },
];

const OnboardingContent = () => (
  <>
    <p className="text-sm text-secondary mb-2">
      Follow these steps the first time you sign in so you can start
      collaborating without missing any updates.
    </p>
    <ol className="list-decimal space-y-4 pl-5 text-sm text-secondary break-words">
      {onboardingSteps.map((step) => (
        <li key={step.title} className="space-y-3">
          <p>
            <span className="font-semibold text-secondary">{step.title}:</span>{" "}
            {step.description}
          </p>
          {step.cue}
        </li>
      ))}
    </ol>
  </>
);

const RolesContent = () => (
  <>
    <p className="text-sm text-secondary mb-2">
      Access is managed behind the scenes, but understanding each role helps
      you know what to expect on screen.
    </p>
    <div className="grid gap-4 lg:grid-cols-2 w-full max-w-full">
      {roleGuides.map((role) => (
        <article
          key={role.title}
          className="space-y-2 rounded-xl border border-border/60 bg-background/60 p-4 w-full max-w-full overflow-hidden break-words"
        >
          <h3 className="text-base font-semibold text-secondary">
            {role.title}
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-secondary">
            {role.points.map((point) => (
              <li key={point.id}>{point.content}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  </>
);

const TasksContent = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    {taskGuides.map((task) => (
      <article
        key={task.title}
        className="space-y-3 rounded-xl border border-border/70 bg-background/80 p-4 w-full max-w-full overflow-hidden break-words"
      >
        <h3 className="text-base font-semibold text-secondary">{task.title}</h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-secondary">
          {task.steps.map((step) => (
            <li key={step.id}>{step.content}</li>
          ))}
        </ol>
        {task.cue}
        {task.note ? (
          <p className="text-xs italic text-secondary">{task.note}</p>
        ) : null}
      </article>
    ))}
  </div>
);

const communicationsSections: Section[] = [
  {
    id: "onboarding",
    title: "Onboarding for New Users",
    content: <OnboardingContent />,
  },
  {
    id: "broadcasts",
    title: "Broadcasts",
    content: (
      <div className="space-y-6 text-sm text-secondary">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-secondary">
            View and acknowledge broadcasts
          </h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              When you sign in, any active broadcast opens automatically in a
              modal.
            </li>
            <li>
              Click <span className="font-semibold">Acknowledge</span> to
              dismiss it after reading. The alert stays available in the bell
              while it remains active.
            </li>
            <li>
              Watch the bell in Communications; a red dot means an active
              broadcast is available to review.
            </li>
            <li>
              Open <span className="font-semibold">Broadcasts</span> from the
              bell to re-read any still-active alerts.
            </li>
          </ol>
          <CueDisplay
            leadingIcon={BellIcon}
            buttonIcon={BellIcon}
            buttonLabel="Broadcasts"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-secondary">
            Send a broadcast (managers)
          </h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              From Communications, open{" "}
              <span className="font-semibold">Broadcasts</span>, then select
              the <span className="font-semibold">megaphone</span> action to
              start a new alert.
            </li>
            <li>
              Choose the audience, add a clear subject, write the message body,
              and set an expiration.
            </li>
            <li>
              Send the broadcast. It publishes immediately and appears in the
              active list for follow-up or deletion.
            </li>
          </ol>
          <CueDisplay
            leadingIcon={AnnounceIcon}
            buttonIcon={AnnounceIcon}
            buttonLabel="New Broadcast"
          />
          <p className="text-xs italic text-secondary">
            Only users with broadcast permissions see the creation option.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "roles",
    title: "Roles and Permissions",
    content: <RolesContent />,
  },
  {
    id: "tasks",
    title: "Key Communications Tasks",
    content: <TasksContent />,
  },
];

export { communicationsSections };
export type { Section as CommunicationsSection };
