import Image from "next/image";
import { type CSSProperties, useId, useMemo, useState } from "react";
import { locationOptions } from "@/app/login/create-account/MA-towns";
import {
  airForceRanks,
  allRankOptions,
  armyRanks,
} from "@/app/login/create-account/rankOptions";
import { type IconName, icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type BranchKey = "army" | "airforce" | "default";

type BranchTheme = {
  label: string | null;
  base: string;
  dark: string;
  pastel: string;
  border: string;
  text: string;
};

type ProfileCardThemeStyles = CSSProperties & {
  "--profile-card-branch-base": string;
  "--profile-card-branch-dark": string;
  "--profile-card-branch-pastel": string;
  "--profile-card-branch-border": string;
  "--profile-card-branch-text": string;
};

const branchThemes: Record<BranchKey, BranchTheme> = {
  army: {
    label: "Army",
    base: "#d28a1b",
    dark: "#a46d16",
    pastel: "#f0d7a4",
    border: "#dfc189",
    text: "#543506",
  },
  airforce: {
    label: "Air Force",
    base: "#283396",
    dark: "#202978",
    pastel: "#d7dcff",
    border: "#bcc4ff",
    text: "#162268",
  },
  default: {
    label: null,
    base: "#283396",
    dark: "#202978",
    pastel: "#d7dcff",
    border: "#bcc4ff",
    text: "#162268",
  },
};

function resolveBranchKey(branch?: string): BranchKey {
  if (!branch) {
    return "default";
  }

  const normalized = branch.toLowerCase().replace(/\s+/g, "");
  if (normalized.includes("army")) {
    return "army";
  }
  if (
    normalized.includes("airforce") ||
    normalized.includes("airnationalguard") ||
    normalized.includes("airguard")
  ) {
    return "airforce";
  }
  return "default";
}

type ProfileCardAction = {
  label: string;
  iconName?: IconName;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

type ProfileCardContactAction = ProfileCardAction & {
  variant?: React.ComponentProps<typeof Button>["variant"];
};

type ProfileCardHeaderAction = ProfileCardAction;

export type ProfileCardProps = {
  name: string;
  rank: string;
  branch: string;
  unit?: string;
  location?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  interests?: string[];
  about?: string;
  contactActions?: ProfileCardContactAction[];
  headerActions?: ProfileCardHeaderAction[];
  className?: string;
};

const ArrowDownIcon = icons.arrowDown;
const UserIcon = icons.user;
const MenuIcon = icons.ellipsis;

function ProfileCardActionsDropdown({
  actions,
}: {
  actions: ProfileCardHeaderAction[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full border border-neutral bg-white/100 text-primary shadow-sm transition hover:bg-primary hover:text-primary-foreground"
          aria-label="Open profile actions"
        >
          <MenuIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-xl border border-border bg-card text-secondary shadow-xl backdrop-blur"
      >
        {actions.map((action, index) => {
          const Icon = action.iconName ? icons[action.iconName] : null;
          const key = `${action.label}-${index}`;
          const ariaLabel = action.ariaLabel ?? action.label;

          if (action.href) {
            const isExternal = /^https?:\/\//.test(action.href);
            return (
              <DropdownMenuItem
                key={key}
                asChild
                disabled={action.disabled}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary",
                  "data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground",
                  "focus:bg-primary focus:text-primary-foreground",
                )}
              >
                <a
                  href={action.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="flex items-center gap-2"
                  aria-label={ariaLabel}
                >
                  {Icon ? (
                    <Icon className="h-4 w-4 text-current" aria-hidden="true" />
                  ) : null}
                  <span>{action.label}</span>
                </a>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem
              key={key}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary",
                "data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground",
                "focus:bg-primary focus:text-primary-foreground",
              )}
              disabled={action.disabled}
              onSelect={(event) => {
                event.preventDefault();
                action.onClick?.();
              }}
              aria-label={ariaLabel}
            >
              {Icon ? (
                <Icon className="h-4 w-4 text-current" aria-hidden="true" />
              ) : null}
              <span>{action.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ProfileCard({
  name,
  rank,
  branch,
  unit,
  location,
  avatarSrc,
  avatarAlt,
  interests = [],
  about,
  contactActions = [],
  headerActions = [],
  className,
}: ProfileCardProps) {
  const { rankLabel, branchLabel, theme } = useMemo(() => {
    const branchKey = resolveBranchKey(branch);

    const rankLabel =
      (branchKey === "army"
        ? armyRanks.find((r) => r.value === rank)?.label
        : branchKey === "airforce"
          ? airForceRanks.find((r) => r.value === rank)?.label
          : null) ?? rank;

    const { label: branchLabel, ...theme } = branchThemes[branchKey];

    return { rankLabel, branchLabel: branchLabel ?? branch, theme };
  }, [branch, rank]);

  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutSectionId = useId();

  const sharedStyle: ProfileCardThemeStyles = {
    "--profile-card-branch-base": theme.base,
    "--profile-card-branch-dark": theme.dark,
    "--profile-card-branch-pastel": theme.pastel,
    "--profile-card-branch-border": theme.border,
    "--profile-card-branch-text": theme.text,
  };

  return (
    <section
      className={cn(
        "w-full rounded-3xl border border-border bg-card shadow-sm",
        className,
      )}
      style={sharedStyle}
    >
      <div className="relative isolate-auto">
        <div className="relative h-40 w-full overflow-hidden rounded-t-3xl bg-gradient-to-br from-[var(--profile-card-branch-base)] to-[var(--profile-card-branch-dark)] sm:h-48">
          <div className="profile-card__hero-overlay absolute inset-0 opacity-85 mix-blend-multiply" />

          {headerActions.length > 0 ? (
            <div className="absolute right-4 top-4 flex">
              <ProfileCardActionsDropdown actions={headerActions} />
            </div>
          ) : null}
        </div>

        <div className="px-6 pb-6 sm:px-8">
          <div className="mt-2 flex flex-col items-center gap-4 sm:mt-6 sm:flex-row sm:items-start sm:gap-10 lg:gap-12">
            <div className="relative z-10 -mt-16 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-card bg-neutral text-secondary shadow-lg sm:-mt-20 sm:h-32 sm:w-32">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={avatarAlt ?? `${name} profile photo`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 128px, 112px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral/10 text-secondary">
                  <UserIcon className="h-12 w-12" aria-hidden="true" />
                  <span className="sr-only">{name} avatar</span>
                </div>
              )}
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center gap-3 pt-2 text-center sm:ml-8 sm:items-start sm:text-left sm:pt-2 lg:pt-0">
              <div className="space-y-1 text-secondary sm:max-w-2xl">
                <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
                  {name}
                </h2>
                <p className="text-sm text-secondary sm:text-base">
                  {rankLabel}
                  {branchLabel ? `, ${branchLabel}` : null}
                </p>
                {unit ? (
                  <p className="text-sm text-secondary sm:text-base">{unit}</p>
                ) : null}
                {location ? (
                  <p className="text-sm text-secondary sm:text-base">
                    {locationOptions.find((option) => option.value === location)
                      ?.label ?? location}
                  </p>
                ) : null}
              </div>

              {interests.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  {interests.map((interest) => (
                    <Badge
                      key={interest}
                      className="profile-card__interest-badge border px-3 py-1 text-xs font-medium sm:text-sm"
                      style={{
                        backgroundColor: "var(--profile-card-branch-pastel)",
                        color: "var(--profile-card-branch-text)",
                        borderColor: "var(--profile-card-branch-border)",
                      }}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {contactActions.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                  {contactActions.map((action, index) => {
                    const Icon = action.iconName
                      ? icons[action.iconName]
                      : null;
                    const content = (
                      <>
                        {Icon ? (
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        ) : null}
                        <span>{action.label}</span>
                      </>
                    );
                    const variant = action.variant ?? "outline";
                    const ariaLabel = action.ariaLabel ?? action.label;

                    if (action.href) {
                      const isExternal = /^https?:\/\//.test(action.href);
                      return (
                        <Button
                          key={`${action.label}-${index}`}
                          asChild
                          variant={variant}
                          size="lg"
                          className="w-full sm:w-auto"
                        >
                          <a
                            href={action.href}
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noreferrer" : undefined}
                            aria-label={ariaLabel}
                          >
                            {content}
                          </a>
                        </Button>
                      );
                    }

                    return (
                      <Button
                        key={`${action.label}-${index}`}
                        type="button"
                        variant={variant}
                        size="lg"
                        onClick={action.onClick}
                        aria-label={ariaLabel}
                        className="w-full sm:w-auto"
                      >
                        {content}
                      </Button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {about ? (
            <Collapsible open={aboutOpen} onOpenChange={setAboutOpen}>
              <div className="profile-card__section-border mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="profile-card__about-header flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-base font-semibold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    aria-expanded={aboutOpen}
                    aria-controls={aboutSectionId}
                  >
                    <span>About</span>
                    <ArrowDownIcon
                      className={cn(
                        "h-5 w-5 text-white transition-transform duration-200",
                        aboutOpen ? "rotate-180" : "rotate-0",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent
                  id={aboutSectionId}
                  className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
                >
                  <div className="profile-card__section-border border-t bg-card px-6 py-5 text-sm leading-relaxed text-secondary/90">
                    {about}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ) : null}
        </div>
      </div>
    </section>
  );
}
