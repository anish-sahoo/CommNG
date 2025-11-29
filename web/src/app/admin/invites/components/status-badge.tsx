import { Badge } from "@/components/ui/badge";
import type { InferTRPCOutput, TRPCProcedures } from "@/lib/trpc";

type InviteCode = InferTRPCOutput<
  TRPCProcedures["inviteCodes"]["listInviteCodes"]
>["data"][number];

interface StatusBadgeProps {
  inviteCode: InviteCode;
}

export function StatusBadge({ inviteCode }: StatusBadgeProps) {
  const now = new Date();
  const isExpired = new Date(inviteCode.expiresAt) < now;

  let status = "active";
  let variant: "default" | "destructive" | "secondary" | "outline" = "default";

  if (inviteCode.revokedAt) {
    status = "revoked";
    variant = "destructive";
  } else if (inviteCode.usedBy) {
    status = "used";
    variant = "secondary";
  } else if (isExpired) {
    status = "expired";
    variant = "outline";
  }

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}
