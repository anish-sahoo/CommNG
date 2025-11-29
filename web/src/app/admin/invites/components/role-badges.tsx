import type { RoleKey } from "@server/data/roles";
import {
  getDisplayName,
  getExpandedRoleKeys,
} from "@/app/admin/invites/utils/permission-helpers";
import { Badge } from "@/components/ui/badge";

interface RoleBadgesProps {
  roleKeys: RoleKey[];
  maxDisplay?: number;
}

export function RoleBadges({ roleKeys, maxDisplay = 3 }: RoleBadgesProps) {
  // Expand to show all implied permissions
  const expandedRoles = getExpandedRoleKeys(roleKeys);

  // Limit display with "and X more" for many roles
  const displayRoles = expandedRoles.slice(0, maxDisplay);
  const remainingCount = expandedRoles.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayRoles.map((role) => (
        <Badge key={role} variant="secondary" className="text-xs">
          {getDisplayName(role)}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
