"use client";
import { Paperclip } from "lucide-react";
import { useCallback, useState } from "react";
import { icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTRPCClient } from "@/lib/trpc";

type AttachmentDescriptor = {
  fileId: string;
  fileName: string;
  contentType?: string | null;
};

type PostedCardProps = {
  avatarUrl?: string;
  name: string;
  rank: string;
  content: string;
  attachments?: AttachmentDescriptor[];
};

const UserIcon = icons.user;

const Avatar = () => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary-dark/30 bg-neutral/20 text-primary">
    <UserIcon className="h-7 w-7" />
  </div>
);

export const PostedCard = ({
  name,
  rank,
  content,
  attachments,
}: PostedCardProps) => {
  const trpcClient = useTRPCClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleOpenAttachment = useCallback(
    async (fileId: string) => {
      setDownloadError(null);
      setDownloadingId(fileId);

      try {
        const response = await trpcClient.files.getFile.query({ fileId });
        if (!response?.data || typeof response.data !== "string") {
          throw new Error("Unable to retrieve file.");
        }

        window.open(response.data, "_blank", "noopener,noreferrer");
      } catch (error) {
        setDownloadError(
          error instanceof Error
            ? error.message
            : "Unable to open this attachment.",
        );
      } finally {
        setDownloadingId(null);
      }
    },
    [trpcClient],
  );

  const attachmentItems = attachments ?? [];

  return (
    <Card className="w-full p-4">
      <div className="flex items-center gap-4 px-6 py-4">
        <Avatar />
        <div className="flex flex-col gap-2 px-4 py-0 w-full">
          <div className="text-secondary text-subheader font-semibold">
            {name}
            <div className="text-secondary text-sm font-semibold italic">
              {rank}
            </div>
          </div>
          <div className="text-secondary text-sm font-normal">{content}</div>
          {attachmentItems.length ? (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-secondary/60">
                Attachments
              </div>
              <div className="flex flex-col gap-2">
                {attachmentItems.map((attachment) => (
                  <div
                    key={attachment.fileId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/80 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-secondary text-sm">
                      <Paperclip className="h-4 w-4 text-secondary/70" />
                      <span className="truncate">{attachment.fileName}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAttachment(attachment.fileId)}
                      disabled={downloadingId === attachment.fileId}
                    >
                      {downloadingId === attachment.fileId
                        ? "Opening…"
                        : "Open"}
                    </Button>
                  </div>
                ))}
              </div>
              {downloadError ? (
                <p className="text-xs text-destructive">{downloadError}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default PostedCard;
