"use client";

import { useState } from "react";
import { SingleSelectButtonGroup } from "@/components/button-single-select";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { MultiSelect, type MultiSelectOption } from "@/components/multi-select";
import { TextInput } from "@/components/text-input";
import { DragReorderFrame } from "@/components/drag-and-drop";

export default function MentorshipApplyMentorPage() {
  const [selected, setSelected] = useState<string>("");
  const [files, setFiles] = useState<File[] | undefined>();
  const [selectedQualities, setSelectedQualities] = useState<string[]>([]);

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

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

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

  const [multiLineText, setMultiLineText] = useState("");

  const [selectedCareerStages, setSelectedCareerStages] = useState<string[]>(
    []
  );
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

  const [selectedMeetingFormats, setSelectedMeetingFormats] = useState<
    string[]
  >([]);
  const mentorMeetingFormat: MultiSelectOption[] = [
    { label: "In-person", value: "in-person" },
    { label: "Online", value: "online" },
    { label: "No preference", value: "no-preference" },
  ];

  const [singleLineText, setSingleLineText] = useState("");

  return (
    //background gradient
    <div className="overflow-hidden bg-gradient-to-br">

      {/* decorative background circles */}
      <div className="pointer-events-none absolute -left-40 top-24 h-[420px] w-[420px] rounded-full bg-yellow-600 opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-80px] h-[520px] w-[520px] rounded-full bg-blue-200 opacity-70 blur-[160px]" />
      <div className="pointer-events-none absolute left-0 top-524 h-[420px] w-[420px] rounded-full bg-yellow-600 opacity-20 blur-[120px]" />
      <div className="pointer-events-none absolute right-70 top-280 h-[420px] w-[420px] rounded-full bg-yellow-600 opacity-20 blur-[120px]" />
      <div className="pointer-events-none absolute right-20 top-450 h-[420px] w-[420px] rounded-full bg-blue-200 opacity-70 blur-[120px]" />
      <div className="pointer-events-none absolute right-50 top-650 h-[420px] w-[420px] rounded-full bg-blue-200 opacity-70 blur-[120px]" />

      <div className="pointer-events-none absolute left-0 top-824 h-[420px] w-[420px] rounded-full bg-yellow-600 opacity-20 blur-[120px]" />
      <div className="pointer-events-none absolute right-20 top-750 h-[420px] w-[420px] rounded-full bg-blue-200 opacity-70 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-924 h-[420px] w-[420px] rounded-full bg-yellow-600 opacity-20 blur-[120px]" />


      <div className="relative mx-4 flex w-full flex-col items-left justify-center sm:gap-16 sm:px-10 p-20 gap-8">
        <div className="flex flex-col items-left gap-2">
          <h1 className="text-3xl font-semibold text-secondary sm:text-4xl lg:text-5xl">
            Mentor Onboarding Application
          </h1>
          <h1 className="text-left text-xs text-secondary sm:text-sm">
            Thank you for your interest in mentoring. Give yourself 20-25
            minutes to thoughtfully complete this application. Your responses
            are used to match you with potential mentees and will be shared with
            mentees who are interested in connecting.
          </h1>
          <h1 className="text-left text-xs text-yellow-600 sm:text-sm">
            *Required Information
          </h1>
        </div>

        <div className="flex flex-col items-start space-y-2">
          <section>
            <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
              1. What is your current position in the MA National Guard?*
            </h1>

            <SingleSelectButtonGroup
              className="mt-2"
              options={[
                {
                  label: "Active Guard Reserve",
                  value: "active-guard-reserve",
                },
                { label: "Enlisted", value: "enlisted" },
                { label: "Officer", value: "officer" },
              ]}
              value={selected}
              onChange={setSelected}
            />
          </section>
          <section>
            <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
              2. What is your current rank in the MA National Guard?*
            </h1>
            <SingleSelectButtonGroup
              className="mt-2"
              options={[
                {
                  label: "Army National Guard",
                  value: "army-national-guard",
                },
                {
                  label: "Air Force National Guard",
                  value: "air-force-national-guard",
                },
              ]}
              value={selected}
              onChange={setSelected}
            />
          </section>
          <section>
            <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mb-3">
              3. Upload a resume to share your educational and career history
              with potential mentees.
            </h1>
            <Dropzone
              className="max-w-3xl mb-3"
              onDrop={(files) => {
                setFiles(files);
              }}
              src={files}
              maxFiles={5}
            >
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
          </section>
          <section>
            <span className="max-w-3xl text-left text-xs text-secondary sm:text-sm">
              4. Select your greatest personal and professional strengths.*{" "}
              <span className="text-yellow-600">(Select up to 5)</span>
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
              5. What are your personal interests*{" "}
              <span className="text-yellow-600">(Select all that apply)</span>
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
            <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mt-3 mb-3">
              6. What are you interested in becoming a mentor?*
            </h1>
            <DragReorderFrame
              options={[
                {
                  label:
                    "Support my mentee's career advancement and professional goal-setting within the National Guard (National Guard career)",
                  value: "career",
                },
                {
                  label:
                    "Help my mentee navigate educational opportunities (Education)",
                  value: "education",
                },
                {
                  label:
                    "Build a strong sense of community within the National Guard (Community)",
                  value: "community",
                },
                {
                  label:
                    "Strengthen my professional network within the National Guard (Network)",
                  value: "network",
                },
                {
                  label:
                    "Connect with Guardsmen who have different perspectives and experiences (Diversity)",
                  value: "diversity",
                },
              ]}
              onChange={() => {}}
            />
          </section>

          <section>
            <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mb-3 mt-3">
              7. What is one piece of advice that you wish you had received
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
            <span className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mb-3">
              8. Are there specific career stages that you would like to
              mentor?* {""}
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
            <span className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mb-3">
              9. What meeting formats do you prefer?*{" "}
              <span className="text-yellow-600">(Select all that apply)</span>
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
              10. How much time would you like to spend with your mentor?*
            </h1>
            <TextInput
              value={singleLineText}
              onChange={setSingleLineText}
              placeholder="Hours per Month"
              showCharCount={false}
              className="border-neutral "
              counterColor="#CDCDCD"
            />
          </section>

          <section>
            <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mb-3 mt-3">
              11. How much time can you commit per month to mentoring?*{" "}
            </h1>
            <TextInput
              value={singleLineText}
              onChange={setSingleLineText}
              placeholder="Hours per Month"
              showCharCount={false}
              className="border-neutral "
              counterColor="#CDCDCD"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
