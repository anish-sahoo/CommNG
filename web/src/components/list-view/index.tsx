"use client";
import type React from "react";
import { useState } from "react";
import { icons } from "@/components/icons";
import { Modal } from "@/components/modal/index";

export type ListViewItem = {
  id: string;
  name: string;
  rank?: string;
  role?: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
};

export type MenteeListViewItem = ListViewItem & {
  learningGoals?: string;
  experienceLevel?: string;
  preferredMentorType?: string;
  resumeFileId?: string;
  personalInterests?: string[];
  roleModelInspiration?: string;
  hopeToGainResponses?: string[];
  mentorQualities?: string[];
  preferredMeetingFormat?: string;
  hoursPerMonthCommitment?: number;
  matchId: number;
};

export type MentorListViewItem = ListViewItem & {
  hasRequested: boolean;
  personalInterests?: string[];
  careerAdvice?: string;
  meetingFormat: string;
  expectedCommitment: number;
};

// mock data until we get some real users
const fallbackItems: ListViewItem[] = [
  {
    id: "malissa",
    name: "Malissa Zweig",
    rank: "E-5",
    role: "Paralegal Specialist",
    isCurrentUser: true,
  },
  {
    id: "john",
    name: "John Adddams",
    rank: "E-3",
    role: "Firefighter",
  },
  {
    id: "brandon",
    name: "Brandon Johnson",
    rank: "E-1",
    role: "DoorDash Driver",
  },
  {
    id: "catherine",
    name: "Catherine Murray",
    rank: "E-7",
    role: "Director of Human Resources",
  },
  {
    id: "larry",
    name: "Larry Keefe",
    rank: "O-8",
    role: "Adjutant General",
  },
  {
    id: "gary",
    name: "Gary Tomlinson",
    rank: "CWO-4",
    role: "System/IT Admin",
  },
  {
    id: "anna",
    name: "Anna Carpenter",
    rank: "E-6",
    role: "Operations Coordinator",
  },
  {
    id: "darius",
    name: "Darius Fields",
    rank: "E-4",
    role: "Logistics Specialist",
  },
  {
    id: "amanda",
    name: "Amanda Frost",
    rank: "O-3",
    role: "Program Manager",
  },
  {
    id: "roger",
    name: "Roger Thompson",
    rank: "E-7",
    role: "Training Lead",
  },
  {
    id: "maya",
    name: "Maya Chen",
    rank: "E-2",
    role: "Medical Technician",
  },
  {
    id: "veronica",
    name: "Veronica Patel",
    rank: "E-5",
    role: "Community Liaison",
  },
  {
    id: "seth",
    name: "Seth Rivera",
    rank: "E-4",
    role: "Communications Specialist",
  },
  {
    id: "yvette",
    name: "Yvette Morales",
    rank: "O-2",
    role: "Intel Analyst",
  },
];

type ListViewProps<T extends ListViewItem> = {
  title?: string;
  items?: T[];
  className?: string;
  rowOptions?: (item: T) => React.ReactNode;
  modalContent?: (item: T) => React.ReactNode;
  modalFooter?: (item: T, closeModal: () => void) => React.ReactNode;
};

const UserIcon = icons.user;

// default avatar until we get some photos
const Avatar = () => (
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-neutral/40 bg-neutral/10 text-secondary/80">
    <UserIcon className="h-6 w-6" />
  </div>
);

const ListViewRow = <T extends ListViewItem>({
  item,
  onClick,
  rowOptions,
}: {
  item: T;
  onClick: () => void;
  rowOptions?: React.ReactNode;
}) => {
  const subtitle = [item.rank, item.role].filter(Boolean).join(", ");

  return (
    <li className="flex flex-col gap-3 px-4 py-3 hover:bg-neutral/10 transition-colors sm:flex-row sm:items-center sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col items-center gap-2 rounded-md border-0 bg-transparent p-0 text-left text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:gap-3"
      >
        <Avatar />
        <div className="min-w-0 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <p className="break-words text-body font-semibold text-secondary">
              {item.name || "Unknown"}
            </p>
            {item.isCurrentUser ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                You
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="break-words text-sm italic text-secondary/70">
              {subtitle}
            </p>
          ) : null}
        </div>
      </button>
      {rowOptions ? (
        <div className="flex items-center justify-center gap-2 sm:ml-auto">
          {rowOptions}
        </div>
      ) : null}
    </li>
  );
};

export function ListView<T extends ListViewItem = ListViewItem>({
  title,
  items = fallbackItems as T[],
  rowOptions,
  modalContent,
  modalFooter,
}: ListViewProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  if (!items.length) {
    return null;
  }

  return (
    <>
      <section className="relative w-full max-w-full sm:max-w-4xl">
        <div
          className={`rounded-3xl bg-primary-dark ${
            title ? "px-4 py-5" : "px-6 py-7"
          }`}
        >
          <div className="rounded-xl" />
          {title ? (
            <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
          ) : null}
          <div className="flex flex-col gap-6 rounded-2xl bg-background px-4 py-6">
            <div className="relative overflow-hidden rounded-xl bg-background">
              <ul className="max-h-[28rem] overflow-y-auto divide-y divide-neutral/40 pr-2">
                {items.map((item) => (
                  <ListViewRow
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                    rowOptions={rowOptions ? rowOptions(item) : undefined}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {selectedItem && (
        <Modal
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          title={
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3 sm:justify-start">
              <Avatar />
              <div className="min-w-0 sm:flex-1 space-y-0.5 text-center sm:text-left">
                <p className="text-body font-semibold text-secondary leading-tight">
                  {selectedItem.name}
                  {selectedItem.isCurrentUser ? (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                      You
                    </span>
                  ) : null}
                </p>
                {(() => {
                  const subtitle = [selectedItem.rank, selectedItem.role]
                    .filter(Boolean)
                    .join(", ");
                  return subtitle ? (
                    <p className="break-words text-sm font-normal italic text-secondary/70 leading-tight">
                      {subtitle}
                    </p>
                  ) : null;
                })()}
              </div>
            </div>
          }
          footer={
            selectedItem && modalFooter
              ? modalFooter(selectedItem, () => setSelectedItem(null))
              : undefined
          }
        >
          {modalContent ? modalContent(selectedItem) : null}
        </Modal>
      )}
    </>
  );
}

export default ListView;
