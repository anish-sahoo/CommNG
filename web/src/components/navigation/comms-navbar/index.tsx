"use client";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DEMO_CHANNEL } from "@/lib/demo-channel";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type Channel<T extends string = string> = {
  id: string;
  label: string;
  href: Route<`/communications/${T}`>;
  type: "all" | "channel";
  imageFileId?: string;
};

const ChannelLink = ({
  channel,
  isActive,
  onNavigate,
}: {
  channel: Channel;
  isActive: boolean;
  onNavigate?: () => void;
}) => {
  const trpcClient = useTRPCClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!channel.imageFileId) {
      return;
    }

    // If it's a direct path/URL, use it directly
    if (
      channel.imageFileId.startsWith("/") ||
      channel.imageFileId.startsWith("http")
    ) {
      setImageUrl(channel.imageFileId);
      return;
    }

    // Otherwise, fetch from the files API
    const fetchImage = async () => {
      try {
        const fileData = await trpcClient.files.getFile.query({
          fileId: channel.imageFileId!,
        });
        setImageUrl(fileData.data);
      } catch (error) {
        console.error("Failed to fetch channel image:", error);
        setImageUrl("/default_channel_image.png");
      }
    };

    void fetchImage();
  }, [channel.imageFileId, trpcClient]);

  return (
    <li>
      <Link
        href={channel.href}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-3 px-6 py-3 transition-colors duration-200",
          isActive
            ? "bg-primary text-background"
            : "text-background hover:bg-primary/80 hover:text-background",
        )}
      >
        {channel.type === "channel" ? (
          <span
            className={`text-background text-lg ${
              isActive ? "font-bold" : "font-semibold"
            }`}
          >
            #
          </span>
        ) : null}
        <span
          className={`text-body text-lg transition-colors ${
            isActive ? "font-bold" : "font-semibold"
          }`}
        >
          {channel.label}
        </span>
        {isActive ? (
          <span className="absolute right-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-l-full bg-accent" />
        ) : null}
      </Link>
    </li>
  );
};

type CommsNavBarProps = {
  className?: string;
  onNavigate?: () => void;
};

export const CommsNavBar = ({
  className,
  onNavigate,
}: CommsNavBarProps = {}) => {
  const pathname = usePathname();
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.comms.getAllChannels.queryOptions(),
  );

  const channelData =
    Array.isArray(data) && data.length > 0 ? data : [DEMO_CHANNEL];

  const channels: Channel[] = [
    {
      id: "all",
      label: "All Channels",
      href: "/communications",
      type: "all",
    },
    ...(channelData.map((channel) => {
      const metadata = channel.metadata as
        | {
            imageFileId?: string;
            description?: string;
            icon?: string;
          }
        | null
        | undefined;

      return {
        id: channel.channelId.toString(),
        label: channel.name,
        href: `/communications/${channel.channelId}` as const,
        type: "channel" as const,
        imageFileId: metadata?.imageFileId,
      };
    }) ?? []),
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-24 z-30 flex w-60 flex-col bg-primary-dark pt-16 text-background shadow-lg shadow-black/20",
        className,
      )}
    >
      <ul className="flex flex-col gap-1">
        {isLoading ? (
          <li className="px-6 py-3 text-sm text-background/70">Loading…</li>
        ) : null}
        {channels.map((channel) => {
          const isActive =
            channel.href === "/communications"
              ? pathname === channel.href
              : pathname === channel.href ||
                pathname.startsWith(`${channel.href}/`);
          return (
            <ChannelLink
              key={channel.id}
              channel={channel}
              isActive={isActive}
              onNavigate={onNavigate}
            />
          );
        })}
      </ul>
    </aside>
  );
};

export default CommsNavBar;
