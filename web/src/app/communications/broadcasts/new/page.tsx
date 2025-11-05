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
import ChannelShell from "../../components/channel-shell";
import {
  BroadcastForm,
  type BroadcastFormValues,
  resolveAudience,
} from "../components";

export default function NewBroadcastPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const ArrowLeftIcon = icons.arrowLeft;

  const createBroadcast = useMutation(
    trpc.messageBlasts.createAndSendMessageBlast.mutationOptions(),
  );

  const broadcastQueryKey = useMemo<QueryKey>(
    () => trpc.messageBlasts.getActiveMessageBlastsForUser.queryKey(),
    [trpc],
  );

  const handleSubmit = async (values: BroadcastFormValues) => {
    setError(null);

    const trimmedTitle = values.title.trim();
    const trimmedContent = values.content.trim();

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    if (!trimmedContent) {
      setError("Message is required.");
      return;
    }

    try {
      await createBroadcast.mutateAsync({
        title: trimmedTitle,
        content: trimmedContent,
        targetAudience: resolveAudience(values.audienceKey) ?? undefined,
        validUntil: values.validUntil ?? undefined,
      });

      if (broadcastQueryKey) {
        await queryClient.invalidateQueries({
          queryKey: broadcastQueryKey,
        });
      }

      router.push("/communications/broadcasts");
    } catch (err) {
      if (err instanceof TRPCClientError) {
        const zodMessage = err.data?.zodError?.fieldErrors?.validUntil?.[0];
        if (zodMessage) {
          setError(zodMessage);
          return;
        }
        if (err.message.includes("Not enough permission")) {
          setError("You do not have permission to send broadcasts.");
          return;
        }
        setError(err.message);
        return;
      }

      if (err instanceof Error) {
        setError(err.message);
        return;
      }

      setError("Failed to send broadcast.");
    }
  };

  return (
    <ChannelShell
      title={
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/communications"
            className="inline-flex h-12 w-12 items-center justify-center text-accent transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-14 sm:w-14"
            aria-label="Back to all channels"
          >
            <ArrowLeftIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </Link>
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Create Broadcast
          </span>
        </div>
      }
    >
      <BroadcastForm
        onSubmit={handleSubmit}
        submitting={createBroadcast.isPending}
        error={error}
      />
    </ChannelShell>
  );
}
