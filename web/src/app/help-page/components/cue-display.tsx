"use client";

import { icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CueDisplayProps = {
  leadingIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  leadingIconClassName?: string;
  buttonLabel: string;
  buttonIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
  buttonIconClassName?: string;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  buttonClassName?: string;
};

const cueClass =
  "mt-2 inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-2 text-xs text-secondary shadow-sm ring-1 ring-border/60 max-w-full";
const cueIconClass = "h-4 w-4 text-primary";
const MoveRightIcon = icons.moveRight;

export function CueDisplay({
  leadingIcon: LeadingIcon,
  leadingIconClassName,
  buttonIcon: ButtonIcon,
  buttonLabel,
  buttonIconClassName,
  buttonVariant = "outline",
  buttonClassName,
}: CueDisplayProps) {
  return (
    <div className={`${cueClass} min-w-0`}>
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
}
