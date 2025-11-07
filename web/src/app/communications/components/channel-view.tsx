"use client";

import type { QueryKey } from "@tanstack/react-query";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEMO_CHANNEL } from "@/lib/demo-channel";
import { useTRPC } from "@/lib/trpc";
import { type ChannelMessage, ChannelShell, MessageList } from "./index";

// Type for message reactions from the API
type MessageReaction = {
  emoji: string;
  count: number;
  reactedByCurrentUser?: boolean;
};

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

  // Explicitly type mutation variables to ensure correct inference
  type ToggleReactionVars = {
    channelId: number;
    messageId: number;
    emoji: string;
    active: boolean;
  };
  type ToggleReactionMutationOptions = ReturnType<
    typeof trpc.comms.toggleMessageReaction.mutationOptions
  >;
  type ToggleReactionError = Parameters<
    NonNullable<ToggleReactionMutationOptions["onError"]>
  >[0];
  type ToggleReactionData = Parameters<
    NonNullable<ToggleReactionMutationOptions["onSuccess"]>
  >[0];

  const { mutate: mutateReaction } = useMutation<
    ToggleReactionData,
    ToggleReactionError,
    ToggleReactionVars
  >(trpc.comms.toggleMessageReaction.mutationOptions());

  const parsedChannelId = parseChannelId(channelId);

  const channelListQuery = useQuery(trpc.comms.getAllChannels.queryOptions());

  const channelInput =
    parsedChannelId === null ? skipToken : { channelId: parsedChannelId };

  const messagesQuery = useQuery(
    trpc.comms.getChannelMessages.queryOptions(channelInput),
  );

  const channelListRaw =
    Array.isArray(channelListQuery.data) && channelListQuery.data.length > 0
      ? channelListQuery.data
      : [DEMO_CHANNEL];

  const channelList = channelListRaw;

  const messages = Array.isArray(messagesQuery.data) ? messagesQuery.data : [];

  const [messagesState, setMessagesState] = useState<ChannelMessage[]>([]);

  const channelName = useMemo(() => {
    if (!channelList.length || !parsedChannelId) {
      return "Channel";
    }

    const match = channelList.find(
      (channel) => channel.channelId === parsedChannelId,
    );

    return match?.name ?? "Channel";
  }, [channelList, parsedChannelId]);

  const messageItems: ChannelMessage[] = useMemo(() => {
    if (!messages.length) {
      return [];
    }

    return messages.map((message) => ({
      id: message.messageId,
      authorName: message.authorName ?? undefined,
      authorRank: message.authorRank ?? undefined,
      authorRole: message.authorDepartment ?? undefined,
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

  const messagesToDisplay = messagesState;

  const ArrowLeftIcon = icons.arrowLeft;
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

  return (
    <ChannelShell
      title={
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/communications"
            className="inline-flex h-12 w-12 items-center justify-center text-accent transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-14 sm:w-14"
            aria-label="Back to all channels"
          >
            <ArrowLeftIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </Link>
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            {channelName}
          </span>
        </div>
      }
      actions={
        <>
          <div className="hidden items-center gap-3 sm:flex">
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
            <Link
              href={`/communications/${channelId}/settings`}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-primary transition hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-14 sm:w-14"
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
                <DropdownMenuItem asChild>
                  <Link
                    href={`/communications/${channelId}/new`}
                    className="flex items-center gap-2 text-secondary"
                  >
                    <AddIcon className="h-4 w-4 text-primary" />
                    New Post
                  </Link>
                </DropdownMenuItem>
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
      <MessageList
        channelId={parsedChannelId}
        messages={messagesToDisplay}
        onReactionToggle={handleReactionToggle}
      />
    </ChannelShell>
  );
}

export default ChannelView;
