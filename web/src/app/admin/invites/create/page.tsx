"use client";

import type { RoleKey } from "@server/data/roles";
import { useMutation } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { Info } from "lucide-react";
import { useState } from "react";
import NavigationShell from "@/components/layouts/navigation-shell";
import { TitleShell } from "@/components/layouts/title-shell";
import { useHasRole } from "@/hooks/useHasRole";
import { useTRPC } from "@/lib/trpc";
import { InviteForm, type InviteFormValues } from "../components/invite-form";
import { InviteSuccess } from "../components/invite-success";

type InviteResult = {
  codeId: number;
  code: string;
  roleKeys: RoleKey[];
  expiresAt: Date;
};

export default function AdminInvitesPage() {
  const trpc = useTRPC();
  const hasPermission = useHasRole("global:create-invite");
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<InviteResult | null>(null);

  const createInvite = useMutation(
    trpc.inviteCodes.createInviteCode.mutationOptions(),
  );

  // Redirect if user doesn't have permission
  if (!hasPermission) {
    return (
      <NavigationShell showCommsNav={false}>
        <TitleShell
          title="Access Denied"
          backHref="/admin/invites"
          backAriaLabel="Back to invite codes"
        >
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-800">
              You do not have permission to create invite codes.
            </p>
          </div>
        </TitleShell>
      </NavigationShell>
    );
  }

  const handleSubmit = async (values: InviteFormValues) => {
    setError(null);

    if (values.roleKeys.length === 0) {
      setError("At least one permission must be selected.");
      return;
    }

    try {
      const result = await createInvite.mutateAsync({
        roleKeys: values.roleKeys,
        expiresInHours: values.expiresInHours,
      });

      // Convert expiresAt string to Date object
      setSuccessResult({
        ...result,
        expiresAt: new Date(result.expiresAt),
      });
    } catch (err) {
      if (err instanceof TRPCClientError) {
        const zodMessage = err.data?.zodError?.fieldErrors?.roleKeys?.[0];
        if (zodMessage) {
          setError(zodMessage);
          return;
        }
        if (err.message.includes("permission")) {
          setError(
            "You do not have permission to create invite codes with these roles.",
          );
          return;
        }
        setError(err.message);
        return;
      }

      if (err instanceof Error) {
        setError(err.message);
        return;
      }

      setError("Failed to create invite code. Please try again.");
    }
  };

  const handleCreateAnother = () => {
    setSuccessResult(null);
    setError(null);
  };

  return (
    <NavigationShell showCommsNav={false}>
      <TitleShell
        title="Create Invite Code"
        backHref="/admin/invites"
        backAriaLabel="Back to invite codes"
      >
        <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Info Section */}
          {!successResult && (
            <div className="rounded-lg border border-primary bg-white p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-primary">
                    About Invite Codes
                  </h3>
                  <p className="mt-1 text-sm text-primary">
                    Invite codes allow you to grant specific permissions to new
                    users. Select a preset to quickly configure common
                    permission sets, then customize as needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form or Success Display */}
          {successResult ? (
            <InviteSuccess
              code={successResult.code}
              roleKeys={successResult.roleKeys}
              expiresAt={successResult.expiresAt}
              onCreateAnother={handleCreateAnother}
            />
          ) : (
            <InviteForm
              onSubmit={handleSubmit}
              submitting={createInvite.isPending}
              error={error}
            />
          )}
        </div>
      </TitleShell>
    </NavigationShell>
  );
}
