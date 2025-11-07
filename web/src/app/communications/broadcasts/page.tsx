"use client";

import {
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { icons } from "@/components/icons";
import { BroadcastModal, Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import ChannelShell from "../components/channel-shell";
import { BroadcastCard, type BroadcastCardData } from "./components";

export default function BroadcastsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: sessionData } = authClient.useSession();
  const [selectedBlast, setSelectedBlast] = useState<BroadcastCardData | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [confirmingBlast, setConfirmingBlast] =
    useState<BroadcastCardData | null>(null);

  const { data, isLoading } = useQuery(
    trpc.messageBlasts.getActiveMessageBlastsForUser.queryOptions(),
  );
  const canManageQuery = useQuery({
    ...trpc.messageBlasts.canManageBroadcasts.queryOptions(),
    retry: false,
  });

  const broadcasts = useMemo(() => {
    if (!data) {
      return [];
    }

    const now = Date.now();

    const active = data.filter((blast) => {
      if (!blast.validUntil) {
        return true;
      }
      const expiresAt = new Date(blast.validUntil).getTime();
      return Number.isFinite(expiresAt) && expiresAt > now;
    });

    return active.sort((left, right) => {
      const leftDate = new Date(
        left.validUntil ?? left.createdAt ?? 0,
      ).getTime();
      const rightDate = new Date(
        right.validUntil ?? right.createdAt ?? 0,
      ).getTime();
      return rightDate - leftDate;
    });
  }, [data]);

  const fallbackAdmin = useMemo(() => {
    const user = sessionData?.user as
      | {
          email?: string;
          role?: string | null;
          roles?: string[] | null;
        }
      | undefined;

    if (!user) {
      return false;
    }

    if ((user.email ?? "").toLowerCase() === "admin@admin.admin") {
      return true;
    }

    if (typeof user.role === "string" && user.role.toLowerCase() === "admin") {
      return true;
    }

    if (
      Array.isArray(user.roles) &&
      user.roles.some((role) => role?.toLowerCase() === "admin")
    ) {
      return true;
    }

    return false;
  }, [sessionData]);

  const canManageBroadcasts = Boolean(canManageQuery.data || fallbackAdmin);

  const broadcastQueryKey = useMemo<QueryKey>(
    () => trpc.messageBlasts.getActiveMessageBlastsForUser.queryKey(),
    [trpc],
  );

  const deleteBlast = useMutation(
    trpc.messageBlasts.deleteMessageBlast.mutationOptions(),
  );

  const handleSelect = (blast: BroadcastCardData) => {
    setSelectedBlast(blast);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBlast(null);
  };

  const handleDeleteRequest = (blast: BroadcastCardData) => {
    if (!canManageBroadcasts) {
      return;
    }
    setConfirmingBlast(blast);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingBlast) {
      return;
    }

    if (!canManageBroadcasts) {
      return;
    }

    setDeleteError(null);
    setPendingDeleteId(confirmingBlast.blastId);

    try {
      await deleteBlast.mutateAsync({ blastId: confirmingBlast.blastId });
      await queryClient.invalidateQueries({
        queryKey: broadcastQueryKey,
      });

      if (selectedBlast?.blastId === confirmingBlast.blastId) {
        handleModalClose();
      }
      setConfirmingBlast(null);
    } catch (error) {
      if (error instanceof TRPCClientError) {
        setDeleteError(error.message);
      } else if (error instanceof Error) {
        setDeleteError(error.message);
      } else {
        setDeleteError("Failed to delete broadcast.");
      }
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmingBlast(null);
    setPendingDeleteId(null);
  };

  const ArrowLeftIcon = icons.arrowLeft;

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
            Active Broadcast
          </span>
        </div>
      }
    >
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {deleteError ? (
          <p className="mb-4 text-sm text-error">{deleteError}</p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-secondary">Loading broadcasts…</p>
        ) : broadcasts.length === 0 ? (
          <p className="text-sm text-secondary">
            There are no active broadcasts at this time.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {broadcasts.map((blast) => (
              <BroadcastCard
                key={blast.blastId}
                blast={blast}
                onSelect={handleSelect}
                onDelete={handleDeleteRequest}
                canManage={canManageBroadcasts}
                isDeleting={pendingDeleteId === blast.blastId}
              />
            ))}
          </div>
        )}
      </section>

      {selectedBlast ? (
        <BroadcastModal
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleModalClose();
            } else {
              setModalOpen(true);
            }
          }}
          title={selectedBlast.title}
          message={selectedBlast.content}
          onAcknowledge={handleModalClose}
        />
      ) : null}

      {confirmingBlast ? (
        <Modal
          open
          onOpenChange={(open) => {
            if (!open) {
              handleCancelDelete();
            }
          }}
          title="Delete broadcast?"
          footer={
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelDelete}
                disabled={pendingDeleteId !== null}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={pendingDeleteId === confirmingBlast.blastId}
                className="bg-error hover:bg-error/80 w-full sm:w-auto"
              >
                {pendingDeleteId === confirmingBlast.blastId
                  ? "Deleting…"
                  : "Delete"}
              </Button>
            </div>
          }
        >
          <p className="text-sm text-secondary">
            This will remove “{confirmingBlast.title}” for all recipients. This
            action cannot be undone.
          </p>
        </Modal>
      ) : null}
    </ChannelShell>
  );
}
