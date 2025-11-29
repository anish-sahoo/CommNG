"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function HelpPage() {
  const MenuIcon = icons.menu;
  const CommunicationsIcon = icons.communications;
  const MoveRightIcon = icons.moveRight;
  const AddIcon = icons.add;
  const AcknowledgeIcon = icons.done;
  const AnnounceIcon = icons.announce;
  const BellIcon = icons.bell;
  const ArrowRightIcon = icons.arrowRight;
  const ArrowLeftIcon = icons.arrowLeft;
  const ReportsIcon = icons.reports;
  const SortIcon = icons.sort;
  const SearchIcon = icons.search;
  const tabsOrder = ["communications", "mentorship", "reports"] as const;
  const [activeTab, setActiveTab] =
    useState<(typeof tabsOrder)[number]>("communications");
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);

  const getTabId = useCallback(
    (value: (typeof tabsOrder)[number]) => `help-tab-${value}`,
    []
  );

  const scrollTabIntoView = useCallback(
    (value: (typeof tabsOrder)[number]) => {
      const trigger = document.getElementById(getTabId(value));
      const container = tabsScrollRef.current;
      if (!trigger) return;
      trigger.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      if (container) {
        // Ensure the container itself can scroll if scrollIntoView targets body
        const { offsetLeft, offsetWidth } = trigger as HTMLElement;
        container.scrollTo({
          left: offsetLeft - container.clientWidth / 2 + offsetWidth / 2,
          behavior: "smooth",
        });
      }
    },
    [getTabId]
  );

  useEffect(() => {
    scrollTabIntoView(activeTab);
  }, [activeTab, scrollTabIntoView]);

  const cueClass =
    "mt-2 inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-2 text-xs text-secondary shadow-sm ring-1 ring-border/60";
  const cueIconClass = "h-4 w-4 text-primary";

  type CueDisplayProps = {
    leadingIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    leadingIconClassName?: string;
    buttonLabel: string;
    buttonIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
    buttonIconClassName?: string;
    buttonVariant?: React.ComponentProps<typeof Button>["variant"];
    buttonClassName?: string;
  };

  const CueDisplay = ({
    leadingIcon: LeadingIcon,
    leadingIconClassName,
    buttonIcon: ButtonIcon,
    buttonLabel,
    buttonIconClassName,
    buttonVariant = "outline",
    buttonClassName,
  }: CueDisplayProps) => (
    <div className={cueClass}>
      <LeadingIcon
        className={cn(cueIconClass, leadingIconClassName)}
        aria-hidden="true"
      />
      <MoveRightIcon className="h-4 w-4 text-accent" aria-hidden="true" />
      <Button
        type="button"
        variant={buttonVariant}
        size="sm"
        className={cn(ButtonIcon ? "gap-2" : "px-4", buttonClassName)}
      >
        {ButtonIcon ? (
          <ButtonIcon
            className={cn("h-4 w-4", buttonIconClassName)}
            aria-hidden="true"
          />
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
          new ones, then search or filter to find what you need. Some channels
          are read-only; request posting permission from the channel admin if
          you need to publish.
        </>
      ),
    },
    {
      title: "Open and read posts",
      description: (
        <>
          Open a channel to see recent updates and attachments. If you need
          posting access, contact the channel admin.
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
              using the <span className="font-semibold">Broadcast</span> option
              in the create menu.
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
  ];

  const BroadcastsContent = () => (
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
            Click <span className="font-semibold">Acknowledge</span> to dismiss
            it after reading. The alert stays available in the bell while it
            remains active.
          </li>
          <li>
            Watch the bell in Communications; a red dot means an active
            broadcast is available to review.
          </li>
          <li>
            Open <span className="font-semibold">Broadcasts</span> from the bell
            to re-read any still-active alerts.
          </li>
        </ol>
        <CueDisplay
          leadingIcon={BellIcon}
          buttonIcon={BellIcon}
          buttonLabel="Active Broadcasts"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-secondary">
          Send a broadcast (managers)
        </h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            From Communications, open{" "}
            <span className="font-semibold">Broadcasts</span>, then select the{" "}
            <span className="font-semibold">megaphone</span> action to start a
            new alert.
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
  );

  const OnboardingContent = () => (
    <>
      <p className="text-sm text-secondary mb-2">
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
    </>
  );

  const RolesContent = () => (
    <>
      <p className="text-sm text-secondary mb-2">
        Access is managed behind the scenes, but understanding each role helps
        you know what to expect on screen.
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
    </>
  );

  const TasksContent = () => (
    <div className="space-y-4 text-sm text-secondary">
      {taskGuides.map((task) => (
        <article
          key={task.title}
          className="space-y-2 rounded-xl border border-border/60 bg-background/60 p-4"
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
            <p className="text-xs italic text-secondary">{task.note}</p>
          ) : null}
        </article>
      ))}
    </div>
  );

  const contentSections: Array<{
    id: "onboarding" | "broadcasts" | "roles" | "tasks";
    title: string;
    content: ReactNode;
  }> = [
    {
      id: "onboarding",
      title: "Onboarding for New Users",
      content: <OnboardingContent />,
    },
    {
      id: "broadcasts",
      title: "Broadcasts",
      content: <BroadcastsContent />,
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

  const reportSections: Array<{
    id: "reports-browse" | "reports-submit" | "reports-admin";
    title: string;
    content: ReactNode;
  }> = [
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
              Status chips show <span className="font-semibold">Pending</span>,{" "}
              <span className="font-semibold">Assigned</span>, or{" "}
              <span className="font-semibold">Resolved</span>; admins also see
              the assignee column.
            </li>
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
              Select <span className="font-semibold">New Report</span> from the
              header.
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
            Admins see the status carousel at the top of the page; swipe through
            on mobile to view counts by status.
          </li>
          <li>
            Use the assignee column to track ownership. If you do not see it,
            request <span className="font-semibold">reporting admin</span>{" "}
            access.
          </li>
          <li>
            If someone updates a report elsewhere (like reassigning it), your
            counts and table will refresh the next time you reload the page.
          </li>
        </ul>
      ),
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const initialState: Record<string, boolean> = {};
      for (const section of contentSections) {
        initialState[section.id] = true;
      }
      for (const section of reportSections) {
        initialState[section.id] = true;
      }
      return initialState;
    }
  );

  const handleSectionToggle = (id: string, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [id]: open }));
  };

  const toggleAllSections = () => {
    setOpenSections((prev) => {
      const shouldOpen = Object.values(prev).every((open) => !open);
      const nextState: Record<string, boolean> = {};
      [...contentSections, ...reportSections].forEach((section) => {
        nextState[section.id] = shouldOpen;
      });
      return nextState;
    });
  };

  const anySectionOpen = Object.values(openSections).some(Boolean);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) =>
        setActiveTab(value as (typeof tabsOrder)[number])
      }
      className="w-full"
      aria-label="Help Center categories"
    >
      <TitleShell
        title={
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Help Center
          </span>
        }
        scrollableContent={false}
        contentClassName="md:pr-0"
        pinnedContent={
          <div className="sticky top-[4.25rem] z-20 border-b border-border/70 bg-background/95 px-1 pb-3 pt-2 backdrop-blur sm:top-[4.5rem] sm:px-0">
            <div className="mx-auto flex w-full app-content-width flex-col gap-3">
              <p className="max-w-3xl text-sm text-secondary sm:text-base">
                Everything you need to get started: learn how to browse
                channels, follow broadcasts, apply for mentorship, submit
                reports, and make the most of your experience.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous tab"
                    className="sm:hidden rounded-full border border-border bg-background p-1 text-primary shadow-sm disabled:opacity-50 disabled:shadow-none"
                    disabled={activeTab === tabsOrder[0]}
                    onClick={() => {
                      const currentIndex = tabsOrder.indexOf(activeTab);
                      const prev = tabsOrder[Math.max(currentIndex - 1, 0)];
                      setActiveTab(prev);
                      scrollTabIntoView(prev);
                    }}
                  >
                    <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <div
                    className="relative flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    ref={tabsScrollRef}
                  >
                    <TabsList
                      className="flex min-w-max justify-start gap-2 bg-transparent p-0"
                      aria-label="Content topic tabs"
                    >
                      <TabsTrigger
                        id={getTabId("communications")}
                        value="communications"
                        aria-label="View communications help"
                        className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-secondary"
                      >
                        Communications
                      </TabsTrigger>
                      <TabsTrigger
                        id={getTabId("mentorship")}
                        value="mentorship"
                        aria-label="View mentorship help"
                        className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-secondary"
                      >
                        Mentorship
                      </TabsTrigger>
                      <TabsTrigger
                        id={getTabId("reports")}
                        value="reports"
                        aria-label="View report help"
                        className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-secondary"
                      >
                        Reports
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <button
                    type="button"
                    aria-label="Next tab"
                    className="sm:hidden rounded-full border border-border bg-background p-1 text-primary shadow-sm disabled:opacity-50 disabled:shadow-none"
                    disabled={activeTab === tabsOrder[tabsOrder.length - 1]}
                    onClick={() => {
                      const currentIndex = tabsOrder.indexOf(activeTab);
                      const next =
                        tabsOrder[
                          Math.min(currentIndex + 1, tabsOrder.length - 1)
                        ];
                      setActiveTab(next);
                      scrollTabIntoView(next);
                    }}
                  >
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAllSections}
                  aria-label={
                    anySectionOpen
                      ? "Collapse all sections"
                      : "Expand all sections"
                  }
                  className="w-full text-sm sm:w-auto"
                >
                  {anySectionOpen ? "Collapse all" : "Expand all"}
                </Button>
              </div>
            </div>
          </div>
        }
      >
        <TabsContent value="communications" className="space-y-4">
          {contentSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-32"
              aria-label={section.title}
            >
              <Collapsible
                open={openSections[section.id] ?? true}
                defaultOpen
                onOpenChange={(open) => handleSectionToggle(section.id, open)}
                className="rounded-xl border border-border/70 bg-background/80 p-4"
              >
                <CollapsibleTrigger
                  aria-label={`Toggle ${section.title}`}
                  className="flex w-full items-center gap-3 text-left text-base font-semibold text-secondary"
                >
                  <ArrowRightIcon
                    className={cn(
                      "h-5 w-5 text-secondary transition-transform",
                      openSections[section.id] ? "rotate-90" : "rotate-0"
                    )}
                    aria-hidden="true"
                  />
                  {section.title}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 text-sm text-secondary">
                  {section.content}
                </CollapsibleContent>
              </Collapsible>
            </section>
          ))}
        </TabsContent>

        <TabsContent value="mentorship" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-secondary">Mentorship</h2>
            <p className="text-sm text-secondary">Content coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-secondary">Reports</h2>
            <p className="text-sm text-secondary">
              Submit, search, and review reports using the same controls you see
              on the Reports page.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {reportSections.map((section) => (
              <Collapsible
                key={section.id}
                open={openSections[section.id] ?? true}
                defaultOpen
                onOpenChange={(open) => handleSectionToggle(section.id, open)}
                className={cn(
                  "rounded-xl border border-border/60 bg-background/60 p-4",
                  section.id === "reports-admin" ? "lg:col-span-2" : ""
                )}
              >
                <CollapsibleTrigger className="flex w-full items-center gap-3 text-left text-base font-semibold text-secondary">
                  <ArrowRightIcon
                    className={cn(
                      "h-5 w-5 text-secondary transition-transform",
                      openSections[section.id] ? "rotate-90" : "rotate-0"
                    )}
                    aria-hidden="true"
                  />
                  {section.title}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  {section.content}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </TabsContent>
      </TitleShell>
    </Tabs>
  );
}
