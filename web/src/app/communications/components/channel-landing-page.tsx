"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ChannelCard from "@/components/channel-card";
import { type IconName, icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import SearchBar from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type ChannelMetadata = {
  description?: string;
  summary?: string;
  icon?: string;
  imageFileId?: string;
};

type ChannelPostPermission = "admin" | "everyone" | "custom";

export type ChannelLandingVariant = "my" | "all";

function resolveChannelCardIcon(
  level?: ChannelPostPermission | null,
): IconName {
  return level === "admin" ? "announce" : "communications";
}

type ChannelLandingPageProps = {
  variant: ChannelLandingVariant;
};

// ChannelLandingPage powers both the default "My Channels" landing and the "All Channels" browse view.
export function ChannelLandingPage({ variant }: ChannelLandingPageProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const [search, setSearch] = useState("");
  const AddIcon = icons.add;
  const isMyView = variant === "my";

  const { data, isLoading } = useQuery(
    trpc.comms.getAllChannels.queryOptions(),
  );

  // Pre-fetch all channel images in parallel
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

  const rawChannels = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [];
  }, [data]);

  const myChannels = useMemo(() => {
    return rawChannels.filter((channel) => {
      if (!("userPermission" in channel)) {
        return true;
      }

      return channel.userPermission !== null;
    });
  }, [rawChannels]);

  useEffect(() => {
    if (!rawChannels || rawChannels.length === 0) return;

    const fileIdsToFetch = rawChannels
      .map((channel) => {
        const metadata = channel.metadata as
          | { imageFileId?: string }
          | null
          | undefined;
        return metadata?.imageFileId;
      })
      .filter(
        // Seeded metadata already stores a direct pathname/URL; skip those to avoid double-fetching assets the browser can load on its own
        (fileId): fileId is string =>
          !!fileId && !fileId.startsWith("/") && !fileId.startsWith("http"),
      );

    if (fileIdsToFetch.length === 0) return;

    // Fetch all images in parallel
    const fetchAllImages = async () => {
      const results = await Promise.allSettled(
        fileIdsToFetch.map(async (fileId) => {
          const fileData = await trpcClient.files.getFile.query({ fileId });
          return { fileId, url: fileData.data };
        }),
      );

      const newImageUrls = new Map<string, string>();
      for (const result of results) {
        if (result.status === "fulfilled") {
          newImageUrls.set(result.value.fileId, result.value.url);
        }
      }
      setImageUrls(newImageUrls);
    };

    void fetchAllImages();
  }, [rawChannels, trpcClient]);

  const baseChannels = useMemo(
    () => (isMyView ? myChannels : rawChannels),
    [isMyView, myChannels, rawChannels],
  );

  const channels = useMemo(() => {
    if (!search.trim()) {
      return baseChannels;
    }
    const query = search.trim().toLowerCase();
    return baseChannels.filter((channel) =>
      channel.name.toLowerCase().includes(query),
    );
  }, [baseChannels, search]);

  const creationActions = [
    {
      label: "Channel",
      href: "/communications/channels/new",
      ariaLabel: "Create a new channel",
    },
  ] as const;

  const CreationMenu = ({
    triggerClassName = "",
  }: {
    triggerClassName?: string;
  }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "relative rounded-full border border-border bg-card text-primary transition hover:bg-primary/10 shadow-none",
            triggerClassName,
          )}
          aria-label="Open create menu"
        >
          <AddIcon className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-xl border border-border bg-background p-2 text-primary"
      >
        {creationActions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            asChild
            className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition data-[highlighted]:bg-primary data-[highlighted]:text-background"
          >
            <Link
              href={action.href}
              aria-label={action.ariaLabel}
              className="flex items-center gap-2"
            >
              <AddIcon className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>{action.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const gridClassName =
    "grid w-full grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] justify-items-center gap-6 sm:gap-8 2xl:gap-10";

  const searchPlaceholder = isMyView
    ? "Search my channels"
    : "Search all channels";

  const emptyStateMessage = search
    ? `No channels match "${search.trim()}".`
    : isMyView
      ? "You haven't joined any channels yet."
      : "No channels are available right now.";

  return (
    <TitleShell
      title={
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          containerClassName="w-full max-w-xs"
          className="h-[41px] w-full"
        />
      }
      actions={
        <>
          {/* Mobile actions */}
          <div className="flex items-center gap-2 sm:hidden">
            <CreationMenu />
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 sm:flex">
            <Button asChild variant="outline" className="gap-2">
              <Link
                href="/communications/channels/new"
                aria-label="Create a new channel"
              >
                <AddIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                Channel
              </Link>
            </Button>
          </div>
        </>
      }
      scrollableContent={false}
      contentClassName="md:pr-0"
    >
      <div className="mx-auto flex w-full app-content-width flex-col gap-6 px-4 sm:px-12">
        {isLoading ? (
          <section className="grid h-64 place-items-center rounded-2xl border border-primary/20 bg-card text-secondary/70">
            Loading channels…
          </section>
        ) : channels.length === 0 ? (
          <section className="grid h-64 place-items-center gap-3 rounded-2xl border border-primary/20 bg-card px-6 text-center text-secondary/70">
            <p>{emptyStateMessage}</p>
          </section>
        ) : (
          <section className={gridClassName}>
            {channels.map((channel, index) => {
              const metadata = (channel.metadata ?? {}) as ChannelMetadata;
              const description =
                metadata.summary ??
                metadata.description ??
                "Demo communications channel";
              const postPermissionLevel =
                "postPermissionLevel" in channel
                  ? (channel.postPermissionLevel ?? null)
                  : null;
              const iconName = resolveChannelCardIcon(postPermissionLevel);
              // Prioritize loading the first 3 images for better LCP
              const isPriority = index < 3;

              // Get pre-fetched image URL or use original if it's a direct path
              const imageFileId = metadata.imageFileId
                ? metadata.imageFileId.startsWith("/") ||
                  metadata.imageFileId.startsWith("http")
                  ? metadata.imageFileId
                  : imageUrls.get(metadata.imageFileId)
                : undefined;

              return (
                <div
                  key={channel.channelId}
                  className="flex w-full justify-center"
                >
                  <ChannelCard
                    href={`/communications/${channel.channelId}`}
                    title={channel.name}
                    description={description}
                    iconName={iconName}
                    imageFileId={imageFileId}
                    priority={isPriority}
                  />
                </div>
              );
            })}
          </section>
        )}
      </div>
    </TitleShell>
  );
}

export default ChannelLandingPage;
