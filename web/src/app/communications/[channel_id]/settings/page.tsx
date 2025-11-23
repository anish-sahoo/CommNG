"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useId, useState } from "react";
import DropdownSelect from "@/components/dropdown-select";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import { DeleteChannelModal } from "@/components/modal/delete-channel-modal";
import { LeaveChannelModal } from "@/components/modal/leave-channel-modal";
import { TextInput } from "@/components/text-input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";

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
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const router = useRouter();

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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [initialChannelName, setInitialChannelName] = useState<string | null>(
    null,
  );
  const [initialChannelDescription, setInitialChannelDescription] = useState<
    string | null
  >(null);
  const [initialNotificationSetting, setInitialNotificationSetting] = useState<
    string | null
  >(null);

  const nameFieldId = useId();
  const descFieldId = useId();
  const notifFieldId = useId();

  // Run when the user clicks the "Leave Channel" button
  const handleSelect = () => setModalOpen(true);

  // Run when the user clicks out of the "Leave Channel" modal
  const handleModalClose = () => setModalOpen(false);

  /* ============ GETTING INFO FROM SUBSCRIPTION ============ */

  // Fetch all user subscriptions
  const { data: subscriptions } = useQuery({
    queryKey: ["channelSubscriptions"],
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
    queryKey: ["channels"],
    queryFn: async () => {
      if (!parsedChannelId) return null;
      return await trpcClient.comms.getAllChannels.query();
    },
  });

  // Load channel data when it arrives
  useEffect(() => {
    const channel = channels?.find(
      (ch: { channelId: number }) => ch.channelId === parsedChannelId,
    );

    // Set saved values
    if (channel) {
      setChannelName(channel.name || "");

      const description =
        channel.description ||
        (typeof channel.metadata?.description === "string"
          ? channel.metadata.description
          : "");
      setChannelDescription(description);

      setIsAdmin(channel.userPermission === "admin");
      setInitialChannelName((prev) => prev ?? (channel.name || ""));
      setInitialChannelDescription((prev) => prev ?? description);
    }
  }, [channels, parsedChannelId]);

  const isDirty =
    isAdmin &&
    ((initialChannelName !== null && channelName !== initialChannelName) ||
      (initialChannelDescription !== null &&
        channelDescription !== initialChannelDescription) ||
      (initialNotificationSetting !== null &&
        notificationSetting !== initialNotificationSetting));

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
        queryKey: ["channels"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["channelSubscriptions"],
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
          },
        });

        // Invalidate the cache to ensure the most recent data is used
        await queryClient.invalidateQueries({
          queryKey: ["channels"],
        });
      }

      await trpcClient.comms.updateSubscriptionSettings.mutate({
        channelId: parsedChannelId,
        userId: userId,
        notificationsEnabled: notificationSetting === "option2",
      });

      // Invalidate the cache to ensure the most recent data is used
      await queryClient.invalidateQueries({
        queryKey: ["channelSubscriptions"],
      });

      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to save settings: ", error);
    }
  };

  /* ============ CREATING THE SETTINGS PAGE ============ */
  return (
    <TitleShell
      title="Settings"
      backHref={`/communications/${channelId}`}
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

      {/* Save Changes Button */}
      <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center px-4 pb-8 gap-3">
        {isAdmin && (
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
        )}

        {/* Leave/Delete Channel Button */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="text-sm font-medium text-primary bg-transparent hover:border-primary px-6 w-full sm:w-auto"
          onClick={handleSelect}
          aria-label={isAdmin ? "Delete channel" : "Leave channel"}
        >
          {isAdmin ? "Delete Channel" : "Leave Channel"}
        </Button>
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

      {/* Success message */}
      {showSuccessMessage && (
        <div className="text-sm font-medium text-center text-primary">
          Changes successfully saved
        </div>
      )}
    </TitleShell>
  );
}
