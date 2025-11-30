"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { locationOptions } from "@/app/login/create-account/MA-towns";
import {
  airForceRanks,
  armyRanks,
} from "@/app/login/create-account/rankOptions";
import { SingleSelectButtonGroup } from "@/components/button-single-select";
import { DropdownSelect } from "@/components/dropdown-select";
import { MultiSelect, type MultiSelectOption } from "@/components/multi-select";
import TextInput from "@/components/text-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";

const InterestOptions: MultiSelectOption[] = [
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

const rankOptions = [
  {
    label: "Army National Guard",
    value: "army-national-guard",
    dropdownOptions: armyRanks,
  },
  {
    label: "Air Force National Guard",
    value: "air-force-national-guard",
    dropdownOptions: airForceRanks,
  },
];

export default function CreateAccountPage() {
  const router = useRouter();
  const trpc = useTRPCClient();
  const [email, _setEmail] = useState("");
  const [phone, _setPhone] = useState("");
  const [fullname, _setFullname] = useState("");

  const [branch, setBranch] = useState<string>("");
  const [rankSelection, setRankSelection] = useState<string>("");
  const [multiLineText, setMultiLineText] = useState<string>("");
  const [locationSelection, setLocationSelection] = useState<string>("");
  const [careerField, setCareerField] = useState<string>("");

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [dutySelection, setDutySelection] = useState<string>("");
  const [signalVisibility, setSignalVisibility] = useState<
    "private" | "public"
  >("private");
  const [emailVisibility, setEmailVisibility] = useState<"private" | "public">(
    "private",
  );

  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  const saveVisibility = async (
    nextSignal: "private" | "public",
    nextEmail: "private" | "public",
  ) => {
    try {
      setIsSavingVisibility(true);
      await trpc.user.updateUserVisibility.mutate({
        signal_visibility: nextSignal,
        email_visibility: nextEmail,
      });
      toast.success("Visibility updated.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update visibility. Please try again.");
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const handleCreateAccount = async () => {
    setIsCreateAccount(true);
    const res = await authClient.signOut();

    if (res.error) {
      const message =
        res.error.message ?? "Unable to create account right now.";
      toast.error(`${message} Please try again.`);
      setIsCreateAccount(false);
      return;
    }

    router.replace("/login");
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-left px-6 py-16 sm:gap-0 sm:px-10 lg:pr-16lg:px-16 ">
      <h1 className="text-3xl font-semibold text-secondary sm:text-4xl lg:text-3xl mb-3">
        Create Your Account
      </h1>
      <h1 className="text-left text-md font-medium text-secondary mb-1">
        Please fill out the following information to create your account.
      </h1>
      <h1 className="text-s sm:text-sm text-accent mb-6">
        *Required Information
      </h1>

      <div className="flex-1 max-w-lg space-y-6">
        <label htmlFor="login-fullname">Full Name*</label>
        <TextInput
          id="login-fullname"
          name="fullname"
          placeholder="Your full name"
          value={fullname}
          className="w-full mt-2"
        />

        <label htmlFor="login-email">
          Email address{" "}
          <span className="font-regular text-accent">(Not Required)</span>
        </label>
        <TextInput
          id="login-email"
          name="email"
          placeholder="you@example.com"
          value={email}
          className="w-full mt-2"
        />

        <label htmlFor="login-phone">Phone Number*</label>
        <TextInput
          id="login-phone"
          name="phone"
          placeholder="(123) 456-7890"
          value={phone}
          className="w-full mt-2"
        />

        <label htmlFor="login-location">Location*</label>
        <DropdownSelect
          options={locationOptions}
          value={locationSelection}
          onChange={setLocationSelection}
          className="w-full mt-2"
        />

        <label htmlFor="login-rank">What is your rank?*</label>
        <SingleSelectButtonGroup
          options={rankOptions}
          value={rankSelection}
          onChange={setRankSelection}
          onDropdownChange={(parent, child) => console.log(parent, child)}
          className="w-full mt-2"
        />

        <label htmlFor="login-branch">What is your branch?*</label>
        <TextInput
          id="login-branch"
          name="branch"
          placeholder="Your branch"
          value={branch}
          className="w-full mt-2"
          onChange={setBranch}
        />

        <label htmlFor="login-career-field">What is your career field?</label>
        <TextInput
          id="login-career-field"
          name="careerField"
          placeholder="Your career field"
          value={careerField}
          className="w-full mt-2"
          onChange={setCareerField}
        />

        <label htmlFor="login-duty-status">
          Are you active duty or part-time?*
        </label>
        <SingleSelectButtonGroup
          options={[
            { label: "Active Duty", value: "active-duty" },
            { label: "Part-time", value: "part-time" },
          ]}
          value={dutySelection}
          onChange={setDutySelection}
          onDropdownChange={(parent, child) => console.log(parent, child)}
        />

        <label htmlFor="login-biography">Short Biography*</label>
        <TextInput
          value={multiLineText}
          onChange={setMultiLineText}
          placeholder="Enter a short biography about yourself..."
          multiline={true}
          rows={5}
          maxLength={500}
          showCharCount={true}
          className="border-primary mt-2"
          counterColor="text-primary"
        />

        <label //selected here will appear selected in "interests" section of mentee/mentor forms
          htmlFor="login-interests"
        >
          Areas of Interest
        </label>
        <MultiSelect
          name="mentorInterests"
          helperText=" "
          options={InterestOptions}
          value={selectedInterests}
          onChange={setSelectedInterests}
          maxSelections={9}
        />

        <div className="flex-1 max-w-xl space-y-6">
          <div className="space-y-2">
            <p>Signal Visiblity</p>
            <Select
              value={signalVisibility}
              onValueChange={(value) => {
                const nextSignal = value as "private" | "public";
                setSignalVisibility(nextSignal);
                void saveVisibility(nextSignal, emailVisibility);
              }}
              disabled={isSavingVisibility}
            >
              <SelectTrigger
                id="signal-visibility"
                className="w-full sm:min-w-64"
              >
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Visible to only me</SelectItem>
                <SelectItem value="public">Visible to anyone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p>Email Visibility</p>
            <Select
              value={emailVisibility}
              onValueChange={(value) => {
                const nextEmail = value as "private" | "public";
                setEmailVisibility(nextEmail);
                void saveVisibility(signalVisibility, nextEmail);
              }}
              disabled={isSavingVisibility}
            >
              <SelectTrigger
                id="email-visibility"
                className="w-full sm:min-w-64"
              >
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Visible to only me</SelectItem>
                <SelectItem value="public">Visible to anyone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-xl mt-5">
        <Button
          type="button"
          className="inline-flex items-center gap-2 px-6"
          disabled={isCreateAccount}
          onClick={handleCreateAccount}
          aria-label="Create a new account"
        >
          {isCreateAccount && <Spinner />}
          Create Account
        </Button>
      </div>
    </div>
  );
}
