"use client";
import { useEffect, useState } from "react";
import { SelectableButton } from "@/components/buttons";
import ChannelCard from "@/components/channel-card";
import ChipSelect from "@/components/chip-select";
import { DropdownButtons } from "@/components/dropdown";
import DropdownSelect from "@/components/dropdown-select";
import { icons } from "@/components/icons";
import LinkedCard from "@/components/linked-card";
import ListView from "@/components/list-view";
import { MultiSelect, type MultiSelectOption } from "@/components/multi-select";
import Navigation from "@/components/navigation";
import PostedCard from "@/components/posted-card";
import Reaction from "@/components/reaction-bubble";
import { AddReaction } from "@/components/reaction-bubble/add-reaction";
import { ReportsTable } from "@/components/table-view";
import { TextInput } from "@/components/text-input";

const mentorQualityOptions: MultiSelectOption[] = [
  {
    value: "strong-communicator",
    label: "Strong communicator",
  },
  {
    value: "encouraging",
    label: "Encouraging and empathetic",
  },
  {
    value: "experienced-leader",
    label: "Experienced leader",
  },
  {
    value: "creative",
    label: "Creative problem-solver",
  },
  {
    value: "honest",
    label: "Honest and authentic",
  },
  {
    value: "motivated",
    label: "Motivated and ambitious",
  },
  {
    value: "open-minded",
    label: "Open-minded and approachable",
  },
];

const Components = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const MenuIcon = icons.menu;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileNavOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const [selectedDropdownValue, setSelectedDropdownValue] = useState("");
  const [selectedChipOptions, setSelectedChipOptions] = useState<string[]>([]);
  const [selectedQualities, setSelectedQualities] = useState<string[]>([]);

  const [demoReactions, setDemoReactions] = useState<
    { emoji: string; count: number; reactedByUser: boolean }[]
  >([{ emoji: "👍", count: 1, reactedByUser: false }]);

  const handleDemoToggle = (emoji: string, active: boolean) => {
    setDemoReactions((previous) =>
      previous
        .map((reaction) => {
          if (reaction.emoji !== emoji) {
            return reaction;
          }

          const nextCount = Math.max(0, reaction.count + (active ? 1 : -1));

          if (nextCount === 0) {
            return null;
          }

          return {
            ...reaction,
            count: nextCount,
            reactedByUser: active,
          };
        })
        .filter(
          (
            reaction,
          ): reaction is {
            emoji: string;
            count: number;
            reactedByUser: boolean;
          } => reaction !== null,
        ),
    );
  };

  const handleDemoAddReaction = (emoji: string) => {
    setDemoReactions((previous) => {
      const existingIndex = previous.findIndex(
        (reaction) => reaction.emoji === emoji,
      );

      if (existingIndex === -1) {
        return [...previous, { emoji, count: 1, reactedByUser: true }];
      }

      return previous.map((reaction, index) =>
        index === existingIndex
          ? {
              ...reaction,
              count: reaction.count + 1,
              reactedByUser: true,
            }
          : reaction,
      );
    });
  };

  const [singleLineText, setSingleLineText] = useState("");
  const [multiLineText, setMultiLineText] = useState("");

  return (
    <>
      <Navigation
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="min-h-screen bg-background px-4 pb-16 pt-20 sm:px-6 lg:pl-[21rem] lg:pr-12 lg:pt-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
          <div className="flex justify-start lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-transparent px-3 py-2 text-primary transition hover:text-primary focus-visible:outline-none"
              aria-label="Open navigation"
            >
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">
              Components Gallery
            </p>
            <h1 className="text-header font-semibold text-secondary">
              Communication UI Patterns
            </h1>
          </header>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Button
              </h2>
            </div>
            <SelectableButton text="Button" />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Dropdown Select
              </h2>
            </div>
            <DropdownSelect
              options={[
                { label: "Always Muted", value: "option1" },
                { label: "All Notifications", value: "option2" },
                { label: "Mute for 1 hour", value: "option3" },
              ]}
              value={selectedDropdownValue}
              onChange={setSelectedDropdownValue}
            />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Linked Card
              </h2>
            </div>
            <LinkedCard
              href="https://example.com"
              content="How to Mentor Effectively: 5 Tips for Success"
            />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Chip Select
              </h2>
            </div>
            <ChipSelect
              options={[
                "Music",
                "Creative arts",
                "Outdoor activities",
                "Gaming and entertainment",
                "Cooking and baking",
                "Volunteering and community involvement",
                "DIY and crafts",
                "Team sports",
                "Personal fitness",
              ]}
              selectedOptions={selectedChipOptions}
              onChange={setSelectedChipOptions}
            />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Posted Card
              </h2>
            </div>
            <PostedCard
              name="Brandon Johnson"
              rank="E-1"
              content="Are there any additional resources regarding the mentorship program? I would like to participate and receive a mentor, but I would like more insight on the program prior to applying. Thanks!"
            />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Reaction Bubble and Add Reaction Button
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {demoReactions.map((reaction) => (
                <Reaction
                  key={reaction.emoji}
                  emoji={reaction.emoji}
                  count={reaction.count}
                  initiallyActive={reaction.reactedByUser}
                  onToggle={(active) =>
                    handleDemoToggle(reaction.emoji, active)
                  }
                />
              ))}
              <AddReaction onSelect={handleDemoAddReaction} />
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Member List View
              </h2>
            </div>
            <ListView />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Dropdown Menu
              </h2>
            </div>
            <DropdownButtons />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Reports Table View
              </h2>
              <p className="text-sm text-secondary/70">
                Standard viewer sees the comments preview and can tap through
                for full details.
              </p>
            </div>
            <ReportsTable />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Reports Table View (Admin)
              </h2>
              <p className="text-sm text-secondary/70">
                Admins see who each report is issued to so they can reassign or
                follow up quickly.
              </p>
            </div>
            <ReportsTable isAdmin />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Channel Card
              </h2>
              <p className="text-sm text-secondary/70">
                Displays an image, icon, title, and supporting text.
              </p>
            </div>
            <ChannelCard
              title="Events"
              description="Central hub for external event opportunities."
              iconName="message"
              href="http://localhost:3000/communications/1"
            />
          </section>

          {/* Add Text Input sections */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Text Input (Single-line)
              </h2>
              <p className="text-sm text-secondary/70">
                Single-line input without character count
              </p>
            </div>
            <TextInput
              value={singleLineText}
              onChange={setSingleLineText}
              placeholder="Enter text..."
              showCharCount={false}
              borderColor="#CDCDCD"
              counterColor="#CDCDCD"
            />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Text Input (Multi-line)
              </h2>
              <p className="text-sm text-secondary/70">
                Multi-line textarea with character limit
              </p>
            </div>
            <TextInput
              value={multiLineText}
              onChange={setMultiLineText}
              placeholder="Enter your message..."
              multiline={true}
              rows={5}
              maxLength={500}
              showCharCount={true}
              borderColor="#283396"
              counterColor="#283396"
            />
          </section>
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Multi Select for Forms
              </h2>
            </div>
            <MultiSelect
              label="What qualities do you look for in a mentor?"
              helperText="Select up to 3"
              name="mentorQualities"
              options={mentorQualityOptions}
              value={selectedQualities}
              onChange={setSelectedQualities}
              maxSelections={3}
            />
          </section>
        </div>
      </main>
    </>
  );
};

export default Components;
