"use client";

import type { EmojiClickData } from "emoji-picker-react";
import { EmojiStyle, Theme } from "emoji-picker-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { icons } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AddReactionProps {
  disabled?: boolean;
  onSelect(emoji: string): void;
  className?: string;
}

const Add = icons.add;

const EmojiPicker = dynamic(
  async () => {
    const mod = await import("emoji-picker-react");
    return mod.default;
  },
  { ssr: false },
);

export function AddReaction({
  disabled,
  onSelect,
  className,
}: AddReactionProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setOpen(false);
    onSelect(emojiData.emoji);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Add reaction"
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-primary transition hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-40",
            className,
          )}
          disabled={disabled}
        >
          <Add className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        sideOffset={6}
        align="start"
        className="w-[320px] border border-neutral-200 bg-white p-2"
      >
        <EmojiPicker
          className="comm-emoji-picker"
          onEmojiClick={handleEmojiClick}
          emojiStyle={EmojiStyle.APPLE}
          theme={Theme.LIGHT}
          skinTonesDisabled
          searchDisabled
          previewConfig={{ showPreview: false }}
          searchPlaceholder="Search reactions"
          autoFocusSearch={false}
          lazyLoadEmojis
          width="100%"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
