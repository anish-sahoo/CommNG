"use client";

import { useEffect, useState } from "react";
import { SingleSelectButtonGroup } from "@/components/button-single-select";
import { SelectableButton } from "@/components/buttons";
import ChannelCard from "@/components/channel-card";
import ChipSelect from "@/components/chip-select";
import { DragReorderFrame } from "@/components/drag-and-drop";
import type { DropdownMenuItemConfig } from "@/components/dropdown";
import { DropdownButtons } from "@/components/dropdown";
import DropdownSelect from "@/components/dropdown-select";
import CollapsibleCard from "@/components/expanding-card";
import { icons } from "@/components/icons";
import LinkedCard from "@/components/linked-card";
import ListView from "@/components/list-view";
import {
  BroadcastModal,
  CreatePostModal,
  LeaveChannelModal,
  RemoveMemberModal,
} from "@/components/modal";
import { MultiSelect, type MultiSelectOption } from "@/components/multi-select";
import Navigation from "@/components/navigation";
import PostedCard from "@/components/posted-card";
import ProfileCard, { type ProfileCardProps } from "@/components/profile-card";
import Reaction from "@/components/reaction-bubble";
import { AddReaction } from "@/components/reaction-bubble/add-reaction";
import SearchBar from "@/components/search-bar";
import { ReportsTable } from "@/components/table-view";
import { TextInput } from "@/components/text-input";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";

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

const dropdownMenuItems: DropdownMenuItemConfig[] = [
  {
    id: "broadcast",
    icon: "addAlert",
    label: "Broadcast",
    onClick: () => console.log("Broadcast clicked"),
    separator: true,
  },
  {
    id: "channel",
    icon: "message",
    label: "Channel",
    onClick: () => console.log("Channel clicked"),
  },
];

const actionMenuItems: DropdownMenuItemConfig[] = [
  {
    id: "delete",
    icon: "trash",
    label: "Delete",
    onClick: () => console.log("Delete clicked"),
    separator: true,
  },
  {
    id: "comment",
    icon: "message",
    label: "Comment",
    onClick: () => console.log("Comment clicked"),
  },
];

