"use client";

import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { icons } from "@/components/icons";
import { useTRPC } from "@/lib/trpc";
import { ChannelShell } from "../../components";
import {
  CreateChannelForm,
  type CreateChannelValues,
} from "../components/channel-form";

export default function NewChannelPage() {
  const ArrowLeftIcon = icons.arrowLeft;
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
      await createChannel.mutateAsync({
        name,
        metadata: {
          description,
          icon: "announce",
          ...imageMeta,
        },
      });

      await qc.invalidateQueries({ queryKey: channelsQueryKey });
      router.push("/communications");
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

    await addSubscription.mutateAsync({
      channelId: createChannel.data?.channelId,
      permission: "both",
      notificationsEnabled: true,
    });
  };

  return (
    <ChannelShell
      title={
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/communications"
            className="inline-flex h-12 w-12 items-center justify-center text-accent transition hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-14 sm:w-14"
            aria-label="Back to channels"
          >
            <ArrowLeftIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </Link>
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Create Channel
          </span>
        </div>
      }
    >
      <CreateChannelForm
        onSubmit={handleSubmit}
        submitting={createChannel.isPending}
        error={error}
      />
    </ChannelShell>
  );
}
