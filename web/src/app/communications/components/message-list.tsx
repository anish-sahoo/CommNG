"use client";

import PostedCard from "@/components/posted-card";

export type ChannelMessage = {
  id: number;
  authorName?: string | null;
  authorRank?: string | null;
  authorRole?: string | null;
  authorImage?: string | null;
  content: string;
  createdAt?: string | Date;
  attachments?: {
    fileId: string;
    fileName: string;
    contentType?: string | null;
  }[];
  reactions?: {
    emoji: string;
    count: number;
    reactedByCurrentUser?: boolean;
  }[];
};

type MessageListProps = {
  channelId: number;
  messages: ChannelMessage[];
  onReactionToggle?: (params: {
    messageId: number;
    emoji: string;
    active: boolean;
  }) => void;
};

export function MessageList({
  channelId,
  messages,
  onReactionToggle,
}: MessageListProps) {
  if (!messages.length) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/40 bg-card/60 p-10 text-center text-secondary/70">
        No messages yet. Be the first to start the conversation.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 overflow-x-hidden">
      {messages.map((message) => (
        <PostedCard
          key={message.id}
          channelId={channelId}
          postId={message.id}
          avatarUrl={message.authorImage}
          name={message.authorName ?? "Unknown Member"}
          rank={message.authorRank ?? message.authorRole ?? ""}
          content={message.content}
          attachments={message.attachments}
          reactions={message.reactions}
          onReactionToggle={onReactionToggle}
        />
      ))}
    </div>
  );
}

export default MessageList;
