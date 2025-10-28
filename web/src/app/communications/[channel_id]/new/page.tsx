"use client";

import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useMemo, useState } from "react";
import { icons } from "@/components/icons";
import { TextInput } from "@/components/text-input";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { ChannelShell } from "../../components";

type NewChannelPostPageProps = {
  params: Promise<{ channel_id: string }>;
};

function parseChannelId(channelId: string): number | null {
  const numericId = Number(channelId);
  if (Number.isNaN(numericId) || numericId <= 0) {
    return null;
  }
  return numericId;
}

export default function NewChannelPostPage({
  params,
}: NewChannelPostPageProps) {
  const ArrowLeftIcon = icons.arrowLeft;
  const resolvedParams = use(params);
  const channelId = resolvedParams.channel_id;
  const router = useRouter();

  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const parsedChannelId = parseChannelId(channelId);

  const createPost = useMutation(trpc.comms.createPost.mutationOptions());
  const [multiLineText, setMultiLineText] = useState<string>("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  type AttachmentItem = {
    id: string;
    file: File;
    status: "uploading" | "uploaded" | "error";
    fileId?: string;
    error?: string;
  };

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  const channelMessagesQueryKey = useMemo<QueryKey | null>(() => {
    if (parsedChannelId === null) {
      return null;
    }
    return trpc.comms.getChannelMessages.queryKey({
      channelId: parsedChannelId,
    }) as unknown as QueryKey;
  }, [parsedChannelId, trpc]);

  const hasUploadingAttachments = attachments.some(
    (attachment) => attachment.status === "uploading",
  );
  const hasErroredAttachments = attachments.some(
    (attachment) => attachment.status === "error",
  );

  const uploadFile = useCallback(
    async (attachmentId: string, file: File) => {
      setAttachments((previous) =>
        previous.map((attachment) =>
          attachment.id === attachmentId
            ? { ...attachment, status: "uploading", error: undefined }
            : attachment,
        ),
      );

      try {
        const presign = await trpcClient.files.createPresignedUpload.mutate({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        });

        const uploadResponse = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("File upload failed. Please try again.");
        }

        await trpcClient.files.confirmUpload.mutate({
          fileId: presign.fileId,
          fileName: file.name,
          storedName: presign.storedName,
          contentType: file.type || undefined,
        });

        setAttachments((previous) =>
          previous.map((attachment) =>
            attachment.id === attachmentId
              ? {
                  ...attachment,
                  status: "uploaded",
                  fileId: presign.fileId,
                  error: undefined,
                }
              : attachment,
          ),
        );
      } catch (error) {
        setAttachments((previous) =>
          previous.map((attachment) =>
            attachment.id === attachmentId
              ? {
                  ...attachment,
                  status: "error",
                  fileId: undefined,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Something went wrong uploading this file.",
                }
              : attachment,
          ),
        );
      }
    },
    [trpcClient],
  );

  const handleRetryAttachment = useCallback(
    (attachmentId: string) => {
      const attachment = attachments.find((item) => item.id === attachmentId);
      if (!attachment) {
        return;
      }
      uploadFile(attachmentId, attachment.file);
    },
    [attachments, uploadFile],
  );

  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setAttachments((previous) =>
      previous.filter((attachment) => attachment.id !== attachmentId),
    );
  }, []);

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      setAttachmentError(null);

      if (!acceptedFiles.length) {
        return;
      }

      const remainingSlots = Math.max(0, 10 - attachments.length);
      const filesToProcess = acceptedFiles.slice(0, remainingSlots);

      if (filesToProcess.length < acceptedFiles.length) {
        setAttachmentError("You can only attach up to 10 files per post.");
      }

      filesToProcess.forEach((file) => {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;

        setAttachments((previous) => [
          ...previous,
          {
            id,
            file,
            status: "uploading",
          },
        ]);

        void uploadFile(id, file);
      });
    },
    [attachments.length, uploadFile],
  );

  if (parsedChannelId === null) {
    return (
      <ChannelShell
        title={
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/communications"
              className="inline-flex h-12 w-12 items-center justify-center text-accent transition hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-14 sm:w-14"
              aria-label="Back to channels"
            >
              <ArrowLeftIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            </Link>
            <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
              Create New Post
            </span>
          </div>
        }
      >
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
          Invalid channel identifier. Please return to the channel list and try
          again.
        </div>
      </ChannelShell>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (!Number.isFinite(bytes)) {
      return "0 B";
    }
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedContent = multiLineText.trim();

    if (!trimmedContent.length) {
      setSubmissionError("Post content cannot be empty.");
      return;
    }

    if (hasUploadingAttachments) {
      setSubmissionError("Please wait for all file uploads to finish.");
      return;
    }

    if (hasErroredAttachments) {
      setSubmissionError("Please resolve failed uploads or remove them.");
      return;
    }

    setSubmissionError(null);

    const uploadedFileIds = attachments
      .filter(
        (attachment): attachment is AttachmentItem & { fileId: string } =>
          attachment.status === "uploaded" && Boolean(attachment.fileId),
      )
      .map((attachment) => attachment.fileId);

    createPost.mutate(
      {
        channelId: parsedChannelId,
        content: trimmedContent,
        attachmentFileIds: uploadedFileIds.length ? uploadedFileIds : undefined,
      },
      {
        onSuccess: async () => {
          if (channelMessagesQueryKey) {
            await queryClient.invalidateQueries({
              queryKey: channelMessagesQueryKey,
            });
          }

          setMultiLineText("");
          setAttachments([]);
          router.push(`/communications/${channelId}`);
        },
        onError: (error) => {
          setSubmissionError(error.message);
        },
      },
    );
  };

  return (
    <ChannelShell
      title={
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={`/communications/${channelId}`}
            className="inline-flex h-12 w-12 items-center justify-center text-accent transition hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-14 sm:w-14"
            aria-label="Back to channels"
          >
            <ArrowLeftIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </Link>
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Create New Post
          </span>
        </div>
      }
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="space-y-4 p-3">
          <TextInput
            value={multiLineText}
            onChange={(value) => setMultiLineText(value)}
            placeholder="Share an update with your channel..."
            multiline={true}
            rows={10}
            maxLength={5000}
            showCharCount={true}
            borderColor="text-primary"
            counterColor="text-primary"
          />
          <div className="space-y-3">
            <Dropzone
              onDrop={handleDrop}
              onError={(error) => setAttachmentError(error.message)}
              src={attachments.map((attachment) => attachment.file)}
              maxFiles={10}
              disabled={createPost.isPending || hasUploadingAttachments}
            >
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>

            {attachmentError && (
              <p className="text-sm text-destructive">{attachmentError}</p>
            )}

            {attachments.length > 0 ? (
              <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex flex-wrap items-center gap-3 justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-secondary">
                        {attachment.file.name}
                      </span>
                      <span className="text-xs text-secondary/70">
                        {formatFileSize(attachment.file.size)}
                      </span>
                      {attachment.status === "uploading" ? (
                        <span className="text-xs text-primary">Uploading…</span>
                      ) : null}
                      {attachment.status === "uploaded" ? (
                        <span className="text-xs text-primary">
                          Ready to attach
                        </span>
                      ) : null}
                      {attachment.status === "error" ? (
                        <span className="text-xs text-destructive">
                          {attachment.error ??
                            "Upload failed. Please try again."}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {attachment.status === "error" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryAttachment(attachment.id)}
                        >
                          Retry
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        disabled={attachment.status === "uploading"}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {submissionError && (
            <p className="text-sm text-destructive">{submissionError}</p>
          )}
        </div>
        <div className="flex p-3 items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/communications/${channelId}`)}
            disabled={createPost.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              createPost.isPending ||
              multiLineText.trim().length === 0 ||
              hasUploadingAttachments ||
              hasErroredAttachments
            }
          >
            {createPost.isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>
    </ChannelShell>
  );
}
