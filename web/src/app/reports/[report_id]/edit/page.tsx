"use client";

import type { ReportCategory } from "@server/data/db/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use, useEffect, useId, useMemo, useState } from "react";
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
    const userId = sessionData?.user?.id;
    const {
        roles,
        //isLoading: rolesLoading,
        //isError: rolesRequestFailed,
        //refetch: refetchRoles,
    } = useUserRoles();

    const normalizedRoles = useMemo<RoleKey[]>(() => {
        return Array.isArray(roles) ? (roles as RoleKey[]) : [];
    }, [roles]);

    const hasAssignAccess = useMemo(() => {
        if (!roles) return false;
        return hasRole(normalizedRoles, REPORTING_ASSIGN_ROLE);
    }, [roles, normalizedRoles]);

    const [category, setCategory] = useState<ReportCategory | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedTo, setAssignedTo] = useState<string | null>(null);
    const [updatedAt, setUpdatedAt] = useState<string | number | Date | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState("");


    const [initialCategory, setInitialCategory] = useState<ReportCategory | null>(
        null,
    );
    const [initialTitle, setInitialTitle] = useState<string | null>(null);
    const [initialDescription, setInitialDescription] = useState<string | null>(
        null,
    );
    const [initialAssignedTo, setInitialAssignedTo] = useState<string | null>(null); // seems like nowhere to get assigned to in reports


    const categoryId = useId();
    const categoryLabelId = useId();
    const titleId = useId();
    const descriptionId = useId();
    const backHref = `/reports` as const;
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    const pageTitle = (
        <span className="block truncate text-[1.5rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Edit Report
        </span>
    );

    /* ============ GETTING INFO FROM REPORTS ============ */
    // Fetch all reports
    const { data: reports } = useQuery({
        queryKey: ["reports", userId],
        queryFn: async () => {
            return await trpcClient.reports.getReports.query({ name: userId });
        },
    });

    // Find report ID
    useEffect(() => {
        if (reports) {
            const report = reports.find((rep) => {
                return rep.reportId === reportId;
            });

            if (report) {
                setTitle(report.title || "");
                setDescription(report.description || "");
                setCategory(report.category || null);
                setUpdatedAt(report.updatedAt || null);

                setInitialTitle((prev) => prev ?? (report.title || ""));
                setInitialDescription((prev) => prev ?? (report.description || ""));
                setInitialCategory((prev) => prev ?? (report.category || null));
            } else {
                console.log("No report found!");
            }
        }
    }, [reports, reportId]);

    const isDirty =
        // Check category, title, description, ATTACHMENTS (TODO)
        (initialTitle !== null && title !== initialTitle) ||
        (initialDescription !== null && description !== initialDescription) ||
        (initialCategory !== null && category !== initialCategory) ||
        (assignedTo !== initialAssignedTo);

    const { data: users } = useQuery({
        queryKey: ["users", searchQuery],
        queryFn: async () => {
            return await trpcClient.user.searchUsers.query({
                name: searchQuery
            });
        },
        enabled: searchQuery.length >= 2,
    });

    /* ============ UPDATING REPORTS ============ */

    const handleSaveChanges = async () => {
        if (!isDirty) return;
        try {
            // Update changes
            await trpcClient.reports.updateReport.mutate({
                reportId: reportId,
                updates: {
                    category: category,
                    title: title,
                    description: description,
                    attachments: [],
                },
            });

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

                            <Dropzone multiple aria-label="Upload report attachments">
                                <DropzoneEmptyState />
                                <DropzoneContent />
                            </Dropzone>

                            <p className="text-xs text-secondary/70">
                                No attachments added yet.
                            </p>
                        </div>

                        {hasAssignAccess && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-secondary">
                                    Assign To{" "}
                                </label>
                                <Select
                                    value={assignedTo || ""}
                                    onValueChange={setAssignedTo}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a user to assign..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div
                                            className="p-2"
                                            onKeyDown={(e) => e.stopPropagation()}
                                        >
                                            <TextInput
                                                placeholder="Search users..."
                                                value={searchQuery}
                                                onChange={(value) => {
                                                    console.log("Search query changed:", value);
                                                    setSearchQuery(value);
                                                }}
                                                className="mb-2"
                                                autoFocus
                                            />
                                        </div>
                                        {users && users.length > 0 ? (
                                            users.map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))
                                        ) : searchQuery.length >= 2 ? (
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
                            </div>
                        )}

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
                    <p className="mt-4 text-right text-xs text-secondary/70" suppressHydrationWarning>
                        Last edited: {updatedAt && new Date(updatedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })} {updatedAt && new Date(updatedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        }).replace(':', '')} EST
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
                            onClick={() => {
                                setShowUnsavedModal(false);
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
