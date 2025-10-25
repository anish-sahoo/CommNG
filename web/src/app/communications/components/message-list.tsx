import { icons } from "@/components/icons";
import PostedCard from "@/components/posted-card";
import Reaction from "@/components/reaction-bubble";
import { Button } from "@/components/ui/button";

export type ChannelMessage = {
  id: number;
  authorName?: string | null;
  authorRank?: string | null;
  authorRole?: string | null;
  content: string;
  createdAt?: string | Date;
  reactions?: { emoji: string; count: number }[];
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
          />
          {message.reactions?.length ? (
            <div className="flex flex-wrap items-center gap-2 pl-6 pr-4 sm:pl-8 sm:pr-0">
              {message.reactions.map((reaction, index) => (
                <Reaction
                  key={`${message.id}-${reaction.emoji}-${index}`}
                  emoji={reaction.emoji}
                  count={reaction.count}
                  onToggle={(active) =>
                    onReactionToggle?.({
                      messageId: message.id,
                      emoji: reaction.emoji,
                      active,
                    })
                  }
                />
              ))}
              <AddReactionButton />
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-6 pr-4 sm:pl-8 sm:pr-0">
              <AddReactionButton />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddReactionButton() {
  const PlusIcon = icons.add;
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 rounded-full px-3 text-primary hover:text-primary-foreground"
      type="button"
      aria-label="Add reaction"
    >
      <PlusIcon className="h-4 w-4" />
    </Button>
  );
}

export default MessageList;
