"use client";

import { useCallback, useId, useMemo, useState } from "react";
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

type PhotoState = null | {
  id: string;
  file: File;
  status: "uploading" | "uploaded" | "error";
  fileId?: string;
  storedName?: string;
  error?: string;
};

export function CreateChannelForm({ onSubmit, submitting, error }: Props) {
  const trpcClient = useTRPCClient();

  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");

  const [photo, setPhoto] = useState<PhotoState>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const titleId = useId();
  const blurbId = useId();

  const hasUploadingPhoto = photo?.status === "uploading";
  const hasErroredPhoto = photo?.status === "error";

  const formatFileSize = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const formatStatus = useMemo(() => {
    if (!photo) return "";
    switch (photo.status) {
      case "uploading":
        return "Uploading…";
      case "uploaded":
        return "Ready to attach";
      case "error":
        return "Upload failed";
      default:
        return "";
    }
  }, [photo]);

  const uploadChannelPhoto = useCallback(
    async (id: string, file: File) => {
      setPhoto({ id, file, status: "uploading", error: undefined });
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
        if (!res.ok) throw new Error("File upload failed. Please try again.");

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
          error:
            e instanceof Error
              ? e.message
              : "Something went wrong uploading this image.",
        });
      }
    },
    [trpcClient],
  );

  const handleDrop = useCallback(
    (accepted: File[]) => {
      setPhotoError(null);
      if (!accepted.length) return;
      const file = accepted[0];

      if (!file.type?.startsWith("image/")) {
        setPhotoError("Please upload an image file.");
        return;
      }

      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      void uploadChannelPhoto(id, file);
    },
    [uploadChannelPhoto],
  );

  const handleRetryPhoto = useCallback(() => {
    if (!photo?.file) return;
    const id = photo.id ?? crypto.randomUUID?.() ?? `${Date.now()}`;
    void uploadChannelPhoto(id, photo.file);
  }, [photo, uploadChannelPhoto]);

  const handleRemovePhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      blurb,
      imageSrc: undefined,
      imageFileId: photo?.status === "uploaded" ? photo.fileId : undefined,
      hasUploadingPhoto,
      hasErroredPhoto,
    });
  };

  return (
    <form
      className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label
            htmlFor="title"
            id="channel-title"
            className="text-subheader text-secondary"
          >
            Title
          </label>
          <TextInput
            id={titleId}
            value={title}
            onChange={setTitle}
            placeholder="Title..."
            maxLength={50}
            showCharCount={false}
            disabled={submitting}
          />
          <div className="mt-0.5 text-right text-xs text-secondary/60">
            {title.length}/{50}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor={blurbId}
            className="text-sm font-medium text-secondary"
          >
            Description
          </label>
          <TextInput
            id={blurbId}
            value={blurb}
            onChange={setBlurb}
            placeholder="Description..."
            multiline
            rows={8}
            maxLength={1200}
            disabled={submitting}
            showCharCount={false}
          />
          <div className="self-end text-xs text-secondary/60">
            {blurb.length}/1200
          </div>
        </div>

        <div className="space-y-3">
          <p id="channel-photo-label" className="text-subheader text-secondary">
            Channel Photo <span className="text-secondary/50">(optional)</span>
          </p>

          <Dropzone
            aria-labelledby="channel-photo-label"
            accept={{ "image/*": [] }}
            maxFiles={1}
            onDrop={handleDrop}
            onError={(err) => setPhotoError(err.message ?? "Upload error.")}
            src={photo ? [photo.file] : []}
            disabled={submitting || hasUploadingPhoto}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          {photoError && (
            <p className="text-sm text-destructive">{photoError}</p>
          )}

          {photo && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-secondary">
                  {photo.file.name}
                </span>
                <span className="text-xs text-secondary/70">
                  {formatFileSize(photo.file.size)} • {formatStatus}
                </span>
                {photo.status === "error" && photo.error ? (
                  <span className="text-xs text-destructive">
                    {photo.error}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {photo.status === "error" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRetryPhoto}
                  >
                    Retry
                  </Button>
                ) : null}
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
