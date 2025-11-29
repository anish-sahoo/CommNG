"use client";

import type { InviteCodeStatus } from "@server/types/invite-code-types";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import NavigationShell from "@/components/layouts/navigation-shell";
import { TitleShell } from "@/components/layouts/title-shell";
import { Button } from "@/components/ui/button";
import { useHasRole } from "@/hooks/useHasRole";
import { type InferTRPCOutput, type TRPCProcedures, useTRPC } from "@/lib/trpc";
import { InviteCards } from "./components/invite-cards";
import { InviteTable } from "./components/invite-table";
import { Pagination } from "./components/pagination";
import { RevokeDialog } from "./components/revoke-dialog";
import { StatusTabs } from "./components/status-tabs";

type InviteCode = InferTRPCOutput<
  TRPCProcedures["inviteCodes"]["listInviteCodes"]
>["data"][number];

const pageSize = 50;

export default function InviteCodesListPage() {
  const trpc = useTRPC();
  const hasPermission = useHasRole("global:create-invite");

  // State management
  const [selectedStatus, setSelectedStatus] = useState<
    InviteCodeStatus | "all"
  >("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedInviteCode, setSelectedInviteCode] =
    useState<InviteCode | null>(null);

  // tRPC query
  const { data, isLoading, error } = useQuery(
    trpc.inviteCodes.listInviteCodes.queryOptions({
      status: selectedStatus === "all" ? undefined : selectedStatus,
      limit: pageSize,
      offset: currentPage * pageSize,
    }),
  );

  // Handle status change
  const handleStatusChange = (status: InviteCodeStatus | "all") => {
    setSelectedStatus(status);
    setCurrentPage(0); // Reset to first page when changing filters
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle revoke
  const handleRevoke = (inviteCode: InviteCode) => {
    setSelectedInviteCode(inviteCode);
    setRevokeDialogOpen(true);
  };

  // Handle revoke success
  const handleRevokeSuccess = () => {
    setSelectedInviteCode(null);
  };

  // Check permissions
  if (!hasPermission) {
    return (
      <AuthGuard>
        <NavigationShell showCommsNav={false}>
          <TitleShell
            title="Access Denied"
            backHref="/admin"
            backAriaLabel="Back to admin"
          >
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm text-red-800">
                You do not have permission to view invite codes.
              </p>
            </div>
          </TitleShell>
        </NavigationShell>
      </AuthGuard>
    );
  }

  const inviteCodes = data?.data || [];
  const totalItems = data?.totalCount || 0;
  const hasMorePages = data?.hasMore || false;
  const hasPreviousPage = data?.hasPrevious || false;

  return (
    <AuthGuard>
      <NavigationShell showCommsNav={false}>
        <TitleShell
          title="Invite Codes"
          backHref="/admin"
          backAriaLabel="Back to admin"
        >
          <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <StatusTabs
                  value={selectedStatus}
                  onValueChange={handleStatusChange}
                />
              </div>
              <Link href="/admin/invites/create" className="shrink-0">
                <Button size="sm" className="hidden sm:flex">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Code
                </Button>
                <Button size="sm" className="sm:hidden">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invite
                </Button>
              </Link>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                <p className="text-sm text-red-800">
                  Failed to load invite codes. Please try again.
                </p>
              </div>
            )}

            {/* Data Display */}
            {!isLoading && !error && (
              <>
                {/* Desktop Table View */}
                <InviteTable
                  inviteCodes={inviteCodes}
                  onRevoke={handleRevoke}
                />

                {/* Mobile Cards View */}
                <InviteCards
                  inviteCodes={inviteCodes}
                  onRevoke={handleRevoke}
                />

                {/* Pagination */}
                {totalItems > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    hasMore={hasMorePages}
                    hasPrevious={hasPreviousPage}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </TitleShell>
      </NavigationShell>

      {/* Revoke Dialog */}
      <RevokeDialog
        inviteCode={selectedInviteCode}
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        onSuccess={handleRevokeSuccess}
      />
    </AuthGuard>
  );
}
