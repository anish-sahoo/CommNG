"use client";
import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Paperclip } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  DropdownButtons,
  type DropdownMenuItemConfig,
} from "@/components/dropdown";
import { icons } from "@/components/icons";
import { Modal } from "@/components/modal";
import Reaction from "@/components/reaction-bubble";
import { AddReaction } from "@/components/reaction-bubble/add-reaction";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

type AttachmentDescriptor = {
  fileId: string;
  fileName: string;
  contentType?: string | null;
};

type MessageReaction = {
  emoji: string;
  count: number;
  reactedByCurrentUser?: boolean;
};

type PostedCardProps = {
  channelId: number;
  postId: number;
  avatarUrl?: string;
  name: string;
  rank: string;
  content: string;
  attachments?: AttachmentDescriptor[];
  reactions?: MessageReaction[];
  onReactionToggle?: (params: {
    messageId: number;
    emoji: string;
    active: boolean;
  }) => void;
};

const UserIcon = icons.user;

const Avatar = () => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary-dark/30 bg-neutral/20 text-primary">
    <UserIcon className="h-7 w-7" />
  </div>
);

export const PostedCard = ({
  channelId,
  postId,
  name,
  rank,
  content,
  attachments,
  reactions = [],
  onReactionToggle,
}: PostedCardProps) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const channelMessagesQueryKey = useMemo(() => {
    // TRPC builds a read-only tuple for each query; casting once keeps stable reference React Query can use for invalidations
    return trpc.comms.getChannelMessages.queryKey({
      channelId,
    });
  }, [channelId, trpc]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editError, setEditError] = useState<string | null>(null);
  const editPost = useMutation(trpc.comms.editPost.mutationOptions());

  const handleEditPost = useCallback(
    async (newContent: string) => {
      setEditError(null);

      editPost.mutate(
        {
          channelId: channelId,
          messageId: postId,
          content: newContent,
        },
        {
          onSuccess: async () => {
            await queryClient.invalidateQueries({
              queryKey: channelMessagesQueryKey,
            });
            setIsEditModalOpen(false);
          },
          onError: (error) => {
            setEditError(error.message);
          },
        },
      );
    },
    [channelId, postId, editPost, queryClient, channelMessagesQueryKey],
  );

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletePost = useMutation(trpc.comms.deletePost.mutationOptions());

  const handleDeletePost = useCallback(() => {
    setDeleteError(null);

    deletePost.mutate(
      {
        channelId: channelId,
        messageId: postId,
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: channelMessagesQueryKey,
          });
          setIsDeleteModalOpen(false);
        },
        onError: (error) => {
          setDeleteError(error.message);
        },
      },
    );
  }, [postId, channelId, deletePost, queryClient, channelMessagesQueryKey]);

  const attachmentItems = attachments ?? [];
  const maxLength = 5000;
  const characterCount = editContent.length;

  const handleDownloadFile = useCallback(
    async (fileId: string, fileName: string) => {
      try {
        const fileData = await trpcClient.files.getFile.query({ fileId });

        // The file service hands back a signed URL/string, so delegating to an <a> avoids buffering the blob in JS memory
        // Create a temporary anchor element to trigger download
        const link = document.createElement("a");
        link.href = fileData.data; // This is the S3 URL or data URL
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Failed to download file:", error);
      }
    },
    [trpcClient],
  );

  const actionMenuItems: DropdownMenuItemConfig[] = [
    {
      id: "edit-post",
      icon: "edit",
      label: "Edit",
      onClick: () => {
        setEditContent(content);
        setEditError(null);
        setIsEditModalOpen(true);
      },
      separator: true,
    },
    {
      id: "delete-post",
      icon: "trash" as const,
      label: "Delete",
      onClick: () => {
        setDeleteError(null);
        setIsDeleteModalOpen(true);
      },
    },
  ];

  const handleSaveEdit = async () => {
    if (editContent.trim().length === 0 || editPost.isPending) return;
    await handleEditPost(editContent);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setEditError(null);
    setIsEditModalOpen(false);
  };

  const handleCancelDelete = () => {
    setDeleteError(null);
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <Card className="relative w-full p-3 sm:p-4">
        <div className="absolute top-2 right-2 z-10 sm:top-4 sm:right-4">
          <DropdownButtons
            items={actionMenuItems}
            align="end"
            triggerAriaLabel="Post actions"
            triggerClassName="scale-90 sm:scale-100"
          />
        </div>
        <div className="flex items-start gap-4 px-2 pt-6 sm:px-4 sm:pt-4">
          <div className="flex justify-start sm:pt-2">
            <Avatar />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="text-secondary text-base font-semibold sm:text-subheader">
              {name}
              <div className="text-secondary text-xs font-semibold italic sm:text-sm">
                {rank}
              </div>
            </div>
            <div className="text-secondary text-sm font-normal break-words">
              {content}
            </div>

            {attachmentItems.length ? (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-secondary/60">
                  Attachments
                </div>
                <div className="flex flex-col gap-2">
                  {attachmentItems.map((attachment) => (
                    <button
                      type="button"
                      key={attachment.fileId}
                      onClick={() =>
                        handleDownloadFile(
                          attachment.fileId,
                          attachment.fileName,
                        )
                      }
                      className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-3 py-2 text-secondary text-sm hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <Paperclip className="h-4 w-4 text-secondary/70" />
                      <span className="truncate flex-1 text-left">
                        {attachment.fileName}
                      </span>
                      <Download className="h-4 w-4 text-secondary/70" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {reactions.length ? (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {reactions.map((reaction, index) => (
                  <Reaction
                    key={`${postId}-${reaction.emoji}-${index}`}
                    emoji={reaction.emoji}
                    count={reaction.count}
                    initiallyActive={reaction.reactedByCurrentUser ?? false}
                    onToggle={(active) =>
                      onReactionToggle?.({
                        messageId: postId,
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
                      messageId: postId,
                      emoji,
                      active: true,
                    })
                  }
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <AddReaction
                  disabled={!onReactionToggle}
                  onSelect={(emoji) =>
                    onReactionToggle?.({
                      messageId: postId,
                      emoji,
                      active: true,
                    })
                  }
                />
              </div>
            )}

            {deleteError ? (
              <p className="text-xs text-destructive">{deleteError}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <Modal
        open={isEditModalOpen}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            handleCancelEdit();
          } else {
            setIsEditModalOpen(newOpen);
          }
        }}
        title="Edit Post"
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={editPost.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={
                editContent.trim().length === 0 ||
                editPost.isPending ||
                characterCount > maxLength
              }
            >
              {editPost.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit your post..."
            className="min-h-32 resize-none"
            maxLength={maxLength}
            disabled={editPost.isPending}
          />
          <div className="flex justify-between items-center">
            <div>
              {editError ? (
                <p className="text-xs text-destructive">{editError}</p>
              ) : null}
            </div>
            <span
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

      <Modal
        open={isDeleteModalOpen}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            handleCancelDelete();
          } else {
            setIsDeleteModalOpen(newOpen);
          }
        }}
        title="Delete Post"
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deletePost.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeletePost}
              disabled={deletePost.isPending}
            >
              {deletePost.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-secondary">
            Are you sure you want to delete this post? This action cannot be
            undone.
          </p>
          {deleteError ? (
            <p className="text-xs text-destructive">{deleteError}</p>
          ) : null}
        </div>
      </Modal>
    </>
  );
};

export default PostedCard;
