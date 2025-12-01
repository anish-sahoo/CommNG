"use client";

import { useMutation } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SelectableButton } from "@/components/buttons";
import { DragReorderFrame } from "@/components/drag-and-drop";
import { icons } from "@/components/icons";
import { MultiSelect, type MultiSelectOption } from "@/components/multi-select";
import { TextInput } from "@/components/text-input";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";

type ResumeState = null | {
  file: File;
  status: "uploading" | "uploaded" | "error";
  fileId?: string;
  error?: string;
};

//Static arrays for select options
const mentorInterestOptions: MultiSelectOption[] = [
  { label: "Music", value: "music" },
  { label: "Creative Arts", value: "creative-arts" },
  { label: "Outdoor Activities", value: "outdoor-activities" },
  { label: "Gaming and Entertainment", value: "gaming-and-entertainment" },
  { label: "Cooking and Baking", value: "cooking-and-baking" },
  {
    label: "Volunteering and Community Involvement",
    value: "volunteering-and-community-involvement",
  },
  { label: "DIY and Crafts", value: "diy-and-crafts" },
  { label: "Team Sports", value: "team-sports" },
  { label: "Personal Fitness", value: "personal-fitness" },
];

const mentorQualitiesOptions: MultiSelectOption[] = [
  { label: "Strong communicator", value: "strong-communicator" },
  { label: "Encouraging and empathetic", value: "encouraging-and-empathetic" },
  { label: "Experienced leader", value: "experienced-leader" },
  { label: "Creative problem-solver", value: "creative-problem-solver" },
  { label: "Honest and authentic", value: "honest-and-authentic" },
  { label: "Motivated and amibitious", value: "motivated-and-ambitious" },
  {
    label: "Open-minded and approachable",
    value: "open-minded-and-approachable",
  },
];

const mentorMeetingFormat: MultiSelectOption[] = [
  { label: "In-person", value: "in-person" },
  { label: "Online", value: "online" },
  { label: "No preference", value: "no-preference" },
];

