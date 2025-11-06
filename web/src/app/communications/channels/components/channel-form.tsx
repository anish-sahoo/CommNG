"use client";

import { useCallback, useMemo, useState } from "react";
import { TextInput } from "@/components/text-input";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { useTRPCClient } from "@/lib/trpc";

export type CreateChannelValues = {
  title: string;
  blurb: string;
  imageSrc?: string;
  imageFileId?: string;
  hasUploadingPhoto?: boolean;
  hasErroredPhoto?: boolean;
};

interface Props {
  onSubmit: (values: CreateChannelValues) => void;
  submitting: boolean;
  error?: string | null;
}

export function CreateChannelForm({ onSubmit, submitting, error }: Props) {
  const trpcClient = useTRPCClient();

  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");

  const [photo, setPhoto] = useState<{
    id: string;
    file: File;
    status: "uploading" | "uploaded" | "error";
    fileId?: string;
    storedName?: string;
    error?: string;
  } | null>(null);

  const uploadChannelPhoto = useCallback(
    async (id: string, file: File) => {
      setPhoto({ id, file, status: "uploading" });
      try {
        const presign = await trpcClient.files.createPresignedUpload.mutate({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        });

        const res = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!res.ok) throw new Error("Upload failed.");

        await trpcClient.files.confirmUpload.mutate({
          fileId: presign.fileId,
          fileName: file.name,
          storedName: presign.storedName,
          contentType: file.type || undefined,
        });

        setPhoto({
          id,
          file,
          status: "uploaded",
          fileId: presign.fileId,
          storedName: presign.storedName,
        });
      } catch (e) {
        setPhoto({
          id,
          file,
          status: "error",
          error: e instanceof Error ? e.message : "Upload error.",
        });
      }
    },
    [trpcClient],
  );

  const handleDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return;
      const file = accepted[0];
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      void uploadChannelPhoto(id, file);
    },
    [uploadChannelPhoto],
  );

  const handleRemovePhoto = () => setPhoto(null);

  const hasUploadingPhoto = photo?.status === "uploading";
  const hasErroredPhoto = photo?.status === "error";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      blurb,
      imageSrc: undefined,
      imageFileId: photo?.fileId,
      hasUploadingPhoto,
      hasErroredPhoto,
    });
  };

  const formatStatus = useMemo(() => {
    if (!photo) return "";
    if (photo.status === "uploading") return "Uploading…";
    if (photo.status === "uploaded") return "Ready";
    if (photo.status === "error") return "Upload failed";
    return "";
  }, [photo]);

  return (
    <form
      className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-subheader text-secondary">
            Title
          </label>
          <TextInput
            value={title}
            onChange={setTitle}
            placeholder="Title..."
            maxLength={50}
            showCharCount={false as unknown as undefined}
          />
          <div className="mt-0.5 text-right text-xs text-secondary/60">
            {title.length}/{50}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="channel-desc"
            className="text-sm font-medium text-secondary"
          >
            Description
          </label>
          <TextInput
            id="channel-desc"
            value={blurb}
            onChange={setBlurb}
            placeholder="Description..."
            multiline
            rows={8}
            maxLength={1200}
            disabled={submitting}
            showCharCount={false as unknown as undefined}
          />
          <div className="self-end text-xs text-secondary/60">
            {blurb.length}/1200
          </div>
        </div>

        <div className="space-y-3">
          <label
            htmlFor="channel-photo"
            className="text-subheader text-secondary"
          >
            Channel Photo
          </label>
          <Dropzone
            onDrop={handleDrop}
            src={photo ? [photo.file] : []}
            maxFiles={1}
            disabled={submitting || hasUploadingPhoto}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          {photo && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-secondary">
                  {photo.file.name}
                </span>
                <span className="text-xs text-secondary/70">
                  {formatStatus}
                </span>
                {photo.status === "error" && photo.error ? (
                  <span className="text-xs text-destructive">
                    {photo.error}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                  disabled={photo.status === "uploading"}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-secondary/60">
            Recommended: 1200×800, JPG or PNG.
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          disabled={
            submitting || hasUploadingPhoto || title.trim().length === 0
          }
        >
          {submitting ? "Creating…" : "Create Channel"}
        </Button>
      </div>
    </form>
  );
}
