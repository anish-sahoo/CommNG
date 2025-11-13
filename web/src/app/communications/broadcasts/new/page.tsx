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
  BroadcastForm,
  type BroadcastFormValues,
  resolveAudience,
} from "../components";

export default function NewBroadcastPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

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
    <TitleShell
      title="Create Broadcast"
      backHref="/communications"
      backAriaLabel="Back to all channels"
    >
      <BroadcastForm
        onSubmit={handleSubmit}
        submitting={createBroadcast.isPending}
        error={error}
      />
    </TitleShell>
  );
}