export default function MentorshipApplyMenteePage() {
  const trpcClient = useTRPCClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: sessionData } = authClient.useSession();
  const userId = sessionData?.user?.id ?? null;
  const backHref = useMemo(
    () =>
      searchParams.get("from") === "dashboard"
        ? "/mentorship/dashboard"
        : "/mentorship",
    [searchParams],
  );
  const BackIcon = icons.arrowLeft;

  const [resume, setResume] = useState<ResumeState>(null);
  const [selectedQualities, setSelectedQualities] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedMeetingFormats, setSelectedMeetingFormats] = useState<
    string[]
  >([]);
  const [hopeToGainOrder, setHopeToGainOrder] = useState<string[]>([]);
  const [multiLineText, setMultiLineText] = useState("");
  const [desiredMentorHours, setDesiredMentorHours] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aligned with server `appRouter.mentorship.createMentee`
  const createMentee = useMutation({
    mutationFn: async (
      input: Parameters<typeof trpcClient.mentorship.createMentee.mutate>[0],
    ) => trpcClient.mentorship.createMentee.mutate(input),
  });

  const uploadResume = useCallback(
    async (file: File) => {
      setResume({
        file,
        status: "uploading",
      });

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

        setResume({
          file,
          status: "uploaded",
          fileId: presign.fileId,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "We couldn't upload that file.";
        setResume({
          file,
          status: "error",
          error: message,
        });
      }
    },
    [trpcClient],
  );

  const cleanupUnusedResume = useCallback(async () => {
    // Only cleanup if resume was uploaded but form was not submitted
    if (resume?.status === "uploaded" && resume.fileId) {
      try {
        await trpcClient.files.deleteFile.mutate({
          fileId: resume.fileId,
        });
      } catch (error) {
        // Silently fail - cleanup is best effort
        console.error("Failed to cleanup unused resume:", error);
      }
    }
  }, [resume, trpcClient]);

  const handleSubmit = async () => {
    if (!userId) {
      setFormError("You must be logged in to submit this application.");
      return;
    }

    // Block submit if resume is in a bad state
    if (resume?.status === "uploading") {
      setFormError("Please wait for the resume upload to complete.");
      return;
    }

    if (resume?.status === "error") {
      setFormError("Please fix the resume upload error before submitting.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      // Map meeting formats to backend enum
      const preferredMeetingFormat =
        selectedMeetingFormats.length > 0
          ? ((selectedMeetingFormats[0] === "online"
              ? "virtual"
              : selectedMeetingFormats[0]) as
              | "in-person"
              | "virtual"
              | "hybrid"
              | "no-preference")
          : undefined;

      const hoursPerMonthCommitment = (() => {
        if (!desiredMentorHours) return undefined;
        const parsed = Number.parseInt(desiredMentorHours, 10);
        return Number.isNaN(parsed) ? undefined : parsed;
      })();

      await createMentee.mutateAsync({
        userId,
        resumeFileId: resume?.status === "uploaded" ? resume.fileId : undefined,
        personalInterests:
          selectedInterests.length > 0
            ? selectedInterests.join(", ")
            : undefined,
        roleModelInspiration: multiLineText.trim() || undefined,
        hopeToGainResponses:
          hopeToGainOrder.length > 0 ? hopeToGainOrder : undefined,
        mentorQualities:
          selectedQualities.length > 0 ? selectedQualities : undefined,
        preferredMeetingFormat,
        hoursPerMonthCommitment,
      });

      router.push("/mentorship/dashboard");
    } catch (error) {
      if (error instanceof TRPCClientError) {
        const message = error.message || "Failed to submit application.";

        if (message.includes("Mentee profile already exists for this user")) {
          setFormError(
            "You already have a mentee profile set up. Visit the mentorship dashboard to view it.",
          );
        } else {
          setFormError(message);
        }
      } else if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Failed to submit application. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup unused resume on unmount
  useEffect(() => {
    return () => {
      void cleanupUnusedResume();
    };
  }, [cleanupUnusedResume]);

  return (
    <div className="flex flex-col flex-wrap w-full relative items-left justify-center sm:gap-16 px-8 sm:px-10 lg:px-20 py-10 mx-4">
      <section className="flex flex-col items-left space-y-8">
        <div className="flex items-center gap-3 mt-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-accent hover:underline"
            aria-label="Back"
          >
            <BackIcon className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-semibold text-secondary sm:text-4xl lg:text-5xl">
            Mentee Onboarding Application
          </h1>
        </div>
        <h1 className="text-s sm:text-sm text-secondary mb-2">
          Thank you for your interest in the mentorship program. Give yourself
          enough time to thoughtfully complete this application. Your responses
          will help us match you with a mentor who can best support your goals.
        </h1>
        <h1 className="text-s sm:text-sm text-accent mb-6">
          *Required Information
        </h1>
      </section>

      <div className="flex flex-col items-start space-y-8">
        <section>
          <h1 className="max-w-3xl mb-3 text-left text-xs font-large text-secondary sm:text-sm">
            1. Upload a resume to share with mentors once matched.
          </h1>
          <Dropzone
            className="max-w-3xl mb-3"
            onDrop={(files) => {
              if (files.length > 0) {
                void uploadResume(files[0]);
              }
            }}
            src={resume ? [resume.file] : undefined}
            maxFiles={1}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </section>

        <section>
          <span className="max-w-3xl mb-3 text-left text-xs font-large text-secondary sm:text-sm">
            2. What are your personal interests*{" "}
            <span className="text-accent">(Select all that apply)</span>
          </span>
          <MultiSelect
            name="mentorInterests"
            helperText=" "
            options={mentorInterestOptions}
            value={selectedInterests}
            onChange={setSelectedInterests}
            maxSelections={9}
          />
        </section>

        <section>
          <div className="max-w-3xl mt-3 mb-3 text-left text-xs font-large text-secondary sm:text-sm">
            3. Who has been an important role model or source of inspiration for
            you, and why?
          </div>
          <TextInput
            value={multiLineText}
            onChange={setMultiLineText}
            placeholder="Enter your response..."
            multiline={true}
            rows={6}
            maxLength={500}
            showCharCount={true}
            className="border-primary bg-neutral-100"
            counterColor="text-primary"
          />
        </section>

        <section>
          <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mt-3 mb-3">
            4. What do you hope to get out of the mentorship program?
            <div className="italic font-normal text-secondary sm:text-sm mt-1">
              Rank the following reasons from most important (1) to least
              important (5).
            </div>
          </h1>
          <DragReorderFrame
            options={[
              {
                label:
                  "Receive guidance on career advancement and professional goals (National Guard career)",
                value: "career",
              },
              {
                label:
                  "Get support discovering educational opportunities (Education)",
                value: "education",
              },
              {
                label:
                  "Develop a sense of belonging in the National Guard community (Community)",
                value: "community",
              },
              {
                label:
                  "Expand my professional network within the National Guard (Network)",
                value: "network",
              },
              {
                label:
                  "Connect with Guardsmen with different perspectives and experiences (Diversity)",
                value: "diversity",
              },
            ]}
            onChange={setHopeToGainOrder}
          />
        </section>

        <section>
          <span className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mb-3">
            5. What qualities do you look for in a mentor?*{" "}
            <span className="text-accent">(Select up to 3)</span>
          </span>
          <MultiSelect
            name="mentorQualities"
            helperText=" "
            options={mentorQualitiesOptions}
            value={selectedQualities}
            onChange={setSelectedQualities}
            maxSelections={3}
          />
        </section>

        <section>
          <span className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mt-3">
            6. What meeting formats work best for you?*{" "}
            <span className="text-accent">(Select all that apply)</span>
          </span>
          <MultiSelect
            name="mentorMeetingFormats"
            helperText=" "
            options={mentorMeetingFormat}
            value={selectedMeetingFormats}
            onChange={setSelectedMeetingFormats}
            maxSelections={3}
          />
        </section>

        <section>
          <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mb-3 mt-3">
            7. How much time would you like to spend with your mentor?*
          </h1>
          <TextInput
            value={desiredMentorHours}
            onChange={setDesiredMentorHours}
            placeholder="Hours per Month"
            showCharCount={false}
            className="border-neutral "
            counterColor="#CDCDCD"
          />
        </section>

        <div className="flex flex-col gap-2">
          {formError && (
            <p className="text-sm text-red-600 mb-2">{formError}</p>
          )}
          <SelectableButton
            text={isSubmitting ? "Submitting..." : "Submit"}
            className="mb-4 bg-accent text-white"
            onClick={handleSubmit}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