const profileGalleryExamples: ProfileCardProps[] = [
  {
    name: "John Addams",
    rank: "E-3 Private",
    branch: "Army",
    unit: "1st Battalion, 181st Infantry Regiment",
    location: "Worcester, MA",
    interests: ["Firefighter", "Football", "Mentoring", "Frisbee Golf"],
    about:
      "I've been serving in the Massachusetts National Guard for 5 years. By day I work as a firefighter and by weekend I am a proud guard member.",
    contactActions: [
      {
        label: "Signal",
        onClick: () => {
          console.log("Signal copy paste soon");
        },
      },
      {
        label: "Email",
        href: "mailto:john.addams@example.com",
      },
    ],
    headerActions: [
      {
        label: "Edit profile",
        iconName: "edit",
        onClick: () => {
          console.log("Edit profile clicked");
        },
      },
      {
        label: "Profile settings",
        iconName: "settings",
        onClick: () => {
          console.log("Profile settings clicked");
        },
      },
    ],
  },
  {
    name: "Genesis Lee",
    rank: "O-2 Captain",
    branch: "Air National Guard",
    unit: "102nd Intelligence Wing",
    location: "Otis Air National Guard Base, MA",
    interests: ["Cyber Intel", "STEM Mentoring", "Running"],
    about:
      "Serving with the 102nd Intelligence Wing has given me the opportunity to mentor STEM-focused cadets and promote resilient cyber practices.",
    contactActions: [
      {
        label: "Signal",
        onClick: () => {
          console.log("Signal copy paste soon");
        },
      },
      {
        label: "Email",
        href: "mailto:genesis.lee@example.com",
      },
    ],
    headerActions: [
      {
        label: "Edit profile",
        iconName: "edit",
        onClick: () => {
          console.log("Edit profile clicked");
        },
      },
      {
        label: "Share profile",
        iconName: "announce",
        onClick: () => {
          console.log("Share profile clicked");
        },
      },
    ],
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
    if (typeof window !== "undefined") {
      document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    }
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [mobileNavOpen]);

  const [selectedDropdownValue, setSelectedDropdownValue] =
    useState<string>("");
  const [selectedChipOptions, setSelectedChipOptions] = useState<string[]>([]);
  const [selectedQualities, setSelectedQualities] = useState<string[]>([]);

  // Modal states
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [leaveChannelModalOpen, setLeaveChannelModalOpen] = useState(false);
  const [removeMemberModalOpen, setRemoveMemberModalOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

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

  const [files, setFiles] = useState<File[] | undefined>();

  const [selected, setSelected] = useState<string>("");

  const dragOptions = [
    { label: "First Item", value: "1" },
    { label: "Second Item", value: "2" },
    { label: "Third Item", value: "3" },
  ];
  const [order, setOrder] = useState(dragOptions.map((o) => o.value));

  return (
    <>
      <Navigation
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="min-h-screen bg-background px-4 pb-16 pt-20 sm:px-6 lg:pl-[25rem] lg:pr-16 lg:pt-16">
        <div className="mx-auto flex w-full app-content-width flex-col gap-10">
          <div className="flex justify-start lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-transparent px-3 py-2 text-primary
              transition hover:text-primary focus-visible:outline-none"
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
                Search Bar
              </h2>
            </div>
            <SearchBar />
          </section>

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
              channelId={0}
              postId={0}
              name="Brandon Johnson"
              rank="E-1"
              content="Are there any additional resources regarding the mentorship program? I would like to participate 
              and receive a mentor, but I would like more insight on the program prior to applying. Thanks!"
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
                Collapsible Card
              </h2>
            </div>
            <CollapsibleCard
              name="Brandon Johnson"
              rank="E-1"
              job="DoorDash Driver"
              location="Hadley, MA"
              information="I'm eager to learn from those who've walked the path before me, so I can grow faster and avoid mistakes along the way."
              contact="617-222-3333"
            />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Profile Card
              </h2>
            </div>
            <div className="flex flex-col gap-8">
              {profileGalleryExamples.map((profile) => (
                <ProfileCard
                  key={`${profile.name}-${profile.branch}`}
                  {...profile}
                  className="flex-1"
                />
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Member List View...
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
            <div className="flex gap-6">
              <DropdownButtons
                items={dropdownMenuItems}
                align="start"
                triggerContent={
                  <Button variant="outline" className="gap-2">
                    <icons.add className="h-5 w-5" />
                    New
                  </Button>
                }
              />
              <DropdownButtons items={actionMenuItems} />
            </div>
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
              className="border-neutral"
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
              className="border-primary"
              counterColor="text-primary"
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

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                File dropzone
              </h2>
              <p className="text-sm text-secondary/70">
                Component to allow users to upload/drag & drop files. We have to
                manage uploading, but this gives us UI to accept files in the
                first place
              </p>
            </div>
            <Dropzone
              onDrop={(files) => {
                setFiles(files);
              }}
              src={files}
              maxFiles={5}
            >
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Single-select Circular Buttons
              </h2>
              <SingleSelectButtonGroup
                options={[
                  { label: "Beef", value: "beef" },
                  {
                    label: "Chicken",
                    value: "chicken",
                    dropdownOptions: [
                      { label: "Spicy", value: "spicy" },
                      { label: "Mild", value: "mild" },
                    ],
                  },
                  {
                    label: "Vegetarian",
                    value: "vegetarian",
                    dropdownOptions: [
                      { label: "Gluten-Free", value: "gluten-free" },
                      { label: "Other", value: "other" },
                    ],
                  },
                ]}
                value={selected}
                onChange={setSelected}
                onDropdownChange={(parent, child) => console.log(parent, child)}
              />
              <p className="text-sm text-secondary/70" aria-live="polite">
                Selected: {selected ?? "None selected"}
              </p>
            </div>
          </section>

          <section>
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Drag-and-Drop Buttons
              </h2>
            </div>
            <div className="max-w-md mt-4">
              <DragReorderFrame options={dragOptions} onChange={setOrder} />
              <pre className="text-xs text-gray-500 mt-4">
                Current order: {JSON.stringify(order)}
              </pre>
            </div>
          </section>
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Modals
              </h2>
              <p className="text-sm text-secondary/70">
                Modal components for various use cases
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SelectableButton
                text="Broadcast Modal"
                onClick={() => setBroadcastModalOpen(true)}
              />
              <SelectableButton
                text="Create Post Modal"
                onClick={() => setCreatePostModalOpen(true)}
              />
              <SelectableButton
                text="Leave Channel Modal"
                onClick={() => setLeaveChannelModalOpen(true)}
              />
              <SelectableButton
                text="Remove Member Modal"
                onClick={() => setRemoveMemberModalOpen(true)}
              />
            </div>
          </section>

          <BroadcastModal
            open={broadcastModalOpen}
            onOpenChange={setBroadcastModalOpen}
            title="Severe Weather Alert"
            message="All units, please ensure readiness status is updated in JIS by 1800 today. Severe weather response protocols may be activated later this week. Commanders, verify your unit rosters and vehicle readiness before COB."
            onAcknowledge={() => {
              console.log("Acknowledged");
            }}
          />

          <CreatePostModal
            open={createPostModalOpen}
            onOpenChange={setCreatePostModalOpen}
            onPost={async (content) => {
              setIsPosting(true);
              console.log("Posting:", content);
              // Simulate API call
              await new Promise((resolve) => setTimeout(resolve, 1500));
              setIsPosting(false);
            }}
            isPosting={isPosting}
          />

          <LeaveChannelModal
            open={leaveChannelModalOpen}
            onOpenChange={setLeaveChannelModalOpen}
            onLeave={async () => {
              console.log("Leaving channel");
              await new Promise((resolve) => setTimeout(resolve, 500));
            }}
          />

          <RemoveMemberModal
            open={removeMemberModalOpen}
            onOpenChange={setRemoveMemberModalOpen}
            memberName="John Adddams"
            onRemove={async () => {
              console.log("Removing member");
              await new Promise((resolve) => setTimeout(resolve, 500));
            }}
          />
        </div>
      </main>
    </>
  );
};

export default Components;
