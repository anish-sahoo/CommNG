"use client";

import { icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

type AudienceSegment = {
  ranks?: string[] | null;
  departments?: string[] | null;
};

export type BroadcastCardData = {
  blastId: number;
  title: string;
  content: string;
  targetAudience: {
    army?: AudienceSegment | null;
    airforce?: AudienceSegment | null;
  } | null;
  validUntil: Date | string | null;
  createdAt?: Date | string | null;
};

type BroadcastCardProps = {
  blast: BroadcastCardData;
  onSelect?: (blast: BroadcastCardData) => void;
  onDelete?: (blast: BroadcastCardData) => void;
  canManage?: boolean;
  isDeleting?: boolean;
};

function formatValidUntil(date: Date | string | null | undefined) {
  if (!date) {
    return "No expiry";
  }
  const parsed = date instanceof Date ? date : new Date(date);
  return Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function describeAudience(targetAudience: BroadcastCardData["targetAudience"]) {
  if (!targetAudience) {
    return "Everyone";
  }

  const segments: string[] = [];

  if (targetAudience.army?.departments?.length) {
    segments.push(`Army • ${targetAudience.army.departments.join(", ")}`);
  } else if (targetAudience.army?.ranks?.length) {
    segments.push(`Army ranks ${targetAudience.army.ranks.join(", ")}`);
  }

  if (targetAudience.airforce?.departments?.length) {
    segments.push(
      `Air Force • ${targetAudience.airforce.departments.join(", ")}`,
    );
  } else if (targetAudience.airforce?.ranks?.length) {
    segments.push(
      `Air Force ranks ${targetAudience.airforce.ranks.join(", ")}`,
    );
  }

  if (segments.length === 0) {
    return "Targeted audience";
  }

  return segments.join(" • ");
}

export function BroadcastCard({
  blast,
  onSelect,
  onDelete,
  canManage = false,
  isDeleting = false,
}: BroadcastCardProps) {
  const TrashIcon = icons.trash;

  return (
    <article className="group relative flex flex-col gap-3 rounded-xl border border-border bg-background/80 p-5 shadow-xs transition hover:border-primary/60 hover:shadow-md">
      <button
        type="button"
        onClick={() => onSelect?.(blast)}
        className="flex flex-1 flex-col gap-3 text-left"
      >
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-secondary">
            {blast.title}
          </h2>
          <span className="text-xs uppercase tracking-wide text-accent">
            {describeAudience(blast.targetAudience)}
          </span>
        </header>
        <p className="text-sm leading-relaxed text-secondary/90 line-clamp-3">
          {blast.content}
        </p>
        <footer className="mt-auto text-xs text-secondary/60">
          Expires {formatValidUntil(blast.validUntil)}
        </footer>
      </button>
      {canManage ? (
        <div className="absolute right-3 top-3">
          <Button
            type="button"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.(blast);
            }}
            disabled={isDeleting}
            className="h-8 w-8 rounded-full bg-background/0 text-error hover:text-error/80 hover:bg-error/20"
          >
            {isDeleting ? (
              <span className="text-xs font-semibold">…</span>
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isDeleting ? "Deleting broadcast" : "Delete broadcast"}
            </span>
          </Button>
        </div>
      ) : null}
    </article>
  );
}
