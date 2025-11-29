import { Ban, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { InferTRPCOutput, TRPCProcedures } from "@/lib/trpc";
import { RoleBadgesExpandable } from "./role-badges-expandable";
import { StatusBadge } from "./status-badge";

type InviteCode = InferTRPCOutput<
  TRPCProcedures["inviteCodes"]["listInviteCodes"]
>["data"][number];

interface InviteCardsProps {
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

export function InviteCards({ inviteCodes, onRevoke }: InviteCardsProps) {
  if (inviteCodes.length === 0) {
    return (
      <div className="md:hidden rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-600">No invite codes found.</p>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-4">
      {inviteCodes.map((inviteCode) => (
        <Card key={inviteCode.codeId}>
          <CardContent className="p-4 space-y-3">
            {/* Code and Status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Code</div>
                <div className="font-mono text-sm font-semibold">
                  {inviteCode.code}
                </div>
              </div>
              <StatusBadge inviteCode={inviteCode} />
            </div>

            {/* Roles */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Roles</div>
              <RoleBadgesExpandable
                roleKeys={inviteCode.roleKeys}
                maxDisplay={3}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">Created</span>
                </div>
                <div className="text-foreground">
                  {formatRelativeTime(inviteCode.createdAt)}
                </div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {formatFullDateTime(inviteCode.createdAt)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                  <Calendar className="h-3 w-3" />
                  <span className="font-medium">Expires</span>
                </div>
                <div className="text-foreground">
                  {formatRelativeTime(inviteCode.expiresAt)}
                </div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {formatFullDateTime(inviteCode.expiresAt)}
                </div>
              </div>
            </div>

            {/* Actions */}
            {isActive(inviteCode) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRevoke(inviteCode)}
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <Ban className="h-4 w-4 mr-2" />
                Revoke Code
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
