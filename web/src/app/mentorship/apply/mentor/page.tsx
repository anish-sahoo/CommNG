"use client";

import { useState } from "react";
import { SingleSelectButtonGroup } from "@/components/button-single-select";
import { SelectableButton } from "@/components/buttons";
import { DragReorderFrame } from "@/components/drag-and-drop";
import { MultiSelect, type MultiSelectOption } from "@/components/multi-select";
import { TextInput } from "@/components/text-input";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";

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

const positionOptions = [
  {
    label: "Active Guard Reserve",
    value: "active-guard-reserve",
  },
  {
    label: "Enlisted",
    value: "enlisted",
    dropdownOptions: [
      { label: "Squad Leader", value: "squad-leader" },
      { label: "Platoon Sergeant", value: "platoon-sergeant" },
      { label: "First Sergeant", value: "first-sergeant" },
      { label: "Command Sergeant Major", value: "command-sergeant-major" },
      {
        label: "Directorate Sergeant Major",
        value: "directorate-sergeant-major",
      },
      { label: "Group Command Chief", value: "group-command-chief" },
      { label: "Wing Command Chief", value: "wing-command-chief" },
      { label: "Other", value: "other" },
    ],
  },
  {
    label: "Officer",
    value: "officer",
    dropdownOptions: [
      { label: "Platoon Leader", value: "platoon-leader" },
      {
        label: "Company Executive Officer",
        value: "company-executive-officer",
      },
      { label: "Company Commander", value: "company-commander" },
      { label: "Battalion Staff", value: "battalion-staff" },
      {
        label: "Battalion Executive Officer",
        value: "battalion-executive-officer",
      },
      { label: "Brigade Staff", value: "brigade-staff" },
      {
        label: "Brigade Executive Officer",
        value: "brigade-executive-officer",
      },
      { label: "Brigade Commander", value: "brigade-commander" },
      { label: "G-Staff", value: "g-staff" },
      { label: "J-Staff", value: "j-staff" },
      { label: "Other", value: "other" },
    ],
  },
];

const rankOptions = [
  {
    label: "Army National Guard",
    value: "army-national-guard",
    dropdownOptions: [
      { label: "Private (PVT)", value: "private" },
      { label: "Private Second Class (PV2)", value: "private-second" },
      { label: "Private First Class (PFC)", value: "private-first" },
      { label: "Specialist (SPC)", value: "specialist" },
      { label: "Corporal (CPL)", value: "corporal" },
      { label: "Sergeant (SGT)", value: "sergeant" },
      { label: "Staff Sergeant (SSG)", value: "staff-sergeant" },
      { label: "Sergeant First Class (SFC)", value: "sergeant-first" },
      { label: "Master Sergeant (MSG)", value: "master-sergeant" },
      { label: "First Sergeant (1SG)", value: "first-sergeant" },
      { label: "Sergeant Major (SGM)", value: "sergeant-major" },
      {
        label: "Command Sergeant Major (CSM)",
        value: "command-sergeant-major",
      },
      { label: "Warrant Officer (WO1)", value: "warrant-officer" },
      {
        label: "Chief Warrant Officer 2 (CW2)",
        value: "chief-warrant-officer-2",
      },
      {
        label: "Chief Warrant Officer 3 (CW3)",
        value: "chief-warrant-officer-3",
      },
      {
        label: "Chief Warrant Officer 4 (CW4)",
        value: "chief-warrant-officer-4",
      },
      {
        label: "Chief Warrant Officer 5 (CW5)",
        value: "chief-warrant-officer-5",
      },
      { label: "Second Lieutenant (2LT)", value: "second-lieutenant" },
      { label: "First Lieutenant (1LT)", value: "first-lieutenant" },
      { label: "Captain (CPT)", value: "captain" },
      { label: "Major (MAJ)", value: "major" },
      { label: "Lieutenant Colonel (LTC)", value: "lieutenant-colonel" },
      { label: "Colonel (COL)", value: "colonel" },
      { label: "Brigadier General (BG)", value: "brigadier-general" },
      { label: "Major General (MG)", value: "major-general" },
      { label: "Lieutenant General (LTG)", value: "lieutenant-general" },
      { label: "General (GEN)", value: "general" },
    ],
  },
  {
    label: "Air Force National Guard",
    value: "air-force-national-guard",
    dropdownOptions: [
      { label: "Airman Basic (AB)", value: "airman-basic" },
      { label: "Airman (Amn)", value: "airman" },
      { label: "Airman First Class (A1C)", value: "airman-first" },
      { label: "Senior Airman (SrA)", value: "senior-airman" },
      { label: "Staff Sergeant (SSgt)", value: "staff-sergeant" },
      { label: "Technical Sergeant (TSgt)", value: "technical-sergeant" },
      { label: "Master Sergeant (MSgt)", value: "master-sergeant" },
      {
        label: "Senior Master Sergeant (SMSgt)",
        value: "senior-master-sergeant",
      },
      {
        label: "Chief Master Sergeant (CMSgt)",
        value: "chief-master-sergeant",
      },
      { label: "Command Chief Master Sergeant", value: "command-chief" },
      { label: "Second Lieutenant (2d Lt)", value: "second-lieutenant" },
      { label: "First Lieutenant (1st Lt)", value: "first-lieutenant" },
      { label: "Captain (Capt)", value: "captain" },
      { label: "Major (Maj)", value: "major" },
      { label: "Lieutenant Colonel (Lt Co)", value: "lieutenant-colonel" },
      { label: "Colonel (Col)", value: "colonel" },
      { label: "Brigadier General (Brig)", value: "brigadier-general" },
      { label: "Major General (Maj G)", value: "major-general" },
      { label: "Lieutenant General (Lt Ge)", value: "lieutenant-general" },
      { label: "General", value: "general" },
    ],
  },
];

