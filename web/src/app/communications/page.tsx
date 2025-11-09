"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import ChannelCard from "@/components/channel-card";
import { type IconName, icons } from "@/components/icons";
import SearchBar from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEMO_CHANNEL } from "@/lib/demo-channel";
import { useTRPC } from "@/lib/trpc";

type ChannelMetadata = {
  description?: string;
  summary?: string;
  icon?: string;
  imageSrc?: string;
};

function resolveIconName(icon?: string): IconName {
  if (icon && icon in icons) {
    return icon as IconName;
  }
  return "communications";
}

export default function CommunicationsOverviewPage() {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const BellIcon = icons.bell;
  const AddIcon = icons.add;
  const EllipsisIcon = icons.ellipsis;

  const { data, isLoading } = useQuery(
    trpc.comms.getAllChannels.queryOptions(),
  );
  const { data: activeBroadcasts } = useQuery(
    trpc.messageBlasts.getActiveMessageBlastsForUser.queryOptions(),
  );

  const hasActiveBroadcast = useMemo(() => {
    if (!activeBroadcasts || activeBroadcasts.length === 0) {
      return false;
    }

    const now = Date.now();

    return activeBroadcasts.some((blast) => {
      if (!blast.validUntil) {
        return true;
      }
      const expiresAt = new Date(blast.validUntil).getTime();
      return Number.isFinite(expiresAt) && expiresAt > now;
    });
  }, [activeBroadcasts]);

  const rawChannels = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [DEMO_CHANNEL];
  }, [data]);

  const channels = useMemo(() => {
    if (!search.trim()) {
      return rawChannels;
    }
    const query = search.trim().toLowerCase();
    return rawChannels.filter((channel) =>
      channel.name.toLowerCase().includes(query),
    );
  }, [rawChannels, search]);

  const creationActions = [
    {
      label: "Channel",
      href: "/communications/channels/new",
      ariaLabel: "Create a new channel",
    },
    {
      label: "Broadcast",
      href: "/communications/broadcasts/new",
      ariaLabel: "Create a new broadcast",
    },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-12">
      <header className="pt-2">
        {/* Mobile actions */}
        <div className="flex flex-col gap-3 sm:hidden">
          <div className="flex w-full flex-wrap items-center gap-3">
            <div
              className="flex-1 min-w-[10rem]"
              style={{ flexBasis: "240px" }}
            >
              <SearchBar
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search channels"
                aria-label="Search communication channels"
              />
            </div>
            <div
              className="flex items-center gap-2 flex-none"
              style={{ flexBasis: "72px" }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="relative shrink-0 rounded-full border border-border bg-card text-primary shadow-sm transition hover:bg-primary/10"
                    aria-label="Open create menu"
                  >
                    <EllipsisIcon className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-2xl border border-border bg-card/95 p-2 text-secondary shadow-2xl backdrop-blur"
                >
                  {creationActions.map((action) => (
                    <DropdownMenuItem
                      key={action.label}
                      asChild
                      className="group rounded-xl px-3 py-2 text-sm font-medium text-secondary data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground"
                    >
                      <Link
                        href={action.href}
                        aria-label={action.ariaLabel}
                        className="flex items-center gap-2"
                      >
                        <AddIcon
                          className="h-4 w-4 text-accent group-data-[highlighted]:text-primary-foreground"
                          aria-hidden="true"
                        />
                        <span>{action.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative shrink-0 rounded-full border border-border bg-card text-secondary hover:text-primary"
              >
                <Link href="/communications/broadcasts" aria-label="Open broadcasts">
                  <BellIcon className="h-5 w-5 text-secondary" />
                  {hasActiveBroadcast ? (
                    <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-error" />
                  ) : null}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center justify-between gap-3 sm:flex">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link
                href="/communications/channels/new"
                aria-label="Create a new channel"
              >
                <AddIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                Channel
              </Link>
            </Button>

            <Button asChild variant="outline" className="gap-2">
              <Link
                href="/communications/broadcasts/new"
                aria-label="Create a new broadcast"
              >
                <AddIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                Broadcast
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <SearchBar
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search channels"
              aria-label="Search communication channels"
            />
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative rounded-full border border-border bg-card text-secondary hover:text-primary"
            >
              <Link href="/communications/broadcasts" aria-label="Open broadcasts">
                <BellIcon className="h-5 w-5 text-secondary" />
                {hasActiveBroadcast ? (
                  <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-error" />
                ) : null}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <section className="grid h-64 place-items-center rounded-2xl border border-primary/20 bg-card text-secondary/70">
          Loading channels…
        </section>
      ) : channels.length === 0 ? (
        <section className="grid h-64 place-items-center rounded-2xl border border-primary/20 bg-card text-secondary/70">
          No channels match “{search.trim()}”.
        </section>
      ) : (
        <section className="flex flex-wrap gap-6">
          {channels.map((channel) => {
            const metadata = (channel.metadata ?? {}) as ChannelMetadata;
            const description =
              metadata.summary ??
              metadata.description ??
              "Demo communications channel";
            const iconName = resolveIconName(metadata.icon);

            return (
              <div key={channel.channelId} className="flex-none">
                <ChannelCard
                  href={`/communications/${channel.channelId}`}
                  title={channel.name}
                  description={description}
                  iconName={iconName}
                  imageSrc={
                    typeof metadata.imageSrc === "string"
                      ? metadata.imageSrc
                      : undefined
                  }
                />
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
