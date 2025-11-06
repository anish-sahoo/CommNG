"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Modal, type ModalProps } from "./index";

export type CreatePostModalProps = Omit<
  ModalProps,
  "title" | "children" | "footer"
> & {
  onPost: (content: string) => void | Promise<void>;
  maxLength?: number;
  isPosting?: boolean;
  initialContent?: string;
};

export function CreatePostModal({
  open,
  onOpenChange,
  onPost,
  maxLength = 5000,
  isPosting = false,
  initialContent = "",
}: CreatePostModalProps) {
  const [content, setContent] = useState(initialContent);
  const characterCount = content.length;
  const textareaId = useId();
  const counterId = `${textareaId}-counter`;

  const handlePost = async () => {
    if (content.trim().length === 0 || isPosting) return;
    await onPost(content);
    setContent("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setContent(initialContent);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleCancel();
        } else {
          onOpenChange(newOpen);
        }
      }}
      title="Create Post"
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isPosting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handlePost}
            disabled={
              content.trim().length === 0 ||
              isPosting ||
              characterCount > maxLength
            }
          >
            {isPosting ? "Posting…" : "Create Post"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <label htmlFor={textareaId} className="sr-only">
          Post content
        </label>
        <Textarea
          id={textareaId}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-32 resize-none"
          maxLength={maxLength}
          disabled={isPosting}
          aria-describedby={counterId}
        />
        <div className="flex justify-end">
          <span
            id={counterId}
            className={`text-sm ${
              characterCount > maxLength
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {characterCount}/{maxLength}
          </span>
        </div>
      </div>
    </Modal>
  );
}
