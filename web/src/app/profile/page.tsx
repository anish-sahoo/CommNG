"use client";

import { toast } from "sonner";
import ProfileCard, { type ProfileCardProps } from "@/components/profile-card";
import { authClient } from "@/lib/auth-client";
import { ChannelShell } from "../communications/components";

export default function ProfilePage() {
  const { data: sessionData } = authClient.useSession();

  const placeholderName = sessionData?.user.name ?? "Staff Sgt. Placeholder";
  const placeholderEmail = sessionData?.user.email ?? "placeholder@example.com";
  const placeholderSignalNumber = "(978) 555-0181";
  const renderSignalContactText = () => (
    <span className="text-sm font-medium text-secondary">
      Signal contact: {placeholderSignalNumber}
    </span>
  );

  const handleSignalClick = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(placeholderSignalNumber);
        toast.success("Signal number copied", {
          description: renderSignalContactText(),
        });
        return;
      } catch (error) {
        console.error("Unable to copy Signal number", error);
      }
    }

    toast.info("Signal contact unavailable", {
      description: (
        <div className="space-y-1 text-sm">
          {renderSignalContactText()}
          <p className="text-xs text-secondary/80">
            Copying is unavailable on this device.
          </p>
        </div>
      ),
    });
  };

  const profileCardProps: ProfileCardProps = {
    name: placeholderName,
    rank: "E-3 Private",
    branch: "default",
    unit: "1st Battalion, 181st Infantry Regiment",
    location: "Worcester, MA",
    interests: ["Firefighter", "Football", "Mentoring", "Frisbee Golf"],
    about:
      "I've been serving in the Massachusetts National Guard for 5 years. By day I work as a firefighter and by weekend I am a proud guard member.",
    contactActions: [
      {
        label: "Signal",
        ariaLabel: "Copy Signal number",
        onClick: () => {
          void handleSignalClick();
        },
      },
      {
        label: "Email",
        ariaLabel: "Send an email",
        href: `mailto:${placeholderEmail}`,
      },
    ],
    headerActions: [
      {
        label: "Edit profile",
        iconName: "edit",
        ariaLabel: "Edit profile",
        onClick: () => {
          toast.info("Profile editing is coming soon.");
        },
      },
      {
        label: "Profile settings",
        iconName: "settings",
        ariaLabel: "Open profile settings",
        href: "/profile/settings",
      },
    ],
  };

  return (
    <ChannelShell
      title={
        <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
          My Profile
        </span>
      }
    >
      <ProfileCard {...profileCardProps} className="max-w-none" />
    </ChannelShell>
  );
}
