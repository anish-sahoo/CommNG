"use client";

import type { RoleKey } from "@server/data/roles";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { resizeImage } from "@/utils/resize";
import DropdownSelect from "@/components/dropdown-select";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import { Modal } from "@/components/modal";
import { DeleteChannelModal } from "@/components/modal/delete-channel-modal";
import { LeaveChannelModal } from "@/components/modal/leave-channel-modal";
import { TextInput } from "@/components/text-input";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { useUserRoles } from "@/hooks/useUserRoles";
import { authClient } from "@/lib/auth-client";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

type ChannelSettingsPageProps = {
  params: Promise<{
    channel_id: string;
  }>;
};

// Convert channel id into a number
function parseChannelId(channelId: string): number | null {
  const numericId = Number(channelId);
  if (Number.isNaN(numericId) || numericId <= 0) {
    return null;
  }
  return numericId;
}

export default function ChannelSettingsPage({
  params,
}: ChannelSettingsPageProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { roles } = useUserRoles();

  const ArrowRightIcon = icons.arrowRight;
  const LockIcon = icons.lock;

  const { channel_id: channelId } = use(params);
  const parsedChannelId = parseChannelId(channelId);

  const { data: sessionData } = authClient.useSession();
  const userId = sessionData?.user?.id;

  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [notificationSetting, setNotificationSetting] = useState("option2");
  const [modalOpen, setModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialChannelName, setInitialChannelName] = useState<string | null>(
    null,
  );
  const [initialChannelDescription, setInitialChannelDescription] = useState<
    string | null
  >(null);
  const [channelBannerFileId, setChannelBannerFileId] = useState<string | null>(
    null,
  );
  const [initialBannerFileId, setInitialBannerFileId] = useState<string | null>(
    null,
  );
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [initialNotificationSetting, setInitialNotificationSetting] = useState<
    string | null
  >(null);

  const nameFieldId = useId();
  const descFieldId = useId();
  const notifFieldId = useId();
  const bannerFieldId = useId();
  const backHref = `/communications/${channelId}` as const;
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Run when the user clicks the "Leave Channel" button
  const handleSelect = () => setModalOpen(true);

  // Run when the user clicks out of the "Leave Channel" modal
  const handleModalClose = () => setModalOpen(false);

  /* ============ GETTING INFO FROM SUBSCRIPTION ============ */

  // Fetch all user subscriptions
  const { data: subscriptions } = useQuery({
    queryKey: ["channelSubscriptions", userId],
    queryFn: async () => {
      return await trpcClient.comms.getUserSubscriptions.query();
    },
  });

  // Find subscription ID for this channel
  useEffect(() => {
    if (subscriptions && parsedChannelId) {
      // Find the subscription that matches this channel
      const channelSubscription = subscriptions.find(
        (sub: { channelId: number; notificationsEnabled: boolean }) =>
          sub.channelId === parsedChannelId,
      );

      // Set saved values
      if (channelSubscription) {
        setNotificationSetting(
          channelSubscription.notificationsEnabled ? "option2" : "option1",
        );
        setInitialNotificationSetting(
          (prev) =>
            prev ??
            (channelSubscription.notificationsEnabled ? "option2" : "option1"),
        );
      } else {
        console.log("No subscription found for channel ID:", parsedChannelId);
      }
    }
  }, [subscriptions, parsedChannelId]);

  /* ============ GETTING INFO FROM CHANNEL ============ */

  // Fetch all the channels this user has access to
  const { data: channels } = useQuery({
    queryKey: ["channels", userId],
    queryFn: async () => {
      if (!parsedChannelId) return null;
      return await trpcClient.comms.getAllChannels.query();
    },
  });

  const currentChannel = useMemo(
    () => channels?.find((ch) => ch.channelId === parsedChannelId),
    [channels, parsedChannelId],
  );

  // Load channel data when it arrives
  useEffect(() => {
    if (!currentChannel) {
      return;
    }

    // Set saved values
    setChannelName(currentChannel.name || "");

    const description =
      typeof currentChannel.metadata?.description === "string"
        ? currentChannel.metadata.description
        : "";
    setChannelDescription(description);
    const imageFileId =
      typeof currentChannel.metadata?.imageFileId === "string"
        ? currentChannel.metadata.imageFileId
        : null;
    setChannelBannerFileId(imageFileId);

    setInitialChannelName((prev) => prev ?? (currentChannel.name || ""));
    setInitialChannelDescription((prev) => prev ?? description);
    setInitialBannerFileId((prev) => prev ?? imageFileId);
  }, [currentChannel]);

  // Trust roles when deciding admin affordances to avoid stale channel cache
  useEffect(() => {
    if (!parsedChannelId) return;
    const hasAdminRole =
      roles?.includes(`channel:${parsedChannelId}:admin` as RoleKey) ?? false;
    const hasChannelAdmin = currentChannel?.userPermission === "admin";
    setIsAdmin(hasAdminRole || hasChannelAdmin);
  }, [parsedChannelId, roles, currentChannel]);

  // Reset admin-only affordances when switching users
  useEffect(() => {
    if (userId !== undefined) {
      setIsAdmin(false);
    }
  }, [userId]);

  const uploadBanner = async (file: File) => {
    if (!isAdmin) return;
    setBannerError(null);
    setBannerUploading(true);
    try {
      // Resize image if it's an image file
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        processedFile = await resizeImage(file, { maxSizeMB: 2, maxWidthOrHeight: 1200 });
      }

      const presign = await trpcClient.files.createPresignedUpload.mutate({
        fileName: processedFile.name,
        contentType: processedFile.type,
        fileSize: processedFile.size,
      });

      const res = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": processedFile.type || "application/octet-stream" },
        body: processedFile,
      });
      if (!res.ok) {
        throw new Error("Upload failed. Please try again.");
      }

      await trpcClient.files.confirmUpload.mutate({
        fileId: presign.fileId,
        fileName: processedFile.name,
        storedName: presign.storedName,
        contentType: processedFile.type || undefined,
      });

      setChannelBannerFileId(presign.fileId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not upload banner. Please try again.";
      setBannerError(message);
    } finally {
      setBannerUploading(false);
    }
  };

  const adminDirty =
    isAdmin &&
    ((initialChannelName !== null && channelName !== initialChannelName) ||
      (initialChannelDescription !== null &&
        channelDescription !== initialChannelDescription) ||
      initialBannerFileId !== channelBannerFileId);

  const subscriptionDirty =
    initialNotificationSetting !== null &&
    notificationSetting !== initialNotificationSetting;

  const isDirty = adminDirty || subscriptionDirty;

  /* ============ LEAVING THE CHANNEL ============ */
  const handleLeave = async () => {
    try {
      if (isAdmin) {
        // Delete the channel
        await trpcClient.comms.deleteChannel.mutate({
          channelId: parsedChannelId,
        });
      } else {
        // Leave the channel
        await trpcClient.comms.leaveChannel.mutate({
          channelId: parsedChannelId,
        });
      }

      // Invalidate cache so channel list updates
      await queryClient.invalidateQueries({
        queryKey: trpc.comms.getAllChannels.queryKey(),
      });

      await queryClient.invalidateQueries({
        queryKey: ["channelSubscriptions", userId],
      });

      // Return to the communications hub
      router.push("/communications");
    } catch (error) {
      console.error("Failed to leave channel:", error);
      alert("Failed to leave channel. Please try again.");
    }
  };

  /* ============ UPDATING SETTINGS ============ */
  const handleSaveChanges = async () => {
    if (!isDirty) return;
    try {
      if (isAdmin) {
        await trpcClient.comms.updateChannelSettings.mutate({
          channelId: parsedChannelId,
          metadata: {
            name: channelName,
            description: channelDescription,
            imageFileId: channelBannerFileId ?? undefined,
          },
        });

        // Invalidate the cache to ensure the most recent data is used
        await queryClient.invalidateQueries({
          queryKey: ["channels", userId],
        });
        setInitialChannelName(channelName);
        setInitialChannelDescription(channelDescription);
        setInitialBannerFileId(channelBannerFileId);
      }

      await trpcClient.comms.updateSubscriptionSettings.mutate({
        channelId: parsedChannelId,
        userId: userId,
        notificationsEnabled: notificationSetting === "option2",
      });
      setInitialNotificationSetting(notificationSetting);

      // Invalidate the cache to ensure the most recent data is used
      await queryClient.invalidateQueries({
        queryKey: ["channelSubscriptions", userId],
      });
      toast.success("Changes saved");
    } catch (error) {
      console.error("Failed to save settings: ", error);
      toast.error("Could not save settings. Please try again.");
    }
  };

  /* ============ CREATING THE SETTINGS PAGE ============ */
  return (
    <TitleShell
      title="Settings"
      backHref={backHref}
      onBackClick={() => {
        if (isDirty) {
          setShowUnsavedModal(true);
        } else {
          router.push(backHref);
        }
      }}
      backAriaLabel="Back to channel"
    >
      <div className="flex flex-col divide-y divide-border">
        {/* Channel Name */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-8 px-4">
          <label
            htmlFor={nameFieldId}
            className="text-sm font-medium text-secondary sm:w-48 shrink-0"
          >
            Channel Name
          </label>
          <div className="w-full sm:w-72 relative">
            <div
              className={`relative flex items-center gap-3 rounded-md border bg-background h-10 shadow-xs overflow-hidden ${
                isAdmin
                  ? "border-input"
                  : "border-input/60 bg-muted text-muted-foreground"
              }`}
            >
              <span className="pl-3 text-lg font-semibold text-accent">#</span>
              <TextInput
                id={nameFieldId}
                value={channelName}
                onChange={setChannelName}
                className="flex-1 border-0 shadow-none px-0 py-0 text-base font-medium text-secondary focus-visible:ring-0 focus-visible:border-0 disabled:cursor-not-allowed"
                disabled={!isAdmin}
              />
              {!isAdmin && (
                <span className="pr-3 flex items-center justify-center">
                  <LockIcon className="h-5 w-5 text-accent" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Channel Description */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 py-8 px-4">
          <label
            htmlFor={descFieldId}
            className="text-sm font-medium text-secondary sm:w-48 shrink-0 sm:pt-3"
          >
            Channel Description
          </label>
          <div className="flex-1 relative">
            <div
              className={`relative flex items-start gap-2 rounded-md border px-4 py-3 shadow-xs min-h-[120px] ${
                isAdmin
                  ? "border-input bg-background"
                  : "border-input/60 bg-muted text-muted-foreground"
              }`}
            >
              <TextInput
                id={descFieldId}
                value={channelDescription}
                onChange={setChannelDescription}
                className="bg-transparent border-0 shadow-none p-0 w-144 text-base font-medium text-secondary focus-visible:ring-0 focus-visible:border-0 disabled:cursor-not-allowed"
                multiline
                rows={4}
                disabled={!isAdmin}
              />
              {!isAdmin && (
                <span className="absolute bottom-3 right-3 flex items-center justify-center">
                  <LockIcon className="h-5 w-5 text-accent" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Channel Banner (admin only) */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 py-8 px-4">
            <label
              htmlFor={bannerFieldId}
              className="text-sm font-medium text-secondary sm:w-48 shrink-0 sm:pt-2"
            >
              Channel Photo{" "}
              <span className="text-secondary/60 font-normal">(optional)</span>
            </label>
            <div className="flex-1 space-y-2">
              <Dropzone
                disabled={!isAdmin || bannerUploading}
                maxFiles={1}
                className="w-full"
                onDrop={(accepted) => {
                  if (!accepted.length) return;
                  const file = accepted[0];
                  if (!file.type?.startsWith("image/")) {
                    setBannerError("Please upload an image file.");
                    return;
                  }
                  void uploadBanner(file);
                }}
              >
                <DropzoneEmptyState />
                <DropzoneContent />
              </Dropzone>
              {bannerError && (
                <p className="text-sm text-destructive">{bannerError}</p>
              )}
              <p className="text-xs text-secondary/60">
                Recommended: 1200×800, JPG or PNG.
              </p>
            </div>
          </div>
        )}

        {/* Channel Members */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-8 px-4">
          <label
            htmlFor={"channel-members"}
            className="text-sm font-medium text-secondary sm:w-48 shrink-0"
          >
            Channel Members
          </label>
          <div className="flex-1">
            <Link
              href={`/communications/${channelId}/members`}
              className="inline-flex items-center justify-between gap-3 rounded-md border border-border bg-background px-4 h-10 hover:bg-muted transition-colors w-full sm:w-auto sm:min-w-64"
              aria-label="Open channel member list"
            >
              <span className="text-secondary text-sm font-medium">
                Open Member List
              </span>
              <ArrowRightIcon className="h-4 w-4 text-accent" />
            </Link>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-8 px-4">
          <label
            htmlFor={notifFieldId}
            className="text-sm font-medium text-secondary sm:w-48 shrink-0"
          >
            Notification Settings
          </label>
          <div className="flex-1">
            <DropdownSelect
              id={notifFieldId}
              ariaLabel="Notification settings"
              options={[
                { label: "Always Muted", value: "option1" },
                { label: "All Notifications", value: "option2" },
              ]}
              value={notificationSetting}
              onChange={setNotificationSetting}
              className="w-full sm:w-auto sm:min-w-64"
              disabled={false}
            />
          </div>
        </div>
      </div>

      {/* Danger Zone + Save Changes */}
      <div className="border-t border-border px-4 py-8">
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-error">Danger Zone</p>
              <p className="text-sm text-secondary">
                {isAdmin
                  ? "Delete this channel permanently. This cannot be undone."
                  : "Leave this channel and stop receiving notifications."}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="text-sm font-semibold bg-error text-white hover:bg-error/80 focus-visible:ring-error/30 w-full sm:w-auto"
              onClick={handleSelect}
              aria-label={isAdmin ? "Delete channel" : "Leave channel"}
            >
              {isAdmin ? "Delete Channel" : "Leave Channel"}
            </Button>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center">
          <Button
            type="button"
            size="lg"
            className="text-sm font-medium px-6 w-full sm:w-auto"
            onClick={handleSaveChanges}
            disabled={!isDirty}
            aria-label="Save channel changes"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {isAdmin ? (
        <DeleteChannelModal
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleModalClose();
            } else {
              setModalOpen(true);
            }
          }}
          onLeave={async () => {
            handleLeave();
          }}
        />
      ) : (
        <LeaveChannelModal
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleModalClose();
            } else {
              setModalOpen(true);
            }
          }}
          onLeave={async () => {
            handleLeave();
          }}
        />
      )}

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
