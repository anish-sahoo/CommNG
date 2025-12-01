"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { communicationsSections } from "./sections/communications";
import { mentorshipSections } from "./sections/mentorship";
import { reportSections } from "./sections/reports";

type Section = { id: string; title: string; content: React.ReactNode };
const allSections: Section[] = [
  ...communicationsSections,
  ...mentorshipSections,
  ...reportSections,
];

export default function HelpPage() {
  const ArrowRightIcon = icons.arrowRight;
  const ArrowLeftIcon = icons.arrowLeft;

  const tabsOrder = ["communications", "mentorship", "reports"] as const;
  const [activeTab, setActiveTab] =
    useState<(typeof tabsOrder)[number]>("communications");
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const section of allSections) {
        initial[section.id] = true;
      }
      return initial;
    },
  );

  const getTabId = useCallback(
    (value: (typeof tabsOrder)[number]) => `help-tab-${value}`,
    [],
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
        const { offsetLeft, offsetWidth } = trigger as HTMLElement;
        container.scrollTo({
          left: offsetLeft - container.clientWidth / 2 + offsetWidth / 2,
          behavior: "smooth",
        });
      }
    },
    [getTabId],
  );

  useEffect(() => {
    scrollTabIntoView(activeTab);
  }, [activeTab, scrollTabIntoView]);

  const handleSectionToggle = (id: string, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [id]: open }));
  };

  const toggleAllSections = () => {
    setOpenSections((prev) => {
      const shouldOpen = Object.values(prev).every((open) => !open);
      const nextState: Record<string, boolean> = {};
      for (const section of allSections) {
        nextState[section.id] = shouldOpen;
      }
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
        contentClassName="md:pr-0"
        pinnedContent={
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-secondary">
                  Browse help topics
                </h2>
                <p className="text-sm text-secondary/80">
                  Communications, mentorship, and reports guidance in one place.
                </p>
              </div>
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
                <button
                  type="button"
                  aria-label={
                    anySectionOpen
                      ? "Collapse all sections"
                      : "Expand all sections"
                  }
                  className="hidden rounded-full border border-border bg-background px-3 py-2 text-sm text-secondary shadow-sm hover:bg-primary hover:text-background sm:inline-flex"
                  onClick={toggleAllSections}
                >
                  {anySectionOpen ? "Collapse all" : "Expand all"}
                </button>
              </div>
            </div>
          </div>
        }
      >
        <div className="sm:hidden px-1 pb-2">
          <button
            type="button"
            aria-label={
              anySectionOpen ? "Collapse all sections" : "Expand all sections"
            }
            className="w-full rounded-full border border-border bg-background px-3 py-2 text-sm text-secondary shadow-sm hover:border-primary"
            onClick={toggleAllSections}
          >
            {anySectionOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        <TabsContent
          value="communications"
          className="space-y-4 px-2 sm:px-0 w-full max-w-full"
        >
          {communicationsSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-32 w-full min-w-0"
              aria-label={section.title}
            >
              <Collapsible
                open={openSections[section.id] ?? true}
                defaultOpen
                onOpenChange={(open) => handleSectionToggle(section.id, open)}
                className="rounded-xl border border-border/70 bg-background/80 p-4 w-full min-w-0 overflow-hidden"
              >
                <CollapsibleTrigger
                  aria-label={`Toggle ${section.title}`}
                  className="flex w-full items-center gap-3 text-left text-base font-semibold text-secondary"
                >
                  <ArrowRightIcon
                    className={cn(
                      "h-5 w-5 text-secondary transition-transform",
                      openSections[section.id] ? "rotate-90" : "rotate-0",
                    )}
                    aria-hidden="true"
                  />
                  {section.title}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 text-sm text-secondary break-words w-full max-w-full">
                  {section.content}
                </CollapsibleContent>
              </Collapsible>
            </section>
          ))}
        </TabsContent>

        <TabsContent
          value="mentorship"
          className="space-y-6 px-2 sm:px-0 w-full max-w-full"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-secondary">Mentorship</h2>
            <p className="text-sm text-secondary">
              Apply as a mentor or mentee, complete the onboarding form, then
              manage matches and requests from your dashboard.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {mentorshipSections.map((section) => (
              <Collapsible
                key={section.id}
                open={openSections[section.id] ?? true}
                defaultOpen
                onOpenChange={(open) => handleSectionToggle(section.id, open)}
                className="rounded-xl border border-border/60 bg-background/60 p-4 w-full min-w-0 overflow-hidden"
              >
                <CollapsibleTrigger className="flex w-full items-center gap-3 text-left text-base font-semibold text-secondary">
                  <ArrowRightIcon
                    className={cn(
                      "h-5 w-5 text-secondary transition-transform",
                      openSections[section.id] ? "rotate-90" : "rotate-0",
                    )}
                    aria-hidden="true"
                  />
                  {section.title}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 break-words w-full max-w-full">
                  {section.content}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </TabsContent>

        <TabsContent
          value="reports"
          className="space-y-6 px-2 sm:px-0 w-full max-w-full"
        >
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
                  "rounded-xl border border-border/60 bg-background/60 p-4 w-full min-w-0 overflow-hidden",
                  section.id === "reports-admin" ? "lg:col-span-2" : "",
                )}
              >
                <CollapsibleTrigger className="flex w-full items-center gap-3 text-left text-base font-semibold text-secondary">
                  <ArrowRightIcon
                    className={cn(
                      "h-5 w-5 text-secondary transition-transform",
                      openSections[section.id] ? "rotate-90" : "rotate-0",
                    )}
                    aria-hidden="true"
                  />
                  {section.title}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 break-words w-full max-w-full">
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
