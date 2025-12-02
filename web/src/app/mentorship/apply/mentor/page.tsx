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

export default function MentorshipApplyMentorPage() {
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
  const [multiLineText, setMultiLineText] = useState("");
  const [whyInterestedOrder, setWhyInterestedOrder] = useState<string[]>([]);
  const [selectedCareerStages, setSelectedCareerStages] = useState<string[]>(
    [],
  );
  const [selectedMeetingFormats, setSelectedMeetingFormats] = useState<
    string[]
  >([]);
  const [desiredMentorHours, setDesiredMentorHours] = useState("");
  const [availableMentorHours, setAvailableMentorHours] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Aligned with server `appRouter.mentorship.createMentor`
  const createMentor = useMutation({
    mutationFn: async (
      input: Parameters<
        (typeof trpcClient.mentorship.createMentor)["mutate"]
      >[0],
    ) => trpcClient.mentorship.createMentor.mutate(input),
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
    if (resume?.status === "uploaded" && resume.fileId && !isSubmitted) {
      try {
        await trpcClient.files.deleteFile.mutate({
          fileId: resume.fileId,
        });
      } catch (error) {
        // Silently fail - cleanup is best effort
        console.error("Failed to cleanup unused resume:", error);
      }
    }
  }, [resume, isSubmitted, trpcClient]);

  const handleSubmit = useCallback(async () => {
    if (!userId) {
      setFormError("You must be logged in to submit this application.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    // Check if resume is still uploading
    if (resume?.status === "uploading") {
      setFormError("Please wait for the resume upload to complete.");
      setIsSubmitting(false);
      return;
    }

    // Check if resume upload failed
    if (resume?.status === "error") {
      setFormError("Please fix the resume upload error before submitting.");
      setIsSubmitting(false);
      return;
    }

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

      // Map career stages to backend enum (fix transitioning-soldiers -> transitioning)
      type PreferredMenteeCareerStage =
        | "new-soldiers"
        | "junior-ncos"
        | "senior-ncos"
        | "junior-officers"
        | "senior-officers"
        | "transitioning"
        | "no-preference";

      const preferredMenteeCareerStages:
        | PreferredMenteeCareerStage[]
        | undefined =
        selectedCareerStages.length > 0
          ? selectedCareerStages.map((stage) =>
              stage === "transitioning-soldiers"
                ? "transitioning"
                : (stage as PreferredMenteeCareerStage),
            )
          : undefined;

      const hoursPerMonthCommitment = (() => {
        if (!availableMentorHours) return undefined;
        const parsed = Number.parseInt(availableMentorHours, 10);
        return Number.isNaN(parsed) ? undefined : parsed;
      })();

      await createMentor.mutateAsync({
        userId,
        resumeFileId: resume?.status === "uploaded" ? resume.fileId : undefined,
        strengths: selectedQualities,
        personalInterests:
          selectedInterests.length > 0
            ? selectedInterests.join(", ")
            : undefined,
        whyInterestedResponses:
          whyInterestedOrder.length > 0 ? whyInterestedOrder : undefined,
        careerAdvice: multiLineText.trim() || undefined,
        preferredMenteeCareerStages,
        preferredMeetingFormat,
        hoursPerMonthCommitment,
      });

      setIsSubmitted(true);
      router.push("/mentorship/dashboard");
    } catch (error) {
      if (error instanceof TRPCClientError) {
        const message = error.message || "Failed to submit application.";

        if (message.includes("Mentor profile already exists for this user")) {
          setFormError(
            "You already have a mentor profile set up. Visit the mentorship dashboard to view it.",
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
  }, [
    userId,
    resume,
    selectedQualities,
    selectedInterests,
    whyInterestedOrder,
    multiLineText,
    selectedCareerStages,
    selectedMeetingFormats,
    availableMentorHours,
    createMentor,
    router,
  ]);

  // Cleanup unused resume on unmount
  useEffect(() => {
    return () => {
      void cleanupUnusedResume();
    };
  }, [cleanupUnusedResume]);

  const mentorQualityOptions: MultiSelectOption[] = [
    { label: "Adaptability", value: "adaptability" },
    { label: "Ambition", value: "ambition" },
    { label: "Authenticity", value: "authenticity" },
    { label: "Communication", value: "communication" },
    { label: "Confidence", value: "confidence" },
    { label: "Creativity", value: "creativity" },
    { label: "Curiosity", value: "curiosity" },
    { label: "Determination", value: "determination" },
    { label: "Discipline", value: "discipline" },
    { label: "Empathy", value: "empathy" },
    { label: "Enthusiasm", value: "enthusiasm" },
    { label: "Flexibility", value: "flexibility" },
    { label: "Generosity", value: "generosity" },
    { label: "Honesty", value: "honesty" },
    { label: "Humor", value: "humor" },
    { label: "Independence", value: "independence" },
    { label: "Intelligence", value: "intelligence" },
    { label: "Leadership", value: "leadership" },
    { label: "Motivation", value: "motivation" },
    { label: "Open-Mindedness", value: "open-mindedness" },
  ];

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

  const mentorCareerStageOptions: MultiSelectOption[] = [
    { label: "New soldiers/Entry Level (E-1 to E-4)", value: "new-soldiers" },
    { label: "Junior NCOs (E-5 to E-6)", value: "junior-ncos" },
    { label: "Senior NCOs (E-7 to E-9)", value: "senior-ncos" },
    { label: "Junior Officers (O-1 to O-3)", value: "junior-officers" },
    { label: "Senior Officers (O-4 and above)", value: "senior-officers" },
    {
      label: "Soldiers transitioning from active duty or civilian careers",
      value: "transitioning-soldiers",
    },
    { label: "No preference", value: "no-preference" },
  ];

  const mentorMeetingFormat: MultiSelectOption[] = [
    { label: "In-person", value: "in-person" },
    { label: "Online", value: "online" },
    { label: "No preference", value: "no-preference" },
  ];

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
            Mentor Onboarding Application
          </h1>
        </div>
        <h1 className="text-s sm:text-sm text-secondary mb-2">
          Thank you for your interest in mentoring. Give yourself 20-25 minutes
          to thoughtfully complete this application. Your responses are used to
          match you with potential mentees and will be shared with mentees who
          are interested in connecting.
        </h1>
        <h1 className="text-s sm:text-sm text-accent mb-6">
          *Required Information
        </h1>
      </section>

      <div className="flex flex-col items-start space-y-8">
        <section>
          <h1 className="mb-3 max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
            1. Upload a resume to share your educational and career history with
            potential mentees.
          </h1>
          <Dropzone
            className="mb-3 max-w-3xl"
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
          <span className="max-w-3xl text-left text-xs text-secondary sm:text-sm">
            2. Select your greatest personal and professional strengths.*{" "}
            <span className="text-accent">(Select up to 5)</span>
          </span>
          <MultiSelect
            name="mentorQualities"
            helperText=" "
            options={mentorQualityOptions}
            value={selectedQualities}
            onChange={setSelectedQualities}
            maxSelections={5}
          />
        </section>

        <section>
          <span className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
            3. What are your personal interests*{" "}
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
          <h1 className="mt-3 mb-3 max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
            4. What are you interested in becoming a mentor?
            <div className="italic font-normal text-secondary sm:text-sm mt-1">
              Rank the following reasons from most important (1) to least
              important (5).
            </div>
          </h1>
          <DragReorderFrame
            options={[
              {
                label:
                  "Support my mentee's career advancement and professional goal-setting within the National Guard",
                value: "career",
              },
              {
                label:
                  "Help my mentee navigate educational opportunities",
                value: "education",
              },
              {
                label:
                  "Build a strong sense of community within the National Guard",
                value: "community",
              },
              {
                label:
                  "Strengthen my professional network within the National Guard",
                value: "network",
              },
              {
                label:
                  "Connect with Guardsmen who have different perspectives and experiences",
                value: "diversity",
              },
            ]}
            onChange={setWhyInterestedOrder}
          />
        </section>

        <section>
          <h1 className="mb-3 mt-3 max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
            5. What is one piece of advice that you wish you had received
            earlier in your career?
          </h1>
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
          <span className="mb-3 max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
            6. Are there specific career stages that you would like to mentor?*{" "}
            <span className="text-yellow-600">(Select all that apply)</span>
          </span>
          <MultiSelect
            name="mentorCareerStages"
            helperText=" "
            options={mentorCareerStageOptions}
            value={selectedCareerStages}
            onChange={setSelectedCareerStages}
            maxSelections={7}
          />
        </section>

        <section>
          <span className="mb-3 max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
            7. What meeting formats do you prefer?*{" "}
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
          <h1 className="mb-3 mt-3 max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
            8. How much time would you like to spend with your mentor?*
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
        <section>
          <h1 className="mb-3 mt-3 max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
            9. How much time can you commit per month to mentoring?*{" "}
          </h1>
          <TextInput
            value={availableMentorHours}
            onChange={setAvailableMentorHours}
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
