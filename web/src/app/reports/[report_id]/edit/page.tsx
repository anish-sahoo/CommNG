"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReportCategory } from "@server/types/reports-types";
import { use, useId, useState, useEffect } from "react";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import { Modal } from "@/components/modal";
import { TextInput } from "@/components/text-input";
import { Button } from "@/components/ui/button";
import { useTRPCClient } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

const CATEGORY_OPTIONS: { label: string; value: ReportCategory }[] = [
    { label: "Communications", value: "Communication" },
    { label: "Mentorship", value: "Mentorship" },
    { label: "Training", value: "Training" },
    { label: "Resources", value: "Resources" },
    { label: "Logistics", value: "Logistics" },
];

const RemoveIcon = icons.clear;
const SuccessIcon = icons.done;

type EditReportPageProps = {
    params: Promise<{
        report_id: string;
    }>;
};

export default function EditReportPage({
    params,
}: EditReportPageProps) {
    const trpcClient = useTRPCClient();
    const queryClient = useQueryClient();
    const router = useRouter();

    const { report_id: reportId } = use(params);
    const { data: sessionData } = authClient.useSession();
    const userId = sessionData?.user?.id;

    const [category, setCategory] = useState<ReportCategory | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

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
            console.log("=== LOADING REPORT ===");
            console.log("reportId from URL:", reportId);
            console.log("typeof reportId:", typeof reportId);
            console.log("All reports:", reports);
            console.log("First report keys:", reports[0] ? Object.keys(reports[0]) : "no reports");

            const report = reports.find(
                (rep) => {
                    console.log("Comparing:", reportId, "===", reportId, "?", rep.id === reportId);
                    return rep.reportId === reportId;
                }
            );

            console.log("Found report:", report);

            if (report) {
                setTitle(report.title || "");
                setDescription(report.description || "");
                setCategory(report.category || null);
            } else {
                console.log("No report found!");
            }
        }
    }, [reports, reportId]);

    const isDirty = null;
        // Check category, title, description, attachments
        /*(initialChannelName !== null && channelName !== initialChannelName) ||
        (initialChannelDescription !== null &&
            channelDescription !== initialChannelDescription) ||
        (initialNotificationSetting !== null &&
            notificationSetting !== initialNotificationSetting);*/

    /* ============ UPDATING REPORTS ============ */

    const handleSaveChanges = async () => {
        if (!isDirty) return;
        try {
            // Update changes

            // Invalidate the cache to ensure the most recent data is used
            await queryClient.invalidateQueries({
                queryKey: ["reports"],
            });
            toast.success("Changes saved");
        } catch (error) {
            console.error("Failed to save settings: ", error);
            toast.error("Could not save settings. Please try again.");
        }
    };

    /* ============ CANCEL CHANGES TO REPORTS ============ */
    const handleCancel = async () => {

    }


    /* ============ CREATING THE EDIT REPORTS PAGE ============ */

    return (
        <TitleShell
            title={pageTitle}
            backHref={backHref}
            /*onBackClick={() => {
                if (isDirty) {
                    setShowUnsavedModal(true);
                } else {
                    router.push(backHref);
                }
            }}*/
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
                                    value={category || ""}
                                    onValueChange={(value) => setCategory(value as ReportCategory)}
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
                                    <span className="text-xs text-secondary/70">{title.length}/120</span>
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
                                    <span className="text-xs text-secondary/70">{description.length}/1000</span>
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

                        <div className="flex flex-wrap justify-end gap-3">
                            <Button
                                type="submit"
                                onClick={handleSaveChanges}
                                disabled={!isDirty}
                            >
                                Update Report</Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
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