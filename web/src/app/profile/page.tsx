"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { TitleShell } from "@/components/layouts/title-shell";
import ProfileCard, { type ProfileCardProps } from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";

type UserProfileExtras = {
  location?: string | null;
  about?: string | null;
  interests?: string[] | null;
};

export default function ProfilePage() {
  const trpcClient = useTRPCClient();
  const { data: sessionData } = authClient.useSession();
  const userId = sessionData?.user.id ?? null;

  const {
    data: userData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["current-user-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is missing");
      }
      return trpcClient.user.getUserData.query({ user_id: userId });
    },
  });

  const imageId = userData?.image ?? null;

  const { data: fileData } = useQuery({
    queryKey: ["file", imageId],
    enabled: !!imageId,
    queryFn: async () => {
      if (!imageId) {
        throw new Error("File ID is missing");
      }
      return trpcClient.files.getFile.query({ fileId: imageId });
    },
  });

  if (!userId) {
    return (
      <TitleShell
        title={
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            My Profile
          </span>
        }
      >
        <div className="space-y-4">
          <p className="text-body text-secondary/80">
            You must be signed in to view your profile.
          </p>
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </TitleShell>
    );
  }

  if (isLoading && !userData) {
    return (
      <TitleShell
        title={
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            My Profile
          </span>
        }
      >
        <p className="text-body text-secondary/80">Loading profile…</p>
      </TitleShell>
    );
  }

  if (isError || !userData) {
    return (
      <TitleShell
        title={
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            My Profile
          </span>
        }
      >
        <p className="text-body text-destructive">
          Something went wrong loading your profile.
        </p>
      </TitleShell>
    );
  }

  const profile = userData as UserProfileExtras;

  const name = userData.name ?? sessionData?.user.name ?? "Name not set";
  const email = userData.email ?? sessionData?.user.email ?? "";
  const rank = userData.rank ?? "";
  const branch = userData.branch ?? "";
  const unit = userData.department ?? "";
  const signalNumber = userData.phoneNumber ?? "";

  const location = profile.location ?? "";
  const about = profile.about ?? "";

  const interests: string[] = Array.isArray(profile.interests)
    ? (profile.interests ?? [])
    : [];

  const avatarSrc = fileData?.data;

  const renderSignalContactText = () => (
    <span className="text-sm font-medium text-secondary">
      Signal contact: {signalNumber}
    </span>
  );

  const handleSignalClick = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(signalNumber);
        toast.success("Signal number copied", {
          description: renderSignalContactText(),
        });
        return;
      } catch (_error) {}
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

  const contactActions: ProfileCardProps["contactActions"] = [];

  if (signalNumber.trim()) {
    contactActions.push({
      label: "Signal",
      ariaLabel: "Copy Signal number",
      onClick: () => {
        void handleSignalClick();
      },
    });
  }

  if (email.trim()) {
    contactActions.push({
      label: "Email",
      ariaLabel: "Send an email",
      href: `mailto:${email}`,
    });
  }

  const profileCardProps: ProfileCardProps = {
    name,
    rank,
    branch,
    unit,
    location,
    avatarSrc,
    avatarAlt: `${name} profile photo`,
    interests,
    about,
    contactActions,
    headerActions: [
      {
        label: "Edit profile",
        iconName: "edit",
        ariaLabel: "Edit profile",
        href: "/profile/edit",
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
    <TitleShell
      title={
        <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
          My Profile
        </span>
      }
    >
      <ProfileCard {...profileCardProps} className="max-w-none" />
    </TitleShell>
  );
}
