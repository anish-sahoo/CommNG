"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/text-input";
import { useTRPC } from "@/lib/trpc";
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

export default function NewChannelPostPlaceholder({
  params,
}: NewChannelPostPageProps) {
  const ArrowLeftIcon = icons.arrowLeft;
  const resolvedParams = use(params);
  const channelId = resolvedParams.channel_id;
  const router = useRouter();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const parsedChannelId = parseChannelId(channelId);

  const createPost = useMutation(trpc.comms.createPost.mutationOptions());
  const [multiLineText, setMultiLineText] = useState<string>("");
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const channelMessagesQueryKey = useMemo<QueryKey | null>(() => {
    if (parsedChannelId === null) {
      return null;
    }
    return trpc.comms.getChannelMessages.queryKey({
      channelId: parsedChannelId,
    }) as unknown as QueryKey;
  }, [parsedChannelId, trpc]);

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedContent = multiLineText.trim();
    const trimmedAttachment = attachmentUrl.trim();

    if (!trimmedContent.length) {
      setSubmissionError("Post content cannot be empty.");
      return;
    }

    setSubmissionError(null);

    createPost.mutate(
      {
        channelId: parsedChannelId,
        content: trimmedContent,
        attachmentUrl: trimmedAttachment.length ? trimmedAttachment : undefined,
      },
      {
        onSuccess: async () => {
          if (channelMessagesQueryKey) {
            await queryClient.invalidateQueries({
              queryKey: channelMessagesQueryKey,
            });
          }

          setMultiLineText("");
          setAttachmentUrl("");
          router.push(`/communications/${channelId}`);
        },
        onError: (error) => {
          setSubmissionError(error.message);
        },
      }
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
          <TextInput
            value={attachmentUrl}
            onChange={(value) => setAttachmentUrl(value)}
            placeholder="Attachment URL (optional)"
            maxLength={2048}
            borderColor="text-primary"
          />

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
            disabled={createPost.isPending || multiLineText.trim().length === 0}
          >
            {createPost.isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>
    </ChannelShell>
  );
}
