"use client";

import type { ReportCategory } from "@server/data/db/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import { Modal } from "@/components/modal";
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
];

const MAX_ATTACHMENTS = 10;
const REPORTING_ASSIGN_ROLE = "reporting:assign" as RoleKey;

// Attachments that were previously added
type ExistingAttachment = {
  fileId: string;
  fileName: string;
  contentType?: string;
};

// Attachments the user adds while editing
type NewAttachment = {
  id: string;
  file: File;
  status: "uploading" | "uploaded" | "error";
  fileId?: string;
  error?: string;
};

// Includes fields of both existing and new attachments
type DisplayAttachment = {
  id: string;
  fileName: string;
  fileId?: string;
  file?: File;
  status: "existing" | "uploading" | "uploaded" | "error";
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

type EditReportPageProps = {
  params: Promise<{
    report_id: string;
  }>;
};

export default function EditReportPage({ params }: EditReportPageProps) {
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { report_id: reportId } = use(params);
  const { data: sessionData } = authClient.useSession();
  const userId = sessionData?.user.id ?? null;

  const pageTitle = (
    <span className="block truncate text-[1.5rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
      Edit Report
    </span>
  );
  const backHref = `/reports` as const;
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* REPORTS VALUES */
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);
  const [updatedAt, setUpdatedAt] = useState<string | number | Date | null>(
    null,
  );
  const [existingAttachments, setExistingAttachments] = useState<
    ExistingAttachment[]
  >([]);
  const [newAttachments, setNewAttachments] = useState<NewAttachment[]>([]);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);

  const [initialCategory, setInitialCategory] = useState<ReportCategory | null>(
    null,
  );
  const [initialTitle, setInitialTitle] = useState<string | null>(null);
  const [initialDescription, setInitialDescription] = useState<string | null>(
    null,
  );
  const [initialAssignedTo, setInitialAssignedTo] = useState<
    string | undefined
  >(undefined);
  const [initialExistingAttachments, setInitialExistingAttachments] = useState<
    ExistingAttachment[]
  >([]);

  const categoryId = useId();
  const categoryLabelId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const assignedToId = useId();

  /* === SEARCH FOR USER === */
  const { roles } = useUserRoles();

  const normalizedRoles = useMemo<RoleKey[]>(() => {
    return Array.isArray(roles) ? (roles as RoleKey[]) : [];
  }, [roles]);

  const hasAssignAccess = useMemo(() => {
    if (!roles) return false;
    return hasRole(normalizedRoles, REPORTING_ASSIGN_ROLE);
  }, [roles, normalizedRoles]);

  const [searchQuery, setSearchQuery] = useState("");
  const [relevantUsersQuery, setRelevantUsersQuery] = useState(searchQuery);

  /* === ATTACHMENTS === */
  // Combine the new and existing attachments
  const allAttachments = useMemo<DisplayAttachment[]>(() => {
    const existingAsDisplay: DisplayAttachment[] = existingAttachments.map(
      (att) => ({
        id: att.fileId,
        fileName: att.fileName,
        fileId: att.fileId,
        status: "existing" as const,
      }),
    );

    const newAsDisplay: DisplayAttachment[] = newAttachments.map((att) => ({
      id: att.id,
      fileName: att.file.name,
      fileId: att.fileId,
      file: att.file,
      status: att.status,
      error: att.error,
    }));

    return [...existingAsDisplay, ...newAsDisplay];
  }, [existingAttachments, newAttachments]);

  const dropzoneFiles = useMemo(
    () =>
      newAttachments.length
        ? newAttachments.map((attachment) => attachment.file)
        : undefined,
    [newAttachments],
  );

  const hasUploadingAttachments = useMemo(
    () =>
      newAttachments.some((attachment) => attachment.status === "uploading"),
    [newAttachments],
  );

  const hasAttachmentErrors = useMemo(
    () => newAttachments.some((attachment) => attachment.status === "error"),
    [newAttachments],
  );

  const attachmentsAtLimit =
    existingAttachments.length + newAttachments.length >= MAX_ATTACHMENTS;

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

        setNewAttachments((prev) =>
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
        setNewAttachments((prev) =>
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

  const removeFile = useCallback(
    async (fileId: string) => {
      try {
        await trpcClient.files.deleteFile.mutate({
          fileId: fileId,
        });
      } catch (error) {
        console.error("Failed to delete attachment:", error);
      }
    },
    [trpcClient],
  );

  const handleAttachmentDrop = useCallback(
    (acceptedFiles: File[]) => {
      setAttachmentNotice(null);
      if (!acceptedFiles.length) return;

      const availableSlots =
        MAX_ATTACHMENTS - (existingAttachments.length + newAttachments.length);
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

      setNewAttachments((prev) => [...prev, ...newEntries]);
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
    [existingAttachments.length, newAttachments.length, uploadAttachment],
  );

  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setNewAttachments((prev) => {
      const target = prev.find((att) => att.id === attachmentId);

      if (target?.status === "uploaded" && target.fileId) {
        const fileIdToDelete = target.fileId;
        setFilesToDelete((files) => [...files, fileIdToDelete]);
      }

      return prev.filter((att) => att.id !== attachmentId);
    });

    setAttachmentNotice(null);
  }, []);

  const handleRemoveExistingAttachment = useCallback((fileId: string) => {
    setExistingAttachments((prev) =>
      prev.filter((att) => att.fileId !== fileId),
    );

    setFilesToDelete((prev) => [...prev, fileId]);
  }, []);

  const handleRetryAttachment = useCallback(
    (attachmentId: string) => {
      let fileToRetry: File | null = null;
      setNewAttachments((prev) =>
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

  const removeUnsavedFiles = useCallback(async () => {
    const uploadedNewFiles = newAttachments
      .filter((att) => att.status === "uploaded" && att.fileId)
      .map((att) => att.fileId as string);

    if (uploadedNewFiles.length > 0) {
      await Promise.all(uploadedNewFiles.map((fileId) => removeFile(fileId)));
    }
  }, [newAttachments, removeFile]);

  /* ============ GETTING INFO FROM REPORTS + SETTING EXISTING VALUES ============ */
  // Fetch all reports
  const { data: reports } = useQuery({
    queryKey: ["reports", userId],
    queryFn: async () => {
      return await trpcClient.reports.getReports.query({ name: userId });
    },
  });

  // Find report ID - use a ref to track if we've initialized
  const initRef = useRef(false);

  // Set existing values
  useEffect(() => {
    if (reports && !initRef.current) {
      const report = reports.find((rep) => {
        return rep.reportId === reportId;
      });

      if (report) {
        initRef.current = true;
        setTitle(report.title || "");
        setDescription(report.description || "");
        setCategory(report.category || null);
        setUpdatedAt(report.updatedAt || null);
        if (report.attachments) {
          const existing: ExistingAttachment[] = report.attachments.map(
            (att) => ({
              fileId: att.fileId,
              fileName: att.fileName,
            }),
          );
          setExistingAttachments(existing);
          setInitialExistingAttachments(existing);
        }
        if (report.status === "Assigned" && report.assignedTo) {
          setAssignedTo(report.assignedTo);
          setInitialAssignedTo(report.assignedTo);
        }

        setInitialTitle(report.title || "");
        setInitialDescription(report.description || "");
        setInitialCategory(report.category || null);
      }
    }
  }, [reports, reportId]);

  // Check if user has made edits
  const isDirty =
    (initialTitle !== null && title !== initialTitle) ||
    (initialDescription !== null && description !== initialDescription) ||
    (initialCategory !== null && category !== initialCategory) ||
    assignedTo !== initialAssignedTo ||
    newAttachments.length > 0 ||
    existingAttachments.length !== initialExistingAttachments.length;

  /* ============ SEARCH FOR USERS ============ */
  // Add a delay to avoid flickering
  useEffect(() => {
    const handler = setTimeout(() => setRelevantUsersQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Search whenever relevantUsersQuery changes
  const { data: users = [], isFetching } = useQuery({
    queryKey: ["users", relevantUsersQuery],
    queryFn: async () => {
      return await trpcClient.user.searchUsers.query({
        name: relevantUsersQuery,
      });
    },
    enabled: relevantUsersQuery.length >= 2,
  });

  // Fetch the assigned user when report loads
  const { data: assignedUser } = useQuery({
    queryKey: ["assignedUser", assignedTo],
    queryFn: async () => {
      if (!assignedTo) {
        return null;
      }
      try {
        const userData = await trpcClient.user.getUserData.query({
          user_id: assignedTo,
        });
        return userData;
      } catch (error) {
        console.error("Error fetching assigned user:", error);
        throw error;
      }
    },
    enabled: !!assignedTo,
    staleTime: Infinity,
    retry: 0,
    throwOnError: false,
    gcTime: Infinity,
  });

  /* ============ UPDATING REPORTS ============ */

  const handleSaveChanges = async () => {
    if (!isDirty) return;
    setFormError(null);

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
      const allFileIds = [
        ...existingAttachments.map((att) => att.fileId),
        ...newAttachments
          .filter((att) => att.status === "uploaded" && att.fileId)
          .map((att) => att.fileId as string),
      ];

      // Update db with changes
      await trpcClient.reports.updateReport.mutate({
        reportId: reportId,
        updates: {
          category: category,
          title: title,
          description: description,
          attachments: allFileIds,
          status: assignedTo !== null ? "Assigned" : "Pending",
        },
      });

      // Update db to reflect a user has been assigned
      if (assignedTo !== undefined) {
        await trpcClient.reports.assignReport.mutate({
          reportId: reportId,
          assigneeId: assignedTo,
          assignedBy: userId,
        });
      } else {
        // Update db to reflect unassigned report
        await trpcClient.reports.unassignReport.mutate({
          reportId: reportId,
        });
      }

      if (filesToDelete.length > 0) {
        await Promise.all(filesToDelete.map((fileId) => removeFile(fileId)));
      }

      // Invalidate the cache to ensure the most recent data is used
      await queryClient.invalidateQueries({
        queryKey: ["reports"],
      });
      toast.success("Changes saved");

      // Return to the main reports page
      router.push(backHref);
    } catch (error) {
      console.error("Failed to save this report: ", error);
      toast.error("Could not save this report. Please try again.");
    }
  };

  /* ============ CANCEL CHANGES TO REPORTS ============ */

  const handleCancel = async () => {
    await removeUnsavedFiles();

    // Return to the main reports page
    router.push(backHref);
  };

  /* ============ CREATING THE EDIT REPORTS PAGE ============ */

  return (
    <TitleShell
      title={pageTitle}
      backHref={backHref}
      onBackClick={() => {
        if (isDirty) {
          setShowUnsavedModal(true);
        } else {
          router.push(backHref);
        }
      }}
      backAriaLabel="Back to reports"
      scrollableContent={false}
    >
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-6">
          <form className="space-y-8">
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
                  key={`${reportId}-${category}`}
                  value={category || ""}
                  onValueChange={(value) =>
                    setCategory(value as ReportCategory)
                  }
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
                  placeholder="Title..."
                  maxLength={120}
                  showCharCount={false}
                  value={title}
                  onChange={setTitle}
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
                disabled={attachmentsAtLimit}
                src={dropzoneFiles}
                multiple
                maxFiles={Math.max(1, MAX_ATTACHMENTS - allAttachments.length)}
                aria-label="Upload report attachments"
              >
                <DropzoneEmptyState />
                <DropzoneContent />
              </Dropzone>

              {attachmentsAtLimit && (
                <p className="text-xs text-secondary/70">
                  You&apos;ve added the maximum number of attachments.
                </p>
              )}
              {attachmentNotice && (
                <p className="text-xs text-error">{attachmentNotice}</p>
              )}

              {allAttachments.length > 0 ? (
                <ul className="space-y-3">
                  {allAttachments.map((attachment) => {
                    let statusText: string;
                    if (attachment.status === "existing")
                      statusText = "Uploaded";
                    else if (attachment.status === "uploaded")
                      statusText = "Ready to submit";
                    else if (attachment.status === "uploading")
                      statusText = "Uploading…";
                    else
                      statusText =
                        attachment.error ??
                        "Upload failed. Remove or try again.";

                    const statusClass =
                      attachment.status === "error"
                        ? "text-error"
                        : "text-secondary/70";

                    return (
                      <li
                        key={attachment.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-secondary">
                            {attachment.fileName}
                          </p>
                          {attachment.file && (
                            <p className="text-xs text-secondary/60">
                              {formatFileSize(attachment.file.size)}
                            </p>
                          )}
                          <p className={`text-xs ${statusClass}`}>
                            {statusText}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {attachment.status === "uploading" ? (
                            <Spinner className="text-secondary" />
                          ) : attachment.status === "uploaded" ||
                            attachment.status === "existing" ? (
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
                            >
                              Retry
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              if (attachment.status === "existing") {
                                handleRemoveExistingAttachment(
                                  attachment.fileId,
                                );
                              } else {
                                handleRemoveAttachment(attachment.id);
                              }
                            }}
                            aria-label={`Remove ${attachment.fileName}`}
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

            {hasAssignAccess && (
              <div className="space-y-2">
                <label
                  htmlFor={assignedToId}
                  className="block text-sm font-medium text-secondary"
                >
                  Assign To
                </label>
                <div className="relative w-full">
                  <Select
                    value={assignedTo ?? undefined}
                    onValueChange={(value) => {
                      // Only update if it's a real user ID (not empty string)
                      if (value && value.length > 0) {
                        setAssignedTo(value);
                      }
                    }}
                  >
                    <SelectTrigger id={assignedToId} className="w-full min-w-0">
                      <div className="flex-1 text-left min-w-0 truncate">
                        {assignedUser
                          ? `${assignedUser.name} (${assignedUser.email})`
                          : assignedTo
                            ? "Loading user..."
                            : "Select a user to assign..."}
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <TextInput
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={setSearchQuery}
                          className="mb-2"
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>

                      {isFetching ? (
                        <div className="p-2 text-sm text-secondary/70">
                          Searching...
                        </div>
                      ) : users.length > 0 ? (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))
                      ) : relevantUsersQuery.length >= 2 ? (
                        <div className="p-2 text-sm text-secondary/70">
                          No users found
                        </div>
                      ) : (
                        <div className="p-2 text-sm text-secondary/70">
                          Type to search users...
                        </div>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Clear button with absolute positioning - outside Select */}
                  {assignedUser && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setAssignedTo(undefined);
                      }}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-secondary/70 hover:text-secondary transition-colors z-10"
                      aria-label="Remove assigned user"
                    >
                      <RemoveIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
            {formError ? (
              <p className="text-sm text-error">{formError}</p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                onClick={handleSaveChanges}
                disabled={!isDirty}
              >
                Update Report
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
          <p
            className="mt-4 text-right text-xs text-secondary/70"
            suppressHydrationWarning
          >
            Last edited:{" "}
            {updatedAt && (
              <>
                {new Date(updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "America/New_York",
                })}{" "}
                {new Date(updatedAt)
                  .toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "America/New_York",
                  })
                  .replace(":", "")}{" "}
                ET
              </>
            )}
          </p>
        </div>
      </section>
      <Modal
        open={showUnsavedModal}
        onOpenChange={setShowUnsavedModal}
        title="Unsaved changes"
        description="You have unsaved changes. Are you sure you want to leave this page?"
        className="max-w-[92vw] w-[420px] p-6 pt-8 sm:p-7 sm:pt-10 space-y-6 [&>div:first-child]:space-y-3 [&>div:first-child>h2]:text-2xl [&>div:first-child>h2]:leading-snug [&>div:first-child>p]:leading-relaxed [&>div:first-child>p]:text-base"
        footer={
          <div className="flex w-full flex-col-reverse gap-4 sm:flex-row sm:justify-end sm:gap-5 mt-3">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => setShowUnsavedModal(false)}
              aria-label="Stay on this page"
            >
              Stay on page
            </Button>
            <Button
              type="button"
              className="h-11"
              onClick={async () => {
                setShowUnsavedModal(false);
                await removeUnsavedFiles();
                router.push(backHref);
              }}
              aria-label="Leave without saving"
            >
              Leave without saving
            </Button>
          </div>
        }
      />
    </TitleShell>
  );
}
