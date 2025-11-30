import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InferTRPCOutput, TRPCProcedures } from "@/lib/trpc";
import { RoleBadgesModal } from "./role-badges-modal";
import { StatusBadge } from "./status-badge";

type InviteCode = InferTRPCOutput<
  TRPCProcedures["inviteCodes"]["listInviteCodes"]
>["data"][number];

interface InviteTableProps {
  inviteCodes: InviteCode[];
  onRevoke: (inviteCode: InviteCode) => void;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = targetDate.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const diffMins = Math.floor(absDiffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const isFuture = diffMs > 0;

  // For very recent times (within a minute)
  if (diffMins < 1) return isFuture ? "in a moment" : "just now";

  // For times within an hour
  if (diffMins < 60) return isFuture ? `in ${diffMins}m` : `${diffMins}m ago`;

  // For times within a day
  if (diffHours < 24)
    return isFuture ? `in ${diffHours}h` : `${diffHours}h ago`;

  // For times within a week
  if (diffDays < 7) return isFuture ? `in ${diffDays}d` : `${diffDays}d ago`;

  return targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFullDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isActive(inviteCode: InviteCode): boolean {
  const now = new Date();
  const isExpired = new Date(inviteCode.expiresAt) < now;
  return !inviteCode.revokedAt && !inviteCode.usedBy && !isExpired;
}

export function InviteTable({ inviteCodes, onRevoke }: InviteTableProps) {
  if (inviteCodes.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-600">No invite codes found.</p>
      </div>
    );
  }

  return (
    <div className="hidden md:block rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inviteCodes.map((inviteCode) => (
            <TableRow key={inviteCode.codeId}>
              <TableCell>
                <span className="font-mono text-sm">{inviteCode.code}</span>
              </TableCell>
              <TableCell>
                <StatusBadge inviteCode={inviteCode} />
              </TableCell>
              <TableCell>
                <RoleBadgesModal
                  roleKeys={inviteCode.roleKeys}
                  maxDisplay={2}
                />
              </TableCell>
              <TableCell
                className="text-sm text-muted-foreground cursor-help"
                title={formatFullDateTime(new Date(inviteCode.createdAt))}
              >
                {formatRelativeTime(new Date(inviteCode.createdAt))}
              </TableCell>
              <TableCell
                className="text-sm text-muted-foreground cursor-help"
                title={formatFullDateTime(new Date(inviteCode.expiresAt))}
              >
                {formatRelativeTime(new Date(inviteCode.expiresAt))}
              </TableCell>
              <TableCell className="text-right">
                {isActive(inviteCode) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRevoke(inviteCode)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