export default function MentorshipApplyMentorPage() {
  const [positionSelection, setPositionSelection] = useState<string>("");
  const [mentorRankSelection, setMentorRankSelection] = useState<string>("");
  const [_rankSelection, _setRankSelection] = useState<string>("");
  const [files, setFiles] = useState<File[] | undefined>();
  const [selectedQualities, setSelectedQualities] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [multiLineText, setMultiLineText] = useState("");
  const [selectedCareerStages, setSelectedCareerStages] = useState<string[]>(
    [],
  );
  const [selectedMeetingFormats, setSelectedMeetingFormats] = useState<
    string[]
  >([]);

  const [desiredMentorHours, setDesiredMentorHours] = useState("");
  const [availableMentorHours, setAvailableMentorHours] = useState("");

  return (
    <div className="relative w-full min-h-screen">
      <div className="relative mx-4 flex w-full flex-col items-start justify-center gap-4 sm:gap-8 px-4 sm:px-10 lg:px-20 py-6">
        {" "}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-secondary sm:text-4xl lg:text-5xl break-words">
            Mentor Onboarding Application
          </h1>
          <p className="text-xs sm:text-sm text-secondary break-words">
            Thank you for your interest in mentoring. Give yourself 20-25
            minutes to thoughtfully complete this application. Your responses
            are used to match you with potential mentees and will be shared with
            mentees who are interested in connecting.
          </p>
          <p className="text-xs sm:text-sm text-accent break-words ">
            *Required Information
          </p>
        </div>
        <div className="flex flex-col items-start w-full space-y-8">
          <section>
            <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
              1. What is your current position in the MA National Guard?*
            </h1>
            <SingleSelectButtonGroup
              options={positionOptions}
              value={positionSelection}
              onChange={setPositionSelection}
              onDropdownChange={(parent, child) => console.log(parent, child)}
            />
          </section>

          <section>
            <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm">
              2. What is your current rank in the MA National Guard?*
            </h1>
            <SingleSelectButtonGroup
              options={rankOptions}
              value={mentorRankSelection}
              onChange={setMentorRankSelection}
              onDropdownChange={(parent, child) => console.log(parent, child)}
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
              5. What are your personal interests*{" "}
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
              <span className="text-accent">(Select all that apply)</span>
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
              10. How much time would you like to spend with your mentor?*
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
            <h1 className="max-w-3xl text-left text-xs font-large text-secondary sm:text-sm mb-3 mt-4">
              11. How much time can you commit per month to mentoring?*{" "}
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

          <SelectableButton
            text="Submit"
            className="mt-4 mb-4 bg-accent text-white"
          />
        </div>
      </div>
    </div>
  );
}
