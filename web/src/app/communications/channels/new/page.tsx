"use client";

import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TitleShell } from "@/components/layouts/title-shell";
import { useTRPC } from "@/lib/trpc";
import {
  CreateChannelForm,
  type CreateChannelValues,
} from "../components/channel-form";

export default function NewChannelPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const qc = useQueryClient();

  const [error, setError] = useState<string | null>(null);

  const createChannel = useMutation(trpc.comms.createChannel.mutationOptions());
  const addSubscription = useMutation(trpc.comms.createSubscription.mutationOptions());

  const channelsQueryKey = useMemo<QueryKey>(
    () => trpc.comms.getAllChannels.queryKey(),
    [trpc],
  );

  const handleSubmit = async (values: CreateChannelValues) => {
    setError(null);

    const name = values.title.trim();
    const description = values.blurb.trim();

    if (!name) {
      setError("Title is required.");
      return;
    }

    if (values.hasUploadingPhoto) {
      setError("Please wait for the upload to finish.");
      return;
    }

    const imageMeta = values.imageFileId
      ? { imageFileId: values.imageFileId }
      : { imageSrc: "/default_channel_image.png" };

    try {
      const newChannel = await createChannel.mutateAsync({
        name,
        description,
        metadata: {
          description,
          icon: "announce",
          ...imageMeta,
        },
      });

      await qc.invalidateQueries({ queryKey: channelsQueryKey });
      router.push("/communications");

      console.log("Subscribing to new channel:", newChannel.channelId);

      await addSubscription.mutateAsync({
        channelId: newChannel.channelId,
        permission: "both",
        notificationsEnabled: true,
      });

    } catch (err) {
      if (err instanceof TRPCClientError) {
        const zodMessage =
          err.data?.zodError?.fieldErrors?.name?.[0] ??
          err.data?.zodError?.fieldErrors?.description?.[0];

        if (zodMessage) {
          setError(zodMessage);
          return;
        }

        if (err.message.includes("Not enough permission")) {
          setError("You do not have permission to create channels.");
          return;
        }

        setError(err.message);
        return;
      }

      if (err instanceof Error) {
        setError(err.message);
        return;
      }

      setError("Failed to create channel.");
    }
  };

  return (
    <TitleShell
      title="Create Channel"
      backHref="/communications"
      backAriaLabel="Back to channels"
    >
      <CreateChannelForm
        onSubmit={handleSubmit}
        submitting={createChannel.isPending}
        error={error}
      />
    </TitleShell>
  );
}
