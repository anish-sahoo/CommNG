"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import ChannelCard from "@/components/channel-card";
import {
  DropdownButtons,
  type DropdownMenuItemConfig,
} from "@/components/dropdown";
import { type IconName, icons } from "@/components/icons";
import SearchBar from "@/components/search-bar";
import { Button } from "@/components/ui/button";
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

  const editMenuItems: DropdownMenuItemConfig[] = [
    {
      id: "edit-channels",
      icon: "trash",
      label: "Delete",
    },
  ];

  const newMenuItems: DropdownMenuItemConfig[] = [
    {
      id: "new-broadcast",
      icon: "announce",
      label: "Broadcast",
      href: "/communications/broadcasts/new",
    },
    {
      id: "new-channel",
      icon: "forum",
      label: "Channel",
      href: "/communications/channels/new",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-12">
      <header className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <DropdownButtons
            items={editMenuItems}
            align="start"
            sideOffset={6}
            triggerContent={
              <Button variant="outline" className="gap-2">
                <icons.edit className="h-5 w-5 text-accent" />
                Edit
              </Button>
            }
          />

          <DropdownButtons
            items={newMenuItems}
            align="start"
            sideOffset={6}
            triggerContent={
              <Button variant="outline" className="gap-2">
                <icons.add className="h-5 w-5 text-accent" />
                New
              </Button>
            }
          />
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
            <Link
              href="/communications/broadcasts"
              aria-label="Open broadcasts"
            >
              <BellIcon className="h-5 w-5 text-secondary" />
              {hasActiveBroadcast ? (
                <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-error" />
              ) : null}
            </Link>
          </Button>
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
