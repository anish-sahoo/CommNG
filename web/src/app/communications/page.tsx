"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ChannelCard from "@/components/channel-card";
import { type IconName, icons } from "@/components/icons";
import SearchBar from "@/components/search-bar";
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

  const { data, isLoading } = useQuery(
    trpc.comms.getAllChannels.queryOptions(),
  );

  const rawChannels = useMemo(() => {
    if (data && data.length > 0) {
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-12">
      <header className="flex justify-end">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
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
