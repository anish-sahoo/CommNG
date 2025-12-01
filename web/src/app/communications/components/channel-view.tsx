"use client";

import type { QueryKey } from "@tanstack/react-query";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/lib/trpc";
import { type ChannelMessage, MessageList } from "./index";

// ChannelView hosts the single-channel experience inside Communications, handling membership gating and the optimistic timeline state desyncs that can happen between refetches.

// Type for message reactions from the API
type MessageReaction = {
  emoji: string;
  count: number;
  reactedByCurrentUser?: boolean;
};

type AccessibleChannel = {
  channelId: number;
  name: string;
  metadata: Record<string, unknown> | null;
  postPermissionLevel: "admin" | "everyone" | "custom";
  userPermission: "admin" | "post" | "read" | null;
};

// Reaction toggles mutate nested arrays later on, so keep cache-owned data isolated by cloning before any optimistic updates run
function cloneMessages(messages: ChannelMessage[]): ChannelMessage[] {
  return messages.map((message) => ({
    ...message,
    attachments: (message.attachments ?? []).map((attachment) => ({
      ...attachment,
    })),
    reactions: (message.reactions ?? []).map((reaction: MessageReaction) => ({
      ...reaction,
      reactedByCurrentUser: reaction.reactedByCurrentUser ?? false,
    })),
  }));
}

function areMessagesEqual(a: ChannelMessage[], b: ChannelMessage[]): boolean {
  if (a === b) {
    return true;
  }

  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];

    if (
      left.id !== right.id ||
      left.content !== right.content ||
      left.authorName !== right.authorName ||
      left.authorRank !== right.authorRank ||
      left.authorRole !== right.authorRole ||
      left.authorImage !== right.authorImage ||
      (left.attachments?.length ?? 0) !== (right.attachments?.length ?? 0) ||
      (left.reactions?.length ?? 0) !== (right.reactions?.length ?? 0)
    ) {
      return false;
    }

    const leftReactions = left.reactions ?? [];
    const rightReactions = right.reactions ?? [];

    for (
      let reactionIndex = 0;
      reactionIndex < leftReactions.length;
      reactionIndex += 1
    ) {
      const leftReaction = leftReactions[reactionIndex];
      const rightReaction = rightReactions[reactionIndex];

      if (
        leftReaction.emoji !== rightReaction.emoji ||
        leftReaction.count !== rightReaction.count ||
        (leftReaction.reactedByCurrentUser ?? false) !==
          (rightReaction.reactedByCurrentUser ?? false)
      ) {
        return false;
      }
    }

    const leftAttachments = left.attachments ?? [];
    const rightAttachments = right.attachments ?? [];

    for (
      let attachmentIndex = 0;
      attachmentIndex < leftAttachments.length;
      attachmentIndex += 1
    ) {
      const leftAttachment = leftAttachments[attachmentIndex];
      const rightAttachment = rightAttachments[attachmentIndex];

      if (
        leftAttachment.fileId !== rightAttachment.fileId ||
        leftAttachment.fileName !== rightAttachment.fileName ||
        (leftAttachment.contentType ?? null) !==
          (rightAttachment.contentType ?? null)
      ) {
        return false;
      }
    }
  }

  return true;
}

function parseChannelId(channelId: string): number | null {
  const numericId = Number(channelId);
  if (Number.isNaN(numericId) || numericId <= 0) {
    return null;
  }
  return numericId;
}

type ChannelViewProps = {
  channelId: string;
};

