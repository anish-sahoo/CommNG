"use client";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEMO_CHANNEL } from "@/lib/demo-channel";
import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type ChannelRoute =
  | "/communications"
  | "/communications/all-channels"
  | "/communications/[channel_id]";

type Channel<T extends string = ChannelRoute> = {
  id: string;
  label: string;
  href: Route<T>;
  type: "link" | "channel";
  userPermission?: "admin" | "post" | "read" | null;
  postPermissionLevel?: "admin" | "everyone" | "custom";
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

  // Filter out channels where user has no permission (permission === null)
  const accessibleChannels = channelData.filter((channel) => {
    // If it's the DEMO_CHANNEL, always show it (it doesn't have a permission property)
    if (!("userPermission" in channel)) {
      return true;
    }
    // Only show channels where user has some permission
    return channel.userPermission !== null;
  });

  const channels: Channel<ChannelRoute>[] = [
    {
      id: "my-channels",
      label: "My Channels",
      href: "/communications",
      type: "link",
    },
    {
      id: "all-channels",
      label: "All Channels",
      href: "/communications/all-channels",
      type: "link",
    },
    ...(accessibleChannels.map((channel) => ({
      id: channel.channelId.toString(),
      label: channel.name,
      href: `/communications/${channel.channelId}` as Route<"/communications/[channel_id]">,
      type: "channel" as const,
      userPermission:
        "userPermission" in channel
          ? (channel.userPermission ?? undefined)
          : undefined,
      postPermissionLevel:
        "postPermissionLevel" in channel
          ? (channel.postPermissionLevel ?? undefined)
          : undefined,
    })) ?? []),
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
            channel.href === "/communications" ||
            channel.href === "/communications/all-channels"
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
