"use client";

import Link from "next/link";
import { use, useEffect, useId, useState } from "react";
import DropdownSelect from "@/components/dropdown-select";
import { icons } from "@/components/icons";
import { TextInput } from "@/components/text-input";
import { Button } from "@/components/ui/button";
import { LeaveChannelModal } from "@/components/modal/leave-channel-modal";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { ChannelShell } from "../../components/channel-shell";
import { useMutation, useQuery } from "@tanstack/react-query";

type ChannelSettingsPageProps = {
  params: Promise<{
    channel_id: string;
  }>;
};

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
  const router = useRouter();
  const ArrowLeftIcon = icons.arrowLeft;
  const ArrowRightIcon = icons.arrowRight;
  const LockIcon = icons.lock;
  const { channel_id: channelId } = use(params);
  const parsedChannelId = parseChannelId(channelId);

  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [notificationSetting, setNotificationSetting] = useState("muted");
  const [modalOpen, setModalOpen] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);

  const nameFieldId = useId();
  const descFieldId = useId();
  const notifFieldId = useId();

  const handleSelect = async () => {
    setModalOpen(true);
  };

  const handleModalClose = async () => {
    setModalOpen(false);
  };

  // Fetch all user subscriptions
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: async () => {
      return await trpcClient.comms.getUserSubscriptions.query();
    },
  });

  // Find subscription ID for this channel
  useEffect(() => {
    if (subscriptions && parsedChannelId) {
      console.log('All subscriptions:', subscriptions);

      // Find the subscription that matches this channel
      const channelSubscription = subscriptions.find(
        (sub) => sub.channelId === parsedChannelId
      );

      console.log('Found subscription for this channel:', channelSubscription);

      if (channelSubscription) {
        setSubscriptionId(channelSubscription.subscriptionId);
        console.log('Subscription ID:', channelSubscription.subscriptionId);
      } else {
        console.log('No subscription found for channel ID:', parsedChannelId);
      }
    }
  }, [subscriptions, parsedChannelId]);

  const leaveChannel = useMutation(
    trpc.comms.deleteSubscription.mutationOptions(),
  );

  const handleLeave = async () => {
    /*if (!subscriptionId) {
      console.error("No subscription ID available");
      return;
    }*/

    try {
      await leaveChannel.mutateAsync({ subscriptionId: subscriptionId! });
      router.push("/communications");
    }
    catch (error) {
      console.error("Failed to leave channel:", error);
      alert("Failed to leave channel. Please try again.");
    }
  };


  return (
    <ChannelShell
      title={
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={`/communications/${channelId}`}
            className="inline-flex h-12 w-12 items-center justify-center text-accent transition hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-14 sm:w-14"
            aria-label="Back to channel"
          >
            <ArrowLeftIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </Link>
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Settings
          </span>
        </div>
      }
    >
      <div className="flex flex-col divide-y divide-border">
        {/* Channel Name */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-8 px-4">
          <label
            htmlFor={nameFieldId}
            className="text-base font-semibold text-secondary sm:w-48 shrink-0"
          >
            Channel Name
          </label>
          <div className="w-72 relative">
            <div className="rounded-lg border-2 border-border">
              <div
                className="flex items-center gap-2 rounded-md px-4 h-10"
                style={{
                  background: 'linear-gradient(to right, var(--primary) 15%, var(--muted) 15%)'
                }}
              >
                <span className="text-xl text-accent font-semibold mr-5.5">#</span>
                <TextInput
                  id={nameFieldId}
                  value={channelName}
                  onChange={setChannelName}
                  className="flex-1 bg-transparent border-none p-0 font-semibold !text-base"
                />
                <LockIcon className="h-6 w-6 text-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Channel Description */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 py-8 px-4">
          <label
            htmlFor={descFieldId}
            className="text-base font-semibold text-secondary sm:w-48 shrink-0 sm:pt-3"
          >
            Channel Description
          </label>
          <div className="flex-1 relative">
            <div className="flex items-start gap-2 rounded-lg border-2 border-border bg-muted px-4 py-3">
              <TextInput
                id={descFieldId}
                value={channelDescription}
                onChange={setChannelDescription}
                className="bg-transparent border-none p-0 w-144 font-semibold !text-base"
                multiline
                rows={3}
              />
              <LockIcon className="h-5 w-5 text-accent mt-1" />
            </div>
          </div>
        </div>

        {/* Channel Members */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-8 px-4">
          <label
            htmlFor={"channel-members"}
            className="text-base font-semibold text-secondary sm:w-48 shrink-0"
          >
            Channel Members
          </label>
          <div className="flex-1">
            <Link
              href={`/communications/${channelId}/members`}
              className="inline-flex items-center justify-between gap-3 rounded-lg border-2 border-border bg-background px-4 h-10 hover:bg-muted transition-colors w-full sm:w-auto sm:min-w-64"
            >
              <span className="text-secondary font-semibold !text-base">
                Open Member List
              </span>
              <ArrowRightIcon className="h-5 w-5 text-accent" />
            </Link>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-8 px-4">
          <label
            htmlFor={notifFieldId}
            className="text-base font-semibold text-secondary sm:w-48 shrink-0"
          >
            Notification Settings
          </label>
          <div className="flex-1">
            <DropdownSelect
              id={notifFieldId}
              options={[
                { label: "Always Muted", value: "option1" },
                { label: "All Notifications", value: "option2" },
                { label: "Mute for 1 hour", value: "option3" },
              ]}
              value={notificationSetting}
              onChange={setNotificationSetting}
              className="w-full sm:w-auto sm:min-w-64"
            />
          </div>
        </div>
      </div>

      {/* Leave Channel Button */}
      <div className="flex justify-end px-4 py-8">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="text-neutral text-base font-semibold bg-transparent hover:border-primary"
          onClick={handleSelect}
        >
          Leave Channel
        </Button>
      </div>

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
    </ChannelShell>
  );
}