export function ChannelView({ channelId }: ChannelViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const backHref =
    from === "all" ? "/communications/all-channels" : "/communications";
  const backAriaLabel =
    from === "all" ? "Back to all channels" : "Back to my channels";

  const [_isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => {
      window.removeEventListener("resize", checkScreen);
    };
  }, []);

  const { mutate: mutateReaction } = useMutation(
    trpc.comms.toggleMessageReaction.mutationOptions(),
  );

  const parsedChannelId = parseChannelId(channelId);

  const channelListQuery = useQuery(trpc.comms.getAllChannels.queryOptions());
  const allChannelsQueryKey = trpc.comms.getAllChannels.queryKey();

  const channelInput =
    parsedChannelId === null ? skipToken : { channelId: parsedChannelId };

  const messagesQuery = useQuery(
    trpc.comms.getChannelMessages.queryOptions(channelInput),
  );

  const channelListRaw =
    Array.isArray(channelListQuery.data) && channelListQuery.data.length > 0
      ? channelListQuery.data
      : [];

  const channelList = channelListRaw;

  const messages = Array.isArray(messagesQuery.data) ? messagesQuery.data : [];

  // Check if user is not a member (permission is null)
  const currentChannel = channelList.find(
    (channel) => channel.channelId === parsedChannelId,
  );
  const isNotMember =
    currentChannel && "userPermission" in currentChannel
      ? currentChannel.userPermission === null
      : false;
  const readOnlyChannel =
    currentChannel && "postPermissionLevel" in currentChannel
      ? currentChannel.postPermissionLevel === "admin"
      : false;
  const hasPostPermission =
    currentChannel && "userPermission" in currentChannel
      ? currentChannel.userPermission === "admin" ||
        currentChannel.userPermission === "post"
      : false;
  const canCreatePost = !readOnlyChannel || hasPostPermission;

  const [messagesState, setMessagesState] = useState<ChannelMessage[]>([]);

  const _channelName = useMemo(() => {
    if (!channelList.length || !parsedChannelId) {
      return "Channel";
    }

    const match = channelList.find(
      (channel) => channel.channelId === parsedChannelId,
    );

    return match?.name ?? "Channel";
  }, [channelList, parsedChannelId]);

  const displayChannelName =
    _isSmallScreen && _channelName.length > 18
      ? `${_channelName.slice(0, 18)}…`
      : _channelName;

  // PostedCard consumes a flattened message contract, so this memo keeps the shape consistent regardless of how the backend representation evolves.
  const messageItems: ChannelMessage[] = useMemo(() => {
    if (!messages.length) {
      return [];
    }

    return messages.map((message) => ({
      id: message.messageId,
      authorName: message.authorName ?? undefined,
      authorRank: message.authorRank ?? undefined,
      authorRole: message.authorDepartment ?? undefined,
      authorImage: message.authorImage ?? null,
      content: message.message ?? "",
      createdAt: message.createdAt,
      attachments: message.attachments ?? [],
      reactions: (message.reactions ?? []).map((reaction: MessageReaction) => ({
        emoji: reaction.emoji,
        count: reaction.count,
        reactedByCurrentUser: reaction.reactedByCurrentUser ?? false,
      })),
    }));
  }, [messages]);

  const hasHydratedFromServerRef = useRef(false);

  // React Query will briefly serve undefined during route transitions; this flag ensures that transient empties do not blow away optimistic local state
  useEffect(() => {
    if (!messagesQuery.isSuccess) {
      return;
    }

    if (!messageItems.length) {
      if (hasHydratedFromServerRef.current) {
        setMessagesState((previous) => (previous.length === 0 ? previous : []));
      }
      return;
    }

    const nextMessages = cloneMessages(messageItems);

    hasHydratedFromServerRef.current = true;

    setMessagesState((previous) =>
      areMessagesEqual(previous, nextMessages) ? previous : nextMessages,
    );
  }, [messageItems, messagesQuery.isSuccess]);

  const channelMessagesQueryKey = useMemo<QueryKey | null>(() => {
    if (parsedChannelId === null) {
      return null;
    }

    return trpc.comms.getChannelMessages.queryKey({
      channelId: parsedChannelId,
    }) as unknown as QueryKey;
  }, [parsedChannelId, trpc]);

  const { mutate: joinChannel, isPending: isJoining } = useMutation(
    trpc.comms.joinChannel.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: allChannelsQueryKey });
        const previousChannels = queryClient.getQueryData<
          AccessibleChannel[] | undefined
        >(allChannelsQueryKey);

        queryClient.setQueryData<AccessibleChannel[] | undefined>(
          allChannelsQueryKey,
          (old) => {
            if (!Array.isArray(old)) {
              return old;
            }

            let didUpdate = false;
            const updated = old.map((channel) => {
              if (channel.channelId !== variables.channelId) {
                return channel;
              }

              if (channel.userPermission === "read") {
                return channel;
              }

              didUpdate = true;
              return {
                ...channel,
                userPermission: "read" as AccessibleChannel["userPermission"],
              };
            });

            return didUpdate ? updated : old;
          },
        );

        return { previousChannels };
      },
      onError: (_error, _variables, context) => {
        if (context) {
          queryClient.setQueryData<AccessibleChannel[] | undefined>(
            allChannelsQueryKey,
            context.previousChannels,
          );
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: allChannelsQueryKey });
        if (channelMessagesQueryKey) {
          queryClient.invalidateQueries({
            queryKey: channelMessagesQueryKey,
          });
        }
      },
    }),
  );

  const messagesToDisplay = messagesState;

  const AddIcon = icons.add;
  const SettingsIcon = icons.settings;
  const EllipsisIcon = icons.ellipsis;

  const handleReactionToggle = useCallback(
    ({
      messageId,
      emoji,
      active,
    }: {
      messageId: number;
      emoji: string;
      active: boolean;
    }) => {
      if (parsedChannelId === null) {
        return;
      }

      setMessagesState((prevMessages) =>
        prevMessages.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          const reactions = message.reactions ?? [];
          const existingIndex = reactions.findIndex(
            (reaction) => reaction.emoji === emoji,
          );

          if (existingIndex === -1) {
            if (!active) {
              return message;
            }

            return {
              ...message,
              reactions: [
                ...reactions,
                { emoji, count: 1, reactedByCurrentUser: true },
              ],
            };
          }

          const existingReaction = reactions[existingIndex];
          const nextCount = Math.max(
            0,
            existingReaction.count + (active ? 1 : -1),
          );

          if (nextCount === 0) {
            return {
              ...message,
              reactions: reactions.filter(
                (_, index) => index !== existingIndex,
              ),
            };
          }

          const nextReactions = reactions.map((reaction, index) =>
            index === existingIndex
              ? {
                  ...reaction,
                  count: nextCount,
                  reactedByCurrentUser: active,
                }
              : reaction,
          );

          return {
            ...message,
            reactions: nextReactions,
          };
        }),
      );

      mutateReaction(
        {
          channelId: parsedChannelId,
          messageId,
          emoji,
          active,
        },
        {
          onSuccess: (data) => {
            setMessagesState((prevMessages) =>
              prevMessages.map((message) =>
                message.id === data.messageId
                  ? {
                      ...message,
                      reactions: data.reactions.map(
                        (reaction: MessageReaction) => ({
                          emoji: reaction.emoji,
                          count: reaction.count,
                          reactedByCurrentUser:
                            reaction.reactedByCurrentUser ?? false,
                        }),
                      ),
                    }
                  : message,
              ),
            );
          },
          onError: () => {
            if (channelMessagesQueryKey) {
              queryClient.invalidateQueries({
                queryKey: channelMessagesQueryKey,
              });
            }
          },
        },
      );
    },
    [parsedChannelId, queryClient, mutateReaction, channelMessagesQueryKey],
  );

  if (parsedChannelId === null) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
        Invalid channel identifier provided.
      </div>
    );
  }

  // Show "not a member" message if user doesn't have permission
  if (isNotMember) {
    return (
      <TitleShell
        title={displayChannelName}
        backHref={backHref}
        backAriaLabel={backAriaLabel}
      >
        <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-border bg-muted/30 p-8 text-center">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold text-foreground">
              You are not a member of this channel
            </h3>
            <p className="text-sm text-muted-foreground">
              Please join this channel to view messages and participate in
              discussions.
            </p>
          </div>
          <Button
            onClick={() => {
              if (parsedChannelId !== null) {
                joinChannel({ channelId: parsedChannelId });
              }
            }}
            disabled={isJoining}
            className="min-w-[200px]"
          >
            {isJoining ? "Joining..." : "Join Channel"}
          </Button>
        </div>
      </TitleShell>
    );
  }

  return (
    <TitleShell
      title={displayChannelName}
      backHref={backHref}
      backAriaLabel={backAriaLabel}
      actions={
        <>
          <div className="hidden items-center gap-3 sm:flex">
            {canCreatePost ? (
              <Button
                variant="outline"
                className="px-6 py-2 text-sm sm:text-base"
                asChild
              >
                <Link href={`/communications/${channelId}/new`}>
                  <AddIcon className="h-4 w-4" />
                  <span className="text-sm sm:text-base">New Post</span>
                </Link>
              </Button>
            ) : null}
            <Link
              href={`/communications/${channelId}/settings`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-10 sm:w-10"
              aria-label="Channel settings"
            >
              <SettingsIcon className="h-5 w-5 sm:h-8 sm:w-8" />
            </Link>
          </div>

          <div className="flex items-center sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Channel actions"
                >
                  <EllipsisIcon className="h-5 w-5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {canCreatePost ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/communications/${channelId}/new`}
                      className="flex items-center gap-2 text-secondary"
                    >
                      <AddIcon className="h-4 w-4 text-primary" />
                      New Post
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/communications/${channelId}/settings`}
                    className="flex items-center gap-2 text-secondary"
                  >
                    <SettingsIcon className="h-4 w-4 text-primary" />
                    Channel Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      }
    >
      {readOnlyChannel && !hasPostPermission ? (
        <div className="mb-4 rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-secondary">
          This is a read-only channel. Contact an admin if you need permission
          to post updates.
        </div>
      ) : null}
      <MessageList
        channelId={parsedChannelId}
        messages={messagesToDisplay}
        onReactionToggle={handleReactionToggle}
      />
    </TitleShell>
  );
}

export default ChannelView;
