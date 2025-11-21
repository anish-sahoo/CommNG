"use client";

import type { ReportCategory } from "@server/types/reports-types";
import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import { TextInput } from "@/components/text-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { Spinner } from "@/components/ui/spinner";
import { useUserRoles } from "@/hooks/useUserRoles";
import { authClient } from "@/lib/auth-client";
import { hasRole } from "@/lib/rbac";
import { useTRPCClient } from "@/lib/trpc";
import type { RoleKey } from "@/types/roles";

const CATEGORY_OPTIONS: { label: string; value: ReportCategory }[] = [
  { label: "Communications", value: "Communication" },
  { label: "Mentorship", value: "Mentorship" },
  { label: "Training", value: "Training" },
  { label: "Resources", value: "Resources" },
  { label: "Logistics", value: "Logistics" },
];

const MAX_ATTACHMENTS = 10;
const REPORTING_CREATE_ROLE = "reporting:create" as RoleKey;

type AttachmentState = {
  id: string;
  file: File;
  status: "uploading" | "uploaded" | "error";
  fileId?: string;
  error?: string;
};

const RemoveIcon = icons.clear;
const SuccessIcon = icons.done;

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const precision = unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

const createLocalId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function CreateReportPage() {
  const router = useRouter();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { data: sessionData } = authClient.useSession();
  const userId = sessionData?.user?.id ?? null;
  const {
    roles,
    isLoading: rolesLoading,
    isError: rolesRequestFailed,
    refetch: refetchRoles,
  } = useUserRoles();

  const normalizedRoles = useMemo<RoleKey[]>(() => {
    return Array.isArray(roles) ? (roles as RoleKey[]) : [];
  }, [roles]);

  const hasCreateAccess = useMemo(() => {
    if (!roles) return false;
    return hasRole(normalizedRoles, REPORTING_CREATE_ROLE);
  }, [roles, normalizedRoles]);

  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<AttachmentState[]>([]);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const dropzoneFiles = useMemo(
    () =>
      attachments.length
        ? attachments.map((attachment) => attachment.file)
        : undefined,
    [attachments],
  );
  const categoryId = useId();
  const categoryLabelId = useId();
  const titleId = useId();
  const descriptionId = useId();

  type CreateReportInput = Parameters<
    typeof trpcClient.reports.createReport.mutate
  >[0];

  const createReport = useMutation({
    mutationFn: async (input: CreateReportInput) => {
      return await trpcClient.reports.createReport.mutate(input);
    },
  });

  const reportsQueryKey = useMemo<QueryKey | null>(() => {
    if (!userId) return null;
    return ["reports", userId];
  }, [userId]);

  const hasUploadingAttachments = useMemo(
    () => attachments.some((attachment) => attachment.status === "uploading"),
    [attachments],
  );

  const hasAttachmentErrors = useMemo(
    () => attachments.some((attachment) => attachment.status === "error"),
    [attachments],
  );

  const attachmentsAtLimit = attachments.length >= MAX_ATTACHMENTS;

  const uploadAttachment = useCallback(
    async (attachmentId: string, file: File) => {
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
          throw new Error("We couldn't upload that file. Please try again.");
        }

        await trpcClient.files.confirmUpload.mutate({
          fileId: presign.fileId,
          fileName: file.name,
          storedName: presign.storedName,
          contentType: file.type || undefined,
        });

        setAttachments((prev) =>
          prev.map((attachment) =>
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
        const message =
          error instanceof Error
            ? error.message
            : "We couldn't upload that file.";
        setAttachments((prev) =>
          prev.map((attachment) =>
            attachment.id === attachmentId
              ? { ...attachment, status: "error", error: message }
              : attachment,
          ),
        );
      }
    },
    [trpcClient],
  );

  const handleAttachmentDrop = useCallback(
    (acceptedFiles: File[]) => {
      setAttachmentNotice(null);
      if (!acceptedFiles.length) return;

      const availableSlots = MAX_ATTACHMENTS - attachments.length;
      if (availableSlots <= 0) {
        setAttachmentNotice(
          `You can upload up to ${MAX_ATTACHMENTS} attachments.`,
        );
        return;
      }

      const filesToUpload = acceptedFiles.slice(0, availableSlots);
      const newEntries = filesToUpload.map((file) => ({
        id: createLocalId(),
        file,
        status: "uploading" as const,
      }));

      setAttachments((prev) => [...prev, ...newEntries]);
      newEntries.forEach((entry) => {
        void uploadAttachment(entry.id, entry.file);
      });

      if (acceptedFiles.length > filesToUpload.length) {
        setAttachmentNotice(
          `Only ${availableSlots} more attachment${
            availableSlots === 1 ? "" : "s"
          } can be added right now.`,
        );
      }
    },
    [attachments.length, uploadAttachment],
  );

  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== attachmentId),
    );
    setAttachmentNotice(null);
  }, []);

  const handleRetryAttachment = useCallback(
    (attachmentId: string) => {
      let fileToRetry: File | null = null;
      setAttachments((prev) =>
        prev.map((attachment) => {
          if (attachment.id === attachmentId) {
            fileToRetry = attachment.file;
            return { ...attachment, status: "uploading", error: undefined };
          }
          return attachment;
        }),
      );

      if (fileToRetry) {
        void uploadAttachment(attachmentId, fileToRetry);
      }
    },
    [uploadAttachment],
  );

  const handleCancel = useCallback(() => {
    router.push("/reports");
  }, [router]);

  const pageTitle = (
    <span className="block truncate text-[1.5rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
      Create Report
    </span>
  );

  const isSubmitting = createReport.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!userId) {
      setFormError("Sign in to create a report.");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setFormError("Report title is required.");
      return;
    }

    if (!trimmedDescription) {
      setFormError("Description is required.");
      return;
    }

    if (hasUploadingAttachments) {
      setFormError("Please wait for attachments to finish uploading.");
      return;
    }

    if (hasAttachmentErrors) {
      setFormError("Remove or retry attachments with errors.");
      return;
    }

    try {
      await createReport.mutateAsync({
        category: category ?? undefined,
        title: trimmedTitle,
        description: trimmedDescription,
        attachments: attachments
          .filter(
            (attachment) =>
              attachment.status === "uploaded" && attachment.fileId,
          )
          .map((attachment) => attachment.fileId as string),
        submittedBy: userId,
      });

      toast.success("Report created.");
      if (reportsQueryKey) {
        await queryClient.invalidateQueries({
          queryKey: reportsQueryKey,
        });
      }
      router.push("/reports");
    } catch (error) {
      if (error instanceof TRPCClientError) {
        const zodMessage =
          error.data?.zodError?.fieldErrors?.title?.[0] ??
          error.data?.zodError?.fieldErrors?.description?.[0] ??
          error.data?.zodError?.formErrors?.[0];

        if (zodMessage) {
          setFormError(zodMessage);
          return;
        }

        if (error.message.includes("Not enough permission")) {
          setFormError("You do not have permission to create reports.");
          return;
        }

        if (error.message.toLowerCase().includes("invalid uuid")) {
          setFormError(
            "We couldn't verify your account. Refresh the page and try again.",
          );
          return;
        }

        setFormError(
          "We couldn't create your report right now. Please try again shortly.",
        );
        return;
      }

      if (error instanceof Error) {
        setFormError(
          "We couldn't create your report right now. Please try again shortly.",
        );
        return;
      }

      setFormError(
        "We couldn't create your report right now. Please try again shortly.",
      );
    }
  };

  return (
    <TitleShell
      title={pageTitle}
      backHref="/reports"
      backAriaLabel="Back to reports"
      scrollableContent={false}
    >
      {!userId ? (
        <section className="rounded-2xl border border-border bg-card p-6 text-secondary shadow-sm">
          Sign in to create a report.
        </section>
      ) : rolesRequestFailed ? (
        <section className="rounded-2xl border border-border bg-card p-6 text-secondary shadow-sm">
          <p className="text-sm">
            We couldn&apos;t verify your permissions just yet.
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-primary underline"
            onClick={() => refetchRoles()}
          >
            Try again
          </button>
        </section>
      ) : rolesLoading ? (
        <section className="rounded-2xl border border-border bg-card p-6 text-secondary shadow-sm">
          Checking your permissions…
        </section>
      ) : !hasCreateAccess ? (
        <section className="rounded-2xl border border-border bg-card p-6 text-secondary shadow-sm">
          You don&apos;t have permission to create reports yet. Reach out to an
          administrator if you believe this is an error.
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-6">
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label
                    id={categoryLabelId}
                    htmlFor={categoryId}
                    className="block text-sm font-medium text-secondary"
                  >
                    Category{" "}
                    <span className="text-xs font-normal text-secondary/70">
                      (Optional)
                    </span>
                  </label>
                  <Select
                    onValueChange={(value) =>
                      setCategory(value as ReportCategory)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id={categoryId}
                      className="w-full"
                      aria-labelledby={categoryLabelId}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor={titleId}
                      className="text-sm font-medium text-secondary"
                    >
                      Report Title <span className="text-error">*</span>
                    </label>
                    <span className="text-xs text-secondary/70">
                      {title.length}/120
                    </span>
                  </div>
                  <TextInput
                    id={titleId}
                    value={title}
                    onChange={setTitle}
                    placeholder="Title..."
                    maxLength={120}
                    showCharCount={false}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor={descriptionId}
                      className="text-sm font-medium text-secondary"
                    >
                      Description <span className="text-error">*</span>
                    </label>
                    <span className="text-xs text-secondary/70">
                      {description.length}/1000
                    </span>
                  </div>
                  <TextInput
                    id={descriptionId}
                    multiline
                    rows={6}
                    value={description}
                    onChange={setDescription}
                    placeholder="Description..."
                    maxLength={1000}
                    showCharCount={false}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm font-medium text-secondary">
                    Attachments{" "}
                    <span className="text-xs font-normal text-secondary/70">
                      (Optional)
                    </span>
                  </div>
                </div>

                <Dropzone
                  onDrop={handleAttachmentDrop}
                  disabled={attachmentsAtLimit || isSubmitting}
                  src={dropzoneFiles}
                  multiple
                  maxFiles={Math.max(1, MAX_ATTACHMENTS - attachments.length)}
                  aria-label="Upload report attachments"
                >
                  <DropzoneEmptyState />
                  <DropzoneContent />
                </Dropzone>
                {attachmentsAtLimit ? (
                  <p className="text-xs text-secondary/70">
                    You&apos;ve added the maximum number of attachments.
                  </p>
                ) : null}
                {attachmentNotice ? (
                  <p className="text-xs text-error">{attachmentNotice}</p>
                ) : null}

                {attachments.length > 0 ? (
                  <ul className="space-y-3">
                    {attachments.map((attachment) => {
                      const statusText =
                        attachment.status === "uploaded"
                          ? "Ready to submit"
                          : attachment.status === "uploading"
                            ? "Uploading…"
                            : (attachment.error ??
                              "Upload failed. Remove or try again.");
                      const statusClass =
                        attachment.status === "error"
                          ? "text-errir"
                          : "text-secondary/70";
                      return (
                        <li
                          key={attachment.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-secondary">
                              {attachment.file.name}
                            </p>
                            <p className="text-xs text-secondary/60">
                              {formatFileSize(attachment.file.size)}
                            </p>
                            <p className={`text-xs ${statusClass}`}>
                              {statusText}
                            </p>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            {attachment.status === "uploading" ? (
                              <Spinner className="text-secondary" />
                            ) : attachment.status === "uploaded" ? (
                              <SuccessIcon className="h-4 w-4 text-primary" />
                            ) : null}
                            {attachment.status === "error" ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRetryAttachment(attachment.id)
                                }
                                disabled={isSubmitting}
                              >
                                Retry
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                handleRemoveAttachment(attachment.id)
                              }
                              disabled={isSubmitting}
                              aria-label={`Remove ${attachment.file.name}`}
                            >
                              <RemoveIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-secondary/70">
                    No attachments added yet.
                  </p>
                )}
              </div>

              {formError ? (
                <p className="text-sm text-error">{formError}</p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !title.trim() || !description.trim()
                  }
                >
                  {isSubmitting ? "Submitting…" : "Submit"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </section>
      )}
    </TitleShell>
  );
}
