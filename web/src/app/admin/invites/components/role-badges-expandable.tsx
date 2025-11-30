"use client";

import type { RoleKey } from "@server/data/roles";
import { useState } from "react";
import {
  getDisplayName,
  getExpandedRoleKeys,
} from "@/app/admin/invites/utils/permission-helpers";
import { Badge } from "@/components/ui/badge";

interface RoleBadgesExpandableProps {
  roleKeys: RoleKey[];
  maxDisplay?: number;
}

export function RoleBadgesExpandable({
  roleKeys,
  maxDisplay = 3,
}: RoleBadgesExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Expand to show all implied permissions
  const expandedRoles = getExpandedRoleKeys(roleKeys);

  // Limit display with "and X more" for many roles
  const displayRoles = isExpanded
    ? expandedRoles
    : expandedRoles.slice(0, maxDisplay);
  const remainingCount = expandedRoles.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayRoles.map((role) => (
        <Badge key={role} variant="secondary" className="text-xs">
          {getDisplayName(role)}
        </Badge>
      ))}
      {remainingCount > 0 && !isExpanded && (
        <Badge
          variant="outline"
          className="text-xs cursor-pointer hover:bg-accent"
          asChild
        >
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            aria-label={`Show all ${expandedRoles.length} permissions`}
            className="focus:outline-none"
          >
            +{remainingCount} more
          </button>
        </Badge>
      )}
      {isExpanded && expandedRoles.length > maxDisplay && (
        <Badge
          variant="outline"
          className="text-xs cursor-pointer hover:bg-accent"
          asChild
        >
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            aria-label="Collapse extra permissions"
            className="focus:outline-none"
          >
            Show less
          </button>
        </Badge>
      )}
    </div>
  );
}
