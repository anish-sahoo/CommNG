"use client";

import type { RoleKey } from "@server/data/roles";
import { useState } from "react";
import {
  getDisplayName,
  getExpandedRoleKeys,
} from "@/app/admin/invites/utils/permission-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoleBadgesModalProps {
  roleKeys: RoleKey[];
  maxDisplay?: number;
}

export function RoleBadgesModal({
  roleKeys,
  maxDisplay = 2,
}: RoleBadgesModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Expand to show all implied permissions
  const expandedRoles = getExpandedRoleKeys(roleKeys);

  // Limit display with "and X more" for many roles
  const displayRoles = expandedRoles.slice(0, maxDisplay);
  const remainingCount = expandedRoles.length - maxDisplay;

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {displayRoles.map((role) => (
          <Badge key={role} variant="secondary" className="text-xs">
            {getDisplayName(role)}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge
            variant="outline"
            className="text-xs cursor-pointer hover:bg-accent"
            asChild
          >
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label={`View all ${expandedRoles.length} permissions`}
            >
              +{remainingCount} more
            </button>
          </Badge>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Assigned Roles</DialogTitle>
            <DialogDescription>
              This invite code grants the following {expandedRoles.length}{" "}
              permission{expandedRoles.length !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
            {expandedRoles.map((role) => (
              <Badge key={role} variant="secondary" className="text-sm py-1.5">
                {getDisplayName(role)}
              </Badge>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
