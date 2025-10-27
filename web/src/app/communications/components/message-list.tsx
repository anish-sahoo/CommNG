import PostedCard from "@/components/posted-card";
import Reaction from "@/components/reaction-bubble";
import { AddReaction } from "@/components/reaction-bubble/add-reaction";

export type ChannelMessage = {
  id: number;
  authorName?: string | null;
  authorRank?: string | null;
  authorRole?: string | null;
  content: string;
  createdAt?: string | Date;
  attachmentUrl?: string | null;
  reactions?: {
    emoji: string;
    count: number;
    reactedByCurrentUser?: boolean;
  }[];
};

type MessageListProps = {
  messages: ChannelMessage[];
  onReactionToggle?: (params: {
    messageId: number;
    emoji: string;
    active: boolean;
  }) => void;
};

export function MessageList({ messages, onReactionToggle }: MessageListProps) {
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
        <div key={message.id} className="flex flex-col gap-2">
          <PostedCard
            name={message.authorName ?? "Unknown Member"}
            rank={message.authorRank ?? message.authorRole ?? ""}
            content={message.content}
            attachmentUrl={message.attachmentUrl ?? undefined}
          />
          {message.reactions?.length ? (
            <div className="flex flex-wrap items-center gap-2 pl-6 pr-4 sm:pl-8 sm:pr-0">
              {message.reactions.map((reaction, index) => (
                <Reaction
                  key={`${message.id}-${reaction.emoji}-${index}`}
                  emoji={reaction.emoji}
                  count={reaction.count}
                  initiallyActive={reaction.reactedByCurrentUser ?? false}
                  onToggle={(active) =>
                    onReactionToggle?.({
                      messageId: message.id,
                      emoji: reaction.emoji,
                      active,
                    })
                  }
                />
              ))}
              <AddReaction
                disabled={!onReactionToggle}
                onSelect={(emoji) =>
                  onReactionToggle?.({
                    messageId: message.id,
                    emoji,
                    active: true,
                  })
                }
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-6 pr-4 sm:pl-8 sm:pr-0">
              <AddReaction
                disabled={!onReactionToggle}
                onSelect={(emoji) =>
                  onReactionToggle?.({
                    messageId: message.id,
                    emoji,
                    active: true,
                  })
                }
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MessageList;
