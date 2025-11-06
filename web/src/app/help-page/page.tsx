"use client";

import type { ReactNode } from "react";
import { icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ChannelShell } from "../communications/components";

export default function HelpPage() {
  const MenuIcon = icons.menu;
  const CommunicationsIcon = icons.communications;
  const MoveRightIcon = icons.moveRight;
  const UserIcon = icons.user;
  const AddIcon = icons.add;
  const AnnounceIcon = icons.addAlert;
  const AcknowledgeIcon = icons.done;
  const BellIcon = icons.bell;

  const cueClass =
    "mt-3 inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-2 text-xs text-secondary shadow-sm ring-1 ring-border/60";
  const cueIconClass = "h-4 w-4 text-primary";

  type CueDisplayProps = {
    leadingIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    buttonLabel: string;
    buttonIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
    buttonVariant?: React.ComponentProps<typeof Button>["variant"];
    buttonClassName?: string;
  };

  const CueDisplay = ({
    leadingIcon: LeadingIcon,
    buttonIcon: ButtonIcon,
    buttonLabel,
    buttonVariant = "outline",
    buttonClassName,
  }: CueDisplayProps) => (
    <div className={cueClass}>
      <LeadingIcon className={cueIconClass} aria-hidden="true" />
      <MoveRightIcon className="h-4 w-4 text-accent" aria-hidden="true" />
      <Button
        type="button"
        variant={buttonVariant}
        size="sm"
        className={cn(ButtonIcon ? "gap-2" : "px-4", buttonClassName)}
      >
        {ButtonIcon ? (
          <ButtonIcon className="h-4 w-4" aria-hidden="true" />
        ) : null}
        {buttonLabel}
      </Button>
    </div>
  );

  const onboardingSteps: Array<{
    title: string;
    description: ReactNode;
    cue?: ReactNode;
  }> = [
    {
      title: "Open Communications",
      description: (
        <>
          Use the round app switcher on the left rail and select{" "}
          <span className="font-semibold">Communications</span> to land on the
          channel overview.
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
      title: "Check your profile",
      description: (
        <>
          Select the <span className="font-semibold">Profile</span> shortcut on
          the rail to confirm your name and email appear correctly. Update
          requests can be sent to your administrator.
        </>
      ),
      cue: (
        <CueDisplay
          leadingIcon={UserIcon}
          buttonIcon={UserIcon}
          buttonLabel="Profile"
        />
      ),
    },
    {
      title: "Explore your channels",
      description: (
        <>
          The overview shows cards for every channel you can access. Use the
          search bar in the header to filter by channel name.
        </>
      ),
    },
    {
      title: "Review active broadcasts",
      description: (
        <>
          Click the bell icon in the overview header to see current alerts.
          Broadcasts you have not acknowledged will open automatically in a
          modal—acknowledge them with the{" "}
          <span className="font-semibold">Acknowledge</span> button so the
          system records that you have read them.
        </>
      ),
      cue: (
        <CueDisplay
          leadingIcon={BellIcon}
          buttonIcon={BellIcon}
          buttonLabel="Active Broadcast"
        />
      ),
    },
    {
      title: "Join the conversation",
      description: (
        <>
          Open a channel to read recent posts. If you need permission to
          contribute, contact the channel admin listed for that space.
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
    points: Array<{ id: string; content: ReactNode }>;
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
          content: "View every broadcast sent to your audience.",
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
              review future configuration options as they become available.
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
              Send organization-wide alerts from the{" "}
              <span className="font-semibold">Create Broadcast</span> page.
            </>
          ),
        },
        {
          id: "managers-delete",
          content: (
            <>
              Delete outdated broadcasts from the{" "}
              <span className="font-semibold">Active Broadcast</span> page when
              they are no longer needed.
            </>
          ),
        },
      ],
    },
  ];

  const taskGuides: Array<{
    title: string;
    steps: Array<{ id: string; content: ReactNode }>;
    cue?: ReactNode;
    note?: ReactNode;
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
              <span className="font-semibold">Post</span>. You will return to
              the channel with your update at the top.
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
            "Look for the red indicator on the bell icon in the communications header or watch for the broadcast modal to appear.",
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
              <span className="font-semibold">Active Broadcast</span> link if
              you need to reference instructions again.
            </>
          ),
        },
      ],
      cue: (
        <CueDisplay
          leadingIcon={AcknowledgeIcon}
          buttonIcon={null}
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
              <span className="font-semibold">Active Broadcast</span> and choose{" "}
              <span className="font-semibold">Broadcast</span>.
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
          leadingIcon={AnnounceIcon}
          buttonIcon={AnnounceIcon}
          buttonLabel="Broadcast"
        />
      ),
      note: "Only users with broadcast permissions will see the creation option.",
    },
  ];

  return (
    <Tabs defaultValue="communications" className="w-full">
      <ChannelShell
        title={
          <div className="flex flex-col gap-4">
            <div className="space-y-3">
              <h1 className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
                Help Center
              </h1>
              <p className="max-w-2xl text-body text-secondary">
                Everything you need to get started: learn how to browse
                channels, send messages, apply for mentorship, and make the most
                of your experience.
              </p>
            </div>
            <TabsList className="gap-2 bg-transparent p-0 flex justify-start">
              <TabsTrigger
                value="communications"
                className="data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-secondary"
              >
                Communications
              </TabsTrigger>
              <TabsTrigger
                value="mentorship"
                className="data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-secondary"
              >
                Mentorship
              </TabsTrigger>
            </TabsList>
          </div>
        }
      >
        <TabsContent value="communications" className="mt-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-2">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-secondary">
                  Onboarding for New Users
                </h2>
                <p className="text-sm text-secondary">
                  Follow these steps the first time you sign in so you can start
                  collaborating without missing any updates.
                </p>
                <ol className="list-decimal space-y-4 pl-5 text-sm text-secondary">
                  {onboardingSteps.map((step) => (
                    <li key={step.title} className="space-y-3">
                      <p>
                        <span className="font-semibold text-secondary">
                          {step.title}:
                        </span>{" "}
                        {step.description}
                      </p>
                      {step.cue}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-secondary">
                  Roles and Permissions
                </h2>
                <p className="text-sm text-secondary">
                  Access is managed behind the scenes, but understanding each
                  role helps you know what to expect on screen.
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                  {roleGuides.map((role) => (
                    <article
                      key={role.title}
                      className="space-y-2 rounded-xl border border-border/60 bg-background/60 p-4"
                    >
                      <h3 className="text-base font-semibold text-secondary">
                        {role.title}
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
                        {role.points.map((point) => (
                          <li key={point.id}>{point.content}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-secondary">
                  Key Communications Tasks
                </h2>
                <div className="space-y-5 text-sm text-secondary">
                  {taskGuides.map((task) => (
                    <article
                      key={task.title}
                      className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4"
                    >
                      <h3 className="text-base font-semibold text-secondary">
                        {task.title}
                      </h3>
                      <ol className="list-decimal space-y-2 pl-5">
                        {task.steps.map((step) => (
                          <li key={step.id}>{step.content}</li>
                        ))}
                      </ol>
                      {task.cue}
                      {task.note ? (
                        <p className="text-xs text-secondary italic">
                          {task.note}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="mentorship" className="mt-6">
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h1>mentorship</h1>
          </section>
        </TabsContent>
      </ChannelShell>
    </Tabs>
  );
}
