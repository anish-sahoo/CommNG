"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type InferTRPCOutput, type TRPCProcedures, useTRPC } from "@/lib/trpc";
import { RoleBadges } from "./role-badges";

type InviteCode = InferTRPCOutput<
  TRPCProcedures["inviteCodes"]["listInviteCodes"]
>["data"][number];

interface RevokeDialogProps {
  inviteCode: InviteCode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RevokeDialog({
  inviteCode,
  open,
  onOpenChange,
  onSuccess,
}: RevokeDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isRevoking, setIsRevoking] = useState(false);

  const revokeMutation = useMutation(
    trpc.inviteCodes.revokeInviteCode.mutationOptions(),
  );

  const handleRevoke = async () => {
    if (!inviteCode) return;

    setIsRevoking(true);
    try {
      await revokeMutation.mutateAsync({ codeId: inviteCode.codeId });

      // Invalidate list query to refresh
      await queryClient.invalidateQueries({
        queryKey: trpc.inviteCodes.listInviteCodes.queryKey(),
      });

      toast.success("Invite code revoked successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("already used")) {
          toast.error("Cannot revoke: This code has already been used");
        } else if (error.message.includes("already revoked")) {
          toast.error("This code has already been revoked");
        } else {
          toast.error(error.message || "Failed to revoke invite code");
        }
      } else {
        toast.error("Failed to revoke invite code");
      }
    } finally {
      setIsRevoking(false);
    }
  };

  if (!inviteCode) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Revoke Invite Code
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke this invite code? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div>
              <span className="text-sm font-medium">Code:</span>
              <p className="text-sm font-mono mt-1">{inviteCode.code}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Assigned Roles:</span>
              <div className="mt-2">
                <RoleBadges roleKeys={inviteCode.roleKeys} maxDisplay={10} />
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Expires:</span>
              <p className="text-sm mt-1">
                {new Date(inviteCode.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRevoking}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={isRevoking}
          >
            {isRevoking ? "Revoking..." : "Revoke Code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
